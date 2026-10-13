# Test-plan refresh after S-04..S-08 and the observability fix — Plan Brief

> Full plan: `context/changes/test-plan-refresh-2026-10-13/plan.md`
> Research: `context/changes/test-plan-refresh-2026-10-13/research.md`

## What & Why

The test plan still describes 2026-10-12: local e2e "not started", risks #12-#15 only proposed in slice plans, no word on the S-09 purchase or on whether the adaptive curriculum moves a real child forward at a sensible pace. This refresh brings the strategy in line with what shipped and with the 2026-10-13 interview, so the next slices (S-09..S-11) and the rollout phases plan against the right risks.

## Starting Point

`context/foundation/test-plan.md` has 11 risks and 5 phases (1-3 complete). Local e2e actually shipped across S-04..S-08 and `observability-c1-c2`: 7 specs, 23 tests, two servers (production 4398, hook build 4397), a build guard for e2e markers. Unit base: 63 files, 974 tests.

## Desired End State

17 risks with guidance rows; phase 5 complete; phase 4 also owns "an update keeps state" (from S-11); new phase 6 (difficulty-curve simulation) and phase 7 (manual iPad/Android checklist for every change to touch or scenes); §4-§6 describe the e2e layer and its cookbook; §7 records no performance tests and no WebKit automation; dates 2026-10-13.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Risks #12-#15 | adopt archived wording and response rows | already proven by shipped specs | Research |
| #16 S-09 purchase | High/Medium, unit/property on pure purchase logic + one e2e after S-09 | guardrail "nigdy utrata gwiazdek", US-02 AC | Research |
| #17 difficulty curve | High/High, unit/property simulation over real `core` functions | primary success criterion; model predicts slow 3-skill steps | Research |
| #17 acceptance range | from PRD with R = 2 rounds/session: ~120 rounds per stage; 70 % child median ≤ 120 ÷ steps per step; 60 % child unlocks within the stage at p90; 90 % child ≤ half the 70 % budget | requirements state no pace; range must not come from code | Maintainer |
| Phase 5 status | complete, folder cell names the slice archives | delivered inside slices, not one rollout change | Plan |
| §7 | performance tests and WebKit automation excluded; iPad/Android manual in phase 7 | interview 2026-10-13 | Interview |
| Hot-spot numbers | measured (src/data 112, not 86 as in the brief) | the brief's figure was not reproducible | Research |
| Merge | agent merges after green CI | maintainer decision for this PR | Maintainer |

## Scope

**In scope:** every section of `context/foundation/test-plan.md` (§1 principles text unchanged).

**Out of scope:** the simulation itself (phase 6), the device checklist content (phase 7), `test-stack.md` refresh, any code.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Strategy and risks (§1-§3) | risks #12-#17 + guidance, re-scoped rollout | a Source cell slipping into a code anchor |
| 2. Stack, gates, cookbook, negative space (§4-§8) | e2e stack and cookbook, new gates, §7/§8 | cookbook drifting from how specs are written |

**Prerequisites:** research and maintainer decisions (done).
**Estimated effort:** one short session.

## Open Risks & Assumptions

- The #17 range may fail on today's balance; that is the intended S-17 signal, not a reason to widen it.
- Seven phases and nine cookbook entries exceed the schema's guideline; accepted because four phases are complete history and placeholders are one line.

## Success Criteria (Summary)

- A reader of `test-plan.md` sees every shipped e2e risk as covered and knows how to add the next spec.
- S-09 and the phase 6 simulation start from a written risk, a cheapest layer and a requirement-derived range.
