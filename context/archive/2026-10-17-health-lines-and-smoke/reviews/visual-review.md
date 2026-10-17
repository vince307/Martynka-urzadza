# Visual review for health-lines-and-smoke

This is the visual gate of run 2026-10-16-audit-sweep, slice 3 of 3. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `d090f0b`. The frames and the route are in `screenshots/README.md`: Playwright on the hook build, port 4399, at 1440×900 and 1024×768, 13 states per width.

The frames were judged against:
- the `[visual]` rows of `plan.md`;
- the copy in `src/data/pl.ts`;
- DESIGN-GAP rows 139-150 in `docs/design-gaps.md`;
- the settings-panel pattern already on main.

The kit has no parent panel, so no kit frame applies.

## States

| Row | Frames | Verdict |
|---|---|---|
| 2.5 | sw-update-failed | "Gra bez internetu" shows `offline.updateFailed` ("Nowej wersji gry nie udało się pobrać. Ta wersja działa dalej bez internetu.") with the muted `Kod: InstallFailed · Wersja d090f0b`. The status came from the real reducer `stepSw` (temporary seam, see below). |
| 5.5 | art-missing, art-stallall | `missing`: the cause line `artCause.never`, the no-restart advice and `Kod: never`. `stallall`, after the VG-1 fix: `artCut` ("Część obrazków nie zdążyła się wczytać. Przy lepszym internecie uruchom grę ponownie."), no second cause or advice line, and `Kod: cut`. Before the fix it showed the wrong `network` cause (VG-1 below). |
| 6.5 | art-missing, art-room, art-stall | Folder lines "pieniądze: brak 15 obrazków.", "miary: brak 11 obrazków." and "obrazki do liczenia: brak 15 obrazków.", plus `artSkipped`. The labels are capped at 3: "Brakuje: roślina, sofa Morska, sofa Słoneczna." `artNoRestart` shows for `never`. For a stalled coin (`network`) it is `artRestart` instead, and "pieniądze: brak 1 obrazka." uses the genitive singular. |
| 7.5 | ui-wallet-task, ui-wallet, ui-notebook-card, ui-notebook | The wallet task shows the drawn wallet (dashed mat). The unlock card shows the `book` icon. The panel says "3 z 5 obrazków ekranów nie wczytały się…" (the two loading pictures load), the `decode` cause and "Zamiast obrazka gra rysuje: portfel." / "… zeszyt.". The wallet and notebook come from separate sessions, because MONEY_PAY is E1/E2 and the unlock road is E4 (the e2e specs do the same). |
| 8.5 | sound-nodevice, music-404 | With no audio device, "Dźwięki" shows `soundNoDevice` ("Na tym urządzeniu gra nie ma dźwięku.") and the "n dźwięków" line is hidden, although 12 effects are missing. With a music 404: "Muzyka nie wczytała się. Gra działa dalej bez niej. Kod: http:404". |
| 10.6 | salon-carried | "Zapis gry": `saveMigrated.kept(2)`, then `salonCarried` ("Pokój przeniesiony na nowy wygląd. Kupione rzeczy zostały."), then the persistence line. |

Extra frame: font-fallback shows "Litery w zadaniach są w zastępczym kroju pisma." with all three tables ok. The same line also appears under `stallall`, where the font is held.

## Hand-checked values (mandatory)

- **Folder counts under `?e2eArt=missing`.** `TASK_ART` holds 41 entries, read from `src/data/taskArt.ts`: money 15, measuring 11, icons 15. 15 + 11 + 15 = 41, which matches the line "41 z 41". Numeral agreement checks out:
  - "15/11 obrazków" is genitive plural for 5-21.
  - "41 … nie wczytało się" takes the neuter verb for 5+ (41 ends in 1 but is not 1).
  - Under `stall`, "1 z 41 obrazków nie wczytał się" and "brak 1 obrazka" use the singular ✓.
- **Cut set under `stallall`.** The boot log says "Boot load cut after 3058 ms: 69 files". `cutByTable` gives task 15 + room 38 + ui 3 + sound 12 + font 1 = 69 ✓.
  - The panel shows task "15 z 41". These are exactly the money pictures the spec held. The measuring and icon files loaded.
  - Room shows "38 z 38".
  - Screens show "3 z 5": wallet, notebook and salon thumbnail. The two loading pictures were queued first and arrived. "3 … wczytały się" uses the verb for 2-4 ✓.

