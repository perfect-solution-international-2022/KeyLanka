import { redirect } from "next/navigation";
import { getVerifiedServerAuth } from "@/lib/auth-server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, noarchive: true, nocache: true },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getVerifiedServerAuth();
  if (!auth) redirect("/account/login?redirect=/admin/dashboard");
  if (auth.role !== "ADMIN") redirect("/");
  return children;
}
