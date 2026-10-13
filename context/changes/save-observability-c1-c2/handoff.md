# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by `impl` phase 4: the unavailable-save card (commit cadda19). e2e was NOT run here (Chromium MachPort), so it is the orchestrator's gate on cadda19.

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | phases 1-3 `fb2e7bb`, `11b492c`, `5b78176`; phase 4 `cadda19` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 20 (1.5, 3.5, 4.4-4.6 are reviewer/human/visual) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveFailedCard.ts` | `mountSaveFailedCard(parent, { copy: SaveCardCopy; onContinue; onExport? })`; export button only with `onExport` and `copy.export` |
| `src/data/pl.ts` | `pl.saveUnavailable` (title, body, continue, note), DESIGN-GAP 45 comment |
| `src/main.ts` | one card block for `unreadable` (pl.saveFailed + export) and `unavailable` (pl.saveUnavailable, no export); then fresh session, saver blocked as before |
| `plan.md` | rows 4.1-4.3 ticked, 3.4 cites the orchestrator run |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1172 passed (baseline 1172, +0) |
| lint, typecheck | clean / clean |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |
| Break: card only for `unreadable` (unavailable skips it) | unit stays 1172 green, as the plan expects; proof is e2e of phase 6 (`?e2eSave=unavailable`); restored via `git checkout -- src/main.ts` |
| Meta-check | the break changes a branch no unit test reaches (DOM + `start`), so green is expected; no e2e break patch written (phase 6 owns the spec) |

## 4. Next command

`/10x-implement save-observability-c1-c2 phase 5`

## 5. Open

- Rows 1.5, 3.5, 4.4 `[reviewer]`, 4.5 `[human]`, 4.6 `[visual]`. e2e on cadda19: orchestrator gate (rows 4.1, 4.3).
- Teacher read of `pl.saveUnavailable` is the plan's own text (title, body, continue, note); my read: calm, no blame, no jargon, short. Reviewer row 4.4 stays open.
- Note for impl-review: the `.catch` in `loadSave` is defensive (phase 2).

## 6. Autonomous decisions

- `SaveCardCopy.export` is optional and the button needs both `onExport` and `copy.export`, so `pl.saveUnavailable` has no export key. Reversal: none.
- `main.ts` uses one block for both kinds, `raw === null` selects copy and export. Reversal: split if the cards diverge.
- Strings taken verbatim from the plan; no wording change. Reversal: reviewer 4.4.
- Earlier phase decisions stand (timeout as a named Error, shared `timers`, `SALON_PLACEHOLDERS` shared).
