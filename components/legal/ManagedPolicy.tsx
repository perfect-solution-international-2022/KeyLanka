import { prisma } from "@/lib/prisma";
export async function ManagedPolicy({ policyKey }: { policyKey: string }) {
  const policy = await prisma.policy.findUnique({ where: { key: policyKey } });
  if (!policy) return <p>Policy content is not available.</p>;
  return <article><h1 className="mb-6 text-3xl font-bold text-gray-900">{policy.title}</h1><div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{policy.content}</div><p className="mt-8 text-xs text-gray-400">Version {policy.version} · Updated {policy.updatedAt.toLocaleDateString()}</p></article>;
}
