# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 12` step. Phases 1-12 are committed and green (phase 12 = a999819). The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key; also a BroadcastChannel message alone never blocks the only live tab's write. The room-state check only reports: it never repairs `rooms`.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-11 as before, phase 12 = a999819 (`feat(save-truth): Room state checked against the salon (p12)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 40 (`grep -c '^- \[ \]' plan.md`); 12.1-12.3 ticked, 12.4 [reviewer], 12.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/rooms.ts` | `roomStateProblems(rooms, catalogue)` (kinds `unknown-room`, `tasks-overflow`, `unknown-slot`, `chosen-not-bought`, `variant-out-of-range`; one entry per room and kind; pure, input untouched), `parentVisible` (false for `unknown-room`), `RoomProblem` |
| `src/core/saveFile.ts` | `SaveSummary.mismatch` (any parent-visible problem over `session.rooms`) |
| `src/core/saveHealth.ts` | `saveHealthView(status, copies, roomProblems = [])` -> `roomMismatch: boolean` |
| `src/main.ts` | after a loaded save: `roomStateProblems`, one `console.warn` listing them, `REGISTRY_KEYS.roomProblems` set after `createGame` (also `[]` on fresh/unreadable) |
| `src/data/layout.ts` | `REGISTRY_KEYS.roomProblems` (not in `SAVE_KEYS`) |
| `src/scenes/UIScene.ts` | passes the registry list to `saveHealthView` |
| `src/ui/dom/saveHealthView.ts`, `saveSummaryView.ts`, `saveImportDialog.ts` | the "Zapis gry" line; `createSummaryList(..., mismatchLine?)` muted line under the "Z pliku" list only |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.roomMismatch` (gap 137), `saveTransfer.roomMismatch` (gap 138) |
| tests | `rooms.test.ts` "roomStateProblems (R-4)" (each kind, audit case curtains/7, no mutation, `parentVisible`, 8 frozen fixtures give nothing parent-visible); `saveFile.test.ts` (3 `mismatch` cases; the `deviceSaveView` room double got `slots: []`; one `toEqual` became `toMatchObject`); `saveHealth.test.ts` (`roomMismatch`) |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | `AssertionError: expected [] to deeply equal [ { room: 'living', …(1) } ]` (stub `roomStateProblems` returned `[]`); `only an unknown room is hidden from a parent`: `expected true to be false`; `saveSummary(...).mismatch` and `roomMismatch`: `expected undefined to be false`. 12 failed in rooms.test.ts, 4 more in saveFile/saveHealth |
| Deliberate break | `parentVisible` returned true for `unknown-room`: 9 red (the fixture cases `expected [ { room: 'living', … } ] to deeply equal []`, the unknown-room summary and view cases); restored, green. Meta-check: proves the rule over the frozen fixtures (8 files), not every device's history |
| `npm test` | 3530 passed (baseline after p11: 3510, +20) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), 0 flakes; run once after the last code edit |
| `SAVE_VERSION`, fixtures | 4; no fixture touched; `tests/saveKeys.test.ts` unchanged and green |
| stray processes | `ps … | grep -E 'sleep|until|playwright|vite'` empty (outside sandbox) |

## 4. Next command

`/10x-implement save-truth phase 13`

## 5. Open

- Rows 12.4 [reviewer], 12.5 [visual] not ticked. Also open: 2.5, 2.6, 3.6-3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5, 10.4, 10.5, 11.4-11.6.
- No DOM test for the new preview/health lines (vitest has no DOM); visual 12.5 needs an over-count file from a fixture copy in a `*.local` folder.
- Phase 13 writes `follow-ups/review-fixes.md`; it also sweeps seams of phases 1-12 and records `REGISTRY_KEYS.roomProblems`/gaps 137-138 in `CLAUDE.md`.

## 6. Autonomous decisions

1. Driver `tdd` as planned; no redirect. The inline part (registry key, `console.warn`, DOM line, pl strings, gap rows) is wiring done after the pure tests.
2. `chosen-not-bought` also covers a chosen slot that has no slot task at all; `variant-out-of-range` is checked against the slot's `variants.length`.
3. The import-preview line is a parameter of `createSummaryList` shown only for the file list (gap 138 wording says "w tym pliku"), not for "Teraz" or reset.
4. `saveSummary` gained `mismatch`; one old `toEqual` on the summary became `toMatchObject` and a hand-made room double in `deviceSaveView` tests got `slots: []` because the rule now reads slots.
5. Nothing is repaired: `main.ts` computes the list after `repairCurrentRoom` (which is the existing, older repair of `currentRoom`) and never writes `rooms`.
6. Commit message and next-phase prompts decided in place; the run stops after this phase.
