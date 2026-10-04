# Supabase Auth — acceptance checklist

Run after migrations + app wiring. Local: `enable_confirmations = false`.

## Checks

- [x] Create account A at `/auth/sign-up`; lands in app (or sign-in if confirmations on)
- [x] Sign out from `/user`; redirected to `/auth/sign-in`
- [x] Sign in as A; session survives full page refresh
- [x] A sees own locations/gear (Settings) and sessions (`/sessions`) after refresh
- [x] Create account B; B does not see A’s locations/gear/sessions
- [x] Unauthenticated visit to `/dashboard` redirects to sign-in
- [x] Forgot password → Inbucket link → `/auth/reset-password` updates password
- [x] Expired/invalid confirm link shows clear error on sign-in
- [x] Mission → Save Log still creates/updates one session for A
- [x] Grep clean: no `local-token`, `mintLocalJwt`, `@clerk` in app source
- [x] SQL fixture RLS: user A sessions=1, A sees B sessions=0, wrong sub=0
- [x] Manual verification complete across accounts (2026-10-03)

## Phase D.1 — Mission list SoT

- [x] `listMissions` + `getMissionWithTargets` + mapper
- [x] Zustand in-memory only; `clearMissions` on sign-out / user change
- [x] AuthProvider hydrates missions on sign-in
- [x] Detail loads from DB when store miss
- [x] Post-Setup cancel soft-deletes in DB
- [x] Manual: A saves (Setup+), refreshes, sees mission with targets/phase
- [x] Manual: A sees mission in fresh browser after sign-in
- [x] Manual: B sees none of A’s missions; A→B switch shows no A mission
- [x] Manual: Save Log still one session; planning cancel creates no DB row
- [x] Manual verification complete (2026-10-03)
