import Link from "next/link";
import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Headphones,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Wrench,
} from "lucide-react";

const SHOP_LINKS = [
  { href: "/shop", label: "All Products", icon: ShoppingBag },
  { href: "/brands", label: "Vehicle Brands", icon: Tags },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
];

const INFO_LINKS = [
  { href: "/about", label: "About Us", icon: Building2 },
  { href: "/why-choose-us", label: "Why Choose Us", icon: BadgeCheck },
  { href: "/support", label: "Technical Support", icon: Headphones },
  { href: "/contact", label: "Contact Us", icon: MessageSquareText },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-brand bg-[#111315] text-gray-300">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.85fr_1fr_1.35fr] lg:gap-12 lg:py-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
              <Image src="/logo-icon.webp" alt="Key Lanka" width={44} height={44} className="h-10 w-10 object-contain" />
            </div>
            <span className="text-lg font-extrabold text-white">
              KEY <span className="text-brand-on-dark">LANKA</span>
            </span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-gray-400">
            Your trusted partner for car keys, remotes, and locksmith tools &amp; services across Sri Lanka.
          </p>
          <div className="mt-6 h-px w-14 bg-brand" />
        </div>

        <FooterLinks title="Shop" links={SHOP_LINKS} />
        <FooterLinks title="Information" links={INFO_LINKS} />

        <div>
          <h4 className="mb-4 text-xs font-semibold uppercase text-white">Contact</h4>
          <address className="space-y-4 text-sm not-italic text-gray-400">
            <a
              href="https://www.google.com/maps/search/?api=1&query=620+High+Level+Road+Wijerama+Nugegoda"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 leading-6 transition-colors hover:text-white"
            >
              <MapPin size={17} className="mt-0.5 shrink-0 text-brand-on-dark" />
              <span>No. 620, High Level Road,<br />Wijerama, Nugegoda</span>
            </a>
            <div className="flex items-start gap-3">
              <Phone size={17} className="mt-0.5 shrink-0 text-brand-on-dark" />
              <div className="space-y-1.5">
                <PhoneLink label="Office" href="tel:+94112812789">011 2 812 789</PhoneLink>
                <PhoneLink label="Mobile" href="tel:+94765662666">076 5 662 666</PhoneLink>
                <PhoneLink label="Mobile" href="tel:+94777777678">077 7 777 678</PhoneLink>
              </div>
            </div>
            <a href="mailto:info@keylanka.lk" className="flex items-center gap-3 transition-colors hover:text-white">
              <Mail size={17} className="shrink-0 text-brand-on-dark" />
              <span>info@keylanka.lk</span>
            </a>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/15">
        <div className="container-page grid items-center gap-4 py-5 text-center text-xs text-gray-500 lg:grid-cols-[1fr_auto_1fr]">
          <span className="lg:justify-self-start">© {new Date().getFullYear()} Key Lanka. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/terms" className="transition-colors hover:text-white">Terms &amp; Conditions</Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-white">Privacy Policy</Link>
            <Link href="/refund-policy" className="transition-colors hover:text-white">No Return &amp; No Refund Policy</Link>
          </div>
          <div className="flex items-center justify-center gap-2 lg:justify-self-end">
            <span>Developed by</span>
            <a
              href="https://perfectsolutioninternational.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Developed by Perfect Solution International - opens in a new tab"
              className="inline-flex transition-opacity hover:opacity-80"
            >
              <Image
                src="https://www.perfectsolutioninternational.com/Logo.webp"
                alt="Perfect Solution International"
                width={2000}
                height={503}
                className="h-6 w-auto object-contain"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: typeof SHOP_LINKS }) {
  return (
    <div>
      <h4 className="mb-4 text-xs font-semibold uppercase text-white">{title}</h4>
      <ul className="space-y-1 text-sm">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="group flex items-center gap-2.5 rounded px-1 py-2 text-gray-400 transition-colors hover:text-white">
              <Icon size={16} className="shrink-0 text-brand-on-dark" />
              <span>{label}</span>
              <ChevronRight size={13} className="ml-auto text-gray-600 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-on-dark" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhoneLink({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="grid grid-cols-[3.5rem_1fr] gap-2 transition-colors hover:text-white">
      <span className="text-gray-600">{label}</span>
      <span>{children}</span>
    </a>
  );
}
