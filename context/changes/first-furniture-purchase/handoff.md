# Handoff — `first-furniture-purchase` (slice S-09)

Written by `/10x-tdd first-furniture-purchase phase 1` (autonomous run 2026-10-13-s09-s11). Phase 1 (pure star balance and purchase logic) is committed `d792eee`; row 1.3 stays open only for the e2e gate, which the orchestrator must run. Do not let the scene compute the balance: only `core` `earn` and `purchase` results are written back.

## 1. State

| | |
|---|---|
| Branch | `feat/first-furniture-purchase`, cut from `main` at `bb969f7` |
| Commits | 4 docs commits, `d792eee` test(p1), then this `docs(first-furniture-purchase): handoff p1` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/stars.ts` | `earn(balance, delta)`: only a positive integer delta grows the balance |
| `src/core/rooms.ts` | `emptyRoomState`, `currentTask`, `nextTaskCost`, `taskButtonView`, `purchase` (+ `TaskButtonView`, `PurchaseResult`) |
| `tests/stars.test.ts`, `tests/rooms.test.ts` | 13 tests (3 + 10) on a hand-written two-task room |
| `context/changes/first-furniture-purchase/plan.md` | rows 1.1, 1.2 ticked with `d792eee` |
| `context/changes/first-furniture-purchase/change.md` | status `implementing` |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs, so assertion failures not missing module) | 12 failed, e.g. `AssertionError: expected -1 to be +0` (`emptyRoomState().tasksDone`), `expected undefined to be 't2'` (`currentTask`) |
| GREEN | `npx vitest run tests/stars.test.ts tests/rooms.test.ts`: 13 passed |
| Deliberate break | `purchase` `stars > cost` instead of `>=` and `earn` without the delta guard: 2 failed (`with exactly the cost buys down to 0…`, `a negative, fractional or NaN delta never lowers…`), restored, 13 passed. Meta-check: oracle is FR-016/US-02 (spend down to 0, never lose stars), written in the test, not read from the code. Note: `> cost` does not break the "one short is refused" test, only the exact-cost one, as intended |
| `npm run lint` / `typecheck` | OK / OK (one `no-unsafe-return` in the test helper fixed) |
| unit (`npm test` + deploy tests + `sample` E1–E6) | OK, Tests 987 passed (baseline 974, +13) |
| `npm run build` | OK, e2e hook absent |
| `npx playwright test` | e2e: not runnable in this session (MachPort `Permission denied (1100)`, 7 failed / 16 did not run, all at browser launch) — orchestrator gate |

## 4. Next command

`/10x-tdd first-furniture-purchase phase 2`

## 5. Open

- Row 1.3 (full local gate) open only for e2e: orchestrator runs `npx playwright test` on `d792eee` and re-dispatches phase 1 if red (no UI/scene code changed, so red would mean environment).
- Earlier open items unchanged: `[human]` rows 7.6–7.10, `[visual]` 4.6, 5.5, 6.5, 6.6, `[reviewer]` 2.5, 6.4, seam sweep 7.5; Chromium-dependent phase 4 break 4.4 and phase 8; DESIGN-GAP 31–36 in phase 7.
- Test room in `tests/rooms.test.ts` is local; phase 2 data (`src/data/rooms.ts` SALON) must satisfy `RoomDef` with `label` as a `pl.room.tasks` key.

## 6. Autonomous decisions

- Skill's TDD gate: implementation absent (no `stars.ts`/`rooms.ts`), pure logic, so TDD with no redirect. No AskUserQuestion.
- RED made assertion-based via throwaway stubs in the same files (replaced by the real code), per run rules.
- `purchase` argument checks order: no-task, then bad-variant, then short. Would change: a UI need to distinguish short before bad variant (none).
- `earn` ignores any non-positive-integer delta (including 0 as no-op). Would change: fractional stars introduced by balance data.
- Commit split: one test commit with plan/change, then SHA ticks plus handoff in a docs commit (SHA cannot be in its own commit). e2e left to the orchestrator per common rule 10.
