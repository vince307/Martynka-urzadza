# Handoff — `hangar-module` (slice S-30)

Written by the `/10x-new hangar-module` step of run 2026-10-31-space-base. The change folder exists with `change.md`
(roadmap claims re-verified, kit bindings, follow-ups, decisions D1–D6); nothing else is written yet. The next agent must
not treat the slice as „pure data” on faith: research must sweep for tests and code that pin `base-1` as a one-room
building and measure the Hangar art against the boot budget.

## 1. State

| | |
|---|---|
| Branch | `feat/hangar-module`, cut from `main` at `a4a0aee` (S-29 merge) |
| Commits | 1 on top of `a4a0aee`: `docs(hangar-module): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/hangar-module/change.md` | change identity: roadmap claim table (claim, repo now, correction), kit views and copy keys bound, expected DESIGN-GAPs, migration statement (none, v6 stays), triggered follow-ups, autonomous decisions D1–D6 |
| `context/changes/hangar-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/hangar-module` |
| `git merge-base HEAD main` | `a4a0aee` (0 commits ahead before this step) |
| `grep -n "Trigger:" context/archive/*/follow-ups/review-fixes.md` (S-30, hangar, second module, gap 196, third room, atlas) | one direct hit (base-cross-section 5); atlas, `FIRST_ROOM`, thumbnail and closed-cell items checked and classified in `change.md` |
| manifest read (`designs/bystrow-space-base-v2/manifest.json`, python) | `rooms.hangar`: 3 scene files, 6 slots × 3 variants, `shadowEllipses: []`; `bases.base-1.cells` identical to `HOUSE_GEOMETRY['base-1']` |
| background corner pixels (Pillow) | `hangar-before/after` corners `#FFF5DF` like `bridge-after` → no board recolour |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline in the agent contract: unit 4185, e2e 187, inherited, unverified) |

## 4. Next command

`/10x-research hangar-module`

## 5. Open

- Research questions (from `change.md`):
  - Which tests or code pin `HOUSES['base-1']` as one room or rely on Mostek being the base's last module (gap 196 tests on the room-done card, `houseCells`, base e2e `tests/e2e/base-cross-section.spec.ts`, `tests/bootBudget.test.ts`, `tests/roomArt.test.ts`)? List each non-data file the plan must touch and why (roadmap Risk).
  - `scripts/make-task-art.mjs`: a new pack root for `designs/bystrow-space-base-v2` and a `ROOM_PACKS` row `hangar` (`recolourBoard: false`); WebP size of the Hangar vs `tests/bootBudget.test.ts` headroom (atlas follow-up conditional).
  - A v6 base save with Mostek done (frozen fixture) opens in the Hangar after load (`nextRoom` in `src/main.ts` load path); the rollback path (`repairCurrentRoom` with `savedLayout.rooms[0].room`) lands on Mostek.
  - Teacher read of the six task labels, captions and agreed variant names (`pl.room.tasks`, `pl.room.slots`, `pl.room.variants`).
- DESIGN-GAPs to add in the plan: Hangar wording (new row after 200); gap 196 row edited (last module is now the Hangar).
- Follow-up base-cross-section 5 (gap 196) fires; re-record narrowed in this change's `follow-ups/review-fixes.md` at archive.

## 6. Autonomous decisions

- D1 Hangar costs 6/10/13/14/17/19/21 = 100 in manifest order (rocket first). Rejected 120 (no balance change allowed without S-17), 71 (base priced above the house by FR-044). Changes if S-17 measures or the maintainer names a price.
- D2 Hangar in `ground-right` (floor 0, place 1). Evidence: v2 README (1060,636), manifest cells, `base-with-two-modules.png`. Changes if the designer reorders cells.
- D3 Last-module behaviour of S-29 D4 kept, now for the Hangar (no teaser, „Dalej” stays in change mode). Rejected an invented third-module teaser. Changes with a third module or a designer answer.
- D4 No save-format change (v6). Precedent S-22. Changes if research finds a needed saved field.
- D5 Captions from the pack labels, variants agreed by gender/number. Changes after a teacher read finding a caption unclear.
- D6 Next step research rather than plan (hidden non-data dependencies are the slice's risk). Fixed by the run's chain.
- Skill checkpoints: `/10x-new` would suggest `/10x-plan` and copy to clipboard; overridden by the step prompt (§4 = `/10x-research`), clipboard skipped (unattended).
