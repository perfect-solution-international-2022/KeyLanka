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
  Settings2Icon,
  BarChart3Icon,
} from "lucide-react"

const data = {
  user: {
    name: "Admin",
    email: "dkranga@yahoo.com",
    avatar: "",
  },
  navMain: [
    { title: "Dashboard", url: "/admin/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Products", url: "/admin/products", icon: <PackageIcon /> },
    { title: "Categories", url: "/admin/categories", icon: <FolderTreeIcon /> },
    { title: "Brands", url: "/admin/brands", icon: <TagIcon /> },
    { title: "Services", url: "/admin/services", icon: <WrenchIcon /> },
    { title: "Orders", url: "/admin/orders", icon: <ShoppingCartIcon /> },
    { title: "Customers", url: "/admin/customers", icon: <UsersIcon /> },
    { title: "Accounts", url: "/admin/accounts", icon: <UserCogIcon /> },
    { title: "Reports", url: "/admin/reports", icon: <BarChart3Icon /> },
  ],
  navSecondary: [
    { title: "Wholesale Settings", url: "/admin/settings", icon: <Settings2Icon /> },
    { title: "View Store", url: "/", icon: <StoreIcon /> },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
