# Visual review — load-and-tab-guard

Run 2026-10-15-fix-s16bcd, visual gate after `MERGE: CLEAR` (impl review, fix `5a11370`). Frames and route: `screenshots/README.md`
(Playwright on the hook build, port 4399, 1440×900 and 1024×768, build `41e7bb7` = code of `5a11370`). Judged against `src/data/pl.ts`
(`loading.title`, `loading.slow`, `settings.saveHeading`, `settings.saveOff.newer`, `savePersist.denied`, `saveTransfer.resetButton`,
`saveTransfer.deviceNewer`), `src/data/layout.ts` `LOADING_LAYOUT`, the existing parent panel (`src/ui/dom/settingsPanel.ts`,
`saveHealthView.ts`) and design-gap rows 112 and 113 (the kit has neither a slow-start line nor a "newer save" line; ours by design).

## Discrepancies and fixes

None needing a code change; no e2e spec touched.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 3.3 | Loading screen, slow line, `?e2eArt=stallall` with money/font/salon routes held | v01 (both widths) | Title "Martynka urządza", bar, then "Jeszcze chwilka, wczytuję obrazki." — strings equal `pl.loading`. The line is one line, centred on the title's axis (x 960), clearly below the bar (no overlap), smaller than the title (bar-text role), inside the bar's width and far inside the canvas at both widths. Title in the fallback font, as expected while the font is held (gap row on the loading screen, S-16c) |
| (task) | "Zapis gry" after a `newer` block | v02, v03 (both widths) | Lines in order: "Zapis jest wyłączony: nowsza wersja gry zapisała już postępy na tym urządzeniu. Uruchom grę ponownie." / "Kod: NewerSave · Wersja 41e7bb7" / "Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię." — equal to `pl.ts`. No "Ostatni zapis" or "Postępy zapisują się…" line beside the off line, so nothing claims saving works. Wraps cleanly at 1024 inside the panel padding |
| (task) | Reset dialog under the block | v04 (both widths) | "Zacząć grę od nowa?" + `deviceNewer` + only "Zamknij" (no "Zastąp mimo to"), consistent with gap 113 and with the off line; initial focus is not on a destructive action (there is none) |

## Hand-checked numbers (mandatory)

- Loading geometry at 1440×900: FIT scale 1440/1920 = 0.75, canvas 810 px tall, letterbox (900 − 810)/2 = 45. Bar top 580 × 0.75 + 45 = 480 px,
  bar bottom (580 + 36) × 0.75 + 45 = 507 px, bar span x 560…1360 → 420…1020 px; slow line top 680 × 0.75 + 45 = 555 px. Frame: bar ≈ 480–507,
  text top ≈ 558, text span ≈ 498…942 (≈ 444 px < 600 px bar width, centre ≈ 720 = 1440/2) ✓. Gap bar→line ≈ 48 px, no overlap ✓.
- At 1024×768: scale 0.5333, canvas 576 tall, letterbox 96. Bar top 580 × 0.5333 + 96 ≈ 405 px; line top 680 × 0.5333 + 96 ≈ 459 px; bar width
  800 × 0.5333 ≈ 427 px; frame: bar ≈ 405–425, text ≈ 462, span ≈ 354…669 (≈ 315 px < 427) ✓.
- Star counter after one first-try right answer: 1 (`balance` 1 star per first-try task; the block does not touch the balance) ✓.
- Store version under the block: hook `store.writtenVersion` = 4 = `SAVE_VERSION` (3) + 1, set by the first (successful) write of the seam ✓.

## Observations (not fixed)

- `savePersist.denied` ("Przeglądarka może usunąć zapis…") still shows under the off line. It is about the browser's storage, not this tab's
  writes, and "Zapisz kopię" stays useful, so it does not contradict. No follow-up.
- Capture flake worth noting: in one desktop run the first write of the session absorbed the answered task (hook: `writes: 0` right after
  `playTaskRight`, then one write and no further change), so no refused write followed and `blockedBy` stayed `null` for 15 s; one more state
  change was needed. `tests/e2e/load-and-tab-guard.spec.ts` (c) has the same order (answer, then poll 5 s) → follow-up with trigger.
- `[human]` 2.5 (Android throttled start) and 7.7 (iPad WebKit) stay manual.

## Gate in this step

No code changed, so the local gate was not re-run (the impl-review step observed it green on `5a11370`: lint, typecheck, `npm test` 2970,
sample E1–E6, build, e2e 104). The throwaway spec captured all frames (its final debug log line failed after the dialog closed the panel; no
assertion on the product failed). Port 4399 not listening afterwards; `tests/e2e/visual.local/` deleted.

VISUAL: PASS — row 3.3 and the `newer` "Zapis gry" state captured at 1440×900 and 1024×768; slow line centred, within the bar width, below the bar without overlap; every string matches pl.ts, geometry hand-checked against LOADING_LAYOUT
