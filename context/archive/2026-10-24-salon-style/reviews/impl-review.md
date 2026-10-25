<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Salon before state in the house clay style, palette board, contact shadows in the empty room

- **Plan**: context/changes/salon-style/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-25
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (1 fixed), 5 observations

Branch `feat/salon-style` at `6d17de0` (before this step's commit), diff against `main` `309e672`: 40 files (19 source,
test and script files; 3 art files; docs and change artifacts). Reviewed in the main context (the diff is small enough
to read whole), not through subagents.

## Verification observed in this step

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean |
| `npm test` | `Tests  3936 passed (3936)`, 207 files = baseline 3915 + 21 (p1 +13, p2/p3 +8) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1..E6` | all exit 0 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)`; `__martynkaE2E` not in `dist/` |
| `npx playwright test --list` | `Total: 164 tests in 43 files` = baseline 160 + 4 |
| `npx playwright test --workers=3` | 148 passed, 13 failed, 3 did not run (39.4 min, heavy load: timeouts, closed targets) |
| `npx playwright test --last-failed --workers=1` | 16 passed (the 13 + 3) → 164 / 164 green; every failure was load |
| `npm run art` re-run | exit 0, 86 files; `git status --porcelain public/` empty (deterministic, incl. the Python board recolour) |
| `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` | PASS (22 rule files, 557 paths) |
| `git diff --stat main..HEAD -- src/core/save.ts src/core/migrations tests/fixtures src/core/roomHit.ts src/data/pl.ts src/data/curriculum src/storage` | empty; `SAVE_VERSION = 4`; no slot geometry, cost or variant line changed in `src/data/rooms.ts` |

Deliberate breaks re-executed in this step (each restored, tree checked):

1. tdd phase 1: `mul(sat, mix)` → `mul(mix, sat)` in `gradeMatrix` → `tests/colorGrade.test.ts` 2 red, `AssertionError: cell 0: expected 0.5848524 to be close to 0.5794` (a real literal from the research prototype). Meta: the oracle is the prototype's matrix, not the code; sepia and saturation do not commute, so the order is proven.
2. e2e phase 6: `wornPieces` guard made always true (`stagesDone >= 0` → `[]`) → `salon-style.spec.ts -g "fresh salon"` red (`worn.keys` expected 10 keys, received `[]`).
3. LOOK break: `applyWornGrade` sets an identity matrix (the filter is still added, so `graded` still counts) and `ROOM_LAYOUT.contactShadow.alpha` 0 → unit 3936 green, e2e `salon-style`, `salon-art`, `backdrop-restore`, `notebook-polish` 17 green. Nothing automated sees the look (F2).

## Scope check (scope.md items 2-8)

- **2 before state**: done by code (after pieces, variant 0, worn ColorMatrix + soft extra), `furnishings-before` removed. Departures: grade stronger than "about −25 % / −8 %" and NO dust/wear overlay → `[human]` 5.7; coffee table keeps its vase and books → 5.6. Reduced motion: no new tween (`fadeStage` returns first; guarded by `tests/salonStyleWiring.test.ts`).
- **3 board**: `#BCD799` by `scripts/recolour-board.py` (pinned Pillow 12.1.0 + numpy 2.4.3) inside `npm run art`; not a kit token → 5.9; determinism re-checked here.
- **4 turquoises**: not nudged (optional) → 5.8.
- **5 contact shadows**: code ellipses under lamp, both plants, pouf from the stage to `roomDone`; optional paper texture not done (named in plan "NOT doing").
- **6 no logic/save change**: holds (see table); boot payload 2 092 396 B (≈41.8 s at 50 KB/s, `tests/bootBudget.test.ts` green); art health: `ROOM_ART` 37 entries, `salon-art.spec.ts` asserts `health.total === ROOM_ART.length`, the deploy smoke `roomArtCheck` takes its URLs from the same table.
- **7 docs**: gap rows 169-172, rows 107/109 amended, `docs/art-inventory.md`, follow-ups with 21 `Trigger:` lines.
- **8 visual gate**: row 5.10 still open (next step).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Findings

