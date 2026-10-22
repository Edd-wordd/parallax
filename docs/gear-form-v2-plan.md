# Gear Form v2 — Libraries + Build Sheet

**Status:** Implemented (local + hosted schema verified 2026-10-18)  
**Preserve:** Auth/RLS, framing SoT (FL × optics × sensor mm), Save Log → Sessions, Demo labels, uncommitted prefs/B+E work.

## Goal

Settings → Gear supports **starter kits** (pick OTA + camera → autofill) and **custom builds** (override numbers + DIY mount), without inventing mount PE or accessory physics.

## Path A / Path B (same form)

| Path | Who | UX |
|------|-----|----|
| A — Starter | Pre-built OTA + common camera | Telescope library + camera library; mm fields prefilled; mount stock + tracking |
| B — Custom | DIY motor, odd glass, Franken-rigs | Same fields editable; mount class **custom/DIY**; optional notes + accessory tags |

## v1 fields (this build)

- Telescope library → `telescope_name`, `focal_length`, `aperture` (overridable) — curated list in `knownTelescopes.ts` (refractors, Newts, SCT/EdgeHD, RC, lenses); grow over time
- Camera library → `camera_name`, sensor mm, pixel µm, cooled flag — `knownSensors.ts` (ZWO/QHY/Player One + Sony/Canon/Nikon); grow over time
- Derived display: effective FL, f-ratio (not stored)
- Mount geometry: `equatorial` \| `alt-az` (existing)
- Mount class: `stock` \| `custom_diy` \| `star_tracker`
- Tracking: `none` \| `motorized` \| `guided` → keeps `guiding` boolean in sync (`guided` ⇒ true)
- Accessories tags (optional): `focus_mask`, `flattener_coma`, `dew_control`, `filters_owned`
- `mount_notes` free text

## Checklist notation (Setup)

Focus / Guiding checklist copy notes accessories owned on the rig profile; **advanced layer later** (backfocus, guide-scope geometry, filter-wheel map, mount PE) stays off the form — see Advanced later.

## Next build (gear UX)

- [x] **Searchable telescope / camera pickers** — `SearchableSelect` in Settings → Gear (`src/components/ui/searchable-select.tsx`)

## Advanced later (not this build — keep on checklist)

Do **not** add to gear form yet; remind in Setup / future inventory:

- [ ] Backfocus mm / exact imaging train spacing
- [ ] Guide scope FL + guide camera pixels / OAG detail beyond “guided”
- [ ] Filter wheel slot map + named filters per night
- [ ] Mount payload, PE, encoders
- [ ] Binning / gain presets per camera
- [ ] Multi-camera inventory (main + guide as separate profiles)
- [ ] Ranking targets by framing or mount quality

Setup checklist should **label** polar align, Bahtinov/focus mask, dew, and guiding as field steps — and note that deep accessory inventory is Advanced later.

## Files

| Piece | Path |
|-------|------|
| Migration | `supabase/migrations/20261019010000_gear_build_sheet.sql` |
| Zod | `src/lib/schemas/gear.ts` |
| OTA library | `src/lib/gear/knownTelescopes.ts` |
| Camera library | `src/lib/gear/knownSensors.ts` |
| Optics display | `src/lib/gear/opticsMath.ts` |
| Form UI | `src/components/GearProfilesSection.tsx` |
| Setup copy | `src/components/missions/views/SetupView.tsx` |

## Acceptance

- Pick AstroMaster 130 + A7RII → FL/aperture/sensor autofill; overrides stick on save
- Custom DIY + motorized tracking saves; `guiding` true only when tracking = guided
- Accessory tags persist; list card shows effective FL / f-ratio
- Setup Focus step mentions focus mask; Advanced later listed in this plan
- `npm run typecheck`; local `supabase migration up`
