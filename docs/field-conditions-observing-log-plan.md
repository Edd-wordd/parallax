# Field Conditions + Observing Log Plan

**Status:** Implemented (local verified 2026-10-18; hosted paused — see Local vs hosted)  
**Preserve:** Auth/RLS, locations/gear, night schedule, mission phases, actual capture fields, Save Log → Sessions, Demo labels for unwired AI/equipment.

## Locked defaults

- Setup forecast/astro from mission site + `dateTime` (+6h session); show source and update time; never invent numbers.
- Manual field readings → `condition_logs` (`source=manual`) + `mission_events` (`kind=field_reading`).
- Append-only `mission_events` timeline is chronological SoT; corrections link via `corrects_event_id`.
- No fake offline sync; failed writes show “Not saved”.
- Save Log attaches `session_id` to events/logs (no history copy).

## Implementation map

| Piece | Path |
|-------|------|
| Migration | `supabase/migrations/*_mission_events.sql` |
| Queries | `src/lib/supabase/queries/conditionLogs.ts`, `missionEvents.ts` |
| Timeline UI | `ObservingTimeline.tsx` |
| Setup/Capture | `SetupView`, `CapturingView`, mission page |
| Session | `sessions/[id]/page.tsx` |

## Local vs hosted

- Local: all migrations through `20261011210000_mission_events_checklist` applied (`supabase migration list --local`).
- Hosted project `iyabzjyyfzdodmedpgfx` (Parallax) is **paused**. Unpause in the dashboard, then `supabase link --project-ref iyabzjyyfzdodmedpgfx` and `supabase db push` before claiming prod durability.
