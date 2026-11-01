# Handoff — `bathroom-room` (slice S-31)

Phase 2 (`impl`) is done and committed as `32c2a5b`: `RoomDoneCard.show` and `ROOM_DONE_LAYOUT.card` read the phase-1 rule `roomDoneCardRect`; two- and three-tile cards draw as before (388/1144). Phase 3 adds the bathroom as data, copy and art (still unreachable).

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, `7c742b8` phase 1, handoff, `32c2a5b` phase 2, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` is not set by this step; unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 29 (rows 1.1-1.4 and 2.1-2.4 ticked; 2.5 is `[reviewer]`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/layout.ts` | `ROOM_DONE_LAYOUT.card` = `{ centerX, minWidth, padding, top, height, border, radius }`; `tiles.left` removed; gap 204 comment rewritten |
| `src/ui/widgets/RoomDoneCard.ts` | `show` computes `rect = roomDoneCardRect(items.length, …)`; card, tile lefts and burst centre come from it |
| `tests/layout.test.ts` | touch-target test and tile test rewritten on `roomDoneCardRect` for n 2..5 (and the data's max); n ≤ 3 pinned to 388/1144 |
| `tests/roomDoneCardWiring.test.ts` | new case: source calls `roomDoneCardRect(`, no `card.left`/`card.width`, burst and tile lefts read the rect |
| `context/changes/bathroom-room/plan.md` | rows 2.1-2.4 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| `npx vitest run tests/layout.test.ts tests/roomDoneCardWiring.test.ts tests/roomDoneLayout.test.ts` | 47 passed (then 48 with the extra wiring assertions) |
| Break `minWidth` 1144 → 1100 | red (tile case, accepted-look 388/1144); restored |
| Break `padding` 30 → 60 | red (n=5 inside-screen case and touch-target case); restored |
| Break burst centre → `card.minWidth / 2` | first stayed GREEN (meta-check: burst centre was unguarded); wiring test strengthened with `starBurst(this.scene, rect.left + rect.width / 2` and `rect.tileLefts[index]`; same break then red; restored |
| Break `roomDoneCardRect(` call replaced | wiring case red; restored |
| lint / typecheck | OK |
| unit incl. deploy and ops tests, `sample` E1-E6 | `Tests 4223 passed (4223)` = phase-1 4222 + 1 new; samples no violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `git diff --stat 7c742b8 -- src/data/rooms.ts … src/scenes src/core public tests/fixtures tests/e2e` | empty |
| e2e | not run (no spec touched) |

## 4. Next command

`/10x-implement bathroom-room phase 3`

## 5. Open

- Phase 3 needs local `cwebp`, Pillow 12.1.0, numpy 2.4.3 and `designs/martynka-bathroom-v1`.
- `[reviewer]` rows: 2.5, 3.7, 3.8, 5.12. `[visual]` row 5.6. `[human]` rows 5.7-5.11 (see plan Progress).
- The `HOUSES` row (phase 4) must land after phases 1-2 (done).
- E2E: single specs only per phase; the orchestrator runs the full suite after phase 6.

## 6. Autonomous decisions

- Manual gate, "how to proceed", execution mode (in context) and commit-message prompts: decided in place, proposed message used, stopped after phase 2. Would change: none.
- The plan's third break ("put `card.left + card.width / 2` back") cannot compile once those fields are gone; replaced by breaking the burst centre and the call site. The burst-centre break first stayed green, so the wiring test was strengthened (see §3). Would change: none.
