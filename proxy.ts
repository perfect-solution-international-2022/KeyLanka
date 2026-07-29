import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth-server";
import { getMaintenanceSettings } from "@/lib/queries";

const ALWAYS_ALLOWED_PATHS = ["/coming-soon", "/account/login"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const auth = getAuth(req);

    if (!auth) {
      const loginUrl = new URL("/account/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (auth.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  if (!ALWAYS_ALLOWED_PATHS.includes(pathname)) {
    const auth = getAuth(req);
    if (auth?.role !== "ADMIN") {
      const settings = await getMaintenanceSettings();
      if (settings.enabled) {
        return NextResponse.rewrite(new URL("/coming-soon", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
