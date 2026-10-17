<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Save truth — what the parent is told about save, import/reset and a stale tab

- **Plan**: context/changes/save-truth/plan.md
- **Mode**: Deep (code claims checked inline by the reviewer against `feat/save-truth` at `31fd82d`; no sub-agent)
- **Date**: 2026-10-16
- **Verdict**: REVISE before triage → SOUND after the fixes applied to plan.md
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | WARNING (F2) |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F3) |
| Blind Spots | FAIL → fixed (F1) |
| Plan Completeness | PASS (F5 observation) |

## Grounding

Grounding: 8/8 paths ✓ (`tests/idbStore.test.ts`, `saveV4.test.ts`, `deviceSaveWiring.test.ts`, `saveTransferCopy.test.ts`,
`saveKeys.test.ts`, `e2eSave.test.ts`, `freshRoundWiring.test.ts`, `tests/e2e/stale-tab.spec.ts`; e2e specs `health-lines`,
`parent-settings`, `room-*`, `load-and-tab-guard`, `save-migration` present), 9/9 symbols ✓ (`writeVerdict`,
`OTHER_WRITER_SAVE`, `NEWER_SAVE`, `replaceGate`, `attempt` hidden/`giveUpCopy` branch, `replace` copy branch,
`skipBackup`, `E2E_SAVE_SEAMS` incl. `corrupt` as a v1 shape, `deviceStorage` in `soundPrefs.ts`), all five named
reversed unit/e2e test titles exist verbatim, Progress↔Phase 15/15 (criteria and rows match per phase, 82 rows),
brief↔plan ✓, `Driver:` lines 15/15.

Save-format check: no phase changes the stored record or its meaning — `writer`/`generation` stamping unchanged,
`SAVE_VERSION` 4, fixtures v1–v4 untouched (one new frozen fixture), every new piece of state (`backup-status`,
`martynka:unavailableStarts`, `martynka:writer`, channel message, runtime status fields) is outside the save.

Driver check: tdd for 1–8, 11, 12 (new pure rules/verdicts, failing tests can lead), impl for 9, 10, 13 (glue, copy,
docs), e2e 14–15 after the seam sweep (13), each on features built earlier (14 ← 7, 8; 15 ← 9, 13). All correct.

Follow-ups with a fired trigger (change.md table): all in or justified; "Impl-review F3/F4 replace copy" was
conditional and is now explicitly in (F2); missing carried entries added to phase 13 (F5).

Product decisions vs `Martynka-urzadza.md` § 8 / FR-021: the two reversals (write-once first copy, SRR-08 first start)
carry `[human]` rows 4.6 and 3.8; none is clearly wrong, none overturned.

## Findings

### F1 — T-3 "ended writer → put" silently drops the previous page's last write

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 7 § Verdicts (and Phase 8 `channelVerdict`, decision 10)
- **Detail**: `writeVerdict` (`src/core/save.ts`) refuses only when `generation > page.base && writer !== page.writer`;
  with `generation <= base` it already puts. So the ended-writer exception the plan adds matters ONLY when the previous
  page's late write landed after this page loaded — a record this page never read. Turning that into a put makes the
  new page overwrite the child's last flushed progress (pagehide flush, last debounced change) without any sign. Today
  the same race refuses, the calm card reloads, and the latest save is read: "Nic nie przepada" (audit 2026-10-16_1419
  T-3, whose fix direction is to distinguish it *in the log*). The plan's fix trades a cosmetic mislabel for a real
  progress loss path.
- **Fix**: keep the refusal for an ended writer with `generation > base` but name it `PREVIOUS_PAGE_SAVE`
  (`'PreviousPageSave'`), mapped to `blockedBy 'otherTab'` with a log naming the previous page and the code on the card;
  `channelVerdict` drops its ended-writer exception (stale exactly when `writeVerdict` would refuse); `onBlocked` gets
  the error name for the card's `Kod:` line.
