# Locations + Observing Schedule Plan

**Status:** Implemented (Slice 1 + Slice 2 local; hosted actuals migration not claimed)  
**Preserve:** Supabase Auth/RLS, mission SoT from Setup+, Save Log → Sessions, night schedule, Target Explorer, framing, forecasts as distinct sources, Demo AI labels, uncommitted local work.

## Slices

1. **Locations and dashboard context** — edit locations, GPS-assisted add, bootstrap dedupe, Mission Control real Site/Rig/Date.
2. **Observing actuals** — schedule summary in Capture, planned vs actual recording, empty log defaults, Save Log → Sessions.

## Locked defaults

### Slice 1
- Edit in place (same `location_id`); soft-delete unused duplicates only.
- GPS on Add fills empty lat/lon only; never invents Bortle.
- Bootstrap: single-flight + re-list; placeholder name **My observing site**.
- Mission Control: no MOCK location/gear lookups.

### Slice 2
- Capture schedule text summary (defer MissionTimeline ISO rewrite).
- No fake live telemetry; blank log ≠ 24×120 success.
- Actual times on mission_targets + session_targets; session `result` column.
- Integration = frames × exposure / 60 (derived).

## Migrations

| Slice | Local | Hosted |
|-------|-------|--------|
| 1 | None | None |
| 2 | `*_mission_actuals.sql` | Apply before prod |

## Acceptance

- Edit location persists; Mission Control matches context bar.
- Capture shows planned schedule; Save Log without invented frames; Sessions show actuals.
- `npm run typecheck` + `test:schedule`; manual Setup→Capture→Log→Sessions.
