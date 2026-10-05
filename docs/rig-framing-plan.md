# Rig Framing + Gear Profiles Plan

**Status:** Implemented (v1 — framing evidence; ranking-by-framing deferred)  
**Preserve:** Auth, Supabase RLS isolation, mission persistence, forecasts, calculated astronomy, Save Log → Sessions, altitude/Moon ranking, Engine reasoning drawer.

## Intent

Users choose an active rig with trustworthy sensor width/height (and optional reducer/Barlow), then see an honest qualitative FOV-vs-target fit on recommendation tickets and in Why this fits—without inventing catalog sizes, silent APS-C, or a numeric framing score from unverified data. Ranking stays altitude + Moon until a later, separately tested slice.

## Locked defaults

- Fit thresholds: `small_in_frame` if major &lt; 25% of shorter FOV; `tight_crop` if major ∈ (shorter, 1.15×]; `mosaic_needed` if major &gt; 1.15×; else `fits` when major ≥ 25% and ≤ shorter FOV.
- Legacy profiles: no silent mass backfill; match-only “Use verified dims” affordance for known cameras.
- Optics factor: nullable field in v1; unused when null → effective FL = entered focal length.
- Ranking by framing: deferred (follow-up only).

## Slices

1. **Gear workflow** — Edit/Add modal, sensor mm validation, migration, ASI533 bootstrap 11.31×11.31, persist `is_active`.
2. **Rig geometry** — `src/lib/gear/framing.ts` + `npm run test:framing`.
3. **Catalog** — Running Man → NGC 1977; sizeKind/source; cluster vs nebulosity where listed.
4. **UI** — Ticket + drawer evidence; Tonight AI Generated Details (Demo); Engine reasoning kept.
5. **Recommendations** — Framing as evidence only; score/sort unchanged.

## Acceptance

Geometry tests, catalog identity checks, typecheck, visibility/recommendations tests, manual Add/Edit Rig → active → card → drawer → Create Mission Plan → Save Log → Sessions; rig change updates framing only.

## Follow-up (not v1)

Change ranking or exclude targets based on framing once geometry + catalog are validated.

**Apply migration before relying on sensor columns in production:**
`supabase/migrations/20261004220000_gear_sensor_dims.sql`
