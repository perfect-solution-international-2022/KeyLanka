import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-300 mt-16">
      <div className="container-page py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Image src="/logo-icon.png" alt="Key Lanka" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-extrabold text-white text-lg">
              KEY <span className="text-brand">LANKA</span>
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

        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>No 620 High Level Road, Wijerama, Nugegoda</li>
            <li>Land: 011 281 2789</li>
            <li>Mobile: 077 777 7678</li>
            <li>dkranga@yahoo.com</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} Key Lanka. All rights reserved.
      </div>
    </footer>
  );
}
