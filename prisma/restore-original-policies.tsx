import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { TermsContent } from "../components/legal/TermsContent";
import { PrivacyPolicyContent } from "../components/legal/PrivacyPolicyContent";
import { RefundPolicyContent } from "../components/legal/RefundPolicyContent";

const prisma = new PrismaClient();

function toPlainText(markup: string) {
  return markup
    .replace(/<(?:h[1-6]|p|li|tr|div|ul|ol|table|br)[^>]*>/gi, "\n")
    .replace(/<\/[^>]+>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const policies = [
  { key: "terms", title: "Terms & Conditions", content: toPlainText(renderToStaticMarkup(<TermsContent />)) },
  { key: "privacy", title: "Privacy Policy", content: toPlainText(renderToStaticMarkup(<PrivacyPolicyContent />)) },
  { key: "refund", title: "No Return & No Refund Policy", content: toPlainText(renderToStaticMarkup(<RefundPolicyContent />)) },
  {
    key: "warranty",
    title: "Warranty Conditions",
    content: `Warranty applies only to verified manufacturing defects.

Warranty does not cover:
- Incorrect programming or installation
- Battery replacement or battery failure
- Water damage
- Physical or accidental damage
- Normal wear and tear
- Misuse, modification or unauthorised repairs
- Damage caused by third-party locksmiths or technicians

Customers must contact KeyLanka.lk before attempting installation, programming, modification or repair of a product believed to be defective. We may request photographs, videos and other information to assess a warranty claim. The selected warranty period begins from the order date.`,
  },
];

async function main() {
  for (const policy of policies) {
    await prisma.policy.upsert({
      where: { key: policy.key },
      create: policy,
      update: { title: policy.title, content: policy.content, version: { increment: 1 } },
    });
  }
}

main().finally(() => prisma.$disconnect());
