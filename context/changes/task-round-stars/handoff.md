# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-impl-review task-round-stars` (full plan, phases 1–11) of autonomous run 2026-10-12-s04-s08. Verdict APPROVED, `MERGE: CLEAR`; review fixes are in `0c0baf4`. The next step must take its screenshots after `0c0baf4`: the bar, tiles and star start moved (V2, V4).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | docs + p1..p11 + `0c0baf4` (fix) + this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 10 (`[visual]` 5.6, 6.4, 7.4, 8.4; `[human]` 8.5, 10.5–10.8; `[reviewer] (CI at ship)` 9.8) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/task-round-stars/reviews/impl-review.md` | report, 0 critical / 6 warnings (all fixed) / 6 observations, ends with `MERGE: CLEAR` |
| `src/data/layout.ts` | `TEXT_COLOR`, palette `pressed/tileBorder/field/fieldPlaceholder`, `solutionLine` 44, `tiles.top` 712, `bar.bottom` 960, `ANIMATION.starStartLift`; dead keys removed |
| `src/ui/widgets/*.ts` | colours from `layout.ts` instead of local copies |
| `src/scenes/TaskScene.ts` | `create` resets fields; `flyStar` starts above the tile; `toCssColor` removed |
| `src/core/round/view.ts`, `vite/config.shared.mjs` | DESIGN-GAP row 2 comment; build-id comment corrected |
| `tests/geometry.test.ts`, `tests/pick.test.ts`, `tests/e2eHookGuard.test.ts` | bar gap test, tile choices in `buildRound`, hook marker matches `e2eHook.ts` |
| `AGENTS.md` | body trimmed to 400 words |
| `plan.md`, `change.md`, `follow-ups/review-fixes.md` | rows 1.5, 2.5, 5.5, 7.5, 10.4 ticked; status; new follow-ups with `Trigger:` |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK (before and after fixes) |
| unit (contract command) | 588 before fixes (baseline 441, +147); 590 after `0c0baf4` (baseline 441, +149); deploy and ops tests OK; `sample` E1–E6 `Naruszenia: 0` |
| build | OK, `e2e hook: absent (2 chunks checked)`; `__martynkaE2E` 0 hits in `dist/` |
| `npx playwright test` | 4 passed (baseline 1, +3) before and after fixes; ports 4397/4398 empty |
| Break A | bonus also for second-try rounds in `round.ts` `next`: `round.test.ts` 2 red, e2e test 2 red `Expected: 0 / Received: 2`; restored. Meta: unit and e2e catch it independently |
| Breaks B–D | tiles skipped in `generateTask` → `pick.test.ts` red; hook property renamed → marker test red; `bar.bottom` 972 → gap test red `expected 4 to be >= 16`; all restored |
| Teacher reads | `sample -- E1 --count 6`, MISSING E1/E3/E4, `pl.round`: pass (details in the report) |

## 4. Next command

`visual gate (orchestrator), then /10x-archive task-round-stars and ship`

## 5. Open

- [visual] 5.6, 6.4, 7.4, 8.4: screenshots at 1440×900, 1024×768 (and 420×760 rotate overlay) after `0c0baf4`.
- [human] 8.5 iPad touch latency; 10.5–10.8 product decisions (Dalej, "Spróbuj jeszcze raz" alone, select excluded, switch not drawn).
- [reviewer] (CI at ship) 9.8: job `check`, step `Run npm run build`, regex `e2e hook: absent \([0-9]+ chunks checked\)`.
- Follow-ups in `follow-ups/review-fixes.md`: V3 slashed zero (maintainer), bar text size, `wordTemplates.ts` `contexts` złoty + buy, `roundView` mode from choices, `firstHint` ROUNDING by id, e2e `counter` vs `StarCounter` `value`, `snapshot` answer copy, `hints.test.ts` skip count.

## 6. Autonomous decisions

1. **Triage without asking**: all warnings fixed in one `fix` commit (cheap, tested); observations needing model changes deferred to follow-ups. Would change: a CRITICAL found by the visual gate.
2. **V1**: solution lines raised to the kit's 44 px; bar text kept at 36 px (kit 34). Rejected: inventing a larger size outside the kit. Would change: the visual gate or iPad check finds the bar unreadable.
3. **V2**: tiles moved up 12 px from the kit's 724 to keep 16 px gaps both sides of the bar (kit gaps 16–32). Would change: a kit revision of the task layout.
4. **V3**: not changed; the font has no plain zero and the kit approves the slashed one. Would change: maintainer asks for a plain 0 (needs another font).
5. **`pl.title` kept** though unused today, as the game title for S-05 screens. Would change: S-05 not using it.
