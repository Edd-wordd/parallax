# Phase 5 acceptance (manual / visual)

From [`docs/parallax-plan.md`](parallax-plan.md) PHASE 5. Checked 2026-10-18 against current code + local stack (`localhost:3001`, Field Mode on). Screenshots under `.playwright-mcp/phase5-*.png`.

| Check | Result | Notes |
|-------|--------|-------|
| Layout at desktop vs field/mobile widths | **browser pass** | Desktop + 390×844 Create Mission: zinc panels, no space bleed; Settings/Sessions/Insights/Skymap readable. |
| Red-tone field mode on real displays | **browser pass (software)** | Field Mode pressed — crimson remap on chrome/cards. Still **needs eyes** on a physical red-safe display. |
| Runtime errors / hydration | **code + browser pass** | Prefs hydrate from DB; typecheck clean. Skymap WebGL fails in headless Playwright only (expected). |
| Dashboard clutter judgment | **open (Decision 2)** | Structure kept; Live Site Demo labeled. |
| Mission create/detail full-bleed space background at narrow widths | **browser pass** | Create Mission uses Tonight zinc `mission-panel` at 390px (see `phase5-missions-new-mobile.png`). |
| Touch targets in field with gloves | **needs eyes** | Primary CTAs use `Button`; no field-mode density scale yet. |
| Empty-filter UX on targets/sessions | **browser pass** | Sessions empty state + Open missions CTA (`phase5-sessions.png`). |
| `/missions/*/log` 404 behavior | **code pass** | Primary paths no longer link orphan `/log`. |
| User page intent (sign-out) | **code pass** | Sign out wired via AuthProvider; Upgrade/Delete stay cut. |

## Prefs / Settings (this pass)

- Units, min altitude, moon tolerance debounce-upsert to `user_preferences` (Saving… visible in `phase5-settings-prefs.png`).
- Offline / AI / telemetry remain Demo / local-only.
- Failed writes show “Not saved”.

## Insights / Sky Map honesty

- Insights: session-only copy + Demo adaptation block labeled.
- Sky Map: Session context **Calculated** when site is real; globe marked **Demo** (`phase5-skymap.png`).

## Remaining human pass (recommended)

1. Sign in → Settings → Preferences → change units + sliders → refresh → values stick.
2. Confirm field mode on a dim/red-safe display.
3. Unpause hosted project and complete [`hosted-migration-pass.md`](hosted-migration-pass.md).
