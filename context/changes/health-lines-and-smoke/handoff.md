# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-e2e` phase 13 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1-13 are committed. Do not get wrong: save format stays v4; phase 14 is `Driver: e2e`; the plan's test (a) cannot assert "the round has no task of the stalled skill" in the browser, because `?e2eSkills` forces a round that bypasses `artFilter` (unit tests of `artFilter` keep that claim).

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phases 1-12 with handoffs, phase 13 (`test(health-lines-and-smoke): Stalled picture, cut start and missing font in the browser (p13)`, f3ffef1) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (13.1-13.3 ticked with sha) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/load-and-tab-guard.spec.ts` | two new tests: `#15 A-9 one stalled money picture ends by its own limit and the panel names the folder and the cause` (`?e2eArt=stall`, one coin file hangs, panel shows folder line, skipped line, network cause, restart advice, no `fetch` cause) and `#14 B-4 a cut start says some pictures did not finish` (`?e2eArt=stallall`, hook `bootLoad.elapsedMs` >= 3000, panel shows `artCut`); `hold` moved to module level |
| `tests/e2e/health-lines.spec.ts` | new test `#14 A-7 a font that did not load is named` (font route answers 404, hook `fontHealth` is `fallback`, panel shows `fontFallback`) |
| `tests/e2e/support/hook.ts` | snapshot type: `bootLoad.elapsedMs`, `fontHealth` |
| `context/changes/health-lines-and-smoke/plan.md` | rows 13.1-13.3 ticked |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3653 passed (baseline 3653, +0); deploy scripts OK; samples OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 133 passed before; 136 passed after (workers=4); `playwright --list` 136; baseline 133, +3 |
| break p13a (`artCauses` always `never`) | RED by assertion: `expect(locator).toBeVisible()` for the `artCause.network` text, element(s) not found; restored |
| break p13b (`kind: 'cut'` line removed from `artHealthLines`) | RED by assertion: `expect(locator).toBeVisible()` for `artCut`, element(s) not found; restored |
| break p13c (`fontHealth` always `loaded`) | RED by assertion: `expect(received).toBe(expected)` Expected "fallback", Received "loaded"; restored |
| meta-check | (a) the break is the cause mapping, not copy; the skip-of-skill claim stays with the `artFilter` unit tests. (b) the cut line is `artCut` text shared with `artCause.cut`, but the break removes the line the test reads. (c) proves Chromium's `document.fonts` status, not WebKit's |
| restored | `git status` shows only the three test files and plan before the commit; `src/` diff empty |
| stray processes | ps grep for sleep/until/while/tail -f/playwright/vite (sandbox disabled), after the run: empty; ports 4397/4398 free |

## 4. Next command

`/10x-e2e health-lines-and-smoke phase 14`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4, 3.4, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.5, 11.6, 11.7; [visual] 2.5, 5.5, 6.5, 7.5, 8.5, 10.6; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- Phase 14 (e2e): the screen fallback (wallet, notebook, miniature) reaches the panel.
- Follow-ups: `context/changes/health-lines-and-smoke/follow-ups/review-fixes.md` (14 entries). New: no browser test proves the round skips a skill whose picture stalled (`?e2eSkills` bypasses the filter); trigger: a change touching `withoutArtBlocked` or `buildAdaptiveRound` art wiring.

## 6. Autonomous decisions

1. **Test (a) asserts the panel, not the round's skills.** Chosen: folder line, skipped line, network cause and restart advice, because forced skills skip `artFilter`. Rejected: an unforced E4 round (non-deterministic skill draw). Would change: a seam that runs the adaptive draw with a fixed seed.
2. **Hung file is `coin-1zl.webp` only**, not the whole folder, so the folder count is exactly 1. Would change: the money folder gaining a second use of that id.
3. **(b) uses the parent path** with `stallall` routes held, since the settings panel is not reachable from the welcome screen.
4. **Commit message proposed as given**, handoff in a separate commit.
