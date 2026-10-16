# Visual review — stale-tab-and-health

Run 2026-10-16-fix-stale-tab-health, visual gate after `MERGE: CLEAR` (`reviews/impl-review.md`). Frames and route:
`screenshots/README.md` (Playwright on the hook build, port 4399, 1440×900 and 1024×768). Judged against plan row 12.4, the
copy in `src/data/pl.ts`, DESIGN-GAP rows 116–121 in `docs/design-gaps.md` (the kit has no settings panel and no refusal card, so no
kit frame applies) and the neighbouring panel sections ("Zapis gry", "Obrazki", "Dźwięki") as the house pattern.

## Discrepancies and fixes

None needing a code change. One observation added as a follow-up (VG-1 in `follow-ups/review-fixes.md`); the follow-up "Panel
heading alignment" (trigger: the next visual pass over `settingsPanel.ts`) is answered by this pass and moved to "Closed".

## States

| Row 12.4 item | Frames | Verdict |
|---|---|---|
| "Zapis gry" `otherTab` | — | **Not captured, code-reviewed only.** In the refused window `mountSaveRefusedCard` holds the input switch, so the gear hold cannot open the panel (observed: 0 adult-gate dialogs after a 2.3 s hold with the card up, at both widths). The panel line is `saveHealthView` → `{ kind: 'off', cause: 'otherTab' }` → `createSaveHealthView` → `pl.settings.saveOff.otherTab` (unit `tests/saveHealth.test.ts` "saveHealthView otherTab"); the text is calm and tells the parent what to do. The import/reset sentence `pl.saveTransfer.deviceOtherTab` is reached through `blockedText` the same way. Known by design (impl-review observation and the follow-up "refusal card hides the parent's reason") |
| Offline `ready` | ready-offline | Section "Gra bez internetu" between "Zapis gry" and "Obrazki", heading and body in the same style as "Zapis gry"; copy = `pl.settings.offline.ready` |
| Offline `installing` | installing-offline | `pl.settings.offline.installing` ("… Poczekaj chwilę."); no code line (none expected) |
| Offline `install-failed` with `Kod:` | install-failed-offline | `pl.settings.offline.failed`, then the muted `Kod: InstallFailed · Wersja 3e0636b` (`pl.saveFailed.detail`), same muted style as the save codes |
| Offline `unsupported` | unsupported-offline | `pl.settings.offline.unsupported`, no code |
| Offline `takenOver` | taken-over-offline | `ready` line plus `pl.settings.offline.takenOver` ("Nowsza wersja gry jest gotowa. Zacznie działać przy następnym uruchomieniu."); the page itself still runs the old build (`3e0636b` in the corner), which is exactly what the line says. "Zapis gry" there reads "not yet" because this page has not written since its reload (existing `saveNotYet` rule) |
| Offline `register-failed` (extra) | register-failed-offline | `pl.settings.offline.registerFailed` + `Kod: TypeError`; reachable with `serviceWorkers: 'block'` |
| "Obrazki" UI line ok | uiart-ok | Third line `pl.settings.uiArtOk` under the task and room lines, same paragraph style |
| "Obrazki" UI line missing | uiart-missing | "1 z 5 obrazków ekranów nie wczytał się. Na tych ekranach zamiast obrazka jest napis lub rysunek. Uruchom grę ponownie." = `pl.settings.uiArtMissing(1, 5)` (string compared in the run); the task and room lines stay "ok" |
| Music `loading` | music-loading | Muted line under the "Muzyka" buttons (`pl.settings.musicStatus.loading`), centred like the "no Polish voice" muted line above |
| Music `waiting-unlock` | music-waiting-unlock | `pl.settings.musicStatus.waitingUnlock`; hook `sound.locked` = true, `music` = `waiting-unlock` |
| Music `missing` | music-missing | `pl.settings.musicStatus.missing` ("… Gra działa dalej bez niej.") |
| Sound choice not kept | prefs-not-kept | `pl.settings.soundPrefsNotKept`, muted, under the sound group; the effects choice still applied for the session (buttons show "Wyłączone") |
| Child card over the task screen | child-card | Full-screen cream overlay (the same `.overlay` layer as the unreadable-save card, DESIGN-GAP 117), title `pl.saveRefused.title` "Zacznijmy grę jeszcze raz", one sentence, one teal button "Zacznij od nowa" (min-height 96 px). Calm: no "błąd", no warning colour, no parent wording. Fits both widths without wrapping the title |
| After restart | child-card-after-restart | Reload onto the task screen, stars = the other window's (see the number below), no card, input on |

