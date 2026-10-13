# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-plan-review` step of run `2026-10-13-s12-s14`. Verdict PROCEED: the plan (7 phases: tdd, tdd, tdd,
impl, impl, impl, e2e) was checked against the code and five warnings were fixed in `plan.md`; no product code changed.
The next agent must not get wrong: `Autosaver.replace` refuses a second call (`Busy`) and uses ONE `writesOff()`
predicate (`blockedBy !== null || replacing || replaced`) in `save`, `markDirty` and the `save` loop condition; on a
failed write it re-arms the debounce when `dirty` — never `block()`.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | 4 on the branch: `ca0c645` change identity, `23d8dcc` research, `631c767` plan, and `docs(save-export-import-reset): plan review` (this step) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`; was 42, +7.6 break p7e) |
| Working tree | clean after the commit (five paths staged explicitly) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-export-import-reset/reviews/plan-review.md` | Review report: 0 critical, 5 warnings (all fixed), 3 observations; ends with `VERDICT: PROCEED` |
| `context/changes/save-export-import-reset/plan.md` | Fixes: `replace` contract (`Busy`, `consecutiveFailures = 0`, re-arm on failure, `writesOff()`), phase-1 tests; `DIALOG_CALLBACKS` + `onClose`; export dialog takes `file: (now) => {text, fileName}` and `now` (scene never calls `Date`); phase 7 (b) builds a playable v1 file in the spec, files chosen via `filechooser`, new break p7e + Progress 7.6 (old 7.6 → 7.7); two Known risks (p7c invisible in browser, no reload after success) |
| `context/changes/save-export-import-reset/plan-brief.md` | Phase 7 row: 5 breaks |
| `context/changes/save-export-import-reset/change.md` | `status: plan_reviewed` |
| `context/changes/save-export-import-reset/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-export-import-reset` (observed) |
| `ls context/foundation/lessons.md` | absent — no lesson applies |
| Grounding (`ls`, `grep`) | 15/15 plan paths exist; symbols confirmed in code: `createAutosaver` (`block` one-way, no `replace`, loop checks only `blockedBy`), `freshSession` local in `src/main.ts`, `requestPersistence` drops `persist()`, `UIScene.openSettings` session + `saveHealthView(saver.status())`, `InputSession.run` sync, `DIALOG_CALLBACKS` counts 4/4, e2e hook `save()` spreads `saver.status()`, `?e2eSave=unreadable` → `version 99` (`future`), `FIRST_ROOM = 'salon'` vs fixture room `living` |
| `grep -c '^Driver: ' plan.md` | 7 (tdd ×3, impl ×3, e2e ×1 after the phase-6 seam sweep) |
| Success Criteria ↔ Progress | one-to-one per phase (P7 now 7 rows) |
| lint / typecheck / unit / build / e2e | not run: docs-only step. Baseline on main (contract, inherited, unverified): `lint OK; typecheck OK; unit OK Tests 1176 passed; build OK; e2e OK 33 passed` |

No deliberate break: nothing testable was written.

## 4. Next command

`/10x-tdd save-export-import-reset phase 1`

## 5. Open

- Human checklist (Progress `[human]` rows): 4.7 iPad share sheet → Files, Android PWA share/download; 5.6 file picker
  import on both tablets; 6.8 `.txt` with JSON content against FR-022's literal "plik JSON"; 6.9 acceptance of the new copy
  (`pl.saveTransfer`, `pl.saveFailed.detail`, `pl.settings.saveNotYet`/`saveEarlier`/`savePersist`); 6.10 `persist()` answer
  on both tablets.
- DESIGN-GAP rows to add in `docs/design-gaps.md`: 46–51 (phases 4–6), row 44 rewritten in phase 4.
- E2E: phases 4–7 need the orchestrator's Chromium (request-file protocol, `e2e-request-p<N>.md` + `git apply` break
  patches `e2e-break-p4.patch`, `e2e-break-p7a…p7e.patch` in the change dir). Phase 7 (b) must NOT import
  `tests/fixtures/save-v1.json` (format fixture: unknown room `living`, non-curriculum skill ids, `pendingUnlock`).
- Carried risks (plan `## Known risks`): second tab of one origin; reload may start a waiting newer build; p7c break likely
  green in the browser (proof of "no write after `replace`" lives in the phase-1 unit test of `createAutosaver`); a
  `reload()` that never runs leaves writes off for the session.
- Follow-ups to write in phase 6 (`follow-ups/review-fixes.md`): L-S1 (`src/core/save.ts` `decodeSave`), N-7
  (`src/core/autosave.ts` `loadSave`), F7 (`src/data/pl.ts` `settings.empty`), two tabs, full field path in `saveProblem`,
  import from the welcome screen — each with `Trigger:`.

## 6. Autonomous decisions

- **Verdict PROCEED, fixes applied in place** (contract: CRITICAL → fix, WARNING → fix if obvious). Rejected: RETHINK —
  the `replace` + reload approach matches the code (`block()` one-way, `pagehide`/`visibilitychange` flush in
  `src/main.ts` `start`). Would change: evidence that a reload in the iPad home-screen app loses state.
- **Code verification inline, no sub-agent** (skill step 3 suggests one). Why: the risky claims sit in six known files and
  were read directly. Would change: a plan touching unknown callers across modules.
- **F2: phase 7 (b) uses a spec-built playable v1 value**, not the format fixture. Rejected: fixing the fixture (frozen v1
  fixtures must not change). Would change: a shared "playable save" e2e fixture appearing in `tests/e2e/support/`.
- **F5: added break p7e and Progress 7.6** (renumbered 7.6 → 7.7). Why: FR-022's "summary before overwrite" had only a
  reviewer row. Would change: none.
- **F3/F8 as Known risks, not plan changes.** Why: making the saver dirty at import time in e2e has no deterministic hook;
  the unit test proves the rule. Would change: an e2e seam that marks the saver dirty.
- **F7 (`.txt` vs FR-022) not overturned** — justified, already `[human]` 6.8.
- **`change.md` status set by a direct edit**: `metadata-guard.mjs` has no `mark-plan-reviewed` command.
