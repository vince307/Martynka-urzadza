<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Salon backdrop after a WebGL context restore, an honest backdrop record, a missing fox named and stable

- **Plan**: context/changes/audit-backdrop-fox/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-24
- **Verdict**: APPROVED (after the review fixes below)
- **Findings**: 0 critical, 4 warnings, 5 observations

Run step of autonomous run 2026-10-24-audit-backdrop-fox; triage decided in place (contract rule 1), recorded per finding.
Two read-only subagents (plan drift; safety, quality and patterns) plus the reviewer's own reruns and breaks.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (fixed) |
| Success Criteria | PASS |

## Scope check (scope.md items 2-8)

| Item | Where | Verdict |
|---|---|---|
| 2 B-1 redraw on restore, console line, counter, e2e | `TaskScene.create`/`WelcomeScene.create` `onRestore` on `Renderer.Events.RESTORE_WEBGL`, off in `events.once('shutdown')`; `SalonBackdrop.render` `cause 'restore'` (`console.warn`, `redrawCount`); `tests/e2e/backdrop-restore.spec.ts` (3 tests); pin in `tests/phaserLoaderPin.test.ts` | met |
| 3 B-2 drawn, blurred, renderer, redraws; one pixel read | `BackdropSnapshot`, `SalonBackdrop.pixel`, hook getter `backdropPixel` | met |
| 4 C-1 font file name | `docs/art-inventory.md` names `MartynkaNext.ttf` twice | met |
| 5 G-1 fox recorded and named truly | `GuideFox` constructor `recordFallback(scene, 'guide', 'none')`; `artHealthLines` `{ kind: 'guide' }`, `standIn`; `pl.settings.guideMissing`, `uiArtMissing(count, total, standIn)` | met; wording is [human] row 4.7 |
| 6 G-2 whole-session hide, `requested`, one test | `guideAvailable` (`src/core/guide.ts`) once in the `GuideFox` constructor; `GuideSnapshot.requested`; `fox-guide.spec.ts` `one pose missing` + unit table | met; proof form (page.route, not a new `e2eArt` value) is [human] row 4.8 |
| 7 no logic/balance/content/save change | `SAVE_VERSION = 4`; `git diff --stat main..HEAD -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum vite/ src/core/types.ts` empty; every new record runtime only | met |
| 8 nothing else folded | N-7, N-8, A-1 untouched; older follow-ups re-recorded (F3-F5 in `follow-ups/review-fixes.md`) | met |

## Findings

### F1 — Restore-listener guard proved only that some 'shutdown' text came earlier

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/backdropRestoreWiring.test.ts (`listens with the Phaser constant and removes the listener on shutdown`)
- **Detail**: The guard used `lastIndexOf("'shutdown'", …)`; in `WelcomeScene` an older shutdown block sits above the new one, so moving the `off` into an `events.once('destroy')` block would still pass. Both scenes also add a second, separate `events.once('shutdown')` block next to the `on` instead of the existing one the plan named (structural drift, same behaviour).
- **Fix**: Regex the `off` inside an `events.once('shutdown', () => { … })` body with no closing brace between. Kept the separate blocks (adjacent to the `on`, easier to read).
- **Decision**: FIXED — break re-executed: `off` moved to `events.once('destroy')` in `WelcomeScene` → the WelcomeScene case red, restored.

### F2 — Phaser pin did not cover texture wrappers re-created before the event

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/phaserLoaderPin.test.ts (`re-creates textures and framebuffers before it emits the event`)
- **Detail**: The title says textures, but only `glFramebufferWrappers` was pinned; the redraw copies the room pictures (`glTextureWrappers`).
- **Fix**: Same `indexOf` check for `ArrayEach(this.glTextureWrappers` before `this.emit(Events.RESTORE_WEBGL`.
- **Decision**: FIXED

