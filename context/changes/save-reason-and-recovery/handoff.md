# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The finishing step of phase 6 (e2e) of run `2026-10-14-save-s13b-s15-s14b` wrote this file; all six phases are implemented, spec commit `b23bc53`. The next agent must not get this wrong: the Manual rows (reviewer, visual, human) are all still open and belong to impl-review and the maintainer, not to implement.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | phase 6 = `b23bc53` (+ this handoff commit); phases 1-5 earlier (`974cd90`, `815af40`, `5de4d76`, `5884958`, `a544e07`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 14 (all Manual: reviewer, visual, human) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/save-transfer-blocked.spec.ts` | 7 tests incl. the 4 new "#2 SIR-0x" ones (future never overwritable, unavailable second confirmation, hang offers no overwrite, panel copy warns) |
| `tests/e2e/save-restart.spec.ts` | extended assertions (`Kod: UnknownError`, `detail` on the card, `saveOff.timeout`) |
| `context/changes/save-reason-and-recovery/e2e-break-p6{a,b,c}.patch`, `e2e-request-p6.md` | break patches and the orchestrator request, kept as evidence |
| `plan.md`, `change.md`, `handoff.md` | rows 6.1-6.5 ticked, status implemented |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK (observed) |
| `npm test` | 1927 passed (unchanged, baseline 1927) |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e (orchestrator, inherited) | save-transfer-blocked + save-restart 14 passed; alone 7 passed (41 s); full suite 57 passed (4.1 min) = baseline 52 + 5 (plan said +4) |
| Orchestrator fix | test "#2 SIR-04 a copy from the panel says it is not the device save" tapped `pl.saveTransfer.close`; the pre-save export button is `pl.parent.cancel`; changed; first run timed out on that locator (13/14) |
| Break p6a (`replaceGate` lets `future` through) | only "#2 SIR-01 a save from a newer version is never offered for overwrite" red: `Zastąp mimo to` count Received 1, expected 0; other 6 green; restored. Meta: proves the reason in the browser dialog, not only in core |
| Break p6b (reset without `force`) | only "#2 SIR-02 a save the browser never gives can be replaced after a second confirmation" red: card never reappears; other 6 green; restored |
| Break p6c (`openExport` without warning) | only "#2 SIR-04 a copy from the panel says it is not the device save" red: `exportNotDevice` not found; other 6 green; restored |
| `src/` diff in this phase | none |

## 4. Next command

/10x-impl-review save-reason-and-recovery

## 5. Open

- Manual rows: 1.5, 2.4, 3.5, 4.5, 5.5, 5.6 [reviewer]; 2.5, 3.6, 4.6, 5.7 [visual]; 3.7, 4.7, 4.8, 5.8 [human].
- Row 6.1 expected +4 e2e tests, measured +5; harmless, noted in the row.
- Follow-ups with `Trigger:` in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Rows 6.1-6.5 ticked from the orchestrator's observed evidence plus my own lint, typecheck, unit and build run. Rejected: leaving 6.5 open for want of a Playwright run by me (contract forbids it). Would change if the orchestrator's run were found stale.
2. Kept the 3 patches and the request file as committed evidence, as instructed.
3. No `AskUserQuestion`; commit messages as proposed.
