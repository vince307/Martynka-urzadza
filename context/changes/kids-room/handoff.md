# Handoff — `kids-room` (slice S-25)

Written by the visual-gate step of run 2026-11-01-kids-room. The gate passed (`VISUAL: PASS`, 13 items × 2 widths) after one fix commit `8a23e38` (stand-in caption fit in `src/ui/widgets/RoomLayer.ts` + token in `src/data/layout.ts`). The one thing not to get wrong: `8a23e38` changes product code after the orchestrator's e2e runs, so the e2e suite (at least `tests/e2e/kids-room.spec.ts` and the stand-in specs `art-stand-in`, `hangar-module`) must be green on the branch head before ship.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | `697ece5`..HEAD: docs, phases 1-6, `4c594c0` closeout, `d544695` impl-review fix, `bd9b024` impl review, `8a23e38` visual-gate fix, then this `docs(kids-room): bramka wizualna` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | impl_reviewed |
| `## Progress` rows remaining | 12 (`grep -c '^- \[ \]' plan.md`): 2.4, 3.6, 4.5, 5.5, 6.2 (orchestrator e2e), 5.7-5.11 [human], 3.8 and 5.12 [reviewer] (CI at ship) |
| Working tree | clean after this commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kids-room/reviews/visual-review.md` | the gate: 13 items judged, one discrepancy fixed, one observation, hand-checked stars, ends `VISUAL: PASS — …` |
| `context/changes/kids-room/screenshots/` | 26 game frames (`desktop-*`, `tablet-*`, items 01-13 with 12b; no 07, item 7 is frame 09) + 3 pack frames `kit-*` + `README.md` (route, frame table, hook facts) |
| `src/ui/widgets/RoomLayer.ts` (`8a23e38`) | `show`: the stand-in caption is scaled by `labelScale` (`src/core/fitLabel.ts`) to the box width less `textInset` on each side |
| `src/data/layout.ts` (`8a23e38`) | `ROOM_LAYOUT.standIn.textInset: 16` |
| `context/changes/kids-room/follow-ups/review-fixes.md` | new item 7: three-digit balance, star nearly touches the digit in the counter pill (trigger: `StarCounter`/`hudPill.ts` change or S-17) |
| `context/changes/kids-room/plan.md` | row 5.6 ticked |

## 3. Verification

| command | result |
|---|---|
| Capture (Playwright, throwaway config in gitignored `visual.local/`, own `webServer` on 4399, hook build in gitignored `dist-visual.local/`) | 4 passed (9.1 min); after `8a23e38` rebuilt and stand-in test re-run: 2 passed (4.2 min) |
| Hand check | costs salon 129, kitchen 71, children 84; seed 284 → salon card 155 → kitchen card 84 → 79 → 73 → 66 → 40 → 0; drawn counter equal at both widths |
| `npm run lint` (capture folder moved out) | OK |
| `npm run typecheck` | OK |
| `npm test` | 228 files, 4215 passed = baseline 4194 + 21 (the fix adds no case) |
| Not run here | `npm run build`, deploy script tests, `sample`, Playwright e2e suite (orchestrator owns 4397/4398; contract) |
| Cleanup | `visual.local/` and `dist-visual.local/` moved to `$TMPDIR`; nothing listening on 4399; no background shells left |

## 4. Next command

`/10x-archive kids-room then ship`

## 5. Open

- Orchestrator: full e2e `189 + 2` on the branch head (rows 2.4, 3.6, 4.5, 5.5, 6.2), now including `8a23e38` (stand-in path of `RoomLayer`); `npm run build` + `check:build` on the head.
- [human] rows 5.7 (D1 code outside data), 5.8 (card tiles 340/32, miniature 0.12), 5.9 (costs 84), 5.10 (wording, gap 202), 5.11 (tablet offline).
- [reviewer] (CI at ship) rows 3.8 (`123 of 123 room pictures precached`) and 5.12 (`Tests  4212 passed | 3 skipped (4215)`, `e2e hook: absent (`).
- Follow-ups: `context/changes/kids-room/follow-ups/review-fixes.md` items 1-3 and 7 open with triggers.

## 6. Autonomous decisions

- **Playwright fallback, no Chrome attempt**: the step prompt allows it up front; Chrome's IndexedDB on 4399 may hold an old save and every frame needs a fresh device through 28 purchases per width. Would change: a defect visible only in the maintainer's Chrome profile.
- **Own build folder `dist-visual.local/`** instead of `dist-e2e/`, which the orchestrator's suite was serving on 4397. Would change: nothing.
- **Stand-in caption overflow fixed, not recorded**: two lines through the existing `labelScale` rule plus one token; newly visible because the children's bookcase is the narrowest slot. Would change: a fix needing a new rule.
- **Three-digit counter tightness recorded as follow-up 7, not fixed**: `StarCounter` is outside this slice and the case predates it (salon 129). Would change: the maintainer calling it a defect for this slice.
- **Item (7) judged on frame 09** (the room after "Dalej"), as in the hangar gate: the card covers the room at the last purchase.
