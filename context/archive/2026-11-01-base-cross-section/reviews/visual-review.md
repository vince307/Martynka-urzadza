# Visual review for base-cross-section

This is the visual gate of run 2026-10-31-space-base, slice S-29 `base-cross-section`. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `1e0fcc3` (product code as of the review fix `c52c53c`). It found no discrepancy; no fix commit.

Capture: Playwright fallback against the rebuilt hook build (`dist-e2e/`, `E2E_HOOK=1`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 9 shots (the 8 items of plan row 4.6 plus the salon with "Dom"), 18 game frames, plus the pack frame. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 4.6 (items 1-8) and handoff §5;
- the pack frame `designs/bystrow-space-base-v1/screenshots/base-with-bridge.png` (copied as `kit-base-with-bridge.png`) and the pack README (`base-1-shell` with opaque cream cells, `cell-closed` airlock without text), read only;
- the S-23 frames `context/archive/2026-10-31-house-cross-section/screenshots/*-02-house-start.png` and `*-06-house-stand-in-shell.png`;
- the copy source `src/data/pl.ts` ("Baza", "Dom", "Wróć do pokoju", "Wkrótce", "Pokój gotowy!", "Dalej", "Zmień wygląd") and the costs in `src/data/rooms.ts` (`BRIDGE.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) base at the start | `*-01-base-start` | Matches `kit-base-with-bridge.png`: the same shell (dish and mast on the roof, central dome, lift shaft with ladder and cabin, lit portholes), the same cell places, three airlocks with a dark "Wkrótce" in their round window, Mostek ground-left. Differences from the kit are the game's own: the Mostek miniature is the live before-state (the child has bought nothing) instead of the kit's furnished room, it carries the reused house `cell-frame` (gap 199, human row 4.8), "Wróć do pokoju" top left and the counter top right above the roof, the gear bottom right (it covers the far tail of the moon-ground shadow, nothing of the shell). Stage pixel `#e8efeb`, the base's sky, not the house's `#e7f4f4`. |
| (2) base with Mostek done | `*-02-base-mostek-done` | The miniature is the finished Mostek (Earth window, natural console, chair, telescope, shelf, orbit rug, plant pod), still framed: the cell stays `current` because the base has no next module (decision D4, human row 4.7). Counter 0. |
| (3) base stand-in | `*-03-base-stand-in` | Outline and lift shaft drawn in code, three turquoise stand-in cells with "Wkrótce", Mostek miniature with the frame, no roof (gap 200). |
| (4) Mostek with "Baza" | `*-04-mostek-baza-button` | The worn Mostek before the stage, "Baza" pill under the counter (same place as "Dom", gap 183), "Wróć do notesu", task "Odnów ściany i podłogę ★ 6". No overlap with the counter or the gear. |
| (5) room-done card | `*-05-mostek-room-done-card` | "Pokój gotowy!", one ticked "Mostek" tile, no "Wkrótce" teaser, "Dalej"; no "Baza" button (hook `houseButton` null). |
| (6) after "Dalej" | `*-06-mostek-after-dalej` | Still the finished Mostek, "Zmień wygląd" and "Baza" shown. |
| (7) house unchanged with "Dom" | `*-07a-salon-dom-button`, `*-07-house-start` | The salon shows "Dom"; the house cross-section is pixel-identical to the S-23 gate frame `*-02-house-start.png` at both widths (PIL difference: empty bounding box). |
| (8) house stand-in | `*-08-house-stand-in` | Outline, stairwell, turquoise cells with white "Wkrótce", salon miniature with the frame, and now a visible gable roof (taller than the sliver of S-23 frame 06, as `standInRoof` sets for the house). |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width.

## Hand-checked number: the star counter through Mostek

Costs from `src/data/rooms.ts` `BRIDGE.tasks`: 6 + 10 + 13 + 14 + 17 + 19 + 21 = **100**. Seed `?e2eStars=100`; the first task solved by the retype pays 0, so **100**. Then 100 − 6 = **94**, − 10 = **84**, − 13 = **71**, − 14 = **57**, − 17 = **40**, − 19 = **21**, − 21 = **0**. The drawn counter (`counterText`) showed exactly these values after each purchase at both widths, and 0 on frames 05, 06 and 02. Route A: seed 40, retype 0 → **40** on frames 04, 01 and 03.

## Not covered

- Real touch on an installed tablet, offline (human row 4.9); the human acceptances 4.7 (celebration with no next module) and 4.8 (shared frame, "Wróć do pokoju").
- Canvas renderer: not part of row 4.6 (the house under Canvas was gated in S-23; the base reuses the same `HouseView`).

## Decisions

- **Playwright fallback after a Chrome attempt.** Claude in Chrome (the browser selected at preflight) opened its own tab on 4399; the hook reported `screen: 'task'`, so that profile already holds a save for this origin, and a fresh device would have meant clearing the maintainer's site data. Item (2) also needs 7 purchases per width, which the repository's hook helpers drive deterministically. The tab was closed. Rejected: wiping site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **Item (2) "still framed" read as the hook's `current` state.** With no next module in the base, Mostek remains the module in renovation, so the frame stays; the spec's test 2 pins the same. Would change: a later module (S-30 hangar) after which Mostek becomes `done`.
- **Item (7) judged by pixel diff, not by eye.** The house frame is byte-for-byte the S-23 gate frame in rendered pixels, which proves no regression of the house view. Would change: a deliberate house change in a later slice.
- **The gear over the moon-ground shadow left as is.** It is the HUD's fixed place on every screen and covers only the shadow's tail beyond the shell; not a defect of this slice.

VISUAL: PASS — all eight row-4.6 items captured at 1440 and 1024 on the hook build: the base matches the pack's base-with-bridge frame (shell, airlocks with "Wkrótce", Mostek framed ground-left, `#e8efeb` stage), Mostek done stays framed, the base stand-in has no roof, "Baza" shows in Mostek and after "Dalej" and hides under the one-tile card, the house view is pixel-identical to S-23 with "Dom" and its stand-in has the gable roof; stars checked 100 → 94 → 84 → 71 → 57 → 40 → 21 → 0.
