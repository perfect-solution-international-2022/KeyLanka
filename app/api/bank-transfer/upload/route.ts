import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { createUploadAsset, documentHasActivePdfContent, fileMatchesContentType, KYC_DOCUMENT_MAX_SIZE, KYC_DOCUMENT_TYPES } from "@/lib/upload-assets";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { scanUploadForMalware } from "@/lib/malware-scan";

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locksmithStatus: true } });
  if (user?.locksmithStatus !== "approved") return NextResponse.json({ error: "Bank transfer is only available to approved locksmith members" }, { status: 403 });
  const limit = await checkRateLimit(req, "bank-transfer-slip-upload", { limit: 10, windowMs: 60 * 60 * 1000 });
  if (limit.limited) return rateLimitResponse(limit.retryAfter);
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Select a payment slip" }, { status: 400 });
  if (!KYC_DOCUMENT_TYPES.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP or PDF file" }, { status: 400 });
  if (file.size > KYC_DOCUMENT_MAX_SIZE) return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileMatchesContentType(bytes, file.type) || documentHasActivePdfContent(bytes, file.type)) {
    return NextResponse.json({ error: "The selected file is not a valid payment slip" }, { status: 400 });
  }
  const scan = await scanUploadForMalware(bytes);
  if (!scan.safe) return NextResponse.json({ error: scan.unavailable ? "Document scanning is temporarily unavailable" : "The file did not pass the security scan" }, { status: scan.unavailable ? 503 : 400 });
  const asset = await createUploadAsset({ ownerId: userId, visibility: "PRIVATE", purpose: "BANK_TRANSFER_SLIP", originalName: file.name, contentType: file.type, bytes });
  return NextResponse.json({ assetId: asset.id, name: asset.originalName }, { status: 201 });
}
