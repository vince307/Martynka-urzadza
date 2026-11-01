# Visual review for hangar-module

This is the visual gate of run 2026-10-31-space-base, slice S-30 `hangar-module`, taken in phase 3 (plan row 3.6) on the product code of `de5ab57` (phase 3 touches no file under `src/`). It found no discrepancy; no fix commit.

Capture: Playwright fallback against the hook build (`dist-e2e/`, `E2E_HOOK=1`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 8 shots, 16 game frames, plus 3 pack frames. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 3.6 (items 1-8);
- the pack frames `designs/bystrow-space-base-v2/screenshots/hangar-after-natural.png`, `base-with-two-modules.png` and `previews/hangar-before.png` (copied as `kit-*`), read only;
- the S-29 gate frames `context/archive/2026-11-01-base-cross-section/screenshots/*-05-mostek-room-done-card.png` and `*-02-base-mostek-done.png`;
- the copy source `src/data/pl.ts` (`room.names.hangar`, the Hangar task labels, `room.variants['hangar-*']`, gap 201) and the costs in `src/data/rooms.ts` (`HANGAR.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) Mostek card | `*-01-mostek-room-done-card` | "Pokój gotowy!", two tiles: "Mostek" ticked with its finished miniature, "Hangar" unticked with the before miniature (covered rocket, worn mat); no teaser, no "Baza", "Dalej". The S-29 one-tile card is gone as planned (gap 196 narrowed). |
| (2) Hangar at the start | `*-02-hangar-start` | Matches `kit-hangar-before.png` piece for piece (worn panels, covered rocket, old workbench, crates, rover, standing lamp, worn mat, moon window). Task "Odnów ściany i podłogę ★ 6 / masz 0/6", "Wróć do notesu", "Baza" under the counter. The task pill sits over the front of the worn mat, as in every room; nothing is clipped. |
| (3) Rocket panel | `*-03-hangar-rocket-panel` | After the stage: fresh walls and floor, only the previewed natural rocket placed; three thumbnails (green, yellow, mint rocket) with "Naturalna", "Słoneczna", "Miętowa" (feminine, agreeing with "rakieta"), "Wybieram" and "Zamknij". Counter 94. At 1024 the panel fits inside the frame. |
| (4) Fully furnished, natural | `*-06-hangar-after-dalej` (the room behind the card in `*-05`) | Matches `kit-hangar-after-natural.png`: rocket on its pad, green-leaf mat under it, wooden workbench with the tool tray, open crate stack with bolts, green desk lamp at the window, rover with green fenders, in the same places. The only differences are the game's HUD. |
| (5) Hangar card | `*-05-hangar-room-done-card` | "Pokój gotowy!", two ticked tiles (Mostek, Hangar with its finished miniature), no "Wkrótce" teaser, no "Baza" (hook `houseLabel` null), "Dalej". |
| (6) After "Dalej" | `*-06-hangar-after-dalej` | Still the Hangar (last module), "Zmień wygląd" and "Baza" shown; "Wróć do notesu" left. No overlap with the counter or the gear. |
| (7) Base with two modules | `*-07-base-two-modules` | Same shell and cells as `kit-base-with-two-modules.png`: Mostek finished in ground-left (no frame, `done`), the Hangar in ground-right with the gold cell frame (`current`, gap 199); two airlocks with "Wkrótce" above. The kit shows the Hangar furnished; the game shows the child's live Hangar (before look, nothing bought yet), as S-29 did for Mostek. The dark rocket risk (plan Known risks) does not show: the miniature reads clearly at both widths. |
| (8) Stand-ins | `*-08-hangar-stand-in`, `*-08b-hangar-stand-in-pieces` | With no room pictures the stage is the drawn wall and floor (before colours, then the after colours); bought pieces are turquoise boxes with the Polish caption and variant ("rakieta / Naturalna", "łazik księżycowy / Naturalny"); next task "Postaw stół warsztatowy ★ 14" fits its pill. |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width.

## Hand-checked number: the stars through the Hangar

Costs from `src/data/rooms.ts` `HANGAR.tasks`: 6 + 10 + 13 + 14 + 17 + 19 + 21 = **100**; `BRIDGE.tasks` also sums to 100. Seed `?e2eStars=200`; the first task solved by the retype pays 0, so Mostek takes 200 → **100** at the Hangar start. Then 100 − 6 = **94**, − 10 = **84**, − 13 = **71**, − 14 = **57**, − 17 = **40**, − 19 = **21**, − 21 = **0**. The drawn counter (`counterText`) showed exactly 100, 94, 84, 71, 57, 40, 21, 0 after each Hangar purchase at both widths (94 on frame 03, 0 on frames 05 and 06). Route D: 129 − 100 = **29** at the Hangar start (frame 08), − 6 − 10 − 13 = **0** (frame 08b).

## Not covered

- Real touch on an installed tablet, offline (human row 3.9); the human acceptances 3.7 (costs) and 3.8 (wording, last-module behaviour).
- A finished Mostek saved by the S-29 build and loaded by this build: unit-proven by `tests/fixtureLoadPath.test.ts` (`save-v6-bridge-done.json`), no e2e seam (decision P2), so no frame.
- Canvas renderer: not part of row 3.6 (the room view under Canvas was gated in audit-art-renderer; the Hangar uses the same `RoomView`).

## Decisions

- **Playwright fallback without a Chrome attempt.** The step prompt says Claude in Chrome holds the maintainer's save on localhost:4399 and must not be wiped; the purchase runs (7 and 14 buys per width) are deterministic with the repository's hook helpers. Rejected: wiping site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **Item (4) judged on the frame after "Dalej".** The card appears at the last purchase over the room, so the fully furnished room without a card is the change-mode frame (06); it is the same furniture state. Would change: nothing.
- **A second stand-in frame (08b).** At the start under `?e2eArt=room` there are no pieces yet, so frame 08 shows only the drawn stage; 08b buys three tasks to show the labelled boxes the row names. Would change: nothing.

VISUAL: PASS — all eight row-3.6 items captured at 1440 and 1024 on the hook build: Mostek's card shows Mostek and Hangar, the Hangar starts in the pack's before look, the rocket panel has three thumbnails with feminine captions, the furnished Hangar matches hangar-after-natural, the Hangar card shows two done tiles with no teaser and no "Baza", "Dalej" stays with "Zmień wygląd" and "Baza", the base shows Mostek done and the framed Hangar as in base-with-two-modules, stand-ins carry Polish labels; stars checked 200 → 100 → 94 → 84 → 71 → 57 → 40 → 21 → 0.
