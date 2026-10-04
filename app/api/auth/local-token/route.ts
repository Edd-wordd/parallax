import { NextResponse } from "next/server";
import { getLocalUserId, isClerkConfigured } from "@/lib/supabase/env";
import { mintLocalJwt } from "@/lib/supabase/mintLocalJwt";

/** Dev-only token endpoint when Clerk is not configured. */
export async function GET() {
  if (isClerkConfigured()) {
    return NextResponse.json(
      { error: "Local token disabled when Clerk is configured" },
      { status: 400 },
    );
  }
  try {
    const token = await mintLocalJwt(getLocalUserId());
    return NextResponse.json({ token, userId: getLocalUserId() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to mint token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
