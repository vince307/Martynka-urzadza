# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-plan` step of run `2026-10-16-fix-stale-tab-health`. `plan.md` has 12 phases (10 code, 2 e2e) with `## Progress` (57 rows, all pending); the save format becomes **v4** (`generation` + `writer` compare-and-set inside `guardedPut`) and the run ships it (orchestrator decision 1), with a `[human]` row to accept or reverse v4. The next agent must not get wrong: the UI-art record lives under the NEW key `REGISTRY_KEYS.uiArtHealth`, never `REGISTRY_KEYS.artHealth` (that one feeds `artFilter`), and nothing under `deploy/` except the docs-only `deploy/README.md` note may change.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | 3 on this branch: change identity, research, `docs(stale-tab-and-health): plan` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 57 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/stale-tab-and-health/plan.md` | full plan: 12 phases with `Driver:` lines, Known risks (v4 one-way door), Autonomous decisions 1-13, `## Progress` |
| `context/changes/stale-tab-and-health/plan-brief.md` | two-page brief with the decision table |
| `context/changes/stale-tab-and-health/change.md` | status `preparing` → `planned` |
| `context/changes/stale-tab-and-health/handoff.md` | this file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/stale-tab-and-health` |
| `metadata-guard.mjs inspect` / `mark-planned` | change.md found; `changed: true`; no roadmap row for this change id (none edited) |
| Plan structure | 12 `## Phase N:` bodies each with `Driver:` + `Driver why:` as first lines; 12 `### Phase N:` in Progress; Success Criteria bullets map 1:1 to Progress rows |
| Source reads (to ground contracts) | `src/core/save.ts`, `src/storage/idb.ts`, `src/pwa/registerServiceWorker.ts`, `src/core/autosave.ts` (head, `replaceGate`, refusal paths), `src/core/saveHealth.ts`, `src/core/saveFile.ts` `deviceSaveView`, `src/ui/dom/settingsPanel.ts` options, `src/data/layout.ts` `REGISTRY_KEYS`, `src/testing/e2eHook.ts` seams, `playwright.config.ts` `ROUND_SPEC`, `tests/e2e` version literals |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main 9a64fd6 per contract: unit 3076, e2e 121 — inherited, unverified) |

No deliberate break (no test written in this step).

## 4. Next command

`/10x-plan-review stale-tab-and-health`

## 5. Open

- **[human] rows (checklist)**: 10.6 accept or reverse save format v4; 11.4 iPad: the restart card reads calmly and brings back the newest stars.
- **[visual] row**: 12.4 settings panel at 1440 and 1024 in every new state plus the child card.
- **[reviewer] (CI at ship)** 10.7: workflow `CI` job `check` log regex `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (regex, not a quoted line).
- **DESIGN-GAPs to add** in the phases: 116 `otherTab` line (p3), 117 child card (p4), 118 offline section (p6), 119 UI-art line (p7), 120 music status (p8), 121 prefs not kept (p9).
- **E2E phases 11-12** use the request-file protocol (profile § 8): patches `e2e-break-p11a/p11b/p12a/p12b.patch`; p11a is written in phase 4, p12a in phase 6.
- **Follow-ups** to write in phase 10 (`context/changes/stale-tab-and-health/follow-ups/review-fixes.md`): Web Locks/`BroadcastChannel`, worker build id, P-8, two-build e2e, card order, heading alignment, S-2/S-4/S-5/S-7/S-9/S-10, G-2/G-3/B-4/B-5, P-2..P-6, iPadOS storage separation.
- **Risk to watch in phase 1**: four e2e specs assert `writtenVersion` 3 (`salon-load-health`, `save-backup-health`, `salon-art`, `save-migration`); phase 1 updates them. Phase 4: `load-and-tab-guard.spec.ts` (`?e2eSave=newer`) now meets the child card.

## 6. Autonomous decisions

- **v4 shipped, research's "stop at an open PR" overridden**: orchestrator decision 1 (maintainer chose full ship at Step 0); `[human]` row 10.6 + Known risk. Would change: the maintainer reversing v4 before merge.
- **No AskUserQuestion; complexity HIGH, 0 questions**: research + orchestrator settled every product choice; the rest decided in plan "Autonomous decisions" 1-13. Would change: nothing in an unattended run.
- **Store stamps and tracks `base`, core owns `writeVerdict`**; rejected `base` in the autosaver (not atomic). Would change: a store without transactions.
- **New `BlockReason 'otherTab'`, blocked for import/reset** (research recommended the new reason; blocking replace is this plan's call). Would change: a parent report needing import from a refused window.
- **P-8 not taken** (backup overwrite kept; the latest raw v3 is more recent progress). Would change: a parent report of a lost `backup-v3`.
- **No new e2e URL seams** (real two pages, real worker install, `page.route` abort). Would change: worker install flaky in Chromium within the test limit (then a `?e2eSw` seam with a guard marker).
- **Gap rows renumbered by phase order** (116-121) instead of research's order. Would change: nothing material.
- **No subagents dispatched** (skill default 2-3): research's Code References covered every file; a few targeted reads filled the contracts. Would change: an unmapped area.
- **Plan in English** (as change.md/research.md); commit in Polish per profile § 1.
