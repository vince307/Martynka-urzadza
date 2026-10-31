# Handoff — `first-building-choice` (slice S-28)

Written by the `/10x-research` step of run 2026-10-31-space-base: `research.md` answers the open questions and the slice is ready for planning. The next agent must not get these wrong. Save v6 is a **version bump only**: `house.id` already names the building and `MIGRATIONS[5]` is a frozen identity step. The bump exists only as the rollback guard. A save with a learner never reaches the choice screen (FR-049). Mostek's prices **cannot fit the 5–15 cap** in `tests/roomsData.test.ts`, so the plan must widen that test.

## 1. State

| | |
|---|---|
| branch | `feat/first-building-choice`, cut from `main` at `fc13e8c` |
| commits | 2: `docs(first-building-choice): change identity (autonomous run)` (4e6b8d9) and this step's `docs(first-building-choice): research` |
| pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/first-building-choice/research.md` | source-backed answers: v6 shape, welcome flow and theme back, base as data, boot, art pipeline, smoke, FR-049/FR-050 proofs, Mostek prices, follow-up verdicts, 6 open questions for the plan |
| `context/changes/first-building-choice/change.md` | frontmatter only: status `new` → `preparing`, `updated` |
| `context/changes/first-building-choice/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/first-building-choice` |
| four read-only research workers (save format, welcome flow, buildings/boot, art/smoke/FR-050) | all completed; decisive anchors re-read locally: `src/main.ts` load path and `freshSession(FIRST_HOUSE)`, `src/core/save.ts` `freshSession`, `UIScene.openReset`, `tests/roomsData.test.ts` cost cap, `src/core/placement.ts` `ageBackOffered`/`firstRoundDone`, `MINIGAME_WORDS` |
| on-disk byte sizes (worker) | task+UI WebP 635 640 B, salon 1 203 384 B, kitchen 797 758 B, font 114 640 B; Mostek 699 124 B and cards 107 074 B inherited from `/10x-new` (scratchpad measurement, unverified here) |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code touched |

## 4. Next command

`/10x-plan first-building-choice`

## 5. Open

- **Save:** v6 bump over the v5 shape: `SaveV6` in `src/core/types.ts`, `SAVE_VERSION`, frozen `MIGRATIONS[5]` with no `copyHouse`. Freeze `tests/fixtures/save-v5-salon.json` **while the code is still v5** (phase-1 pattern from rooms-as-data). Add `save-v6.json`. Move the version pins listed in research §1. Add the 4th rollback note in `deploy/README.md` § 6, with a `[human]` row.
- **Load path:** a `currentRoom` outside the current house's cells is repaired to that house's first cell, not to `FIRST_ROOM` (`repairCurrentRoom` caller in `src/main.ts`).
- **Flow:** the choice is a second view of `WelcomeScene` in front of `start`. The card tap sets `house`/`rooms`/`currentRoom` from `freshSession(<house>, stars)`, then the learner. The task-screen "Wróć" goes back to the choice on both paths while `!firstRoundDone`, through scene data. N-2 fires. Open question: hide that back after a purchase made during the first round.
- **Speaker:** `WelcomeScene` gets its own `SpeakerButton`, using the narrator from `REGISTRY_KEYS.narrator`. `UIScene` does not run there.
- **Boot:** skip the `room` group while `needsPlacement` holds, and load the choice cards from a new table only then. After the tap, `roomArtLoader.ensure`. Keep "Obrazki" honest. Add a fresh-install case to `tests/bootBudget.test.ts`.
- **Data:** add `base-1` to `HOUSES` with no `HOUSE_GEOMETRY`. Hide the `RoomScene` "Dom" button when the building has no geometry. Change the test "placed in the first house" to "exactly one house". Mostek costs: 6/10/13/14/17/19/21 = 100.
- **FR-050:** keep `MINIGAME_WORDS` shared between themes. Add a deepEqual seed test and a `freshRound` wiring guard.
- **Art:** add the `ROOM_PACKS` row `bridge` with `recolourBoard: false`, plus `room-art-bridge.json` and the `tests/roomArt.test.ts` count. Add one `precacheCovers` line for the card table.
- **DESIGN-GAPs expected (rows after 190):**
  - choice-screen layout
  - speaker on the welcome screen
  - Mostek task wording
  - no zoom-out button for the base
  - Mostek celebration with no next module
  - choice-card stand-in
  - plain welcome backdrop on a fresh install
- **Follow-ups:**
  - texture atlas: re-record.
  - SW install warning: already closed, so change.md's take "fires" is stale.
  - rooms-as-data 8, 9, 10: re-record.
  - rooms-as-data 15: applies as a rule.
  - audit-backdrop-fox F4: verify and close.
  - notebook-polish #16: in scope (cheap).
- **Nit for S-29:** `bases.base-1.label` in the pack manifest says "Baza księżycowa"; the game uses the PRD's "Baza kosmiczna".

## 6. Autonomous decisions

- `AskUserQuestion` never called. The skill's clarification points were decided from `change.md` and the step prompt.
- **R1: v6 as a version bump, no `building` field.** Rejected: an explicit field, which would duplicate `house.id`, add a new corrupt code and need a consistency rule. Would change: a building that holds several houses, or a need to store a building before its house.
- **R2: the claim in the previous handoff is partly corrected.** `mergeHouse` is not applied to an unknown house id. The salon takeover comes from `repairCurrentRoom` + `nextRoom`/`houseLayout`. D5 (v6 needed) stands. Would change: nothing.
- **R3: the choice is a view of `WelcomeScene`, written together with the learner (D3 confirmed).** Rejected: a new scene, or a pending flag in the save. Would change: a need to resume on the choice screen after closing the app.
- **R4: one task-screen "Wróć" back to the choice on both paths (D4 refined).** It works through scene data and is runtime only. Rejected: two back buttons. Would change: the visual gate finding the choice view without an age back confusing on the child path.
- **R5: no room art at boot for a fresh install. The cards come from a new table loaded only under `needsPlacement`.** Rejected: putting the cards in `UI_ART` (every boot +106 KB), and booting the salon for fresh installs (against the one-building NFR). Would change: the plan finding that the "Obrazki" health cannot be kept honest cheaply. The fallback then is to boot the salon for fresh installs.
- **R6: Mostek prices 6/10/13/14/17/19/21 = 100, with the test cap widened.** Rejected: 94 within the cap (flat, and the 7th task is not above the salon's). Would change: S-17 tuning, or the maintainer preferring the cap.
- **R7: `MINIGAME_WORDS` stays shared.** Rejected: base words such as PULPIT, which would break FR-050. Would change: an FR-050 rewording that excludes the minigames.
