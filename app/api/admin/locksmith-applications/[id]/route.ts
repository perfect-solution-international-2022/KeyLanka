import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";

const updateSchema = z.object({
  status: z.enum(["approved", "rejected", "disabled"]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.locksmithApplication.update({
      where: { id: Number(id) },
      data: {
        status: data.status,
        rejectionReason: data.status === "rejected" ? (data.rejectionReason ?? null) : null,
        reviewedAt: new Date(),
      },
    });
    await tx.user.update({ where: { id: app.userId }, data: { locksmithStatus: data.status } });
    return app;
  });

  return NextResponse.json(application);
}
