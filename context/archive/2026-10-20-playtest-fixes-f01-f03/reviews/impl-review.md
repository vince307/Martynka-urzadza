<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Playtest fixes F-01..F-03

- **Plan**: context/changes/playtest-fixes-f01-f03/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-10-20
- **Verdict**: APPROVED (after the F1 fix)
- **Findings**: 1 critical (fixed) 2 warnings 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed in 3dd6bdf) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Suites re-run by the reviewer (baseline main 64fd3ea: unit 3656, e2e 139)

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK (on 1d0a24c and again on 3dd6bdf) |
| `npm test` + deploy scripts + `sample` E1-E6 + `npm run build` | 3682 passed = 3656 + 26 (variety 5+, warmup, longPress 4, narratorVoice 1, ageBack 7, layout 1); scripts OK; sample exit 0, 0 violations each; `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> tests/e2e/first-launch.spec.ts tests/e2e/parent-settings.spec.ts` | 12 passed (7 + 5) |
| full e2e `--workers=4` on 3dd6bdf (product code unchanged, a spec changed) | 141 passed (12.0m) = 139 + 2, 0 flaky |
| `--list` total | 141 tests = 139 + 2 |

## Deliberate breaks re-executed

| break | expected | observed |
|---|---|---|
| `pickVariedSkills`: `open = pool` (cap filter dropped) | variety tests red | 3 red: synthetic `[A1,A2,B1]` "expected [5] to deeply equal [2,3]", three types "3 <= 2", real curriculum replay oracle (b) "E1.1 seed 1 draw 4"; restored |
| `longPress`: a drifted press reports `tap: true` | drift case red | "a press that drifted past the tolerance is not a tap" red; restored |
| `backToAge` without `flush('now')` (p8's untested break) | spec #12 "Wróć" red | BEFORE the fix: red 1 of 3 runs (E3 instead of E5 after the reload), green 2 of 3 -> the spec survived the named break -> F1. AFTER 3dd6bdf: red 3 of 3 at the new `save.dirty` assertion on the welcome screen; restored, green 3 of 3 |

## Teacher read (CLAUDE.md Working rules, rows 1.6, 3.5, 4.7)

- `npm run sample -- E1..E6 --count 6`: exit 0, "Naruszenia: 0" in all six. No generator, curriculum, word template or noun changed (`git diff main -- src/core/tasks src/data/curriculum src/data/wordTemplates.ts src/data/nouns.ts` empty), so the printed tasks are the ones main prints; E1 and E2 read through: agreement, accusative and hints as before.
- Round print (one-off script in `$TMPDIR`, not committed): 5 `buildAdaptiveRound` rounds per stage at a mid step (E1.6, E2.5, E3.6, E4.4, E5.6, E6.6) plus a count over 500 seeds per stage. Read as a teacher: every round mixes kinds (e.g. E3: place value, clock, ruler, jugs; E6: addition, elapsed time, complement, calendar); 3 of one kind appear only where the current step has one kind (E1.6 even/odd, E2.5/E5.6/E6.6 addition and subtraction), and then they are spread `A x A x A`, never next to each other; neighbours of one kind with at most 3 of it: 0 of 3000 rounds. Rounds stay mostly on the current step (3 of 5 in the samples). Verdict: PASS.
- `pl.ts`: "Przytrzymaj, żeby otworzyć ustawienia rodzica" (comma before "żeby", imperative, exactly the maintainer's wording) and "Wróć": correct. The `balance.ts` comments are English and say what the code does.

## Scope fidelity (scope.md § 1)

- F-01: `balance.narrator.autoReadStages` = `[]`; `effectiveAutoRead` unchanged, the parent's `true` still wins (pinned in `tests/narratorVoice.test.ts`, e2e parent-settings auto-read case green).
- F-02 a: gear at `alpha: 1` in the speaker button colours; hint text from `pl.settings.hint`, exact; `holdMs` 2000 / `moveTolerance` 30 / the gate unchanged; hint once per page load (`REGISTRY_KEYS.settingsHintShown`, not in `SAVE_KEYS`).
- F-02 b: `ageBackOffered` (warm-up and first ordinary round, child-placed learner); `backToAge` never calls `advance`/`finishRound`/`countRound`/`applyRound`; stars kept (e2e asserts 1 before and after, also after a reload).
- F-03: cap 2 and the no-neighbour reorder in ordinary rounds and the warm-up; relaxed only when the rolled pool has no other type; bucket per draw identical to `pickRoundSkills` for the same seed (oracle (a)), unlock threshold and art filter untouched.
- Save format: `git diff main -- src/core/save.ts src/core/migrations tests/fixtures` empty, `SAVE_VERSION` 4.
- Hooks: no bypass found (`.claude/settings.json` and `.claude/hooks/*` last modified 2026-10-10..12, before the run; no `--no-verify` trace).

## Findings

### F1 — Spec #12 "Wróć" survived the removal of `flush('now')`

- **Severity**: ❌ CRITICAL (fixed)
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/first-launch.spec.ts (test "#12 \"Wróć\" returns to the age choice …"); product side `TaskScene.backToAge`
- **Detail**: Row 8.1 named the break "`backToAge` without `flush('now')`"; phase 8 did not run it ("the debounce would hide it"). Re-run here: green 2 of 3 — the reload barrier `save.dirty === false` is also reached by the debounced write 500 ms later. A spec that survives the break named for it does not prove the flush.
- **Fix**: assert `save.dirty === false` right after the welcome screen shows (a `flush('now')` clears `dirty` synchronously when its write starts; the debounce keeps it true for 500 ms). Red 3/3 under the break, green 3/3 without it.
- **Decision**: FIXED in 3dd6bdf

### F2 — The e2e save barrier `dirty === false` does not mean "written"

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (test reliability)
- **Location**: tests/e2e/first-launch.spec.ts (the two `expect.poll(... save?.dirty).toBe(false)` before `page.reload()`); `src/core/autosave.ts` `attempt` (sets `dirty = false` before `await store.write`)
- **Detail**: `dirty` turns false when a write STARTS. A poll that lands while the IndexedDB write is in flight lets the reload cut the write; the red run under the flush break (stored E3 instead of E5) is that race. Without the break the window is a few ms per poll, never seen in the orchestrator's full runs nor in 5 runs here, so it is a latent flake, not a product bug (the product flushes on `pagehide`/`visibilitychange` as before).
- **Fix A ⭐ Recommended**: expose a runtime-only `writing` (inflight) flag in `AutosaveStatus` and wait for `!dirty && !writing` in a shared e2e helper.
  - Strength: an exact barrier for every reload spec.
  - Tradeoff: touches `autosave.ts` and the status type (runtime only, save format unchanged) — out of this slice's scope.
  - Confidence: MED — the status object is compared whole in some unit tests.
  - Blind spot: other specs that reload after `dirty` false.
- **Fix B**: keep as is and watch for a flake at the reload of this spec.
- **Decision**: DEFERRED to follow-ups/review-fixes.md (Trigger recorded)

### F3 — An early draw can use a type slot that a later one-type current draw then exceeds

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence (D-3 accepted behaviour)
- **Location**: src/core/round/variety.ts `pickVariedSkills`
- **Detail**: The cap is applied in draw order. E2 at step 5, seed 1: an earlier-bucket draw picks ADD_SUB, then the one-type current step (E2.5, ADD_SUB only) is rolled twice, giving 3 ADD_SUB although the earlier draw had other types. Within the plan's oracle (b) and D-3 (keep the rng stream and shares), and the reorder still avoids neighbours; a two-pass pick (current draws first) would remove it but changes which skills are drawn per seed.
- **Fix**: none now; follow-up with a trigger.
- **Decision**: DEFERRED to follow-ups/review-fixes.md

### F4 — `balance.round` comment carries a stray "; //"

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/balance.ts `balance.round`
- **Detail**: "… always on; // artRetries: …" — two comments glued into one line.
- **Fix**: join with a plain "; " at the next edit of the line.
- **Decision**: RECORDED

### F5 — Gear and hint colours are literal copies of existing tokens

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts `HUD_LAYOUT.settings`, `HUD_LAYOUT.settingsHint`
- **Detail**: `0xfffdf2`, `0xd3b77d` (speaker), `0x397f73` (`nextBorder`), `0xfff0b9`/`0xd9bd73` (`hint`/`hintBorder`) are the existing values, written as literals like the speaker entry next to them. No new colour.
- **Fix**: none (matches the neighbouring entries).
- **Decision**: RECORDED

### F6 — The `SV2-10` one-off failure after p3 is the known load flake

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/child-flow-guards.spec.ts #2 SV2-10
- **Detail**: Profile § 8 (run 2026-10-16-audit-sweep) already lists `child-flow-guards.spec.ts` #2 as a load flake, green alone. The test plays a daily puzzle (a variant round), which neither the variety picker nor the gear/narrator changes touch; green alone 3/3 and in every later full run. Judged a flake, not a race of this change.
- **Decision**: RECORDED

### F7 — Seams checked, no drift

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/core/longPress.ts, src/core/roomGesture.ts, src/core/round/warmup.ts
- **Detail**: `longPress` grew `tap` only (the `fire` contract unchanged); `roomGesture` reads `state`/`fire` and ignores `tap`; `buildWarmup` kept its positional parameters and gained an optional trailing `variety` (callers compile unchanged); one tally map, no duplicated helper between `pick.ts`, `variety.ts` and `warmup.ts`; `variety.ts` imports no Phaser (ESLint boundary green). `backToAge` follows the plan's exit order exactly (row 6.5).
- **Decision**: RECORDED

MERGE: CLEAR — the one CRITICAL (spec #12 survived the flush break) is fixed in 3dd6bdf, every criterion met, all suites green (unit 3656 + 26, e2e 139 + 2), save format v4 untouched; the two warnings are follow-ups.
