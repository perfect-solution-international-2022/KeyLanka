import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const conditions = await prisma.condition.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(conditions);
}
