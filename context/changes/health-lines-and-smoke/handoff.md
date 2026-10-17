# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-plan` step of run `2026-10-16-audit-sweep` (slice 3 of 3). The plan is written (14 phases, 71
Progress rows) and no code has changed yet. Do not get wrong: `src/core` never imports `src/data/pl.ts`, so the
panel builders return line keys and the renderers map them to text. Also, `registration.update()` runs **once per
launch only**, never on return from the background.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | 3 (`af4ddec` identity, `58b6ea7` research, + this plan commit) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (via `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 71 (`grep -c '^- \[ \]' plan.md`): 48 automated, 13 `[reviewer]`, 6 `[visual]`, 4 `[human]` |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/health-lines-and-smoke/plan.md` | 14 phases with `Driver:` lines (1–6 and 8–10 `tdd`; 7 and 11 `impl`; 12–14 `e2e`), Critical Implementation Details, Known risks, 15 Autonomous decisions, `## Progress` |
| `context/changes/health-lines-and-smoke/plan-brief.md` | two-page brief: key decisions table, phases at a glance |
| `context/changes/health-lines-and-smoke/change.md` | status `preparing` → `planned` |
| `context/changes/health-lines-and-smoke/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/health-lines-and-smoke` |
| `gh run view 38995649135 --log` (Deploy, read-only) | step `Smoke check (deploy)`: `ok   GET /sw.js — 200, 121 precache entries`, `all 20 checks ok` (quoted in plan rows 1.7) |
| Criteria ↔ Progress mapping (awk over plan.md) | 1:1 for all 14 phases (7/6/4/6/5/5/5/6/4/6/8/3/3/3) |
| `metadata-guard.mjs inspect` + `mark-planned` | `changed: true`, status `planned` |
| roadmap sync | `context/foundation/roadmap.md` has no `health-lines-and-smoke` row; untouched (non-roadmap) |
| Gate (lint, typecheck, tests, build, e2e) | not run: docs only, no code changed |

## 4. Next command

`/10x-plan-review health-lines-and-smoke`

## 5. Open

- [human] rows: 2.6 (accept a launch-only `update()`), 4.6 (optional throttled Android cold start against
  `balance.loader.totalMs`), 8.6 (real iPad with a never-unlocking audio context: `soundBlocked` after 3 touches),
  11.8 (wording of gaps 139–150).
- [reviewer] (CI at ship) rows: 1.7 (Deploy `Smoke check (deploy)` `all [0-9]+ checks ok` + `precache served: `);
  11.7 (CI `check`: `e2e hook: absent (` and `Tests +[0-9]+ passed`).
- DESIGN-GAP rows 139–150 will be added in phases 2, 5, 6, 7, 8 and 10. Gaps 66, 67, 114, 119 and 120 get notes.
- Follow-ups (written in phase 11, `follow-ups/review-fixes.md`): O-1(b), the 2217 P-4 `deploy/` half, G-3, G-6,
  ASL-05, ASL-08, A-6, A-8 (unless phase 13 takes it), L-7, the `FontFace` limit, VO3, O-3 on return from the
  background, and the B-6 measurement.
- Phase 5 may change the wording of existing "Obrazki" lines. e2e texts in `health-lines.spec.ts`,
  `art-stand-in.spec.ts` and `salon-load-health.spec.ts` may then need edits, each named in the commit.
- Plan-review watch items: phase 1 local proof against `vite preview` (`isLocalHost` skips the immutable check). The
  phase 9 seam (`AudioFile.onProcess` → `this.config.context.decodeAudioData`, pinned). Phase 4 timers are cleared on
  `COMPLETE` and `shutdown`.
- Known e2e load flakes: `money-pay` #11, `final-art-loading` #15, `child-flow-guards` #2.

## 6. Autonomous decisions

1. **No interview** (contract rule 1). The complexity, the question budget and the phase approval were decided in
   place. Would change: nothing.
2. **O-3 launch-only `update()`** (plan decision 2). Rejected `update()` on `visibilitychange` because the step prompt
   says no new worker may take over an open page mid-round. This follows `Martynka-urzadza.md` § 9 and departs from
   part of the audit, so it gets `[human]` row 2.6. Would change: a device that keeps an old build for days.
3. **S-2 source catch taken behind the pin** (step prompt; plan decision 4). Would change: a Phaser upgrade.
4. **Localhost skips the immutable check** (research Open Question 1; plan decision 3). Would change: none.
5. **Phase 5 contract corrected during writing.** No `src/core` module imports `pl` (checked by grep), so the lines
   builder returns keys. Would change: a boundary rule that allows `pl` in `core`.
6. **14 phases**, at the limit change.md decision 2 named; nothing more deferred. Would change: plan-review asking for
   fewer phases. The next items to defer are R-6, ASL-04 and S-7.
7. **No plan text against the design docs' literal text** (plan decision 14). Would change: a reviewer reading § 9
   differently.
