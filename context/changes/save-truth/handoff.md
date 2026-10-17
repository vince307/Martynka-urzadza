# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 11` step. Phases 1-11 are committed and green (phase 11 = 2483571). The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key; also a BroadcastChannel message alone never blocks the only live tab's write.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-10 as before, phase 11 = 2483571 (`feat(save-truth): Import and reset say what happened (p11)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`); 11.1-11.3 ticked, 11.4 [reviewer], 11.5 [visual], 11.6 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/dom/saveSummaryView.ts` | `failureText` first branch: a timeout (`isTimeoutError`) -> `pl.saveTransfer.replaceUnconfirmed`, forced or not; `resetLead(hasList)` (no dangling colon without a summary); `blockedText` knows cause `broken` |
| `src/ui/dom/saveImportDialog.ts` | exports `BrokenDevice` (`{kind:'blocked',cause:'broken',forceable:false}`); `file.text()` rejection -> `refuse('unreadable-file', errorName(e))`; failure line has `tabIndex=-1` and takes the focus (V2) |
| `src/ui/dom/saveResetDialog.ts` | accepts `BrokenDevice`; uses `resetLead`; failure line focus as above |
| `src/core/saveFile.ts` | `ImportRejection` + `'unreadable-file'` |
| `src/scenes/UIScene.ts` | `openImport`/`openReset` no longer `closeSettings()` on `broken`: `brokenView(saver)` logs `saveProblem(saver.current())` and opens the blocked branch |
| `src/data/pl.ts` | `saveTransfer.replaceUnconfirmed` "Gra nie dostała potwierdzenia zapisu. Uruchom grę ponownie i sprawdź postępy." (gap 134); `rejected['unreadable-file']` "Nie udało się odczytać tego pliku. Spróbuj wybrać go jeszcze raz." (135); `deviceBroken` "Obecnego stanu gry nie da się odczytać. Uruchom grę ponownie." (136) |
| `docs/design-gaps.md` | rows 134-136 |
| tests | new `tests/saveSummaryView.test.ts` (`failureText`, `resetLead`); `saveTransferCopy.test.ts` (exhaustive `Record<ImportRejection,true>`, deliberately reversed: `unreadable-file` does not end in "bez zmian"); `deviceSaveWiring.test.ts` (+2, `brokenView`); e2e `save-backup-health.spec.ts` #2 SV2-02 asserts `replaceUnconfirmed` instead of `resetFailed` (deliberate reversal) |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `AssertionError: expected 'Nie udało się zacząć od nowa. Obecne …' to be 'Gra nie dostała potwierdzenia zapisu.…'` (failureText timeout); also `resetLead(false)` got "…urządzenia:", `rejected` keys 7 vs 8, wiring `expected 'private openImport…' to contain 'saveProblem(saver.current())'`: 6 failed / 22 passed. (`resetLead` was a stub returning `resetBody`.) The wiring test was then re-shaped to look at the `brokenView` helper before GREEN |
| Deliberate break | removed the timeout line from `failureText`: 2 cases red (same assertion); restored, green. Meta-check: proves the text rule only; the `writehang` path is proven by the edited e2e spec |
| `npm test` | 3510 passed (baseline after p10: 3503, +7) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), 0 flakes; run once after the last edit |
| `SAVE_VERSION`, fixtures | 4; no fixture touched |
| stray processes | `ps … | grep -E 'sleep|until|playwright|vite'` empty (outside sandbox) |

## 4. Next command

`/10x-tdd save-truth phase 12`

## 5. Open

- Rows 11.4 [reviewer], 11.5 [visual], 11.6 [human] not ticked. Also open: 2.5, 2.6, 3.6-3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5, 10.4, 10.5.
- No DOM test for the broken-device dialog branch or the focus change (vitest has no DOM); visual 11.5 shows the reset dialog after `writehang` only; a broken state is hard to reach in a browser.
- Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `tdd` as planned; no redirect.
2. O2 solved in code (`resetLead` strips the trailing colon of `resetBody` when no summary follows) instead of a new pl string, so no extra gap row.
3. The broken-device case is a `BrokenDevice` value of the existing `blocked` shape (cause `broken`, not forceable) rather than a new dialog; `DeviceSaveView.broken` stays in `saveFile.ts` untouched.
4. V2: on failure the status line (now `tabindex=-1`) takes the focus instead of "Zamknij"; "Zamknij" stays one Tab away.
5. `unreadable-file` text does not claim the save is untouched (nothing was applied); the old "all rejections say bez zmian" test was narrowed for it.
6. Commit message and next-phase prompts decided in place; the run stops after this phase.
