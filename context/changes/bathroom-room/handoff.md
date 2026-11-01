# Handoff — `bathroom-room` (slice S-31)

Phase 1 (`tdd`) is done and committed as `7c742b8`: the pure rule `roomDoneCardRect` exists with tests. Nothing visible changed. Phase 2 switches `RoomDoneCard.show` and `ROOM_DONE_LAYOUT.card` to it and must rewrite the layout test that builds `rect(card)` (plan review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, then `7c742b8` phase 1, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 33 (rows 1.1-1.4 ticked with ` — 7c742b8`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/roomDoneLayout.ts` | new: `roomDoneCardRect(count, spec)` returning `{ left, width, tileLefts }`, plus `CardSpec`, `CardRect` |
| `tests/roomDoneLayout.test.ts` | new: 7 cases (n 0..5 literals from today's 388/1144 card, tiles inside the card for 1..5) |
| `context/changes/bathroom-room/plan.md` | rows 1.1-1.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stub returned `{ left: 0, width: 0, tileLefts: [] }`) | `AssertionError: expected { left: +0, width: +0, tileLefts: [] } to deeply equal { left: 388, width: 1144, …(1) }` on 6 cases; the module existed as a stub, so the failure is an assertion |
| GREEN | `npx vitest run tests/roomDoneLayout.test.ts` 7 passed |
| Break 1: drop `2·padding` from the width | red: count 4 (202/1516) and count 5 (16/1888); restored |
| Break 2: shift tile start by +1 from the centre formula | red: counts 1-5; restored (the plan's "centre on `left + minWidth/2`" is arithmetically identical to `centerX` for n ≤ 3, so a shifted start was used instead) |
| Meta-check | expectations are hand-computed literals, the spec is a literal in the test, not imported from `src/data` |
| lint / typecheck | OK |
| unit incl. deploy and ops tests, `sample` E1-E6 | `Tests 4222 passed (4222)` locally; baseline 4215 (4212 passed in CI) + 7 new |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `git diff --stat 6b96a9f -- src/ui src/scenes src/data src/testing tests/e2e` | empty |
| e2e | not run (no spec touched) |

## 4. Next command

`/10x-implement bathroom-room phase 2`

## 5. Open

- Phase 2 must rewrite the `tests/layout.test.ts` case that builds `rect(card)` on `roomDoneCardRect` for n 2..5 (every assertion kept) before removing `card.left`/`card.width`; the `HOUSES` row (phase 4) must not land before phases 1-2.
- Product-owner `[human]` rows (plan Progress): 5.7 card code outside data; 5.8 costs 5 + 7..15 = 71; 5.9 wording (gap 205); 5.10 'room' celebration vs FR-040 'house'; 5.11 real tablet offline.
- `[reviewer]` rows: 2.5, 3.7, 3.8, 5.12. `[visual]` row 5.6. Phase 3 needs local `cwebp`, Pillow 12.1.0, numpy 2.4.3 and `designs/martynka-bathroom-v1`.
- E2E: single specs only per phase; the orchestrator runs the full suite after phase 6 (expected `191 + 2`).
- Follow-ups fired are listed in the previous handoff text and plan (handled in phase 5).

## 6. Autonomous decisions

- Skill's manual confirmation gate, "how to proceed", and commit-message prompts: decided in place, committed the planned set only (`src/core/roomDoneLayout.ts`, `tests/roomDoneLayout.test.ts`) with the proposed message, stopped after phase 1. Would change: none.
- TDD gate: the implementation was absent, so the driver stays `tdd` (no redirect). A stub was added to get an assertion RED rather than a missing-module error, as the step prompt required.
- Break 2 replaced the plan's wording with an equivalent-effect shift because the plan's variant does not change the output for n ≤ 3 and is only observable by n=4/5 (still red there). Would change: none.
