import { prisma } from "@/lib/prisma";

export const PRODUCT_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
export const KYC_DOCUMENT_TYPES = new Set([...PRODUCT_IMAGE_TYPES, "application/pdf"]);

export const PRODUCT_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const KYC_DOCUMENT_MAX_SIZE = 8 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function fileMatchesContentType(bytes: Uint8Array, contentType: string) {
  if (contentType === "image/jpeg") return startsWith(bytes, [0xff, 0xd8, 0xff]);
  if (contentType === "image/png") return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (contentType === "image/gif") {
    return startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
      startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  }
  if (contentType === "image/webp") {
    return startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  if (contentType === "application/pdf") return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
  return false;
}

export function documentHasActivePdfContent(bytes: Uint8Array, contentType: string) {
  if (contentType !== "application/pdf") return false;
  const text = Buffer.from(bytes).toString("latin1");
  return /\/(?:JavaScript|JS|Launch|EmbeddedFile|OpenAction|AA)\b/i.test(text);
}

export function safeDownloadName(name: string) {
  return name.replace(/[\r\n"\\/]/g, "_").slice(0, 180) || "document";
}

export async function createUploadAsset(input: {
  ownerId: number;
  visibility: "PUBLIC" | "PRIVATE";
  purpose: "PRODUCT_IMAGE" | "LOCKSMITH_KYC";
  originalName: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  return prisma.uploadAsset.create({
    data: {
      ownerId: input.ownerId,
      visibility: input.visibility,
      purpose: input.purpose,
      originalName: safeDownloadName(input.originalName),
      contentType: input.contentType,
      bytes: Buffer.from(input.bytes),
    },
    select: { id: true, originalName: true, contentType: true },
  });
}

export function privateDocumentUrl(asset: { id: string; originalName: string; contentType: string }) {
  const params = new URLSearchParams({
    name: asset.originalName,
    type: asset.contentType === "application/pdf" ? "pdf" : "image",
  });
  return `/api/locksmith/documents/${asset.id}?${params.toString()}`;
}
