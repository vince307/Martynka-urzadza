# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-research` step of run `2026-10-14-save-s13b-s15-s14b` wrote this file. `research.md` answers every unknown in `change.md`, and `change.md` is now `preparing`. No product code changed.

Two things the next agent must not get wrong:
- The save format stays v1. The `future` gate is `reason === 'future'`, never a version number.
- `?e2eSave=unreadable` is a `future` save (v99). SIR-01 therefore breaks `save-transfer-blocked.spec.ts` "#2 an unreadable save warns…", which must move to a new `?e2eSave=corrupt` seam.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 2 (`docs(save-reason-and-recovery): change identity (autonomous run)`, `docs(save-reason-and-recovery): research`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-reason-and-recovery/research.md` | Source-backed findings for SIR-01..04 and ASL-01, plus:<br>- the PRD silences and recommendations<br>- browser storage facts<br>- the e2e dependency map for `?e2eSave=`<br>- the options table for the SIR-02 mechanism |
| `context/changes/save-reason-and-recovery/change.md` | `status: new → preparing`, `updated` (metadata-guard only) |
| `context/changes/save-reason-and-recovery/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-reason-and-recovery` |
| Code reading (symbols listed in research.md "Code References") | Audit claims re-confirmed at `ef8f950`. New facts: the `unavailable` seam store accepts writes; `parseImport` ignores unknown envelope keys; the C-1 e2e test uses `getByText` (substring). |
| `metadata-guard.mjs mark-researched` | `changed: true` |
| lint / typecheck / tests / build / e2e | Not run. This was a docs-only research step and no source changed. The baseline in the contract is inherited and unverified. |

## 4. Next command

/10x-plan save-reason-and-recovery

## 5. Open

- Recommendations for the plan (research.md, Summary):
  - **SIR-01:** add a runtime `loadReason` in `AutosaverOptions`/`AutosaveStatus` (`src/core/autosave.ts`). Add `'future'` to `DeviceSaveView.blocked.cause` (`src/core/saveFile.ts` `deviceSaveView`). `Autosaver.replace` refuses on `future`. Give the dialogs a text per cause.
  - **SIR-02:** use option A, a second confirmation that calls `replace` with `force`. It is refused for `future` and for `timeout`. Add the site-data advice text.
  - **SIR-03:** `stateOf` carries the error, `saveOff` gets a `timeout` text, and the `unavailable` card gets `detail`.
  - **SIR-04:** add a warning line in `openSaveExportDialog` and wire it from `UIScene.openExport`.
  - **ASL-01:** add an AST test of `TaskScene.freshRound`, modelled on `tests/deviceSaveWiring.test.ts`.
- E2E impact:
  - `tests/e2e/save-transfer-blocked.spec.ts` has two tests that change: the unreadable test moves to `corrupt`, and the unavailable test is affected by SIR-02 A.
  - `tests/e2e/save-restart.spec.ts` "#2 FR-021" must keep the `Kod: future` detail and the raw export for `future`.
  - "#2 M-S4" should assert the new `timeout` text.
  - The new seam `corrupt` needs:
    - `E2ESaveSeam` and `e2eSaveStore` in `src/testing/e2eHook.ts`;
    - updates to `tests/e2eSave.test.ts` and to the `tests/e2eHookGuard.test.ts` `it.each`;
    - no new guard marker.
- `[human]` rows the plan should add:
  - the SIR-01 refusal, decided where the PRD is silent;
  - the SIR-02 forced overwrite of an unread save, next to the earlier 6.7 decision "wbrew literze FR-022";
  - the N-7 iPad measurement of a cold IDB `timeout`.
- New copy goes in `src/data/pl.ts`, with DESIGN-GAP rows starting at 69 in `docs/design-gaps.md`. The copy covers:
  - the `future` line;
  - the per-cause blocked texts;
  - the `timeout` texts;
  - the export warning;
  - the confirm-anyway button;
  - the site-data advice.
- Follow-ups to write in the plan (triggers per change.md): S12-02, S12-05, S12-06, S12-13, S12-07..09/12/14/15, ASL-02..09, and SIR-05..07 unless taken cheaply. Each needs a concrete new trigger (SIR-07).
- Unverified browser facts affect the wording of the site-data advice only. See research.md "Open Questions".

## 6. Autonomous decisions

1. **SIR-01: refuse, not allow-with-text.**
   - Rejected: a warning that still allows the overwrite.
   - Why: the save is healthy and readable by a newer build. The PRD guardrail and FR-021 favour keeping it, and FR-022 is silent.
   - What would change it: a maintainer decision that a parent may knowingly discard a newer save. Then a `force` path would also cover `future`.
2. **SIR-02: a second confirmation in the dialog, plus the site-data advice. No counter across starts.**
   - Rejected: a counter in `localStorage`, because Safari private mode keeps it only for the session and nothing documents it surviving a broken IndexedDB. Also rejected: an in-app `deleteDatabase`, because it can throw `UnknownError` itself.
   - What would change it: an iPad measurement (N-7) showing that a permanent `timeout` is common. Then a counter or a second read becomes necessary.
3. **ASL-01: an AST source test, not e2e.**
   - Rejected: an e2e spec using `?e2eArt=missing` without `e2eSkills`, because it is probabilistic and needs new hook exposure.
   - What would change it: `freshRound` logic moving into `core`, where a direct unit test becomes possible.
4. **Research done with two read-only workers**, one on the e2e seam map and one on the PRD and web storage facts. The code reading was done here.
   - What would change it: nothing.
