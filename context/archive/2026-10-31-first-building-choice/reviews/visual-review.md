# Visual review for first-building-choice

This is the visual gate of run 2026-10-31-space-base, slice S-28 `first-building-choice`. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `e03531b`, and found one real fault, fixed in `1fef8ed`; every frame in `screenshots/` is from `1fef8ed` (build id in the corner of the notebook screens).

Capture: Playwright fallback against the rebuilt hook build (`dist-e2e/`, `E2E_HOOK=1`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 17 shots over the 9 items of plan row 8.6, 34 game frames, plus 5 pack frames. The route, the hook facts and every frame are listed in `screenshots/README.md`.

The frames were judged against:
- plan row 8.6 (items 1-9) and handoff §5 (the choice view after the task screen's "Wróć");
- the pack frames `designs/bystrow-space-base-v1/screenshots/choice-cards.png` and `previews/bridge-{before,after-natural,after-sunny,after-mint}.png` (copied as `kit-*`), read only;
- the copy source `src/data/pl.ts`, and the costs in `src/data/rooms.ts` (`BRIDGE.tasks`).

## Discrepancy found and fixed

**The sunflower stuck out from under the choice cards.** In the first capture (on `e03531b`) the welcome's sunflower (`WELCOME_LAYOUT.flower`, 360-512 × 790-942, the age view's decoration) was drawn on the choice view too, where the "Dom" card (bottom at y 840) and, on the child path, "Wróć" (330-550 × 860-956) lie over it: its petals showed as a fragment between the card and the button. The pack's choice frame has the two cards on a plain page and no decoration; design gap 20 placed the sunflower for the age view only.

Fix `1fef8ed` (`fix(first-building-choice): słonecznik tylko na widoku wieku`): `WelcomeScene.create` draws the flower only when the view is not the choice (`const choice = this.view === 'choice' && this.placed !== undefined;`), the `WELCOME_LAYOUT.flower` comment and gap row 20 say so, and `tests/welcomeChoiceWiring.test.ts` "draws the sunflower on the age view only" pins the guard. Break: removing `!choice &&` turned that test red (1 failed / 7 passed); restored. Meta-check: the test pins the source condition, not pixels; the behaviour is shown by frames 01, 01b, 02 and 03 recaptured on `1fef8ed` (no flower) — the age view is unchanged code. Local gate after the fix: lint OK, typecheck OK, `npm test` 4171 passed (baseline 4092, +79), deploy and ops shell tests OK, `sample` E1-E6 exit 0, `npm run build` "e2e hook: absent".

## States (after the fix)

| Item | Frames | Verdict |
|---|---|---|
| (1) choice, child path | `*-01-choice-child-path`, `*-01b-choice-after-task-wroc` | Two cards with the pack pictures, labels "Dom" / "Baza kosmiczna" in the pack's order and wording, title "Co urządzamy najpierw?", speaker beside the title (the device has a Polish voice), "Wróć" bottom left inside the notebook. The view reached through the task screen's "Wróć" is the same, with its own "Wróć" (review fix F2). The cards sit in the notebook instead of on a bare page (gaps 191, 197, 198). |
| (2) choice, parent path | `*-02-choice-parent-path` | Same view, no "Wróć" (`choiceBack` null), speaker shown. |
| (3) stand-ins | `*-03-choice-stand-ins` | Both pictures are flat pale-leaf boxes; the labels carry the meaning; `artFallbacks.choice 'drawn'`. |
| (4) Mostek before | `*-04-mostek-before-stage` | The pack's before picture (`kit-bridge-before.png`) whole, with telescope, console, chair, shelf, rug, plant pod and boxes; task button "Odnów ściany i podłogę ★ 6", "Wróć do notesu", no "Dom" (base-1 has no cross-section yet). |
| (5) Mostek after the stage | `*-05-mostek-after-stage` | The empty after-room (windows, Earth, wall lights), next task "Postaw pulpit ★ 10". |
| (6) a family | `*-06a/b/c-mostek-panel-*`, `*-06d-mostek-three-families` | The panel's three thumbnails "Naturalny / Słoneczny / Miętowy" with the previewed one framed; console natural, chair sunny, telescope mint are drawn in place and match the pieces of `kit-bridge-after-natural/sunny/mint.png`. |
| (7) room-done card | `*-07a-mostek-room-done-card`, `*-07b-mostek-after-dalej` | "Pokój gotowy!" with one tile "Mostek" (ticked), no "Wkrótce" teaser, "Dalej"; after "Dalej" the child stays in the finished Mostek with "Zmień wygląd"; no "Dom" in either. The HUD speaker hides in the done room (no task text to read, `UIScene` rule). |
| (8) task screen "Wróć" | `*-08a-…-child-wroc`, `*-08b-…-parent-wroc`, `*-08c-task-after-purchase-no-wroc` | "Wróć" bottom left during the first round on both paths; gone after the stage purchase (`themeBack` null). |
| (9) v5 save | `*-09a-v5-save-resumes-task`, `*-09b-v5-save-salon-four-tasks` | Straight to the task screen (no choice, no "Wróć"), salon backdrop, 17 stars from the fixture; the salon with stage, sofa, rug and coffee table bought, next task "Postaw komodę ★ 12", "Dom" shown. |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping at either width.

## Hand-checked number: the star counter through Mostek

Costs from `src/data/rooms.ts` `BRIDGE.tasks`: 6 + 10 + 13 + 14 + 17 + 19 + 21 = **100**. Seed `?e2eStars=100`; the first task solved by the retype pays 0, so **100** (frame 04). Stage 6: 100 − 6 = **94** (05, 08c). Console 10: 94 − 10 = **84** (06b). Chair 13: 84 − 13 = **71** (06c). Telescope 14: 71 − 14 = **57** (06d). Shelf 17, rug 19, plant pod 21: 57 − 57 = **0** (07a, 07b). The counter and the hook agreed at every step. The salon's next task in frame 09b shows cost 12, which is `place-cabinet` in `SALON.tasks`.

## Not fixed (follow-up)

- At 100 stars the "1" touches the tip of the star in the HUD counter (frame 04). The counter is a neighbouring view (`StarCounter`), not part of this slice; Mostek makes a three-digit balance ordinary, so it is follow-up 19 in `follow-ups/review-fixes.md` with a trigger.

## Not covered

- Real touch on a tablet, reduced motion, the narrator's voice itself: human rows 8.7-8.10.
- Claude in Chrome was tried and not used for capture (see Decisions).

## Decisions

- **Playwright fallback after a Chrome attempt.** Claude in Chrome opened its own tab on 4399 and reached the game (the maintainer's Chrome has Polish voices "Zosia" and "Google polski"), but that profile already held a save for this origin (`screen: 'task'`), so a fresh device would have meant clearing site data in the maintainer's browser; item (7) also needs 7 purchases per width, which the repository's hook helpers drive deterministically. The tab was closed. Rejected: wiping the maintainer's site data; Chrome for some frames and Playwright for others. Would change: a defect visible only in the maintainer's Chrome profile. The speaker was proven with `fakePolishVoice`.
- **Item (6) read as "the panel open on each family, then one slot of each family placed".** Three panel frames (one per preview) plus the room with console natural, chair sunny and telescope mint. Would change: the plan author meaning the whole room in one family (the pack's `after-*` frames), which the bought pieces match piece by piece.
- **Fixed instead of a gap.** The sunflower is our own placement (gap 20) and the pack's choice frame has none, so drawing it under the cards was a code fault.
- **Three-digit counter left as a follow-up.** It is a neighbouring view's layout, and the number stays inside the pill.

VISUAL: PASS — after fix `1fef8ed` (the age view's sunflower showed under the choice cards and "Wróć"; now drawn on the age view only), all nine row-8.6 items were captured at 1440 and 1024 and match the pack's choice and Mostek frames: both choice paths with the speaker and the right "Wróć", stand-ins, Mostek before/after the stage, the three families, the one-tile done card staying in Mostek, "Wróć" on the task screen until a purchase, and the v5 salon resume; stars checked 100 → 94 → 84 → 71 → 57 → 0.
