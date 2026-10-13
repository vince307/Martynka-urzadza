# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-implement` phase 5: the DOM adult gate, the parent stage panel and the „Rodzic” entry on the welcome are committed (`012867b`). The next agent must not miss: e2e could not run in this session (MachPort), so the orchestrator must run `npx playwright test` on `012867b` (expected: 8 passed, no new spec) before phase 6.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 5 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/dialog.ts` | `openDialog(parent, title, body, onEscape, onKey?)`: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus on the first button, Tab trapped, Escape, focus returned on close; returns `{ dialog, close }` |
| `src/ui/dom/parentGate.ts` | `openParentGate({ rng, onPass, onCancel, parent? })` returns the close function; challenge from `core/parentGate`, digit pad 0-9 + „⌫” + „OK” + „Anuluj”, readout `aria-live="polite"`, keyboard digits/Backspace/Enter/Escape; wrong answer = new problem + calm message + cleared field, no counter, no lockout; the answer lives only in the closure (no attribute, no hook field) |
| `src/ui/dom/stagePanel.ts` | `openStagePanel({ month, onConfirm, onCancel, parent? })`: ages from `placementData.ages`, stages E1-E6 with `pl.stages`, age choice marks the proposal (`proposeStage`) and preselects it unless the parent already picked a stage, `aria-pressed`, „Zatwierdź” disabled until age and stage are set, result `placeByParent` |
| `src/scenes/WelcomeScene.ts` | „Rodzic” `PageButton` (secondary) -> `input.enabled = false` -> gate -> panel -> `registry.learner` -> Task; cancel on either restores `input.enabled = true`; dialog closed on scene shutdown; `targets()` has `parent` |
| `src/data/layout.ts`, `pl.ts`, `src/style.css` | `WELCOME_LAYOUT.parent` (1596,922, 260 x 110) + `WELCOME_TOUCH_TARGETS.parent`; `pl.parent`, `pl.stages`; `.overlay-parent`, `.parent-*` styles with `--parent-*` tokens on `:root`, buttons >= 64 CSS px, `:focus-visible` |
| `src/testing/e2eHook.ts` | welcome `targets` = `{ ages, parent }`; nothing about the gate |
| `tests/layout.test.ts` | +1: parent button is a touch target, inside the screen, below the age buttons |
| `context/changes/first-launch-placement/plan.md` | rows 4.2, 4.3, 5.1, 5.2, 5.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | clean |
| `npm test` | 765 passed in 53 files (baseline 671; delta +94 = p1 +71, p2 +11, p3 +8, p4 +3, p5 +1) |
| deploy + ops shell tests; `sample -- E1..E6` | ok; `Naruszenia: 0` x6 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)`; `grep -rl e2eMonth dist/` empty |
| Break: „Rodzic” height 110 -> 90 | `tests/layout.test.ts`: `expected 90 to be greater than or equal to 96`; restored. Meta-check: proves the size constant only; that input is off under the dialog is proved by the e2e of phase 9 |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, all browser launch failures) |

Orchestrator: run `npx playwright test` on `012867b` (expected 8 passed). No browser check of the dialogs was done; the `[visual]` row 5.6 needs gate/panel screenshots at 1440x900 and 1024x768 (welcome with „Rodzic”, gate, gate after a wrong answer, panel without age, with age, with another stage).

## 4. Next command

`/10x-implement first-launch-placement phase 6`

## 5. Open

- Row 5.3 (`npx playwright test` green) open for the orchestrator. `[reviewer]` 5.5 (teacher read of `pl.parent`, `pl.stages`: „Ile to jest 14 · 17?”, „To nie ta liczba. Spróbuj z nowym działaniem.”, „Ustawienia startowe”, „Wiek dziecka”, „Etap nauki”, „(propozycja)”, „Zatwierdź”, age „10+”), `[visual]` 5.6 and `[human]` 5.7 not done here; earlier `[reviewer]` 1.4, 2.5, 4.6 and `[visual]` 4.7 unchanged.
- DESIGN-GAP: parent entry, gate and panel are not in the kit; code comments in `layout.ts` and `pl.ts` name them; the row in `docs/design-gaps.md` belongs to phase 7 (with the sunflower/cushion row).
- Gate dialog uses a seed from `Math.random()` in `WelcomeScene.openParent` (no determinism needed; the e2e of phase 9 must read the problem from the DOM text).
- The panel does not yet start the warm-up (phase 6 handles `warmupPending`; the parent path yields it false when the stage was overridden).

## 6. Autonomous decisions

1. Shared `openDialog` helper in `src/ui/dom/dialog.ts` (focus trap, Escape, restore focus) instead of duplicating it in the two dialogs; the plan lists two modules, this is a third small one.
2. Both dialogs append to `document.body` by default (`parent` option for tests); styles use `--parent-*` custom properties on `:root`, because the existing overlays use literals and the brief asks for tokens.
3. Stage choice is not reset by a later age choice once the parent picked a stage by hand (`stageChosenByParent`); the proposal tag still follows the age.
4. Age 10 is shown as „10+” through `pl.parent.ageOption(age, openEnded)` (the last of `placementData.ages`).
5. Plan rows 4.2/4.3 ticked on the orchestrator's evidence (run-log line „S-06 p4 impl”), 5.3 left open.
