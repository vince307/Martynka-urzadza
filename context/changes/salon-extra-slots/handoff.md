# Handoff — `salon-extra-slots` (slice S-16d)

Written by the `/10x-plan-review` step of autonomous run `2026-10-15-fix-s16bcd`: the plan is reviewed (`VERDICT: PROCEED`, 0 critical, 1 warning fixed, 4 observations recorded), `change.md` is `plan_reviewed`; nothing is implemented. The next agent must not get this wrong: phase order is load-bearing (phase 1 `holdPoint` clip and phase 2 render wiring before phase 3 adds the curtains and moves the decor), and `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` stay byte-identical.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-extra-slots` |
| Commits | plan-review state plus `test(salon-extra-slots): shown look and in-scene hold point (p1)` and this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows | phase 1: 1.1-1.3 ticked; 1.4 (e2e, orchestrator) and 1.5 ([reviewer]) open |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `SlotDef.shownBeforePurchase?: 0 | 1 | 2` |
| `src/core/rooms.ts` | `shownVariant`, `shownVariants` |
| `src/core/roomHit.ts` | `holdPoint` scans the slot box clipped to `ROOM_LAYOUT.scene` shrunk by `step / 2` |
| `tests/roomShown.test.ts` (new), `tests/roomHit.test.ts` | 4 + 2 new tests |

## 3. Verification

| Command | Result |
|---|---|
| RED first | `AssertionError: expected -34 to be greater than or equal to 10`; `expected { x: 720, y: -464 } to be null`; `expected null to be +0 // Object.is equality` (4 failed, 24 passed) |
| GREEN | `tests/roomShown.test.ts` + `tests/roomHit.test.ts`: 28 passed |
| Deliberate break | `shownVariant` without the `stagesDone` check: "shows nothing unbought before the stage task" red; `holdPoint` `top: full.top`: both new hold tests red; restored; meta-check: rules on synthetic rooms only |
| lint, typecheck | clean |
| Unit | 3069 passed = baseline 3063 + 6 |
| `sample` E1-E6 | all exit 0 |
| Build | `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session - orchestrator gate (Chromium MachPortRendezvous Permission denied). Nothing in scenes/widgets changed, expected baseline + 0 |

## 4. Next command

`/10x-implement salon-extra-slots phase 2` (phase 2, `Driver: impl`)

## 5. Open

- Rows 1.4 (orchestrator e2e) and 1.5 ([reviewer]) open. Earlier open items (human decisions, manual rows, phase 5 follow-ups) unchanged from the plan-review handoff and the plan.

## 6. Autonomous decisions

1. `holdPoint` imports `ROOM_LAYOUT` from `src/data/layout` directly (the plan's first choice); ESLint and typecheck accept it, no fallback needed. Would change: a boundary rule later forbidding core to import data/layout.
2. `shownVariant` returns the chosen variant only when it is 0, 1 or 2, else falls to the default rule. Would change: a validated save contract saying otherwise.
3. No scene or widget touched; nothing is wired until phase 2.
