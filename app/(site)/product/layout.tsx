import { Toaster } from "@/components/ui/sonner";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<Toaster position="top-center" richColors /></>;
}
