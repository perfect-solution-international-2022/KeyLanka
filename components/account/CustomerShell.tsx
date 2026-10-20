"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowUpRight,
  Heart,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { confirmToast } from "@/lib/confirm-toast";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

function CustomerSidebar() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [hash, setHash] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    queueMicrotask(updateHash);
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  const navigation = [
    {
      title: "Dashboard",
      href: "/account",
      icon: LayoutDashboard,
      active:
        pathname === "/account" &&
        !["#orders", "#account-details"].includes(hash),
    },
    {
      title: "My orders",
      href: "/account#orders",
      icon: Package,
      active:
        pathname.startsWith("/account/orders/") ||
        (pathname === "/account" && hash === "#orders"),
    },
    {
      title: "Account details",
      href: "/account#account-details",
      icon: UserRound,
      active: pathname === "/account" && hash === "#account-details",
    },
    {
      title: "Merchant access",
      href: "/account/become-locksmith",
      icon: KeyRound,
      active: pathname.startsWith("/account/become-locksmith"),
    },
  ];
  const shortcuts = [
    { title: "Wishlist", href: "/wishlist", icon: Heart },
    { title: "My cart", href: "/cart", icon: ShoppingBag },
    { title: "Help & support", href: "/support", icon: Headphones },
    { title: "View store", href: "/", icon: Store },
  ];
  const initials =
    auth.user?.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toUpperCase() || "KL";

  async function logout() {
    if (
      !(await confirmToast("Log out of your account?", {
        confirmLabel: "Log out",
      }))
    )
      return;
    setLoggingOut(true);
    setLogoutError(false);
    try {
      await auth.logout();
      setOpenMobile(false);
      router.push("/account/login");
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  return (
    <Sidebar
      variant="inset"
      collapsible="offcanvas"
      aria-label="Customer account sidebar"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="h-12 data-[slot=sidebar-menu-button]:p-1.5!"
              render={
                <Link
                  href="/account"
                  onClick={() => {
                    setHash("");
                    setOpenMobile(false);
                  }}
                />
              }
            >
              <Image
                src="/logo-icon.png"
                alt="Key Lanka"
                width={28}
                height={28}
                className="size-7 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <span className="block text-base font-semibold">Key Lanka</span>
                <span className="block text-xs text-muted-foreground">
                  Customer dashboard
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>My account</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="Account navigation">
              <SidebarMenu className="gap-1">
                {navigation.map(({ title, href, icon: Icon, active }) => (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton
                      isActive={active}
                      className="h-10 text-[15px] [&_svg]:size-[18px]"
                      render={
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          onClick={() => {
                            setHash(
                              href.includes("#")
                                ? `#${href.split("#")[1]}`
                                : "",
                            );
                            setOpenMobile(false);
                          }}
                        />
                      }
                    >
                      <Icon aria-hidden="true" />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Shopping & support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {shortcuts.map(({ title, href, icon: Icon }) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    className="h-10"
                    render={
                      <Link href={href} onClick={() => setOpenMobile(false)} />
                    }
                  >
                    <Icon aria-hidden="true" />
                    <span>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex min-w-0 items-center gap-3 px-2 py-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold"
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {auth.user?.name ?? "Your account"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {auth.user?.email ?? "Loading account…"}
            </p>
          </div>
        </div>
        {logoutError && (
          <p role="alert" className="px-2 text-xs leading-5 text-red-700">
            We couldn&apos;t sign you out. Please try again.
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              disabled={loggingOut || !auth.user}
              className="h-10"
            >
              <LogOut aria-hidden="true" />
              <span>{loggingOut ? "Signing out…" : "Sign out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export function CustomerShell({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const title = pathname.startsWith("/account/orders/")
    ? "Order details"
    : pathname.startsWith("/account/become-locksmith")
      ? "Merchant access"
      : "Dashboard";

  if (!auth.loading && !auth.user)
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-7 text-center shadow-xs sm:p-10">
          <UserRound
            aria-hidden="true"
            size={28}
            className="mx-auto mb-5 text-brand"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Your account, all in one place.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Sign in to view your orders, check their progress and find your
            saved products.
          </p>
          <Link
            href={`/account/login?redirect=${encodeURIComponent(pathname)}`}
            className="mt-6 flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in to your account
          </Link>
          <p className="mt-5 text-sm text-muted-foreground">
            New to Key Lanka?{" "}
            <Link
              href="/account/register"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>
    );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <CustomerSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b">
          <div className="flex w-full min-w-0 items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 h-4 data-vertical:self-auto"
            />
            <p className="min-w-0 truncate text-base font-medium">{title}</p>
            <Link
              href="/"
              aria-label="View store"
              className="ml-auto inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Store aria-hidden="true" size={15} />
              <span className="hidden sm:inline">View store</span>
              <ArrowUpRight aria-hidden="true" size={13} />
            </Link>
          </div>
        </header>
        <div className="@container/main flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
