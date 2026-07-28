"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.register(name, email, password, phone || undefined);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Join Key Lanka for faster checkout and order tracking.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
            placeholder="Your name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="text-gray-400 font-normal">(optional)</span></Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-11"
            placeholder="077 123 4567"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            placeholder="10+ characters, upper/lowercase and a number"
          />
          <p className="text-xs text-gray-500">Use at least 10 characters with uppercase, lowercase and a number.</p>
        </div>
        <button
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium h-11 rounded-md transition-colors"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <p className="text-sm text-gray-500 text-center pt-2">
          Already have an account?{" "}
          <Link href="/account/login" className="text-brand font-medium hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
