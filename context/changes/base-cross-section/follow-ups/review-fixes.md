# Follow-ups — base-cross-section (S-29)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names, closed with evidence, or re-recorded with the trigger kept.

## Closed by this change

1. First-building-choice 9 (`bases.base-1.label` "Baza księżycowa" vs the card "Baza kosmiczna"): closed by decision D5; the game never reads the manifest label, the copy is `pl.ts` only ("Baza kosmiczna" on the card, "Baza" on the zoom-out button).
   Trigger: none (closed).
2. First-building-choice 17 (`TaskScene.backToChoice` did not stop a sleeping `HouseScene`): closed by phase 3 (`backToChoice` stops `SCENE_KEYS.house`, `HouseScene.create` resets its art flags; guards in `tests/themeBackWiring.test.ts`, `tests/houseSceneWiring.test.ts`).
   Trigger: none (closed).
3. House-cross-section 20 (stand-in shell numbers inline in `HouseView.standInShell`): closed by phase 1 (numbers in `HOUSE_LAYOUT`).
   Trigger: none (closed).
4. House-cross-section 21 (a browser test that the "Dom" button is hidden while the room-done card is up): closed by phase 5 (`tests/e2e/base-cross-section.spec.ts`, test 2).
   Trigger: none (closed once phase 5 is green).
5. Design gap 195 (no base zoom-out) closed, gap 196 narrowed to "no teaser tile while no next module exists" (D4).
   Trigger: a second module of the base (S-30 hangar-module) or a designer answer for the last-module celebration.

## New in this change

6. The base reuses the house `cell-frame` around the module in renovation (gap 199) and has a stand-in outline without a roof (gap 200); the base pack has neither.
   Trigger: a designer answer (a base frame or a base stand-in), or a playtest note.
7. The base back label is "Wróć do pokoju" (same as the house, D8); the base and house share `pl.house.back`.
   Trigger: a playtest note or a designer answer for a base-specific label.

## Carried unchanged (re-recorded)

8. First-building-choice 18 (small seams: `ChoiceCard` pressed fill, a guard matching a condition anywhere in the file).
   Trigger: the next change to `ChoiceCard` or `WelcomeScene.createChoice`.
9. First-building-choice 11 (v6 is a version bump; save-format dependent items from S-13 wait).
   Trigger: v7, or the next change to `src/core/migrations/`.
10. First-building-choice 16 (`UIScene.create` asks `refreshHealth(chosenRoom)` only when the room record has `total === 0`; "Obrazki" can keep the other building's record until the next launch).
    Trigger: the next change to `UIScene.create` room-loader wiring or to `REGISTRY_KEYS.roomArtHealth`.
11. First-building-choice 19 (the HUD star counter with a three-digit balance) and gap 198 (nothing behind the notebook of a fresh install).
    Trigger: the next change to `src/ui/widgets/StarCounter.ts` or `TASK_LAYOUT.starCounter`, or a playtest note; for 198 the next change to `WelcomeScene` backdrop handling.
12. House-cross-section 19 (a house or base picture that downloads but does not decode leaves no console line: Phaser 4.2.1 emits `loaderror` only for a failed request; the stand-in shell and `artFallbacks.house = 'drawn'` still follow), re-recorded (P5).
    Trigger: a Phaser upgrade that emits an error for `onProcessError`, or a device report of a drawn shell.
13. House-cross-section 2 (no way back to the previous room from the house), 4 (a known room not reached is shown closed), 5 (no "Obrazki" line for house or base pictures; `artFallbacks.house` and a warning only), 9 (`drawRoomMiniature` follow-ups), 11 (the "Dom" button hidden while a card is up; source guard plus phase 5), carried unchanged.
    Trigger: the next change to `HouseScene`, `HouseView` or `RoomScene.redraw`; item 5 also the next change to `src/core/artHealth.ts`.
