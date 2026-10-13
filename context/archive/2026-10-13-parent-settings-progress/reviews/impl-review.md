<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Ustawienia rodzica — zmiana etapu, auto-czytanie i podgląd postępów za bramką

- **Plan**: context/changes/parent-settings-progress/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after the fixes in 4388673)
- **Findings**: 0 critical, 3 warnings (all fixed), 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS (F1 fixed) |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F6, observation-level) |
| Success Criteria | PASS |

## Verification observed in this review

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | clean (before and after the fix) |
| `npm test` (vitest) | 60 files, 948 passed = baseline 881 (main bfbd18a) + 67; phase deltas p2 +21, p3 +8, p4 +14, p5 +23, p7 +1 = 67, consistent |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | pass |
| `npm run sample -- E1` … `E6` | all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (one plain command; Chromium started) | 18 passed = baseline 15 + 3 (`parent-settings.spec.ts`), before the fix and again after 4388673 |
| `validate-rule-files.sh` | PASS, 137 paths (after the AGENTS.md fix) |
| Deliberate break (tdd, phase 5): `progressView` candidates by `!h.ok` instead of `!h.firstTry` | red: `tests/progress.test.ts` "a second-try answer is a first-try miss…" `expected [] to deeply equal [ 'E3.1.word_20' ]`; restored |
| Deliberate break (e2e, phase 10 / plan-review F1): `main.ts` `createInputSuspender(..., () => undefined)` (no pointer reset on release) | red: `parent-settings.spec.ts` test 1, `phaseIs` Expected "done", Received "first" (spec line 71, the tap after "Anuluj" no longer reaches the round); restored. Meta-check: the unit suite cannot see this (the reset lives in `main.ts`), so the spec is the only guard and it holds |
| Hook bypass | none found: no `--no-verify`, hooks and `.claude/settings.json` untouched by the branch (gitignored, no edits reported or seen) |
| DB / migrations / write endpoints / external identifiers | skipped: none exist in this project (profile § 4) |

## Focus areas

1. **Input suspender (plan-review F1).** `createInputSuspender` releases each handle once and calls `onRelease` before
   `target.enabled = true`; `main.ts` resets every pointer on release. Holders: `UIScene.openSettings` (gate → panel,
   one hold; confirm, cancel, Escape, unknown stage, shutdown all go through `closeSettings`; double open blocked by
   `releaseInput`), `WelcomeScene.openParent` (cancel/Escape `resume`, confirm `start()`, shutdown `resumeInput`),
   `mountInstallHint` (`dismiss` twice is safe). The rotate overlay is CSS-only and holds nothing (acceptable: it covers
   the canvas in portrait). Re-proven by the e2e break above.
2. **Long press.** `balance.parentSettings` 2000 ms / 30 px, `>=` on time, `>` on Euclidean drift; second finger → idle;
   fires once (`fired` state, then `hold = IDLE` in `openSettings`); time from `this.time.now` on both `down` and `tick`.
3. **`applyParentStage`** (row 6.6): same-stage guard in both `UIScene.applySettings` and `TaskScene.applyParentStage`;
   `sessionStars += state.starsEarned` before `freshRound()`; no `scene.restart`; `onParentStage` skips a sleeping scene;
   `onWake` calls `applyParentStage(false)` (no auto-read); `changeStageByParent` clears `warmupPending`, `pendingUnlock`,
   `weakStreak`, `easedRounds`. No numbers or player text in scenes.
4. **`effectiveAutoRead`**: parent's choice wins, else `defaultAutoRead(stage)`; `TaskScene.autoRead` is a getter read at
   use; panel default follows the stage picked in the panel.
