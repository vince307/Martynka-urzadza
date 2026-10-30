# Visual review for rooms-as-data

This is the visual gate of run 2026-10-30-rooms-kitchen, slice F-04 `rooms-as-data`. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `17d3756`.

Capture: Claude in Chrome against the hook dev server on port 4399. The game ran in a same-origin iframe of 1440×900 and 1024×768, on the fresh origin `http://[::1]:4399`. 7 states, 14 frames. The route and every frame are listed in `screenshots/README.md`.

The frames were judged against:
- the `[visual]` row 6.6 of `plan.md` and the step's goal: F-04 must look identical to `main` for a child;
- the salon-style gate frames in `context/archive/2026-10-24-salon-style/screenshots/` as the `main` baseline;
- the copy source `src/data/pl.ts`.

The kit has no room or done-card frame (gaps 31–41).

## States

| Row 6.6 state | Frames | Verdict |
|---|---|---|
| Salon before the stage | `*-01-room-before` | Same as `main`'s `desktop-room-before.jpg`. The worn set (grey-teal sofa, khaki pouf, muted rug and frames) is over `architecture-before`. Every piece is in the same place: sofa x ≈ 640–1240 at 1440 in both. "Odnów ściany i podłogę ★5" and "Wróć do notesu" are in the same spots, and the gear is in its corner. The tablet frame is the same scene letterboxed at 1024. |
| Salon after the stage, some furniture | `*-02-room-after-stage-sofa-rug` | The after architecture is clean, with no worn pieces. The bought sofa and rug are drawn, and the unbought lamp, left plant and pouf show variant 0 as decoration with contact shadows. The cabinet, armchair, table, curtains and shelf are absent until bought. The next task is "Postaw stolik ★10". This matches the S-16d/salon-style behaviour (`shownBeforePurchase`, `contactShadowPieces`). |
| "Pokój gotowy!" card | `*-03-room-done-card` | Layout matches `main`'s `desktop-room-done-card.jpg` exactly: the title, the salon tile with the live miniature, the "Salon" label and the check mark, the dashed "Wkrótce" teaser with no padlock, and "Dalej". The card is now built from the house list (`houseRoomList`), and the result for the child is the same two tiles. Only the chosen looks differ (rug variant 1 here, a different star count). |
| Finished salon, then "Zmień wygląd" mode | `*-04-room-done`, `*-05-change-mode`, `*-06-change-panel-sofa` | "Zmień wygląd" sits right of where the third thumbnail would be and turns into "Gotowe" in change mode. A tap on the sofa opens the change panel with "Morska / Słoneczna / Listkowa", "Wybieram" and "Zamknij". The preview swaps the sofa in place, and "Wybieram" spends nothing. This is the same as S-10. Nothing overlaps at either width. |
| Task backdrop (extra) | `*-07-task-backdrop-finished` | The finished salon is blurred behind the notebook, with the green sofa just chosen. The fox, the HUD and the build id `17d3756` all show. |

## Hand-checked facts

- **Stars, room before.** `?e2eStars=129` plus 1 for the first task right on the first try gives 130. The counter shows 130.
- **Stars, after stage + sofa + rug.** 130 − 5 (stage) − 7 (sofa) − 9 (rug) = **109** (costs from `SALON.tasks` in `src/data/rooms.ts`). The counter shows 109, and the hook says `stars 109`, `tasksDone 3`.
- **Stars, done card.** The 12 costs are 5+7+9+10+12+13+15+8+10+12+13+15 = 129, so 130 − 129 = **1**. The counter shows 1.
- **Free change.** After "Wybieram" in change mode, the stars stay at 1 and `rooms.salon.chosen.sofa` goes 0 → 2.
- **House.** The hook's `house` is `house-1` with salon at floor 0, place 0 and kitchen at floor 0, place 1. The card items are `{room salon, done, unlocked}` and `{teaser}`, so the kitchen cell does not leak into the card as a named room.
- No visible error card, no stand-in box, and no blank layer in any frame.

## Discrepancies fixed

None. No child-visible difference from `main` was found.

## Not covered

- **Welcome backdrop.** Once the run had a learner, this origin no longer showed the welcome screen. The code path is unchanged by F-04 apart from the house lookup, which e2e covers.
- **Settings "Zapis gry" after `?e2eSave=v4-salon`, and the "Salon" capitalisation in the export/import/reset summaries** (parent-only, plan review F3). Both need the 2 s gear hold, which Claude in Chrome cannot drive (profile § 8), and this step was told not to use Playwright. They are covered by the e2e and unit tests of the branch (`tests/e2e/rooms-as-data.spec.ts`, save-summary tests).
- Rows 6.7 and 6.8 [human] and 6.9 (CI at ship) are not part of this gate.

## Decisions

- **The `[::1]` origin as the fresh device.** Rejected: "Zacznij od nowa", because it sits behind the gear long press. Rejected: clearing site data, which would mean writing storage by hand. The `[::1]` origin is a separate origin with empty storage, reached through the product only. Would change: Vite listening on IPv4 only (then `127.0.0.1` would serve the same purpose).
- **One playthrough, with the iframe resized per state, for both widths.** Rejected: two playthroughs, which would need two fresh origins and twice the clicks. Phaser `Scale.FIT` re-lays out on resize, which is what a rotation or window change does on a device. Would change: a layout that depends on the size at scene creation (none in `RoomScene`; each frame was taken after the resize settled).

VISUAL: GAPS — the four required states (salon before the stage, after the stage with sofa and rug, "Pokój gotowy!" with the salon tile and the "Wkrótce" teaser, "Zmień wygląd" mode with the change panel) were captured at 1440 and 1024 and match `main`'s salon-style frames, with star arithmetic checked (130 → 109 → 1, free change). Not captured: the welcome backdrop and settings "Zapis gry"/"Salon" summaries (the gear long press cannot be driven from Claude in Chrome).
