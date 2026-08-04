import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { getBankTransferSettings } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ available: false });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locksmithStatus: true } });
  if (user?.locksmithStatus !== "approved") return NextResponse.json({ available: false });
  const settings = await getBankTransferSettings();
  if (!settings.enabled) return NextResponse.json({ available: false });
  return NextResponse.json({
    available: true,
    bankName: settings.bankName,
    branchName: settings.branchName,
    accountName: settings.accountName,
    accountNumber: settings.accountNumber,
  });
}
