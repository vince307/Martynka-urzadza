# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the phase 13 (daily puzzle e2e) finishing step; the last implementation phase is done and `change.md` is `implemented`. Do not run Playwright in finishing steps: the orchestrator does. Next is the review; do not re-open phases 1-13.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phases 1-13 (…, `a87aef0` p12, `f84223e` p13) + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 17 (`grep -c '^- \[ \]' plan.md`), all [reviewer]/[visual]/[human] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/daily-puzzle.spec.ts` | 3 tests: the puzzle pays two stars, same day after a reload, next day brings the puzzle back |
| `playwright.config.ts` | `daily-puzzle` added to `ROUND_SPEC` |
| `context/changes/minigame-daily-puzzle/e2e-break-p13{a,b,c,d}.patch` | deliberate-break patches (production code only) |
| `context/changes/minigame-daily-puzzle/e2e-request-p13.md` | request to the orchestrator plus result notes (p13c 1/6, p13d) |
| `context/changes/minigame-daily-puzzle/plan.md` | rows 13.1-13.5 ticked with sha |

## 3. Verification

| Command | Result |
|---|---|
| daily-puzzle spec (orchestrator) | 3 passed (26.2 s); no spec fix needed |
| p13a (`puzzleMultiplier` 1), `-g "pays two stars"` | red `toBe` Expected 2, Received 1. Restored |
| p13b (autosave snapshot writes the starting variants), `-g "same day after a reload"` | red `not.toBe` Expected not "puzzle". Restored |
| p13c (`pickPuzzle` ignores `puzzlesDone`), `-g "next day brings the puzzle back"` `--repeat-each=6` | red only 1 of 6 (Expected not "floors-up"): the seeded draw rarely lands on the same puzzle, so the e2e cannot prove this rule reliably. The same break turns 2 unit tests red every time (tests/variants.test.ts `pickPuzzle` "never repeats inside a cycle and restarts when all are done", "ignores unknown done ids"), which is where the rule is proven. Patch kept as evidence |
| p13d (orchestrator: `nextRoundKind` gives a puzzle only when `puzzleDay === null`), same `-g` | red `toBe` Expected "puzzle", Received "word": deterministic proof of that test's main claim. Restored |
| Full suite after restore, `--workers=4` | 71 passed (5.9 min) = 68 + 3. `src/` has no diff |
| This step | lint OK, tsc OK, unit 2322 passed (+0), build `e2e hook: absent (2 chunks checked)`. Playwright not run here |
| Teacher read | no change to generators or content lists |

## 4. Next command

`/10x-impl-review minigame-daily-puzzle`

## 5. Open

- Manual-only rows (human checklist): 10.5 [reviewer], 10.6 [human]; 9.4, 9.5, 8.4, 8.5, 7.5, 7.6, 6.5, 5.5, 5.6, 4.4, 3.4-3.6, 1.5, 1.6, 2.5.
- parent-settings #14 load flake (random clock-set task, `setClock` poll in tests/e2e/parent-settings.spec.ts): follow-up, the test should force skills with `?e2eSkills`.
- Follow-ups: `context/changes/minigame-daily-puzzle/follow-ups/review-fixes.md`. Design gaps 79-87 in `docs/design-gaps.md`.

## 6. Autonomous decisions

1. Row 13.4 ticked although the e2e break p13c is red only 1 of 6 runs: the rule (`pickPuzzle` honours `puzzlesDone`) is proven by two unit tests that go red every time, and p13d proves the test's main claim deterministically. Would change: the reviewer wants the e2e assertion on "different puzzle" removed or the pool seeded so it is deterministic.
2. Gap numbering and earlier phase decisions (phases 1-12) stand as in the previous handoff: gap rows 79-87, 11/12 spec files `save-migration`/`minigames` in `ROUND_SPEC`.
3. Mixed phase: none (e2e).
