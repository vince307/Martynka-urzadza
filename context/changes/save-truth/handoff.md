# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-research` step. `research.md` answers every in-scope finding: root cause, smallest fix, the test
that fails first, and the risk. It also proves that all new state sits outside the save (the format stays v4). The next
agent must not get two things wrong. SRR-01 keeps `reason: 'corrupt'` (it adds `from`/`problem`), because
`tests/legacySalonMigration.test.ts` pins "never migration-failed". SRR-09 deliberately reverses two "still replaced"
tests.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` (checked: `git branch --show-current`) |
| Commits | 2 on the branch: `docs(save-truth): change identity (autonomous run)`, `docs(save-truth): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/save-truth/research.md` | the research: findings A–F per id, a table proving storage sits outside the save, recommended phase grouping (9), open questions for the plan |
| `context/changes/save-truth/change.md` | frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/save-truth/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/save-truth` |
| source reads of `src/core/{autosave,save,saveHealth,saveFile}.ts`, `src/storage/idb.ts`, `src/main.ts` `start` (main agent), plus 3 read-only workers (UI/dialog flows, platform/storage APIs, rooms/fixtures/history) | every root cause confirmed in the code at `2ee9d92` |
| `grep` of the cited test names (`tests/autosave.test.ts`, `tests/saveHealth.test.ts`, `tests/e2e/save-restart.spec.ts`, `tests/e2e/save-backup-health.spec.ts`, `tests/legacySalonMigration.test.ts`) | anchors exist as named |
| `node_modules/idb-keyval/dist/index.js` `update` | always puts, so it cannot do write-once; a custom `count` + `put` transaction is recommended |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main inherited, unverified: unit 3416 passed, e2e 127 passed) |

## 4. Next command

`/10x-plan save-truth`

## 5. Open

- Plan decisions, each with a recommendation, are in `research.md` § Open Questions:
  1. SRR-08 wording while the counter is 0;
  2. R-4 `unknown-room` for `living` (log-only recommended);
  3. SRR-01 card copy (`saveMigrationFailed`);
  4. P-1 retry cap;
  5. SRR-08 e2e (two loads, no new seam).
- The intended test reversals the plan must state:
  - `tests/autosave.test.ts` "a %s save is still replaced (the way out)" and `tests/saveFile.test.ts` "an unreadable
    (%s) save is named, never summarised (overwriting stays allowed)" (SRR-09);
  - the SV2-01 hidden give-up cases in `tests/autosave.test.ts` (SVB-01);
  - `save-backup-health.spec.ts` "#2 SV2-02" asserting `resetFailed` (SVB-04);
  - `save-restart.spec.ts` asserting `exportOutcome.downloaded` (S12-07);
  - `save-transfer-blocked.spec.ts` #2 forcing on the first start (SRR-08).
- New e2e seam `slowfail` (SVB-02): `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS`, `tests/e2eSave.test.ts`,
  `tests/e2eHookGuard.test.ts`.
- New `SaveStore` methods (`readBackups`, a backup-status read and write) must be added to `e2eSaveStore` and to the
  test stores.
- `stale-tab-and-health` chose "a later migration overwrites `backup-v3`"; write-once (FU-3/P-8) reverses that.
- DESIGN-GAP rows from **126** for every new parent line (`change.md` § New `src/data/pl.ts` strings, plus
  `replaceUnconfirmed`, `deviceBroken` and the `pending` migration line).
- Citation slip in `change.md`: T-1..T-5 are in audit `2026-10-16_1419`, not `0915` (R-4 is in `0915`). `research.md`
  carries the correct file.

## 6. Autonomous decisions

1. **The question came from `change.md`, with no interview** (step prompt). Would change: nothing.
2. **SRR-01 keeps `reason: 'corrupt'` and adds `from`/`problem`.** Rejected: renaming to `migration-failed` as the audit
   sketch says. Why: `tests/legacySalonMigration.test.ts` pins that a v2 save that was already bad is `corrupt`; the gate
   and the card can read `from < SAVE_VERSION` instead. Would change: the plan finding a reason-only consumer that
   cannot take `from`.
3. **SVB-01: the copy may follow the write while the raw value is in memory.** Rejected: keeping copy-before-write and
   only persisting the status. Why: it turns "3 tries = 1 on a tablet" into real tries without delaying the child's
   progress, and a single-key IndexedDB write is already atomic. Would change: evidence that a v4 write can corrupt the
   key on a kill (then write-before-copy is unsafe).
4. **T-3 uses the two-part writer `tabId:nonce` with ended nonces**, not a plain sessionStorage id. Why: a duplicated
   tab copies sessionStorage, and an equal writer would switch off B-1. Would change: the plan choosing the
   BroadcastChannel collision check instead (both are recorded).
5. **SRR-08 keeps the `localStorage` counter** (change.md decision 3 stands). Why: localStorage outlives IndexedDB in
   Lockdown Mode, IDB hangs and lost connections. It fails with IndexedDB only when site data is blocked, and that
   branch gets a wording variant. Would change: evidence that the realistic `unavailable` cases on iPad are all
   "site data blocked".
6. **Write-once backup via `os.count` + `put` in one transaction**, not idb-keyval `update` (it always puts) and not
   `getKey` (Safari 15+, the build targets `safari14`). Would change: a project floor of Safari ≥ 15.
7. The skill's clipboard hand-off was skipped (unattended run; the next command is §4).
