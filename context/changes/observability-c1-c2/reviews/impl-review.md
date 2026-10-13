<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Granica błędów, zwalnianie wejścia po wyjątku, stan lektora w ustawieniach i opanowanie bez kary

- **Plan**: context/changes/observability-c1-c2/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after fix a2472cf)
- **Findings**: 0 critical, 2 warnings (both fixed), 4 observations

Autonomous run 2026-10-13-fix-observability: no AskUserQuestion; triage decided in place (contract rule 1). Not applicable (profile § 4): database, migrations, endpoints, external identifiers.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F2 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS (F1 fixed) |
| Success Criteria | PASS |

## Evidence observed in this step

| Check | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (before fix) | 972 passed = baseline 948 + 24 (inputSuspend +5, errorSignal +6, e2eFail +4, e2eHookGuard +8, mastery +1; curriculumEnd 0) |
| unit (after fix) | 974 passed = 948 + 26 (+2 `tests/dialogSessions.test.ts`) |
| deploy scripts, sample E1-E6 | OK, no violations |
| build | `e2e hook: absent (2 chunks checked)`; `grep -rlE "e2eFail|e2e-forced-failure|e2eMonth|__martynkaE2E" dist/` empty |
| e2e (before and after fix, `npx playwright test`, run by this reviewer) | 23 passed = baseline 18 + 5 (error-boundary 4, parent-settings H-6 1); servers 4397/4398 stopped |
| stale wording | `releaseInput`, `a miss = -1`, `rules.loss`, "błąd −1", "obniża" absent from `src/`, `docs/ZADANIA.md`, PRD, CLAUDE.md, AGENTS.md, `Martynka-urzadza.md` |
| hook bypass | none: no `.claude/`, settings or `--no-verify` in the branch history |

Deliberate breaks re-executed here (all restored, tree clean after each):

1. Phase 2 RED meta-check: the old rule re-applied in `recordRound` (`Math.max(0, m − 1)`) → 5 red: "keeps mastery … second-try" (`expected 2 to be 3`), "… retype" (`expected 1 to be 2`), "never lowers mastery" (`seed 1 step 0: expected 1 to be greater than or equal to 2`), "does not go below 0 or above 5", curriculumEnd warm-up (`expected 3 to be 4`). The inverted assertions really fail on −1; the first-RED `NaN` was only the removed `loss` field.
2. Phase 1: `openInputSession.run` without `end()` in the catch → "releases and rethrows the same error when the callback throws" red (`expected false to be true`).
3. E2E (a): `main.ts` without `installErrorBoundary` → error-boundary (a) red at `toBeVisible` of the card (serial: rest skipped).
4. E2E (b): `UIScene` `onConfirm` outside `session.run` → unit 972 green AND error-boundary 4/4 + parent-settings 4/4 green: nothing caught it (F2). After the fix: `tests/dialogSessions.test.ts` red (`expected [ 'onConfirm at line 141' ] to deeply equal []`); a second break (`WelcomeScene` `onCancel: resume`) red on both `onCancel` sites.

## Teacher read (rows 2.5, 4.5, 5.6)

- FR-013 "(seria poprawnych podnosi, błąd zeruje serię) … 3 z rzędu +1, błąd zeruje serię bez odejmowania" and ZADANIA § 1 "3 poprawne z rzędu → +1; błąd zeruje serię, opanowanie nie spada" — clear to a parent and a teacher, match `recordRound` and `balance.mastery`. PASS.
- `pl.errorCard`: "Ups! Gra się zatrzymała." / "Dotknij przycisku, a gra uruchomi się od nowa." / "Zacznij od nowa" / "Wersja …" — calm, no blame on the child, no "błąd"/"awaria", no promise that progress is kept, correct Polish (dopełniacz "przycisku"). PASS.
- `pl.settings.noVoice`: "Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi." — no jargon, correct; it does not say how to get a voice (F6, observation). PASS.

## Reviewer rows 4.6 and 5.7

