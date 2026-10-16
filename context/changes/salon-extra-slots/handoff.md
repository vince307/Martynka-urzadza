# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-plan-review` step of autonomous run `2026-10-15-fix-s16bcd`: the plan is reviewed (`VERDICT: PROCEED`, 0 critical, 1 warning fixed, 4 observations recorded), `change.md` is `plan_reviewed`; nothing is implemented. The next agent must not get this wrong: phase order is load-bearing (phase 1 `holdPoint` clip and phase 2 render wiring before phase 3 adds the curtains and moves the decor), and `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` |
| Commits | plan-review state plus p2 `feat(salon-extra-slots): room drawing follows the shown look (p2)`, plus `test(salon-extra-slots): shown look and in-scene hold point (p1)` and this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows | phase 1: 1.1-1.3 ticked; 1.4 (e2e, orchestrator) and 1.5 ([reviewer]) open; phase 2: 2.1, 2.3 ticked; 2.2 (e2e, orchestrator) and 2.4 ([reviewer]) open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/RoomView.ts` | `render` and `miniaturePieces` draw from `shownVariants`; new `RoomView.shown()` |
| `src/scenes/RoomScene.ts`, `tests/e2e/support/hook.ts` | hook `room.shown` |
| `src/data/layout.ts` | `depth.shadows` 4 -> 2 |
| `tests/layout.test.ts`, `tests/roomMiniature.test.ts` | shadow-depth assertions; shown-slots miniature case (+1 test) |
| `context/changes/salon-extra-slots/e2e-break-p6a.patch` | `git apply` break: render draws only `chosen` (for phase 6) |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | clean |
| Unit | 3070 passed = branch baseline 3069 + 1 (layout assertions extend an existing test) |
| Deliberate break | `shadows: 6` -> `AssertionError: salon/wall-frames: expected 5 to be greater than 6`; restored. Meta-check: the break patch (`const shown = chosen`) changes nothing with today's data (no `shownBeforePurchase`), so unit stays green by design; proof comes in phase 6 e2e |
| deploy scripts, `sample` E1-E6 | pass |
| Build | `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session - orchestrator gate (Chromium MachPortRendezvous Permission denied, 3 tries); expected baseline 117 + 0 |

## 4. Next command

`/10x-tdd salon-extra-slots phase 3` (phase 3, `Driver: tdd`)

## 5. Open

- Rows 1.4, 2.2 (orchestrator e2e) and 1.5, 2.4 ([reviewer]) open. Earlier open items (human decisions, manual rows, phase 5 follow-ups) unchanged from the plan-review handoff and the plan.

## 6. Autonomous decisions

1. `holdPoint` imports `ROOM_LAYOUT` from `src/data/layout` directly (the plan's first choice); ESLint and typecheck accept it, no fallback needed. Would change: a boundary rule later forbidding core to import data/layout.
2. `shownVariant` returns the chosen variant only when it is 0, 1 or 2, else falls to the default rule. Would change: a validated save contract saying otherwise.
3. No scene or widget touched; nothing is wired until phase 2.

4. Phase 2: `shadows` set to 2 (plan), valid for today's data (min slot z 5) and for curtains z 3 in phase 3. No new Polish text or numbers in scenes/widgets.
