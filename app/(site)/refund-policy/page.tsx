import { RefundPolicyContent } from "@/components/legal/RefundPolicyContent";

export const metadata = { title: "No Return & No Refund Policy | Key Lanka" };

export default function RefundPolicyPage() {
  return (
    <div className="container-page py-14 max-w-3xl">
      <RefundPolicyContent />
    </div>
  );
}
