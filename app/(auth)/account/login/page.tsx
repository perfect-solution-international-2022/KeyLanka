"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PasswordInput from "@/components/PasswordInput";
import { api } from "@/lib/api";
import { getSessionId } from "@/lib/session";

function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (challengeId) {
        await api.completeAdminMfa(challengeId, verificationCode);
        await auth.refresh();
        const redirect = searchParams.get("redirect");
        router.push(redirect && redirect.startsWith("/admin") ? redirect : "/admin/dashboard");
        return;
      }
      const result = await api.login({ email, password }, getSessionId());
      if ("mfaRequired" in result) {
        setChallengeId(result.challengeId);
        setDevelopmentCode(result.developmentCode ?? "");
        return;
      }
      await auth.refresh();
      const user = result;
      const redirect = searchParams.get("redirect");
      if (user.role === "ADMIN") {
        router.push(redirect && redirect.startsWith("/admin") ? redirect : "/admin/dashboard");
      } else {
        router.push(redirect ?? "/account");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your orders, wishlist and details.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        {!challengeId && <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            placeholder="you@example.com"
          />
        </div>}
        {!challengeId && <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/account/forgot-password" className="text-xs text-brand font-medium hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
            placeholder="••••••••"
          />
        </div>}
        {challengeId && (
          <div className="space-y-1.5">
            <Label htmlFor="verification-code">Admin verification code</Label>
            <Input
              id="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="h-11 tracking-[0.35em]"
              placeholder="000000"
            />
            <p className="text-xs text-gray-500">
              Enter the six-digit code sent to the admin email.
              {developmentCode ? ` Local development code: ${developmentCode}` : ""}
            </p>
          </div>
        )}
        <button
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium h-11 rounded-md transition-colors"
        >
          {loading ? "Signing in..." : challengeId ? "Verify and Login" : "Login"}
        </button>
        <p className="text-sm text-gray-500 text-center pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="text-brand font-medium hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
