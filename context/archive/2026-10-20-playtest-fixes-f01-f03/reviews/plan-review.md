<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Playtest fixes F-01..F-03

- **Plan**: context/changes/playtest-fixes-f01-f03/plan.md
- **Mode**: Deep
- **Date**: 2026-10-20
- **Verdict**: SOUND after triage (REVISE before: two test contracts contradicted their own rule)
- **Findings**: 2 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F3, F4) |
| Plan Completeness | FAIL → PASS after fixes (F1, F2) |

## Grounding

Grounding: 20/20 paths ✓ (`src/core/round/{pick,warmup}.ts`, `src/core/{curriculum,longPress,placement}.ts`,
`src/scenes/{TaskScene,UIScene}.ts`, `src/ui/widgets/{SettingsIcon,PageButton}.ts`, `src/testing/e2eHook.ts`, the 10
named test files, `tests/e2e/{parent-settings,first-launch}.spec.ts`); symbols ✓ (`pickRoundSkills`, `pickSkills`,
`firstPlayableSteps`, `distinctTasks`, `effectiveAutoRead`, `longPress`, `REGISTRY_KEYS.variants`, `HUD_LAYOUT.settings`,
`MIN_TOUCH_TARGET`); brief↔plan ✓; Progress↔Phase ✓ (9/9 phases, criteria one-to-one, 42 rows after triage);
`Driver:` 9/9. No `lessons.md`, no `contract-surfaces.md`.

Code checks (one sub-agent, file:line evidence):
- rng: `pickRoundSkills` = one `rng.next()` per draw + one `rng.pick` (two on the review path, group then skill);
  empty buckets are dropped before the loop, no re-roll; `rng.pick` = one `next()` for any length → the bucket of draw
  i is the same for a filtered pick. Oracle (a) of phase 1 holds.
- No skill changes after the pick (`artRetries` and `distinctTasks` redraw the same skill) → a type rule on the skill
  list survives generation.
- `history` is one entry per answered task, capped at 200; the warm-up writes 6 entries and does not `countRound`;
  `roundsSince` +1 per ordinary round, 0 after any variant, which sets `lastMinigame` or `puzzleDay`/`puzzlesDone`. The
  `firstRoundDone` predicate distinguishes every v4 case (E1 first round: history 5, `roundsSince` 1).
- `WelcomeScene.create` resets fully and starts `TaskScene`, which launches UI itself; no boot-only flag goes stale;
  `saveProblem` accepts `learner: null` with stars. UIScene has no `changedata-learner` listener (no null crash).
- `longPress` callers (`UIScene.feed`, `roomGesture`, tests) read `state`/`fire` only → a `tap` field is safe.
- `autoReadStages: []` under `as const` types as `readonly []`, assignable to `readonly string[]`.
- `Martynka-urzadza.md` lines 9 and 158 carry "domyślnie włączone dla E1–E2"; phase 7 edits both (scope § 1 asks for it).

## Findings

### F1 — Phase 5 test expects a v1 fixture "not offered", the predicate offers it

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 — Tests, row 5.2
- **Detail**: `tests/fixtures/save-v1.json` (and `-legacy-salon`) hold 2 history entries; after `MIGRATIONS[1]` the
  variants are fresh (`roundsSince` 0). `firstRoundDone` = history > 6 or a variant field → false → "Wróć" offered. The
  plan's test says "not offered" and the deliberate break 5.2 relies on it; a faithful implementer would hit a red test
  that the rule itself makes red. The brief already lists this edge as accepted.
- **Fix**: pin the fixture as offered (the accepted edge) and build the "not offered" case from the decoded v1 learner
  with history extended to 7 in the test; 5.2 now names that case.
- **Decision**: FIXED (plan.md phase 5 Tests and rows 5.2)

### F2 — Seeded reorder of the warm-up's second half can create an in-half neighbour

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details — Warm-up; Phase 2 Tests
- **Detail**: The greedy takes "the highest remaining type different from the previous". With the second half
  `[A, A, B]` seeded by a first-half `A` it yields `B A A` — a neighbour inside the half — while phase 2's test asserts
  "no neighbours inside a half when its top count ≤ 2". The two rules contradict each other.
