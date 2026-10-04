# Parallax audit and build plan

**Summary:** Code audit of the mocked Parallax app (Next.js App Router under `app/`, not `src/app`). Counts: **~12 high-impact dead ends**, **~6 duplicate action clusters**, **~5 orphan surfaces**, **~15 CUT/MERGE candidates**. Design baseline = Tonight/dashboard styling (no official brand doc). Against that baseline: **2 KEEP AS IS**, **8 RESTYLE**, **5 REDESIGN**, **2 redirect stubs**. Sessions single source of truth = DB `sessions` written from mission Save Log (full cutover in Phase D). Build order: **A (trimmed) → C → D → B+E → Phase 5 checks**. Astronomy Engine, Open-Meteo, 7Timer, Claude API, and Electron stay out of scope until after D.

**Inputs:** `/Users/eddwordd/Documents/Codex/2026-10-03/ew/outputs/parallax-project-start.md`, `/Users/eddwordd/Documents/Codex/2026-10-03/ew/outputs/parallax-frontend-audit.md`. Brand: Tonight dashboard system (user directive; `docs/parallax-brand.md` does not exist).

**Preserve:** uncommitted local edit in `app/(app)/user/page.tsx`.

---

## Changes from previous plan

1. **Phase order** — Was A → B → C → D → E. Now **A (trimmed) → C → D → B+E merged → Phase 5**. Why: real data before design polish; tokens/pages after the slice.
2. **Phase A trimmed** — Removed “unify session write into one client store mirroring SoT” (throwaway; D replaces sessions entirely). Removed design-token work except emergency CTA-token fix if purple/indigo breaks a primary flow. Why: avoid dual work before cutover.
3. **Phase C Zod location** — Was `packages/shared-types`. Now **`src/lib/schemas/`** inside the app. Why: no monorepo restructure until later MCP extraction.
4. **Phase C tables** — Dropped separate `telemetry_events` table; telemetry events live in **`condition_logs`** as timestamped rows. `user_preferences` narrowed to `default_min_altitude`, `default_moon_tolerance`, `units`. Why: match kept flows and time-series model.
5. **Schema gaps locked** — `missions.objective` = Deep Integration / Survey Night / Quick Session; `mission_targets.planned_iso_gain`; `sessions.session_software` = NINA / ASIAIR / Ekos; `condition_logs` time-series including telemetry event types. Why: resolve historical roadmap gaps.
6. **No targets table** — `catalog_id TEXT` only; OpenNGC embedded JSON offline-first. Why: catalog is not user DB data.
7. **No stored integration minutes** — Derived only. Why: avoid drift from frames × exposure.
8. **Missions persist from Setup onward** — Planning-stage cancels write nothing. Why: draft noise out of DB.
9. **Soft delete** — Only where justified below; not blanket. Why: append-only logs vs reusable profiles.
10. **RLS** — Document Clerk JWT `sub` + `role: authenticated` per current Clerk/Supabase native integration (not deprecated JWT template). Verify wrong-claim empty results explicitly.
11. **Outcome grade** — **Decided: Option C** (numeric `outcome_score` 1–10; label derived in UI, not stored). See Decisions.
12. **Phase D full cutover** — Delete `MOCK_SESSIONS` and any Zustand session source; idempotent Save Log upsert; Zod at DB boundary; `lib/supabase/queries/` data-access layer.
13. **Phase B+E merged after D** — Tokens then pages one-at-a-time on real data.

---

## Decisions required from Edward

### 1. Session outcome grade scale — DECIDED

**Choice: Option C — numeric score + label derived in UI.**

| Locked for Phase C | Spec |
|--------------------|------|
| Column | `sessions.outcome_score smallint not null` (nullable only if you later allow draft sessions; default for Save Log: required) |
| Range | **1–10** inclusive (`check (outcome_score between 1 and 10)`) |
| Label | **Not stored** — UI maps score → display string (replace current A–F in `src/types/session.ts:6` / `SessionHistoryCard` during D or B+E) |
| Zod | `z.number().int().min(1).max(10)` in `src/lib/schemas/session.ts` |

**Still open (non-blocking for migration):** written rubric for what 1 vs 10 means in the field — document before Insights charts ship. Rejected options A (qualitative enum) and B (letter grades).

### 2. Dashboard declutter timing

Frontend audit flagged competing mission entry paths on Tonight (`parallax-frontend-audit.md`). Recommend: KEEP structure through A/C/D; only REDESIGN dashboard in B+E if you say yes. Tradeoff: faster slice vs clearer UX earlier.

