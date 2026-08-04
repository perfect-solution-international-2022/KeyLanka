import { prisma } from "@/lib/prisma";
export async function createPolicyAgreementSnapshot() {
  const policies = await prisma.policy.findMany({ where: { key: { in: ["terms", "refund", "warranty"] } }, select: { key: true, title: true, content: true, version: true } });
  return { accepted: true, acceptedAt: new Date().toISOString(), policies };
}
