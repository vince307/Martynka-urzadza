# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-impl-review` step of run `2026-10-13-s12-s14`. All seven phases are reviewed: verdict APPROVED, `MERGE: CLEAR`, fixes committed in `b85f251`, `change.md` is `impl_reviewed`. The next agent (visual gate) must not get wrong: three strings changed in this step (`pl.saveTransfer.exportOutcome.cancelled`, `importPrivacy`, `rejected['unknown-version']`), so screenshots must be taken on `b85f251` or later.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phases `2e435cf`, `5debed5`, `df18f2f`, `2042dc8`, `8c5bb41`, `cc58e16`, `c85022f`; review fix `b85f251`; + this review/handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` = 8: `[visual]` 4.6, 5.5, 6.7 and `[human]` 4.7, 5.6, 6.8, 6.9, 6.10 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-export-import-reset/reviews/impl-review.md` | Full-plan review (phases 1–7): 0 critical, 3 warnings, 4 observations, [reviewer] row table, ends `MERGE: CLEAR — …` |
| `src/data/pl.ts` | `saveTransfer.exportOutcome.cancelled` → "Anulowano. Kopia nie powstała."; `importPrivacy` → "Wybierz kopię zapisu z tej gry. Plik nie jest nigdzie wysyłany."; `rejected['unknown-version']` → "Nie można rozpoznać wersji tego zapisu. Obecne postępy zostały bez zmian." (F2) |
| `src/core/saveFile.ts` | `exportFileText` doc comment names its one throw (F4) |
| `docs/design-gaps.md` | Row 46 lists the three save buttons (F3) |
| `context/changes/save-export-import-reset/follow-ups/review-fixes.md` | "Two browser tabs of one origin" corrected, `saveProblem` path corrected, new "Import or reset over an unreadable save (impl-review F1)" with `Trigger:` |
| `context/changes/save-export-import-reset/plan.md` | [reviewer] rows 1.5, 2.4, 3.4, 4.5, 5.4, 6.5, 6.6 ticked (`b85f251`) |
| `context/changes/save-export-import-reset/change.md` | status `impl_reviewed` |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK (before and after `b85f251`) |
| unit (`npm test` + `deploy/test-martynka-deploy.sh` + `deploy/ops/test-martynka-ops.sh` + `sample` E1–E6) | 1247 passed, samples clean — baseline 1176 + 71 (before and after the fix) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` (plain command; Chromium launched) | 37 passed — baseline 33 + 4, on `3782dfb` and again after `b85f251`; nothing left listening on 4397/4398 |
| Break p7e re-executed (`e2e-break-p7e.patch`) | RED: (b) on heading "Teraz", (c) on "7 gwiazdek"; (a), (d) green; restored (`git checkout`) |
| Break p7c re-executed against unit (`e2e-break-p7c.patch`) | RED: `tests/autosave.test.ts` "turns every later write off after a success", "a second replace … is Busy and writes once"; restored. Meta-check: the unit test drives `markDirty` + `flush('hidden')` after a successful `replace`, i.e. the `pagehide` path the browser cannot provoke without a seam → the known e2e gap (p7c green in the browser) is adequately covered |
| Save safety | `git diff --stat f3088d4...HEAD -- tests/fixtures` empty; `SAVE_VERSION = 1`; `replace`/`persistence` only in `AutosaveStatus`; refusals never call `apply` |
| Hook bypass check | `.claude/settings.json`, `.claude/hooks/*` unmodified since 10–12 Oct; none found |

## 4. Next command

`visual gate (S-12 dialogs: export, import step 1/2/refusal, reset, "Zapis gry" states, unreadable card with reason)`

## 5. Open

- `[visual]` rows 4.6, 5.5, 6.7 (screenshots 1440×900 and 1024×768: panel with three buttons; export dialog before/after "Zapisz plik"; import step 1, refused file, "Teraz / Z pliku"; reset dialog; "Zapis gry" `notYet` and `ok` with the persistence sentence; unreadable card with "Kod: … · Wersja …").
- `[human]` checklist: 4.7 iPad share sheet → Pliki, Android share/download; 5.6 iPad/Android file picker and import; 6.8 `.txt` instead of `.json` (against FR-022's letter); 6.9 copy acceptance (`pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/`saveEarlier`/`savePersist`; note F5: "Zacznij od nowa" is both `errorCard.restart` and `saveTransfer.resetButton`); 6.10 `persist()` result on devices.
- Follow-up F1 (WARNING, deferred): `src/scenes/UIScene.ts` `openImport`/`openReset` over an `unreadable` save — see `follow-ups/review-fixes.md`.
- Observations F6 (UTC date in `UIScene.openExport` file name; `parseImport` length vs bytes) and F7 (`replace` does not re-check `fatal` after `await inflight`) recorded in the review only.
- DESIGN-GAP rows 46–51 in `docs/design-gaps.md`.

## 6. Autonomous decisions

- **F2 wording**: `cancelled` took the orchestrator's suggestion "Anulowano. Kopia nie powstała." (rejected "Plik nie został zapisany." — still uses "zapisany", the word that caused the ambiguity); `importPrivacy` reuses "kopia zapisu" from the dialog title; `unknown-version` impersonal like every other parent line. Would change: the maintainer's copy acceptance (row 6.9).
- **F1 deferred, not fixed**: it needs new copy, a gap row and screenshots, and no contract rule is broken (only a confirmed adult action reaches it). Rejected: fixing in the review step. Would change: a deploy rollback across a save version before the follow-up lands, or the maintainer asking for it before merge.
- **Verdict APPROVED with Plan Adherence WARNING**: warnings never block (contract); all suites green after fixes. Would change: any red suite or a CRITICAL found by the visual gate.
- E2E ran as a plain command with `--config` (cwd is not the repo); Chromium launched, so no request file was needed.
