import Link from "next/link";
import { getCategories, getBrands, getFeaturedProducts } from "@/lib/queries";
import CategoryTile from "@/components/CategoryTile";
import BrandStrip from "@/components/BrandStrip";
import ProductCard from "@/components/ProductCard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Car Keys, Remotes & Locksmith Tools in Sri Lanka",
  description:
    "Shop automotive keys, remotes, shells, transponders and locksmith tools from Key Lanka, with islandwide delivery and expert product support.",
  path: "/",
});

export const revalidate = 300;

function ShippingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="1.5" y="7" width="13" height="9" rx="1" />
      <path d="M14.5 10h4l4 3.5V16h-8z" />
      <circle cx="6" cy="18.5" r="1.8" />
      <circle cx="17.5" cy="18.5" r="1.8" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function QualityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2 14.8 8.2 21.5 9l-5 4.9L17.8 21 12 17.5 6.2 21l1.3-7.1-5-4.9 6.7-.8z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2" y="13" width="5" height="6" rx="1.5" />
      <rect x="17" y="13" width="5" height="6" rx="1.5" />
      <path d="M20 19v1a3 3 0 0 1-3 3h-3" />
    </svg>
  );
}

function ReturnsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 9a9 9 0 1 1 2.2 8.5" />
      <path d="M3 3v6h6" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="8" r="4.5" />
      <path d="m11.3 11.3 9.2 9.2M16 16l2.5-2.5M19 19l2.5-2.5" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="12" height="13" rx="1.5" />
      <path d="M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

function RemoteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="2" width="10" height="20" rx="3" />
      <circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <path d="M9.5 12h5M9.5 15h5" />
    </svg>
  );
}

function LockoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      <path d="M12 15.5v2" />
    </svg>
  );
}

const TRUST_BADGES = [
  { title: "Island Wide Shipping", desc: "Fast & reliable delivery", Icon: ShippingIcon },
  { title: "Secure Payment", desc: "100% secure checkout", Icon: PaymentIcon },
  { title: "High Quality", desc: "Tested & trusted products", Icon: QualityIcon },
  { title: "Expert Support", desc: "24/7 customer support", Icon: SupportIcon },
  { title: "Compatibility Help", desc: "Confirm before ordering", Icon: ReturnsIcon },
];

const SERVICE_ICONS = [
  { label: "All Keys Lost Solution", href: "/services/all-keys-lost-solution", Icon: KeyIcon },
  { label: "Spare Key Duplication", href: "/services/spare-key-duplication", Icon: DuplicateIcon },
  { label: "Remote Programming", href: "/services/remote-programming", Icon: RemoteIcon },
  { label: "Emergency Lockout Service", href: "/services/emergency-lockout-service", Icon: LockoutIcon },
];

export default async function HomePage() {
  const [categories, brands, featuredProducts] = await Promise.all([
    getCategories().catch(() => []),
    getBrands().catch(() => []),
    getFeaturedProducts(8, { locksmithAuthorized: false }).catch(() => []),
  ]);

  return (
    <div>
      <section className="bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="container-page py-6 md:py-8 grid md:grid-cols-2 gap-6 items-center">
          <div className="relative z-10">
            <p className="text-brand font-semibold mb-2 text-[23px]">Your Trusted Partner for</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
              Car Keys &amp; <br />
              <span className="text-brand">Locksmith</span> Solutions
            </h1>
            <p className="mt-5 text-gray-600 max-w-md text-lg">
              High quality products, expert tools &amp; reliable services for automotive professionals.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/shop" className="bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
                Shop Now
              </Link>
              <Link href="/services" className="border border-gray-300 hover:border-brand hover:text-brand font-medium px-6 py-3 rounded-md">
                Our Services
              </Link>
            </div>
          </div>
          <div className="relative aspect-[1416/767] w-full md:w-[115%] xl:w-[128%] md:justify-self-end md:-mr-6 xl:-mr-12">
            <picture>
              <source media="(max-width: 767px)" srcSet="/hero-mobile.webp" />
              <img
                src="/hero-desktop.webp"
                alt="BMW car with smart key"
                width="1280"
                height="693"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </picture>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white">
        <div className="container-page py-6 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          {TRUST_BADGES.map((b) => (
            <div key={b.title} className="flex flex-col items-center gap-2">
              <div className="h-11 w-11 rounded-full bg-brand-light text-brand flex items-center justify-center">
                <b.Icon />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{b.title}</div>
                <div className="text-xs text-gray-500">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-12">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
          <Link href="/shop" className="text-brand text-sm font-medium hover:underline">
            View All Categories →
          </Link>
        </div>
        <p className="text-gray-500 text-sm mb-6">Explore our wide range of products</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <CategoryTile
              key={cat.id}
              name={cat.name}
              slug={cat.slug}
              image={cat.image}
              locked={cat.restricted}
            />
          ))}
          <CategoryTile name="Vehicle Brands" slug="vehicle-brands" href="/brands" image="/vehicle-brands.jpeg" />
          <CategoryTile name="Services" slug="services" href="/services" image="/services.jpeg" />
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="defer-render container-page py-12 border-t border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/shop" className="text-brand text-sm font-medium hover:underline">
              View All Products →
            </Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">Hand-picked products worth a closer look</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <section className="defer-render bg-gray-50 py-12">
        <div className="container-page">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-900">Popular Brands</h2>
            <Link href="/brands" className="text-brand text-sm font-medium hover:underline">
              View All Brands →
            </Link>
          </div>
          <p className="text-gray-500 text-sm mb-6">Trusted keys for every vehicle</p>
          <BrandStrip brands={brands} />
        </div>
      </section>

      <section className="defer-render container-page py-12">
        <div className="bg-gray-900 rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div>
            <h3 className="text-white text-xl font-bold">Need a Car Key Solution?</h3>
            <p className="text-gray-400 text-sm mt-1 max-w-md">
              We provide professional car key programming, duplication &amp; locksmith services island wide.
            </p>
            <Link href="/services" className="inline-block mt-4 bg-brand hover:bg-brand-dark text-white text-sm font-medium px-5 py-2.5 rounded-md">
              Get Help Now
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {SERVICE_ICONS.map((s) => (
              <Link key={s.href} href={s.href} className="text-center text-gray-300 hover:text-white text-xs w-24">
                <div className="h-10 w-10 mx-auto mb-2 rounded-full bg-gray-800 flex items-center justify-center text-brand">
                  <s.Icon />
                </div>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
