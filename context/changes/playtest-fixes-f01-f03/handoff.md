# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-tdd` step, phase 1 (F-03 variety rule for ordinary rounds), run 2026-10-20-playtest-boot. Phase 1 is
committed test-first; local gate green; e2e left to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | plan-review commits plus `test(playtest-fixes-f01-f03): Round variety rule for ordinary rounds (F-03) (p1)` and a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 38 (phase 1: 1.5 [e2e part, orchestrator] and 1.6 [reviewer] open) |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/variety.ts` | `pickVariedSkills`, `spreadTypes`, `variedRound` (rng stream identical to `pickRoundSkills`) |
| `src/data/balance.ts` | `balance.round.variety: { maxPerType: 2 }` |
| `src/core/curriculum.ts` | `buildAdaptiveRound` now calls `variedRound` |
| `tests/variety.test.ts` | 6 tests (synthetic buckets, real curriculum E1-E6 x 200 seeds oracles a-e, `buildAdaptiveRound` spread) |
| `tests/round.test.ts` | line pinning `balance.round` extended with `variety` (the plan said existing keys unchanged; this deep-equal test needed the new key) |

## 3. Verification

| command | result |
|---|---|
| RED (stub delegating to `pickRoundSkills`, identity `spreadTypes`) | `AssertionError: seed 2 BAABA: expected 1 to be +0`; `E1.1 seed 1 draw 4: expected false to be true`; `seed 1: expected 3 to be less than or equal to 2`; `E1 seed 4 COMPARE_NUM,COMPARE_NUM,ORDINAL,SHAPES,SHAPES: expected 2 to be +0`; 4 failed, 2 passed |
| GREEN | `tests/variety.test.ts` 6 passed |
| break: drop cap filter | 3 red (both synthetic cases + real-curriculum oracle b), restored |
| break: skip `spreadTypes` | 4 red (synthetic x2, real oracle c, `buildAdaptiveRound` case), restored |
| break: extra `rng.next()` per draw | real-curriculum test red via oracle (a), others green, restored (meta-check: (a) proves the stream alignment) |
| npm run lint / typecheck | OK / OK |
| npm test | 3662 passed (baseline 3656, +6) |
| deploy scripts, `sample` E1-E6, build | OK, exit 0 x6, `e2e hook: absent (2 chunks checked)` |
| e2e | not run (orchestrator at the gate) |

## 4. Next command

`/10x-tdd playtest-fixes-f01-f03 phase 2`

## 5. Open

- Manual rows: 1.6 [reviewer] teacher read of printed rounds (E1-E6 mid step); rest as in the plan (3.5, 4.5-4.7, 6.4-6.6, 7.4, 7.5).
- Row 1.5: e2e part (`npx playwright test --workers=4`, baseline 139 + 0) is the orchestrator's.
- DESIGN-GAPs rows 151/152, follow-ups and ship-step docs status as in the previous handoff.

## 6. Autonomous decisions

- T-1 TDD gate: implementation absent (`src/core/round/variety.ts` did not exist), pure functions: stayed `Driver: tdd`. Would change: none.
- T-2 Manual-gate/commit-message/next-phase prompts decided in place: commit the planned set only, stop after phase 1.
- T-3 `tests/round.test.ts` line 50 edited (adds `variety`): required by the new balance key; the plan's "existing keys unchanged" holds. Would change: none.
- T-4 Replay oracle (b) uses its own rng copy and re-rolls the bucket; the cap-filter break turns it red inside the combined real-curriculum test (one `it` for a-e). Would change: split into separate tests if a reviewer wants isolated failures.
- T-5 Row 1.5 left unticked: e2e not verified by me.
