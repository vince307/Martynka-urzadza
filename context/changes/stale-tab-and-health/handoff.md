# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 11 (e2e, risk #2) written by `/10x-e2e` in run `2026-10-16-fix-stale-tab-health`; spec `tests/e2e/stale-tab.spec.ts`. The next agent must not get wrong: phase 12 is an e2e phase too (`health-lines`, risks #8, #14); the stale-tab spec needs two pages of ONE context on the real IndexedDB (no `?e2eSave`), and the card rises mid-round, so the stale window answers one task only.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `aa68062` (p10), docs ticks, then the p11 test commit and its handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 11.1 and 11.3 (full `--workers=4` suite and full local gate, orchestrator), 11.4 [human], phase 12, earlier [reviewer] rows, 10.5, 10.7, 6.4, 5.5, 3.5, 2.5 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/stale-tab.spec.ts` | two tests: (a) "#2 B-1 a second window that saved later wins; the stale one stops and shows the card", (b) "#2 B-1 a reset in one window is not undone by the other" |
| `playwright.config.ts` | `stale-tab` added to `ROUND_SPEC` (chromium-hook) |
| `context/changes/stale-tab-and-health/e2e-break-p11b.patch` | `writeVerdict` never refuses `OtherWriterSave` (`src/core/save.ts`) |
| `context/changes/stale-tab-and-health/e2e-break-p11a.patch` | card wiring removed in `src/main.ts` (from phase 4) |

## 3. Verification

| Command | Result |
|---|---|
| `npx playwright test tests/e2e/stale-tab.spec.ts` | 2 passed (about 43 s) |
| break p11a (`git apply`), (a) alone | red: `getByRole('alertdialog').getByText('Zacznijmy grę jeszcze raz')` expected visible, element(s) not found; reverted with `git apply -R` |
| break p11b, (a) alone | red: `expect(blockedBy).toBe('otherTab')`, received `null`; reverted |
| break p11b, (b) alone | red: same line, Expected "otherTab", Received null; reverted |
| meta-check | (b) proves the data rule in a real browser (a reset is not written back by the stale window); (a) the child-facing outcome (newest stars win, calm card); p11a leaves `blockedBy` green and fails only on the card, so the card test is not satisfied by the data rule |
| eslint on spec and config, `npm run typecheck`, `npm run build` | OK; `e2e hook: absent (2 chunks checked)`; ports 4397/4398 free |
| full `--workers=4` suite | not run by me (orchestrator gate, expect baseline + 2) |

## 4. Next command

`/10x-e2e stale-tab-and-health phase 12`

## 5. Open

- Rows: 11.1 and 11.3 need the orchestrator's full gate; 11.4 [human].
- The stale window cannot play a whole round: the card rises after the first answered task (a write is refused at once) and holds the game's input; `staleWork` answers one task then polls `blockedBy`.
- Carried: [human] 11.4; [visual] 12.4.

## 6. Autonomous decisions

- Row 10.4 ticked with the orchestrator's gate (3ec9805, 121 e2e passed).
- Rows 11.1 and 11.3 left open: they hold the full-suite and full-gate parts that are the orchestrator's.
- Assertion on the fresh game in (b) is `learner === null` on the welcome screen (the hook has no `stars` there).
- Non-browser aspects of risk #2 (`writeVerdict` rule, store transaction) stay covered by the unit tests of phases 1-4.
