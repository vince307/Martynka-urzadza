# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 5 (service-worker status reducer and registration signal) written by `/10x-tdd` in run `2026-10-16-fix-stale-tab-health`; code commit `aed4d29`. The next agent must not get wrong: nothing reads `REGISTRY_KEYS.swStatus` yet (the panel line is phase 6, browser proof phase 12); `SwStatus` carries three bookkeeping fields beyond the plan contract.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `66f1186` (p4 fix), `aed4d29` (p5 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.4 (orchestrator e2e), 5.5 [reviewer], 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 6-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/swStatus.ts` | `SwStatus`, `SwEvent`, `initialSwStatus`, `stepSw` (pure; extra fields `hadController`, `active`, `tracking`; failed-update error name `InstallFailed`) |
| `tests/swStatus.test.ts` | 9 reducer tests |
| `src/pwa/registerServiceWorker.ts` | `registerServiceWorker(onStatus)`; translates register/updatefound/statechange/controllerchange; listener errors swallowed; rejection logs the name only |
| `src/main.ts`, `src/data/layout.ts` | last status kept until the game exists, then `REGISTRY_KEYS.swStatus` (runtime only) |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | read-only snapshot `sw` {phase, error, takenOver} |
| `src/pwa/installHint.ts` | F4: `dismiss` removes the `beforeinstallprompt` listener |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub reducer returning status unchanged) | `AssertionError: expected { phase: 'registering', …(2) } to deeply equal { phase: 'installing', …(2) }` (8 of 9 red) |
| GREEN | `npx vitest run tests/swStatus.test.ts`: 9 passed |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3122 = branch baseline 3113 + 9 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `seed.spec.ts` (single spec, sandbox off) | 1 passed; full suite is the orchestrator's |
| Deliberate break 1 | tracked-id check disabled (`if (false)`): "a worker replaced by a newer installing one is not a failure" red; restored |
| Deliberate break 2 | `controllerChange` ignoring `hadController`: "marks takeover only when the page had a controller" red; restored |
| Meta-check | proves the decision on events, not that Chromium emits them in that order (phase 12) |

## 4. Next command

`/10x-implement stale-tab-and-health phase 6`

## 5. Open

- Rows: 5.4 e2e (orchestrator; watch `seed.spec.ts`, every spec reloads through `registerServiceWorker`), 5.5 [reviewer]; 4.4, 3.5, 2.5, 1.6 [reviewer].
- Not unit-tested: the `installHint` listener removal (F4, no DOM test pattern) and the browser event translation (phase 12).
- Carried: [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAPs 118-121 later; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Reducer fields beyond the contract**: `hadController`, `active`, `tracking` live in `SwStatus` (needed for takeover, active-worker and replaced-worker rules); rejected a separate state object. Tests assert only phase/error/takenOver.
- **Error name for a failed install** is the constant `InstallFailed` (the browser gives no name); a successful `activated` clears it.
- **`register` event is emitted synchronously** (before `load`) so `hadController` is read at start as the plan says.
- **No unit test for `installHint`** (no DOM harness); recorded here instead.
- Driver kept `tdd`; the wiring (registration, main, hook, installHint) was done inline after GREEN.
- Row 4.2 ticked with the orchestrator gate result as instructed. Commit message taken as proposed (Polish).