## Keyboard and focus

When the panel opens, the focus is the current stage button. It is the same at both widths and is not destructive. "Zacznij od nowa" never had the initial focus. The panel's dialogs are not part of this slice.

## Discrepancies

- **VG-1 (fixed, `fix(health-lines-and-smoke): …`).** Under `?e2eArt=stallall`, every cut picture had the cause `network`, so the panel added "Tych plików nie udało się pobrać…", a second restart advice and `Kod: network` under the cut line. Phase 5 says the cut line alone covers a cut.
  - Cause: `cutLoad` fails the last file, which ends the load. Phaser then runs `BootScene.create()` synchronously, inside `cutLoad`, before `this.cut = cutLoad(…)` is assigned. `artCauses` saw an empty cut set and fell back to the aborted request's status 0. The console order proved it: "Task art causes: …=network" came before "Boot load cut after …".
  - Fix: a new `pendingKeys(load)` in `src/scenes/loaderCut.ts`, which is also used by `cutLoad`. `BootScene.preload` records `this.cut = pendingKeys(this.load)` before it calls `cutLoad`.
  - Test: `load-and-tab-guard.spec.ts` "#14 B-4" now asserts no `artCause.network`, no `artRestart`, and `Kod: cut`. It went RED by assertion on the unfixed code (`toHaveCount(0)`, received 1) and green after the fix.
  - `tests/loaderCut.test.ts` gains two `pendingKeys` cases.
- **Follow-up 20 (wording).** With the notebook missing, the card shows the pack's book icon, not a drawing, yet the line says "gra rysuje: zeszyt". This was left to the [human] wording row 11.8.
- **Follow-up 21.** Under `vite preview` the missing screen-picture URL answers `200 text/html` (the SPA fallback), so the cause reads `decode`. Caddy answers 404, which gives `fetch`. This is not a product defect.

## Autonomous decisions

- **Playwright instead of Claude in Chrome.** Every state needs the 2 s gear hold on the canvas, and profile § 8 says Chrome cannot drive it.
  - Would change: a Chrome tool that drives canvas touches.
- **One temporary seam (`?vgSwUpdateFailed`).** It was patched into `src/main.ts` for the two `dist-e2e` builds only and reverted with `git checkout` right after each one. It was never committed.
  - No seam on the branch reaches a failed update behind an active worker. Row 2.5 names this route.
  - Would change: a committed `?e2eSw=` seam.
- **No-audio device through an init script.** The script deletes `AudioContext`, `webkitAudioContext` and `Audio`, so it touches no code. The plan's "Web Audio disabled in a throwaway spec" route was followed.
- **VG-1 fixed in the gate, not deferred.** It is a wrong parent-facing line on a path the slice built, with a one-line cause and a red-first e2e assertion.
  - Would change: a fix that needed a change to Phaser internals beyond the pinned loader paths.

## Gate in this step (after the VG-1 fix)

- lint OK and typecheck OK.
- Unit: `Tests 3656 passed`, which is the branch's 3654 + 2 (`pendingKeys`), or contract baseline 3545 + 111. The deploy scripts OK, `sample` E1-E6 OK.
- Build: `e2e hook: absent (2 chunks checked)`.
- e2e `--workers=4`: 139 passed (11.6 m), contract baseline 132 + 7, no flakes.

Port 4399 was not listening afterwards. `tests/e2e/visual.local/` was moved out of the repo. `dist-e2e/` was rebuilt clean by the full e2e run's `webServer`.

VISUAL: PASS — all six [visual] rows were captured at 1440×900 and 1024×768 through the product, the hook-build seams and one reverted local seam (`updateFailed`). Each "Obrazki", "Dźwięki", "Gra bez internetu" and "Zapis gry" line matches pl.ts. The folder counts 15+11+15=41 and the cut set 15+38+3+12+1=69 were hand-checked. VG-1 (cut pictures reported as `network`) was fixed with a red-first e2e assertion. Follow-ups 20-21 cover wording and preview-only causes.
