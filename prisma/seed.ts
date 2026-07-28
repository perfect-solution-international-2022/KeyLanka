import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CATEGORY_TREE: { name: string; subs: string[]; image: string; restricted?: boolean }[] = [
  {
    name: "Locksmith Tools",
    subs: ["Key Programming Tools", "Key Cutting Machines", "Diagnostic Tools", "Accessories", "Transponders & Chips"],
    image: "/categories/locksmith-tools.jpeg",
    // Locksmith tools/programmers are only sold to approved Locksmith
    // Merchants — see lib/locksmith.ts and the category page guard.
    restricted: true,
  },
  {
    name: "Car Keys",
    subs: ["Smart Keys", "Remote Keys", "Flip Keys", "Proximity Keys", "Emergency Keys", "Universal Keys", "OEM Replacement Keys"],
    image: "/categories/car-keys.jpeg",
  },
  {
    name: "Key Shells",
    subs: ["Smart Key Shells", "Remote Key Shells", "Motorcycle Key Shells", "Key Blade Replacement"],
    image: "/categories/key-shells.jpeg",
  },
  {
    name: "Key Covers",
    subs: ["Silicone Key Covers", "TPU Key Covers", "Leather Key Covers", "Key Cases & Holders"],
    image: "/categories/key-covers.jpeg",
  },
  {
    name: "Remotes",
    subs: ["Universal Remotes", "Garage Remotes", "KD Remotes", "VVDI Remotes"],
    image: "/categories/remotes.jpeg",
  },
  {
    name: "Key Blanks",
    subs: ["Car Key Blanks", "Motorcycle Key Blanks", "Laser Key Blanks", "Standard Key Blanks"],
    image: "/categories/key-blanks.jpeg",
  },
  {
    name: "Lock & Ignition Parts",
    subs: ["Door Locks", "Ignition Locks", "Boot Locks", "Lock Repair Kits"],
    image: "/categories/lock-and-ignition-parts.jpeg",
  },
  {
    name: "Accessories",
    subs: ["Batteries", "Buttons", "Remote PCB", "Key Rings"],
    image: "/categories/accessories.jpeg",
  },
];

const BRANDS = [
  "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Suzuki", "Isuzu", "Kia",
  "Hyundai", "Ford", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Volvo",
  "Land Rover", "Jaguar", "Lexus", "Subaru", "Peugeot", "Renault", "Chevrolet",
  "Jeep", "BYD", "Chery", "Geely", "MG",
];

// Categories where products naturally pair with a vehicle brand.
const BRAND_LINKED_CATEGORIES = new Set([
  "Smart Keys", "Remote Keys", "Flip Keys", "Proximity Keys", "Emergency Keys", "OEM Replacement Keys",
  "Smart Key Shells", "Remote Key Shells", "Key Blade Replacement",
  "Silicone Key Covers", "TPU Key Covers", "Leather Key Covers",
  "Car Key Blanks", "Laser Key Blanks",
]);

const SERVICES = [
  { title: "Car Key Programming", description: "Professional on-site and in-store programming for transponder and smart car keys across all major vehicle brands." },
  { title: "All Keys Lost Solution", description: "Complete key replacement and ECU/IMMO recovery when every key to your vehicle has been lost." },
  { title: "Spare Key Duplication", description: "Fast, accurate duplication of spare mechanical and remote/smart keys so you're never locked out again." },
  { title: "Remote Programming", description: "Programming and syncing of remote fobs, garage remotes, and aftermarket universal remotes." },
  { title: "Smart Key Programming", description: "Proximity and push-to-start smart key programming using the latest diagnostic and programming tools." },
  { title: "ECU & IMMO Services", description: "Immobilizer bypass, ECU cloning, and related diagnostic services for locked-out or faulty vehicle systems." },
  { title: "Emergency Lockout Service", description: "24/7 emergency lockout assistance to get you back into your vehicle quickly and safely." },
];

