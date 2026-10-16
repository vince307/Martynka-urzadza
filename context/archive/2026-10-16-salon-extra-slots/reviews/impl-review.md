<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Five new salon slots (S-16d `salon-extra-slots`)

- **Plan**: context/changes/salon-extra-slots/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8
- **Date**: 2026-10-16
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## How this review was done (autonomous run 2026-10-15-fix-s16bcd)

The source diff is small (≈150 changed lines in `src/` and `scripts/`, plus tests, art and docs), so the reviewer read every
changed source file in the main context instead of fanning out the two subagents of the skill (handoff §6 decision 1).
Every suite was re-run in this step; a temporary probe test (deleted, never committed) exercised live v3 saves.

### Plan vs diff

| Plan item | Verdict |
|---|---|
| P1 `SlotDef.shownBeforePurchase`, `shownVariant`/`shownVariants` (`src/core/rooms.ts`), `holdPoint` clipped to `ROOM_LAYOUT.scene` by `step / 2` (`src/core/roomHit.ts`) | MATCH |
| P2 `RoomView.render` + `miniaturePieces` via `shownVariants`, `RoomView.shown()`, `RoomSnapshot.shown`, hook type, `depth.shadows` 2 + layout assertion, miniature test | MATCH |
| P3 art script reads salon-v2 (`EXPANSION` removed), 12 new WebP + curtain-less architecture pair; `SALON` 11 slots / 1 decor / 12 tasks, costs 8, 10, 12, 13, 15; copy; `totalMs` 50 000; changed pins | MATCH |
| P4 `roomArtCheck` + `check-deploy.ts` GET of `architecture-after.webp` | MATCH |
| P5 `CLAUDE.md` S-16d sentence group, `follow-ups/review-fixes.md` with `Trigger:` lines | MATCH |
| P6–P8 `tests/e2e/salon-extra-slots.spec.ts` (4 tests), `ROUND_SPEC`, three existing specs grown by data | MATCH |
| Files changed outside the plan | none (only `context/foundation/roadmap.md` status lines and the change folder) |

### Live saves and frozen tables (CRITICAL class checked)

- `git diff --name-status main -- tests/fixtures src/core/migrations` → empty: `SALON_V3_TARGET`, `LEGACY_SALON_V2`,
  `LIFT_V2_SALON` and every fixture are byte-identical to main. `SAVE_VERSION` 3.
- Probe (temporary vitest file, 10 tests, all green, deleted): for every v3 salon with `tasksDone` 0..7 and realistic `chosen`
  (the bought prefix of sofa … wall-frames with mixed variants): `decodeSave(encodeSave(..))` returns the room unchanged;
  `currentTask` = `SALON.tasks[n]` (so 7 → `hang-curtains`); `roomDone` false; every bought slot is shown with its own variant;
  `lamp-table`/`plant-left`/`pouf` shown as 0 exactly when `tasksDone ≥ 1`; curtains/shelf absent; for each default-look slot
  `stepPanel(closed, change)` stays closed (no free change), `holdPoint` is null, and `slotAt` over a 20 px grid of the whole
  scene never returns an unbought slot. Buying tasks 8–12 from a finished S-16c salon spends exactly 58 stars, keeps the old
  `chosen` and ends `roomDone`. The frozen fixtures `save-v1`, `save-v2`, `save-v2-legacy-salon`, `save-v3` decode `ok`.
