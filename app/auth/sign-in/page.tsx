"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error"),
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.replace(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="page-heading justify-center">Sign in</h1>
        <p className="text-sm text-zinc-500">Access your Parallax account</p>
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
        <div className="space-y-1">
          <label className="text-xs text-zinc-500" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" variant="cta" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 text-center text-sm text-zinc-500">
        <Link href="/auth/forgot-password" className="text-indigo-400 hover:text-indigo-300">
          Forgot password?
        </Link>
        <p>
          No account?{" "}
          <Link href="/auth/sign-up" className="text-indigo-400 hover:text-indigo-300">
            Create account
          </Link>
        </p>
      </div>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500 text-center">Loading…</p>}>
      <SignInForm />
    </Suspense>
  );
}
