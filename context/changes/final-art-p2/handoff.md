# Handoff — `final-art-p2` (slice S-16c)

The `/10x-implement final-art-p2 phase 5` step of autonomous run `2026-10-15-fix-s16bcd` wrote this. Phase 5 (loading screen with background and emblem) is committed (sha in the plan rows). Rows 5.2 (e2e), 5.4 [visual], 5.5 [reviewer] stay open. Next is phase 6 (`Driver: impl`).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | phases 1-4 `afac8e1`, `1dd8fb1`, `59ebc25`, `d56c3b2`, phase 5 `3df2b56`, plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` (5.2 e2e, 5.4 [visual], 5.5 [reviewer] and earlier manual rows open) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/BootScene.ts` | queues the two loading pictures first, redraws on `filecomplete-image-<key>` (draw failure logs once, A-10), removes `progress` and those listeners on `COMPLETE` (F3), slow timer passes the real elapsed scene time since preload (re-arms for the rest if it fires early, F3), `loadingArt()` for the hook |
| `src/ui/widgets/LoadingScreen.ts` | `showArt(id)` (background fills the canvas and hides the ivory rect, emblem above the title, depths -2/-1 under title and bar), `artShown()`, both destroyed in `destroy()`; slow line unchanged |
| `src/data/layout.ts` | `LOADING_LAYOUT.background`, `.emblem` |
| `src/data/balance.ts` | `loader` comment recomputed (2 077 722 B, about 41.6 s at 50 KB/s); `totalMs` stays 45 000 |
| `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts` | `loading: { phase, art: { background, emblem } }` |
| `docs/design-gaps.md` | row 105 marked CLOSED |
| `e2e-break-p9a.patch`, `e2e-break-p9b.patch` | break patches for phase 9 (a: no listener on `filecomplete`, so no `showArt`; b: loading art queued after the total limit) |

## 3. Verification

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 3054 passed (branch baseline 3054, +0); both deploy scripts OK |
| `npm run sample -- E1..E6` | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e | `load-and-tab-guard` + `salon-load-health` specs: Chromium cannot launch in this session (6 failed on launch, SIGTRAP) — `e2e: not runnable in this session — orchestrator gate`; row 5.2 left open. Row 4.2 ticked from the orchestrator note (109 passed after d56c3b2) |
| Break | patches written against the committed tree, `git apply --check` OK for both; no unit test covers the scene (proof is phase 9). Meta-check: both patches change only production code and would stay unit-green |
| Teacher read | not needed: no content or generator change |

## 4. Next command

`/10x-implement final-art-p2 phase 6` (phase 6: Notebook on the unlock card, salon thumbnail fallback on "Pokój gotowy!", `Driver: impl`)

## 5. Open

- Row 5.2 e2e (orchestrator: full e2e, `load-and-tab-guard.spec.ts` and `salon-load-health.spec.ts` must stay green; the hook `loading` snapshot gained `art`, the slow timer now re-arms if it fires early), 5.4 [visual], 5.5 [reviewer], 4.4, 4.5.
- Phase 6 draws notebook and `salon-after` (already queued after the room art).
- Earlier open items stand as in the earlier handoffs.

## 6. Autonomous decisions

- The slow timer measures `this.time.now - startedAt`; if it fires a hair early the phase stays `loading` and the timer is re-armed for the remainder (rejected: passing the constant, the old behaviour; rejected: clamping the elapsed time up, which would hide the check).
- No new e2e seam for "no loading art": the plan's phase 9 uses the stall seams and the break patches.
- Row 105 in `docs/design-gaps.md` was closed here (phase 8 may reword it).
- Mixed phase: none.
