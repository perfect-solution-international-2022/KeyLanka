import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function proxy(request: NextRequest) {
  const auth = verifyToken(request.cookies.get(COOKIE_NAME)?.value ?? "");
  const pathname = request.nextUrl.pathname;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (auth?.role !== "PRODUCT_MANAGER") return NextResponse.next();

    if (pathname === "/admin" || pathname === "/admin/dashboard") {
      return NextResponse.redirect(new URL("/admin/products", request.url));
    }
    if (!pathname.startsWith("/admin/products")) {
      return NextResponse.redirect(new URL("/admin/products", request.url));
    }
    return NextResponse.next();
  }

  // Keep the maintenance page and login reachable, and let admins preview the
  // live store while maintenance mode is active.
  if (pathname === "/coming-soon" || pathname === "/account/login" || auth?.role === "ADMIN") {
    return NextResponse.next();
  }

  try {
    const settings = await prisma.maintenanceSettings.findUnique({
      where: { id: 1 },
      select: { enabled: true },
    });

    if (settings?.enabled) {
      return NextResponse.redirect(new URL("/coming-soon", request.url));
    }
  } catch (error) {
    // A maintenance check must not take the storefront down when the database
    // is temporarily unavailable.
    console.error("Unable to check maintenance settings", error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)"],
};
