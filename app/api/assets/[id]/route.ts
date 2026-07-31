import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeDownloadName } from "@/lib/upload-assets";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.uploadAsset.findFirst({
    where: { id, visibility: "PUBLIC", purpose: "PRODUCT_IMAGE" },
    select: { bytes: true, contentType: true, originalName: true },
  });
  if (!asset) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const body = new Uint8Array(asset.bytes.byteLength);
  body.set(asset.bytes);
  return new Response(body.buffer, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Disposition": `inline; filename="${safeDownloadName(asset.originalName)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