### 3. Standalone `/sessions/new` after cutover

Recommend: hide or remove as primary path once mission→session works; optional later “log without mission.” Tradeoff: loses quick log UX.

### 4. Skymap / Insights in nav during A–D

Recommend: KEEP nav links; no redesign until B+E last. Tradeoff: nav noise vs discovery.

### 5. Auth before vs with Phase D

Repo has no Clerk/Supabase packages today (`parallax-project-start.md:16`). Phase D needs auth gate + JWT. Confirm Clerk app + Supabase third-party provider are ready before D verify.

---

## Brand baseline (substitutes parallax-brand.md)

Canonical surface: `app/(app)/dashboard/page.tsx` + AppShell + `dash-*` utilities in `app/globals.css`.

| Role | Value | Citation |
|------|-------|----------|
| App background | `#05070a` | `app/globals.css:5` |
| Brand mark (rail only) | `#d25e36` | `src/components/LeftRail.tsx:56` |
| Interactive accent | indigo-500 / `--dash-accent` | `app/globals.css:454`; `Button` `cta` in `src/components/ui/button.tsx:11` |
| Card shell | `rounded-lg border border-zinc-800/60 bg-zinc-900/50` | e.g. `src/components/dashboard/DashboardMissionStatusCard.tsx:82` |
| Section title | `.dash-section-title` | `app/globals.css:441-443` |
| Page stack | `space-y-4`; shell `main` `p-4`; no max-width on Tonight | `src/components/AppShell.tsx:19`; `app/(app)/dashboard/page.tsx:287` |
| Fonts | Exo 2 body, Orbitron display | `app/layout.tsx` (font vars) |
| Field mode | `data-theme="field"` + crimson token remap | `src/components/ThemeProvider.tsx:15-20`; `app/globals.css:462+` |

**Accent conflict (known):** Rail terracotta vs Tonight indigo vs mission purple CTA (`app/globals.css:368-371`). Winner for app chrome: **Tonight indigo + zinc cards**; terracotta = brand mark only. Mission purple resolved in B+E (or emergency CTA-only fix in A if a primary flow is broken).

---

## PHASE 0: Inventory

### 0.1 Routes (`app/`)

| URL | `page.tsx` | Notes |
|-----|------------|-------|
| `/` | yes | `redirect("/dashboard")` — `app/page.tsx:4` |
| `/dashboard` | yes | Tonight home |
| `/missions` | yes | list |
| `/missions/new` | yes | wizard |
| `/missions/[id]` | yes | phase console |
| `/missions/[id]/log` | **NO** | empty directory only (`app/(app)/missions/[id]/log/` — no page file) |
| `/targets`, `/targets/[id]` | yes | |
| `/sessions`, `/sessions/new`, `/sessions/[id]` | yes | |
| `/skymap`, `/insights` | yes | |
| `/locations`, `/gear` | yes | `router.replace("/settings")` — `locations/page.tsx:10`, `gear/page.tsx:10` |
| `/settings`, `/help`, `/user` | yes | |
| `loading.tsx` / `error.tsx` / `not-found.tsx` | none under `app/` | |

Layout: `app/layout.tsx`, `app/(app)/layout.tsx` → `AppShell`.

Nav: Tonight, Missions, Targets, Sky Map, Sessions, Insights + Help/Settings/User — `src/components/LeftRail.tsx:21-28,90-92`.

### 0.2 Interactive elements (high-signal)

Full status legend: **works** | **mock** | **no-op** | **missing route** | **partial**.

