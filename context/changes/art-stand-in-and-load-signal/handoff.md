# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-tdd` phase 1 step of run `2026-10-14-fix-art-stand-in`. Phase 1 is committed (`3be41c7`); the e2e part of its gate row 1.4 is open for the orchestrator. The next agent must keep `artBlocked`/`withoutArtBlocked`/`artHealth` pure (no Phaser, no `taskArt.ts` import) and pass `art` to `buildAdaptiveRound` only from `TaskScene.freshRound` in phase 3.

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + `3be41c7` (phase 1) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` is not yet set (left as `plan_reviewed`; orchestrator/next phase may bump) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (1.1-1.3 ticked, 1.4 and 1.5 open) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/artHealth.ts` | `artHealth`, `artHealthView`, types `ArtHealth`, `ArtHealthView` |
| `src/core/round/artFilter.ts` | `artBlocked`, `withoutArtBlocked` |
| `src/core/curriculum.ts` | `unlockThreshold` (used by `unlockReady`), optional `art` argument of `buildAdaptiveRound` |
| `src/core/round/pick.ts`, `src/core/round/warmup.ts` | optional `blocked` predicate in `pickSkills` / `buildWarmup` (falls back to the whole pool when it would be empty) |
| `tests/artHealth.test.ts`, `tests/artFilter.test.ts` | 15 new tests |
| `tests/spoken.test.ts` | 30 s limit on three `forEachTask` walks (comment as in `cd42b4a`) |
| `context/changes/art-stand-in-and-load-signal/plan.md` | rows 1.1-1.3 ticked with sha |

## 3. Verification

| Command | Result |
|---|---|
| RED (before implementation, stubs returning neutral values) | `AssertionError: expected false to be true` (artBlocked MONEY_COUNT), `expected +0 to be 3` (unlockThreshold), `expected +0 to be 38` (artHealth total), `expected 49 to be +0` (MONEY_COUNT drawn with coins missing): 9 failed, 6 passed |
| `npm run lint` / `npm run typecheck` | OK |
| `npm test` | 1880 passed (baseline 1865 incl. 1 flaky, delta +15); spoken timeout did not recur |
| deploy and ops shell tests | OK |
| `npm run sample -- E1..E6` | exit 0; output byte-identical to the pre-change output (stash comparison) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | e2e: not runnable in this session (Chromium MachPortRendezvous Permission denied) - orchestrator gate; row 1.4 left unticked |
| Deliberate breaks | (a) current filtered without threshold: 2 red; (b) CAPACITY `howMany` blocked: red only after the test was fixed to use real `E4.7.capacity_litres_half` (first version skipped silently - meta-check caught it); (c) rng consumed when `art` given: 1 red (seed test); restored. Removing the `missing.size > 0` guard stays green: equivalent mutant (`artBlocked` returns false on an empty set and no rng is used), so no behaviour to protect |

## 4. Next command

`/10x-tdd art-stand-in-and-load-signal phase 2`

## 5. Open

- Row 1.4 e2e (`baseline + 0`) for the orchestrator; row 1.5 `[reviewer]`.
- Plan deviation: the plan says E5.5 with the half-litre jug missing leaves `current` unfiltered. With the specified rule (`current` filtered when at least `unlockThreshold` remains) E5.5 has 2 playable skills, threshold 1, so the jug skill IS dropped and `mass_half_kg` stays. Implemented per the rule; the test asserts that. Phase 7 / the FR-013 human decision (row 7.7) should know.
- `buildAdaptiveRound` `art` is wired but no caller passes it yet (phase 3); `pickSkills`/`buildWarmup` `blocked` likewise.
- `change.md` status was not touched by this step.

## 6. Autonomous decisions

1. **Triage applied by the reviewer, no `AskUserQuestion`** (contract rule 1): every WARNING had an obvious in-plan fix, so all were FIXED; none went only to Known risks except the residual part of F3. Would change: a finding needing a product choice not covered by the PRD.
2. **Split Phase 3 rather than keep it** (step prompt: split if too big). Chosen: signal/seam/filter vs. panel line, because the panel line carries its own teacher read and visual gate while the rest has none. Rejected: splitting off the seam alone (the filter and record have no browser proof without it). Would change: an implementer finishing phases 3+4 in one session would not make the split wrong, only unnecessary.
3. **Filter scope kept (MONEY_COUNT, MASS, CAPACITY `toLitres`)**: MONEY_CHANGE and `howMany` carry their amounts in the prompt text, COUNT/MULT_GROUPS stay countable, the thermometer scale is drawn in code. Would change: the phase-5 teacher read finding labelled boxes misleading in MONEY_CHANGE.
4. **Unlock-threshold rule kept; formula unified in Phase 1 (`unlockThreshold`)** instead of the sweep. Would change: none (pure refactor guarded by existing `unlockReady` tests).
5. **S12-01 kept (refuse on `unavailable`, warn on `unreadable`)**: the start card's "Zachowaj kopię" is reachable because writes stay off under `unreadable`, so the card returns at each launch; the panel-export trap is mitigated in copy only (S12-04 out of scope by Step 0). Would change: the maintainer wanting the export dialog to warn too (then pull S12-04's warning part into phase 6).
6. **Next command `/10x-tdd … phase 1`** (Phase 1 driver unchanged: `tdd`).
