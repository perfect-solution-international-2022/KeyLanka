import { NextRequest, NextResponse } from "next/server";
import { requireCatalogManager } from "@/lib/auth-server";
import {
  createUploadAsset,
  fileMatchesContentType,
  PRODUCT_IMAGE_MAX_SIZE,
  PRODUCT_IMAGE_TYPES,
  optimizeProductImageToWebp,
  webpUploadName,
} from "@/lib/upload-assets";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { recordSecurityEvent } from "@/lib/security-audit";
import { scanUploadForMalware } from "@/lib/malware-scan";

export async function POST(req: NextRequest) {
  const auth = await requireCatalogManager(req);
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
  if (!malwareScan.safe && !malwareScan.unavailable) {
    return NextResponse.json(
      { error: "The uploaded image did not pass the security scan" },
      { status: 400 }
    );
  }
  let storedBytes: Uint8Array;
  try {
    // Always re-encode product images. This strips unneeded metadata, applies
    // lossless/high-quality compression and normalizes EXIF orientation while
    // preserving the original pixel dimensions.
    storedBytes = await optimizeProductImageToWebp(bytes, file.type);
  } catch {
    return NextResponse.json({ error: "The image could not be safely optimized" }, { status: 400 });
  }
  const asset = await createUploadAsset({
    ownerId: auth.userId,
    visibility: "PUBLIC",
    purpose: "PRODUCT_IMAGE",
    originalName: webpUploadName(file.name),
    contentType: "image/webp",
    bytes: storedBytes,
  });
  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: "ADMIN_PRODUCT_IMAGE_UPLOADED",
    targetType: "UPLOAD_ASSET",
    targetId: asset.id,
    metadata: {
      optimized: true,
      originalBytes: bytes.byteLength,
      storedBytes: storedBytes.byteLength,
      outputType: "image/webp",
      ...(malwareScan.unavailable ? { malwareScannerUnavailable: true, sanitizedFallback: true } : {}),
    },
  });

  return NextResponse.json(
    {
      url: `/api/assets/${asset.id}`,
      optimized: true,
      originalBytes: bytes.byteLength,
      storedBytes: storedBytes.byteLength,
      contentType: "image/webp",
    },
    { status: 201 },
  );
}