| Label | File:line | Handler / href | Today |
|-------|-----------|----------------|-------|
| Add to Tonight Plan | `app/(app)/targets/[id]/page.tsx:60` | bare `<Button>` | **no-op** |
| Log this target | `targets/[id]/page.tsx:61-62` | `/sessions/new?target=` | navigates; save is mock |
| Add to Plan | `RecommendedTargetCard` → dashboard `addToPlan` | store | works (client plan) |
| Start Mission (rec card) | dashboard `handleStartMission` | create + setActive | **partial** — no `router.push` |
| Plan My Night | dashboard `handleBuildOptimalMission` | create optimal | **partial** — no navigate |
| Start Planned Mission | dashboard → mission page | create + navigate | works |
| Log Results | `DashboardMissionStatusCard.tsx:287-290` | `/missions/${id}/log` | **missing route** |
| Last Session View | `SessionHistoryCard.tsx:17-19,77-80` | `/missions/.../log` if `missionId` | **broken** for `s1` (`sessionHistory.ts:33`) |
| Add location submit | `LocationsSection.tsx:126-128` | `handleClose()` only | **no save** |
| Add gear submit | `GearProfilesSection.tsx:132-136` | `handleClose()` only | **no save** |
| Save session | `SessionForm.tsx:34-36` | toast | **mock only** |
| Save Log | `missions/[id]/page.tsx:290-299` | status complete + toast | **partial** — LoggingView local state discarded |
| End Session | mission page | phase → logging | works |
| User Upgrade | `user/page.tsx:48-53` | `href="#"` | **no-op** |
| Sign out / Delete account | `user/page.tsx` | none | **no-op** |
| Field Mode toggle | `FieldModePopover` → store | ThemeProvider | works (color) |
| redSafe | `FieldModePopover.tsx:94-98` | store only | **no consumers** |
| Setup field match / Override | `SetupView.tsx:376-391` | none | **no-op** |
| RigSetup Log val ×3 | `RigSetupCard.tsx` | none | **no-op** |

Shell links (Tonight → User) navigate to existing pages — works. Settings preference toggles (offline/AI/telemetry) are local React state only — `settings/page.tsx:20-26,125-166`.

### 0.3 Mock data sources

| Source | Readers | Writers |
|--------|---------|---------|
| `src/lib/mock/locations.ts` (`MOCK_LOCATIONS`) | dashboard, missions, sessions, ContextChipsBar, etc. | none |
| `src/lib/mock/gear.ts` (`MOCK_GEAR`) | missions, ContextChipsBar, GearProfilesSection, etc. | none |
| `src/lib/mock/targets.ts` | LiveSkyView, recommendations | none |
| `src/lib/mock/night.ts`, `targetWindows.ts` | timelines, LiveSkyView | none |
| `src/lib/mock/sessionHistory.ts` (`MOCK_SESSIONS`) | sessions pages, SessionHistoryCard | none — **cut in D** |
| `src/lib/mock/skyIntelligence.ts` | SetupView, sessions, dashboardData | none |
| `src/lib/mock/intelligenceLayer.ts` | dashboard, insights | none |
| `src/lib/mock/exposurePlans.ts`, `sessionSimulations.ts`, `availableTargetsForMission.ts` | mission detail | none |
| `src/lib/mock/missions.ts` (`generateMockPlan`) | missions/new → `addMission` | Zustand write |
| `src/lib/mockMissionData.ts` | SetupView, SelectedTargetCard, ContextDrawer | none |
| `src/lib/mockForecast.ts` | missionUIStore, ConditionsCard | none |
| Inline mocks | skymap page, LoggingView `MOCK_FRAME_COUNTER`, dashboard `MOCK_IS_LIVE_CONNECTED` | local |

**Orphan mocks:** `src/lib/sky/mockSkyData.ts` (no importers); `generateMockSessions` in `src/lib/mock/sessions.ts` (barrel only); `getMockNightHealth` / `getMockAdaptiveAdvice` in `fieldOps.ts` (type-only import in NightHealthCard).

### 0.4 Zustand / client stores

| Store | Holds | vs database |
|-------|-------|-------------|
| `useAppStore` (`src/lib/store.ts:29`) | active location/gear, datetime, altitude/moon filters, field mode | prefs → `user_preferences` + active FKs; field mode may stay client |
| `useMissionStore` (`src/lib/missionStore.ts:21`) | `missions[]`, `activeMissionId` | → `missions` / `mission_targets` from Setup onward |
| `useDashboardRecommendationStore` (`dashboardRecommendationStore.ts`) | tonight plan ids | ephemeral UI only — keep Zustand |
| `missionUIStore` (Context + reducer, not Zustand) | forecast UI, guidance flags | client only |

**Duplicate session entity:** `MOCK_SESSIONS` + `Session` (`src/types/session.ts`) vs mission Save Log / `SessionLog` (`src/lib/types.ts:62-85`) vs LoggingView local state. Phase D eliminates mock/Zustand session sources.

---

## PHASE 1: Dead ends and duplicates

### Dead ends