### F1 — CLAUDE.md still states 38 salon files as current

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: CLAUDE.md, "Five more salon slots (roadmap S-16d ...)" sentence
- **Detail**: Phase 5 was to fix "the 26 WebP files / 38 files counts if stated as current". The S-16d sentence "the room art comes from the salon-v2 pack (38 files in `public/assets/rooms/salon/`, about 1.5 MB)" reads as current; the folder has 37 files since phase 3.
- **Fix**: Add "then ...; 37 since salon-style dropped the worn-furniture picture" (validate-rule-files PASS after).
- **Decision**: FIXED (this step, `fix(salon-style): impl-review fixes`)

### F2 — No automated check sees the worn look or the contact shadows

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: src/ui/wornGrade.ts `applyWornGrade`; src/ui/widgets/RoomView.ts `drawContactShadows`; tests/e2e/salon-style.spec.ts
- **Detail**: The look break above (identity matrix while the filter is still added; ellipses at alpha 0) leaves 3936 unit tests and 17 e2e tests green. `worn.graded`, `backdrop.graded` and `contactShadows` count filters and ids, not pixels. As the plan says, the look is the visual gate's job (row 5.10).
- **Fix**: Keep the visual gate as the proof; recorded in `follow-ups/review-fixes.md` (impl-review F2) with a hook-build pixel-sample idea.
  - Strength: The visual gate is already planned and is the only judge of a grade anyway.
  - Tradeoff: A later regression of the matrix numbers would pass CI.
  - Confidence: MED — the matrix numbers are pinned by `tests/colorGrade.test.ts`; only the wiring of the numbers into the filter is unguarded.
  - Blind spot: WebGL readback in headless Chromium under load not tried.
- **Decision**: ACCEPTED — follow-up with trigger

### F3 — `salon-art.spec.ts` changed although the plan said unchanged

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: tests/e2e/salon-art.spec.ts `#16 with the salon pictures missing ...`
- **Detail**: Phase 2/3 text said `salon-art.spec.ts` stays unchanged; fix `19e5a40` replaced the literal `38` with `ROOM_ART.length`, which the file removal required. Assertion strength unchanged (the unit `tests/roomArt.test.ts` pins 37).
- **Fix**: None.
- **Decision**: ACCEPTED

### F4 — `RoomScene.ghostTweens` keeps finished tweens until sleep

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/RoomScene.ts `fadeStage`, `dropGhost`, `clearGhosts`
- **Detail**: `dropGhost` prunes `ghosts` but not `ghostTweens`; at most ~12 per stage purchase, cleared on sleep/shutdown. Bounded.
- **Fix**: Follow-up (impl-review F4).
- **Decision**: ACCEPTED

### F5 — Canvas renderer: the worn ghost fades without the wash

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/RoomScene.ts `fadeStage` (`buildWorn(... depth.wornGhost)`); src/ui/wornGrade.ts `applyWornGrade` (`_scene` unused, kept by the plan's contract)
- **Detail**: Under Canvas the room shows the worn set under a wash, but the cross-fade ghost of that set has no wash, so for `stageFadeMs` the pieces look brighter. Canvas is already a recorded follow-up (Canvas before state).
- **Fix**: None now; covered by the Canvas follow-up trigger.
- **Decision**: ACCEPTED

### F6 — Scope departures awaiting the maintainer

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Scope Discipline
- **Location**: plan.md Progress rows 5.6-5.9
- **Detail**: No dust/wear overlay and a stronger grade than scope item 2 (5.7); coffee table keeps vase and books (5.6); turquoises not nudged (5.8); board `#BCD799` not a kit token plus a Python step in `npm run art` (5.9). Each is named in a `[human]` row; none changes logic or save.
- **Fix**: Maintainer decision at the PR.
- **Decision**: PENDING (maintainer)

### F7 — Worn images and their filters are rebuilt on every room render before the stage

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/RoomView.ts `drawWorn`
- **Detail**: Ten images with one or two ColorMatrix filters each are destroyed and recreated per `render` (wake, star change) while the stage is unbought; renders are rare and the per-image filter cost already has a follow-up trigger (tablet frame-rate report).
- **Fix**: None.
- **Decision**: ACCEPTED

MERGE: CLEAR — 0 critical; unit 3915 + 21 and e2e 160 + 4 all green (load-only failures pass serially), no save/geometry change, art deterministic; the stale CLAUDE.md count is fixed and the untested look is left to the visual gate with a follow-up.