- 4.6: all 8 dialog callbacks (UIScene 4, WelcomeScene 4) are `session.run(…)` (now pinned by a test); `openInputSession.end` is idempotent (released once); `run` rethrows the same object (not swallowed); the crash handler wraps each step (`mountErrorCard`, suspend, `loop.sleep`) in its own try and `installErrorBoundary` wraps `onFatal` with a re-entry flag; `mountErrorCard` is idempotent; every `forcedFailure` read sits under `__E2E_HOOK__` (main, Boot, Task, UI) and dist is clean. Edge: F3. PASS.
- 5.7: no dead `loss`/`releaseInput`; headers of `inputSuspend.ts`, `mastery.ts`, `e2eHookGuard.mjs` current; DESIGN-GAP 29 (`errorCard.ts`, `style.css`) and 30 (`settingsPanel.ts`) in code and `docs/design-gaps.md`; every follow-up has `Trigger:`. PASS.

## Findings

### F1 — Hard-coded dialog name in the new spec

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/e2e/error-boundary.spec.ts (test "an exception in the parent settings callback …")
- **Detail**: The plan's contract for phase 6 says texts go through `getByRole` with values from `pl`; the spec used the literal 'Ustawienia rodzica'. (`tests/e2e/support/welcome.ts` keeps literals throughout by its own older pattern; left as is.)
- **Fix**: `{ name: pl.settings.title }`.
- **Decision**: FIXED (a2472cf)

### F2 — No suite caught a C-2 wiring regression

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/scenes/UIScene.ts `openSettings`, src/scenes/WelcomeScene.ts `openParent`
- **Detail**: C-2 was a CRITICAL audit finding. Moving `onConfirm` outside `session.run` left unit 972 and all 23 e2e green: vitest proves the release only in `openInputSession`, and in e2e the card holds the input for good, so the leaked hold is invisible (plan Key Discoveries said so; the plan relied on review alone).
- **Fix**: `tests/dialogSessions.test.ts` parses both scene sources with the TypeScript compiler API and requires every `onPass`/`onConfirm`/`onCancel` property to be an arrow whose body is `session.run(…)`, with pinned counts (4 + 4) so it cannot pass vacuously.
  - Strength: cheapest test that fails on the exact regression for all 8 sites, no product change, formatting-proof.
  - Tradeoff: structural, not behavioural; a renamed `session` variable or a new dialog needs the test updated (follow-up Trigger).
  - Confidence: HIGH — two breaks went red, restored green.
  - Blind spot: a behavioural proof would need a hold count in the e2e snapshot (`InputSuspender` change); not worth it while the card is final.
- **Decision**: FIXED (a2472cf)

### F3 — Rejection mapping outside the handler's try

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/errorBoundary.ts `signalOfRejection`
- **Detail**: `String(reason)` throws for a reason like `Object.create(null)`; the listener throws, the browser raises an `error` event and the card still shows (bounded, no loop), but the original reason is not logged.
- **Fix**: run the mapping inside the guarded handler. Follow-up recorded.
- **Decision**: ACCEPTED (follow-up)

### F4 — Different re-open guards in the two scenes

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/WelcomeScene.ts `openParent` (`this.session`) vs src/scenes/UIScene.ts `openSettings` (`this.session?.active()`)
- **Detail**: After a callback throw the welcome path stays blocked; harmless while the card is final.
- **Fix**: align on `active()`. Follow-up recorded.
- **Decision**: ACCEPTED (follow-up)

### F5 — Cosmetic: mis-indented `onPass` body; empty `TaskScene.update` in production

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/UIScene.ts `openSettings`; src/scenes/TaskScene.ts `update`
- **Detail**: the `session.run(() => { … })` body kept its old indentation; `update` is an empty per-frame method after DCE in `dist/` (negligible cost).
- **Fix**: none needed now.
- **Decision**: ACCEPTED

### F6 — No-voice line does not say how to get a voice

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/pl.ts `settings.noVoice`
- **Detail**: Text matches the plan verbatim; a parent may not know a Polish voice is installed in system settings.
- **Fix**: revisit with real feedback (row 5.9). Follow-up recorded.
- **Decision**: ACCEPTED (follow-up)

MERGE: CLEAR — all suites green on a2472cf (unit 948 + 26, e2e 18 + 5), every break re-executed went red, the only coverage gap (C-2 wiring) is now pinned by a test; remaining rows are [visual] 4.7, 5.8 and [human] 2.6, 4.8, 5.9.
