# Visual review — salon-load-health

Run 2026-10-15-fix-salon-load-health, visual gate after `MERGE: CLEAR` (impl review, 4fb1a5b). Frames and route:
`screenshots/README.md` (Playwright on the hook build, port 4399, 1440×900 and 1024×768). Judged against the copy in `src/data/pl.ts`
(`pl.settings.saveHeading`, `saveOk`, `saveLast`, `saveMigrated.kept`, `savePersist.denied`, `artHeading`, `artOk`, `roomArtMissing`),
the existing parent panel (`src/ui/dom/settingsPanel.ts`, `saveHealthView.ts`, `artHealthView.ts`) and design-gap rows 43, 50, 67
and 95 (the kit has no save indicator nor a "moved from version" line; the panel's plain heading + sentence is the agreed form).

## Discrepancies and fixes

None needing a code change; no e2e spec touched.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 2.6 | "Zapis gry" after `?e2eSave=legacy-salon`, no round | v01 (both widths) | Lines in order: "Postępy zapisują się na tym urządzeniu." / "Ostatni zapis: 22:07" / "Zapis przeniesiono z wersji 2. Stara kopia została na tym urządzeniu." / "Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię." — each string equals `pl.ts`; no code line (copy kept, `backup: 'done'`). Wraps cleanly at 1024, nothing clipped except by the panel's own scroll area. Runtime status read in the same test: `migratedFrom: 2`, `migrationWrittenAt` set, store ops `backup, write, write` (start write, then the parent's stage choice), `writtenVersion: 3` |
| 2.6 (extra) | Same after `?e2eSave=v1`, no round | v02 | Same block with "… z wersji 1. …"; the game starts straight on the task screen (the v1 fixture has a learner) |
| 3.x (extra) | Stalled salon picture (`?e2eArt=stall`) | v03 | "Obrazki": "Wszystkie obrazki zadań są wczytane." / "1 z 26 obrazków pokoju nie wczytał się. W pokoju zamiast obrazka jest napis. Uruchom grę ponownie."; the game reached the task screen, so the stall ended the loading |

## Hand-checked numbers (mandatory)

- Star counter: legacy-salon frame shows 3 = `stars` of `tests/fixtures/save-v2-legacy-salon.json` (3); v1 frame shows 7 = `save-v1.json` (7);
  stall frame 0 (fresh device). The migration and the parent's stage choice do not touch the balance ✓.
- Room pictures: total 26 (the salon set, same count as the S-16a gate's "26 z 26"), one file held → `missing: 1`, line "1 z 26" ✓.
  Agreement for 1: `inflect(1, …)` → "nie wczytał się" (singular, as in "1 obrazek nie wczytał się") ✓.
- Version in the line equals `migratedFrom` (2 and 1) ✓.

## Fit and legibility on the 1024 tablet

Body text about the size of the stage-button labels (read off the frame), heading bold; the "moved" sentence wraps to two lines at 1024 and stays inside the panel padding. The
panel scrolls; "Zatwierdź"/"Anuluj" stay pinned at the bottom. Focus order was not exercised in this gate: the panel itself is
unchanged by this slice (only lines inside "Zapis gry" / "Obrazki" are new).

## Observations (not fixed)

- The "Ostatni zapis" time is the parent's stage choice (a second write), not the start migration write; correct, since it is the
  last write. No follow-up.
- `[human]` 3.5 (WebKit stall on an iPad) and 1.6 (one-way door after a rollback) stay manual.

## Gate in this step

No code changed, so the local gate was not re-run (the impl-review step observed it green on b4c8565's code: lint, typecheck,
`npm test` 2925, sample E1–E6, build, e2e 101). The throwaway spec passed 6/6 here. Port 4399 not listening afterwards;
`tests/e2e/visual.local/` deleted.

VISUAL: PASS — row 2.6 captured at 1440×900 and 1024×768 for the v2 legacy salon and the v1 save, plus the stalled-picture "Obrazki" line; every string matches pl.ts, numbers hand-checked against the fixtures
