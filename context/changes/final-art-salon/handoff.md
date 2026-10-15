# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-new` step: the change identity (`change.md`) exists with the roadmap-claims table, design
sources, the migration stance and the triggered follow-ups. Nothing is implemented. The next agent must not get
wrong: save format stays **v2** — the old 10-slot salon is remapped by a pure, idempotent repair at load and in the
import preview, never by a new save field.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | 1 on the branch (`docs(final-art-salon): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only files of this step staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/final-art-salon/change.md` | Change identity: notes, roadmap claim / repo now / correction table, design source and copy, migration stance, `Trigger: S-16` follow-ups with scope, 7 autonomous decisions |
| `context/changes/final-art-salon/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/final-art-salon` |
| `grep -n "Trigger.*S-16" context/archive/*/follow-ups/review-fixes.md` | 17 hits in 6 archives, all listed in `change.md` |
| Manifest read (`designs/martynka-expansion-v1/manifest.json`, python) | 6 slots × 3 variants, 4 fixed layers, 4 scene layers; positions recorded in `change.md` |
| `which cwebp` | `/usr/local/bin/cwebp` present |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main `334ff69` per contract, inherited, unverified here) |

## 4. Next command

`/10x-research final-art-salon`

## 5. Open

- Research questions (from `change.md`): how a `stage` task flows through `src/core/variantPanel.ts` `stepPanel`,
  `src/scenes/RoomScene.ts` `dispatch`, `src/ui/widgets/RoomTaskButton.ts`, `src/testing/e2eHook.ts` `room().snapshot()`;
  who reads `RoomState.chosen` as "done" (`src/core/saveFile.ts` `saveSummary`, `src/core/minigames/word.ts` caption
  words, `RoomDoneCard`); hit-test from manifest `visibleRect` in `src/core/roomHit.ts` `slotBox`/`slotAt`; empty-slot
  look (the pack has one shared `furnishingsBefore` layer, not per slot); precache weight after `cwebp`; whether the
  "Pokój gotowy!" card re-shows after a remap that completes the room.
- Remap rule (decision 3) is a recommendation; the plan picks and records it for the maintainer.
- E2E specs to rewrite: `tests/e2e/room-change.spec.ts` (uses `floor`, `SALON_PLACEHOLDERS`), `tests/e2e/room-purchase.spec.ts`.
- DESIGN-GAP candidates (rows from 105): loading screen, empty-slot look, salon miniature, before→after transition;
  closures of rows 22, 32–35.
- Out-of-scope follow-ups get new triggers at archive (list in `change.md` `## Triggered follow-ups`).

## 6. Autonomous decisions

1. Next step `/10x-research` (not `/10x-plan`): many touch points (stage task kind, manifest geometry, save repair,
   loading screen, precache). Would change: nothing — the orchestrator fixes the step.
2. Background stage = `RoomTaskDef` kind `stage`, state only from `tasksDone`; rejected a fake `chosen` entry or a new
   `RoomState` field (v3). Would change: research finding a reader that treats `chosen` as the done list.
3. Old-salon remap = value-preserving prefix + refund of the remainder, variants carried for sofa, rug,
   table→coffee-table, shelf→cabinet, picture→wall-frames; rejected evidence-based mapping (holes in the positional
   prefix) and no remap. Would change: maintainer preferring no refund, or the done card re-showing.
4. Costs 5–15 over 7 tasks, plan proposes curve and records sum/pacing; S-17 tunes. Would change: maintainer costs.
5. Texture atlas out of scope (loose WebP via extended `npm run art`, `public/assets/rooms/salon/`, own art table in
   `BootScene` + `artHealth`). Would change: precache over budget or a second room.
6. Loading screen drawn in code inside `BootScene` (no new scene), DESIGN-GAP → brief P2.2. Would change: research
   showing `preload` cannot draw.
7. Follow-up scope: salon-related + unlock-card book (existing `tasks/icons/book`) in; task-screen, narrator, SPATIAL,
   wallet, font, sound out with new triggers. Would change: spare budget after the salon phases (`spokenCelsius`
   literal "minus").
