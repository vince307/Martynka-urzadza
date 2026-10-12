# Test-plan refresh: local browser e2e — Implementation Plan

## Overview

Docs-only refresh of `context/foundation/test-plan.md` that records the maintainer's 2026-10-12 decision: browser e2e (Playwright, Chromium) becomes a **local** gate and stays out of CI. The refresh adds the browser-level risks to §2 with response guidance, a rollout phase 5 "Local browser e2e" to §3, the e2e layer to §4/§5, an e2e cookbook placeholder to §6, the e2e negative space and open items to §7, and refreshes dates. A trivial stale comment in `src/ui/dom/rotateOverlay.ts` is fixed alongside.

## Current State Analysis

- `context/foundation/test-plan.md` has 7 risks; risk #3 (offline/stale build/headers) is covered server-side only (deploy smoke) plus a manual tablet check; its anti-pattern cell reads "e2e browser run in CI (excluded by §7)", which reads as a ban on browser e2e in general.
- §3 has phases 1–3 `complete`, phase 4 `not started`. §4 lists e2e as "none — excluded (§7)". §4 also carries two stale version cells ("none yet — see Phase 1/2") for ESLint and the deploy smoke, which both shipped.
- §7 excludes "Browser e2e in CI" (re-evaluate trigger: a second device class).
- Research (`research.md`) grounded every browser risk: offline start is provable only in Chromium (Playwright supports service workers only there), the rotate overlay is pure CSS (jsdom cannot evaluate media queries), update mechanics are testable now but state only after S-11, and the S-04 round needs a read-only e2e-only test hook. `npm run preview` without `--port` binds 4173, a protected port; the gate uses 4398.

### Key Discoveries:

- Offline proof needs: wait for SW **control** before going offline, then assert `fromServiceWorker()` on the navigation and the bundles (research §1).
- Android device presets show the install-hint overlay over the canvas; use desktop Chromium with `hasTouch: true` (research §4).
- Stale comment: `src/ui/dom/rotateOverlay.ts:6` names `public/style.css`; the file is `src/style.css` (research §2).
- The test-plan schema forbids file anchors in §2 Source cells and new §3 status literals (`.claude/skills/10x-test-plan/references/test-plan-schema.md`).

## Desired End State

