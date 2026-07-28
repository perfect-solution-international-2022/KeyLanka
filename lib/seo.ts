import type { Metadata } from "next";

export const SITE_NAME = "Key Lanka";
export const DEFAULT_DESCRIPTION =
  "Shop car keys, remotes, key shells, transponders and professional locksmith tools in Sri Lanka, with expert compatibility support and islandwide delivery.";

export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const fallback = process.env.NODE_ENV === "production" ? "https://keylanka.lk" : "http://localhost:3000";
  try {
    return new URL(configured || fallback).origin;
  } catch {
    return fallback;
  }
}

export function absoluteUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, siteUrl()).toString();
  }
}

export function seoDescription(value: string | null | undefined, fallback = DEFAULT_DESCRIPTION) {
  const plain = (value || fallback)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length <= 160 ? plain : `${plain.slice(0, 157).trimEnd()}...`;
}

export function pageMetadata({
  title,
  description,
  path,
  image = "/og.png",
  noIndex = false,
}: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const cleanDescription = seoDescription(description);
  const canonical = absoluteUrl(path);
  return {
    title,
    description: cleanDescription,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, noarchive: true }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_LK",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description: cleanDescription,
      images: image ? [{ url: absoluteUrl(image), alt: `${title} — ${SITE_NAME}` }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: cleanDescription,
      images: image ? [absoluteUrl(image)] : undefined,
    },
  };
}

