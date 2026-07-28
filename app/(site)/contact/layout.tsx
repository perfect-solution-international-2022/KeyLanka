import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Key Lanka",
  description:
    "Contact Key Lanka in Nugegoda for help with car keys, remotes, locksmith tools, compatibility questions, services and bulk orders.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}

