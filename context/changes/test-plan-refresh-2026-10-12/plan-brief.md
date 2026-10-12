# Test-plan refresh: local browser e2e — Plan Brief

> Full plan: `context/changes/test-plan-refresh-2026-10-12/plan.md`
> Research: `context/changes/test-plan-refresh-2026-10-12/research.md`

## What & Why

The maintainer decided on 2026-10-12 that browser e2e (Playwright, Chromium) becomes a local gate, not a CI job. Risks checked only by hand today (offline start, the "Obróć tablet" overlay, the update path, and from S-04 the touch round) need a place in the test plan before `/10x-e2e-setup` seeds the first test.

## Starting Point

`context/foundation/test-plan.md` has 7 risks, phases 1–3 complete, phase 4 not started, e2e listed as "none — excluded". Risk #3 covers PWA/deploy only from the server side.

## Desired End State

The test plan lists risks #8–#11 (browser-level, evidence-only) with response guidance, a rollout phase 5 "Local browser e2e" (`not started`), Playwright as the local e2e layer on port 4398, an e2e cookbook placeholder, and e2e negative space; the CI exclusion is unchanged.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Where e2e runs | Local gate only, Chromium | Maintainer decision; CI exclusion keeps its trigger | change.md |
| New risks | Append #8–#11, never renumber | Schema keeps risk numbers stable; #8 is the browser half of #3 | Plan |
| Map size | 11 rows (above the 5–7 guideline) | Appending is required and each row maps to a phase | Plan |
| Server port | `vite preview --port 4398 --strictPort` | Default preview port 4173 is protected | Research |
| S-04 hook | Read-only, e2e-only build, absent from prod `dist/` | Canvas has no DOM to read; a DOM mirror would drift | Research |
| Stale §4 cells | Refresh ESLint / deploy-smoke versions | §8 claims stack verified today | Plan |
| `data-build` marker | Deferred to `/10x-e2e-setup` | Not a test-plan decision | change brief |

## Scope

**In scope:** test-plan.md §2–§8 and header date; one-line comment fix in `src/ui/dom/rotateOverlay.ts`.

**Out of scope:** installing Playwright, any test or config, autonomous-run profile changes, CI changes.

## Architecture / Approach

Phase 1 edits the foundation doc section by section; phase 2 isolates the source comment fix.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Refresh test-plan.md | §2 risks + guidance, §3 phase 5, §4–§8 updates | File anchors leaking into §2 Source cells |
| 2. Fix stale overlay comment | Correct CSS path in a comment | None |

**Prerequisites:** research done; branch `feat/e2e-local-gate`.
**Estimated effort:** one short session.

## Open Risks & Assumptions

- WebKit and performance stay open (not chosen, not excluded); iPad remains manual.
- Chromium in the agent sandbox and the reload count for #10 are unverified until `/10x-e2e-setup`.

## Success Criteria (Summary)

- §2 Source cells have no file anchors; §3 parses with phase 5 `not started`.
- `npm run lint` and `npm run typecheck` pass.
