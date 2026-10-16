# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-new` step of autonomous run `2026-10-15-fix-s16bcd`: the change identity exists with the roadmap claims checked against the repo, the fired follow-ups and six autonomous decisions. Nothing is implemented. The next agent must not get this wrong: the 5 new tasks are APPENDED after the 7 existing ones (order curtains, shelf, lamp, plant-left, pouf) and the save format stays v3 — `SALON_V3_TARGET` in `src/core/migrations/legacySalon.ts` is never edited.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots`, cut from `main` at `a06795b` |
| Commits | 1 on top of main: `docs(salon-extra-slots): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| Progress rows remaining | no `plan.md` yet |
| Working tree | clean after the commit (the maintainer's gitignored `designs/`, `.claude/`, `context/runs/` untouched) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-extra-slots/change.md` | change identity: outcome, binding author decisions, why no save migration, roadmap claim → repo now → correction table, fired follow-ups with scope takes, `## Autonomous decisions` |
| `context/changes/salon-extra-slots/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-extra-slots` (observed) |
| Code gates (lint, typecheck, unit, build, e2e) | not run: docs-only step, no code changed. Baseline on main at a06795b per the contract (inherited, unverified): unit 3063 passed, e2e 117 passed |
| Repo facts in the claim table | observed in this step: `SALON` 6 slots / 4 decor / 7 tasks (`src/data/rooms.ts`); pin test `tests/legacySalonMigration.test.ts` "L-1: the v3 target is the first 7 tasks…" uses `SALON.tasks.slice(0, 7)`; pack manifest has 11 slots (`curtains` y -70 z 3, `wall-shelf` z 18), `layers` = `plant-right` only; `scripts/make-task-art.mjs` reads the room from `designs/martynka-expansion-v1`; `validateSave` checks `chosen` values only |

## 4. Next command

`/10x-research salon-extra-slots`

## 5. Open

Research questions (from `change.md` table):
- Does `designs/martynka-salon-v2/assets/room/furnishings-before.png` (inherited from v1) still show old curtains/lamp/plant/pouf in the "before" look, and is that consistent with the curtain-less `architecture-before`?
- Data model for "shown as variant 0 until bought" (`SlotDef` field vs keeping a `LayerDef`), and its effect on `RoomView.render`, `RoomView.drawRoomMiniature` (is it still used after S-16c's thumbnail?), `roomHit.slotAt`/`holdPoint`, `RoomScene.snapshot`, `src/testing/e2eHook.ts`.
- Negative `y` of the curtains slot in drawing, hit test and thumbnails (`ROOM_LAYOUT.thumbs`).
- `curtains` is also an old v2-only key (`OLD_ONLY_KEYS` in `legacySalon.ts`): confirm `LIFT_V2_SALON` runs only on v2 saves, pin with a test.
- Copy: 5 task labels (accusative), 5 slot captions, 15 variant names from the manifest, `pl.room.decor` entries for moved ids; teacher read of the copy.
- Precache delta of 12 new WebP + 2 replaced scene pictures.
- Side effects on a previously done salon: mode button "Zmień wygląd" hidden and teaser locked until the 12th task.

Follow-ups fired (detail in `change.md` § "Open follow-ups whose trigger this slice fires"): final-art-salon "append at the end" (in scope), M-R4 order guard (in scope), M-6 `check:deploy` room-art count (first half in scope), texture atlas (conditional on budget), F2 / L-4 / L-7 / L-R8 / L-R11 / F1 (conditional on touching their symbols), VO2 / VO1 / VO3 / costs (out, re-triggered). The plan writes the carried ones to `follow-ups/review-fixes.md`.

No DESIGN-GAP added in this step.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (1–6): pack slot ids (`curtains`, `wall-shelf`, `lamp-table`, `plant-left`, `pouf`) — would change if `curtains` is misread on a v3 save; no migration, v3 — would change if a new saved field is needed (then stop at an open PR); pin test made explicit, `SALON_V3_TARGET` untouched — changes only with v4; unbought decoration not holdable — would change if the author expects a tap on the piece; research before plan — fixed by the orchestrator; `MINIGAME_WORDS` unchanged — would change on the author's request.

Also decided here: `/10x-new` would suggest `/10x-plan` by default; the run contract fixes `/10x-research` as the next step (step prompt overrides the skill default). Clipboard copy skipped (unattended).
