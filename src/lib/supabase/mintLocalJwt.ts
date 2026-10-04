import { SignJWT } from "jose";

/**
 * Mint a Clerk-shaped JWT for local Supabase RLS testing.
 * Claims: sub = Clerk-style user id, role = authenticated.
 * Server-only — never import from client components.
 */
export async function mintLocalJwt(userId: string): Promise<string> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET is not set");
  }
  const key = new TextEncoder().encode(secret);
  return new SignJWT({ role: "authenticated" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}