- **Fix**: the seed is soft — keep the seeded order only when it has no in-half neighbour, else the unseeded order
  (`A B A`); in-half variety wins over the boundary. Written into Critical Implementation Details.
- **Decision**: FIXED

### F3 — `TaskScene` shutdown does not stop `UIScene`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 — `backToAge`
- **Detail**: `TaskScene`'s `shutdown` listener removes its `game.events` handlers but does not stop UI (TaskScene.ts
  shutdown handler); the HUD would stay over the welcome until the next `launch`. The exit order already has step 4
  (stop UI and Room), so the plan is right, but nothing checks it.
- **Fix**: `## Known risks` entry; row 6.4 [visual] now also checks that the welcome reached by "Wróć" shows no HUD.
- **Decision**: FIXED

### F4 — Open follow-up whose trigger fires in phase 1 was not listed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 — Follow-ups
- **Detail**: `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md`: "`firstPlayableSteps`
  (`pick.ts`) and `playableSteps` (`curriculum.ts`) filter by the same predicate; one source". Trigger "next change to
  `pick.ts` or `curriculum.ts`" — phase 1 changes `curriculum.ts`. Still open in code (`pick.ts` `firstPlayableSteps`
  vs `curriculum.ts` `stepPlayable`). Neither change.md nor the plan named it. Merging now would move the warm-up pools
  that phase 2's "uncapped = `pickSkills`" oracle compares against, so deferral is justified.
- **Fix**: phase 7 re-records it with the reason and a new trigger; 7.2 count raised to ≥ 6.
- **Decision**: FIXED

### F5 — Agent-made product choices for "Wróć" had no `[human]` row

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Autonomous decisions A-2, A-3, A-4; Phase 6
- **Detail**: scope.md § 1 says "the child can correct the age herself" and says nothing about a parent-chosen stage.
  Hiding "Wróć" for a parent-placed learner (A-2) is consistent with that wording (the parent's choice is not the
  child's to undo; the parent keeps the settings panel) and is not overturned. A-3 (visible mid-task) and A-4 (no
  confirm) are also reasonable. But they are product decisions only the maintainer owns; only the PRD one (A-7) had a
  `[human]` row.
- **Fix**: new row 6.6 [human] naming A-2, A-3, A-4.
  - Strength: the maintainer sees the choices at the PR without re-reading the plan.
  - Tradeoff: one more manual row.
  - Confidence: HIGH — mirrors the 7.4 pattern.
  - Blind spot: None significant.
- **Decision**: FIXED

### F6 — PRD FR-009 left unedited; Martynka-urzadza.md edited

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: A-7, Phase 7
- **Detail**: scope.md § 1 asks only for `Martynka-urzadza.md` (S-05 narrator section); phase 7.1 edits both lines
  (9 and 158). FR-009 in `context/foundation/prd.md` is left to `/10x-prd` with `[human]` row 7.4 and a follow-up —
  consistent with CLAUDE.md "never hand-write files in `context/`". Accepted as planned.
- **Decision**: ACCEPTED

### F7 — Phase 4 has no automated proof of "hint once" before phase 9

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4, row 4.3
- **Detail**: the once-per-load decision lives in `UIScene` glue; a pure helper would make it unit-testable, but the
  plan records the gap honestly and phase 9 closes it. Drivers checked: phases 1, 2, 3, 5 `tdd` (absent pure rules with
  failing tests), 4, 6, 7 `impl` (UI glue/docs), 8, 9 `e2e` after the seam sweep (phase 7), features built in 6 and 4,
  `E2E=on` — all correct.
- **Decision**: ACCEPTED (recorded in `## Known risks`)

VERDICT: PROCEED — the approach holds against the code (rng alignment, no post-pick skill change, v4-derivable "first round done", safe welcome re-entry); two self-contradicting test contracts and three gaps fixed in plan.md.
