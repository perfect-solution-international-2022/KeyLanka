"use client";

import Link from "next/link";
import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      await api.forgotPassword(email);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("idle");
    }
  }

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a reset link.">
      {status === "sent" ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link to it.
          </p>
          <Link href="/account/login" className="text-sm text-brand font-medium hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
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
          </div>
          <button
            disabled={status === "sending"}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium h-11 rounded-md transition-colors"
          >
            {status === "sending" ? "Sending..." : "Send Reset Link"}
          </button>
          <p className="text-sm text-gray-500 text-center pt-2">
            Remembered it?{" "}
            <Link href="/account/login" className="text-brand font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