- Rollback to S-16c: `validateSave` checks `tasksDone` with `isCount` (no upper bound) and `chosen` values only, so a
  12-task save stays readable there (unknown slot keys ignored by `RoomView.render`'s slot loop).
- The reused id `curtains` (old-only key of `LEGACY_SALON_V2`) is safe: `LIFT_V2_SALON` is `MIGRATIONS[2]` (version < 3 only);
  pinned by "a v3 save with chosen.curtains is decoded unchanged" and "a lifted v2 salon never carries curtains".

### Seams

| Seam | Result |
|---|---|
| `shownVariants` used by `RoomView.render` (preview merged first), `miniaturePieces` (done card) and the hook (`RoomView.shown()` = what render passed to a layer) | OK |
| Depth: `furnishingsBefore` 1 < `shadows` 2 < curtains z 3 (layout test asserts for every room) | OK |
| Curtains above the scene: room OK (Phaser draws from y −70, clipped by the canvas); hold target inside the scene (`holdPoint` clip, e2e #16 p8); miniature ≈ 9 px above the tile only in the `miniature` fallback mode (the done card uses the static `salonAfter` thumbnail when art is present) → visual gate 3.7 | OK / visual |
| Costs 8, 10, 12, 13, 15 (`SALON.tasks`), total 129 | OK |
| `totalMs` comment: 2 073 293 + (1 489 688 − 1 233 242) = 2 329 739 B ≈ 46.6 s at 50 KB/s; measured now: 38 files, 1 489 688 B in `public/assets/rooms/salon/` | OK |
| `roomArtCheck` in `check:deploy`: imports `src/data/roomArt` under `node --import tsx` (usage run resolved all imports, no URL given, nothing fetched; never run against production) | OK |
| Room art files on disk (38) == `ROOM_ART` (test "has 38 entries" + files-on-disk test); `dist/sw.js` precaches all 38 salon files (checked after `npm run build`) | OK |

### Teacher read (copy in `src/data/pl.ts`, `src/data/rooms.ts`)

Tasks: "Powieś zasłony", "Powieś półkę", "Wymień lampę", "Wymień roślinę", "Wymień pufę" — imperative + accusative
(zasłony acc. pl. = nom.; półkę, lampę, roślinę, pufę acc. sg. fem.) correct and short. Captions nominative: zasłony, półka,
lampa, roślina, pufa. Variant names agree in gender/number with their noun: zasłony → Listkowe/Lniane/Botaniczne (pl.
non-virile), półka → Dębowa/Miętowa/Z łukiem, lampa → Klasyczna/Wiklinowa/Kwiatowa, pufa → Pikowana/Pleciona/Na nóżkach
(fem.), roślina → Monstera/Paproć/Fikus (species nouns). No numerals, so no agreement rule applies; no generator changed,
`npm run sample` E1–E6 still report 0 violations. "Wymień lampę" over an old lamp reads naturally (the old lamp is on screen).

## Findings

### F1 — A finished S-16c salon looks unfinished again until task 12

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/widgets/RoomView.ts (`render`, shadows under `roomDone`)
- **Detail**: Author-accepted (plan decision 2, change.md): shadows, "Zmień wygląd" and the teaser tile disappear until the 12th purchase. Already carried in follow-ups (Trigger: S-17).
- **Fix**: None now; visual gate 3.7 shows it.
- **Decision**: RECORDED (follow-up exists)

### F2 — Hold on an unbought default-look piece passes through to the piece under it

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/roomHit.ts (`slotAt` reads `chosen` only)
- **Detail**: Probe confirmed no free change of an unbought piece is possible; the side effect is that holding the old pouf can open the rug's change panel in a done room (as the decor pouf did before). Plan review F3, carried with a trigger.
- **Fix**: None now.
- **Decision**: RECORDED (follow-up exists)

### F3 — Stand-in of a default-look slot is drawn opaque, the old decor stand-in was translucent

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/RoomView.ts (`render`, slot loop: `alpha: 1`, `variantFills[0]`)
- **Detail**: Only visible when the salon art is missing (`?e2eArt=room`); lamp/plant/pouf stand-ins now look like bought pieces (variant-0 fill, caption "lampa\nKlasyczna") instead of the faded decor box. Consistent with "they are slots now"; belongs with VO2 (stand-in labels).
- **Fix**: None now; VO2 follow-up covers the stand-in drawer.
- **Decision**: RECORDED

### F4 — L-R8 / L-R11 trigger "next change to RoomScene" fired and was re-triggered

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/scenes/RoomScene.ts (`snapshot`)
- **Detail**: The slice adds one read-only snapshot field and touches neither `stepPanel` refusals nor `celebrate`/`onSleep`; the plan (Known risks) justified carrying them. Acceptable, recorded so the next RoomScene change does not defer them again by the same reasoning.
- **Fix**: None now.
- **Decision**: RECORDED

### F5 — Done-card miniature can draw the curtains ≈ 9 px above the tile

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/RoomView.ts (`drawRoomMiniature`, no clip)
- **Detail**: Only in the `miniature` fallback mode (`miniatureMode` picks the static thumbnail when the art loaded). 70 × `thumbScale` ≈ 9 px, inside the tile padding. Plan review F2, carried with a trigger; visual gate 3.7 decides.
- **Fix**: None now.
- **Decision**: RECORDED (follow-up exists)

## Success criteria re-run (this step)

| Command | Result |
|---|---|
| `npm run lint` | clean |
| `npm run typecheck` | clean |
| `npm test` | 3076 passed, 170 files (main baseline 3063 + 13) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` … `E6` | 0 violations each |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `dist/sw.js` lists 38 distinct `assets/rooms/salon/*.webp` |
| `npx playwright test --config=<abs> --workers=4` | 121 passed (10.0 m) = main 117 + 4 (`salon-extra-slots.spec.ts`); Chromium launched in this session; no flake |
| Deliberate break 1: `shownVariant` without the `stagesDone` check | `tests/roomShown.test.ts` "shows nothing unbought before the stage task is done" red (1 failed); restored |
| Deliberate break 2: `holdPoint` box top = `full.top` (no scene clip) | `tests/roomHit.test.ts` "lands at least half a step inside the scene …" and "a slot fully above the scene has no hold point" red (2 failed); restored |
| `validate-rule-files.sh` | PASS (417 paths) |
| `git diff --name-status main -- tests/fixtures src/core/migrations docs/human-checklist.md deploy designs .gitignore .claude` | empty |

Meta-check: break 1 proves the rule on synthetic data (the e2e p6a break proves the render path); break 2 proves the scan
box clip, not the touch path (e2e p8 proves that).

### Reviewer rows

- 1.5 `src/core/rooms.ts`, `src/core/roomHit.ts`: no Phaser, no browser globals (ESLint boundary green); `step / 2` and the scene rect come from `balance`/`layout` — PASS.
- 2.4 No number or Polish text added to `RoomView` or `RoomScene`; the decor loop still draws `plant-right` (the only `SALON.decor` entry) — PASS.
- 3.6 Teacher read recorded above; `SALON_V3_TARGET`, `LEGACY_SALON_V2`, `tests/fixtures/` unchanged; nothing from `designs/` in the diff — PASS.
- 4.4 `check:deploy` runs as `node --import tsx` (usage run resolved the new `src/data/roomArt` import); no production command run — PASS.
- 5.3 Seam sweep: `shownVariant`, `SlotDef.shownBeforePurchase`, `RoomSnapshot.shown`, `holdPoint`, `ROOM_LAYOUT.depth.shadows`, `roomArtCheck`, `balance.loader.totalMs` all exist; `validate-rule-files.sh` PASS; `docs/human-checklist.md` unchanged — PASS.

MERGE: CLEAR — no critical or warning findings; live v3 saves keep their meaning, frozen tables and fixtures byte-identical, all suites re-run green.