5. **`progressView`**: current step via the shared `currentStep`; candidates only from the current stage with ≥ 1
   first-try miss; `weakestCount` 3, `examplesPerSkill` 2; empty state rendered. All DOM text through `textContent`
   (no XSS path for prompts or the child's answers).
6. **Design gaps 25–28** are in `docs/design-gaps.md` and cited in code; `follow-ups/review-fixes.md` entries all carry
   `Trigger:` lines (now 10).

## Teacher read (rows 7.5, 8.4)

Read every string of `pl.settings` and the rendered preview for fabricated learners on E1, E3 and E5 with first-try
misses on 3–4 skills (real generator prompts: COMPARE_EXPR "10 − 6 □ 1 + 5", CALENDAR months, MISSING_OP, HALF,
ROMAN, DIV, quarters, word problems). Titles ("Ustawienia rodzica", "Czytanie poleceń na głos", "Włączone"/"Wyłączone",
"Postępy", "Do poćwiczenia", "Krok 2 z 8: …", "opanowanie 0 z 5") are natural, no nouns needing agreement, nothing
harsh. One defect: the example line ended in the adverb "poprawnie: 8" ("correctly: 8"); a parent reads
"odpowiedź dziecka: 9, poprawna: 8" (adjective agreeing with "odpowiedź") as the natural form → fixed (F2). The
empty-state sentence is correct Polish (F7 observation on its meaning).

## Findings

### F1 — Undocumented AGENTS.md rule edits in phase 9

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: AGENTS.md (Critical rules list), commit e3f57e7
- **Detail**: Phase 9 planned a CLAUDE.md update only. AGENTS.md got the planned-in-spirit structure line, but also two unrelated rule rewordings: "Phaser 4 differs from v3; check its docs." lost "check its docs" (contradicting CLAUDE.md), and the `docs/zrodla/` rule was shortened.
- **Fix**: Restore both rule lines verbatim, keep the structure-line addition.
- **Decision**: FIXED in 4388673

### F2 — Progress example ends with "poprawnie:" instead of "poprawna:"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (teacher read)
- **Location**: src/data/pl.ts `pl.settings.example`
- **Detail**: "… — odpowiedź dziecka: 9, poprawnie: 8" uses the adverb; the parent-facing form is "poprawna: 8" (agrees with "odpowiedź"). Not wrong enough to mislead, but visible to every parent who opens the preview.
- **Fix**: `poprawna: ${answer}`. The e2e spec asserts only the "odpowiedź dziecka: 4," prefix; suite stays 18/18.
- **Decision**: FIXED in 4388673

### F3 — Duplicated DESIGN-GAP comment

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency (seam)
- **Location**: src/ui/widgets/SettingsIcon.ts class JSDoc
- **Detail**: The phase 9 seam sweep re-added the "rows 25 and 28" DESIGN-GAP line that phase 7 already had; two identical lines.
- **Fix**: Delete one copy.
- **Decision**: FIXED in 4388673

### F4 — `beforeinstallprompt` listener outlives the install hint

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/pwa/installHint.ts `mountInstallHint`
- **Detail**: Pre-existing (S-01): after dismissal the listener still calls `preventDefault()`. S-08 only added the suspend/release.
- **Fix**: Remove the listener in `dismiss`.
- **Decision**: FOLLOW-UP (review-fixes.md, Trigger: the next change to src/pwa)

### F5 — Long press not reset when another overlay suspends input

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/UIScene.ts `openSettings` / `feed`
- **Detail**: Plan phase 7 said "reset on sleep/shutdown and on every suspension"; only shutdown and own `openSettings` reset. Unreachable today (the install hint precedes the HUD; UIScene never sleeps).
- **Fix**: Feed `{ type: 'reset' }` on every suspension once a second overlay can open over the HUD.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F6 — Unchecked suspender cast in WelcomeScene

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/WelcomeScene.ts `openParent`
- **Detail**: Casts the registry value without the `undefined` guard used in `UIScene.openSettings`. `preBoot` always sets it, so no runtime risk.
- **Fix**: One style in both scenes.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F7 — Empty-state wording for a child with no mistakes

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (teacher read)
- **Location**: src/data/pl.ts `pl.settings.empty`
- **Detail**: "Za mało odpowiedzi z błędami. Zajrzyj tu po kilku rundach." also shows after many clean rounds. Correct Polish, planned text, but may read as "no data".
- **Fix**: A separate "no mistakes yet" line once S-11 keeps long histories.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F8 — Several weak rows can share one step title; interrupted round not recorded

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/progress.ts `progressView`; src/scenes/TaskScene.ts `applyParentStage`
- **Detail**: Seen in the teacher read (E3: "Zegar 24-godzinny, cyfry rzymskie…" twice, told apart only by the examples). Both behaviours are planned decisions ("What We're NOT Doing": no `SkillDef.label`, no partial-round mastery) and listed for the maintainer in row 9.8.
- **Fix**: None now; row 9.8 [human] decides.
- **Decision**: ACCEPTED (planned)

### F9 — Undocumented e2e drift of 40 px instead of 60 px

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/parent-settings.spec.ts `DRIFT`
- **Detail**: Plan phase 10 said 60 px; the spec uses 40 px. 40 px is better (60 px leaves the 96 px icon, so `pointerout` would cancel and the 30 px rule would go untested). Second finger cannot reach the reducer in-game (`activePointers` 1, zone only on the gear) — the core rule is defensive.
- **Fix**: None; recorded here.
- **Decision**: ACCEPTED

MERGE: CLEAR — no critical findings; three warnings fixed in 4388673 with the full local gate green again (unit 881 + 67, e2e 15 + 3, build hook-free), both deliberate breaks re-executed red, teacher read passed after the fix.
