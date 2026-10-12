---
change_id: test-plan-refresh-2026-10-12
title: Odświeżenie planu testów — lokalne e2e w przeglądarce
status: preparing
created: 2026-10-12
updated: 2026-10-12
archived_at: null
---

## Notes

Refresh context/foundation/test-plan.md (scope: local browser e2e). Decided by the maintainer in the 2026-10-12 refresh interview: (1) Browser e2e becomes a LOCAL gate (Playwright, Chromium) — the local gate of implement/tdd/e2e phases and the autonomous-run profile (E2E=on) — and stays OUT of CI; §7 keeps "browser e2e in CI" excluded with its re-evaluate trigger. (2) Risks e2e must prove, which today are checked only by hand: offline start of the production build from the service worker cache (load, cut the network, reload, the game boots); the task round playable by touch from S-04 (5 tasks, stars, hint and second try after a mistake; needs a test hook because Phaser draws on canvas); an update does not lose state (new build takes over at the next launch, state intact; full coverage after S-11 save); the "Obróć tablet" overlay appears in portrait and disappears in landscape. (3) Negative space: no e2e budget for the look of scenes (no snapshots or pixel diffs) or for task content (unit, invariants and teacher read cover it). WebKit and performance were not excluded but were not chosen either — record as open, iPad stays a manual check. Evidence: interview 2026-10-12 (refresh), PRD offline/PWA NFR and US-04, roadmap S-04/S-11, hot-spots src/core/tasks (79 file changes/30d), src/data/curriculum (18), src/data/pl.ts (15); test base meaningful (vitest, 34 test files), no Playwright yet. Expected outcome: §2 gains the browser-level risks with Risk Response Guidance (cheapest layer e2e only where integration cannot see it), risk #3's anti-pattern cell no longer forbids local e2e, §3 gains rollout phase 5 "Local browser e2e" (offline start + overlay now, round flow with S-04, update/state after S-11), §4 records Playwright as the local e2e layer, §6 gets an e2e cookbook placeholder, §8 dates refreshed. One-time setup follows outside this change: /10x-e2e-setup (seed test = offline start) and /10x-autonomous-run --setup (E2E=on).
