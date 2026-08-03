"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  PackageIcon,
  FolderTreeIcon,
  TagIcon,
  ShoppingCartIcon,
  UsersIcon,
  UserCogIcon,
  WrenchIcon,
  StoreIcon,
  BarChart3Icon,
  KeyRoundIcon,
  TruckIcon,
  ShieldCheckIcon,
  ConeIcon,
  ListTreeIcon,
  Trash2Icon,
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "info@keylanka.lk",
    avatar: "",
  },
  navSecondary: [
    { title: "Shipping Settings", url: "/admin/shipping", icon: <TruckIcon /> },
    { title: "Site Maintenance", url: "/admin/maintenance", icon: <ConeIcon /> },
    { title: "View Store", url: "/", icon: <StoreIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [badgeCounts, setBadgeCounts] = React.useState({ pendingOrders: 0, pendingLocksmith: 0 })

  React.useEffect(() => {
    let cancelled = false
    function load() {
      fetch("/api/admin/badge-counts")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d && !cancelled) setBadgeCounts(d)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const navMain = [
    { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Products", url: "/admin/products", icon: <PackageIcon /> },
    { title: "Categories", url: "/admin/categories", icon: <FolderTreeIcon /> },
    { title: "Brands", url: "/admin/brands", icon: <TagIcon /> },
    { title: "Attributes", url: "/admin/attributes", icon: <ListTreeIcon /> },
    { title: "Services", url: "/admin/services", icon: <WrenchIcon /> },
    { title: "Orders", url: "/admin/orders", icon: <ShoppingCartIcon />, badge: badgeCounts.pendingOrders },
    { title: "Trash", url: "/admin/trash", icon: <Trash2Icon /> },
    { title: "Customers", url: "/admin/customers", icon: <UsersIcon /> },
    { title: "Accounts", url: "/admin/accounts", icon: <UserCogIcon /> },
    { title: "Locksmith KYC", url: "/admin/locksmith", icon: <KeyRoundIcon />, badge: badgeCounts.pendingLocksmith },
    { title: "Reports", url: "/admin/reports", icon: <BarChart3Icon /> },
    { title: "Security Activity", url: "/admin/security", icon: <ShieldCheckIcon /> },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<Link href="/admin/dashboard" />}
            >
              <Image src="/logo-icon.png" alt="Key Lanka" width={24} height={24} className="h-6 w-6 object-contain shrink-0" />
              <span className="text-base font-semibold">Key Lanka Admin</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