| Item | Severity | Evidence |
|------|----------|----------|
| Log Results → `/missions/[id]/log` | **blocks core flow** | `DashboardMissionStatusCard.tsx:287-290`; empty `log/` dir |
| Last Session View → `/log` when `missionId` set | **blocks core flow** | `SessionHistoryCard.tsx:17-19`; `sessionHistory.ts:33` |
| Save Log drops LoggingView fields | **blocks core flow** | `missions/[id]/page.tsx:290-299` |
| Add to Tonight Plan no-op | **blocks core flow** | `targets/[id]/page.tsx:60` |
| Location/gear Add closes without save | **blocks core flow** | `LocationsSection.tsx:126-128`; `GearProfilesSection.tsx:132-136` |
| SessionForm mock-only + separate history | **blocks core flow** | `SessionForm.tsx:34-36`; `sessions/page.tsx` reads `MOCK_SESSIONS` |
| Dashboard Start Mission / Plan My Night no navigate | **confusing** | dashboard handlers |
| `/gear` `/locations` no tab deep-link | **confusing** | redirect to `/settings` root |
| Settings offline/AI/telemetry imply behavior | **confusing** | local state only |
| Setup match/override; RigSetup Log val | **confusing** | no handlers |
| User account CTAs | **cosmetic** | no-op / `#` |
| redSafe unused; reduceMotion barely wired | **cosmetic** | `FieldModePopover`; `missions/[id]/page.tsx:439,442-445`; MissionTimeline prop unused |

### Duplicate actions

| Job | Surfaces | Direction |
|-----|----------|-----------|
| Start / create mission | Create Mission, Start Mission (rec), Plan My Night, Start Planned Mission, mission Start | MERGE: wizard + plan→mission that always navigates |
| Add to tonight | dashboard Add to Plan vs broken target CTA | MERGE into `useDashboardRecommendationStore` |
| Log session | SessionForm, target Log, mission Save Log, broken Log Results, orphan ContextDrawer | MERGE into mission Save Log → `sessions` (D) |
| Open gear/locations | Settings tabs vs `/gear` `/locations` | KEEP redirects; fix labels/deep-link |

### Orphans

| Surface | Evidence |
|---------|----------|
| `ContextDrawer.tsx` | never imported by pages |
| `CaptureRunSheetCard.tsx` | unused export |
| `ConnectivityPopover.tsx` | unused export |
| Empty `missions/[id]/log/` | no `page.tsx` |
| Orphan mocks | see 0.3 |

### Non-essential UI (vs four questions + PLANNING→LOGGING)

Demote until after D: Insights chart primary work, Skymap as peer nav competitor, settings offline/AI/telemetry, user Upgrade, Live Site mock telemetry (`dashboard/page.tsx:112`), NASA placeholder on target detail, unused rejected-target drawer wiring from dashboard.

---

## PHASE 1B: Design consistency (Tonight baseline)

### Token drift

- Hardcoded rail/brand hex: `LeftRail.tsx:46,56`.
- Dashboard indigo vs `--theme-accent` cyan (`globals.css:20`) vs mission purple CTA (`globals.css:368-371`).
- Arbitrary sizes: frequent `text-[9px]`–`text-[13px]` in mission views; chart hex clusters on insights/sessions/skymap.
- Tokens exist (`--theme-*`, `--dash-*`) but normal-mode components mostly use zinc/indigo Tailwind, not CSS vars.

### Component drift

| Pattern | Winner |
|---------|--------|
| Buttons | `ui/Button`; `cta` = indigo |
| Cards (app pages) | Tonight zinc shell; not `ui/Card` gradient / `.section-card` until aligned |
| Inputs | `ui/Input`; add Textarea |
| Modals | add `ui/Dialog`; migrate ad-hoc overlays |
| Badges | add `ui/Badge`; keep score/outcome domain wrappers |
| `ui/skeleton` | defined, unused |

### Layout drift

- Shell: `p-4`, collapsed rail margin — `AppShell.tsx:12-19`.
- Mixed max-widths: `user`/`settings` `max-w-2xl`; `help` `max-w-3xl`; `missions/new` `max-w-5xl` + bleed; dashboard none.
- `.page-container` unused (`globals.css:425-427`).
- Mission pages `-m-4` + `mission-space-page` break shell padding.

### State coverage

| Page | Loading / empty / error |
|------|-------------------------|
| `missions/[id]` | loading + not found |
| `missions` | empty state |
| `sessions/[id]`, `targets/[id]` | not found |
| `sessions/new` | Suspense |
| Most others | **happy path only**; no empty-filter UI on targets/sessions |

### Field mode

