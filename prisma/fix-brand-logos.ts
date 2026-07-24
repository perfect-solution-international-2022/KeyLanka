// One-off, safe patch for existing databases whose Brand rows were created
// before the seed script set a logo path (see prisma/seed.ts). Only updates
// the `logo` column by matching on brand name — doesn't touch or delete
// anything else. Safe to run repeatedly.
//
// Usage:  npx tsx prisma/fix-brand-logos.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const BRAND_LOGO_OVERRIDES: Record<string, string> = { Peugeot: "peugeot.png" };

async function main() {
  const brands = await prisma.brand.findMany();
  let updated = 0;

  for (const brand of brands) {
    const logoFile = BRAND_LOGO_OVERRIDES[brand.name] ?? `${slugify(brand.name)}.svg`;
    const expectedLogo = `/brands/${logoFile}`;
    if (brand.logo === expectedLogo) continue;

    await prisma.brand.update({ where: { id: brand.id }, data: { logo: expectedLogo } });
    console.log(`Updated ${brand.name}: ${brand.logo ?? "(none)"} -> ${expectedLogo}`);
    updated++;
  }

  console.log(`Done. ${updated} of ${brands.length} brand(s) updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
