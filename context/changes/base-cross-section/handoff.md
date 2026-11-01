# Handoff — `base-cross-section` (slice S-29)

Written by the `/10x-new` step of run `2026-10-31-space-base`. The change folder and `change.md` exist (status `new`); no
code was touched. The next agent must not get this wrong: the base cross-section is DATA on the existing `HouseScene` /
`HouseView` / `houseCells` (no `if base` branch, no new scene), and the base pack has no cell frame (DESIGN-GAP, not invented).

## 1. State

| item | value |
|---|---|
| branch | `feat/base-cross-section`, cut from `main` at `9a44799` |
| commits | 2 on top of `9a44799`: `25761bd` docs(base-cross-section): change identity, plus this handoff commit |
| pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/base-cross-section/change.md` | change identity: roadmap-claim table re-verified at `9a44799`, design-kit bindings (base pack `bases.base-1`, preview `view=base`, screenshot `base-with-bridge.png`), expected DESIGN-GAPs, migration verdict (none, v6 stays), triggered follow-ups with scope take, autonomous decisions D1-D8 |
| `context/changes/base-cross-section/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/base-cross-section` (observed) |
| uniqueness of `base-cross-section` in `context/changes/` and `context/archive/` | no collision (observed) |
| `grep` of `context/archive/*/follow-ups/review-fixes.md` for `S-29` / base | first-building-choice 9 and 17 name S-29; 18 (second building, `FIRST_ROOM` fallback) and house-cross-section 19/20/21 fire on files this slice will change |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed |

## 4. Next command

`/10x-research base-cross-section`

## 5. Open

- Research questions for `/10x-research` (all in `change.md`):
  - Where per-building cross-section style lives (closed-cell text colour `#245c59` without shadow and stage background `#e8efeb` in the base vs the house's `#FFF5DF` + shadow): extend `HouseGeometry` (`src/core/types.ts`) or a sibling record in `src/data/houses.ts`.
  - How `HOUSE_ART` (`src/data/houseArt.ts`) becomes per building so `HouseScene.loadArt` / `HouseScene.shellReady` load only the chosen building's pictures, keeping `scripts/check-deploy.ts` precache coverage and `tests/houseArt.test.ts`.
  - Whether the house `cell-frame` picture reads on the base shell (DESIGN-GAP: the base pack has no frame).
  - Per-building zoom-out label: `pl.house.open` is a constant used in `RoomScene.redraw`; FR-048 wants „Dom” / „Baza”.
  - `TaskScene.backToChoice` + sleeping `HouseScene` (follow-up 17) and the `FIRST_ROOM` / `house-1` fallbacks in `HouseScene.render`, `HouseScene.geometry`, `RoomScene.currentRoomId` (follow-up 18): can the base reach them?
  - WebP sizes of `base-1-shell` and `cell-closed` with the art script's settings (runtime load, not boot; record anyway).
  - An e2e path to a base child (choose „Baza kosmiczna” on a fresh context, or a seam) for the cross-section spec.
- Roadmap unknown (FR-046 celebration while no next module): default D4, final call in `/10x-plan`.
- DESIGN-GAPs expected (rows after 198 in `docs/design-gaps.md`, none written yet): base cell frame; base zoom-out button (closes gap 195); last-available-module celebration (narrows gap 196); base stand-in shell.
- Follow-ups carried (not in scope): first-building-choice 11/16/19, gap 198 (D7); house-cross-section 2, 4, 5, 9, 11.

## 6. Autonomous decisions

Recorded in full in `context/changes/base-cross-section/change.md` `## Autonomous decisions`:

- D1: cross-section of the base is data on the existing house scene (rejected a separate `BaseScene`); would change if `HouseView` drawing differs beyond data.
- D2: base shell and airlock converted through `npm run art`, loaded on first open, precached (rejected code-drawn shell); would change if the visual gate fails the pack.
- D3: follow-up 17 in scope (stop `SCENE_KEYS.house` in `TaskScene.backToChoice`); would change if research proves a stale sleeper harmless.
- D4: Mostek celebration reuses the room card, „Dalej” keeps the child in Mostek, closed cells carry „Wkrótce” (rejected a new card or a fake Hangar entry); would change on the author's answer to the roadmap unknown.
- D5: follow-up 9 closed by decision: the manifest's „Baza księżycowa” is not game copy; would change if the maintainer chooses the moon name.
- D6: no migration, save stays v6; would change if research finds a saved per-building field.
- D7: Hasło base words (gap 198) out of scope; would change on a maintainer request or S-30 touching minigame inputs.
- D8: back button in the base stays „Wróć do pokoju”; would change on a playtest note.
- The `/10x-new` skill's next-step suggestion (`/10x-plan`) was replaced by `/10x-research`, as the step prompt fixes.
