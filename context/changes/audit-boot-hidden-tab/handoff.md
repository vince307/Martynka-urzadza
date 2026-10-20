# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 2 (`/10x-implement`) is committed as 2e67a1d: `BootScene` has its own `visibilitychange` listener and the boot limits count visible time; `bootLoad` carries `hiddenMs` (registry, hook, layout doc). Phase 1 is e6a0b43.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phase 1 e6a0b43, phase 2 2e67a1d, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 37 (rows 1.1–1.4 and 2.1–2.3 ticked; 2.4 left open for the e2e row) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/BootScene.ts` | `hidden` span field seeded from `document.hidden`; `cutNow`, `armSlow`, `armCut`, `onVisibility`, `dropListener`; `arm` and the cut guard use `hiddenMsAt`; `publish` adds `hiddenMs`; cut warning prints hidden ms |
| `src/data/layout.ts` | `REGISTRY_KEYS.bootLoad` comment lists `hiddenMs` |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `bootLoad` snapshot carries `hiddenMs` (hook build only) |

## 3. Verification

| command | result |
|---|---|
| lint, typecheck | OK |
| unit | 3688 passed (phase-1 baseline 3688 + 0; no scene unit test possible) |
| deploy scripts, sample E1–E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| grep 2.1 | one `addEventListener`, one `removeEventListener` of `visibilitychange` in BootScene; `src/main.ts` unchanged |
| grep 2.2 | `git diff main -- src/core/save.ts src/core/migrations tests/fixtures` empty |
| Deliberate break (2.3) | no unit test sees the scene listener; the proof is phase 8's e2e. Its valid break: `cutNow` and `arm` pass `0` instead of `hiddenMsAt(this.hidden, wall)` (no subtraction) -> red. Dropping only the clear-on-hide is NOT a valid break (A-2). Not run here (browser spec does not exist yet) |
| e2e | left to the orchestrator: `<branch e2e baseline> + 0` (stallall specs of `load-and-tab-guard.spec.ts` must stay green) |

## 4. Next command

`/10x-tdd audit-boot-hidden-tab phase 3`

## 5. Open

- Row 2.4 stays open until the orchestrator's e2e run; 2.5 [reviewer], 2.6 [human] not mine.
- Other manual rows unchanged: 3.5, 5.4, 6.5 [visual]; 3.4, 7.5 [reviewer].
- Phase 8 e2e needs the visibility fake and the `hiddenMs` break above.

## 6. Autonomous decisions

- D-1 **Driver stays `impl`** per plan. Would change: nothing.
- D-2 **Page starting hidden** arms no timer; the first show arms both (plan Critical Implementation Details). Would change: nothing.
- D-3 **Commit message / next-phase prompts** decided in place: proposed message accepted, stop after phase 2.
- D-4 **Break not run in a browser**: no spec exists before phase 8; steps recorded in §3.
