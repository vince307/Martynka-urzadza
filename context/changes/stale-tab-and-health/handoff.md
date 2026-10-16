# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Re-dispatch fix (row 4.2) after the orchestrator gate; written by the `/10x-implement` step for phase 4 of run `2026-10-16-fix-stale-tab-health`. Phase 4 (child card) is committed as `e7184c0`. The next agent must not get wrong: the card is not proven in a browser until phase 11 (patch `e2e-break-p11a.patch` removes the mount); `onBlocked` fires only for `newer`/`otherTab` write refusals.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `032adb1` (p3), `b62b3f1` (p3 docs), `e7184c0` (p4 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 4.2 (orchestrator e2e), 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 5-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveRefusedCard.ts` | `mountSaveRefusedCard(parent, onRestart, suspender?)` returns a remove function; holds the input switch via `openInputSession` |
| `src/data/pl.ts`, `src/style.css`, `docs/design-gaps.md` | `saveRefused` copy, `.overlay-save-refused`, row 117 |
| `src/main.ts` | `onBlocked` mounts the card once per page load (`refusedCardUp`), restart reloads |
| `context/changes/stale-tab-and-health/e2e-break-p11a.patch` | break for phase 11 (onBlocked no longer mounts the card) |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3113 = branch baseline 3113 + 0 (no DOM test pattern exists for `saveFailedCard`; plan does not require one) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` | 3 passed (re-dispatch); full suite is the orchestrator's |
| Deliberate break (re-dispatch) | in `e2eSaveStore` the `newer` refusal disabled (`false &&`): spec `#2 P-5` red (`blockedBy` expected newer, received null); restored |
| Deliberate break (p4) | patch written; applied it: `tsc` reports unused `mountSaveRefusedCard` (card cannot mount); restored. No unit test covers the card, proof is phase 11 |
| Meta-check | the break proves only the wiring; unit suite stays green by design (no unit asserts the card) |

## 4. Next command

`/10x-tdd stale-tab-and-health phase 5`

## 5. Open

- Rows: 4.2 e2e (orchestrator), 4.4 [reviewer]; 3.5, 2.5, 1.6 [reviewer].
- Row 4.2: spec fixed (see §6); the parent-panel `saveOff.newer` line is no longer asserted in e2e (the card holds the input, the panel cannot be opened; unit tests cover `offState`).
- `e2eSaveStore` (`src/testing/e2eHook.ts`) still uses `storedVersionNewer` and ignores `mode` (phase 11).
- Carried: [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAPs 118-121 in later phases; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Optional `suspender` third parameter** on the card (contract said `(parent, onRestart)`): the card must hold the input switch; rejected holding it in `main.ts` so the release lives with the card.
- **Restart button only**, no secondary: the plan names one button.
- **No unit test**: no DOM test of `saveFailedCard` exists to mirror.
- **Commit message** taken as proposed (Polish); ticks and handoff in a docs commit.
- **Re-dispatch, row 4.2 (verified root cause)**: the first refusal happens right after the first answered task (the star is a `SAVE_KEYS` change), so the card (plan B-2: card on `newer` and `otherTab`, plan line 348) mounts before "Dalej"; `playTaskRight`'s tap on `next` landed on the card's restart button and reloaded the page ("Execution context was destroyed"). Intended behaviour, not a product defect: no product change.
- **Spec updated, protected rule kept**: `tests/e2e/load-and-tab-guard.spec.ts` #2 now answers one task, expects `blockedBy newer`, the card (`pl.saveRefused.title`, once), stored version stays `SAVE_VERSION + 1` and no further write after a 1.5 s wait. Dropped the settings-panel assertion (cannot be reached under the card). Plan text unchanged (it already said the spec closes/ignores the card).
