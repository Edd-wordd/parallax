# Hosted migration pass

**Date:** 2026-10-18  
**Local app DB:** `127.0.0.1:54321` (`.env.local`)  
**Hosted project:** `iyabzjyyfzdodmedpgfx` (name: Parallax, region us-west-2)

## Local (done)

`supabase migration list --local` shows every repo migration applied:

| Migration | Purpose |
|-----------|---------|
| `20261004003627` | Core schema |
| `20261004040000` | Auth UID RLS |
| `20261004220000` | Gear sensor dims |
| `20261005010000` | Mission schedule |
| `20261005120000` | Mission actuals |
| `20261005200000` | Mission events |
| `20261006120000` | Session end + location TZ |
| `20261007010000` | Capture plan |
| `20261011200000` | Mission events plan snapshot |
| `20261011210000` | Mission events checklist |
| `20261019010000` | Gear build sheet (mount class, tracking, accessories) |

## Hosted (done — 2026-10-18)

1. Project **ACTIVE_HEALTHY**; CLI **linked** (`iyabzjyyfzdodmedpgfx`).
2. App `.env.local` → hosted URL + publishable key.
3. Migrations applied by user; REST probe OK (200) for `gear_profiles` (incl. build-sheet cols), `mission_events`, `missions.session_end_at`, `user_preferences`, `sessions`.
4. Note: `supabase migration list --linked` may still fail with the `cli_login_postgres` CLI bug — use `--db-url` if you need CLI history again.

**Auth:** keep redirect URLs for local ports; hosted Auth users are separate from local — sign up on hosted.
