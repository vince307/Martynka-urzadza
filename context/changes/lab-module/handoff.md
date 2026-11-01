# Handoff — `lab-module` (slice S-33)

Written by the `/10x-new` step of autonomous run `2026-11-01-bathroom-polish-lab`. The change folder exists with its
identity, roadmap re-verification, bound kit views and copy keys, migration verdict and triggered follow-ups. The one thing
the next agent must not get wrong: **no „Wkrótce” teaser returns** — the Hangar card gains a real Laboratorium tile and the
Laboratorium card has three done tiles and no teaser (`houseRoomList` makes a teaser only for an unknown room; D3).

## 1. State

| item | value |
|---|---|
| branch | `feat/lab-module`, cut from `main` at `60472aa` (S-32 merge) |
| commits | 1 on top of `60472aa`: `docs(lab-module): change identity (autonomous run)` |
| pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/lab-module/change.md` | change identity: roadmap claim vs repo table, kit views + copy keys bound, DESIGN-GAPs expected, migration verdict (none, v7 stays, fixture `save-v7-hangar-done.json` to add), triggered follow-ups, decisions D1–D8 |
| `context/changes/lab-module/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/lab-module` (observed) |
| `ls context/changes context/archive \| grep lab-module` | no collision (observed) |
| `python3` read of `designs/bystrow-space-base-v3/{manifest,qa-report}.json` | room `lab`, 6 slots × 3 variants, QA `passed: true`, 21 PNG (observed) |
| `file designs/bystrow-space-base-v5/assets/base/base-1-cell-frame.png`, v5 `qa-report.json` | 640×374 RGBA, QA `passed: true` (observed) |
| `grep SAVE_VERSION src/core/save.ts` | 7 (observed) |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline in the agent contract is inherited, unverified) |

## 4. Next command

`/10x-research lab-module`

## 5. Open

- Research must sweep every pin of „the Hangar is the base's last module” / „base-1 has two rooms”: known ones
  `tests/roomsData.test.ts` (`houseRoomList` of base-1, describe „hangar flow (FR-047)”), `tests/houseCells.test.ts`
  (expects `'house/cell-frame'` for base-1), `tests/e2e/hangar-module.spec.ts` test #16 (no teaser, „Dalej” stays),
  possibly `tests/e2e/base-cross-section.spec.ts`; list each non-data touch with its reason (roadmap Risk).
- Art script: `BASE_FILES` in `scripts/make-task-art.mjs` reads only `SPACE_BASE` (v1); the v5 frame needs a per-row pack;
  `ROOM_PACKS` needs a v3 pack root constant. Firing house-1-polish follow-up 2 (retire recolour) is taken as out of scope.
- Measure the Laboratorium WebP total and boot time after `npm run art` against `tests/bootBudget.test.ts`.
- DESIGN-GAPs to write: new Laboratorium wording row; edit 196; close 199 (gap 200 stays).
- Follow-ups and takes: table „Open follow-ups triggered by this slice” in `change.md` (hangar-module 1 and
  base-cross-section 6 fire and are in scope).
- `[human]` none raised at this step.

## 6. Autonomous decisions

See `change.md` § Autonomous decisions D1–D8 (each with chosen, rejected, why, reversal condition). Summary:
D1 costs 6/10/13/14/17/19/21 = 100 in manifest slot order (reverses on S-17 data or a maintainer price);
D2 cell `upper-left` (reverses on a designer reorder); D3 no teaser, Laboratorium is a next-room tile on the Hangar card
(reverses on S-34 data or a designer last-module answer); D4 base frame as data + art (`HOUSE_ART` row, `cellFrame` key,
per-row pack in `BASE_FILES`) (reverses if `HouseView` turns out to assume the house frame elsewhere); D5 room id `lab`;
D6 no migration, v7 stays, proven by `save-v7-hangar-done.json` (reverses on a per-room saved field v7 lacks);
D7 pack captions with agreed variant names (reverses on the teacher read); D8 next step research (fixed by the run chain).
Also decided here: the `/10x-new` skill's default next step `/10x-plan` is replaced by `/10x-research` per the step prompt.
