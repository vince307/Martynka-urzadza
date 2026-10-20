# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 1 (`/10x-tdd`, test-first) is committed as e6a0b43: `src/core/bootLimits.ts` now counts visible time only (hidden-span record plus hidden-aware `bootLimitDue`/`bootLimitWait`); `BootScene` is not wired yet (phase 2).

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | 6 (4 docs, `test(audit-boot-hidden-tab): Boot limits count only visible time (p1)` e6a0b43, this handoff/progress docs commit) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is set by the skill only if edited; unchanged here (`plan_reviewed`) |
| `## Progress` rows remaining | 40 (phase 1 rows 1.1–1.4 ticked with e6a0b43) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/bootLimits.ts` | `HiddenSpan`, `noHidden`, `startHidden`, `endHidden`, `hiddenMsAt`; `bootLimitDue(schedule, wall, hiddenMs = 0)`, `bootLimitWait(at, wall, hiddenMs = 0)` |
| `tests/bootLimits.test.ts` | rewritten hidden-minute case, never-earlier, hidden wait, 3 hidden-span cases |
| `context/changes/audit-boot-hidden-tab/plan.md` | rows 1.1–1.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stubs ignoring hidden time, so an assertion failure, not an import error) | `AssertionError: expected 'cut' to be 'slow'` (hidden-minute case, old assertion inverted); also `expected 1 to be 40000` (wait), `expected +0 to be 15000` / `20000` (span); 4 failed, 6 passed |
| GREEN | `npx vitest run tests/bootLimits.test.ts`: 10 passed |
| Deliberate break 1 | `bootLimitDue` ignores `hiddenMs`: hidden-minute case red; restored |
| Deliberate break 2 | a second hide resets the span start: idempotence case red; restored. Meta-check: the rewritten case fails on the old code (it is the old assertion inverted) |
| Gate | lint OK; typecheck OK; unit 3683 + 5 = 3688 passed; deploy scripts OK; sample E1–E6 OK; build OK, prints `e2e hook: absent (2 chunks checked)`; e2e: left to the orchestrator (`<baseline 141> + 0` expected) |
| grep 1.3 | only `src/scenes/BootScene.ts` besides `bootLimits.ts` |

## 4. Next command

`/10x-implement audit-boot-hidden-tab phase 2`

## 5. Open

- Phase 2 (impl): `BootScene` own `visibilitychange` listener, lifecycle per plan "Critical Implementation Details"; `hiddenMs` in `bootLoad`, hook, layout doc. Valid e2e break (phase 8): pass `hiddenMs` 0 to the rule.
- BootScene call sites still use the 2-argument forms (defaults keep them compiling).
- Manual rows unchanged: 2.6 [human], 3.5, 5.4, 6.5 [visual], 2.5, 3.4, 7.5 [reviewer].
- e2e part of the phase-1 gate not run by this step.

## 6. Autonomous decisions

- D-1 **Driver stays `tdd`**; implementation did not exist (only the old wall-clock rule). Would change: nothing.
- D-2 **Stubs first** (exported functions ignoring hidden time) so RED is an assertion failure; real code replaced them after RED.
- D-3 **Commit set**: only `bootLimits.ts` and its test; plan/handoff in a follow-up docs commit. Skill prompts (manual gate, commit message, next phase) decided in place: accepted proposed message, stop after this phase.
- D-4 **Extra tests** beyond plan: "never earlier because of hidden time" as a table over wall values; `bootLimitWait` hidden case. Would change: none.
