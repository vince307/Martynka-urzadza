# Visual review — final-sound

Run 2026-10-15-fix-s16bcd, visual gate after `MERGE: CLEAR` (impl review, last code fix `82860d2`). Frames and route: `screenshots/README.md`
(Playwright on the hook build, port 4399, 1440×900 and 1024×768, build `ceff218`). Judged against `src/data/pl.ts` (`settings.soundHeading`,
`effectsHeading`, `musicHeading`, `autoReadOn`, `autoReadOff`, `soundMissing`), the existing parent panel (`src/ui/dom/settingsPanel.ts`, the reading
group's pattern) and design-gap row 114 (the kit has no sound settings; the section is ours by design).

## Discrepancies and fixes

None needing a code change; no e2e spec touched.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 7.4 | Panel as a whole (healthy) | v00, v01 (both widths) | Section order as built and as gap 114 describes: "Etap nauki" → "Czytanie poleceń na głos" (+ the "no Polish voice" line, speech stub) → **"Dźwięki"** (h2) → "Efekty dźwiękowe" → "Muzyka" → "Zapis gry" → "Obrazki" → save buttons → "Postępy", with "Zatwierdź"/"Anuluj" sticky at the bottom. No horizontal overflow: card `scrollWidth` = `clientWidth` = 712 px and document width = viewport (1440 / 1024) at both widths; the card scrolls vertically under the sticky actions as before |
| 7.4 | Sound groups follow the reading pattern | v01, v05 | Same 64 px pill buttons, same "Włączone"/"Wyłączone" labels, same filled-teal pressed state. Defaults read right: effects "Włączone", music "Wyłączone". After two taps (v05) the pressed state moves only inside its own group. The three identical label pairs are told apart by their visible captions and, for assistive tech, by `aria-labelledby`: the hook dump shows `settings-panel-reading → Czytanie poleceń na głos`, `settings-panel-effects → Efekty dźwiękowe`, `settings-panel-music → Muzyka`; Playwright found each by `getByRole('group', { name })` |
| 7.4 | Missing line hidden on a healthy start | v01 | The `<p>` is in the DOM with `hidden` (text for N = 0 never shows); nothing between "Muzyka" and "Zapis gry" |
| (task) | Missing line N = 1, 3, 12 | v02, v03, v04 | Muted, centred, under the music group. Teacher read: "Nie wczytał się 1 dźwięk. Gra działa dalej bez niego." / "Nie wczytały się 3 dźwięki. Gra działa dalej bez nich." / "Nie wczytało się 12 dźwięków. Gra działa dalej bez nich." — verb, noun and pronoun agree in all three Polish forms (singular masculine, 2–4 plural, 5+ and the teens genitive); calm, no blame, says the game goes on. At 1440 the N = 12 line wraps with "nich." alone on the second line (the panel font is larger at 1440); readable, not clipped |

## Hand-checked numbers (mandatory)

- N for "all effects": `SOUNDS` has 13 entries (13 files per format in `public/assets/sounds/{m4a,ogg}/`), minus `music-loop` = 12 effects;
  the hook listed 12 ids and the line says 12 ✓. N = 1 ↔ `["sounds/star"]`, N = 3 ↔ `["sounds/star","sounds/tap","sounds/coin"]` ✓.
- Card geometry: 720 px wide at both widths, x = (1440 − 720) / 2 = 360 and (1024 − 720) / 2 = 152 — the dump shows 360 and 152 ✓; heights 852
  (900 − 2 × 24) and 720 (768 − 2 × 24) ✓, so the panel fits the viewport and scrolls inside.
- Choice buttons: 12 group buttons (6 stages + 3 × 2 on/off), every one 64 px tall in the dump. The plan's "≥ 96 px" is about scene buttons
  (canvas, 1920-space); the DOM panel keeps the reading group's existing 64 CSS px, unchanged by this slice.

## Observations (not fixed)

- "Dźwięki" is a centred h2 (direct child of the card like the reading caption), while "Zapis gry" and "Obrazki" are left-aligned h2s inside their
  section views. Consistent with the centred reading group right above it; the mixed heading alignment predates this slice (reading centred,
  save left). Follow-up with trigger in `follow-ups/review-fixes.md`.
- `[human]` 9.7 (iPad listening) and 10.6 (iPad offline sounds) stay manual.

## Gate in this step

No code changed, so the local gate was not re-run (the impl-review step observed lint, typecheck, `npm test` 3034 = baseline 2970 + 64, sample
E1–E6 and build green; the full e2e on `82860d2` is the orchestrator's MERGE condition, not observed here). The throwaway spec passed 8/8
(4 states × 2 widths). Port 4399 not listening afterwards; `tests/e2e/visual.local/` deleted.

VISUAL: PASS — "Dźwięki" section and the whole panel captured at 1440×900 and 1024×768; groups follow the reading pattern and are named, missing line hidden when healthy and agreeing at N = 1, 3, 12; no overflow; strings match pl.ts
