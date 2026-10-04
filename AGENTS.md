# Parallax repository guidance

Parallax is a Next.js App Router and TypeScript astrophotography planner. The app routes are under `app/`; shared code is under `src/`.

## Source of truth

- Supabase Auth identifies users. Row-level security must isolate each user's data. Do not reintroduce Clerk or the local-token endpoint.
- Supabase is the source of truth for missions once they enter Setup, and for sessions. Planning-only missions are temporary. Zustand holds transient UI state, not durable user records.
- Astronomy Engine performs sky calculations. Keep calculation logic separate from pages and AI. AI may explain calculated results but must not invent astronomical values.
- Label demo or mock values clearly. Do not present weather forecasts, rig framing, or target scores as measured or calculated when they are placeholders.
- Treat forecast weather, astronomy-specific forecasts, saved site ratings, and calculated sky positions as distinct data sources.

## Workflow

- Read `docs/parallax-plan.md` and the current feature plan before changing a flow. Preserve unrelated staged or uncommitted changes.
- Keep changes focused. Do not silently expand a feature into weather, planetary planning, Electron, or AI work.
- For database changes, use migrations and verify RLS with two users and a wrong or missing identity claim.
- Run `npm run typecheck` for TypeScript, `npm run lint` for lint, and `npm run test:visibility` when astronomy code changes. Run the relevant app flow manually when it spans Auth, missions, Save Log, and Sessions.
- Report which checks ran and any remaining failures. Do not claim a flow is complete based only on a screenshot or a passing unit check.
