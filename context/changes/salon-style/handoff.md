# Handoff — `salon-style` (slice fix:salon-style)

Written by the `/10x-e2e salon-style phase 6` step: phase 6 (e2e spec for risks #16 and #12) is committed (d912810); the last phase, so `change.md` is `implemented`.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-style`, cut from `main` at `309e672` |
| Commits | p1 7d2e520, p2 90785fc, p3 6ff84fa (+ 93c4b0a), fix 19e5a40, p4 05be316, p5 65f05e0, p6 d912810, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| Progress rows remaining | 11 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/salon-style.spec.ts` | new: 4 tests, `#12` welcome backdrop graded 10 and no `furnishings-before` request; `#16` fresh salon worn set; `#16` after the stage worn set gone, contact shadows, sofa bought, backdrop `graded` 0; `#16` `?e2eArt=room` draws no worn piece and the stage still sells |
| `playwright.config.ts` | `salon-style` added to the `ROUND_SPEC` regex (hook build, port 4397) only |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/salon-style.spec.ts --workers=1` | 4 passed |
| break 1: `wornPieces` returns `[]` (`-g "fresh salon"`) | red on `worn.keys` (expected ten keys, received `[]`); restored |
| break 2: drop the `stagesDone` guard in `wornPieces` (`-g "after the stage"`) | red on `worn.keys` after the stage (expected `[]`, received 10 keys); restored |
| break 3: skip `applyWornGrade` in `drawRoomMiniature` (`-g "welcome backdrop"`) | red on `backdrop.graded` (Expected 10, Received 0); restored |
| lint, typecheck, `npm test`, build | clean; 3936 passed (p5 3936, +0); `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --list` | `Total: 164 tests in 43 files` = baseline 160 + 4 |
| full e2e | not run (orchestrator) |

## 4. Next command

`/10x-impl-review salon-style`

## 5. Open

- Rows 2.5, 3.5, 4.5, 5.5, 6.2 (full e2e `branch baseline + N`; 6.2 expects 164 total) left for the orchestrator.
- Manual rows 5.6-5.10 [human]/[visual], 5.11 [reviewer].
- Unverified visually: nested per-image ColorMatrix filters in the backdrop under WebGL (the `graded` count of the spec shows the grade was applied, not how it looks).

## 6. Autonomous decisions

- Worn piece keys in the hook are piece ids (`sofa`, not `salon/sofa-morska`), so the spec's literal uses ids; the plan text said "ten-key literal of phase 1". Would change: a hook that reports texture keys.
- Going back from the room is the `resume` target ("Wróć do notesu"), not `roomSwitch` (task screen only).
- Stars seeded to 40 so the stage and sofa both sell in one test; the long-way solve of the first task earns none.
