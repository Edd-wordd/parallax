# Dashboard Recommendations Plan

**Status:** Implemented — live `generateDeepSkyPlan` recommendations, observing-ticket cards, evidence drawer.  
**Preserve:** uncommitted local work; Auth + Supabase mission SoT (Setup+); Save Log → Sessions; `generateDeepSkyPlan` / `computeSessionAstronomy` / forecast stack.

**Locked defaults (user-approved):**
- Single astronomy source: `generateDeepSkyPlan` with dashboard site + session interval + store constraints.
- Session interval: `sessionStart` = app-store `dateTime`; `sessionEnd` = start + 6h.
- Context change clears `plannedTargets` and recomputes.
- CTAs: **Create Mission Plan** / **Plan Top Targets**.
- Rig framing: **Rig fit not calculated** (no numeric score / Good Framing badge).
- Card concept: **Observing ticket (A)**.

**Decisions approved:**
1. Observing ticket card chrome (concept A).
2. CTA labels Create Mission Plan / Plan Top Targets.
3. Dashboard session end = start + 6h for this phase.

See the approved Cursor plan for full detail (value map, drawer content, sanity checks, acceptance).

## Implementation map

| Piece | Path |
|-------|------|
| Types / mapper | `src/lib/recommendations/` |
| Hook | `src/lib/recommendations/useDashboardRecommendations.ts` |
| Ticket card | `RecommendedTargetCard.tsx` |
| Evidence drawer | `MissionDecisionDrawer.tsx` |
| Section | `TonightRecommendationsSection.tsx` |
| Dashboard wire | `app/(app)/dashboard/page.tsx` |
| Tests | `npm run test:recommendations` |
