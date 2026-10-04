"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setError(
          "This reset link is invalid or expired. Request a new one from Forgot password.",
        );
        setReady(false);
      } else {
        setReady(true);
      }
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="page-heading justify-center">Set new password</h1>
        <p className="text-sm text-zinc-500">Choose a password for your account</p>
      </div>
      {!ready ? (
        <div className="space-y-3 text-center">
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Link
            href="/auth/forgot-password"
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500" htmlFor="password">
              New password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <Button type="submit" variant="cta" className="w-full" disabled={loading}>
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-zinc-500">
        <Link href="/auth/sign-in" className="text-indigo-400 hover:text-indigo-300">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
