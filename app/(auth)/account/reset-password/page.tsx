"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/account/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "This reset link is invalid or has expired");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid link" subtitle="This password reset link is missing or malformed.">
        <Link href="/account/forgot-password" className="text-brand font-medium hover:underline text-sm">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      {done ? (
        <p className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
          Password updated — redirecting you to login...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              id="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <PasswordInput
              id="confirm-password"
              required
              minLength={10}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-11"
              placeholder="••••••••"
            />
          </div>
          <p className="text-xs text-gray-500">Use at least 10 characters with uppercase, lowercase and a number.</p>
          <button
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium h-11 rounded-md transition-colors"
          >
            {loading ? "Saving..." : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-center text-gray-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
