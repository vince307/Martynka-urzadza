# Handoff — `save-export-import-reset` (slice S-12)

Written by the visual-gate step of run `2026-10-13-s12-s14`; final pre-merge state written by the archive + ship step (this copy is archived). Verdict `VISUAL: PASS`; two discrepancies were fixed in `76cdea4` (import step 2 opened with the focus on the overwrite "Wczytaj", now "Anuluj"; the summary line read "salon: …", now "Salon: …"), the frames were re-captured on `76cdea4`, and the full local gate is green. The next agent (archive + ship) must not get wrong: only `[human]` rows remain open (5); they are the maintainer's checklist, not a reason to block.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phases `2e435cf`, `5debed5`, `df18f2f`, `2042dc8`, `8c5bb41`, `cc58e16`, `c85022f`; review fix `b85f251`; review docs `23792f8`; visual fix `76cdea4`; visual-gate docs `5ccdd96`; ship handoff + `chore(archive): close save-export-import-reset` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-s12-s14/run-log.md |
| `change.md` status | `archived` (folder moved to `context/archive/2026-10-13-save-export-import-reset/`) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` = 5: `[human]` 4.7, 5.6, 6.8, 6.9, 6.10 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveImportDialog.ts` | `openSaveImportDialog` `stepTwo`: `cancel.focus()` after the dialog opens (V1) |
| `src/data/pl.ts` | `saveTransfer.room` capitalises the room name's first letter (V2) |
| `tests/saveTransferCopy.test.ts` | "formats a room line": `room('salon', 0, 10)` → "Salon: 0 z 10" |
| `tests/e2e/save-transfer.spec.ts` | "#7 #2 a valid file replaces the save …": `toBeFocused()` on "Anuluj" at step 2 |
| `docs/design-gaps.md` | Row 48: "Wczytaj" (initial focus on "Anuluj") |
| `context/changes/save-export-import-reset/screenshots/*.png` + `README.md` | 10 states × desktop 1440×900 / tablet 1024×768, routes, what was not captured |
| `context/changes/save-export-import-reset/reviews/visual-review.md` | Visual review, fixes V1–V2, fit/focus measurements, hand-checked stars, observations O1–O4, ends `VISUAL: PASS — …` |
| `context/changes/save-export-import-reset/plan.md` | `[visual]` rows 4.6, 5.5, 6.7 ticked (`76cdea4`) |
| `context/changes/save-export-import-reset/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| Claude in Chrome, `localhost:4399/?e2eSave=unreadable` | card rendered, "Kod: future · Wersja 23792f8", focus "Graj dalej" (cross-check; tab closed) |
| `npx playwright test --config=…/tests/e2e/visual.local/playwright.visual.config.ts` (throwaway, gitignored, moved out) | 6 passed on `23792f8` (found V1, V2) and 6 passed on `76cdea4` (frames committed) |
| `npx vitest run tests/saveTransferCopy.test.ts` before V2 fix | RED 1 failed ("salon: 0 z 10"); after: 11 passed |
| `npm run lint`, `npm run typecheck` | OK |
| unit (`npm test` + `deploy/test-martynka-deploy.sh` + `deploy/ops/test-martynka-ops.sh` + `sample` E1–E6) | 1247 passed — baseline 1176 + 71 (slice), this step +0 tests (+2 assertions); deploy/ops OK; `Naruszenia: 0` ×6 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` | 37 passed — baseline 33 + 4 |
| Deliberate break V1: `cancel.focus()` in `stepTwo` commented out | "#7 #2 a valid file …" RED on `toBeFocused` ("Received: inactive"); restored (diff checked). Meta-check: the only other focus source is `openDialog` focusing the first button ("Wczytaj"), so the assertion proves the fix, not an accident of button order |
| Servers | 4399 (preview, started here) stopped; `lsof -sTCP:LISTEN` on 4397/4398/4399 empty |

## 4. Next command

none — shipped

## 5. Open

- `[human]` checklist (plan.md Progress): 4.7 iPad share sheet → Pliki, Android share/download, result line matches; 5.6 iPad/Android file picker and import; 6.8 `.txt` instead of `.json` (against FR-022's letter); 6.9 copy acceptance (`pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/`saveEarlier`/`savePersist`; F5: "Zacznij od nowa" is both `errorCard.restart` and `saveTransfer.resetButton`); 6.10 `persist()` result on devices.
- Not captured visually (no route or seam; unit-tested): `saveHealthView` `notYet` and `earlierFailures`, persistence `granted`, export outcomes `shared`/`cancelled`/`failed` — `screenshots/README.md`.
- Observation O1 (`reviews/visual-review.md`): the panel's progress preview shows "Krok 8 z 8" for E3 after one round on the parent path with `?e2eMonth=10` — not S-12 code (`src/core/curriculum.ts` start step / `progressView`), not investigated.
- Follow-up F1 (WARNING, deferred): `src/scenes/UIScene.ts` `openImport`/`openReset` over an `unreadable` save — `follow-ups/review-fixes.md`.
- Observations F6, F7 from impl-review stay in `reviews/impl-review.md`.
- DESIGN-GAP rows 46–51 in `docs/design-gaps.md` (48 updated this step); no new rows.

## 6. Autonomous decisions

- **Capture route**: Claude in Chrome for the only gesture-free state (the card), Playwright for everything behind the 2 s gear hold (profile § 8). Rejected: Chrome for the panel (the long press is ignored). Would change: a non-gesture way into the panel.
- **V1 fixed by focusing "Anuluj", keeping "Wczytaj" first and primary**: rejected reordering the buttons like the reset dialog (changes the established step layout and gap row 48's description more). Would change: the maintainer preferring the reset dialog's order (Anuluj first) for both.
- **V2 fixed in `pl.saveTransfer.room`, not in `src/data/rooms.ts`**: room names stay lower case because they sit inside sentences elsewhere. Would change: a room name that must not be capitalised (none today).
- **Row 6.7 ticked although `notYet` was not captured**: the state is unreachable through the product (first write 500 ms after the welcome, panel needs 2 s + gate), recorded in the row and the review; the precedent is the save-observability gate (`fatal` code-reviewed only). Would change: a seam that delays the first write, or the maintainer wanting a screenshot — then un-tick and add the seam in a follow-up.
- **Hand-check file uses 22 stars** (not the e2e's 7) so "Teraz" and "Z pliku" differ and the "gwiazdki" form is exercised. Would change: nothing.
- **Kit frames not captured**: the kit has no settings/export/import/reset/card views (gap rows 44, 46–51).
- **Archive with 5 open `[human]` rows** (ship step): `/10x-archive` warned 5 pending (0 automated, 5 manual) and recommended "Continue archiving"; chosen. Rows 4.7, 5.6, 6.8–6.10 are the maintainer's post-run checklist (devices, FR-022 `.txt` decision, copy acceptance), listed in the PR's "Dla właściciela produktu". Rejected: "Resume implementation" (nothing automated left). Would change: a `[human]` row that the maintainer marks as blocking before merge.
- **No SHA repoint**: the Progress SHAs live on the slice branch, and the PR merges with `--merge` (no squash), so they stay reachable from `main`. Would change: a squash merge.
