# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-research` step of run `2026-10-16-fix-stale-tab-health`. `research.md` answers every question `change.md` left open: B-1 = option (c), save format **v4** with a `generation` + `writer` compare-and-set inside `guardedPut`, plus the `controllerchange` stale record (B-8) and the B-2 child card; B-2, S-8, S-6 are in. The next agent must not get wrong: the v4 bump is a maintainer-level decision (audit § 6), so the plan must say the ship step stops at an open PR, and the UI-art record must live under a NEW registry key, never `REGISTRY_KEYS.artHealth` (that one feeds `artFilter`).

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | 2 on this branch: `docs(stale-tab-and-health): change identity (autonomous run)`, `docs(stale-tab-and-health): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the three files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/research.md` | research: B-1 options table (a/b/c) with protection, rollback cost, browser support (MDN BCD), CAS rule sketch and test strategy; B-8/P-1 service-worker signals; G-1, S-1/S-3/S-11 data paths; decisions on B-2/S-8/S-6; PRD anchors; DESIGN-GAP rows 116-121 with proposed `pl.ts` keys |
| `context/changes/stale-tab-and-health/change.md` | frontmatter only: status `new` → `preparing` |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/stale-tab-and-health` |
| audit report read (`git show origin/docs/observability-audit-2026-10-15-fix-s16bcd:context/audits/observability/2026-10-16_0915-start-dzwieki-grafika-salon.md`) | read; rows B-1..B-8, S-1, S-3, S-6, S-8, S-11, G-1, G-2, P-1 used |
| Source reads (symbols cited in research.md) | `save.ts`, `idb.ts`, `autosave.ts`, `saveHealth.ts`, `saveHealthView.ts`, `registerServiceWorker.ts`, `installHint.ts`, `vite/config.shared.mjs`, `BootScene.ts`, `UIScene.ts`, `sound.ts`, `soundPrefs.ts`, `settingsPanel.ts`, `artHealth.ts`, `artHealthView.ts`, `uiArt.ts`, `layout.ts` `REGISTRY_KEYS`, `prd.md` |
| MDN browser-compat-data (raw.githubusercontent.com, read-only) | LockManager Chrome 69 / Safari+iOS 15.4; BroadcastChannel Chrome 54 / Safari+iOS 15.4; `controllerchange`, `statechange` Chrome 40 / Safari+iOS 11.1 |
| `metadata-guard.mjs mark-researched` | `changed: true` |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main 9a64fd6 per contract: unit 3076, e2e 121) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan stale-tab-and-health`

## 5. Open

- **Save format v4 (B-1)**: recommended, not yet decided by a maintainer. Plan needs `MIGRATIONS[3]` in `src/core/save.ts`, frozen `tests/fixtures/save-v4.json` (v1-v3 fixtures untouched), `backup-v3` copy via `createIdbSaveStore` `backup`, strict `saveProblem` for `generation`/`writer`, a pure verdict rule replacing/extending `storedVersionNewer`, `guardedPut` stamping inside its transaction, `writer` id injected from `src/main.ts`. **Ship step: stop at an open PR.**
- **`deploy/README.md` § 6 rollback note** must say v4; profile § 5 says changes under `deploy/` are never shipped by a run — plan decides whether this docs-only file is covered or moves the note to a follow-up.
- **New `BlockReason`** (`'otherTab'` recommended) vs reusing `'newer'`: touches `replaceGate`, `offState`, `deviceSaveView` (`src/core/saveFile.ts`).
- **Follow-ups fired by v4**: P-8 (keep the first `backup-v3`), "order of two cards (`future` vs `newer`)", "E2E on two real builds"; B-7 (`try/catch` around `os.put` in `guardedPut`) rides along. Re-trigger: "Two tabs of one origin (`BroadcastChannel`)" as an earlier-signal follow-up; worker build id (P-1) not added.
- **DESIGN-GAPs to add** (none added yet): rows 116-121 as listed in research.md § Design gaps and copy.
- **E2E**: no existing spec opens two pages in ONE context (`tests/e2e/save-transfer.spec.ts` uses a new context); the B-1 spec is new. P-1 install failure: unit reducer + optional hook-build seam (marker in `vite/e2eHookGuard.mjs`).
- **Unverified**: iPadOS storage separation of home-screen apps; Web Locks behaviour of a suspended page (neither changes the recommendation).

## 6. Autonomous decisions

- **B-1 = (c) v4 CAS + `controllerchange` record + B-2 card.** Rejected (b) runtime-only v3: cannot reach an already-running v3 build from #69 on (the audit's case), its liveness on iPadOS is unverified. Rejected (a) alone: no early signal, and a refusal would stay behind the adult gate. Rejected "v3 + optional fields": `saveProblem` ignores extra keys and `encodeSave` drops them, so old builds detect nothing, and the `save.ts` header requires a version per shape change. Would change: the maintainer forbidding v4 (then (b) with Web Locks `steal` + `controllerchange`, and B-1's old-build case recorded as accepted risk).
- **B-2 in**: the CAS refuses more often; FR-020. Would change: a decision to keep refusals parent-only.
- **S-8 in (light)**: `setMissing(all boot effect keys)` in the `catch`, reuses `pl.settings.soundMissing`, no new copy. Would change: `missing` gaining a second consumer that affects playback.
- **S-6 in (light, first to drop)**: same section as S-1, one boolean already returned by `SoundPrefStore.write`. Would change: phase-budget pressure in the plan.
- **No worker build id (P-1)**: `generateSW` has no message handler; `controllerchange` covers "newer build took over". Would change: a parent report needing the worker's build, or a switch to `injectManifest`.
- **`controllerchange` is a record, not a card**: PRD FR-003 forbids an update prompt. Would change: a maintainer wanting a restart prompt.
- **No subagents dispatched** (skill default is 2-4 parallel workers): the areas were named symbols in ~15 files, read directly; parallel workers would have re-read the same files. Would change: an unknown location needing a broad sweep.
