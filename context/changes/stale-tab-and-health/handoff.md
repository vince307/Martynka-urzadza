# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-plan-review` step of run `2026-10-16-fix-stale-tab-health`. Verdict PROCEED: the v4 `generation`/`writer` compare-and-set holds on every single-tab path checked against the code; four warnings were fixed in `plan.md` (phases 2, 3, 5, 11, 12) and three observations recorded. The next agent must not get wrong: the store's default `writer` is a fresh random id per `createIdbSaveStore` call (never a shared constant), and `onBlocked` is called only from `attempt`, wrapped in `try`/`catch`.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | 4 on this branch: change identity, research, plan, `docs(stale-tab-and-health): plan review` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 57 (`grep -c '^- \[ \]' plan.md`; no rows added or renamed) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/reviews/plan-review.md` | review report: B-1 special check, findings F1-F7 with decisions, drivers, verdict |
| `context/changes/stale-tab-and-health/plan.md` | triage edits: phase 2 `IdbSaveStoreOptions.writer` default; phase 3 `onBlocked` guarded, attempt-only; phase 5 active worker keeps `ready`; phase 11 "finishes a round" + `bringToFront`; phase 12 (b) under `serviceWorkers: 'block'`; Known risks F4/F5/F6 |
| `context/changes/stale-tab-and-health/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/stale-tab-and-health` |
| Code reads (claims checked) | `guardedPut`/`createIdbSaveStore` (`src/storage/idb.ts`), `attempt`/`replace`/`replaceGate`/`loadSave` (`src/core/autosave.ts`: one `store.read()` per page), `e2eSaveStore` (`src/testing/e2eHook.ts`), `SAVE_KEYS` + autosaver wiring (`src/main.ts`, `src/data/layout.ts`), `registerServiceWorker`, `ROUND_SPEC`, `serviceWorkers: 'block'` in routing specs, `writtenVersion` 3 in exactly the four named specs, no console-warning assertions in `tests/e2e` |
| Plan structure | 12 `## Phase N` ↔ 12 `### Phase N`; every phase keeps `Driver:` + `Driver why:`; edits left Progress rows unchanged |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main 9a64fd6 per contract: unit 3076, e2e 121 — inherited, unverified) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-tdd stale-tab-and-health phase 1`

## 5. Open

- **[human] rows**: 10.6 accept or reverse save format v4; 11.4 iPad: the restart card reads calmly and brings back the newest stars.
- **[visual] row**: 12.4 settings panel at 1440 and 1024 in every new state plus the child card.
- **[reviewer] (CI at ship)** 10.7: CI `check` log regex `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed`.
- **Known risks added by the review** (plan `## Known risks`): reload race (old document's late write → card on a legitimate reload, no loss; watch the e2e `+ 0` gate from phase 2 on); stale-window `replace` summary; `register-failed` + `console.warn` in specs that block workers.
- **DESIGN-GAPs to add** in the phases: 116 `otherTab` line (p3), 117 child card (p4), 118 offline section (p6), 119 UI-art line (p7), 120 music status (p8), 121 prefs not kept (p9).
- **E2E phases 11-12** use the request-file protocol (profile § 8): patches `e2e-break-p11a/p11b/p12a/p12b.patch`; p11a is written in phase 4, p12a in phase 6.
- **Follow-ups** to write in phase 10 (`context/changes/stale-tab-and-health/follow-ups/review-fixes.md`): list in plan phase 10 § 2.
- **Phase 1 watch**: four e2e specs assert `writtenVersion` 3 (`salon-load-health`, `save-backup-health`, `salon-art`, `save-migration`). Phase 4: `load-and-tab-guard.spec.ts` (`?e2eSave=newer`) now meets the child card.

## 6. Autonomous decisions

- **Review run without a sub-agent** (the skill's Step 3 suggests one): the risky claims were few and in five files; direct reads gave file-level evidence. Would change: a plan touching many modules.
- **Triage done in place, no AskUserQuestion** (contract rule 1): every warning had one obvious fix → applied (F1, F2, F3, F5, F7); F4 and F6 accepted as Known risks. Would change: a fix needing a product choice (none did).
- **F4 reload race accepted, not engineered away**: no way to tell a dead document's late write from another tab's without a browser API the plan defers (Web Locks); no data loss. Would change: phase-2+ e2e flakes showing the card after `page.reload`.
- **Drivers unchanged**: phases 6 and 9 keep `impl` though they add small pure helpers with red-first tests — the phase body is DOM glue. Would change: a phase agent finding the pure part dominant (then `impl → tdd` noted in the plan).
- **12 phases kept** (merging 8+9 rejected: different sound-section files, each small). Would change: a phase agent hitting context limits.
- **Orchestrator decisions not re-opened**: v4 ships (Step 0), docs-only `deploy/README.md` note.
