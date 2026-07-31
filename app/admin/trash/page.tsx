import { AdminShell } from "@/components/admin/AdminShell";
import { TrashManager, type SimpleTrashItem, type TrashOrder, type TrashProduct } from "@/components/admin/TrashManager";
import { prisma } from "@/lib/prisma";

function serialize<T>(data: unknown): T {
  return JSON.parse(JSON.stringify(data));
}

export default async function AdminTrashPage() {
  const [orders, products, categories, brands, services, attributes, attributeValues] = await Promise.all([
    prisma.order.findMany({
      where: { deletedAt: { not: null } },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      include: { category: { select: { name: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.category.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true } }),
    prisma.brand.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true } }),
    prisma.service.findMany({ where: { deletedAt: { not: null } }, select: { id: true, title: true, deletedAt: true } }),
    prisma.attribute.findMany({ where: { deletedAt: { not: null } }, select: { id: true, name: true, deletedAt: true } }),
    prisma.attributeValue.findMany({ where: { deletedAt: { not: null } }, select: { id: true, value: true, deletedAt: true, attribute: { select: { name: true } } } }),
  ]);

  const otherItems: SimpleTrashItem[] = [
    ...categories.map((item) => ({ ...item, deletedAt: item.deletedAt!.toISOString(), type: "category" as const })),
    ...brands.map((item) => ({ ...item, deletedAt: item.deletedAt!.toISOString(), type: "brand" as const })),
    ...services.map((item) => ({ id: item.id, name: item.title, deletedAt: item.deletedAt!.toISOString(), type: "service" as const })),
    ...attributes.map((item) => ({ ...item, deletedAt: item.deletedAt!.toISOString(), type: "attribute" as const })),
    ...attributeValues.map((item) => ({ id: item.id, name: `${item.attribute.name}: ${item.value}`, deletedAt: item.deletedAt!.toISOString(), type: "attributeValue" as const })),
  ].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));

  return (
    <AdminShell title="Trash">
      <TrashManager
        orders={serialize<TrashOrder[]>(orders)}
        products={serialize<TrashProduct[]>(products)}
        otherItems={otherItems}
      />
    </AdminShell>
  );
}
