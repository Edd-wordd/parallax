# Target Explorer + Canonical Catalog Plan

**Status:** Implemented (v1 — curated SoT + real Explorer/detail; OpenNGC CSV expand via scaffold)  
**Preserve:** Auth, Supabase RLS, mission persistence, forecasts, gear/sensor migration, Save Log → Sessions, altitude/Moon ranking, rig-fit evidence, Tonight AI Generated Details (Demo), Engine reasoning. Preserve uncommitted rig-framing work.

## Intent

One trustworthy deep-sky catalog and one calculation path so Explorer, target detail, dashboard recommendations, Create Mission, and saved missions agree on identity, coordinates, visibility, and framing for the same site/date/session/rig.

## Locked defaults

- Catalog: versioned JSON / TS snapshot in repo — **not** Supabase tables.
- Primary facts: OpenNGC (CC BY-SA 4.0) provenance; Messier IDs keep `m*` keys.
- Initial subset: curated deep-sky set with OpenNGC-cited sizes; expand via import script.
- Planets out of Explorer DSO list this phase.
- Beginner → **Bright & large** (`magnitude ≤ 8` and `sizeMajorArcmin ≥ 15`).
- Images v1: curated manifest + fallback; no live free-text NASA search; SkyView later.
- Hosted Supabase not linked — no remote catalog migration claimed.

## Slices

1. Unify catalog source; Explorer/detail leave `MOCK_TARGETS`.
2. Real Visible tonight/session + Recommended / Visible / Unsuitable.
3. Target detail: shared astronomy + framing.
4. Add to Plan for visible-unranked IDs.
5. Image manifest + fallback.
6. Expand subset via OpenNGC import (follow-on growth).

## Acceptance

Catalog identity checks, typecheck, visibility/recommendation/framing/catalog tests, manual consistency across Explorer → detail → dashboard → mission → Sessions.
