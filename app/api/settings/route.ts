import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/queries";

// Public, read-only — the storefront needs wholesaleMinQty to compute pricing
// client-side (cart totals, product detail quantity selector).
export async function GET() {
  const settings = await getStoreSettings();
  return NextResponse.json({ wholesaleMinQty: settings.wholesaleMinQty });
}
