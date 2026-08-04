"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type LegalPolicy = "terms" | "privacy" | "refund" | "warranty" | null;

export function LegalPolicyDialog({ policy, onClose }: { policy: LegalPolicy; onClose: () => void }) {
  const [item, setItem] = useState<{ title: string; content: string; version: number } | null>(null);
  useEffect(() => { if (!policy) return; fetch("/api/policies").then(r=>r.json()).then((items)=>setItem(items.find((p:{key:string})=>p.key===policy) ?? null)); }, [policy]);

  return (
    <Dialog open={!!policy} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-y-auto p-6 sm:p-8 [&_h1]:pr-10">{item ? <article><h1 className="mb-5 text-2xl font-bold">{item.title}</h1><div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{item.content}</div><p className="mt-6 text-xs text-gray-400">Version {item.version}</p></article> : <p>Loading...</p>}</DialogContent>
    </Dialog>
  );
}
