# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-tdd` phase 6 of run `2026-10-15-fix-s14c-s14d`. Phase 6 is committed and green except e2e (not runnable here). No coin task is reachable; nothing in the scene changed.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phases 1-5 `a230f1a`, `b9b16d5`, `670e988`, `c6c6600`, `d29760e`; phase 6 `a992ecf`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress | 5.4 ticked citing the orchestrator note (86 passed on `d29760e`); 6.1-6.3 ticked with `a992ecf`; 6.4 e2e (orchestrator), 6.5 `[reviewer]`, 5.5, 4.6, 4.7, 3.5, 1.5, 2.7, 2.8 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/trayDrag.ts` (new) | generic `stepTrayDrag<K>` (`Counts`, `Carrying`, `TrayDragState/Event/Geo/Rules`; `maxPerKind`, `maxTotal`); S13-09 explained in its comment |
| `src/core/blockDrag.ts` | thin instance: same public names (`BlockKind`, `Mat`, `emptyMat`, `matValue`, `initialBlockDrag`, `stepBlockDrag`, `BlockDragGeo` with `matBlockAt`), types are aliases of the generic ones |
| `src/core/coins.ts` (new) | `walletCoins`, `walletValue`, `fewestCoins` (dynamic programming, not greedy) |
| `src/core/round/dragLayout.ts` | `CoinSpec`, `CoinLayout`, `coinLayout(spec, kinds)`: 1-3 kinds in one row, 4 in 2 x 2, more throws; `coin(i)` cell of the i-th wallet coin |
| `src/data/layout.ts`, `balance.ts` | `TASK_LAYOUT.coinDrag` (tray 440 x 300, wallet = block mat, 5 x 2 cells), `balance.coinDrag { startDistance 12, maxTotal 10 }` |
| `tests/trayDrag.test.ts`, `coins.test.ts`, `coinLayout.test.ts` (new); `tests/blockDrag.test.ts` | 36 new tests; old blockDrag cases untouched, two cases appended (S13-09, balance.coinDrag) |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2799 passed (branch baseline 2763, +36); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | exit 0 x6 (no content change) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium dies with SIGTRAP / kill EPERM on `drawn-tasks.spec.ts`, plain `--workers=4`); expected 86 + 0; the orchestrator must run `drawn-tasks.spec` (block drag by touch, cancelled touch) and `adaptive.spec` |
| RED | stubs first (reducer returns state, coins return [], layout empty); `AssertionError: expected { pointerId: 1, kind: 'ten', …(6) } to match object { kind: 'one', from: 'tray', …(3) }` (S13-09 on blocks), plus 31 failing new tests |
| Breaks | old S13-09 (`down` of the same finger returns state) -> 3 red (blockDrag + 2 trayDrag); `fewestCoins` greedy -> `expected [ 200 ] to deeply equal []` (tray 2/5/10 zl); all four kinds in one row -> "3 kinds sit in one row, 4 kinds in a 2 x 2 grid" red (the 96 px test stays green: four tiles of 98 px still fit a row, so the 96 px criterion alone does not catch it). Restored. Meta-check: the `fewestCoins` oracle is an exhaustive search inside the test; the first greedy break fell back to the DP and stayed green, so it was redone as a pure greedy |

## 4. Next command

`/10x-tdd e1-shapes-picture-mode phase 7` (Phase 7, `Driver: tdd`)

## 5. Open

- 6.4 e2e (orchestrator, `--workers=4`, expect 86; `drawn-tasks.spec` and `adaptive.spec` first); 6.5 `[reviewer]` (`blockDrag.ts` thin instance, S13-09 comment); 5.5 `[reviewer]`; manual rows 4.6, 4.7, 3.5, 1.5, 2.7, 2.8.
- `TaskScene` still imports `stepBlockDrag` unchanged; the coin wallet scene, `trayDrag` instance for coins and the geometry hit tests (`coinGeometry`) arrive in phases 7-8.

## 6. Autonomous decisions

1. S13-09 applies to the SAME finger only. The plan says "same or another pointerId", but the existing test "a second finger cancels the carry and changes nothing" must stay unchanged and would fail if a second finger started a new carry; a second finger still cancels. Would change: the maintainer wants a second finger to take over the grab (then that old test is rewritten).
2. Generic geometry hook is named `matAt`; `BlockDragGeo` keeps `matBlockAt` and is adapted in `stepBlockDrag`.
3. `coinLayout(spec, kinds)` takes the spec first (injected, like `dragLayout`), a deviation from the plan's `coinLayout(kinds, wallet)`; wallet cells are positional (`coin(i)`) since counts live in the reducer state. `fewestCoins` returns [] when the target cannot be reached.
4. Wallet tile sizes: 3 kinds 136 x 136, 4 kinds 212 x 142, wallet cells 172 x 214 (all >= 96). Provisional, screenshots at the visual gate (phase 8).
5. No teacher read: no content or generator changed. Commit message and next-phase prompts decided in place, stopped after phase 6.
