# Fox guide (PRD FR-037) — Plan Brief

> Full plan: `context/changes/fox-guide/plan.md`
> Research: `context/changes/fox-guide/research.md`

## What & Why

A silent fox guide stands at the corner of the task notebook in three poses: calm, joy after a good answer, thought
after a miss. It never speaks, never covers the task, never looks disappointed, and swaps its pose without animation
under the system "reduce motion" (PRD FR-037). The maintainer delivered the art on 2026-10-23 and fixed the limits in
`context/runs/2026-10-23-fox-guide/scope.md`.

## Starting Point

UI pictures go through one table (`UI_ART` in `src/data/uiArt.ts`) that BootScene, the "Obrazki" health line, the
precache and the deploy smoke all iterate. The round's `RoundPhase` already carries everything a pose needs, and every
phase change goes through `TaskScene.render`. No inner corner of the notebook is free in every answer mode at the scope's
size.

## Desired End State

On every task screen the fox stands in the right margin, astride the notebook's top-right corner (feet at 1792, 400;
silhouette ≈ 188 × 220), idle at a task start, cheering after a right answer and on the round's end screen, thinking
after a miss until the next right answer or task, absent on the unlock card or when its art is missing. Taps on it do
nothing. A unit test proves it covers nothing in any mode; another pins the boot payload it grows.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Size | "180–240 px" = silhouette height; image 320 px, silhouette ≈ 188 × 220 | At a 240 px canvas the paw-at-chin of think is unreadable | Research R-1 / Plan P-1 |
| Place | Right margin astride the top-right corner | The only spot clear of every element in every mode (≥ 14 px) | Research R-2 / Plan P-2 |
| Boot load | Keep `totalMs` 50 s; new `tests/bootBudget.test.ts` with a 2 s floor | Payload 46.6 → 47.4 s at 50 KB/s, 5 % margin, an over-run degrades gracefully | Plan P-3 |
| Art | 384² WebP via a third root in `npm run art` | 1.2× the shown size on a 1920 backing store; 20 KB less than 512² | Research R-6 |
| Screens | Task layer of every round kind; cheer on summary and minigame done card; none on unlock | Scope names task + summary; the done card is the minigame's summary | Research R-3 |
| Pose | Pure `guidePose(screen, phase)` | No new state, no save field | Research R-4 |
| Motion | Texture swap + 1.06 pop in 240 ms; none under reduced motion; no breathing | Soft and short; motion beside the task distracts | Research R-5 |
| Missing art | No fox, counted in "Obrazki" | `label: ''` precedent | Research R-7 |
| Phases | Five (docs split from the widget) | One new component per UI phase; sweep in the last impl phase | Plan P-9 |

## Scope

**In scope:**
- three WebP poses, three `UI_ART` rows, the art pipeline root
- `GUIDE` / `ANIMATION.guide*` tokens, `guidePose`, `guideRect`, the no-overlap geometry test
- `GuideFox` widget, one call in `TaskScene.render`, `TaskSnapshot.guide`
- boot budget test, `balance.loader` comment
- DESIGN-GAP rows 165–168, CLAUDE.md, follow-ups, one e2e spec

**Out of scope:**
- save, balance values, curriculum, content, text, sound, narration
- idle breathing, the fox on the unlock card / welcome / room
- BootScene, artHealth and deploy-smoke edits; observability audit PR #101; street and houses

## Architecture / Approach

Data (`GUIDE`, `ANIMATION.guide*`, `UI_ART` rows) → pure core (`src/core/guide.ts` pose, `src/core/guideLayout.ts`
silhouette rect) → one widget (`src/ui/widgets/GuideFox.ts`, a non-interactive Image) → one call in `TaskScene.render`
before its first `return`. The e2e hook spreads `TaskSnapshot.guide` with no hook edit.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Art, table, boot budget (impl) | 3 WebP, 3 rows, budget test | `npm run art` rewriting other files |
| 2. Pose rule and geometry (tdd) | `guidePose`, `guideRect`, no-overlap test | missing a layout rect |
| 3. Fox in the task scene (impl) | `GuideFox`, wiring, hook field, gaps 165–168 | update call after an early `return` |
| 4. Docs, follow-ups, sweep, visual pass (impl) | CLAUDE.md, follow-ups, full screenshot matrix | the look of the 10 px over the paper |
| 5. E2E #11 (e2e) | `tests/e2e/fox-guide.spec.ts`, 5 tests | the slow unlock-card road |

**Prerequisites:** the local `designs/martynka-fox-guide-v1` pack and `cwebp` (both present); `feat/fox-guide` at `16b1e75`.
**Estimated effort:** ~5 agent sessions, one per phase.

## Open Risks & Assumptions

- The maintainer may read "180–240 px" as the canvas or reject the margin spot (`[human]` row 4.6; fallbacks named).
- The budget test leaves 0.6 s under its floor: the next boot art must decide on the limit (follow-up).
- The unlock-card e2e road is slow and has flaked under load before.

## Success Criteria (Summary)

- The child sees a fox at the notebook's corner that reacts to her answers and never covers or blocks anything.
- Under reduced motion or with the art missing, the game plays exactly as before.
- Tests prove the geometry, the pose rule, the wiring and the boot budget; save stays v4.
