# Handoff — `notebook-polish` (slice fix:notebook-polish)

Written by the `/10x-implement` step of phase 3. Phase 3 is committed as `626cf71`: the child's salon, captured once, blurred on WebGL and washed ivory, behind the notebook on task and welcome. The next agent starts phase 4 (chunky helper and the task controls).

## 1. State

| | |
|---|---|
| Branch | `feat/notebook-polish` |
| Commits | phase 1 `a659097`, phase 2 `b0a0c89`, phase 3 `626cf71`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` unchanged by this step (not edited) |
| `## Progress` rows remaining | 48 (`grep -c '^- \[ \]' plan.md`); rows 3.1-3.4 ticked with `626cf71`, 3.5/3.6 [visual] left |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/backdrop.ts`, `tests/backdrop.test.ts` | `backdropMode(room, state, hasTexture)`, 4 tests (cross-checked with `miniaturePieces`) |
| `src/ui/widgets/SalonBackdrop.ts` | one capture into a `DynamicTexture` at `BACKDROP.scale`, `addBlur` only when `renderer.type === WEBGL`, image at depth -10 plus a 60 % wash; `mode`, `captures`, `destroy` |
| `src/scenes/TaskScene.ts`, `WelcomeScene.ts` | built before `drawNotebook`; TaskScene re-captures at the top of `onWake` when the registry `rooms` object changed |
| `src/testing/e2eHook.ts` | `backdrop: { mode, captures }` in the task and welcome snapshots |
| `docs/design-gaps.md` | row 155 |

## 3. Verification

| command | result |
|---|---|
| `npm run lint` / `typecheck` | OK |
| `npm test` | baseline 3736 + 11 (p1) + 0 (p2) + 4 (p3) = 3751 passed; deploy scripts OK; `sample` E1-E6 exit 0 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| red before | stub returning `'salon'`: 2 of 4 red |
| deliberate break (`backdropMode` ignores `hasTexture`) | "asks for the key RoomView draws first" and "is plain when the scene picture is missing" red; restored, 4 passed |
| meta-check | the predicate is built from `miniaturePieces` of the real `ROOMS` salon, so it is the key `RoomView` draws; the break proves the rule, not the pixels |
| Playwright | not run: Chromium cannot start in the sandbox; the orchestrator runs e2e (expected baseline + 0) |

## 4. Next command

`/10x-implement notebook-polish phase 4`

## 5. Open

- Blur proof NOT done by this step (needs a browser): source says `dt.draw(container)` + `render()` runs the container filter on WebGL (plan review). Rows 3.5/3.6 [visual] must check the backdrop is soft; fallback if hard-edged: remove `addBlur` and set `BACKDROP.scale` 0.125.
- Not verified visually: wash strength, `captures` +1 after a purchase (wired through the `rooms` reference; assumes a purchase replaces the registry `rooms` object).
- `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- `SalonBackdrop.render` takes `rooms` and `currentRoom` from the registry and falls back to the first room's empty state when absent (welcome with no learner).
- The renderer is read as `scene.sys.game.renderer.type` (same object as `scene.renderer`).
- Commit message in Polish accepted as proposed; stopped after the phase; no questions asked (contract rule 1).
