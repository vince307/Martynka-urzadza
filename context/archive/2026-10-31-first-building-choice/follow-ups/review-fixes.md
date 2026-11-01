# Follow-ups — first-building-choice (S-28)

Each entry carries a `Trigger:` line; later slices grep for it.

1. GRD-09 (drawing beside a mistake example) and S13-06 (drawn-grid), from rooms-as-data 8, re-recorded: v6 changed only the version number, so the save still holds nothing for either.
   Trigger: the next change to the save shape (v7).
2. SV2-13 (one bad `variants` field rejects the whole save), from rooms-as-data 9, re-recorded: `MIGRATIONS[5]` does not touch `variants`.
   Trigger: the next change to the save shape (v7).
3. E2E on two real builds (a v5 build writes, a v6 build reads), from rooms-as-data 10, re-recorded: proven by unit tests on the real load path and the in-memory seam `?e2eSave=v5-salon`; the cross-build run waits for a device report.
   Trigger: v7, or a cross-build report from a device.
4. Frozen `copyOfHouseV5` (rooms-as-data 15: "keep it; never point the migration at `copyHouse`"), trigger fired (v6) and the rule held: `src/core/migrations/house.ts` is unchanged and `MIGRATIONS[5]` in `src/core/migrations/building.ts` leaves `house` untouched and calls no live helper (source guard in `tests/saveV6.test.ts`). The rule stays: never point either frozen step at `copyHouse`.
   Trigger: the next change to `src/core/migrations/`.
5. Texture atlas for room art (kitchen-room 5, trigger "a third room": fired by Mostek), re-recorded: Mostek added 21 files (stage + 6 slots x 3 variants); boot still loads only the room in renovation and `tests/bootBudget.test.ts` covers `bridge` and the fresh-install boot (choice cards, no room).
   Trigger: `tests/bootBudget.test.ts` fails or headroom under `balance.loader.totalMs` drops below 2 s.
6. Kitchen-room 6 (service-worker install warning, salon-load-health M-6; trigger "the next change to the precache set", which this slice makes): already closed by house-cross-section (its follow-ups: `src/pwa/registerServiceWorker.ts` warns "ended redundant (the install did not finish)"); research.md lists it as stale. No change here.
   Trigger: none (closed); reopen if a silent install failure is reported.
7. post-run-polish N-2 ("Wróć" leaves no trace of the stage change) closed by phase 7: `TaskScene.backToChoice` logs one `console.info` with the stage and whether the parent placed it (`ageBackOffered`/`ageBack` were renamed to `themeBackOffered`/`themeBack` in the same phase).
   Trigger: none (closed).
8. audit-backdrop-fox F4 (the carried `openParent` guard and suspender-cast items; trigger "the next change to `WelcomeScene.openParent`", fired: the stage panel's `onConfirm` now calls `place(learner, false)`) re-recorded: the guard order (`chosen || closeDialog`, then the suspender and `session.active()`) is unchanged and every callback still runs in `openInputSession`. notebook-polish #16's `WelcomeScene` nit (`backdropState` under the JSDoc of `targets`) was already fixed before this slice (base `fc13e8c`); its other items (`barSpan.keypad.x`, `starBurst`, `Keypad`) are untouched here.
   Trigger: the next change to `WelcomeScene.openParent`.
9. The `bases.base-1.label` text "Baza księżycowa" differs from the card label "Baza kosmiczna".
   Trigger: S-29 (base cross-section).
10. Boot-time `FontFace` limit (salon-load-health) and the per-file loader timeout (guarded only by e2e), art-stand-in-and-load-signal S14-08 (font logged without URL): `BootScene.preload` gained only the `bootGroups` choice-art group, no font or loader-limit change, so none of them fires; re-recorded.
    Trigger: the next change to the font load in `BootScene.preload`.
11. Minigame-daily-puzzle follow-up S13-06 (save-format dependent items from S-13; trigger "the next save-format change or S-17"): v6 is a version bump only, so nothing for S13-06 fits in it; carried with entry 1. (The Hasło words still come from the house in the base: gap 198, separate, for S-29.)
    Trigger: S-17 (balance tuning) or the next save shape change (v7).
12. The scene restart recaptures the salon backdrop once per view change (`captures` in the hook counts it); cheap, kept.
    Trigger: a measured stall on the welcome screen of a low-end tablet.
13. Fresh-install first-session room art is not judged by "Obrazki" until the chosen room has loaded (plan F8, narrowed: `UIScene` judges the room once loaded).
    Trigger: a parent report of a missing-picture line on a fresh install.

## From the implementation review (2026-11-01)

14. `tests/e2e/backdrop-restore.spec.ts` welcome case now asserts `plain` before and after the context loss (a fresh install has no room), so the `RESTORE_WEBGL` redraw of `WelcomeScene` is proven only by the source guard `tests/backdropRestoreWiring.test.ts`. Reach the welcome through `themeBack` after the salon has loaded to prove a real redraw again (impl-review W2).
    Trigger: the next change to `WelcomeScene` backdrop handling or to `SalonBackdrop.render`.
15. `tests/buildingNeutral.test.ts`: the round / warm-up / word-round deep-equal is built from shared constants, so it holds by construction; the real FR-050 guard is `tests/freshRoundWiring.test.ts` (`freshRound` reads no house, rooms or current room). Either drop the tautological part or build the rounds from the two sessions through the scene's inputs (impl-review W4).
    Trigger: the next change to `TaskScene.freshRound` or to `buildWordRound` inputs.
16. `UIScene.create` asks `refreshHealth(chosenRoom)` only when the room record has `total === 0`: choose Dom, let the salon load, "Wróć", choose Baza, and "Obrazki" keeps the salon's record until the next launch (impl-review safety F2).
    Trigger: the next change to `UIScene.create` room-loader wiring or to `REGISTRY_KEYS.roomArtHealth`.
17. `TaskScene.backToChoice` stops UI and Room but not a sleeping `HouseScene`; harmless while `base-1` has no `HOUSE_GEOMETRY` (no "Dom" button in the base). Stop it before a second building gets a cross-section (impl-review safety F6).
    Trigger: S-29 (base cross-section).
18. Small seams: `ChoiceCard` sinks its `ChunkyFace` but has no pressed fill like `AgeButton`; `tests/welcomeChoiceWiring.test.ts` "offers Wróć only on the child age path" matches the condition anywhere in the file, not before `choiceBack.show`; `FIRST_ROOM` fallbacks remain in `SalonBackdrop`, `HouseScene`, `RoomScene`, `TaskScene` (reached only with no `currentRoom`); `fixtureLoadPath.test.ts` re-implements the `main.ts` repair call (the order is guarded by `houseWiring.test.ts`).
    Trigger: the next change to `ChoiceCard`, `WelcomeScene.createChoice`, or a second building without a salon reaching a `FIRST_ROOM` fallback.

## From the visual gate (2026-11-01)

19. The HUD star counter (`StarCounter`, `TASK_LAYOUT.starCounter`, width 196) draws a three-digit balance with the "1" touching the star's tip (frames `*-04-mostek-before-stage`: 100 stars). Mostek's tasks total 100 and the salon's 129, so three digits are now an ordinary balance. Widen the pill or shrink the number above 99, with a layout test for the widest balance.
    Trigger: the next change to `src/ui/widgets/StarCounter.ts` or `TASK_LAYOUT.starCounter`, or a playtest note about the counter.
