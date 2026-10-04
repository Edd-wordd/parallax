# Parallax Supabase

## Schema

- Core: `migrations/20261004003627_parallax_core_schema.sql`
- Auth RLS: `migrations/20261004040000_supabase_auth_uid_rls.sql`
- Ownership: `user_id uuid` default `auth.uid()`
- RLS: `(select auth.uid()) = user_id` on every owned table

Auth is **native Supabase Auth** (email/password). See `docs/supabase-auth-migration-plan.md`.

## Apply migrations locally

```bash
supabase start
supabase db reset   # applies migrations (wipes data)
```

### Preserving local-token rows

If you already have rows under `user_local_dev` and have **not** applied the Auth UUID migration yet:

1. Create a Supabase Auth user (app sign-up or Studio).
2. Note the UUID: `select id, email from auth.users;`
3. Dry-run / apply `scripts/remap-local-user.sql` (see script header).
4. Apply the Auth migration (`supabase migration up` or `db reset` if starting clean).

## RLS verify

1. Apply migrations.
2. Run `fixtures/rls_two_user_verify.sql` as postgres (seeds two `auth.users` + rows).
3. Simulate JWT claims with `set_config('request.jwt.claims', …)` (examples at bottom of fixture).
4. Assert A sees own sessions; B sees zero of A’s; wrong `sub` → **0** rows.
