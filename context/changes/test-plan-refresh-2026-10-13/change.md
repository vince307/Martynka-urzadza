---
change_id: test-plan-refresh-2026-10-13
title: Refresh the test plan after S-04..S-08 and the observability fix
status: implemented
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

Refresh context/foundation/test-plan.md after S-04..S-08 and the observability fix (interview 2026-10-13). (1) Add risks #12 first-launch placement, #13 adaptive curriculum, #14 parent settings, #15 error card instead of a frozen screen to §2 with Risk Response Guidance (specs already cite them as proposed). (2) New risks: S-09 star purchase double-charges or drives the balance negative; the difficulty curve in practice (rounds to unlock at 60/70/80 % first-try accuracy) - cheapest layer a unit/property simulation with ranges taken from requirements, not the code. (3) Interview: all three fears equal (losing stars/furniture after closing, wrong content or a hint that gives the result away, a mid-round freeze with no trace); nothing failed in production yet; least confidence in curriculum data and Phaser scenes; under-tested: difficulty curve and the real tablet; negative space unchanged plus no performance tests and no WebKit automation (iPad stays manual). (4) §3: phase 5 local e2e -> complete (its update/kept-state part moves to phase 4, starts with S-11); new phase 6 difficulty-curve simulation; new phase 7 manual device checklist (iPad/Android) for every change to touch or scenes. (5) §4/§5/§6/§8: Playwright 1.64 with the hook build and two servers, the build guard marker list, e2e cookbook (?e2eMonth/?e2eFail, never page.clock, holdTouch via CDP, break patches run by the orchestrator, AST test for session-wrapped dialog callbacks), refreshed dates. Evidence: audits 2026-10-13 (C-1/C-2 closed; N-1, H-3/H-4 open), hot-spots src/core/tasks 88, src/data 86, src/scenes 57 file changes/30d; baseline meaningful (63 unit test files, 974 tests; 7 e2e specs, 23 tests).
