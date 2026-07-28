import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceBySlug } from "@/lib/queries";
import { getServiceIcon } from "@/lib/service-icons";
import type { Metadata } from "next";
import { pageMetadata, seoDescription, absoluteUrl } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { createElement } from "react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug).catch(() => null);
  if (!service) return { title: "Service Not Found", robots: { index: false, follow: false } };
  return pageMetadata({
    title: service.title,
    description: seoDescription(service.description),
    path: `/services/${service.slug}`,
  });
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = await getServiceBySlug(slug).catch(() => null);
  if (!service) notFound();
  const serviceIcon = createElement(getServiceIcon(service.slug, service.title, service.icon), { size: 24 });

  return (
    <div className="container-page py-14 max-w-2xl">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: service.title,
          description: seoDescription(service.description),
          url: absoluteUrl(`/services/${service.slug}`),
          provider: { "@id": `${absoluteUrl("/")}#business` },
          areaServed: { "@type": "Country", name: "Sri Lanka" },
        }}
      />
      <div className="h-12 w-12 rounded-full bg-brand-light text-brand flex items-center justify-center mb-4">
        {serviceIcon}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h1>
      <p className="text-gray-600 leading-relaxed">{service.description}</p>
      <Link href="/contact" className="inline-block mt-6 bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-md">
        Get Help Now
      </Link>
    </div>
  );
}