### F3 — Duplicated plain backdrop record and dead getters

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/TaskScene.ts (`snapshot`), src/scenes/WelcomeScene.ts (`backdropState`), src/ui/widgets/SalonBackdrop.ts (`get mode`, `get captures`, `get redraws`)
- **Detail**: The six-field "no backdrop yet" literal was written out in both owners (a second record shape to keep in step, the seam the plan's sweep wanted gone); the three getters had no caller left after `snapshot()`.
- **Fix**: `plainBackdropSnapshot(scene)` exported from `SalonBackdrop.ts`, used by both scenes (their `WEBGL` imports dropped); getters removed.
- **Decision**: FIXED

### F4 — `isSalonPixel` accepts any opaque non-page colour

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: tests/e2e/backdrop-restore.spec.ts (`isSalonPixel`)
- **Detail**: Proves the texture is not blank and not the page wash (the scope's requirement), but a texture drawn without the room pieces in a solid colour would pass. The reviewer's pixel break (below) shows the check does catch a blank texture after a restore.
- **Fix**: Compare the post-restore pixel with the pre-loss pixel within a tolerance.
  - Strength: proves the same salon came back.
  - Tradeoff: depends on deterministic blur output in SwiftShader; under heavy load a re-run is costly to validate now.
  - Confidence: MED — not measured.
  - Blind spot: whether SwiftShader blur output is bit-stable across a context restore.
- **Decision**: DEFERRED — follow-up F6 in `follow-ups/review-fixes.md`.

### F5 — Fox summary step did not tie "hidden" to the requested pose

- **Severity**: OBSERVATION
- **Dimension**: Success Criteria
- **Location**: tests/e2e/fox-guide.spec.ts (`#11 one missing pose hides the fox in every phase`)
- **Detail**: On the summary only `visible: false` was checked.
- **Fix**: Poll `guide.requested === 'cheer'` on the summary before `hidden()`.
- **Decision**: FIXED

### F6 — `#14` hard-coded the fallback lead text

- **Severity**: OBSERVATION
- **Dimension**: Pattern Consistency
- **Location**: tests/e2e/fox-guide.spec.ts (`#14 the pictures section names the missing fox`)
- **Detail**: `'Zamiast obrazka gra rysuje'` literal; a copy change would make the absence check vacuous.
- **Fix**: Derived from `pl.settings.artFallback([]).split(':')[0]`, as `health-lines.spec.ts` does.
- **Decision**: FIXED

### F7 — `pixel()` shares the renderer's snapshot slot

- **Severity**: OBSERVATION
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/SalonBackdrop.ts (`pixel`)
- **Detail**: `snapshotFramebuffer` overwrites the renderer's one snapshot state and rebinds the texture framebuffer between frames; only the e2e getter calls it. `TaskScene.backdropPixel`/`WelcomeScene.backdropPixel` ship in `dist/` like `backdropState`/`targets` (existing pattern; the hook itself is absent).
- **Fix**: Doc comment "For the e2e hook only" with the reason.
- **Decision**: FIXED (comment); no marker added to `vite/e2eHookGuard.mjs` (plan: no guard edit).

### F8 — `captures` now also counts restore renders

- **Severity**: OBSERVATION
- **Dimension**: Architecture
- **Location**: src/ui/widgets/SalonBackdrop.ts (`BackdropSnapshot`)
- **Detail**: Plan P-7 kept `captures` as "every non-plain render"; a restore therefore bumps both counters. Correct, but undocumented.
- **Fix**: Doc comment on `BackdropSnapshot`.
- **Decision**: FIXED

### F9 — Unplanned edits, both required

- **Severity**: OBSERVATION
- **Dimension**: Scope Discipline
- **Location**: playwright.config.ts (`ROUND_SPEC`), tests/e2e/health-lines.spec.ts (`screen fallbacks reach the panel`)
- **Detail**: `backdrop-restore` added to `ROUND_SPEC` so the spec runs on the hook build; the health-lines locator narrowed because `guideMissing` also contains "zeszytu" (commit 1ee0ef6). Both follow from the plan.
- **Decision**: ACCEPTED

## Verification (this step)

- Local gate: lint OK, typecheck OK, unit `Tests 3915 passed` = baseline 3891 + 24 (20 new `it` + `it.each` over 3 = +22, plus 2 runtime cases from the per-owner loop in `backdropRestoreWiring.test.ts`), deploy scripts OK, `sample` E1-E6 OK, build OK with `e2e hook: absent (2 chunks checked)`. Unit re-run after the review fixes: 3915 passed.
- e2e list: 160 tests = 155 + 3 (p5) + 2 (p6).
- Full e2e `--workers=3` (load average ~40): 136 passed, 15 failed, 9 did not run, all failures timeouts / poll timeouts in load-sensitive specs. Serial re-run (`--workers=1`, after the review fixes) of the 12 files holding every failed and not-run test (53 tests: adaptive, final-sound, fox-guide, first-launch, health-lines, money-pay, room-purchase, save-backup-health, stale-tab, save-transfer, task-round, backdrop-restore): 51 passed, 2 load timeouts (`fox-guide` `#11 no fox on the unlock card` waiting for the canvas, the known slow E4 road; `stale-tab` `#2 B-1 without BroadcastChannel` stuck on `loading`, green in the parallel run), both green on a second serial run. Total 160/160 = 155 + 5.
- `dist/` has no `__martynkaE2E` (hook absent); the scene methods `backdropPixel` and the developer `console.warn` ship by design (F7).
- Review fixes committed as 22c80e2; Progress rows 1.5, 2.4, 3.5, 4.6, 5.2, 5.3, 6.2, 6.3 ticked from these numbers; 4.7, 4.8 [human], 4.9 [visual] and 4.10 [reviewer] (CI at ship: job `check` of workflow `CI`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \(`) stay open.
- TDD p1 break re-executed: `guideAvailable` checks only `idle` → `tests/guide.test.ts` 2 red ("only guideCheer/guideThink is missing"), restored.
- Pixel break (the p5 gap): `SalonBackdrop.render` skipped `dt.draw`/`dt.render` when `cause === 'restore'` (counters and `drawn` still rise) → all three `backdrop-restore.spec.ts` tests red at the post-restore `expectSalonPixel` (`Received: false`), after their `redraws` polls passed; restored. The pixel assertion is proven.
- Wiring break (F1): see F1.

MERGE: CLEAR — no open CRITICAL, every scope criterion met, suites green (failures under parallel load pass serially)
