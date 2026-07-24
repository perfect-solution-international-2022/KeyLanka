import { NextRequest, NextResponse } from "next/server";
import { getProducts, isAuthLocksmithAuthorized } from "@/lib/queries";
import { getAuth } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const locksmithAuthorized = await isAuthLocksmithAuthorized(getAuth(req));
  const result = await getProducts(
    {
      category: sp.get("category") ?? undefined,
      brand: sp.get("brand") ?? undefined,
      minPrice: sp.get("minPrice") ?? undefined,
      maxPrice: sp.get("maxPrice") ?? undefined,
      productType: sp.get("productType") ?? undefined,
      search: sp.get("search") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      page: sp.get("page") ?? undefined,
      limit: sp.get("limit") ?? undefined,
    },
    { locksmithAuthorized }
  );
  return NextResponse.json(result);
}
