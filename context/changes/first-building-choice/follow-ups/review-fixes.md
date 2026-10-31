# Follow-ups — first-building-choice (S-28)

Each entry carries a `Trigger:` line; later slices grep for it.

1. GRD-09 (drawing beside a mistake example) and S13-06 (drawn-grid), from rooms-as-data 8, re-recorded: v6 changed only the version number, so the save still holds nothing for either.
   Trigger: the next change to the save shape (v7).
2. SV2-13 (one bad `variants` field rejects the whole save), from rooms-as-data 9, re-recorded: `MIGRATIONS[5]` does not touch `variants`.
   Trigger: the next change to the save shape (v7).
3. E2E on two real builds (a v5 build writes, a v6 build reads), from rooms-as-data 10, re-recorded: proven by unit tests on the real load path and the in-memory seam `?e2eSave=v5-salon`; the cross-build run waits for a device report.
   Trigger: v7, or a cross-build report from a device.
4. Frozen `copyOfHouseV5` (rooms-as-data 15), applied and closed: `MIGRATIONS[5]` in `src/core/migrations/building.ts` leaves `house` untouched and calls no live helper.
   Trigger: none (closed); reopen on the next change to `src/core/migrations/`.
5. Texture atlas for room art, re-recorded: Mostek added 6 slots x 3 variants to the files; headroom is checked by `tests/bootBudget.test.ts` (choice cards load only on a fresh install).
   Trigger: `tests/bootBudget.test.ts` fails or headroom under `balance.loader.totalMs` drops below 2 s.
6. Kitchen follow-up 6, closed as stale: the evidence is in research.md (the kitchen's data no longer depends on the point it named).
   Trigger: none (closed).
7. post-run-polish N-2 (age back button naming) closed by phase 7: `ageBackOffered` became `themeBackOffered`, `ageBack` became `themeBack`.
   Trigger: none (closed).
8. audit-backdrop-fox F4 (`openParent` suspender guard) and notebook-polish #16 (JSDoc nit) were re-checked in phases 6 and 8: no change needed in `WelcomeScene`; left as they are.
   Trigger: the next change to `WelcomeScene.openParent`.
9. The `bases.base-1.label` text "Baza księżycowa" differs from the card label "Baza kosmiczna".
   Trigger: S-29 (base cross-section).
10. Boot-time `FontFace` limit (salon-load-health) and the per-file loader timeout (guarded only by e2e), art-stand-in-and-load-signal S14-08 (font logged without URL): `BootScene.preload` gained only the `bootGroups` choice-art group, no font or loader-limit change, so none of them fires; re-recorded.
    Trigger: the next change to the font load in `BootScene.preload`.
11. Minigame-daily-puzzle follow-up "the next save-format change or S-17": v6 changed no `variants` field; the Hasło words come from the house (gap 198) and are re-recorded for S-29.
    Trigger: S-17 (balance tuning) or the next save shape change.
12. The scene restart recaptures the salon backdrop once per view change (`captures` in the hook counts it); cheap, kept.
    Trigger: a measured stall on the welcome screen of a low-end tablet.
13. Fresh-install first-session room art is not judged by "Obrazki" until the chosen room has loaded (plan F8, narrowed: `UIScene` judges the room once loaded).
    Trigger: a parent report of a missing-picture line on a fresh install.
