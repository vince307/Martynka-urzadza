<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Board recolour refuses a wrong image, the Canvas renderer named in "Obrazki", the pouf under the return button

- **Plan**: context/changes/audit-art-renderer/plan.md
- **Mode**: Deep (claims checked directly against the code; no sub-agent needed for this size)
- **Date**: 2026-10-25
- **Verdict**: SOUND (after the in-place fixes below)
- **Findings**: 0 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F3, F6, F7, fixed) |
| Plan Completeness | WARNING (F1, F2, F4, F5, fixed) |

## Grounding

Grounding: 8/8 paths ✓ (`scripts/recolour-board.py`, `src/ui/wornGrade.ts`, `src/ui/artFallbacks.ts`, `src/core/artPick.ts`,
`src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`, `tests/salonStyleWiring.test.ts`, `tests/e2e/salon-style.spec.ts`;
new: `tests/recolourBoard.test.ts`, `tests/e2e/canvas-renderer.spec.ts` absent as expected), 9/9 symbols ✓ (`applyWornGrade`
`_scene`, `addGrade`, `recordFallback(scene, where, mode: string)`, `noteFallback` first-wins, `FallbackWhere` /
`DrawnFallbackWhere` / `FALLBACK_ORDER`, `artHealthLines` `guide` push and type-guard filter, `textOf` exhaustive switch,
`BootScene.create` `creates > 1` guard, `ROUND_SPEC`), brief↔plan ✓, Progress↔phase 29 = 29 ✓, one `Driver:` per phase ✓.

## Checks the run asked for

- **Python test that skips in CI + test-only env override.** Sound. Scope item 2 requires exactly this shape (no Python in CI).
  The probe uses `python3 -I`, the same isolation as the spawned script; change.md verified `python3 -I` sees the pins
  locally, so it runs here. It cannot pass silently where the pins are present: ready ⇒ the `describe` runs. A local skip
  (other `python3` on PATH) is loud (`console.warn` + titled describe) and visible in the passed count (`+ 3`); F7 adds a
  Known risk telling phase agents to compare counts. `RECOLOUR_BOARD_PYTHON` is read only by the test, never by the script,
  so it cannot change shipped behaviour. Vitest config has no `silent`, so the warn line reaches the CI log.
- **Record inside `applyWornGrade` covers every caller.** Verified: `applyWornGrade(` has exactly two call sites in `src/`,
  both in `src/ui/widgets/RoomView.ts` (`buildWorn` → room + `RoomScene.fadeStage` ghosts; `drawRoomMiniature` →
  `RoomDoneCard` + `SalonBackdrop.render`, which calls it before its WebGL-only branch, so the Canvas welcome backdrop does
  attempt the grade). Every caller passes a real `Scene`; `scene.registry` is the game registry, so `recordFallback` lands
  in the same `REGISTRY_KEYS.artFallbacks` the hook and `UIScene` read. "Once per game" is true: `noteFallback` returns the
  same record when the key exists and `recordFallback` skips the `set` (`next !== current`). The record appears only when a
  worn piece is drawn (before the stage) — exactly when the look differs, so the parent line is never false. Departure from
  scope item 3's literal "`drawRoomMiniature` stops ignoring the result" is carried by `[human]` row 4.8 — acceptable.
- **Polish parent sentence.** "Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na
  stare." True (Canvas has no filters; the worn pieces show ungraded, the room gets the wash), one sentence, 15 words, no
  stand-in claim, kept out of the "gra rysuje:" list by excluding `worn` from `DrawnFallbackWhere`. Wording is `[human]` row 4.6.
- **Canvas e2e vs two-server config and `ROUND_SPEC`.** Compatible: the `chromium-hook` project's `use` has no
  `launchOptions` (`devices['Desktop Chrome']` carries none), so a file-level `test.use({ launchOptions })` is a worker
  option that only starts a separate worker; adding `canvas-renderer` to `ROUND_SPEC` keeps it out of the production
  project. No seam, no edit of `vite/e2eHookGuard.mjs`.
- **Drivers.** P1 `tdd` (guard absent; all-green and no-green exit 0 today), P2 `tdd` (pure rules absent), P3 `impl`
  (Phaser glue), P4 `impl` (docs + seam sweep), P5 `e2e` (browser-only risk built by P2-P3, after the seam sweep, contract
  `E2E=on`) — all right.
