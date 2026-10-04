/**
 * Fallback for tooling that still expects middleware.ts.
 * Next.js 16 prefers proxy.ts (see proxy.ts); both call the same updateSession.
 */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
