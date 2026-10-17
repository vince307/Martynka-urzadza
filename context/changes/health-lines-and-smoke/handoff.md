# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 4 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-4 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, `registration.update()` runs once per launch only (no visibility or timer trigger), an `xhrLoader.status` 0 is the `network` cause, never "not on the server", `vite/config.shared.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-3 with handoffs, phase 4 (`feat(health-lines-and-smoke): ... (p4)` 097726f) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 56 (60 minus rows 4.1-4.4, ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/bootLimits.ts` | `bootLimitSchedule`, `bootLimitDue`, `bootLimitWait`: slow and cut moments on an injected wall clock |
| `src/core/artHealth.ts` | `bootQueue` (loadingArt, font, task, room, ui, sound), `fontHealth`, `cutByTable` |
| `src/scenes/BootScene.ts` | `performance.now()` start, slow and cut on `window.setTimeout` (re-armed when early, cleared on `COMPLETE` and `shutdown`, callbacks in `try`), queue via `bootQueue`, `ADD` listener body in `try` with warn-once, `bootLoad = { cut, cutByTable, creates, elapsedMs }`, `REGISTRY_KEYS.fontHealth` from `document.fonts` |
| `src/data/layout.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs` | `fontHealth` key (runtime only); hook snapshot gains `cutByTable`, `elapsedMs`, `fontHealth`; `stallall` joins the markers |
| `tests/bootLimits.test.ts`, `tests/artHealth.test.ts`, `tests/e2eHookGuard.test.ts` | 11 new tests; marker list |

## 3. Verification

| command | result |
|---|---|
| first RED (stubs) | `AssertionError: expected [ 'sound', 'ui', 'room', 'task', …(2) ] to deeply equal [ 'loadingArt', 'font', 'task', …(3) ]`; `expected 'fallback' to be 'loaded'`; cutByTable `expected { task: [], room: [], ui: [], …(2) } to deeply equal …`; bootLimits (stubbed `bootLimitDue` after the first green): `expected 'none' to be 'slow'` / `'cut'` (6 failed) |
| breaks | sounds before room: 1 failed (artHealth); due moments +60 s (paused clock): 2 failed (bootLimits); `stallall` removed from markers: 1 failed (e2eHookGuard); each restored. Meta: prove the rules; timers under a real load are `load-and-tab-guard` #15 (green) |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3573 passed = 3562 + 11 |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -c stallall dist/_app/*.js` no hit |
| e2e `--workers=4` | 132 passed (10.7m), 0 failed; `playwright --list` 132 |
| stray processes | `ps` grep (sandbox disabled) found none of mine |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 5`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5; [visual] 2.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 4. Would change: nothing.
2. **Existing `src/core/bootLoad.ts` kept** (phase and limits check); the new rule is `bootLimits.ts` beside it, as the plan names. `bootLoadPhase` is now unused by the scene but its tests stay.
3. **bootLimits tests were green on first run** (rule written with the stub-free module); the RED was observed by stubbing `bootLimitDue` afterwards. artHealth rules were red from stubs first.
4. **Queue order**: loading pictures stay first (before the limits), then font, task, room, other UI, sounds. `cutByTable` lists the font under `font`.
5. **Early timer** re-arms for the rest (`bootLimitWait`), so a hair-early fire never cuts early.
