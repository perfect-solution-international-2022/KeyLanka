import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Car Key & Locksmith Technical Support",
  description:
    "Get expert help choosing compatible car keys, remotes and locksmith tools or diagnosing automotive key programming issues in Sri Lanka.",
  path: "/support",
});

export default function SupportPage() {
  return (
    <div className="container-page py-14 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Technical Support</h1>
      <p className="text-gray-600 leading-relaxed mb-6">
        Need help choosing a key, diagnosing a programming issue, or finding the right tool? Our technical team is
        available to assist locksmiths and customers alike.
      </p>
      <div className="border border-gray-200 rounded-lg p-5 space-y-2 text-sm text-gray-700">
        <div>Phone: 077 777 7678</div>
        <div>Land: 011 281 2789</div>
        <div>Email: dkranga@yahoo.com</div>
        <div>Address: No 620 High Level Road, Wijerama, Nugegoda</div>
      </div>
    </div>
  );
}
