import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import {
  createUploadAsset,
  documentHasActivePdfContent,
  fileMatchesContentType,
  KYC_DOCUMENT_MAX_SIZE,
  KYC_DOCUMENT_TYPES,
  privateDocumentUrl,
} from "@/lib/upload-assets";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";
import { scanUploadForMalware } from "@/lib/malware-scan";

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const rateLimit = await checkRateLimit(req, "locksmith-document-upload", { limit: 20, windowMs: 60 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!KYC_DOCUMENT_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG or PDF." }, { status: 400 });
  }
  if (file.size > KYC_DOCUMENT_MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 8MB)" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileMatchesContentType(bytes, file.type)) {
    return NextResponse.json({ error: "The file contents do not match its declared type" }, { status: 400 });
  }
  if (documentHasActivePdfContent(bytes, file.type)) {
    return NextResponse.json({ error: "PDFs with active or embedded content are not accepted" }, { status: 400 });
  }
  const malwareScan = await scanUploadForMalware(bytes);
  if (!malwareScan.safe) {
    return NextResponse.json(
      {
        error: malwareScan.unavailable
          ? "Document scanning is temporarily unavailable"
          : "The uploaded document did not pass the security scan",
      },
      { status: malwareScan.unavailable ? 503 : 400 }
    );
  }
  const asset = await createUploadAsset({
    ownerId: userId,
    visibility: "PRIVATE",
    purpose: "LOCKSMITH_KYC",
    originalName: file.name,
    contentType: file.type,
    bytes,
  });
  await recordSecurityEvent({
    req,
    actorUserId: userId,
    action: "KYC_DOCUMENT_UPLOADED",
    targetType: "UPLOAD_ASSET",
    targetId: asset.id,
  });

  return NextResponse.json({ url: privateDocumentUrl(asset), name: asset.originalName }, { status: 201 });
}
