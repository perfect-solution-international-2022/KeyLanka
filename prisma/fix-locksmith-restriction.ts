// One-off, safe patch for existing databases whose "Locksmith Tools"
// category (and its subcategories) were created before the seed script
// marked them as restricted (see prisma/seed.ts). Only updates the
// `restricted` column by matching on category name — doesn't touch or
// delete anything else. Safe to run repeatedly.
//
// Usage:  npx tsx prisma/fix-locksmith-restriction.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RESTRICTED_TOP_LEVEL = "Locksmith Tools";

async function main() {
  const parent = await prisma.category.findFirst({ where: { name: RESTRICTED_TOP_LEVEL } });
  if (!parent) {
    console.log(`No category named "${RESTRICTED_TOP_LEVEL}" found — nothing to do.`);
    return;
  }

  const children = await prisma.category.findMany({ where: { parentId: parent.id } });
  const toFix = [parent, ...children].filter((c) => !c.restricted);

  if (toFix.length === 0) {
    console.log(`"${RESTRICTED_TOP_LEVEL}" and all ${children.length} subcategories are already restricted. Nothing to do.`);
    return;
  }

  await prisma.category.updateMany({
    where: { id: { in: toFix.map((c) => c.id) } },
    data: { restricted: true },
  });

  for (const c of toFix) console.log(`Restricted: ${c.name}`);
  console.log(`Done. ${toFix.length} of ${1 + children.length} category row(s) updated.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
