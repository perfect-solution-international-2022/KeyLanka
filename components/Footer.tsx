import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 mt-16">
      <div className="container-page py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image src="/logo-icon.webp" alt="Key Lanka" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-extrabold text-white text-lg">
              KEY <span className="text-brand-on-dark">LANKA</span>
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your trusted partner for car keys, remotes, and locksmith tools &amp; services across Sri Lanka.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shop" className="hover:text-brand">All Products</Link></li>
            <li><Link href="/brands" className="hover:text-brand">Vehicle Brands</Link></li>
            <li><Link href="/services" className="hover:text-brand">Services</Link></li>
            <li><Link href="/cart" className="hover:text-brand">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-3">Information</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-brand">About Us</Link></li>
            <li><Link href="/why-choose-us" className="hover:text-brand">Why Choose Us</Link></li>
            <li><Link href="/support" className="hover:text-brand">Technical Support</Link></li>
            <li><Link href="/contact" className="hover:text-brand">Contact Us</Link></li>
          </ul>
        </div>

        <div className="md:col-span-1">
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <address className="space-y-3 text-sm not-italic text-gray-400">
            <a
              href="https://www.google.com/maps/search/?api=1&query=620+High+Level+Road+Wijerama+Nugegoda"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 hover:text-white"
            >
              <MapPin size={17} className="mt-0.5 shrink-0 text-brand-on-dark" />
              <span>No. 620, High Level Road,<br />Wijerama, Nugegoda</span>
            </a>
            <div className="flex items-start gap-3">
              <Phone size={17} className="mt-0.5 shrink-0 text-brand-on-dark" />
              <div className="space-y-1">
                <a href="tel:+94112812789" className="grid grid-cols-[3.5rem_1fr] gap-2 hover:text-white"><span className="text-gray-500">Office</span><span>011 2 812 789</span></a>
                <a href="tel:+94765662666" className="grid grid-cols-[3.5rem_1fr] gap-2 hover:text-white"><span className="text-gray-500">Mobile</span><span>076 5 662 666</span></a>
                <a href="tel:+94777777678" className="grid grid-cols-[3.5rem_1fr] gap-2 hover:text-white"><span className="text-gray-500">Mobile</span><span>077 7 777 678</span></a>
              </div>
            </div>
            <a href="mailto:info@keylanka.lk" className="flex items-center gap-3 hover:text-white">
              <Mail size={17} className="shrink-0 text-brand-on-dark" />
              <span>info@keylanka.lk</span>
            </a>
          </address>
        </div>
      </div>
      <div className="border-t border-gray-800">
        <div className="container-page grid items-center gap-3 py-4 text-center text-xs text-gray-400 lg:grid-cols-[1fr_auto_1fr]">
        <span className="lg:justify-self-start">© {new Date().getFullYear()} Key Lanka. All rights reserved.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-brand">Terms &amp; Conditions</Link>
          <Link href="/privacy-policy" className="hover:text-brand">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-brand">No Return &amp; No Refund Policy</Link>
        </div>
        <div className="flex items-center justify-center gap-2 lg:justify-self-end">
          <span>Developed by</span>
          <a
            href="https://perfectsolutioninternational.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Developed by Perfect Solution International — opens in a new tab"
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