`context/foundation/test-plan.md` describes local browser e2e as a planned layer (phase 5, `not started`) with four new evidence-only risks (#8–#11) and guidance rows, the CI exclusion intact, and e2e negative space recorded. `/10x-e2e-setup` can then seed the offline-start test from it. Verified by a grep (no `.ts`/`file:line` in §2 Source cells), an intact §3 table, and green `npm run lint` / `npm run typecheck`.

## What We're NOT Doing

- Installing Playwright, writing `playwright.config.*` or any test (that is `/10x-e2e-setup`, outside this change).
- Deciding the `data-build` DOM marker (decided in `/10x-e2e-setup`).
- Changing `context/foundation/autonomous-run.md` / `.env` (E2E=on comes from `/10x-autonomous-run --setup`).
- Rewriting §1 (only the header date line changes), renumbering risks, or adding new §3 status values.
- Adding browser e2e to CI.

## Implementation Approach

Edit the test plan section by section in one phase (docs). The second phase is the one-line comment fix in source, kept separate so the code diff is isolated and lint/typecheck run against it.

Decisions taken in planning (no interview; recorded here):

- **Four new risks appended as #8–#11** (never renumber): #8 browser does not boot from the SW cache offline, #9 "Obróć tablet" overlay wrong, #10 update takes over wrongly / loses state (state part after S-11), #11 round not playable by touch (from S-04). The map grows to 11 rows, above the schema's 5–7 guideline; accepted because the schema also requires appending, and #8 is the browser half of #3, kept separate so phase 2 (server smoke) and phase 5 (browser) cover distinct rows.
- **Ratings**: #8 High/Medium, #9 Medium/Low, #10 High/Medium, #11 High/Medium.
- **§4 stale cells** (ESLint "none yet", deploy smoke "none yet") are refreshed to the shipped versions, since §8 claims stack versions verified today.
- **§5** gains a "local browser e2e" gate row, `planned` until phase 5 lands (schema: every gate points at a rollout phase).
- **§6**: e2e placeholder inserted as 6.6; per-phase notes move to 6.7 (nothing outside test-plan.md references 6.6).
- **Phase 5 goal** includes the S-04 requirement (read-only e2e-only test hook, absent from the production bundle) so the S-04 plan inherits it.

## Phase 1: Refresh test-plan.md

Driver: impl
Driver why: prose edits to a foundation doc; no behaviour to drive test-first.

### Overview

Apply every section change to `context/foundation/test-plan.md`.

### Changes Required:

#### 1. Header and §2

**File**: `context/foundation/test-plan.md`

**Intent**: Bump "Last updated" to note the refresh; append risks #8–#11 with evidence-only Sources (interview 2026-10-12 refresh, PRD FR-001/FR-002/FR-006–FR-008/US-01/US-04/NFR offline start, roadmap S-04/S-11, archived PWA plan); add one Risk Response Guidance row each; rewrite risk #3's anti-pattern and cheapest-layer cells so CI e2e is forbidden but local e2e (#8) is allowed.

**Contract**: §2 table columns unchanged; Source cells carry no `.ts` names or `file:line`. Guidance anti-patterns include "a green reload without checking fromServiceWorker proves nothing", seeding state by writing IndexedDB directly, Android device profiles, a DOM mirror in the shipped build.

#### 2. §3, §4, §5

**Intent**: Add row 5 "Local browser e2e" (`not started`, `—`) covering #8–#11 with the staged scope (offline start + overlay now, seeded by `/10x-e2e-setup`; round with S-04 needing the e2e-only hook; update/state after S-11). Replace the §4 e2e row with Playwright, Chromium only, local gate only, webServer `vite preview --port 4398 --strictPort` (never 4173), WebKit SW not automatable, iPad manual; refresh stale ESLint/deploy-smoke cells; add Playwright to grounding notes. Add the §5 gate row.

**Contract**: §3 columns and status literals unchanged.

#### 3. §6, §7, §8

**Intent**: §6.6 e2e placeholder ("TBD — see §3 Phase 5") naming the patterns: wait for SW control before going offline, assert `fromServiceWorker`, desktop Chromium with `hasTouch` not an Android device profile; old 6.6 becomes 6.7. §7 keeps the CI exclusion (trigger unchanged, reason updated to mention the local gate), adds scene looks and task content as e2e negative space, and records WebKit and performance as open. §8 dates stay 2026-10-12.

### Success Criteria:

#### Automated Verification:

- §2 Source cells have no `.ts` or `file:line` anchors: `awk '/^## 2\./,/^### Risk Response/' context/foundation/test-plan.md | grep -E '^\| [0-9]+ ' | awk -F'|' '{print $6}' | grep -cE '\.ts|:[0-9]+'` prints 0
- §3 table parses: every row has 7 cells and a status in {not started, change opened, researched, planned, implementing, complete}; row 5 is `not started`
- `npm run lint` passes
- `npm run typecheck` passes

#### Manual Verification:

- Maintainer reads the refreshed §2–§7 and agrees they match the 2026-10-12 interview

---

## Phase 2: Fix stale overlay comment

Driver: impl
Driver why: one-line comment correction.

### Overview

Correct the CSS path in the rotate-overlay doc comment.

### Changes Required:

#### 1. Comment

**File**: `src/ui/dom/rotateOverlay.ts`

**Intent**: The comment says `public/style.css`; the stylesheet is `src/style.css` (imported by `main.ts`).

**Contract**: comment only; no code change.

### Success Criteria:

#### Automated Verification:

- `grep -c "public/style.css" src/ui/dom/rotateOverlay.ts` prints 0
- `npm run lint` and `npm run typecheck` pass

---

## Testing Strategy

Docs-only; verification is the grep checks plus lint/typecheck. No tests are added (the first e2e test is `/10x-e2e-setup`'s seed).

## Follow-ups

- `/10x-e2e-setup`: install Playwright, seed test = offline start; decide the `data-build` DOM attribute; verify Chromium launches in the agent sandbox and the reload count for risk #10.
- `/10x-autonomous-run --setup`: set E2E=on with the Playwright gate command.
- S-04 plan: must include the read-only e2e-only test hook (absent from production `dist/`).
- Stale comment in `rotateOverlay.ts`: done in Phase 2 of this change.

## References

- Change decisions: `context/changes/test-plan-refresh-2026-10-12/change.md`
- Research: `context/changes/test-plan-refresh-2026-10-12/research.md`
- Schema: `.claude/skills/10x-test-plan/references/test-plan-schema.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Refresh test-plan.md

#### Automated

- [x] 1.1 §2 Source cells have no `.ts` or `file:line` anchors — e63be6f
- [x] 1.2 §3 table parses; row 5 is `not started` — e63be6f
- [x] 1.3 `npm run lint` passes — e63be6f
- [x] 1.4 `npm run typecheck` passes — e63be6f

#### Manual

- [ ] 1.5 Maintainer reads the refreshed §2–§7 and agrees they match the 2026-10-12 interview

### Phase 2: Fix stale overlay comment

#### Automated

- [x] 2.1 `grep -c "public/style.css" src/ui/dom/rotateOverlay.ts` prints 0
- [x] 2.2 `npm run lint` and `npm run typecheck` pass