// LKR ranges, rounded to a step so prices land on numbers like 1500, 2500, 3000.
function priceRangeFor(categoryName: string): [number, number, number] {
  switch (categoryName) {
    case "Locksmith Tools":
      return [8000, 45000, 500];
    case "Car Keys":
      return [3000, 18000, 500];
    case "Key Shells":
      return [800, 3000, 100];
    case "Key Covers":
      return [500, 2000, 100];
    case "Remotes":
      return [2000, 7000, 500];
    case "Key Blanks":
      return [300, 1500, 100];
    case "Lock & Ignition Parts":
      return [2500, 10000, 500];
    case "Accessories":
      return [200, 3000, 100];
    default:
      return [1000, 5000, 500];
  }
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randRoundedPrice(min: number, max: number, step: number) {
  const steps = Math.floor((max - min) / step);
  return min + step * randInt(0, steps);
}

function randFloat(min: number, max: number, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

async function main() {
  console.log("Clearing existing catalog data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.service.deleteMany();

  console.log("Seeding categories...");
  const categoryIdMap = new Map<string, number>();

  for (const top of CATEGORY_TREE) {
    const parent = await prisma.category.create({
      data: { name: top.name, slug: slugify(top.name), image: top.image, restricted: top.restricted ?? false },
    });
    categoryIdMap.set(top.name, parent.id);

    for (const sub of top.subs) {
      const child = await prisma.category.create({
        data: { name: sub, slug: slugify(`${top.name}-${sub}`), parentId: parent.id, restricted: top.restricted ?? false },
      });
      categoryIdMap.set(sub, child.id);
    }
  }

  console.log("Seeding brands...");
  const BRAND_LOGO_OVERRIDES: Record<string, string> = { Peugeot: "peugeot.png" };
  const brandIdMap = new Map<string, number>();
  for (const b of BRANDS) {
    const slug = slugify(b);
    const logoFile = BRAND_LOGO_OVERRIDES[b] ?? `${slug}.svg`;
    const brand = await prisma.brand.create({
      data: { name: b, slug, logo: `/brands/${logoFile}` },
    });
    brandIdMap.set(b, brand.id);
  }

  console.log("Seeding services...");
  for (const s of SERVICES) {
    await prisma.service.create({
      data: { title: s.title, slug: slugify(s.title), description: s.description },
    });
  }

  console.log("Seeding products...");
  let skuCounter = 1000;
  const productTypeMap: Record<string, string> = {
    "Smart Keys": "Smart Keys",
    "Smart Key Shells": "Smart Keys",
    "Remote Keys": "Remote Keys",
    "Remote Key Shells": "Remote Keys",
    "Flip Keys": "Remote Keys",
    "Key Blade Replacement": "Key Shells",
    "Silicone Key Covers": "Key Shells",
    "TPU Key Covers": "Key Shells",
    "Leather Key Covers": "Key Shells",
    "Car Key Blanks": "Key Blanks",
    "Laser Key Blanks": "Key Blanks",
    "Key Programming Tools": "Transponders",
  };

  let totalProducts = 0;

  for (const top of CATEGORY_TREE) {
    const [lo, hi, step] = priceRangeFor(top.name);
    for (const sub of top.subs) {
      const categoryId = categoryIdMap.get(sub)!;
      const isBrandLinked = BRAND_LINKED_CATEGORIES.has(sub);
      const count = randInt(2, 4);

      for (let i = 0; i < count; i++) {
        const brandName = isBrandLinked ? pick(BRANDS) : null;
        const price = randRoundedPrice(lo, hi, step);
        const hasDiscount = Math.random() < 0.25;
        const badgeRoll = Math.random();
        const badge = badgeRoll < 0.15 ? "HOT" : badgeRoll < 0.3 ? "NEW" : null;

        const name = brandName
          ? `${brandName} ${sub.replace(/s$/, "")}`
          : `${sub.replace(/s$/, "")} - ${pick(["Standard", "Pro", "Universal", "Premium"])}`;

        skuCounter += 1;
        totalProducts += 1;

        await prisma.product.create({
          data: {
            name,
            slug: slugify(`${name}-${skuCounter}`),
            sku: `KL-${skuCounter}`,
            price,
            compareAtPrice: hasDiscount ? Math.round((price * 1.2) / step) * step : null,
            stock: randInt(0, 150),
            rating: randFloat(3.5, 5, 1),
            reviewCount: randInt(3, 130),
            badge,
            description: `${name} — high quality ${sub.toLowerCase()} suitable for professional locksmith and automotive use. Reliable, tested, and backed by Key Lanka support.`,
            images: [`/products/placeholder-${randInt(1, 6)}.svg`],
            attributes: { category: sub, brand: brandName ?? undefined },
            productType: productTypeMap[sub] ?? null,
            categoryId,
            brandId: brandName ? brandIdMap.get(brandName) : null,
          },
        });
      }
    }
  }

  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (adminEmail && adminPassword) {
    if (
      adminPassword.length < 10 ||
      !/[a-z]/.test(adminPassword) ||
      !/[A-Z]/.test(adminPassword) ||
      !/[0-9]/.test(adminPassword)
    ) {
      throw new Error("ADMIN_SEED_PASSWORD must be 10+ characters with upper/lowercase letters and a number");
    }
    console.log("Seeding configured admin account...");
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        mustResetPassword: false,
        sessionVersion: { increment: 1 },
      },
      create: {
        name: process.env.ADMIN_SEED_NAME?.trim() || "Key Lanka Admin",
        email: adminEmail,
        passwordHash: adminPasswordHash,
        role: "ADMIN",
      },
    });
  } else {
    console.log("Admin seed skipped. Set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to create or rotate it.");
  }

  console.log(`Seed complete. Categories: ${categoryIdMap.size}, Brands: ${brandIdMap.size}, Products: ${totalProducts}, Services: ${SERVICES.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
