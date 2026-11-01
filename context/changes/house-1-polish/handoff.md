# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-research` step of run 2026-11-01-bathroom-polish-lab: `research.md` answers the migration and
art/view questions with file + symbol anchors; `change.md` is `preparing`. The one thing not to get wrong: the save
step v6 → v7 is a frozen, data-free module (`MIGRATIONS[6]`, kitchen `tasksDone` `0 → 0`, `k ≥ 1 → k + 2`, skip a save
without a kitchen), and `tests/fixtureLoadPath.test.ts` kitchen expectations move from 7 to 9 while the v6 fixtures stay frozen.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, cut from `main` at `964285b` (S-31 merge #136) |
| commits | 2 on top of `964285b`: `docs(house-1-polish): change identity (autonomous run)`, `docs(house-1-polish): research` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| Progress rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit (three files below staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/house-1-polish/research.md` | research: save step v7 and its seams (chain, backups, rollback guard, import, readers, alternatives table, every test pinning v6), kitchen stages as data, art script per-file source, salon cream swap, worn grade, backdrop/house/room-done views, boot budget and deploy-smoke numbers, follow-ups that fire |
| `context/changes/house-1-polish/change.md` | frontmatter only: status `new` → `preparing`, `updated` 2026-11-01 |
| `context/changes/house-1-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/house-1-polish` |
| grep `SAVE_VERSION).toBe(6)` in `tests/` | 7 hits (`save.test.ts` ×3, `saveV6`, `saveV5`, e2e `rooms-as-data`, `first-building-choice`) |
| trial `cwebp` (script flags, output in `$TMPDIR`) on the 5 pack PNGs | kitchen-stage-1 87 604 B, -2 86 592 B; salon before/after/shadows cream 75 794 / 70 842 / 68 792 B |
| boot-budget arithmetic (worker, sizes from `public/` + trial webp) | kitchen 33.74 s → ≈ 37.2 s, salon 41.85 s → ≈ 41.4 s, limit 48 s |
| backdrop visibility count (worker, Pillow, outside `TASK_LAYOUT.notebook`) | non-cream share: salon now 1.00, cream salon 0.67, kitchen 0.00 |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on `main` at `964285b` per the contract, inherited, unverified: unit 4233, e2e 193) |

## 4. Next command

`/10x-plan house-1-polish`

## 5. Open

- Plan must carry `[human]` rows: D2 save v7 (overturns „v6 stays”, evidence in `research.md` § A), D4 salon cell fill
  (`captureRoomMiniature` full-bleed, checklist P2), D5 worn grade kept over the worn-v2 before (`applyWornGrade` only on
  furniture; Canvas `ROOM_LAYOUT.worn.canvasWash` also covers the background).
- Code outside data the plan names „dla właściciela produktu”: `src/core/save.ts` `SAVE_VERSION`/`MIGRATIONS`, a new
  `src/core/migrations/` module, `scripts/make-task-art.mjs` `ROOM_PACKS` per-file source (and the pack-existence loop),
  `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS` + `vite/e2eHookGuard.mjs` marker if a `v6-kitchen` e2e seam is added,
  `deploy/README.md` § 6 v7 „Uwaga” line.
- Tests to update (research § A, § B): v6 pins (7 + helpers), `fixtureLoadPath` kitchen 7 → 9 (two tests),
  `rooms.test.ts` "salon, kitchen, Mostek and Hangar keep the old before/after ternary…", `roomArt.test.ts` count and
  `room-art-kitchen.json`; add a kitchen task-order pin (only `SALON` has one in `roomsData.test.ts`).
- Salon file names (research Open Question 1): keep output names or rename; a rename silently disarms
  `tests/e2e/salon-load-health.spec.ts` route `**/assets/rooms/salon/shadows.webp`.
- `scripts/recolour-board.py` / `BOARD_*` become unused (Open Question 2); `UI_ART` `salonAfter` fallback keeps the
  green board (follow-up, the pack has no cream thumbnail); `balance.loader` comment byte figures go stale.
- Follow-ups that fire (research § Historical Context): kids-room 2 / bathroom 11 (no-op for kitchen, re-record),
  kitchen-room 19 / house-cross-section 12 (gap 182: salon does not go blank, kitchen gap stays), gap 109 (kitchen
  closes it), salon-load-health M-6 / bathroom 10 (art and precache set), audit-art-renderer script items,
  final-art-salon append rule (re-record with the version-step exception).
- No `DESIGN-GAP` added in this step.

## 6. Autonomous decisions

- R1 Recommend option (a) v7 bump over (b) per-room `listVersion`, (c) append, (d) inference. Why: no list marker exists;
  (b) still needs a bump because `copyRoom` drops unknown keys on a rollback write; (c) contradicts FR-033; (d) is
  ambiguous at `tasksDone 1`. Changes if: the plan foresees several rooms being reordered soon (then (b) with a bump).
- R2 Uniform `+2` also for an overflowing v6 kitchen (`tasksDone > 7`), not a clamp. Why: keeps the existing
  `tasks-overflow` report instead of hiding it. Changes if: the plan prefers clamping to the new length.
- R3 Recommend keeping salon output file names via a per-file `as`. Why: avoids fixture churn and a silently disarmed
  e2e route. Changes if: the plan prefers source-true names and retargets the spec.
- R4 Recommend keeping `recolour-board.py` and its test this slice (unused), with a follow-up. Why: retiring is cleanup
  outside the outcome. Changes if: the plan wants the art script trimmed now.
- R5 Two new copy keys for the kitchen stages („Posprzątaj kuchnię”, „Odnów ściany” from the pack), `renewFloor` reused.
  Changes if: the teacher read prefers the children's wording.
- Research ran without asking (no clarifying question needed: scope fixed by the step prompt and change.md).
