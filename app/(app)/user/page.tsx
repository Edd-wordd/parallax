"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UserPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-2xl"
    >
      <h1 className="text-2xl font-bold">User</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Profile</h2>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
                "bg-zinc-700/60 text-zinc-200 text-lg font-medium"
              )}
              aria-hidden
            >
              A
            </div>
            <div className="min-w-0">
              <div className="font-medium text-zinc-100">Alex Imager</div>
              <div className="text-sm text-zinc-400">alex@example.com</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Account</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-100">Plan: Free</span>
              <Link
                href="#"
                className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-400"
              >
                Upgrade
              </Link>
            </div>
            <div>
              <span className="text-sm text-zinc-400">Member since: </span>
              <span className="text-sm text-zinc-100">March 2026</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Danger Zone</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-red-400/90 hover:bg-red-500/5"
            >
              Sign out
            </Button>
            <Button type="button" variant="destructive" size="sm">
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
