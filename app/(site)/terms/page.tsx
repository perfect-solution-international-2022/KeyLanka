import { TermsContent } from "@/components/legal/TermsContent";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms & Conditions",
  description: "Review the terms and conditions governing purchases, payments, delivery and use of the Key Lanka website and services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <TermsContent />
    </div>
  );
}
