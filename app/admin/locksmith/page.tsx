import { AdminShell } from "@/components/admin/AdminShell";
import { LocksmithApplicationsTable } from "@/components/admin/LocksmithApplicationsTable";
import { prisma } from "@/lib/prisma";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function AdminLocksmithPage() {
  const applications = await prisma.locksmithApplication.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Locksmith KYC">
      <LocksmithApplicationsTable applications={serialize(applications)} />
    </AdminShell>
  );
}
