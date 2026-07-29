import Image from "next/image";
import { getMaintenanceSettings } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ComingSoonPage() {
  const settings = await getMaintenanceSettings();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <Image src="/logo-icon.png" alt="Key Lanka" width={64} height={64} className="h-16 w-16 object-contain" />
      <h1 className="text-3xl font-semibold">We&apos;ll be right back</h1>
      <p className="max-w-md text-muted-foreground">
        {settings.message || "We're putting the finishing touches on something great. Check back soon!"}
      </p>
    </main>
  );
}
