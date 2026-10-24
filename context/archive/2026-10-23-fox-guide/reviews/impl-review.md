<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Fox guide (silent mascot at the corner of the task notebook, PRD FR-037)

- **Plan**: context/changes/fox-guide/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-10-23
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Evidence (observed in this review, branch `feat/fox-guide` at `8bf3af3`)

- Local gate: lint OK, typecheck OK, unit **3891 = 3781 + 110** (109 in the four new files `tests/guide.test.ts`,
  `guideLayout.test.ts`, `guideWiring.test.ts`, `bootBudget.test.ts`, plus 1 parametrised case from
  `TWEENING_FILES` += `GuideFox.ts` in `reducedMotionWiring.test.ts`), deploy and ops script tests OK, `sample` E1–E6
  OK, build OK with `e2e hook: absent (2 chunks checked)`.
- e2e: `npx playwright test --list` 155 = 150 + 5 (p5 spec `tests/e2e/fox-guide.spec.ts`; phases 1-4 add 0). Full run
  `--workers=3`: 140 passed, 13 failed, 2 did not run (load timeouts in art-stand-in, art-tasks, fox-guide unlock road,
  health-lines U-1, money-pay, room-purchase, save-backup-health, save-transfer, stale-tab); `--last-failed --workers=1`:
  15 passed, so **155 / 155**. E2E break re-executed: `textures.exists` guard dropped in `GuideFox.show` → `#11 no fox
  without its art` red (Expected false, Received true); restored, `dist/` rebuilt from the restored source.
- Deliberate breaks re-executed: `guidePose` `retype` → `'idle'` made `tests/guide.test.ts > task / retype -> think`
  red (1 failed / 16); `GUIDE.anchor.x` 1792 → 1700 made 16 of 88 `guideLayout` cases red; both restored, `git status`
  clean. Meta-check: the pose oracle is a literal table and the overlap oracles come from the real layout functions
  (`pictureLayout`, `dragLayout`, `coinLayout`, `clockSetLayout`, `keypadGrid`) and constants, not from `guideRect`.
- Scope checks: `SAVE_VERSION` 4 (`src/core/save.ts`); no diff in `src/core/save.ts`, `src/core/migrations`,
  `tests/fixtures`, `src/storage`, `src/data/pl.ts`, `src/data/curriculum`, `src/core/tasks`; `src/data/balance.ts`
  only the `loader` comment (values unchanged). No new player-facing text. No hook bypass: `.claude/settings.json` and
  `.claude/hooks/*` unchanged since 2026-10-12, no `--no-verify` trace in the commit log.
- scope.md items: fox clear of prompt, tiles, keypad, select, drag mats/tray/wallet/clock, written column (picture and
  lines of `digits`), drawings, hint number line (keypad only, `hintPictureLayout` throws for every other mode), bar,
  beads (6 of the warm-up), ribbon, HUD and the settings hint bubble (`tests/guideLayout.test.ts`); no input
  (`GuideFox` has no `setInteractive`/pointer listener, source guard + e2e `interactive === false`); no fox without
  texture (`textures.exists` → hidden, `label: ''`); poses per `guidePose` (`first` idle, `second`/`solution`/`retype`
  think, `done` cheer, summary and `MinigameDoneCard` cheer through the `summary` branch, unlock `null`); pop 240 ms
  (≤ 300), none under `prefersReducedMotion()`; the three rows in `UI_ART` are precached (webp glob) and covered by
  `precacheCovers('screen pictures', … UI_ART …)` in `scripts/check-deploy.ts` with no edit there.
- Seams across phases: one silhouette/scale computation (`guideRect`, `src/core/guideLayout.ts`), one pose switch
  (`guidePose`, `src/core/guide.ts`); `GuideFox` reuses both; the `balance.loader` comment, `uiArt.ts` header,
  `make-task-art.mjs` header and the follow-up F4 all carry the measured 2 378 800 B / 47.6 s; CLAUDE.md "Current
  state" and the `npm run art` line name the fox. No later phase changed an earlier contract.

## Findings

### F1 — The "tap on the fox" e2e lands on an empty margin

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/fox-guide.spec.ts (`#11 a tap on the fox changes nothing`)
- **Detail**: Nothing interactive lies under the fox rect (right margin), so "the round is unchanged after the tap" would
  also hold if the fox were interactive without a handler. The proof that the fox takes no input is the
  `interactive === false` assertion (broken red by the p5 step) plus the source guard in `tests/guideWiring.test.ts`;
  the tap half proves only that the fox does not trigger anything. Adequate for scope item 5.
- **Fix**: none needed; recorded.
- **Decision**: RECORDED

### F2 — Plan's boot payload numbers drifted from the measured ones

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: context/changes/fox-guide/plan.md (Current State "Boot budget"), src/data/balance.ts (`loader` comment)
- **Detail**: The plan expected 2 372 211 B / 47.4 s; phase 1 measured 2 378 800 B / 47.6 s (the fox files are the
  predicted 42 384 B; the rest is drift in the pre-existing payload). The code and the follow-up F4 agree with the
  measurement; spare under the 2 s floor is about 0.4 s, so the next boot art addition trips `tests/bootBudget.test.ts`
  by design (follow-up F4 has its trigger).
- **Fix**: none; the plan text is historical, the comment and test are the source.
- **Decision**: RECORDED

### F3 — `modeWidgets` follow-up stays open by design

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/scenes/TaskScene.ts (`render`)
- **Detail**: The child-flow-guards follow-up fires on "the next change to `TaskScene.render`". The fox call reads only
  `this.state.phase` and the screen, never the answer mode, so the follow-up is left open (as research and plan said);
  fox-guide follow-up F7 records the link.
- **Fix**: none.
- **Decision**: RECORDED

### F4 — The hook snapshot's `guide.rect` is the static layout rect

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/GuideFox.ts (`snapshot`)
- **Detail**: `rect` is `guideRect()` and does not follow the image's live bounds (e.g. during a pop). The e2e use is
  only "where to tap" and "equals the layout", so this is fine; a future spec that wants the drawn bounds must read
  `image.getBounds()` instead.
- **Fix**: none.
- **Decision**: RECORDED

## Reviewer rows

- 4.4 ticked (numbers above).
- 4.8 `[reviewer] (CI at ship)` stays open: workflow `CI` (`.github/workflows/ci.yml`), job `check`; proof lines are
  vitest's `Tests  <N> passed` from `npm test` and `e2e hook: absent (` from `npm run build` in that job's log.

MERGE: CLEAR — no critical or warning findings, every automated criterion re-run green (unit 3781 + 110, e2e 150 + 5), save stays v4
