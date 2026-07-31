import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { recordSecurityEvent } from "@/lib/security-audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type, id: idParam } = await params;
  const id = Number(idParam);
  const supportedTypes = ["order", "product", "category", "brand", "service", "attribute", "attributeValue"] as const;
  if (!Number.isInteger(id) || id < 1 || !supportedTypes.includes(type as (typeof supportedTypes)[number])) {
    return NextResponse.json({ error: "Invalid trash item" }, { status: 400 });
  }

  const restored = type === "order"
    ? await prisma.order.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
    : type === "product"
      ? await prisma.product.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
      : type === "category"
        ? await prisma.category.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
        : type === "brand"
          ? await prisma.brand.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
          : type === "service"
            ? await prisma.service.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
            : type === "attribute"
              ? await prisma.attribute.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } })
              : await prisma.attributeValue.updateMany({ where: { id, deletedAt: { not: null } }, data: { deletedAt: null } });

  if (restored.count === 0) return NextResponse.json({ error: "Trash item not found" }, { status: 404 });

  await recordSecurityEvent({
    req,
    actorUserId: auth.userId,
    action: `ADMIN_${type.replace(/([A-Z])/g, "_$1").toUpperCase()}_RESTORED`,
    targetType: type.toUpperCase(),
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
