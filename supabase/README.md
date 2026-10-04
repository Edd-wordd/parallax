# Parallax Supabase

## Schema (Phase C)

- Migration: `migrations/20261004003627_parallax_core_schema.sql`
- RLS: every table scoped with `(select public.clerk_user_id()) = user_id`
- `clerk_user_id()` reads `auth.jwt()->>'sub'` (Clerk user id)
- Do **not** use `auth.uid()` with Clerk

Auth setup (app wiring is Phase D): follow
[Clerk → Supabase](https://clerk.com/docs/integrations/databases/supabase)
(native third-party provider; JWT template deprecated).

## Apply migrations locally

```bash
supabase start
supabase db reset   # applies migrations
```

## RLS verify (required)

1. Apply migrations.
2. Run `fixtures/rls_two_user_verify.sql` as a privileged role (seeds A + B).
3. As JWT `sub=user_fixture_a`, `role=authenticated`: own rows visible; B’s sessions count **0**.
4. As `user_fixture_b`: mirror.
5. As `user_wrong_claim` or missing `sub`: counts **0**. Treat empty as a hard assert — wrong claim mapping looks like “no data” with no error.

See comments at the bottom of the fixture for `set_config('request.jwt.claims', …)` examples.
