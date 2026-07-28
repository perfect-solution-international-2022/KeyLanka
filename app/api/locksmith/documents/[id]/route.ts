import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { safeDownloadName } from "@/lib/upload-assets";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(req);
  if (!auth) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const asset = await prisma.uploadAsset.findFirst({
    where: { id, visibility: "PRIVATE", purpose: "LOCKSMITH_KYC" },
  });
  if (!asset) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (auth.role !== "ADMIN" && asset.ownerId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = new Uint8Array(asset.bytes.byteLength);
  body.set(asset.bytes);
  return new Response(body.buffer, {
    headers: {
      "Content-Type": asset.contentType,
      "Content-Disposition": `attachment; filename="${safeDownloadName(asset.originalName)}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
