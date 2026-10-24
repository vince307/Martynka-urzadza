# Salon backdrop after a context restore, honest backdrop record, missing fox named — Plan Brief

> Full plan: `context/changes/audit-backdrop-fox/plan.md`
> Research: `context/changes/audit-backdrop-fox/research.md`

## What & Why

One small fix PR for two observability audits (PR #101: B-1, B-2, C-1; PR #104: G-1, G-2), asked for by the maintainer
("zrob pr naprawczy", 2026-10-24). After a WebGL context loss the blurred salon behind the notebook comes back blank and
nobody redraws it; the backdrop record says what was asked, not what was drawn; the art inventory names the old font
file; a missing fox is not named for the parent (and the "Obrazki" sentence is untrue for it); one missing fox pose makes
the fox blink by round phase.

## Starting Point

`SalonBackdrop` captures the salon into a DynamicTexture (blank after a restore in Phaser 4.2.1); no scene listens to the
renderer's `restorewebgl`. `GuideFox` checks each pose texture per call and records nothing; "Obrazki" has only the
"gra rysuje" fallback line and a UI count line that always promises "napis lub rysunek".

## Desired End State

Lose + restore the WebGL context on the welcome, task or room screen: the salon is drawn again before the next frame, the
hook shows `redraws` and an opaque salon pixel. With one fox pose missing the fox never shows that session, the hook
reports the requested pose, and the parent reads "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka."
Save format stays v4.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Redraw timing | synchronous in the `restorewebgl` handler, also while `TaskScene` sleeps | the event fires after GL resources are rebuilt and before the next frame, so no blank frame | Research (R1) |
| Listener owner | each owner scene, `off` on shutdown | scenes own the refresh path and the room bookkeeping | change.md D2, Research R2 |
| Backdrop record | `drawn`, `blurred`, `renderer`, `redraws` in the snapshot; `captures` unchanged | outcome beside intent; an existing e2e relies on `captures` | Scope 3, Plan P-7 |
| Pixel read | separate hook getter `backdropPixel`, `null` under Canvas | no GPU readback per poll; Canvas snapshot is async and returns an Image | Plan P-2, P-6 |
| Fox availability | `guideAvailable` once in the `GuideFox` constructor | whole-session hide, no blinking | Scope 6, Research |
| Parent lines | own `guide` line + `standIn` flag on the UI count line | "gra rysuje" and "napis lub rysunek" are untrue for the fox | Research R5, Plan P-5 |
| G-2 test form | `page.route` abort of `fox-think.webp` + unit table | no test-only product code; departs from scope 6's literal options → `[human]` row | Research R4, Plan P-4 |
| Console noise on restore | accepted, no console assertions | Phaser deleting a stale framebuffer; harmless | Plan P-3 |
| Design gaps | row 168 amended, no new row | no visible change after a synchronous redraw | change.md D6 |

## Scope

**In scope:** B-1, B-2, C-1, G-1, G-2; Phaser pin; source guards; CLAUDE.md sentence; follow-ups with triggers.

**Out of scope:** save/balance/curriculum/child text; other audit findings (N-7, N-8, A-1 …); new `e2eArt` seam; fox
placement/poses/motion; real-device proof of context loss; roadmap edit.

## Architecture / Approach

Pure rules in `src/core/guide.ts`, `artPick.ts`, `artHealth.ts` (test-led) → `GuideFox` and the one `UIScene` argument →
`SalonBackdrop` record + `restorewebgl` listeners in `TaskScene`/`WelcomeScene` + hook getter + Phaser pin → docs and
sweep → browser proof.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Fox rule and "Obrazki" lines (tdd) | `guideAvailable`, `guide` line, `standIn`, copy | typing `'guide'` out of `artFallbackNames` |
| 2. Fox hides for the scene (impl) | constructor rule, `recordFallback('guide')`, `requested` | the scene-level proof waits for phase 6 |
| 3. Backdrop record and restore redraw (impl) | record, listeners, `backdropPixel`, pin, wiring test | listener leak across scene restarts |
| 4. Docs, follow-ups, sweep, visual (impl) | C-1, row 168, CLAUDE.md, follow-ups, screenshots | screenshots of a forced restore need Playwright |
| 5. Backdrop restore e2e (#12, #11) | 3 tests: welcome, task, room open | WebGL in headless Chromium (observed working) |
| 6. Missing pose e2e (#11, #14) | 2 tests in `fox-guide.spec.ts` | service worker serving the aborted file (blocked) |

**Prerequisites:** branch `feat/audit-backdrop-fox` at research; Phaser 4.2.1; Playwright Chromium with WebGL.
**Estimated effort:** six phases, about one session each; e2e gate ~11 min per phase.

## Open Risks & Assumptions

- A Phaser upgrade changing the restore order (the pin turns red first).
- `snapshotPixel` between frames could disturb rendering in e2e (not seen in research).
- Two `[human]` rows: the parent wording and the G-2 proof form.

## Success Criteria (Summary)

- After a forced context restore the salon backdrop is drawn again on every screen that shows it, proven by e2e.
- A missing fox pose hides the fox for the whole round, and the parent reads a true sentence about it.
- Gate green with unit `baseline + N`, e2e `baseline + 5`; save format v4 untouched.
