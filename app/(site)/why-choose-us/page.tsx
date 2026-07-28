import { pageMetadata } from "@/lib/seo";

const REASONS = [
  { title: "Genuine & Tested Products", desc: "Every product is quality-checked before it reaches you." },
  { title: "Wide Vehicle Coverage", desc: "Keys, remotes and tools for 25+ vehicle brands." },
  { title: "Expert Technical Support", desc: "Our team helps you pick and program the right key." },
  { title: "Fast, Reliable Delivery", desc: "Quick turnaround with island wide shipping across Sri Lanka." },
  { title: "Secure Checkout", desc: "Safe, straightforward ordering with clear order tracking." },
  { title: "Compatibility Help", desc: "Get help confirming the correct key before ordering." },
];

export const metadata = pageMetadata({
  title: "Why Choose Key Lanka",
  description:
    "Choose Key Lanka for tested automotive key products, broad vehicle coverage, expert compatibility help, secure checkout and islandwide delivery.",
  path: "/why-choose-us",
});

export default function WhyChooseUsPage() {
  return (
    <div className="container-page py-14">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Why Choose Key Lanka</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {REASONS.map((r) => (
          <div key={r.title} className="border border-gray-200 rounded-lg p-5">
            <h2 className="font-semibold text-gray-900 mb-1">{r.title}</h2>
            <p className="text-sm text-gray-500">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
