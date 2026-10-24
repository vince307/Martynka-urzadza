# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-implement` step, phase 3, of run 2026-10-24-audit-backdrop-fox: `SalonBackdrop` records what it drew and both owner scenes redraw on `Renderer.Events.RESTORE_WEBGL`. Rows 3.5 and 2.4/1.5 e2e parts are the orchestrator's; do not tick them.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | phase 3 commit 706a01b, plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged |
| `## Progress` rows | 3.1-3.4 ticked with 706a01b; 3.5 left (e2e part is the orchestrator's); 1.5, 2.4 left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/SalonBackdrop.ts` | `BackdropSnapshot`, `BackdropCause`, `snapshot()`, `pixel()`, `render(..., cause)` counts and warns on `restore` |
| `src/scenes/TaskScene.ts` | `RESTORE_WEBGL` listener (`onRestore`), `off` at shutdown, `refreshBackdrop(cause)`, `backdropPixel()`, `TaskSnapshot.backdrop: BackdropSnapshot` |
| `src/scenes/WelcomeScene.ts` | same listener, `refreshBackdrop`, `backdropState()`, `backdropPixel()` |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `backdropPixel` getter (e2e build only), grown `Snapshot.backdrop` |
| `tests/phaserLoaderPin.test.ts`, `tests/backdropRestoreWiring.test.ts` | Phaser 4.2.1 restore pin (4 cases) and source guards (6 cases) |

## 3. Verification

| command | result |
|---|---|
| deliberate breaks: delete TaskScene `off`; delay WelcomeScene redraw; change pin event string | each red (wiring, wiring, pin); restored. Meta: source guards and a Phaser-source pin; on-screen redraw is proven by phase 5 e2e |
| lint, typecheck, `npm test` + deploy scripts + sample E1-E6, build | green; unit 3915 (baseline 3905 after p2, +10); `e2e hook: absent (2 chunks checked)` |
| `grep restorewebgl src`; `git diff --stat main -- save.ts fixtures e2eHookGuard.mjs` | both empty |
| e2e | not run (orchestrator) |

## 4. Next command

`/10x-implement audit-backdrop-fox phase 4`

## 5. Open

- Phases 4-6 per plan. Manual rows 4.7-4.10 unchanged. `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **I-3 Wiring guard for `off`** checks only that a 'shutdown' string precedes the `off` call (cheap source guard). Would change: parse the block if it proves too weak.
- **I-4 `pixel()` reads the texture centre** (width/2, height/2); null under Canvas per plan P-2.
- **I-1 Both breaks live in one test case** (constructor/record/no-per-pose), so each break turns that one case red rather than two separate cases. Would change: split if a reviewer wants separate cases.
- **I-2 Row 2.4 left unticked**: includes the e2e baseline run by the orchestrator.
