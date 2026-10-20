# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-e2e` step, phase 8 (first-launch spec for "Wróć", risk #12), run 2026-10-20-playtest-boot.
Phase 8 committed (40fbb71). Row 7.3 and 8.2/8.3 await the orchestrator's full e2e and gate. Phase 9 is e2e.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phases 1-6 (49a682f, e6b1d9c, 9f0cb7c, 27227e3, 6bd7c17, 33772b7), phase 7 `docs(playtest-fixes-f01-f03): rule files, design plan, follow-ups and seam sweep (p7)` 460a56d, a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 7.3 (e2e, orchestrator), 7.4 [human], 7.5 [reviewer], 6.4 [visual], 6.5 [reviewer], 6.6 [human], 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer]; phases 8-9 open |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | "Current state": warm-up in `src/core/round/warmup.ts`, gear with `SettingsHint`, auto-read off (`autoReadStages` `[]`), variety rule, "Wróć" (`ageBackOffered`, `backToAge`), gaps 151-152 |
| `Martynka-urzadza.md` | Założenia and task-screen narrator lines (auto-read off for every stage), first-launch "Wróć" sentence, variety rule next to 60/30/10 |
| `context/changes/playtest-fixes-f01-f03/follow-ups/review-fixes.md` | 7 entries, each with a `Trigger:` line |
| `src/core/round/variety.ts`, `pick.ts` | merged duplicate `../types` import; `pick.ts` header names `variety.ts` / `warmup.ts` |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck / npm test | OK / OK / 3682 passed (phase 6 3682, +0) |
| deploy scripts, sample E1-E6, build | OK, `e2e hook: absent (2 chunks checked)` |
| 7.1, 7.2 | `muted gear` count 0, `placement.ts` no longer claims `buildWarmup`; 7 `Trigger:` lines |
| `validate-rule-files.sh` | PASS (17 files, missing 0) |
| sweep | no duplicated tally helper (one `tally` map owned by `warmup.ts`, used by `pickVariedFromStage`); remaining `muted` in src are the DOM class `overlay-muted`, no `E1-E2` default text left in src or design-gaps |
| deliberate break | `ageBackOffered` returning true: new test red at the final `ageBack` null assertion (received {x:90,y:928}); restored, green. The flush-removal break was not run: the spec waits for `save.dirty` false before the reload, so the debounce would hide it. |
| e2e | first-launch.spec.ts 7 passed (6 old + 1 new, age 9 -> E5 warm-up); lint + tsc on spec OK; ports 4397/4398 freed |

## 4. Next command

`/10x-e2e playtest-fixes-f01-f03 phase 9`

## 5. Open

- Rows 7.3, 8.2 (full e2e, baseline + 1) and 8.3 (full gate) wait for the orchestrator.
- Manual rows: 7.4 [human] PRD FR-009, 7.5 [reviewer], 6.4-6.6, 4.5-4.7, 1.6, 3.5.
- Epilogue (status implemented) after phase 9.

## 6. Autonomous decisions

- T-1..T-3, P4-1..P4-3, P5-1, P5-2, P6-1..P6-3 stand.
- P7-1 Did not invoke the Skill tool; followed the phase plan directly. AGENTS.md absent from the repo, so only CLAUDE.md edited.
- P8-1 Spec uses age 9 (E5) as the new age: age 7 in October maps to E1, which has no warm-up. Spec added to first-launch.spec.ts as one test.
- P7-2 Left `pickVariedSkills`/`byType` exports (used inside `variety.ts` and tests) rather than churn the module. Rejected: removing exports. Row 7.3 not ticked until the orchestrator's e2e.