- Toggle → `useAppStore.isFieldMode` → `ThemeProvider` sets `data-theme="field"` — color/contrast remap only.
- `dimLevel`: black overlay on mission detail only (`missions/[id]/page.tsx:442-445`).
- `reduceMotion`: class on mission root; MissionTimeline prop not applied.
- `redSafe`: **dead control**.
- **No** tap-target, density, or typography scale changes gated on field mode.

### Responsiveness

- Breakpoints on: dashboard, missions list/new/[id], sessions/[id], targets/[id], insights.
- **None** on: user, settings, help, targets list, sessions list, sessions/new, skymap (flex-wrap only).
- No `xl:` / `2xl:` in repo.

### Page scores vs Tonight

| Route | Score | Verdict | Evidence |
|-------|-------|---------|----------|
| `/`, `/dashboard` | 5 | **KEEP AS IS** | `dashboard/page.tsx:287-289` |
| `/missions` | 3 | **RESTYLE** | `ui/Card` + teal status vs zinc/dash |
| `/missions/new` | 1 | **REDESIGN** | `mission-space-page` + purple CTA |
| `/missions/[id]` | 1 | **REDESIGN** | same mission chrome |
| `/targets`, `/targets/[id]` | 2 | **REDESIGN** | `text-2xl font-bold` + `ui/Card` |
| `/sessions`, `/sessions/new` | 2 | **RESTYLE** | bold H1, non-dash cards |
| `/sessions/[id]` | 3 | **RESTYLE** | mixed dash + bold H1 |
| `/insights` | 3 | **RESTYLE** | partial dash + cyan charts |
| `/skymap` | 2 | **REDESIGN** | bold H1 + canvas blues |
| `/settings` | 3 | **RESTYLE** | indigo tabs OK; bold H1 + `ui/Card` |
| `/user`, `/help` | 2 | **RESTYLE** | bold H1 + `ui/Card` |
| `/gear`, `/locations` | — | **KEEP AS IS** | redirects |

**Counts:** RESTYLE **8** · REDESIGN **5** · KEEP **2** (+2 stubs).

---

## PHASE 2: KEEP / MERGE / CUT / FINISH

**Sessions SoT (locked):** Database table `sessions` (+ `session_targets`), written by idempotent Save Log from the mission logging phase. Sessions list/detail and Last Session read **only** that. Why: core flow is PLANNING→LOGGING; history must not diverge (`MOCK_SESSIONS` vs mission store). Phase D deletes mock/Zustand session sources — no dual-write.

| Flag | Decision | Reason |
|------|----------|--------|
| Log Results `/log` | **FINISH** | Route to mission logging phase; remove empty dir |
| SessionHistory View | **FINISH** | `/sessions/[id]` or mission logging — never missing `/log` |
| Save Log discarding fields | **FINISH** (in D) | Persist LoggingView → DB upsert |
| Add to Tonight Plan | **FINISH** | Wire `addToPlan` + feedback |
| Location/gear Add | **FINISH** | Persist (mock list in A if needed for walk; DB in D) |
| Throwaway client session store | **CUT from A** | D is full cutover |
| Standalone SessionForm primary | **CUT** (nav demote) until post-D decision | Avoid second history |
| `/sessions` history | **KEEP** | Reads DB after D |
| Start Mission / Plan My Night no nav | **FINISH** | Always navigate after create |
| Mission entry CTAs | **MERGE** | Wizard + start-from-plan |
| ContextDrawer / CaptureRunSheet / ConnectivityPopover | **CUT** | Orphans |
| Orphan mocks | **CUT** | Unused |
| User Upgrade/Sign out/Delete | **CUT** until auth UX | Preserve other user page edits |
| Settings offline/AI/telemetry | **CUT** or label prototype | No false capability |
| Insights / Skymap | **KEEP** nav; redesign last in B+E | After slice |
| Mission purple chrome | **REDESIGN** in B+E | Align Tonight; A only if CTA breaks flow |
| List pages bold H1 + ui/Card | **RESTYLE** in B+E | dash titles + zinc shells |
| Dashboard structure | **KEEP AS IS** pending Decision 2 | |
| Field redSafe / reduceMotion | **FINISH or CUT** control | Wire or remove |

---

## PHASE 3: Schema (kept flows only) — Phase C

Migrations: `supabase/migrations/*`. Zod: **`src/lib/schemas/`** (not `packages/shared-types`). No targets table.

### Clerk ↔ Supabase RLS (cite current docs)

