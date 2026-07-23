"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminApi, AdminUser } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import PasswordInput from "@/components/PasswordInput";

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  role: "BUYER" | "ADMIN";
}

const EMPTY_FORM: FormState = { name: "", email: "", password: "", confirmPassword: "", phone: "", role: "BUYER" };

export function AccountsManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const admins = users.filter((u) => u.role === "ADMIN");

  async function refresh() {
    setLoading(true);
    try {
      setUsers(await adminApi.getUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await adminApi.createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      });
      setForm(EMPTY_FORM);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4 h-fit bg-card">
        <h3 className="font-semibold text-sm">Add Account</h3>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="acc-name">Name</Label>
          <Input id="acc-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-email">Email</Label>
          <Input
            id="acc-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-password">Password</Label>
          <PasswordInput
            id="acc-password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-confirm-password">Confirm Password</Label>
          <PasswordInput
            id="acc-confirm-password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-phone">Phone (optional)</Label>
          <Input id="acc-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="acc-role">Role</Label>
          <select
            id="acc-role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "BUYER" | "ADMIN" }))}
            className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-transparent h-9"
          >
            <option value="BUYER">Buyer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button
          disabled={saving}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-2 rounded-md text-sm"
        >
          {saving ? "Creating..." : "Create Account"}
        </button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admin accounts yet.</p>
        ) : (
          admins.map((u) => (
            <div key={u.id} className="border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
              <div className="min-w-0 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-brand-light text-brand flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-medium truncate">{u.name}</h4>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <Badge variant="default" className="shrink-0">
                Admin
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
