# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-e2e` phase 12 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-12 are committed. Do not get wrong: save format stays v4; phases 13-14 are `Driver: e2e`; the plan asked for "+2" but (b) is an assertion inside an existing test, so the suite grew by +1.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-11 with handoffs, phase 12 `887fd36` (`test(health-lines-and-smoke): Purchase under a failing store, slots reachable (p12)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (12.1-12.3 ticked with sha) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/save-restart.spec.ts` | new test `#2 M-5 a stage and a sofa bought while the store refuses keep the stars and say so` (writefail seam, stars 12 - 5 - 7, failure count grows, "Zapis gry" `data-state=failing`, no alertdialog) |
| `tests/e2e/room-change.spec.ts` | in `FR-019 …` test: `room.unreachable` equals `[]` after all purchases (risk #16 R-6) |
| `tests/e2e/support/hook.ts` | `room` snapshot type gained `unreachable: string[]` |
| `context/changes/health-lines-and-smoke/plan.md` | rows 12.1-12.3 ticked |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3653 passed (baseline 3653, +0); deploy scripts OK; samples OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 133 passed; `playwright --list` 133; baseline 132, +1 (one new test; (b) is an assertion) |
| break p12a-1 (plan's: comment out `flush('now')` in `RoomScene` purchase) | stayed GREEN: the debounced write also fails and bumps the count. Not used as a break; the test was kept because other breaks turn it red |
| break p12a-2 (`saveHealth.ts` failing threshold `> 0` to `> 99`) | RED by assertion: `expect(locator).toHaveAttribute` Expected "failing", Received "notYet"; restored |
| break p12a-3 (`autosave.ts` `consecutiveFailures++` removed in the write catch) | RED by assertion: `expect(received).toBeGreaterThan(expected)` Expected > 0, Received 0; restored |
| break p12b (`holdPoint` returns null for `sofa`) | RED by assertion in `FR-019`: `toEqual` Expected `[]`, Received `["sofa"]`; restored (the related-tests hook also showed 3 unit reds meanwhile) |
| meta-check | (a) reaches the purchase path, the failing store and the parent panel (no Safari IndexedDB errors involved); the flush-to-now ordering is not provable in the browser because the debounce hides it, so that claim stays with the unit tests of `RoomScene` wiring. (b) proves `unreachable` over the real salon alpha, which unit tests only fake |
| restored | `git status` shows only the three test files and plan before the commit; `src/` diff empty |
| stray processes | `ps` grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), after the run: empty |

## 4. Next command

`/10x-e2e health-lines-and-smoke phase 13`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5, 11.6, 11.7; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Phases 13-14 (e2e): stalled/broken picture and missing font, screen fallback in the panel.
- Follow-ups: `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` (14 entries). New: no browser test proves `flush('now')` after a purchase while the store fails (debounce masks it); trigger: a change touching `RoomScene` purchase saving.

## 6. Autonomous decisions

1. **Plan break p12a replaced** by two breaks on `saveHealth.ts` and `autosave.ts`: the planned `flush('now')` removal stayed green. Chosen: breaks that protect what the test asserts. Would change: a seam making the debounce inert in the hook build.
2. **Kept the test** despite the first break staying green, because the test is not green through every break of the rule it names (count and panel line). Would change: reviewer wants the flush ordering proven.
3. **Delta +1 not +2**: (b) lives as an assertion in the existing `FR-019` test, matching the plan's "an assertion in room-change". Would change: a separate test is wanted.
4. **Commit message proposed as given**, handoff in a separate commit.
