import { NextResponse } from "next/server";
import { getShippingCost } from "@/lib/queries";

export async function GET() {
  return NextResponse.json({ shippingCost: await getShippingCost() });
}