Source (checked for this plan): [Clerk — Integrate Supabase with Clerk](https://clerk.com/docs/integrations/databases/supabase) (native third-party auth; JWT template deprecated as of 2025-04-01). Companion: Supabase third-party Clerk guide.

**Mapping:**

1. Activate Clerk’s Supabase integration so session tokens include `"role": "authenticated"`.
2. In Supabase Dashboard → Authentication → Sign In / Providers → add **Clerk** with the Clerk domain.
3. App client passes Clerk session token via Supabase `accessToken: () => session.getToken()` (or server `(await auth()).getToken()`).
4. Store Clerk user id in `user_id text` columns. Default insert: `auth.jwt()->>'sub'`.
5. RLS policies compare `(select auth.jwt()->>'sub') = user_id` for `select` / `insert` / `update` / `delete`, `to authenticated`.
6. **Do not use `auth.uid()`** for Clerk — that expects Supabase Auth UUIDs; Clerk ids are strings in `sub` (Clerk docs + blog guidance).

**Risk:** Wrong/missing `role` or `sub` → queries return **empty arrays with no error**. Verify must: (a) two-user fixture isolation; (b) deliberately broken token/claim → empty or auth error, and the test **asserts** emptiness / failure rather than treating empty as “no data yet.”

### Tables

#### `locations`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text not null | `auth.jwt()->>'sub'` |
| name | text | |
| lat, lon | double precision | |
| bortle | smallint | |
| notes | text null | |
| deleted_at | timestamptz null | **soft delete** — see below |
| created_at, updated_at | timestamptz | |

#### `gear_profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text not null | |
| name, telescope_name, camera_name | text | |
| focal_length, aperture | numeric | |
| sensor_preset | text | apsc / full_frame / m43 / 1inch |
| pixel_size | numeric null | |
| mount_type | text | |
| guiding | boolean | |
| is_active | boolean | |
| deleted_at | timestamptz null | **soft delete** |
| created_at, updated_at | timestamptz | |

#### `missions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text not null | |
| name | text | |
| date_time | timestamptz | |
| location_id | uuid FK → locations | |
| gear_id | uuid FK → gear_profiles | |
| mission_type | text null | deep_sky / planetary |
| **objective** | text null | **`deep_integration` \| `survey_night` \| `quick_session`** (labels: Deep Integration / Survey Night / Quick Session). Wizard UI already uses these values (`missions/new/page.tsx:34-38`). **`MissionConstraint.objective` in `types.ts:113` is stale** (`wide_field_nebula` / `galaxy_hunt` / …) — align the type to the wizard/schema in FINISH/D |
| status | text | |
| phase | text | planning / setup / capturing / logging / completed |
| current_target_catalog_id | text null | catalog id, not FK |
| notes | text null | |
| cancelled_reason | text null | |
| log_locked | boolean default false | |
| deleted_at | timestamptz null | **soft delete** — see below |
| created_at, updated_at | timestamptz | |

**Persist rule:** Rows are written when the mission enters **Setup** (or later). Cancelling in **Planning** writes nothing (matches delete-on-cancel behavior in `missions/[id]/page.tsx:251-257`).

#### `mission_targets`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| mission_id | uuid FK → missions on delete cascade | |
| user_id | text not null | denormalized for RLS simplicity |
| **catalog_id** | text not null | OpenNGC / embedded catalog id — **no FK** |
| target_name | text | |
| target_type | text | |
| planned_window_start/end | text or timestamptz | match app |
| score | numeric | |
| sequence_index | int null | |
| role_label | text null | |
| is_fallback | boolean | |
| captured | boolean | |
| result | text null | success / partial / failed |
| sub_length | numeric null | seconds |
| frames | int null | |
| notes | text null | |
| **planned_iso_gain** | text null | maps UI `isoGain` (`types.ts:141`) |
| altitude_score, moon_separation_score, rig_framing_score | numeric null | |
| why_included | text null | |

No `deleted_at` — lifecycle follows parent mission.

#### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text not null | |
| mission_id | uuid FK → missions | unique for idempotent Save Log (one session per mission) |
| location_id | uuid FK → locations | |
| started_at, ended_at | timestamptz null | |
| **outcome_score** | smallint not null | **1–10**; UI label derived, not stored (Decision C) |
| what_i_learned | text null | |
| **session_software** | text null | **`nina` \| `asiair` \| `ekos`** (NINA / ASIAIR / Ekos) |
| deleted_at | timestamptz null | optional soft delete — see below |
| created_at, updated_at | timestamptz | |

#### `session_targets`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| session_id | uuid FK cascade | |
| user_id | text not null | |
| **catalog_id** | text not null | no FK |
| target_name | text | |
| frames_captured | int | |
| exposure_seconds | numeric | |
| iso | int null | |
| gain | numeric null | |
| notes | text null | |

**Derived (never stored):** integration minutes = `frames_captured * exposure_seconds / 60`. Session totals and success rates computed in queries/UI.

#### `condition_logs` (time-series + telemetry)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text not null | |
| mission_id | uuid null FK | |
| session_id | uuid null FK | |
| **recorded_at** | timestamptz not null | per-entry timestamp |
| source | text | `forecast` \| `live` \| `manual` \| `telemetry` |
| event_type | text null | for telemetry: e.g. `guiding_started`, `guiding_failed`, `focus_drift`, `sequence_resumed`; null for plain condition samples |
| payload | jsonb not null | clouds, seeing, wind, guide_rms, etc. |

No soft delete — append-only audit/time-series. **No separate `telemetry_events` table.**

#### `user_preferences`

| Column | Type | Notes |
|--------|------|-------|
| user_id | text PK | Clerk `sub` |
| default_min_altitude | numeric | |
| default_moon_tolerance | numeric | |
| units | text | e.g. metric/imperial — exact enum at implement time |
| updated_at | timestamptz | |

### Soft delete — where and why

| Table | Soft delete? | Why |
|-------|--------------|-----|
| `locations` | **yes** `deleted_at` | Historical missions/sessions still reference site; hide from pickers without breaking history |
| `gear_profiles` | **yes** `deleted_at` | Same for rig references |
| `missions` | **yes** `deleted_at` | User can archive a mission without destroying linked session history |
| `sessions` | **yes** `deleted_at` | Optional hide from history UI while retaining condition_logs linkage |
| `mission_targets`, `session_targets` | **no** | Cascade with parent |
| `condition_logs` | **no** | Append-only time-series |
| `user_preferences` | **no** | Upsert row per user |

### Zod layout (`src/lib/schemas/`)

Example files (inferred types, no `any`):

- `location.ts`, `gear.ts`, `mission.ts`, `session.ts`, `conditionLog.ts`, `userPreferences.ts`, `catalogId.ts`
- Export `z.object({...})` + `export type X = z.infer<typeof XSchema>`
- Parse at DB boundary in `lib/supabase/queries/*` (Phase D)

### Tables no kept flow needs (do not create)

- `targets` / catalog tables in Postgres
- Separate `telemetry_events`
- Insights aggregate tables
- Sky map constellation tables

**Note on objective types:** Select options match schema (`missions/new/page.tsx:34-38`). Stale pieces to fix in FINISH/D: default state still `"galaxy_hunt"` (`missions/new/page.tsx:85`) and `MissionConstraint.objective` union (`types.ts:113`). Schema/wizard option list wins.

---

## PHASE 4: Build phases

**Order:** A → C → D → B+E → Phase 5 manual checks.

**Global out of scope until after D:** Astronomy Engine, Open-Meteo, 7Timer, Claude API, Electron.

### Phase A — Dead-end fixes and cuts (trimmed)

- **Goal:** Primary CTAs advance the mock flow or are removed; orphans gone; empty log dir handled; user page edit preserved.
- **Keep in scope:** Fix dead CTAs (Add to Tonight Plan, Log Results destination, Last Session View, navigate after dashboard mission create, location/gear form behavior enough for the walk); cut orphan components/mocks; delete or stop linking empty `log/` dir; preserve `user/page.tsx` uncommitted edit (cut only inert Upgrade/Sign out/Delete if touching that file).
- **Out of scope for A:** Unifying session writes into a client SoT store; design-token pass. **Exception:** if purple vs indigo mission CTA tokens break a primary flow, fix **only those CTA tokens** and note it in the PR.
- **Data:** Still mock / existing Zustand missions + `MOCK_SESSIONS` as today (no throwaway session store).
- **Risk:** Breaking dashboard mission entry expectations; accidental overwrite of user page edit.
- **Verify:** Manual walk on mock data: **Add to Plan → Start Planned Mission → End Session → Save Log** still completes without 404.
- **Explicitly out:** Supabase, Zod package moves, page redesigns, session DB cutover.

### Phase C — Schema + RLS

- **Goal:** Migrations + in-app Zod schemas + RLS for tables above; include `sessions.outcome_score` 1–10 (Decision C).
- **Files:** `supabase/migrations/*`, `src/lib/schemas/*`.
- **Data:** SQL fixtures only (two Clerk-like `user_id` strings).
- **Risk:** Wrong JWT claim mapping → **empty results, no error**.
- **Verify:**
  1. Fixture: User A location/gear/mission/session (and condition_log) visible to A.
  2. Same queries as User B → **zero rows**.
  3. Deliberately wrong/missing `sub` or `role` → empty or auth failure; test **fails closed** and is observable (assert row count 0 or error code — do not treat as success).
- **Out of scope:** UI wiring, engines, monorepo packages.

### Phase D — Vertical slice (full cutover)

- **Goal:** Create mission → save session → appears in Sessions history from **real DB** → survives refresh.
- **Sessions cutover:** Delete `MOCK_SESSIONS` and any Zustand session source. No dual-write. Zustand remains for **transient UI only** (tonight plan, field mode, drawers).
- **Save Log:** **Idempotent upsert** keyed by `mission_id` (unique) — saving twice → one session row.
- **Include:** Supabase client (Clerk `accessToken`), auth gate, mission create/save from Setup onward, LoggingView persist, sessions list/detail readers, **`src/lib/supabase/queries/`** (one place for DB access), Zod validate at DB boundary.
- **Files (expected):** client helpers, queries for locations/gear/missions/sessions, mission logging path, `app/(app)/sessions/*`, remove `src/lib/mock/sessionHistory.ts` usage.
- **Risk:** Leftover mock imports; RLS silent empty; non-idempotent insert duplicates.
- **Verify:** Fresh user → add location + gear → create mission → log session → `/sessions` shows row → refresh persists → Save Log twice = **one** row → second user sees **zero** rows.
- **Out of scope:** Astronomy Engine, Open-Meteo, 7Timer, Claude API, Electron, Insights math, Skymap real data.

### Phase B + E — Design system + page redesigns (merged, after D)

- **Goal:** Tokens + shared components first, then pages one at a time on **real data**.
- **Order:** Tokens/components → pages: dashboard **only if** declutter decision = yes, else skip → mission detail → mission new → targets → sessions → settings → help/user → insights/skymap last.
- **Each page:** RESTYLE or REDESIGN per Phase 1B table.
- **Risk:** Half-migrated mission chrome if tokens land without page pass — accept short inconsistency; do not redesign before tokens.
- **Verify:** Per-page visual pass in normal + field mode after each page.
- **Out of scope:** New features; engine integrations.

---

## PHASE 5: What code alone couldn't check

*(Unchanged list.)*

- Layout at desktop vs field/mobile widths (visual density)
- Red-tone field mode on real displays (readability)
- Runtime errors / hydration
- Whether dashboard clutter is “ugly” vs merely busy (needs your eyes)
- Mission create/detail full-bleed space background at narrow widths
- Touch targets in field with gloves
- Empty-filter UX on targets/sessions when filters exclude all
- Actual 404 behavior for `/missions/*/log` in Next runtime
- Preserved uncommitted `app/(app)/user/page.tsx` intent

---

## Appendix: citation index for known suspects

| Claim | Citation |
|-------|----------|
| Add to Tonight Plan no-op | `app/(app)/targets/[id]/page.tsx:60` |
| Log Results missing route | `src/components/dashboard/DashboardMissionStatusCard.tsx:287-290` |
| Empty log directory | `app/(app)/missions/[id]/log/` (no page) |
| Location form no save | `src/components/LocationsSection.tsx:126-128` |
| Gear form no save | `src/components/GearProfilesSection.tsx:132-136` |
| SessionForm mock | `src/components/SessionForm.tsx:34-36` |
| MOCK_SESSIONS | `src/lib/mock/sessionHistory.ts:30` |
| Save Log incomplete | `app/(app)/missions/[id]/page.tsx:290-299` |
| Planning cancel deletes locally | `app/(app)/missions/[id]/page.tsx:251-257` |
| Field mode color only | `src/components/ThemeProvider.tsx:15-20` |
| redSafe unused | `src/components/missions/FieldModePopover.tsx:94-98` (no other consumers) |
| Clerk Supabase RLS pattern | https://clerk.com/docs/integrations/databases/supabase |

---

*End of plan. No implementation in this pass — document only.*
