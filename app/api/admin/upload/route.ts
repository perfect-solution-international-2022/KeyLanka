import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import {
  createUploadAsset,
  fileMatchesContentType,
  PRODUCT_IMAGE_MAX_SIZE,
  PRODUCT_IMAGE_TYPES,
} from "@/lib/upload-assets";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";
import { scanUploadForMalware } from "@/lib/malware-scan";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rateLimit = await checkRateLimit(req, "admin-image-upload", { limit: 60, windowMs: 10 * 60 * 1000 });
  if (rateLimit.limited) return rateLimitResponse(rateLimit.retryAfter);

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!PRODUCT_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WebP or GIF image" }, { status: 400 });
  }
  if (file.size > PRODUCT_IMAGE_MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!fileMatchesContentType(bytes, file.type)) {
    return NextResponse.json({ error: "The file contents do not match its image type" }, { status: 400 });
  }
  const malwareScan = await scanUploadForMalware(bytes);
  if (!malwareScan.safe) {
    return NextResponse.json(
      {
        error: malwareScan.unavailable
          ? "Image scanning is temporarily unavailable"
          : "The uploaded image did not pass the security scan",
      },
      { status: malwareScan.unavailable ? 503 : 400 }
    );
  }
  const asset = await createUploadAsset({
    ownerId: auth.userId,
    visibility: "PUBLIC",
    purpose: "PRODUCT_IMAGE",
    originalName: file.name,
    contentType: file.type,
    bytes,
  });
  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_PRODUCT_IMAGE_UPLOADED",
    targetType: "UPLOAD_ASSET",
    targetId: asset.id,
  });

  return NextResponse.json({ url: `/api/assets/${asset.id}` }, { status: 201 });
}
