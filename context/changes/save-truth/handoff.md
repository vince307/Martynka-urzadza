# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-plan` step. `plan.md` has 15 phases: 13 code phases (`tdd` 1–8, 11, 12; `impl` 9, 10, 13) and 2
`e2e` phases (14, 15), with a `## Progress` of 82 rows. The next agent must not get two things wrong. First, the save
format stays v4: every new piece of state sits outside the save record, and no phase may overwrite or delete a
`backup-v<N>` key. Second, the plan names its deliberately reversed tests phase by phase; any other red test is a
regression.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` (checked: `git branch --show-current`) |
| Commits | 3 on the branch: `docs(save-truth): change identity (autonomous run)`, `docs(save-truth): research`, `docs(save-truth): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 82 (`grep -c '^- \[ \]' plan.md`): 53 automated, 14 `[reviewer]`, 10 `[visual]`, 5 `[human]` |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/plan.md` | the full plan: 15 phases, each with a `Driver:` and a `Driver why:` line, a deliberate break and the local gate; Known risks; 17 autonomous decisions; Progress |
| `context/changes/save-truth/plan-brief.md` | two-page brief: key decisions, phases at a glance |
| `context/changes/save-truth/change.md` | frontmatter only: `status: preparing → planned` |
| `context/changes/save-truth/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/save-truth` |
| `grep -c '^Driver: '` / `'^Driver why: '` on `plan.md` | 15 / 15 (`tdd` ×10, `impl` ×3, `e2e` ×2) |
| a script mapping Success Criteria to Progress, phase by phase | 15 of 15 OK (each phase's automated and manual counts match one to one) |
| `metadata-guard.mjs inspect` then `mark-planned` | `{"changed":true}`; `change.md` is now `status: planned` |
| `grep -c save-truth context/foundation/roadmap.md` | 0: non-roadmap change, no status edit |
| code anchors re-read at `d7b4e1e` | match research: `replaceGate`, `deviceSaveView`, `cardCopyFor`, `writeVerdict`, `createIdbSaveStore` `writer` option, `e2eSaveStore` seams (the `corrupt` seam holds a v1 shape), `E2E_HOOK_MARKERS` `e2eSave`, the spec titles named in the plan; `docs/design-gaps.md` ends at 125 |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed. Baseline inherited, unverified: unit 3416 passed, e2e 127 passed |

## 4. Next command

`/10x-plan-review save-truth`

## 5. Open

- **Deliberate reversals the plan names** (any other red is a regression):
  - phase 2: `tests/autosave.test.ts` "a %s save is still replaced (the way out)" and `tests/saveFile.test.ts` "an unreadable (%s) save is named, never summarised (overwriting stays allowed)";
  - phase 3: `tests/e2e/save-transfer-blocked.spec.ts` "#2 an unavailable save is not overwritten…" (first-start line) and "#2 SIR-02 a save the browser never gives can be replaced after a second confirmation" (two loads);
  - phase 5: `tests/autosave.test.ts` "after a failed copy the page-hide flush writes v2 without trying the copy again" and "the third failed copy in a session … (SV2-01)", plus `save-backup-health.spec.ts` "#2 SV2-01 …" only if it asserts the op order;
  - phase 10: `save-restart.spec.ts` and `save-transfer.spec.ts` assertions on `exportOutcome.downloaded`;
  - phase 11: `save-backup-health.spec.ts` "#2 SV2-02 …" (`resetFailed` → `replaceUnconfirmed`).
- **Seam change in phase 1.** The `corrupt` seam in `src/testing/e2eHook.ts` `e2eSaveStore` becomes a v4-shaped corrupt save, so specs keep the meaning "corrupt in its own version".
- **New seam in phase 13.** `slowfail` goes into `E2E_SAVE_SEAMS`. The `e2eSave` marker already covers it, and the build guard must still report it absent from `dist/`.
- **DESIGN-GAP rows 126–138**, numbered in phase order (plan decision 14).
- **`[human]` rows** form the post-run checklist:
  - 3.8: SRR-08 force from the second start, and the wording of gap 126;
  - 4.6: write-once keeps the FIRST old copy, which reverses `stale-tab-and-health`;
  - 11.6: wording of gaps 127–136;
  - 14.4: two tabs on a tablet;
  - 15.4: the old-copy file on a tablet.
- **Follow-ups.** Phase 13 writes `follow-ups/review-fixes.md`, with a `Trigger:` line for each deferred or carried item listed in phase 13 § Docs and follow-ups.
- **Unverified platform facts**, all feature-detected or best-effort:
  - BroadcastChannel inside an iPadOS home-screen app;
  - the Safari version that `IDBObjectStore.count` needs.

## 6. Autonomous decisions

1. **The plan has 15 phases, not research's 9.** The step prompt caps a phase at about 2 new UI components and asks for small phases. Phases 9–11 split the UI work, and the stale-tab rule (8) is apart from writer identity (7). Would change: plan review asking to merge phases.
2. **The `corrupt` e2e seam becomes a v4-shaped save.** Rejected: reversing three specs so they expect the migration card. Why: the existing specs mean "corrupt in its own version", and migrated corrupt is proven by unit tests. Would change: a need to prove migrated corrupt in a browser.
3. **SRR-01: a migrated-corrupt save is treated like `migration-failed`.** This includes a save that was already bad in an older version, because the two cases cannot be told apart. Would change: a reason-only consumer.
4. **The open questions from research are taken as recommended:**
   - Q1: the first-start line promises nothing (gap 126);
   - Q2: `unknown-room` is log-only;
   - Q3: the card reuses `saveMigrationFailed`;
   - Q4: the retry cap is `backupAttempts + 1`;
   - Q5: the SRR-08 e2e uses two loads, with no new seam.
   The reasons and what would change each answer are in plan § Autonomous decisions.
5. **Decisions against design-doc text: none.** `Martynka-urzadza.md` § 8 and PRD FR-020..022 are silent on every choice here, and FR-021 is followed. The two reversals of earlier change decisions have `[human]` rows anyway: write-once (4.6) and the SRR-08 first start (3.8).
6. **A `[reviewer] (CI at ship)` row** cites CI run 38966095199, job 117192831932 (`Tests  3416 passed (3416)`, `e2e hook: absent (2 chunks checked)`). That log is recorded in the archived child-flow-guards plan; this step did not re-read the log.
7. **The skill's interactive steps were decided in place, unattended:**
   - the complexity confirmation, taken as HIGH;
   - the question rounds, answered from research;
   - the phase approval;
   - the clipboard hand-off, which was skipped.
