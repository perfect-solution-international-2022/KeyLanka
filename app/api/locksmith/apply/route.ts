import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth-server";

const privateDocument = z.string().regex(/^\/api\/locksmith\/documents\/[a-z0-9]+(?:\?.*)?$/);

const applySchema = z.object({
  fullName: z.string().min(1),
  mobileNumber: z.string().min(1),
  email: z.string().email(),
  businessName: z.string().min(1),
  businessRegDocs: z.array(privateDocument).min(1),
  nationalIdFront: privateDocument,
  nationalIdBack: privateDocument,
  address: z.string().min(1),
  utilityBillDoc: privateDocument,
});

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const application = await prisma.locksmithApplication.findUnique({ where: { userId } });
  return NextResponse.json(application);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const existing = await prisma.locksmithApplication.findUnique({ where: { userId } });
  if (existing && (existing.status === "pending" || existing.status === "approved")) {
    return NextResponse.json({ error: "You already have an application on file" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const data = parsed.data;

  const application = await prisma.$transaction(async (tx) => {
    const app = await tx.locksmithApplication.upsert({
      where: { userId },
      create: { userId, ...data, status: "pending" },
      update: { ...data, status: "pending", rejectionReason: null, reviewedAt: null },
    });
    await tx.user.update({ where: { id: userId }, data: { locksmithStatus: "pending" } });
    return app;
  });

  return NextResponse.json(application, { status: 201 });
}
