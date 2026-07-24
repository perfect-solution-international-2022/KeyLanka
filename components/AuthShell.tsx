import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

const HIGHLIGHTS = [
  "Track orders and reorder your favorite keys in seconds",
  "Save items to your wishlist across devices",
  "Faster checkout with saved delivery details",
];

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid lg:grid-cols-2 min-h-screen">
      <div className="relative hidden lg:flex flex-col justify-between bg-gray-900 text-white p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/25 via-transparent to-transparent" />
        <Link href="/" className="relative z-10 flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Key Lanka" width={52} height={52} className="h-[52px] w-[52px] object-contain" />
          <span className="font-extrabold text-lg">
            KEY <span className="text-brand">LANKA</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-sm">
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Your account, your keys, always in sync.
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-start gap-2.5 text-sm text-gray-300">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs">
                  ✓
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Key Lanka. Car Keys &amp; Locksmith Tools.
        </p>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 sm:py-16">
        <Link
          href="/"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand"
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Image src="/logo-icon.png" alt="Key Lanka" width={44} height={44} className="h-11 w-11 object-contain" />
            <span className="font-extrabold text-lg">
              KEY <span className="text-brand">LANKA</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
