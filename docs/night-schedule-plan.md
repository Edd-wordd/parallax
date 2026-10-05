# Night Schedule Plan

**Status:** Implemented (local migration; hosted not claimed)  

**Preserve:** Auth, Supabase RLS, mission SoT (Setup+), Save Log → Sessions, Target Explorer, framing, catalog, Demo AI section, Engine reasoning, uncommitted local work.

## Locked defaults

- Desired imaging duration: **90 minutes** (total on-target; not exposure recipe).
- Transition allowance: **15 minutes** (editable 5–45).
- Session: store `dateTime` + 6h; browser-local times with overnight date labels.
- Scheduler: **user-order earliest-fit** (Approach A). Never silently shorten/drop.
- Rig fit / forecast: warnings only.
- Site timezone column: out of this phase.

## Implementation map

| Piece | Path |
|-------|------|
| Scheduler | `src/lib/schedule/` |
| Tests | `npm run test:schedule` |
| Review UI | `NightScheduleReview.tsx` |
| Store | `dashboardRecommendationStore.ts` |
| Migration | `supabase/migrations/*_mission_schedule.sql` |
