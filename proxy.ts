import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-server";

export function proxy(request: NextRequest) {
  const auth = verifyToken(request.cookies.get(COOKIE_NAME)?.value ?? "");
  if (auth?.role !== "PRODUCT_MANAGER") return NextResponse.next();

  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin" || pathname === "/admin/dashboard") {
    return NextResponse.redirect(new URL("/admin/products", request.url));
  }
  if (!pathname.startsWith("/admin/products")) {
    return NextResponse.redirect(new URL("/admin/products", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
