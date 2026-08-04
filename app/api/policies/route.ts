import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await prisma.policy.findMany({ select: { key: true, title: true, content: true, version: true }, orderBy: { key: "asc" } }));
}
