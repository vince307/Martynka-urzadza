# Handoff — `variant-change-room-done` (slice S-10)

Written by the `new` step (`/10x-new variant-change-room-done`): the change identity exists with roadmap corrections, the
design binding, triggered follow-ups and seven autonomous decisions. The next agent must not treat `stepPanel` as reusable
as-is: it only buys the current task (`purchase`), so a variant change needs its own free branch that never touches the
star balance or `tasksDone`.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | 1 on the branch after this step (`docs(variant-change-room-done): change identity (autonomous run)`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no plan.md yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/variant-change-room-done/change.md` | Change identity: roadmap claims vs repo table, design binding (kit views, DESIGN-GAPs from row 37, copy keys), migration (none), triggered follow-ups, autonomous decisions 1–7 |
| `context/changes/variant-change-room-done/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/variant-change-room-done` |
| Gate suites | not run: docs-only step, no code changed (baseline on main at 36ead3c per contract: unit 1035 passed, e2e 24 passed, inherited, unverified) |

## 4. Next command

`/10x-research variant-change-room-done`

## 5. Open

- Unknowns for research (change.md "Roadmap claims vs repo now", last rows): child hold threshold (new `balance` entry, not `balance.parentSettings`), slot hit-testing with the floor/walls under furniture (`RoomView.render`, `SALON_PLACEHOLDERS`), where the "poprawki"/change-mode button sits (`ROOM_LAYOUT.taskButton` place, `tests/layout.test.ts` overlap case), the "Pokój gotowy!" card (`UnlockCard` pattern) and rooms list, the data shape of room unlocking (`RoomDef` in `src/core/types.ts` has no unlock field), narration of the card (`REGISTRY_KEYS.narration`), e2e hook read-only fields for change mode and the card (`src/testing/e2eHook.ts` `installE2EHook`, `RoomScene.snapshot`).
- Follow-ups in scope (from `context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md`): hold + "Pokój gotowy!", F4 `pl.room.name`, F5 typed label helper / `RoomScene.snapshot` using `this.room()`, V1 caption anchors, V2 rug pop at the S-10 visual gate.
- Test-plan risk #16 should cover "a variant change never changes the balance" (a test-plan refresh may add a room-done risk).
- DESIGN-GAPs to add (rows 37+ in `docs/design-gaps.md`): hold feedback, change-mode button, "Pokój gotowy!" card, rooms list and teaser, card narration.

## 6. Autonomous decisions

See `change.md` `## Autonomous decisions` (1–7: change mode inside the panel reducer; child hold threshold in `balance.ts`; change-mode button only after the room is done, hold always; room unlocking as an ordered data list with a nameless teaser; "Pokój gotowy!" as a canvas card in `RoomScene` with the rooms list; no new save state; next step research instead of plan). Each records the rejected option, why, and what would change the answer. Additionally: `/10x-new` chose `/10x-research` over its default `/10x-plan` because the run's step prompt fixes it; the clipboard copy was skipped (unattended run).
