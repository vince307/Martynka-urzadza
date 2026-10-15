# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-plan-review` step of run `2026-10-15-fix-s14c-s14d`. The plan is reviewed and fixed in place (verdict
PROCEED, `status: plan_reviewed`); nothing is implemented. The next agent must not miss the two save-safety additions the
review put into the plan. First, phase 1 §4 adds a retry guard in `src/storage/idb.ts` `run`, so a timed-out write never
retries after a newer one. Second, phase 4 §3 requires a single `settled` flag on the slow-read card, so a late read after
"Graj dalej" never changes `outcome` or the autosaver.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | 5 on the branch after this step: change identity, research, plan, handoff fix, `docs(save-v2-backup-health): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 40 (`grep -c '^- \[ \]' plan.md`), 0 done (was 39; +6.6 break p6e) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-v2-backup-health/reviews/plan-review.md` | Deep review, 2 CRITICAL (F1, F2), 3 WARNING (F3, F4, F5), 2 OBSERVATION; triage; `VERDICT: PROCEED` |
| `context/changes/save-v2-backup-health/plan.md` | Fixed in place. Details below the table. |
| `context/changes/save-v2-backup-health/plan-brief.md` | Phase table: phase 1 adds the idb retry guard; phase 6 has 5 tests |
| `context/changes/save-v2-backup-health/change.md` | `status: plan_reviewed` |
| `context/changes/save-v2-backup-health/handoff.md` | This file |

Changes to `plan.md`:
- **Critical Implementation Details**: new bullet on the late retry (F1).
- **Phase 1**: new §4 `idb.ts` `run(op, mayRetry)` with a write sequence counter and a red-first test in `tests/idbStore.test.ts`. The file lists gain `tests/saveFile.test.ts` and the second `createAutosaver` call in `tests/autosave.test.ts` (F3). Row 1.2 gains a break, and row 1.5 no longer says "idb.ts nietknięty".
- **Phase 3**: file list gains `tests/saveTransferCopy.test.ts` (F3).
- **Phase 4 §3**: the `settled` rule (F2); row 4.5 extended.
- **Phase 5 §4**: visual-gate O1, O2 and O4 deferred with new triggers (F4).
- **Phase 6**: test (e), patch p6e, row 6.6 (old 6.6 is now 6.7), e2e delta +5.
- **Known risks**: dialog busy up to ~20 s, the `hidden` exception, phase 4 size.

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-v2-backup-health` |
| Success Criteria ↔ Progress mapping (python script over `plan.md`, after the edits) | phases 1–6: automated 4/4, 4/4, 3/3, 4/4, 5/5, 7/7; manual 2/2, 3/3, 2/2, 4/4, 2/2, 0/0 |
| Every phase body has a correct `Driver:` line | yes: 1–3 `tdd`, 4–5 `impl`, 6 `e2e` (after the seam sweep in phase 5); the new spec is added to `ROUND_SPEC` in phase 6 |
| Code claims checked against code (subagent + direct reads) | `MIGRATIONS[1]` spread + `validateSave` (v2 ⊇ v1); `start` order load → card → `createGame` → `createAutosaver`; idb-keyval `createStore`/`set` ordering; `run` retry in `idb.ts`; `createAutosaver` call sites; `ROUND_SPEC` regex; dialogs' `onEscape` ignores `busy` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `16848c6`: unit 2445, e2e 77 — inherited from the run contract, unverified here) |

## 4. Next command

`/10x-tdd save-v2-backup-health` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` rows: 2.5 (v2 written without the v1 copy after 3 failed copies or at `hidden` — beyond PRD FR-021; also
  covers review F5), 2.6 (`replace` takes the pending copy once — reverses minigame-daily-puzzle "bypass by design"),
  4.7 (no `localStorage` start counter), 4.8 (N-7 iPad measurement).
- `[reviewer]`/`[visual]` rows per phase. Reviewer 1.5 now checks only the `write` retry guard in
  `src/storage/idb.ts` `createIdbSaveStore`; reviewer 4.5 checks the `settled` flag in `src/main.ts` `start`.
- DESIGN-GAP rows to add: 94–97.
- E2E: phases 4 (two changed specs) and 6 (new `tests/e2e/save-backup-health.spec.ts`, 5 tests, `ROUND_SPEC`) use the
  request-file protocol; phase 6 has break patches p6a–p6e.
- Follow-ups to file in phase 5 (`follow-ups/review-fixes.md`): the list in plan phase 5 §4, including visual-gate O1/O2
  and O4 from review F4.

## 6. Autonomous decisions

- **Triage done without AskUserQuestion** (run contract rule 1). CRITICAL → fixed in `plan.md`; WARNING → fixed (F3, F4)
  or `## Known risks` (F5); observations recorded. Would change: a human in the loop.
- **F1 fix in `idb.ts` (write sequence guard) instead of `abort` or a core-side generation.** Rejected `abort` because
  idb-keyval gives no handle. Rejected a core generation because core cannot stop a retry inside the adapter. Why: smallest
  change that keeps newest-last, inside the only IndexedDB module. Would change: evidence that iPadOS hangs never abort late,
  or a store adapter without a reconnect retry.
- **F2: "Graj dalej" stays enabled while waiting (first event wins, late read dropped)** instead of disabling it. Why: a
  parent must never be stuck behind a hung read, and dropping the late read never writes over the slow save. Would change:
  the maintainer wanting the late read to resume the game in place, which would need the autosaver unblocked safely.
- **Not overturned: option A, SRR-04, no start counter** — each is grounded in the PRD guardrail and verified code
  (v2 ⊇ v1), and each is already a `[human]` row. Would change: a v1 field that `MIGRATIONS[1]` drops.
- **Phase 4 not split** (review O1): a core-only `waitLonger` phase would have no consumer. Would change: the phase 4 agent
  reaching the context limit.
