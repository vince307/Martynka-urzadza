<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi i „poprawki” w salonie

- **Plan**: context/changes/variant-change-room-done/plan.md
- **Mode**: Deep (claims verified inline against the code; no sub-agent — autonomous run, the risky claims were few and local)
- **Date**: 2026-10-13
- **Verdict**: REVISE → SOUND after triage (all fixes applied to plan.md)
- **Findings**: 1 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F1) |
| Blind Spots | WARNING (F3, F4) |
| Plan Completeness | FAIL → fixed (F2) |

## Grounding

Grounding: 17/17 paths ✓ (`src/core/{variantPanel,rooms,longPress,inputSuspend}.ts`, `src/scenes/RoomScene.ts`,
`src/ui/widgets/RoomView.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `src/main.ts`, `playwright.config.ts`,
`tests/e2e/support/hook.ts`, 6 test files), symbols ✓ (`stepPanel`, `PanelState`, `longPress`, `IDLE`,
`InputSuspender.suspended`, `E2E_HOOK_MARKERS`/`E2E_REQUIRED_MARKERS`, `checkE2EHook`, `holdTouch`, `tapScene`,
`ROUND_SPEC`, `preBoot`, `ROOM_LAYOUT.{area,tray,thumbs,choose,close,taskButton,resume}`, `SALON`, `SALON_PLACEHOLDERS`),
brief↔plan ✓ (brief phase 1 row updated for `roomGesture`). Progress↔Phase ✓ (7 phases, criteria one-to-one after
edits; 7 `Driver:` lines, all correct: 1–3 tdd on absent pure code, 4–6 impl, 7 e2e after the seam sweep in 6).

Verified claims: (a) no exhaustive switch on `PanelState.kind` in `src/` (only `RoomScene` reads `kind === 'open'` and
`.preview`), so the union change compiles in phase 1; `room-purchase.spec.ts` reads only `panel.kind`/`panel.preview`.
(b) `VariantPanel`, `PageButton`, `RoomTaskButton` fire on `pointerup` only after a `pointerdown` on the same zone
(`pressed` field) — the basis of "release after the hold selects nothing". (c) `?e2eStars` seam: `main.ts` already gates
`e2eMonth`/`e2eFail` behind `__E2E_HOOK__`; `checkE2EHook` fails the production build on any marker string, and the
parser's `get('e2eStars')` literal makes the phase-3 break (unguarded call) a real red on the real bundle; the hook build
requires the marker, so it cannot silently drop. Unreachable in `dist/` — extra check (2) satisfied. (d) Test-1 empty
slot point: `curtains` centre (600,360) lies in the walls box (204–520), not the floor box (520–860); with only the
floor furnished `slotAt` → `null`, so the assertion is meaningful. (e) Break A: after buying the floor (5 of 20), `S = 15`
≥ next cost 6, so a hold that sends `open` really opens a buy panel → `panel.mode === 'change'` red. Break C: `room.card`
is snapshot state → red. Phase-4 patch (stars written on `changed`) → `stars === S` red. None vacuous — extra check (1).

Follow-ups with `Trigger: S-10` (S-09 archive): hold + card (phases 4–5), F4 (phase 5), F5 and V1 (phase 4), V2 (phase 4
visual gate), F1 already resolved (9096a52) and extended to `modeButton`/`cardNext` — all included. HUD-button follow-up
and saves (S-11) deferred convincingly (no HUD button changes; save is S-11).

Product decisions vs PRD: "Zmień wygląd" against FR-019's literal "poprawki" (`[human]` 6.8), hold 600 ms / 40 px
(`[human]` 6.6), UX of mode/card/list (`[human]` 6.7), `?e2eStars` (`[human]` 3.5) — each has its `[human]` row; none
clearly wrong, none overturned.

## Findings

### F2 — `modeButton` rule unsatisfiable: "Zamknij" lies inside the task-button rectangle

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 — Success Criteria (layout test), Progress 5.1
- **Detail**: Phase 5 places `ROOM_LAYOUT.modeButton` in the `taskButton` rectangle (x 900–1620, y 892–1020) and demands
  "no tray target overlaps `modeButton`". `ROOM_LAYOUT.close` ("Zamknij", x 1100–1580, y 908–1004) lies inside that
  rectangle — S-09 kept that overlap on purpose (`tests/layout.test.ts` comment "»Zamknij« may share the task button's
  place"). As written, phase 5 cannot go green without moving something the plan never mentions.
- **Fix**: rule = thumbnails and "Wybieram" clear of `modeButton`; "Zamknij" shares the place by design (a double tap
  toggles the mode, spends nothing), with a test comment — same precedent as S-09.
- **Decision**: FIXED (phase 5 criterion + Progress 5.1)

### F1 — Gesture rules (tap in mode, fire once, release after fire) live in the scene, untested before phase 7

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Critical Implementation Details; Phase 4 §2; Phase 1
- **Detail**: the decision "when does a touch open the change panel" (hold fired; tap only in change mode; `up` after
  firing does nothing; drift/cancel/reset idle) was planned as scene code over raw `longPress`. CLAUDE.md: scenes only
  forward actions to `core/`, logic test-first. It also left phase 4 with no provable break.
- **Fix**: pure `roomGesture` reducer over `longPress` in `src/core/roomGesture.ts`, built test-first in phase 1 (tdd),
  with its own break ("opens on `up` outside the mode"); phase 4 scene only feeds it and executes `open`/`held`; phase-7
  break B now patches only the scene (feeds `mode: 'change'` always) so the e2e still proves the scene seam while unit
  `roomGesture` stays green.
  - Strength: rule (3) "hold must not trigger on release" proved at unit level; matches project rule. Tradeoff: one
    more small module in phase 1. Confidence: HIGH — same shape as `longPress`. Blind spot: `UIScene` keeps its
    in-scene feed (out of scope).
- **Decision**: FIXED

### F3 — "Dalej" on the card would sit on "Wybieram" if copied from `UNLOCK_LAYOUT`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §1 (`ROOM_DONE_LAYOUT`), Success Criteria
- **Detail**: the card is "like `UNLOCK_LAYOUT`"; its button (735–1185 × 793–901) overlaps "Wybieram" (1100–1580 ×
  792–892). Under "ogranicz ruch" the card appears at once, so a double tap on the last "Wybieram" dismisses
  "Pokój gotowy!" before the child sees it — the S-09 F1 pattern again. No layout criterion covered `cardNext` vs tray.
- **Fix**: `ROOM_DONE_LAYOUT` button outside `ROOM_LAYOUT.choose`; layout test "`cardNext` clear of »Wybieram« and the
  thumbnails" (phase 5 criterion + Progress 5.1).
- **Decision**: FIXED

### F4 — "Release after a hold selects nothing" was code-only

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 test 1, breaks
- **Detail**: every hold point in the spec lies above the tray, so the finger never lifts over a thumbnail; the property
  rests on `VariantPanel`'s `pressed` guard with no test that would see it break.
- **Fix**: test 1 holds the floor at a point that is inside thumbnail 0 once the panel opens (`ROOM_LAYOUT.thumbs`,
  y ≈ 844, inside the floor box 520–860, asserted before the gesture) and asserts `preview === null`; new break D
  (thumbnail fires on `pointerup` without `pointerdown`) → red. Progress 7.5 added, build row → 7.6.
- **Decision**: FIXED

### F5 — Phase 1 test-update count

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §5 Tests
- **Detail**: "5 places with `taskId`" mixes `PanelState` literals (3) with `bought` expectations (which keep `taskId`
  and gain no `mode`).
- **Fix**: wording clarified in plan.md.
- **Decision**: FIXED

### F6 — `e2eStars` read inside `preBoot`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 3 §2
- **Detail**: `e2eMonth`/`e2eFail` are parsed at module level in `main.ts` and passed into `createGame`; reading
  `window.location.search` inside `preBoot` works but breaks the pattern. Either is guarded by `__E2E_HOOK__`.
- **Fix**: implementer may pass the parsed value as a `createGame` argument like `month`; no plan change required.
- **Decision**: ACCEPTED (implementer's choice)

### F7 — Phase-4 break deferred to phase 7

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 Success Criteria
- **Detail**: the deferral is justified (the registry seam is only visible in the rendered game) and the patch is
  named; after F1 the gesture rules have a unit break in phase 1, so only the registry write stays deferred.
- **Fix**: none.
- **Decision**: ACCEPTED

## Triage summary

Fixed: F1, F2, F3, F4, F5 · Accepted: F6, F7 · Verdict after fixes: REVISE → SOUND.

VERDICT: PROCEED — approach sound and claims hold against the code; the one critical (unsatisfiable modeButton rule) and three warnings are fixed in plan.md, and the e2e breaks A–D, the e2eStars guard and hold-release/reset rules are all provable.
