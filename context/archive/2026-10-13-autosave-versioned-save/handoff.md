# Handoff — `autosave-versioned-save` (slice S-11)

Written by the visual-gate step of run 2026-10-13-s09-s11; final pre-merge state written by the ship step (archive + ship). Visual gate is done: VISUAL: PASS, plan row 5.6 ticked, and no production code changed in this step. The full e2e ran green on `9be4701`, which is the final code commit. Do not edit `tests/fixtures/save-v1*.json` (they are frozen).

## 1. State

| | |
|---|---|
| Branch | `feat/autosave-versioned-save`, cut from `main` at `f67b9f4` |
| Commits | p1-p7 (`7cf32a4` .. `a403b21`), fix `b59e247`, review `9be4701`, visual gate `dacc1e5`, archive `docs(autosave-versioned-save): archiwizacja` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-13-s09-s11/run-log.md |
| `change.md` status | `archived` (folder moved to `context/archive/2026-10-13-autosave-versioned-save/`) |
| `## Progress` rows remaining | 7, all [human]: 4.6, 5.7, 5.8, 6.6, 6.7, 6.8, 6.9 (5.6 [visual] ticked in this step) |
| Roadmap | S-11 `done` (At a glance, item, `## Done`); Backlog Handoff: S-11 Done, S-12 ready for `/10x-plan` |
| Working tree | clean after the commit; `dist-e2e/` (gitignored) left by the build |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/autosave-versioned-save/reviews/visual-review.md` | states, the hand-checked balance, the card text read, observations O1-O2, the VISUAL line |
| `context/changes/autosave-versioned-save/screenshots/` | 18 PNGs (9 states × desktop 1440×900 / tablet 1024×768) plus `README.md` (table, how each state was reached) |
| `context/changes/autosave-versioned-save/plan.md` | row 5.6 ticked |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| throwaway Playwright spec (hook build on 4399, `tests/e2e/visual.local/`, moved to the session scratchpad afterwards) | 4 + 2 passed; frames written |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 1142 passed = baseline 1079 + 63 (slice); this step +0 |
| deploy + ops tests, `sample` E1..E6 | OK, `Naruszenia: 0` ×6 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (one plain command, this session, on `9be4701`) | 29 passed = baseline 26 + 3; Chromium launched |
| Hand-checked number | balance 20 (seam) − 0 (retype) − 5 (floor) = 15 before the reload; 15 after it (`load: loaded`; the seam's 20 ignored) |
| Servers | 4399 stopped; 4397/4398 not listening after the suite |

## 4. Next command

none — shipped

## 5. Open

- Human checklist: 4.6 iPad/Android restart, kill and silent update keep state; 5.7 export on the iPad home-screen app and on Android (`src/ui/dom/saveExport.ts` `exportRawSave`); 5.8 `?e2eSave` seam; 6.6 v1 format deviates from plan §5 and has to be accepted before the first deploy; 6.7 card gating; 6.8 two-build e2e deferred to v2; 6.9 `pl.errorCard.body` left unchanged.
- Visual observations (not fixed; recorded in visual-review): O1 focus is not returned to a card button after the export gate closes (touch-only, so nothing changes for users); O2 DOM overlays use the system sans-serif, as all of them already did.
- Follow-ups: `follow-ups/review-fixes.md` (v2 migration, two builds, two instances, S-12 export/import, F3-F5).
- DESIGN-GAP rows 42-44.

## 6. Autonomous decisions

- Playwright fallback instead of Claude in Chrome. The states need the e2e-only seam of the hook build, a reload inside one context, and a 2 s hold on the gear, and profile § 8 says the extension cannot drive the long press. This is the same method as the S-10 gate. Would change: an extension that can drive holds.
- Stage shown through the parent settings panel (2 s hold, then the gate, then "Anuluj"), because the canvas does not show the stage. Rejected: relying only on the hook value. Would change: a visible stage indicator on screen.
- O1 and O2 recorded, not fixed. Neither is a discrepancy against the plan, and fixing O1 would change production code after a green e2e for a keyboard-only path on a touch device. Would change: the maintainer wanting keyboard support for the card.
- No action on "Krok 8 z 8" for E3 in October. It is the S-07 rule D (age 10 places on E6, so an earlier stage opens fully) and it is the same before and after the reload.
