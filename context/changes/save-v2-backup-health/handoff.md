# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-research` step of run `2026-10-15-fix-s14c-s14d`. Research is done (`research.md`, status
`complete`); nothing is planned or implemented yet. Do not get wrong: the save format stays v2 (every new state is
runtime `AutosaveStatus` or derived), and a timed-out IndexedDB write is NOT cancelled — it keeps blocking later
writes on the same store and may complete late, so the plan must free `inflight` and re-mark dirty after a `replace`
timeout.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | 2 on the branch: change identity + `docs(save-v2-backup-health): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/save-v2-backup-health/research.md` | Source-backed research: SV2-01 options A–D with recommendation A (N = 3, `hidden`-flush exception), v1→v2 field coverage, attempts per session, SV2-02 time-limit design and IndexedDB abandoned-transaction behaviour, SV2-03 truthful panel lines, SRR-02 in-start way out (no counter), tests/seams pinning today's behaviour, S12-07/08/12/13 status |
| `context/changes/save-v2-backup-health/change.md` | Frontmatter only: `status: new` → `preparing`, `updated` |
| `context/changes/save-v2-backup-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/save-v2-backup-health` |
| `grep -rln -E "localStorage\|sessionStorage" src tests` | no match (rc 1) — no browser-storage path exists today |
| `node_modules/idb-keyval/dist/index.js` (6.3.0) read | `set` resolves on transaction `complete`, no abort handle; `createStore` caches the `open` promise |
| `metadata-guard.mjs mark-researched` | `changed: true` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main at `16848c6`: unit 2445, e2e 77 — inherited from the run contract, unverified here) |

## 4. Next command

`/10x-plan save-v2-backup-health`

## 5. Open

- Plan decides (recommendations in `research.md` § Summary): SV2-01 option A with `balance.save.backupAttempts = 3`
  and the `hidden`-flush exception; `balance.save.writeTimeoutMs = 5000` for backup, write and `replace` (+ an e2e
  override like `E2E_LOAD_TIMEOUT_MS`); runtime `backup`/`backupError`/`lastFailure { stage, error }` in
  `AutosaveStatus`; SRR-02 via a `timeout` card with a "wait longer" re-await of the same read
  (`balance.save.slowLoadTimeoutMs`, ~20 000) and the site-data advice after it, no `localStorage`.
- Candidates: SRR-04 (`replace` takes the pending backup once, non-blocking — or keep "bypass by design"), O2 (ignore
  Escape while `busy` in `saveImportDialog.ts`/`saveResetDialog.ts`), S12-08, S12-12, S12-13, SRR-12 (comes with the
  `timeout` card), S12-03.
- Tests to update deliberately: `tests/autosave.test.ts` ("a failing copy writes nothing…", "replace never copies",
  "waits for a write in flight…", "the status says which version…"), `tests/saveHealth.test.ts` (shape), e2e copy in
  `tests/e2e/save-restart.spec.ts` / `save-transfer-blocked.spec.ts` if the `timeout` texts change. New seams
  (`backupfail`, `backuphang`, `writehang`) under the existing `e2eSave` marker.
- New copy → DESIGN-GAP rows from 94 in `docs/design-gaps.md`; correct the `pl.ts` comment at `saveMigrated`.
- Follow-ups to re-file with triggers: S12-07 (`saveExport.ts` not touched), SRR-08 (needs a counter; changes the
  SIR-02 e2e), SV2-04 (option B), N-7 `[human]` iPad measurement, plus the out-of-scope list in `change.md`.

## 6. Autonomous decisions

- **SV2-01: recommend A (N = 3, `hidden` exception) over B, C, D.** Why: PRD guardrail "Postęp nigdy nie ginie" and
  FR-020 rule out D; FR-021 covers a failed migration, not a failed copy (PRD silent → recommendation); v2 is a
  validated superset of what any v1 build wrote; "Zapisz kopię" already exports the full state, so B adds UI for no
  new content; C changes the read path. Would change: a v1 field lost by `MIGRATIONS[1]`/`encodeSave`, or a
  migration step that can throw (v3).
- **SRR-02: no cross-start counter; in-start longer wait + advice.** Rejected: `localStorage` counter (previous
  research: session-only in Safari private mode, no evidence it survives a broken IDB; first storage path of the
  game). Would change: N-7 measurement showing a permanent `timeout` that a 20 s wait never resolves on most devices,
  or a parent report that the advice appears too early.
- **No transaction abort in `idb.ts`.** Why: idb-keyval exposes none, and a hang in `open` has no transaction.
  Would change: evidence that hangs happen inside a live transaction on iPadOS.
- **Research written in English** like the previous save research; anchors are symbols only (run contract).
- Delegated two read-only subagents (tests/seams map; history and PRD); their claims used in `research.md` were
  spot-checked against source (`dialog.ts` Escape, `UIScene.openImport`, `MIGRATIONS`, idb-keyval). No AskUserQuestion.
