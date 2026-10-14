# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-tdd` phase 4 step (phase 3's e2e row 3.4 ticked from the orchestrator note: 63 passed on cd5b705). Earlier: phase 3 step (autonomous run 2026-10-14-save-s13b-s15-s14b). Save texts and the `?e2eSave=v1` seam are built and committed (`cd5b705`); phases 4-13 are untouched. The e2e run of phase 3 is NOT done (Chromium cannot start in this session): the orchestrator must run the full suite and watch the tests named in §3.

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phase 1 `b0ad4ba` + phase 2 `8ee3d18` + phase 3 `cd5b705` + phase 4 `5a18b39` + handoffs |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 3: 3.1-3.3 ticked, 3.4 open (e2e), 3.5 [reviewer], 3.6 [visual] open; 2.4 ticked citing the orchestrator note |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/variants.ts` | `nextRoundKind(state, ctx)`, `afterRound(state, kind, today, puzzle?{id,poolIds})`, `pickPuzzle(pool, done, rng)`, `variantRules(kind, n, {round, variants})`; types `Minigame`, `VariantKind`, `RoundKind`, `ScheduleContext` |
| `src/core/day.ts` | `localDay(Date)` from local fields |
| `src/data/balance.ts` | `balance.variants` (everyRounds 3, puzzleMultiplier 2, puzzleStages E3/E4, minigames [] , dice, word) |
| tests | `tests/variants.test.ts` (13), `tests/day.test.ts` (1) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / build | OK / OK / OK (`e2e hook: absent (2 chunks checked)`) |
| unit + deploy scripts + sample E1-E6 | 2269 passed (branch baseline 2255, +14); sample exit 0 for all |
| RED | before implementation: `AssertionError: expected '' to be '2026-01-05'`, `expected 'round' to be 'puzzle'`, `expected +0 to be 1` |
| Breaks | `!==` -> `<` (2 red), `starPerTask * 1` (1 red), `roundsSince: 0` on a round (1 red), `pick(pool)` ignoring done (2 red); restored. Meta: the day test uses an earlier and a later date, so it tells `!==` from `<` |
| e2e | not runnable in this session - orchestrator gate (MachPortRendezvous Permission denied); expected 63 (+0), no UI touched |

## 4. Next command

 (Phase 5: Pula 15 zagadek LOGIC (E3-E4); `Driver: tdd`)

## 5. Open

- 4.3 e2e part (orchestrator), 4.4 [reviewer]; 3.5 [reviewer], 3.6 [visual]; earlier 1.5, 1.6, 2.5.
- DESIGN-GAP 82 row in `docs/design-gaps.md` still due in phase 10.
- No content change (no teacher read needed).

## 6. Autonomous decisions

1. `afterRound` takes `puzzle?: {id, poolIds}` (plan said only `puzzleId`): the cycle reset needs the pool ids. Would change: pool known elsewhere.
2. `ScheduleContext.forced` word/dice picks that minigame (skips the puzzle); forced puzzle obeys the day/pool rule and falls back to a minigame; unavailable forced kind falls to the other minigame.
3. `balance.variants.minigames` is typed `readonly ('word'|'dice')[]` (empty until phases 8-9).
4. `variantRules` returns exactly the three RoundRules fields (drops `uniqueRetries`).
