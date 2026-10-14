# Handoff — `art-stand-in-and-load-signal` (slice fix, non-roadmap)

Written by the `/10x-implement` phase 6 step of run `2026-10-14-fix-art-stand-in`. Phase 6 is committed (see §1); row 5.4 ticked from the orchestrator note (46 passed on 280ff09).

## 1. State

| | |
|---|---|
| Branch | `feat/art-stand-in-and-load-signal`, cut from `main` at `1812347` |
| Commits | plan commits + p1 `3be41c7` + p2 `b459bc8` + p3 `d3fa403` + p4 `00e90b6` + p5 `d36b952` + p6 `4b7b9dd` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 1.5, 2.5, 3.5 `[reviewer]`, 4.4 `[reviewer]`, 4.5 `[visual]`, 5.5 `[reviewer]`, 5.6 `[visual]`, 6.4 e2e (orchestrator), 6.5 `[reviewer]`, 6.6 `[visual]`, 6.7 `[human]`, phases 7-9 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveImportDialog.ts`, `saveResetDialog.ts` | option `device: DeviceSaveView` (without `broken`) replaces `current`; `blocked` shows `deviceUnavailable` and only "Zamknij"; `unreadable` shows `deviceUnreadable` instead of "Teraz", actions as before |
| `src/scenes/UIScene.ts` | `openImport`/`openReset` use `deviceSaveView(saver.status().blockedBy, saver.current(), ROOMS)`; `broken` closes the panel |
| `src/data/pl.ts` | `saveTransfer.deviceUnavailable`, `deviceUnreadable` |
| `tests/deviceSaveWiring.test.ts` | syntax test of the UIScene wiring (no DOM harness exists) |
| `docs/design-gaps.md` | row 68 added; rows 48/49 point to it |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK |
| `npm test` | 1899 passed (branch baseline 1897, delta +2); deploy and ops shell tests OK; `sample` E1-E6 exit 0; `dialogSessions` green (callback count unchanged) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| Deliberate break | `deviceSaveView(null, …)` in UIScene: red `expected 'private openImport(saver: Autosaver, …' to contain 'saver.status().blockedBy'` (both methods); restored. Meta-check: source-text test, so it proves the wiring only; the behaviour is for e2e phase 9 |
| `npx playwright test ... save-transfer` | e2e: not runnable in this session - orchestrator gate (MachPortRendezvous Permission denied, 4 specs failed at launch); row 6.4 unticked |

## 4. Next command

`/10x-implement art-stand-in-and-load-signal phase 7`

## 5. Open

- 6.4 full e2e `baseline + 0` (46) for the orchestrator (`save-transfer*`, `save-restart` must stay green: healthy-save path unchanged); 6.5 `[reviewer]` teacher read of the two new strings; 6.6 `[visual]`; 6.7 `[human]` FR-022 decision.
- Dialog layout of the new lines is unseen (no browser).

## 6. Autonomous decisions

1. **No DOM unit tests** (no jsdom harness); added a syntax test for the scene wiring instead. Would change: a DOM harness being added.
2. **Reset `unreadable`** keeps the body line "Znikną wszystkie postępy..." followed by the warning in place of the list. Would change: a visual-gate finding.
3. **Reset `blocked`** reuses `deviceUnavailable` (no separate reset string). Would change: teacher read.
4. **Phase driver unchanged** (`impl`); row 5.4 ticked from the orchestrator note.
