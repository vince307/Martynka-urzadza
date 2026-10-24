<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Salon backdrop after a WebGL context restore, an honest backdrop record, a missing fox named and stable

- **Plan**: context/changes/audit-backdrop-fox/plan.md
- **Mode**: Deep (risky claims checked directly in the code and in `node_modules/phaser` 4.2.1; no sub-agent needed for this size)
- **Date**: 2026-10-24
- **Verdict**: SOUND (after the in-plan fixes below)
- **Findings**: 0 critical, 2 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2; fixed in plan) |
| Plan Completeness | PASS |

## Grounding

Grounding: 17/17 paths ✓ (`SalonBackdrop.ts`, `TaskScene.ts`, `WelcomeScene.ts`, `GuideFox.ts`, `guide.ts`, `artPick.ts`,
`artHealth.ts`, `artHealthView.ts`, `UIScene.ts`, `phaserLoaderPin.test.ts`, three e2e specs, four unit tests), symbols ✓,
brief↔plan ✓, Progress↔Phase 30 = 30 with identical text (script), every phase has a `Driver:` line.

Claims checked against the code:

- Phaser 4.2.1 (`node_modules/phaser/package.json`): `RESTORE_WEBGL_EVENT.js` exports `'restorewebgl'`;
  `WebGLRenderer.dispatchContextRestored` recreates `glFramebufferWrappers` (line ~1054), sets `contextLost = false`
  (~1066) and only then emits `Events.RESTORE_WEBGL` (~1073) — the synchronous redraw inside the handler is sound.
- `DynamicTexture.snapshotPixel` → `snapshotArea(..., 'pixel')` → with a `drawingContext` `renderer.snapshotFramebuffer`,
  which calls `WebGLSnapshot(gl, state)` synchronously; without one `snapshotCanvas` (async `Image`) — P-2 (`null` under
  Canvas) is right.
- `GameObject.destroy` destroys `filterCamera` (line ~1050) — the pin and the FU-NP 16 filter-camera close are right.
- `Renderer` is a Phaser namespace (`import { Renderer } from 'phaser'` like the existing `Loader` import).
- `ArtHealth.missing` holds texture keys and `UI_ART_KEYS.guide*` are `ui/fox-*`, so `noStandIn` = `UI_ART_KEYS[id]` over
  `GUIDE_ART` matches `ui.missing` exactly.
- `FallbackWhere` is used by `artFallbacks.ts`, `artHealth.ts`, `artHealthView.ts` (indexes `artFallbackNames`); the hook
  copies the record as `Record<string, string>` — `DrawnFallbackWhere` on the `fallback` line keeps typecheck green.
- Callers of `uiArtMissing`: `artHealthView.ts`, `tests/artHealthText.test.ts`, `tests/e2e/health-lines.spec.ts` `#14 G-1`
  — all listed in phase 1.
- `GuideFox.show` checks `textures.exists` per pose today (G-2 real); `guideAvailable` does not exist yet (tdd is right).
- WelcomeScene is left by `scene.start(task)` (shutdown → `off` runs); TaskScene sleeps under the room via
  `scene.switch(room)` and `onWake` compares `backdropRooms`, which `refreshBackdrop` updates — a restore while asleep
  stays consistent.
- Already fixed in code (plan records them closed or "closed if found fixed"): `e2eHook.ts` reports `null`
  `nextRound`/`toRoom` while in the room; `WelcomeScene.openParent` guards on `this.session?.active()`.

Driver check: phase 1 `tdd` (absent pure rules, literal oracles) ✓; phases 2, 3 `impl` (widget/scene/Phaser glue, source
guards + pin) ✓; phase 4 `impl` (docs, sweep, visual) ✓; phases 5, 6 `e2e` — browser-only risks (blank DynamicTexture in a
live WebGL context, whole-round hide and the DOM panel sentence), features built by phases 1-3, after the seam sweep in
phase 4, contract `E2E=on` ✓. No driver changed.

Follow-ups whose trigger names this slice's files: fox-guide F6 (folded = G-1); notebook-polish FU 16 (filter-camera part
and WelcomeScene JSDoc folded, rest re-recorded); narrator-round-summary hook item (already done → closed);
autosave-versioned-save carried F4 / observability F4 and parent-settings F6 (WelcomeScene, re-recorded or closed by the
sweep); the generic `artHealth.ts` / `artHealthView.ts` triggers (re-recorded, scope item 8 "fold in nothing else" is a
convincing justification). Not fired: audit-boot-hidden-tab G-3 (`artFallbacks.ts` is not edited), load-and-tab-guard
Phaser-upgrade item (no upgrade), health-lines FU 20 (`artFallback` text not edited).

Product decisions vs PRD/scope: G-2 proof by `page.route` departs from scope item 6's literal options — not clearly
wrong (precedent `#14 G-1`, no test-only product code), `[human]` row 4.8 names it; the parent wording is autonomous,
`[human]` row 4.7 names it. No child-facing text, balance, save or curriculum change (scope item 7) — consistent with
PRD FR-037 (silent, decorative fox).

## Findings

### F1 — A restore in `plain` mode: counter and console line unordered

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Widget record
- **Detail**: `render` returns early in `plain` mode before `captureCount`; the plan did not say whether the `restore`
  cause bumps `redraws` and logs before or after that return, so the record after a restore with a missing salon picture
  was left to the implementer.
- **Fix**: count and log at the top of `render`, before the `plain` return; `drawn: false` says nothing was drawn.
- **Decision**: FIXED (plan phase 3 § 1 contract)

### F2 — Two generic `artHealth.ts` follow-ups not named in the re-record list

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 — Follow-ups
- **Detail**: phase 1 edits `src/core/artHealth.ts`, which fires save-reason-and-recovery "ASL-02 to ASL-09" (Trigger:
  next change to artHealth.ts) and stale-tab-and-health "G-2, G-3, B-4, B-5" (Trigger: … or to `artHealth`). `change.md`
  mentions the latter, the plan's follow-up list named neither.
- **Fix**: name both in the phase 4 re-record list.
- **Decision**: FIXED (plan phase 4 § 4)

### F3 — Absent-backdrop record lacked a `renderer` value

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Owner scenes
- **Detail**: "a `plain`/zero record when absent" does not say what `renderer` holds.
- **Fix**: read it from `this.game.renderer.type`; `drawn`/`blurred` false.
- **Decision**: FIXED (plan phase 3 § 2)

### F4 — The phase-6 abort also produces cause/advice/code lines

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 — Spec
- **Detail**: an aborted request is recorded with a `network` cause, so `artHealthLines` adds `cause`, `advice` and
  `code` lines. The planned assertions are targeted (no whole-list equality), so they hold; recorded so the e2e author
  does not add a list-equality check.
- **Fix**: noted under `## Known risks`.
- **Decision**: FIXED (Known risks)

VERDICT: PROCEED — the approach is grounded in the Phaser 4.2.1 source (framebuffers recreated before `restorewebgl`, synchronous WebGL `snapshotPixel`, `filterCamera` destroyed), every phase is independently green with the right driver, and the four small gaps are fixed in plan.md.
