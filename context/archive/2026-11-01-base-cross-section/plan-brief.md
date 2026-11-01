# Base cross-section, the child stays in the base after Mostek, the "Baza" button — Plan Brief

> Full plan: `context/changes/base-cross-section/plan.md`
> Research: `context/changes/base-cross-section/research.md`

## What & Why

Roadmap S-29 (PRD FR-045, FR-046, FR-048): a child who chose the space base sees the base in cross-section (the same four
cells as the house, Mostek framed, the other modules as the pack's airlock with "Wkrótce") and returns to Mostek with one
tap; the room's zoom-out button is named after the building ("Baza" / "Dom"); after Mostek she gets the room celebration
and stays in the base. The roadmap risk is a scene that branches on "house" vs "base" in code; the plan keeps every
difference in the building's data.

## Starting Point

S-23 built one cross-section scene keyed by the saved house id (`HouseScene`, `HouseView`, `houseCells`), and S-28 added
`base-1` with Mostek but no `HOUSE_GEOMETRY` entry, so a base child has no zoom-out today. Four constants are house-only:
the stage background and "Wkrótce" style in `HOUSE_LAYOUT`, the flat `HOUSE_ART` list loaded wholesale, and the label
`pl.house.open = 'Dom'`. `TaskScene.backToChoice` leaves the house scene alive with its "art queued" flag set.

## Desired End State

The base cross-section draws from the base pack's shell and airlock on a `#e8efeb` stage with a dark "Wkrótce", the
house's frame around Mostek; the room shows "Baza" in the base and "Dom" in the house; the Mostek card hides the button,
"Dalej" leaves the child in Mostek with change mode and "Baza"; after "Wróć" from the base to the house the house
pictures load. Save format stays v6.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Where the base differs | Data on `HouseGeometry` (background, teaser, stand-in roof) | One record per building view, `HouseView` stays branch-free | Research R2 / Plan P1 |
| Base art | Two rows in the flat `HOUSE_ART`, filtered by `houseArtKeys` | One precache/smoke list, only one building loaded | Research R3 / Plan P2 |
| Airlock file name | `base-1-cell-closed` | The pack's `cell-closed.png` collides with the house file | Research |
| Size cap | Per building: house 80 000 B, base 110 000 B | Base measured about 102 900 B, runtime load only | Plan P3 |
| Frame in the base | Reuse the house `cell-frame` | The base pack has none; composite reads well | Research R4 |
| Label | `pl.house.open` by house id, `houseLabel` in the room snapshot | FR-048 words; e2e reads it without product code in the e2e phase | Plan P7 |
| Stale scene | Stop the house scene in `backToChoice` AND reset its art flags in `create` | Phaser reuses the scene instance on `start` | Research R5 |
| Stand-in shell | Follow-up 20 taken: numbers in `HOUSE_LAYOUT`, taller roof, no roof for the base | `HouseView` is open anyway | Plan P4 |
| Mostek celebration | Existing card, one tile, "Dalej" stays in Mostek | FR-046 reuses FR-040; author owns the unknown (`[human]` 4.7) | change.md D4 / Plan P6 |
| Save | v6 unchanged | Everything is keyed by the saved `house.id` | Research R6 |

## Scope

**In scope:** base geometry and style as data; base shell and airlock WebP; per-building art filter and caps; label by
building; stale house scene fix (follow-up 17); stand-in follow-up 20; gap rows, follow-ups, CLAUDE.md; visual pass;
one e2e spec with rendered-frame pixels.

**Out of scope:** Hangar or any teaser tile (S-30); a `BaseScene`; new back copy; per-building Hasło words; an
"Obrazki" line or decode console line for house pictures (follow-up 19 re-recorded); save, load path, boot, deploy
scripts.

## Architecture / Approach

`HOUSE_GEOMETRY[house.id]` now carries the whole look; `HouseView` reads it, `HouseScene` loads `houseArtKeys(geometry)`
out of the one `HOUSE_ART` list, `RoomScene` labels its button from `pl.house.open[house.id]`. The base switches on when
its geometry lands (phase 3), together with the stale-scene fix.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Look, label, art keys as data (tdd) | Style fields, label record, `houseArtKeys`, `houseLabel`, stand-in numbers | House look must not change |
| 2. Base pictures and art filter (impl) | Two WebP, two rows, per-geometry filter, per-building caps | `npm run art` needs cwebp + pinned Pillow/numpy |
| 3. Base geometry and stale scene (tdd) | `HOUSE_GEOMETRY['base-1']`, flag reset, house-scene stop | `houseCells` pin flips by design |
| 4. Docs, gaps, follow-ups, sweep, visual (impl) | CLAUDE.md, gaps 195/196/199+, follow-ups, 8 frames × 2 widths | Shared frame may clash in game |
| 5. Browser spec (e2e) | 3 tests: base view, card + stay, house after "Wróć" | Load-sensitive purchase run (7 buys) |

**Prerequisites:** S-28 and S-23 shipped (main `9a44799`); `cwebp`, Python with Pillow 12.1.0 + numpy 2.4.3 for phase 2.
**Estimated effort:** ~5 agent sessions, one per phase; e2e baseline 184 → 187, unit 4171 + N.

## Open Risks & Assumptions

- The house frame on the base shell is judged in the visual pass and by the maintainer (`[human]` 4.8).
- The author may want a teaser or a module card after Mostek (`[human]` 4.7); the plan builds none.
- A base picture that does not decode leaves no console line (follow-up 19, re-recorded).

## Success Criteria (Summary)

- A base child taps "Baza" and sees the base (rendered-frame pixels prove the base stage), taps Mostek and is back.
- After the last Mostek purchase the card hides "Baza"; "Dalej" keeps her in Mostek with change mode and "Baza".
- A child who switches from the base to the house sees "Dom" and the house pictures.
