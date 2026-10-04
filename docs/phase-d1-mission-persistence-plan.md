# Phase D.1 — Mission Persistence Plan

**Status:** Done — manual acceptance verified.  
**Locked approach:** Supabase is SoT for missions that have entered Setup (or later). Zustand is an in-memory session cache. Planning-only missions stay local until first Setup persist. No schema migration.

**Preserve:** Auth, Save Log → Sessions.  
**Out of scope:** astronomy engines, weather, redesigns, Electron.

## Boundary

| Kind | Storage |
|------|---------|
| Planning-only (never Setup) | Zustand memory only |
| Saved (Setup+) | Supabase SoT; Zustand cache for session |
| Sessions | Unchanged Save Log upsert |

## Implementation

1. `listMissions` / `getMissionWithTargets` + `mapMissionFromDb`
2. Remove durable mission persist; `clearMissions()`
3. AuthProvider clear→hydrate on session; clear on sign-out
4. Missions list loading/error/empty
5. Detail DB fallback when store miss
6. Post-Setup cancel syncs DB (`deleted_at` or status)
7. Acceptance checks

## Acceptance

- A saves (Setup+), refreshes, sees mission
- A sees it in fresh browser after sign-in; targets/phase correct
- B sees none of A’s; A→B switch shows no A missions
- Save Log still one session; planning cancel creates no DB row

See also `docs/supabase-auth-acceptance.md` Phase D.1 boxes.
