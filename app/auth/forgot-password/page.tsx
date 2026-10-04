"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${origin}/auth/reset-password` },
      );
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setInfo(
        "If an account exists for that email, a reset link was sent. Check your inbox (local Inbucket: http://127.0.0.1:54324).",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="page-heading justify-center">Reset password</h1>
        <p className="text-sm text-zinc-500">We’ll email a recovery link</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {info && <p className="text-sm text-zinc-300">{info}</p>}
        <Button type="submit" variant="cta" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-zinc-500">
        <Link href="/auth/sign-in" className="text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
