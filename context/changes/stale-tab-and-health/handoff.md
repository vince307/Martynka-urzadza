# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Written by the `/10x-implement` step for phase 4 of run `2026-10-16-fix-stale-tab-health`. Phase 4 (child card) is committed as `e7184c0`. The next agent must not get wrong: the card is not proven in a browser until phase 11 (patch `e2e-break-p11a.patch` removes the mount); `onBlocked` fires only for `newer`/`otherTab` write refusals.

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
| e2e | not run by me (orchestrator gate); `load-and-tab-guard.spec.ts` (`?e2eSave=newer`) may now see the card after a refusal: if it fails, it must close or ignore the card (reload button) |
| Deliberate break | patch written; applied it: `tsc` reports unused `mountSaveRefusedCard` (card cannot mount); restored. No unit test covers the card, proof is phase 11 |
| Meta-check | the break proves only the wiring; unit suite stays green by design (no unit asserts the card) |

## 4. Next command

`/10x-tdd stale-tab-and-health phase 5`

## 5. Open

- Rows: 4.2 e2e (orchestrator), 4.4 [reviewer]; 3.5, 2.5, 1.6 [reviewer].
- If `load-and-tab-guard.spec.ts` fails at the gate, the card (z-index 10, holds input) covers the panel path: close by reload or adjust spec.
- `e2eSaveStore` (`src/testing/e2eHook.ts`) still uses `storedVersionNewer` and ignores `mode` (phase 11).
- Carried: [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAPs 118-121 in later phases; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Optional `suspender` third parameter** on the card (contract said `(parent, onRestart)`): the card must hold the input switch; rejected holding it in `main.ts` so the release lives with the card.
- **Restart button only**, no secondary: the plan names one button.
- **No unit test**: no DOM test of `saveFailedCard` exists to mirror.
- **Commit message** taken as proposed (Polish); ticks and handoff in a docs commit.
