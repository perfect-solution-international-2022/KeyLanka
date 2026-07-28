import Link from "next/link";
import { getServices } from "@/lib/queries";
import { getServiceIcon } from "@/lib/service-icons";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Car Key & Locksmith Services",
  description:
    "Professional car key programming, duplication and automotive locksmith support from Key Lanka in Nugegoda, Sri Lanka.",
  path: "/services",
});

export default async function ServicesPage() {
  const services = await getServices().catch(() => []);

  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Our Services</h1>
      <p className="text-gray-500 text-sm mb-6">Professional car key &amp; locksmith services you can rely on.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => {
          const Icon = getServiceIcon(s.slug, s.title, s.icon);
          return (
            <Link key={s.id} href={`/services/${s.slug}`} className="border border-gray-200 rounded-lg p-5 hover:border-brand hover:shadow-md transition-all">
              <div className="h-10 w-10 rounded-full bg-brand-light text-brand flex items-center justify-center mb-3">
                <Icon size={20} />
              </div>
              <h2 className="font-semibold text-gray-900 mb-1">{s.title}</h2>
              <p className="text-sm text-gray-500 line-clamp-2">{s.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
