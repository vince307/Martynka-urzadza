# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-implement` phase 5 step of run `2026-10-14-save-s13b-s15-s14b` wrote this file; commit `a544e07` holds the code. The next agent must not get this wrong: phase 6 is e2e and the settings export now shows `exportNotDevice` whenever `deviceSaveView` is not a `summary`; the start card's raw export has no warning.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 14 (+ this handoff); phase 4 = `5884958`, phase 5 = `a544e07` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 20 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveExportDialog.ts`, `src/scenes/UIScene.ts` `openExport` | `warning?` option; `openExport` passes `pl.saveTransfer.exportNotDevice` unless `deviceSaveView(saver.status(), …)` is a summary |
| `tests/freshRoundWiring.test.ts` | AST test: `freshRound` reads `REGISTRY_KEYS.artHealth`, passes `missingIds` to `buildAdaptiveRound` and `blocked` to `buildWarmup` |
| `tests/deviceSaveWiring.test.ts` | + `openExport` wiring test |
| `context/changes/save-reason-and-recovery/follow-ups/review-fixes.md` | follow-ups with `Trigger:` |
| `docs/design-gaps.md` row 72 (rows 47, 68 revised), `CLAUDE.md` sentence | docs |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` | 1927 passed (baseline 1923, +4: 3 freshRoundWiring, 1 openExport) |
| `sample` E1-E6, deploy scripts, build | OK, `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS; break (`freshRoundWiringg` path in CLAUDE.md) FAIL, restored |
| Deliberate breaks | `freshRound` without `missingIds` and without `blocked`: the matching `freshRoundWiring` test red each time, restored; meta: proves syntax of the wiring, not filtering (`artFilter.test.ts`) |
| e2e | not runnable in this session — orchestrator gate (MachPortRendezvous, 3 tries). Expect 52 passed (52 + 0) |

## 4. Next command

/10x-e2e save-reason-and-recovery phase 6

## 5. Open

- Row 5.4 e2e part left for the orchestrator (build part verified); 5.5, 5.6 [reviewer], 5.7 [visual], 5.8 [human] not mine; 4.5-4.8 likewise.
- Row 4.4 ticked from the orchestrator note (52 passed on 5884958).
- Phase 6: e2e specs and three break patches (`e2e-break-p6a/b/c.patch`).

## 6. Autonomous decisions

1. Teacher read of `exportNotDevice`: plan wording verbatim (calm, adult, says the copy holds only the current game).
2. Seam sweep: `replaceGate` already the single rule (`saveFile.ts` imports it; no copy in dialogs or `UIScene`); fixed stale comments (import dialog, `DeviceSaveView`, e2e spec header, wiring test header) and gap row 68.
3. Row 5.4 left unticked: it combines build (OK) and e2e (orchestrator).
4. No `AskUserQuestion`; execution in this context, commit message as proposed.