- **Triggered follow-ups.** Plan re-records salon-style F2, final-art-salon F4, salon-load-health L-6/L-8, audit-backdrop-fox
  F1/F5 and references salon-style 3. Also fired and now named (F5): the "Obrazki" `Kod:` line not muted (post-run-polish,
  audit-boot-hidden-tab) and the audit-boot-hidden-tab L-8 copy. final-art-salon F3 (`BootScene` progress listener, trigger
  "next change to `BootScene`") is already closed in code (`this.load.off('progress', onProgress)`). audit-boot-hidden-tab
  G-3 (trigger `artFallbacks.ts` or the room miniature) is not fired: neither is edited. Deferrals are justified by scope item 6.
- **Phase sizing.** Each phase is one concern, independently green, sized for one fresh agent. No split/merge.

## Findings

### F1 — Row 1.2 predicts the wrong red for the finiteness break

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1, success criterion / Progress 1.2
- **Detail**: `share = float(filled.mean())` is 0.0 (not NaN) on an empty mask, so with the finiteness check removed the
  share check still refuses the no-green image (exit ≠ 0). The case goes red only on its `non-finite` stderr assertion, not
  "exit 0, black image written" as written. An agent expecting a black image would think the break failed.
- **Fix**: reworded row 1.2 (phase body and Progress, identical text) to the real red and the deliberate overlap.
- **Decision**: FIXED

### F2 — Row 2.2 expects a typecheck red that `tsc` cannot give

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2, success criterion / Progress 2.2
- **Detail**: the drawn-list filter in `artHealthLines` is a type predicate `(where): where is DrawnFallbackWhere => …`; TS
  never checks a predicate's body, so dropping `'worn'` from it leaves `artFallbackNames[where]` typed fine. Only the unit case
  turns red.
- **Fix**: reworded row 2.2 (both places): the `{ worn, wallet }` unit case is the only guard; typecheck stays green.
- **Decision**: FIXED

### F3 — Renderer log placement vs the second `create`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3, change 2 (`BootScene.create`)
- **Detail**: `BootScene.create` can run twice (it has a `this.creates > 1` early return). A log placed before that return
  would print twice and break the phase-5 "exactly once" assertion.
- **Fix**: contract now says the `console.info` goes after the `creates > 1` return.
- **Decision**: FIXED

### F4 — Row 3.4 "one added comment line" vs an existing trailing comment

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3, success criterion / Progress 3.4
- **Detail**: `ROOM_LAYOUT.resume` already carries a trailing comment (DESIGN-GAP rows 12 and 31); the natural edit extends
  it, which `git diff` shows as a changed line, failing the literal criterion.
- **Fix**: criterion now reads "changes comments only (no value change)".
- **Decision**: FIXED

### F5 — Fired `artHealthView.ts` follow-ups not named

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4, change 2 (follow-ups)
- **Detail**: the "Kod: line not muted" item (post-run-polish, audit-boot-hidden-tab; trigger: next change to
  `artHealthView.ts`) fires and was covered only implicitly by the audit-backdrop-fox F5 group.
- **Fix**: phase 4 names it and L-8 explicitly, and records final-art-salon F3 as already closed in code.
- **Decision**: FIXED

### F6 — Console listener must precede the first navigation

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5, spec contract
- **Detail**: the boot line prints before the welcome screen exists; a listener attached after `page.goto` (or inside a
  helper that navigates) sees nothing and `#12` fails for the wrong reason.
- **Fix**: contract says the listener is attached before the first `page.goto`.
- **Decision**: FIXED

### F7 — A local skip of the Python test must not read as green

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: a skipped file exits 0; only the passed count reveals it. Rows 1.1/1.3 catch it in phase 1; later phases need
  the same habit.
- **Fix**: Known risk added (compare counts, not only the exit code).
- **Decision**: FIXED

VERDICT: PROCEED — approach verified against the code (one choke point covers all four grade callers, skip design meets scope item 2, Canvas spec fits the two-server config); four wording/placement warnings and three observations fixed in plan.md.
