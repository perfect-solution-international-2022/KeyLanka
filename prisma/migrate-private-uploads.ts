import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { fileMatchesContentType, privateDocumentUrl } from "../lib/upload-assets";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
};

async function migrateUrl(url: string, ownerId: number) {
  if (url.startsWith("/api/locksmith/documents/")) return url;
  if (!url.startsWith("/uploads/")) throw new Error(`Unsupported legacy document URL: ${url}`);

  const originalName = path.basename(url);
  const contentType = MIME_BY_EXTENSION[path.extname(originalName).toLowerCase()];
  if (!contentType) throw new Error(`Unsupported legacy document type: ${originalName}`);

  const filePath = path.join(process.cwd(), "public", "uploads", originalName);
  const bytes = new Uint8Array(await readFile(filePath));
  if (!fileMatchesContentType(bytes, contentType)) {
    throw new Error(`Legacy file contents do not match ${contentType}: ${originalName}`);
  }

  const asset = await prisma.uploadAsset.create({
    data: {
      ownerId,
      visibility: "PRIVATE",
      purpose: "LOCKSMITH_KYC",
      originalName,
      contentType,
      bytes: Buffer.from(bytes),
    },
    select: { id: true, originalName: true, contentType: true },
  });
  return privateDocumentUrl(asset);
}

async function main() {
  const applications = await prisma.locksmithApplication.findMany();
  const migratedFiles = new Set<string>();

  for (const application of applications) {
    const businessRegDocs = application.businessRegDocs as string[];
    const allLegacyUrls = [
      ...businessRegDocs,
      application.nationalIdFront,
      application.nationalIdBack,
      application.utilityBillDoc,
    ].filter((url) => url.startsWith("/uploads/"));

    const migratedBusinessDocs = await Promise.all(
      businessRegDocs.map((url) => migrateUrl(url, application.userId))
    );
    const nationalIdFront = await migrateUrl(application.nationalIdFront, application.userId);
    const nationalIdBack = await migrateUrl(application.nationalIdBack, application.userId);
    const utilityBillDoc = await migrateUrl(application.utilityBillDoc, application.userId);

    await prisma.locksmithApplication.update({
      where: { id: application.id },
      data: {
        businessRegDocs: migratedBusinessDocs,
        nationalIdFront,
        nationalIdBack,
        utilityBillDoc,
      },
    });
    allLegacyUrls.forEach((url) => migratedFiles.add(path.basename(url)));
  }

  console.log(JSON.stringify({ applications: applications.length, migratedFiles: [...migratedFiles] }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
