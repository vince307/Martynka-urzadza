# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-new` step of run 2026-10-24-salon-style: the change identity exists, every scope claim was re-checked
against the repo. The next agent must not assume the existing `shadows` layer can be shown in the empty room: it holds
shadows of every furniture piece, including slots not yet bought.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | one: `docs(salon-style): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| Progress rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/salon-style/change.md` | identity, pre-agreed scope items 1-8, claim / repo now / correction table, kit bindings, migration (none), follow-up table, autonomous decisions D0-D7 |
| `context/changes/salon-style/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/salon-style` |
| `npx vitest run tests/bootBudget.test.ts` | 1 passed; payload computed separately: 2 378 800 B = 47.58 s vs 48 s limit (headroom 0.42 s) |
| pixel reads of `architecture-before/after.webp` (decoded with `dwebp`, PIL) | green board is a gradient ~(57,140,89)-(115,183,105), 13.4 % / 14.7 % of the frame |
| `cmp` of the salon-v2 vs expansion-v1 room PNGs | `furnishings-before.png`, `shadows.png` identical; `architecture-before.png` differs (curtain mask) |
| full local gate | not run: docs-only step, no code changed |

## 4. Next command

`/10x-research salon-style`

## 5. Open

- Research questions (from change.md corrections): Phaser 4.2.1 ColorMatrix (saturation, sepia, brightness) on a room
  `Image` and inside the `SalonBackdrop` DynamicTexture draw (`drawRoomMiniature`); what the Canvas renderer shows; map
  every piece of the worn picture to a slot and the closest variant (pouf is knit/yellow; extra plants and litter have no
  slot); per-piece contact shadows for lamp, left plant, pouf and right plant (code ellipses vs regions cut from
  `shadows`); pixel tooling for the board recolour (`scripts/make-task-art.mjs` has no pixel access, no image library in
  `package.json`; `scripts/make-font.py` is the pinned-Python precedent) and its determinism; whether
  `architecture-before` still clashes beside the filtered furniture; what a missing worn-piece texture shows.
- Files that must follow the dropped `furnishings-before`: `RoomDef.scene` in `src/core/types.ts`, `SCENE_FILES` in
  `src/data/roomArt.ts`, `SALON.scene` in `src/data/rooms.ts`, `RoomView.render`, `miniaturePieces`,
  `RoomScene.fadeStage`, `ROOM_LAYOUT.depth.furnishingsBefore`, `sceneFiles` in `scripts/make-task-art.mjs`, the tests
  `tests/roomArt.test.ts`, `tests/layout.test.ts`, `tests/roomMiniature.test.ts`, `tests/roomShown.test.ts`,
  `tests/roomFixtures.ts`, the e2e `tests/e2e/salon-load-health.spec.ts` #15 (it stalls exactly that file), the
  `balance.loader` comment, `docs/art-inventory.md`, gap 107 in `docs/design-gaps.md`.
- DESIGN-GAPs to add later: worn look (filter numbers, dust), board colour, decoration contact shadows, missing worn-piece
  texture; gap 107 (and 109 if the ghosts change) amended.
- Follow-ups: see change.md "Open follow-ups triggered by this slice" (final-art-salon F1 folded; F2, L-7 conditional;
  the rest re-recorded or not fired). New follow-ups for this change (thumbnail/loading background with curtains, an
  author's "before") go to `follow-ups/review-fixes.md` at plan/archive time.

## 6. Autonomous decisions

- D0 scope items 1-8 pre-agreed by the maintainer 2026-10-24. Would change: a new maintainer instruction.
- D1 next step `/10x-research` (prompt-fixed; real Phaser and tooling unknowns). Rejected `/10x-plan`, `/10x-frame`.
  Would change: nothing.
- D2 the worn set still disappears at the stage (current flow). Rejected: worn pieces kept until each slot is bought.
  Would change: screenshots showing the empty-spot jump still reads as a style change, or the maintainer asking for it.
- D3 worn pieces drawn outside `state.chosen` / `shownVariants`, so hit tests and the e2e `shown` snapshot keep meaning.
  Would change: research needing a pure core helper for miniature sync (still outside `chosen`).
- D4 contact shadows per piece, never the whole `shadows` layer after the stage. Would change: a per-region crop from the
  conversion proving cheaper and better matched.
- D5 board recolour tool chosen by research (conversion preferred if deterministic with a pinned tool; code fallback).
- D6 turquoise nudge only with a side-by-side showing a clear gain.
- D7 folded follow-ups: final-art-salon F1; F2 and L-7 conditional. Would change: a folded item growing beyond a few lines.
- Skill's clipboard copy of the next command skipped (unattended run).
