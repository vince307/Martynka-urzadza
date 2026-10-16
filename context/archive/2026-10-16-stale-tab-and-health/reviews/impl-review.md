<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Stale-tab save guard, UI art health, music status and service-worker install signal

- **Plan**: context/changes/stale-tab-and-health/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- **Date**: 2026-10-16
- **Verdict**: APPROVED (after one cheap fix)
- **Findings**: 0 critical, 1 warning (fixed), 4 observations
- **Reviewer**: autonomous run 2026-10-16-fix-stale-tab-health, impl-review step; diff `9a64fd6..10de24c` read directly (no sub-agent: the change is 62 files, the source part about 700 lines, all read in this session). No lessons file exists.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites re-run in this step (not inherited)

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` (on 10de24c) | 3138 passed = main baseline 3076 + 62 |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1`..`E6` | OK (exit 0, no violations) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` (sandbox disabled, from this session, on 10de24c + the F1 test file only) | 125 passed (10.9 min) = main baseline 121 + 4 (stale-tab 2, health-lines 2); ports 4397/4398 free afterwards |
| `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` | PASS (430 paths, 0 missing) |
| after the F1 fix: lint, typecheck, `npm test` | lint OK, typecheck OK, unit 3139 passed = 3076 + 63 (+1 the F1 test), build `e2e hook: absent (2 chunks checked)`; e2e not re-run after the fix (it adds a unit test only, no source change) |

## Deliberate breaks re-executed in this step

1. **tdd phase 1 RED** — `writeVerdict` with the `writer !== page.writer` condition removed (`src/core/save.ts`): red `tests/saveV4.test.ts` "puts after its own write that is ahead" and the new `tests/idbStore.test.ts` "an own write that lands after a later own write started …" (2 failed / 46); restored from a copy, `git diff` clean. Meta-check: the existing store test "own writes in a row climb 1, 2" stayed GREEN under this break (its `base` moves between the awaited writes), which is what F1 is about.
2. **e2e phase 11 break p11b** — `git apply e2e-break-p11b.patch` (`writeVerdict` never refuses `OtherWriterSave`), `npx playwright test tests/e2e/stale-tab.spec.ts` from this session: BOTH red — (a) `expect.poll(... save?.blockedBy).toBe('otherTab')` received `null`, (b) the same assertion on the second window; `git apply -R`, `git diff --stat -- src` empty. Meta-check: the break removes only the data rule and both specs fail on the rule's own outcome (`blockedBy`), so they prove the guard in a real browser with two pages sharing one IndexedDB, not the card wiring (p11a covers that).

## Save format v4 checks (accepted by the maintainer, row 10.6)

- Every frozen fixture migrates to v4 on populated data: `tests/saveV4.test.ts` (`it.each` over `save-v1.json`, `save-v2.json`, `save-v2-legacy-salon.json`, `save-v3.json` → `ok`, `migratedFrom` = own version; v3 stars/rooms/learner literals) plus the older populated oracles in `tests/save.test.ts` (v1 session `toEqual`, v2 "encodes as the same save at version 4", legacy salon 4-task salon and 3 stars) and `tests/legacySalonMigration.test.ts`. `git diff --stat 9a64fd6..HEAD -- tests/fixtures` = `save-v4.json` only.
- A legitimate single tab never refuses itself: reload (one `store.read()` per page load in `loadSave`, `waitLonger` reuses the same read; `createIdbSaveStore` is called once in `main.ts` `start`, writer = `randomWriter()` per store, so one per page load and different between tabs, test "a store without an explicit writer gets its own random id"); import/reset (`Autosaver.replace` → `store.write(state, 'replace')`, generation check skipped, version check kept); migration write (a v3 record has no `generation` → 0, not above `base` 0); backup copy (`backup` is a plain `set` on `:backup-v<from>`, never through `guardedPut`); a timed-out own write that lands later (stored `writer` is mine → put; now proven at the store level by the F1 test, two overlapping writes with `base` still 0).
- A v3 build meeting v4: at start `decodeSave` → `future` (version above `SAVE_VERSION`, tested with `SAVE_VERSION + 1`); already running → its own `storedVersionNewer` → `NewerSave` (store test "an old build (version below the stored one) is refused NewerSave and the record is unchanged").
- `backup-v3` policy: the autosaver keys the copy by `migrated.from` with the same `backupAttempts` code path as v1/v2 (unchanged code); `tests/idbStore.test.ts` "a v3 copy goes to backup-v3"; `balance.save` comment updated.
- Writer id in logs: `src/storage/idb.ts` logs only `persist()` error names; the refusal error message is a fixed sentence; `autosave` logs the error object (name + fixed message). The id is never logged (OBSERVATION F4 for the raw export).

## Phase-4 decision (card on `newer` AND `otherTab`, holds the input switch)

Judged against PRD FR-003 (silent update, no prompt) and FR-020 (state identical after reopening): the card is not an update prompt, it appears only after a write was refused, and its one action (reload) is what makes FR-020 true again — the reload reads the newest record and gets a new writer. Holding the input switch keeps the child from playing on in a window whose progress can no longer be saved, which is the outcome FR-020 protects. The parent loses only the in-panel reason line in that window; the panel's import/reset are refused there anyway (`replaceGate` → `Blocked` on `otherTab`). Not clearly wrong → kept. The follow-up "Settings panel is unreachable while the refusal card holds the one input switch" in `follow-ups/review-fixes.md` carries a `Trigger:` line. For `newer` on an older build, the reload either runs the newer build or meets the `future` load card ("Graj dalej", no write) — no loop.

## Content / copy read (teacher and parent)

All new strings in `src/data/pl.ts` read: `settings.saveOff.otherTab`, `saveTransfer.deviceOtherTab` ("ta karta" as in the existing `deviceNewer`), `settings.offline.*`, `settings.uiArtOk`/`uiArtMissing` (verb agreement through `inflect`, same pattern as `artMissing`/`roomArtMissing`), `settings.musicStatus.*`, `settings.soundPrefsNotKept`, `saveRefused.*`. Calm, short, correct Polish; no blame, no "błąd" for the child. No task content (generators, curriculum, templates) changed; `sample` E1–E6 clean. DESIGN-GAP rows 116–121 in `docs/design-gaps.md` match the comments in `pl.ts`, `saveRefusedCard.ts`, `offlineView.ts`, `artHealthView.ts`, `settingsPanel.ts` (117: the button takes the focus — `restart.focus()`; 118: section after "Zapis gry", before "Obrazki" — `openSettingsPanel` order).

## Findings

### F1 — Store-level proof of "a late own write is accepted" was missing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/idbStore.test.ts (`describe('IndexedDB stale-writer guard')`)
- **Detail**: Plan phase 2 § 3 lists "a late own write after another own write → accepted". The store tests only awaited writes one after another, so `base` had already moved and the `writer === mine` branch of `writeVerdict` was never needed at the store level: with the writer condition removed, every store test stayed green (only the pure `writeVerdict` table caught it). This is the path that keeps a timed-out write from refusing its own tab on a child's device.
- **Fix**: New test "an own write that lands after a later own write started (an abandoned, timed-out write) is never refused": two overlapping writes of one store (`base` still 0 for both) → both `ok`, stored generation 2, writer A, a third write ok; red under the writer-condition break, green restored.
- **Decision**: FIXED — cc1621d

### F2 — The refusal card hides the parent's reason line in that window

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture
- **Location**: src/main.ts (`onBlocked`), src/ui/dom/saveRefusedCard.ts (`mountSaveRefusedCard`)
- **Detail**: See "Phase-4 decision" above: kept as planned (plan decision 5).
- **Fix**: none now; follow-up with `Trigger:` already in `follow-ups/review-fixes.md`.
- **Decision**: ACCEPTED (follow-up)

### F3 — A throw inside the `register()` `.then` is reported as `register-failed`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pwa/registerServiceWorker.ts (`registerServiceWorker`)
- **Detail**: `.catch` follows `.then`, so an exception from `track`/`addEventListener` (not expected in practice) would be named a registration failure. Harmless: the game never sees a throw (row 5.5 holds) and the panel line is still a failure line.
- **Fix**: none; recorded.
- **Decision**: RECORDED

### F4 — The raw-save export carries the writer id

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/saveExport.ts (raw export of an unreadable save), src/storage/idb.ts (`guardedPut`)
- **Detail**: A stored v4 record holds `writer` (a random per-page-load UUID). "Zachowaj kopię" on the unreadable-save card exports the raw record, so the id is in that file. It is random, local, never logged and identifies nothing; the normal export (`exportFileText` via `encodeSave`) writes the placeholders `generation: 0`, `writer: ''`.
- **Fix**: none; recorded.
- **Decision**: RECORDED

### F5 — Unplanned comment edit in `src/data/balance.ts`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: src/data/balance.ts (`balance.save` comment)
- **Detail**: Only the comment "v3 before v4" was added to the `backupAttempts` explanation (seam sweep, phase 10); no number changed. Harmless.
- **Fix**: none.
- **Decision**: RECORDED

## [reviewer] rows

Performed and ticked: 1.6, 2.5, 3.5, 4.4, 5.5, 6.4, 7.5, 8.4, 9.4, 10.5 (evidence above and in `handoff.md` § 3). Left open for the ship step: 10.7 `[reviewer] (CI at ship)` — workflow `CI`, job `check`, log lines `e2e hook: absent \([0-9]+ chunks checked\)` (step `npm run build`) and `Tests +[0-9]+ passed` (step `npm test`). Not mine: 11.4 [human], 12.4 [visual].

MERGE: CLEAR — no open critical, every automated criterion met and re-run (unit 3076 + 63, e2e 121 + 4), the one warning fixed in cc1621d; open rows are only 10.7 (CI at ship), 11.4 [human] and 12.4 [visual].
