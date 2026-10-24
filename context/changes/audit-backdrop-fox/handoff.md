# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-tdd` step, phase 1, of run 2026-10-24-audit-backdrop-fox: the pure fox availability rule and the "Obrazki" lines are in, tests first. Phase 2 wires them into `GuideFox` and `UIScene`.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | phase 1 commit 8263f8b on top of the plan-review commits, plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is not set by this step; unchanged |
| `## Progress` rows | 1.1-1.4 ticked with 8263f8b; 1.5 left (its e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/guide.ts` | `GUIDE_IDS`, `guideAvailable(exists)` |
| `src/core/artPick.ts` | `'guide'` in `FallbackWhere`/`FALLBACK_ORDER`, `DrawnFallbackWhere` |
| `src/core/artHealth.ts` | `standIn` on the ui missing line, `noStandIn` input, `guide` line |
| `src/data/pl.ts`, `src/ui/dom/artHealthView.ts` | `uiArtMissing(count,total,standIn)`, `guideMissing`, view cases |
| `tests/guide.test.ts`, `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` | new cases; `tests/e2e/health-lines.spec.ts` call updated to `(1, total, true)` |

## 3. Verification

| command | result |
|---|---|
| RED (against stubs: `guideAvailable` true, no guide line, standIn absent, pl stub) | 11 failed, e.g. `AssertionError: expected [] to deeply equal [ { kind: 'guide' } ]` and `expected true to be false` (guideAvailable) |
| GREEN | the three files 61 passed |
| deliberate break: `guideAvailable` checks only idle; `standIn` = `missing.length > 0` | 3 red (guideCheer, guideThink missing rows; "only fox keys" case); restored. Meta: oracles are literal key lists and tables, not computed by the code under test |
| lint, typecheck, `npm test` + deploy scripts + sample E1-E6, build | green; unit 3903 passed (baseline 3891 + 12); `e2e hook: absent (2 chunks checked)` |
| `git diff main --stat` of save, fixtures, balance, curriculum | empty; `pl.ts` diff does not touch `artFallback`/`artFallbackNames` |
| e2e | not run (not in this phase) |

## 4. Next command

`/10x-implement audit-backdrop-fox phase 2`

## 5. Open

- Phase 2 must pass `noStandIn` (the three fox keys) from `UIScene.openSettings`, call `recordFallback(scene, 'guide', 'none')`, apply `guideAvailable` in the `GuideFox` constructor. Phases 3-6 as in the earlier handoff.
- Manual rows 4.7-4.10 unchanged. `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **T-1 Commit set = planned files only; stop after phase 1.** Would change: nothing.
- **T-2 Phase stays `Driver: tdd`**; stubs for new symbols were scaffolding to reach assertion failures. Would change: n/a.
- **T-3 Row 1.5 left unticked**: it includes the e2e baseline that the orchestrator measures.
- **T-4 The wrong first oracle (plural of 3) was a test error fixed before the quoted RED.**
