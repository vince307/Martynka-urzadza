# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 8 of run `2026-10-15-fix-s14c-s14d`. Phase 8 is done and committed (review step E6.11 playable). The next agent must not get wrong: `playableSteps(E6)` is now [1..11] but `calendarStart` uses `startableSteps` (no review step), so the E6 oracle [2,3,5,7,9,10] is unchanged; `progressView` total for E6 is now 11 (was 10 playable steps + the review); save stays v2.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e`, p4 `1ced210`, p5 `43b12f4`, p6 `4319de4`, p7 `379721f`, p8 `36e56e8` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 8.5 (e2e part, orchestrator), 8.6 `[reviewer]`, 8.7 `[visual]`; 7.5, 7.6, 6.5, 6.6, 5.5, 5.6, 4.6-4.8, 1.5, 2.6, 2.7, 3.5, 3.6 as before; phases 9-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/types.ts` | `StepDef.review?: true` |
| `src/core/curriculum.ts` | `stepPlayable`, `playableSteps` via it, private `startableSteps` (calendarStart), `skillBuckets` review branch (current = all playable skills of non-review steps, `currentGroups` per step, earlier empty, previous = E5), `buildAdaptiveRound` minCurrent 1 when `currentGroups` exist |
| `src/core/round/pick.ts`, `artFilter.ts` | `SkillBuckets.currentGroups`; draw picks group then skill; `withoutArtBlocked` filters groups too (unfiltered groups return with unfiltered current) |
| `src/data/curriculum/E6.ts` | E6.11 `review: true`, `childName: 'Powtórka roku'` |
| `tests/review.test.ts` | new, 10 tests; pinned tests updated: `curriculumStart` (playableSteps E6), `progress` (total 10), `curriculum` (childName on a review step), `curriculumPick` (bucket oracle knows review) |

## 3. Verification

| command | result |
|---|---|
| RED (stub type field and `stepPlayable`) | 7 of 10 red, e.g. `AssertionError: E6.11: expected false to be true`, `expected null to be 11`, `expected 2030 to be greater than 2400` |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2666 passed = baseline 2656 + 10 |
| `sample` E1-E6 | `Naruszenia: 0` each (E6.11 has no generator, as before) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied; no e2e spec pins E6 data, expected 82 = baseline + 0) |
| Deliberate breaks | `calendarStart` on `playableSteps` -> E6 oracle in `curriculumStart` and the review test red; `pickRoundSkills` ignoring `currentGroups` -> step-share test red. Restored, green. Meta-check: the oracle values are typed, not read from code |

## 4. Next command

`/10x-implement text-measure-time-types phase 9` (phase 9, `Driver: impl`)

## 5. Open

- 8.5 e2e part (orchestrator, `--workers=4`), `[reviewer]` 8.6, `[visual]` 8.7 (import a save with E6 step 10 and mastery 4 on E6.10 skills, one round unlocks E6.11); earlier rows as listed in §1.
- Unlock threshold E6.10 -> E6.11 is the E6.10 threshold (2 of 3); E6.11 itself has no next step, so it never unlocks anything and `recordRound` keeps writing mastery of the real skills.
- A child at `unlockedStep.E6 = 11` stays there (`floorToCalendar` takes max); `changeStageByParent`/warm-up fall paths use calendarStart/unchanged code and never reach step 11.

## 6. Autonomous decisions

1. **Unit pin for the art filter:** `unlockShare` threshold replaced by 1 only when `currentGroups` exist (review). Rejected: changing `artFilter.ts` signature.
2. **`progressView` total** now counts the review step (11 for E6); accepted as honest "step 11 of 11". Would change: a design wish to hide it.
3. **S-15 schedule:** `nextRoundKind`/`afterRound` take only stage id, not steps, so no change and no new test needed.
4. **Mixed phase:** none, whole phase TDD (type field and `stepPlayable` stubbed first).
