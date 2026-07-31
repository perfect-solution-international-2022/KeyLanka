import Link from "next/link";
import { KeyRound, Wrench, Headphones, MapPin, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Key Lanka",
  description:
    "Learn about Key Lanka, a trusted Sri Lankan supplier of automotive keys, remotes, locksmith tools and technical support for professionals and motorists.",
  path: "/about",
});

const PILLARS = [
  {
    icon: KeyRound,
    title: "Genuine Products",
    desc: "Smart keys, remotes, shells, blanks and diagnostic tools for every major vehicle brand, quality-checked before they reach you.",
  },
  {
    icon: Wrench,
    title: "Hands-On Expertise",
    desc: "Professional key programming, duplication and locksmith services backed by real technical know-how, not guesswork.",
  },
  {
    icon: Headphones,
    title: "Reliable Support",
    desc: "From locksmiths and workshops to everyday customers, our team helps you find the right key or tool the first time.",
  },
];

export default async function AboutPage() {
  const [productCount, brandCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.brand.count({ where: { deletedAt: null } }),
    prisma.category.count({ where: { deletedAt: null } }),
  ]);

  const stats = [
    { value: `${productCount}+`, label: "Products in Stock" },
    { value: `${brandCount}+`, label: "Vehicle Brands Covered" },
    { value: `${categoryCount}+`, label: "Product Categories" },
  ];

  return (
    <div>
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container-page py-14 max-w-3xl text-center mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Key Lanka</h1>
          <p className="text-gray-600 leading-relaxed text-base sm:text-lg">
            Your trusted partner for car keys, remotes, and locksmith tools &amp; services — supplying
            professional locksmiths, automotive workshops, and everyday customers across Sri Lanka.
          </p>
        </div>
      </div>

      <div className="container-page py-14">
        <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto mb-16 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-4xl font-bold text-brand">{s.value}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mb-16">
          {PILLARS.map((p) => (
            <div key={p.title} className="border border-gray-200 rounded-lg p-6">
              <div className="h-11 w-11 rounded-full bg-brand-light text-brand flex items-center justify-center mb-4">
                <p.icon size={20} />
              </div>
              <h2 className="font-semibold text-gray-900 mb-1.5">{p.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start border-t border-gray-100 pt-14">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Key Lanka started with a simple goal: make it easy to find the right car key, remote, or locksmith
              tool without the guesswork. We combine reliable stock with hands-on technical support so
              professionals and everyday customers alike get the right part the first time.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Every product we carry — from smart keys and remote fobs to diagnostic tools and key blanks — is
              chosen and checked to hold up to real workshop use, not just look good on a shelf.
            </p>
            <Link
              href="/shop"
              className="inline-block mt-6 bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md"
            >
              Shop Our Products
            </Link>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Visit or Reach Us</h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <MapPin size={17} className="text-brand shrink-0 mt-0.5" />
                <span>No 620 High Level Road, Wijerama, Nugegoda</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={17} className="text-brand shrink-0 mt-0.5" />
                <span>Land: 011 281 2789 &middot; Mobile: 077 777 7678</span>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={17} className="text-brand shrink-0 mt-0.5" />
                <span>dkranga@yahoo.com</span>
              </div>
            </div>
            <Link href="/contact" className="inline-block mt-5 text-brand font-medium text-sm hover:underline">
              Get in touch &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