## Keyboard, focus, input switch

- Settings panel: initial focus on the first stage button ("Klasa 1, I półrocze"), not on a destructive action; "Zacznij od nowa"
  (reset) is far below and needs its own dialog with a second tap. Unchanged from before this change.
- Child card: initial focus on its only button "Zacznij od nowa" (observed `document.activeElement`). It is not destructive here: it
  reloads and loads the newest save; nothing is overwritten (the write was refused).
- Input switch: `inputEnabled` false while the panel or the card is up, true after "Zatwierdź" in every panel state and true after the
  card's restart (observed in the hook at both widths).

## Hand-checked numbers (mandatory)

- UI-art count: `UI_ART` in `src/data/uiArt.ts` has 5 entries (loading-background, loading-emblem, wallet-open, skill-notebook,
  salon-after); one aborted (wallet-open) → missing 1, total 5 → "1 z 5", count 1 takes the singular verb "nie wczytał się" ✓.
- Child card stars: `balance.round` = 5 tasks × 1 star + clean bonus 2 = 7 per clean round. Window A's first round → 7; window B loads
  7 and plays a clean round → 14; A's stale answer would make A's state 8 and is refused. After "Zacznij od nowa", A shows 14 = B's
  14 (observed 14 at both widths) ✓.

## Fit on the 1024 tablet

Panel about 715 CSS px wide (measured on the frames) at both widths, with the scroll area above the fixed "Zatwierdź"/"Anuluj" row; new lines wrap inside the panel, the `Kod:` line
stays on one line, nothing overlaps the footer. Card title on one line at 1024.

## Autonomous decisions

- Playwright instead of Claude in Chrome (profile § 8: the gear needs a canvas long press; the card needs rounds played on the canvas).
  Would change: a Chrome tool that can drive canvas touches.
- Browser conditions simulated in the browser, never in the app: a held/aborted worker request (`context.route` on worker requests),
  `serviceWorker` removed, a never-resuming `AudioContext`, a throwing `localStorage.setItem` for the sound key. Each is a real device
  condition (slow network, an old browser, an iPad before the unlocking touch, a private window); the app code runs unchanged.
  Would change: a seam in the app for these states (none exists, none was added).
- `takenOver` reached with an explicit `registration.update()` after the reload: Chromium did not run its navigation soft update
  within 16 s here. The update path itself (new worker installs, `clientsClaim`, `controllerchange` on a page that had a controller)
  is the product's. Recorded as VG-1. Would change: a report that deployed builds do not arrive at the next launch.
- Row 12.4 ticked with the `otherTab` panel line marked code-reviewed only, because the product makes that state unreachable on
  purpose (the card holds the input). Would change: a decision to let the panel open over the card.

## Gate in this step

No source changed, so the local gate was not re-run (the impl-review step observed it green on `cc1621d`, e2e 125 on `10de24c`).
Ports 4399 not listening afterwards; `tests/e2e/visual.local/` moved out of the repo.

VISUAL: PASS — every row 12.4 state captured at 1440×900 and 1024×768 except the panel's "Zapis gry" otherTab line, which the refusal card makes unreachable by design (code-reviewed, unit-tested); copy matches pl.ts, the child card is calm with focus on its one harmless button, the input switch is released after the panel and the card; UI-art "1 z 5" and stars 7 + 7 = 14 hand-checked
