"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type Warranty = { id: number; name: string; days: number; price: string; active: boolean };
type Policy = { key: string; title: string; content: string; version: number };
async function call(path: string, method: string, body: unknown) { const r = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; }

export function WarrantyManager({ initialWarranties, initialPolicies }: { initialWarranties: Warranty[]; initialPolicies: Policy[] }) {
  const [warranties, setWarranties] = useState(initialWarranties); const [policies, setPolicies] = useState(initialPolicies);
  const [draft, setDraft] = useState({ name: "", days: "", price: "0" });
  async function add(e: React.FormEvent) { e.preventDefault(); try { const w = await call("/api/admin/warranties", "POST", { name: draft.name, days: Number(draft.days), price: Number(draft.price) }); setWarranties(v => [...v, w]); setDraft({ name: "", days: "", price: "0" }); toast.success("Warranty added"); } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); } }
  async function saveWarranty(w: Warranty) { const saved = await call(`/api/admin/warranties/${w.id}`, "PATCH", { ...w, price: Number(w.price) }); setWarranties(v => v.map(x => x.id === w.id ? saved : x)); toast.success("Warranty updated"); }
  async function savePolicy(p: Policy) { const saved = await call("/api/admin/policies", "PATCH", p); setPolicies(v => v.map(x => x.key === p.key ? saved : x)); toast.success("Policy updated"); }
  return <div className="space-y-8">
    <section className="rounded-xl border bg-card p-6"><h2 className="mb-1 font-semibold">Warranty Types</h2><p className="mb-5 text-sm text-muted-foreground">No Warranty is always available free; add paid or free warranty options here.</p>
      <form onSubmit={add} className="mb-5 grid gap-3 sm:grid-cols-[1fr_140px_160px_auto_auto]"><Input required placeholder="Warranty name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><Input required type="number" min="0" placeholder="Period (days)" value={draft.days} onChange={e=>setDraft({...draft,days:e.target.value})}/><Input required type="number" min="0" step="0.01" placeholder="Price" value={draft.price} disabled={Number(draft.price) === 0} onChange={e=>setDraft({...draft,price:e.target.value})}/><label className="flex items-center gap-2 whitespace-nowrap text-sm"><input type="checkbox" checked={Number(draft.price) === 0} onChange={e=>setDraft({...draft,price:e.target.checked?"0":""})}/>Free</label><button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Add</button></form>
      <div className="space-y-3">
        <div className="grid gap-3 rounded-lg border border-brand/30 bg-brand/5 p-3 sm:grid-cols-[1fr_120px_150px_auto_auto]">
          <Input value="No Warranty" disabled aria-label="Warranty name" />
          <Input value="0" disabled aria-label="Warranty days" />
          <Input value="0.00" disabled aria-label="Warranty price" />
          <span className="flex items-center text-sm font-medium text-brand">Always active</span>
          <span className="flex items-center text-sm text-muted-foreground">Built-in</span>
        </div>
        {warranties.map((w,i)=><div key={w.id} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_120px_150px_auto_auto_auto]"><Input value={w.name} onChange={e=>setWarranties(v=>v.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/><Input type="number" min="0" value={w.days} onChange={e=>setWarranties(v=>v.map((x,j)=>j===i?{...x,days:Number(e.target.value)}:x))}/><Input type="number" min="0" step="0.01" value={w.price} disabled={Number(w.price) === 0} onChange={e=>setWarranties(v=>v.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/><label className="flex items-center gap-2 whitespace-nowrap text-sm"><input type="checkbox" checked={Number(w.price) === 0} onChange={e=>setWarranties(v=>v.map((x,j)=>j===i?{...x,price:e.target.checked?"0":"0.01"}:x))}/>Free</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={w.active} onChange={e=>setWarranties(v=>v.map((x,j)=>j===i?{...x,active:e.target.checked}:x))}/>Active</label><button onClick={()=>saveWarranty(w)} className="rounded border px-3 text-sm">Save</button></div>)}
      </div>
    </section>
    <section className="space-y-4"><h2 className="font-semibold">Policies & Conditions</h2>{policies.map((p,i)=><div key={p.key} className="rounded-xl border bg-card p-5"><div className="mb-3 flex items-center justify-between"><strong className="capitalize">{p.key}</strong><span className="text-xs text-muted-foreground">Version {p.version}</span></div><Input className="mb-3" value={p.title} onChange={e=>setPolicies(v=>v.map((x,j)=>j===i?{...x,title:e.target.value}:x))}/><textarea rows={10} className="w-full rounded-lg border bg-background p-3 text-sm" value={p.content} onChange={e=>setPolicies(v=>v.map((x,j)=>j===i?{...x,content:e.target.value}:x))}/><button onClick={()=>savePolicy(p)} className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">Save Policy</button></div>)}</section>
  </div>;
}
