# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Written by the impl-review step: the full plan (phases 1–10) is reviewed, APPROVED, `MERGE: CLEAR`; two cheap warnings were fixed in 5295e8a (tests + docs only, no product code). Next is the visual gate; the only open Progress rows are [visual] 3.5, 5.4, 6.5 and [human] 2.6.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phases 1–10 (p1 e6a0b43 … p10 c5b4db4), review fix 5295e8a, plus docs commits (this one: `docs(audit-boot-hidden-tab): impl review`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 4: [visual] 3.5, 5.4, 6.5; [human] 2.6 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/audit-boot-hidden-tab/reviews/impl-review.md` | review report, ends with `MERGE: CLEAR — …` |
| `tests/bootLimits.test.ts` | +3 cases `bootLimitReached` (agreement with `bootLimitDue`/`bootLimitWait`, NaN) — 5295e8a |
| `docs/design-gaps.md` | row 153 cell split fixed — 5295e8a |
| `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md` | refusal-card focus entry corrected (F3); new entries F1 (`bootLimitReached` fold), F5 (CLAUDE.md path at archive); 15 `Trigger:` lines |
| `context/changes/audit-boot-hidden-tab/plan.md` | rows 2.5, 3.4, 7.5 ([reviewer]) and 9.2, 9.3, 10.2 (gate) ticked |
| `context/changes/audit-boot-hidden-tab/change.md` | status `impl_reviewed` |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK / OK |
| unit gate on 46bbd42 (`npm test` + deploy scripts + `sample` E1–E6) + `npm run build` | 3707 passed (baseline 3683, +24); all OK; `e2e hook: absent (2 chunks checked)` |
| `npm test` after 5295e8a | 3710 passed (baseline 3683, +27) |
| e2e `load-and-tab-guard`, `error-boundary`, `save-transfer-blocked` (abs config, sandbox off, 4 workers) | 18 passed (main 16 in these files, +2) |
| full e2e | orchestrator on 46bbd42: 143 passed (baseline 141, +2); not re-run here (no product code changed) |
| break: `BootScene` passes hiddenMs `0` to the three rule calls | `#15 H-1` RED (`elapsedMs` ≥ 6610 expected, 3956 received); restored. Meta: breaks the rule's subtraction, not the fake |
| break: `skillFailure` without `name` | 3 red in `tests/generateTaskFailure.test.ts`; restored |
| break: `bootLimitReached` ignores hiddenMs | 2 red in the new cases; restored |
| `npm run sample -- E1..E6 --count 6`, branch vs main `generateTask.ts`/`visual.ts` | byte-identical; teacher read of `artCutBackground` OK |
| save format | `SAVE_VERSION` 4; migrations, fixtures, storage untouched; `save.ts` gained only `errorCode` |

## 4. Next command

`visual gate` (UI: "Obrazki" background line, "Ups!" card Kod line, import/reset dialog + refusal card after NewerSave)

## 5. Open

- [visual] 3.5: settings "Obrazki" at 1440/1024 — `artCut` (no hidden span) and `artCutBackground` (after a hidden span; hook build `?e2eArt=stallall` + the visibility fake of `#15 H-1` in `tests/e2e/load-and-tab-guard.spec.ts`).
- [visual] 5.4: "Ups!" card (`src/ui/dom/errorCard.ts` `mountErrorCard`) at 1440/1024 with `?e2eFail=step` and `?e2eFail=boot`: muted `Kod: Error · Wersja <id>`, one line at 1024, button focused.
- [visual] 6.5: reset/import dialog after `?e2eSave=newer` shows `deviceNewer`, no site-data advice; after "Zamknij" the refusal card (`mountSaveRefusedCard`) with `Kod: NewerSave` is tappable; check focus (follow-up F3).
- [human] 2.6: real tablet, hidden tab during loading for over a minute.
- Follow-ups with triggers: `follow-ups/review-fixes.md` (F1 `bootLimitReached` fold, F3 focus, F5 CLAUDE.md path to rewrite at `/10x-archive`).

## 6. Autonomous decisions

- D-11 **Reviewed in one session, no subagents**: the code diff is ~480 lines in 29 files and fits one read. Would change: a larger diff.
- D-12 **F1 fixed with tests, not a refactor**: pinned `bootLimitReached` against `bootLimitDue`/`bootLimitWait` instead of removing the export (a product-code change would need the full e2e again). Would change: the next edit of `bootLimits.ts`.
- D-13 **F3 accepted as follow-up**: focus moving to the card behind the dialog is a keyboard/screen-reader issue on a touch-only tablet; visual row 6.5 checks it. Would change: the visual gate showing focus lost or on a hidden button.
- D-14 **Full e2e not re-run**: review changed only tests and docs; the three changed specs were re-run (18/18) and the orchestrator's full run on 46bbd42 (143) stands. Would change: any product-code fix.
- D-15 **Triage prompts decided in place**: "how to proceed" = done after report; warnings fixed when cheap.
- Earlier steps: D-1..D-10 (phases 1–10) are in the git history of this file (46bbd42).
