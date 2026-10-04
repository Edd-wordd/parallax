"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function UserPage() {
  const { user, signOut } = useAuth();
  const email = user?.email ?? "—";
  const initial = (email[0] ?? "?").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-2xl"
    >
      <h1 className="page-heading">User</h1>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Profile</h2>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
                "bg-zinc-700/60 text-zinc-200 text-lg font-medium",
              )}
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-zinc-100 truncate">{email}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Account</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-500">
              Signed in with Supabase Auth. Your locations, gear, and sessions
              are scoped to this account.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
