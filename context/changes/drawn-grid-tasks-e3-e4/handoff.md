# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 8 (impl) done and committed as d9b83f2: three "ustaw zegar" skills in data. Row 8.4 (e2e, incl. `adaptive.spec` timing) is open for the orchestrator; 8.5 `[reviewer]`, 8.6 `[visual]`, 8.7 `[human]` are not mine. Row 7.4 ticked from the orchestrator note.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | d9b83f2 (phase 8) on eacf9e0 (p7) on ab1fa91 (p6) on c01c12e (p5) on e69e6e8 (p4) on 3cb42cc (p3) on 2166514 (p2) on c84ece8 (p1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 8.4 (e2e), 8.5 `[reviewer]`, 8.6 `[visual]`, 8.7 `[human]`; 7.5, 6.6, 6.7, 5.6, 5.7, 4.4, 3.5, 2.5, 1.5 open; phases 9-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/curriculum/E3.ts` | + `E3.3.clock_set_full` (`set`, minuteStep 60), + `E3.11.clock_set_24h` (`set`, 60, `h24`), both answer `drag` |
| `src/data/curriculum/E4.ts` | + `E4.3.clock_set_quarter` (`set`, minuteStep 15), `drag` |
| thresholds | `ceil(0.5 n)`: E3.3 2 skills -> 3 (threshold 1 -> 2), E3.11 4 -> 5 (2 -> 3), E4.3 3 -> 4 (2 -> 2, unchanged) |
| tests | no new test file: `solvableInMode`, `contentInvariants`, `clock.test.ts` iterate over all skills (+9 cases) |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| unit | branch baseline 2196 + 9 = 2205 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0, 0 violations |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium SIGTRAP / kill EPERM on `adaptive`, plain command). Expected branch baseline 57 + 0. WATCH: `adaptive.spec` (E4 step 2 rounds: 10% previous-stage pool is E3, so E3.3/E3.11 set tasks can now appear in `playRoundRight` through the clock branch of `answerRight`), then `first-launch.spec` (warm-up from the E3 pool), `drawn-tasks.spec`, `art*.spec`. If `adaptive.spec` exceeds 160 s: add `test.setTimeout(240_000)` after the existing `test.setTimeout(180_000)` line (replace it) with a comment on the clock rounds; if it fails on a clock task, suspect `setClock` in `tests/e2e/support/hook.ts` (untested until phase 12) |
| Deliberate break | `minuteStep: 15 -> 7` on `E4.3.clock_set_quarter`: 15 failed ("CLOCK params.minuteStep must be one of 60, 30, 15, 5, got 7", contentInvariants + artFilter). Generator answer forced to `'0.15'`: 7 failed (`clock.test.ts` set draws for E3.3, E3.11, E4.3; `solvableInMode` E3.3 clock_set_full drag). Both restored; the break is on the rule (parser/answer reachability), meta-check ok |
| Teacher read | `sample -- E3 --count 6` / `E4 --count 6`: prompts "Ustaw zegar na 10.00." / "13.00" / "1.45"; 24h hint "13 − 12 = 1" does not give the hand position first; quarter hints "między 1 a 2" + "na 9, czyli 45 minut po pełnej godzinie" correct; speak text "godzinę 1 i 45 minut" fine; start poses differ from the target. No defects |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 9`

## 5. Open

- 8.4 e2e (orchestrator: 57 + 0, record `adaptive.spec` duration), 8.5 `[reviewer]`, 8.6 `[visual]`, 8.7 `[human]`; earlier 7.5, 6.6, 6.7, 5.6, 5.7, 4.4, 3.5, 2.5, 1.5.
- `docs/design-gaps.md` rows 73-77 are referenced from comments; phase 10 writes them.
- The clock-to-set canvas branch still has no browser proof until phase 12.

## 6. Autonomous decisions

1. No `adaptive.spec` timeout change: I could not measure (Chromium dead), the plan allows raising only after a measured run > 160 s; instruction is in §3 for the orchestrator. Would change: a measured run above 160 s.
2. Row 8.1 ticked on lint, typecheck, unit, build; the e2e part sits in 8.4.
