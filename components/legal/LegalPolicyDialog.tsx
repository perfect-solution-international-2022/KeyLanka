"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TermsContent } from "@/components/legal/TermsContent";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { RefundPolicyContent } from "@/components/legal/RefundPolicyContent";

export type LegalPolicy = "terms" | "privacy" | "refund" | null;

const CONTENT = {
  terms: TermsContent,
  privacy: PrivacyPolicyContent,
  refund: RefundPolicyContent,
} as const;

export function LegalPolicyDialog({ policy, onClose }: { policy: LegalPolicy; onClose: () => void }) {
  const Content = policy ? CONTENT[policy] : null;

  return (
    <Dialog open={!!policy} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-y-auto p-6 sm:p-8 [&_h1]:pr-10">{Content && <Content />}</DialogContent>
    </Dialog>
  );
}
