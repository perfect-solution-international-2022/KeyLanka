import { AdminShell } from "@/components/admin/AdminShell";
import { WarrantyManager } from "@/components/admin/WarrantyManager";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function WarrantyPage() { const [warranties, policies] = await Promise.all([prisma.warranty.findMany({orderBy:{days:"asc"}}), prisma.policy.findMany({orderBy:{key:"asc"}})]); return <AdminShell title="Warranty & Policies"><WarrantyManager initialWarranties={JSON.parse(JSON.stringify(warranties))} initialPolicies={policies}/></AdminShell>; }
