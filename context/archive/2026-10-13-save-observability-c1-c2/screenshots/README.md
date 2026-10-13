# Screenshots — save-observability-c1-c2 visual gate

Captured 2026-10-13 with the Playwright fallback (as in S-10 and S-11): a throwaway spec in a gitignored
`tests/e2e/visual.local/` folder (own config, no `webServer`, service workers blocked, `hasTouch`, `timezoneId:
'Europe/Warsaw'`, `locale: 'pl-PL'`), reusing `tests/e2e/support/{welcome,hook}.ts`, against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`
on the visual port 4399. The folder was moved out of the repo before the lint gate. Frames are at `8af55af` (build id in
the corner); no production code changed in this step.

- `desktop-*` = 1440×900 viewport; `tablet-*` = 1024×768.
- Every test is a new browser context (a fresh device). Save states come only from the e2e-only `?e2eSave=` seams
  (in-memory stores, never IndexedDB): `unavailable` (the read rejects with `UnknownError`), `hang` (the read never
  answers; the hook build's 300 ms limit), `unreadable` (a v99 save), `writefail` (writes reject with
  `QuotaExceededError`). The "ok" state is a normal start with IndexedDB written by the game itself. The script never
  opened IndexedDB; the save status was read from the read-only hook.
- A silent speech stub is installed before load (no HUD speaker; the panel shows the "no Polish voice" line).
- Panel frames are scrolled so the "Zapis gry" section sits mid-panel (`scrollIntoView({ block: 'center' })`); the
  panel opens scrolled to the top, where at 1024×768 the section starts just above the sticky actions.

| # | State | Desktop | Tablet | How reached |
|---|---|---|---|---|
| 01 | "save unavailable" card: title, body, one main button "Graj dalej" (focused), note; no "Zachowaj kopię" | `desktop-01-card-unavailable.png` | `tablet-01-card-unavailable.png` | `/?e2eSave=unavailable` |
| 02 | the same card after the load timeout | `desktop-02-card-hang.png` | `tablet-02-card-hang.png` | `/?e2eSave=hang` |
| 02b | welcome after "Graj dalej" from the timeout card (hook `load: unavailable`, `lastError: timeout`) | `desktop-02b-welcome-after-hang.png` | `tablet-02b-welcome-after-hang.png` | "Graj dalej" |
| 03 | welcome after "Graj dalej" from the unavailable card | `desktop-03-welcome-after-unavailable.png` | `tablet-03-welcome-after-unavailable.png` | "Graj dalej" |
| 04 | existing unreadable-save card (regression, for consistency) | `desktop-04-card-unreadable.png` | `tablet-04-card-unreadable.png` | `/?e2eSave=unreadable` |
| 05 | panel "Zapis gry" ok: "Postępy zapisują się na tym urządzeniu." + "Ostatni zapis: HH:MM" | `desktop-05-panel-ok.png` | `tablet-05-panel-ok.png` | parent welcome (E3), first write, 2 s hold on the gear, gate |
| 06 | panel failing: "Ostatnie próby zapisu się nie udały. …" | `desktop-06-panel-failing.png` | `tablet-06-panel-failing.png` | `?e2eSave=writefail`, parent welcome (a change → failed write), gear, gate |
| 07 | panel off (unavailable) | `desktop-07-panel-off-unavailable.png` | `tablet-07-panel-off-unavailable.png` | frame 03, age 6 (E1), gear, gate |
| 08 | panel off (unreadable) | `desktop-08-panel-off-unreadable.png` | `tablet-08-panel-off-unreadable.png` | frame 04, "Graj dalej", age 6, gear, gate |

Not captured: panel off with cause `fatal` (`pl.settings.saveOff.fatal`) — no seam reaches it; code-reviewed and
unit-tested only (`tests/saveHealth.test.ts`).

Kit: the kit has neither card nor save section (DESIGN-GAP 42, 43, 45); both reuse the DOM overlay and parent-dialog styles.
