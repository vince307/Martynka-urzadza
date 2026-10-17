# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-e2e save-truth phase 15` step, the LAST phase: phases 1-15 are committed and green, `change.md` is `implemented`. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and the open [reviewer]/[visual]/[human] rows are not ticked by anyone but their owners.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-14 as before, phase 15 = `test(save-truth): Late read error and old-version copy (p15)` 7e715a9, plus handoff/epilogue commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 29 (all [reviewer]/[visual]/[human] rows, `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/save-backup-health.spec.ts` | two tests added: `#2 SVB-02 a read that fails while the parent waits shows the error card with its code` (`?e2eSave=slowfail`), `#2 #7 SV2-04 the kept old save can be saved and imported again` (`?e2eSave=v1`, real download, import in a new browser context); `openSlowCard` accepts `slowfail` |
| `context/changes/save-truth/plan.md` | rows 15.1-15.3 ticked with 7e715a9 |
| `context/changes/save-truth/change.md` | status `implemented` |

## 3. Verification

| command | result |
|---|---|
| spec alone | 7 passed (5 existing + 2 new) |
| Break p15a (`main.ts` `onWait` returns `still-slow` for every `unavailable`) | (a) red: `expect(locator).toBeVisible() failed ... element(s) not found` on the `saveUnavailable` card; restored |
| Break p15b (`settingsPanel.ts` backup button never added) | (b) red: `locator.tap: Test timeout of 120000ms exceeded` on the "Zachowaj kopię starego zapisu" button; restored |
| Meta-check | (a) proves the late-read branch reaches the error card with `Kod: UnknownError`, not the still-slow line; (b) proves the copy's bytes survive export (real download) and import, the summary showing the v1 save's 7 stars, not that Safari keeps the key; the (b) red is a button-missing timeout, not an assertion text |
| lint / typecheck / `npm test` (3535) / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)`; `slowfail` absent from `dist/` (grep empty) |
| `npx playwright test --workers=4` | 132 passed (baseline 130 + 2) |
| stray processes | checked outside the sandbox before the report; Playwright's own servers on 4397/4398 end with the run |

## 4. Next command

`/10x-impl-review save-truth`

## 5. Open

- Rows 15.4 [human] and the earlier [reviewer]/[visual]/[human] rows (2.5, 2.6, 3.6-3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5, 10.4, 10.5, 11.4-11.6, 12.4, 12.5, 13.6, 13.7, 14.4) not ticked.
- `isRecord` still has three copies; follow-ups with triggers are in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `e2e`; both tests added to the existing `save-backup-health.spec.ts` as the plan says; hook build only.
2. Test (b) imports the downloaded file on a second browser context and stops at the summary step (stars listed, "Wczytaj" visible) without loading: the import reload is covered by `save-transfer.spec.ts`.
3. Both breaks were applied together in one run (each test depends on one of them) and restored with `git checkout` of the two source files.
4. Commit message and next-phase prompts decided in place; this is the last phase, epilogue run (`change.md` -> implemented).
