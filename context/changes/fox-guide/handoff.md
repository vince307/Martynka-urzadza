# Handoff — `fox-guide` (slice fix:fox-guide)

Written by step `/10x-e2e fox-guide phase 5` of run 2026-10-23-fox-guide: the e2e spec is committed as d228146 and change.md is `implemented`. Next is the review; rows tagged [reviewer]/[visual]/[human] stay open and are not the review's to tick without evidence.

## 1. State

| | |
|---|---|
| Branch | `feat/fox-guide`, cut from `main` at `1962312` |
| Commits | phases 1-4 `e392442`, `2d99dcf`, `953ed88`, `4d590fd`; phase 5 `d228146`, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/fox-guide.spec.ts` | 5 tests, titles `#11 ...`: follows the round, tap on the fox changes nothing, no fox without art, no fox on the unlock card, reduced motion without a pop |
| `playwright.config.ts` | `fox-guide` added to the `ROUND_SPEC` regex (hook build) |
| `context/changes/fox-guide/plan.md` | rows 5.1-5.3 ticked with d228146 |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/fox-guide` |
| `npx playwright test tests/e2e/fox-guide.spec.ts --workers=1` | 5 passed |
| break 1: `guidePose` second/solution/retype returns idle | "follows the round" red (Expected think, Received idle); restored |
| break 2: `.setInteractive()` on the fox image | "a tap on the fox" red (interactive true); restored. Meta: the red is on the `interactive` flag, the tap itself is also asserted unchanged |
| break 3: dropped `textures.exists` guard | "no fox without its art" red (visible true); restored |
| break 4: dropped `prefersReducedMotion()` in `GuideFox.show` | "reduced motion" red (pops 1, expected 0); restored |
| full e2e `--workers=3` | 141 passed, 14 failed under load; `--last-failed --workers=1`: 14 passed, so 155 / 155 |
| `npx playwright test --list` | 155 (main 150 + 5); `git status` shows src untouched after the breaks |
| lint, typecheck | OK |

## 4. Next command

`/10x-impl-review fox-guide`

## 5. Open

- Manual rows open: 3.5 [visual], 4.5 [visual], 4.6 [human], 4.7 [human], 4.8 [reviewer]; row 4.4's e2e half is now measured here (155 = 150 + 5, 4.4 expected `+ 0` for phases 1-4 code).
- The 14 parallel failures were known load timeouts; they pass serially.

## 6. Autonomous decisions

- Tests use a pinned tile skill (`E1.1.compare_qty_10`) on the child path so `answerWrong` works; the unlock test reuses the `health-lines` E4 road. Would change: if the pinned skill leaves E1.
- Break 2 measured with the hook's `interactive` flag plus the unchanged round after a tap at the fox rect; no pointer handler break was needed.
- Epilogue: change.md `implemented` with open [reviewer]/[visual]/[human] rows, as instructed. Commit message taken as proposed; stopped after this phase.
