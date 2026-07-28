import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";

export default async function SecurityPage() {
  const events = await prisma.securityAuditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <AdminShell title="Security Activity">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Admin / user</th>
                <th className="px-4 py-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {event.createdAt.toLocaleString("en-LK")}
                  </td>
                  <td className="px-4 py-3 font-medium">{event.action.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">{event.actor?.email ?? "System / unknown"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[event.targetType, event.targetId].filter(Boolean).join(" #") || "—"}
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No security events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

