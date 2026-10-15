# Handoff — `final-art-salon` (slice S-16a)

Written by the `/10x-tdd` phase 1 step: the room task is now a `stage | slot` union and a stage is bought by one `open`
(commit d5d6993). Nothing else is implemented. The next agent must not get wrong: the remap (rule B, phase 2) must give
**every** furniture task in the new prefix a `chosen` entry (carried variant or 0), otherwise gifted furniture is
invisible (`chosen[slot.id] === undefined` = empty in `src/core/roomHit.ts`); room layers use depth `z` (0-99) with
controls above from `ROOM_LAYOUT.depth`.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phase 1 `d5d6993` on top of the plan-review commit, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (flips to `implemented` at the last phase) |
| `## Progress` | phase 1: 1.1 and 1.3 ticked; 1.2 left open (e2e part is the orchestrator's) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `RoomTaskDef = {kind:'stage'} | {kind:'slot'}` |
| `src/core/rooms.ts` | `purchase(..., variant: number | null)`, `bought` carries `kind`, new `stagesDone` |
| `src/core/variantPanel.ts` | closed + `open` on an affordable stage buys at once (panel stays closed); stale-panel guard needs a `slot` task |
| `src/data/rooms.ts`, `src/scenes/RoomScene.ts`, `tests/e2e/support/hook.ts` | old tasks `kind:'slot'`; scene narrows the type, no pop for a stage; snapshot `taskKind` |
| `tests/rooms.test.ts`, `tests/variantPanel.test.ts` | 7 new stage tests; `tests/roomsData.test.ts`, `save.test.ts`, `saveFile.test.ts` only typed for the union |

## 3. Verification

| Command | Result |
|---|---|
| RED (observed) | `AssertionError: expected { ok: false, reason: 'bad-variant' } to match object { ok, stars, bought: { kind: 'stage' ... } }` (rooms); `expected { kind: 'open', mode: 'buy', ... } to deeply equal { kind: 'closed' }` (variantPanel); 7 failing of 70 |
| lint / typecheck | pass / pass |
| unit incl. deploy tests, sample E1-E6 | Tests 2847 passed (baseline 2839, +8: 7 new + 1 split by the stage counting) |
| build | pass, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied; no spec changed, only `taskKind` added to a hook type) |
| Deliberate break | removing the `stars >= cost` guard in BOTH `stepPanel` (stage) and `purchase` (stage) turned `a short balance refuses the stage` (rooms) and `too few stars: open does nothing` (variantPanel) red; restored |

## 4. Next command

`/10x-tdd final-art-salon phase 2`

## 5. Open

- Orchestrator: run e2e (`--workers=4`, expect 93 passed) and tick 1.2.
- Human checklist: `[human]` 2.5 remap rule B vs rule A; `[human]` 10.4 iPad playthrough.
- Visual rows: 4.7, 5.3, 5.4, 6.4, 7.4, 8.3. Phase 3 stays one phase; on context pressure return `NEEDS_CONTINUATION`.
- RoomScene does nothing visible on a stage purchase yet (background cross-fade is phase 7); the old data has no stage task so nothing changes for the child.

## 6. Autonomous decisions

1. A reducer-only break (guard removed in `stepPanel` alone) stays green because `purchase` re-checks the balance;
   defence in depth is kept, so the break removes both guards. Would change: dropping the duplicate guard.
2. The stage branch returns the same `closed` panel and `bought.kind = 'stage'`; scene skips the pop/celebration for it.
3. Phase kept `Driver: tdd` (pure logic); scene/type narrowing was inline scaffolding.