- **Decision**: FIXED in plan.md (Desired End State, Phase 7 §2/§4/deliberate break, Progress 7.2, Phase 8 §2/§3/§4,
  decision 10).

### F2 — "copy lost" is recorded only at the cap, which a tablet session may never reach

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Phase 4 §2, Phase 5 §1, Phase 6 §2, Known risks
- **Detail**: Phase 5 writes `noteBackup(lost|uncertain)` only when `backupFails` reaches `backupAttempts`. The SVB-01
  case is a hidden flush (often the page's last act on a tablet) writing v4 with the copy owed; `migrated.raw` then dies
  with the page, the cap is never reached, and the next launch has no record — exactly the "line needs `migratedFrom`
  (gone next launch)" problem SVB-01 reports. Known risks claimed "now recorded as `lost`", which the phases did not
  deliver. Also: `backup`'s `'kept'` branch wrote no record (copies from older builds stay unnamed), `replace`'s
  give-up branch had no record, and "record first, then session status" would show a stale `lost` during a session that
  is still retrying.
- **Fix**: before the first write that leaves the copy owed (hidden, cap, `replace` give-up), note `lost`/`uncertain`
  once, time-limited and never blocking; a later copy overwrites with `kept`; the `'kept'` branch writes the record;
  `migrationOf` uses the live status in the migrating session and the record on later launches.
- **Decision**: FIXED in plan.md (Phase 4 §2 and §4, Phase 5 §1 new paragraph and §3 tests, Phase 6 §2, Known risks).

### F3 — Phase 9 reads backups through a store the registry does not hold

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 9 §1
- **Detail**: "through the registry's saver/store accessor" — `src/main.ts` sets only `REGISTRY_KEYS.saver` (the
  `Autosaver`); `UIScene` has no store. An implementer would add a registry key or pass the store around.
- **Fix**: a pass-through `Autosaver.readBackups()` in `src/core/autosave.ts`; no new registry key.
- **Decision**: FIXED in plan.md (Phase 9 §1).

### F4 — Record and copy in one transaction: a record failure aborts the copy

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 §2, Critical Implementation Details "Backups are never lost"
- **Detail**: "a failure to write [the record] never blocks a save write" holds for the best-effort `lost`/`uncertain`
  notes, but the `kept` record shares the copy's transaction, so its failure aborts the copy. Bounded by the copy retry
  and `writeTimeoutMs`; no progress at risk.
- **Fix**: recorded under Known risks.
- **Decision**: ACCEPTED (Known risks).

### F5 — Phase 13 follow-up list missed four carried items

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 13 §4
- **Detail**: SV2-08/M-S1 (in "What we're NOT doing"), Escape during `replace` (no import-dialog e2e is added), the
  `isRecord` watch, and T-1 prevention were not in the follow-ups list, so later slices grepping `Trigger:` would miss
  them.
- **Fix**: added to the phase 13 list.
- **Decision**: FIXED in plan.md.

### F6 — T-1 detection still lets this page overwrite an older build's newer write

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 §2, decision 11
- **Detail**: `olderWriter` is a put with a flag; the older tab's v3 progress written after this page's base is still
  overwritten. Pre-existing (today identical, silently), and detection-only is fixed by change.md decision 4 / the step
  prompt — not introduced by this plan.
- **Fix**: named in Known risks and carried as a follow-up (phase 13).
- **Decision**: ACCEPTED (Known risks + follow-up).

## Triage (autonomous, no human in the loop)

| | findings |
|---|---|
| Fixed | F1, F2, F3, F5 |
| Accepted (Known risks) | F4, F6 |
| Skipped / dismissed | none |

Verdict after fixes: REVISE → SOUND. The approach (pure rules in `src/core`, storage outside the save record, one gate,
one write verdict) is right; the one data-loss path found was a local rule choice, now reversed.

VERDICT: PROCEED — approach sound and save format v4 untouched; the one progress-loss path (T-3 ended-writer put, F1) and the across-launch backup-record gap (F2) are fixed in plan.md, drivers verified, phase 1 is `tdd`.
