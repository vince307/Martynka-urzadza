# Handoff — `variant-change-room-done` (slice S-10)

Written by the `plan` step (`/10x-plan variant-change-room-done`): `plan.md` (7 phases, Progress) and `plan-brief.md`
exist, change.md is `planned`, roadmap S-10 is `planning`. The next agent must not let the change branch of `stepPanel`
return `bought` (the only branch in `RoomScene.dispatch` that writes `stars`), and must keep `e2eStars` behind
`__E2E_HOOK__` with its marker in `vite/e2eHookGuard.mjs`.

## 1. State

| | |
|---|---|
| Branch | `feat/variant-change-room-done`, cut from `main` at `36ead3c` |
| Commits | 3 on the branch after this step (identity, research, `docs(variant-change-room-done): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (`metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 40 (all) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/variant-change-room-done/plan.md` | Plan: 1 tdd reducer change branch + `core/roomHit.ts` (`slotBox`, `slotAt`, `holdPoint`) + `roomDone`; 2 tdd `ROOM_ORDER`/`roomsListView`, `balance.roomHold`, caption anchors (V1), `pl.room.done`/`pl.room.change`; 3 tdd `?e2eStars` seam + guard marker; 4 impl hold zone + outline + change panel in `RoomScene`/`RoomView`, F5; 5 impl `RoomDoneCard` + "Zmień wygląd" mode; 6 impl seam sweep, gaps 37–41, follow-ups; 7 e2e `room-change.spec.ts` (breaks A–C) |
| `context/changes/variant-change-room-done/plan-brief.md` | Two-page brief |
| `context/changes/variant-change-room-done/change.md` | Status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-10 `proposed` → `planning` (At a glance + body) |
| `context/changes/variant-change-room-done/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/variant-change-room-done` |
| Progress ↔ Success Criteria mapping (awk count per phase) | 1:3/3, 2:4/4, 3:5/5, 4:7/7, 5:7/7, 6:9/9, 7:5/5 — one-to-one |
| `grep -c '^Driver: ' plan.md` | 7 (one per phase body) |
| `metadata-guard.mjs mark-planned` | `{"changed":true}` |
| Gate suites | not run: docs-only step, no code changed (baseline on main 36ead3c per contract: unit 1035, e2e 24 — inherited, unverified) |

## 4. Next command

`/10x-plan-review variant-change-room-done`

## 5. Open

- `[human]` rows: 3.5 (`?e2eStars` seam), 6.6 (hold 600 ms / 40 px), 6.7 (UX of mode/card/list), 6.8 ("Zmień wygląd" instead of literal "poprawki", "Wkrótce"), 6.9 (device check).
- Phase 4 deliberate break is deferred on purpose: patch `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` (`RoomScene.dispatch` writes stars on `changed`) is proved by the phase-7 spec (row 7.2).
- DESIGN-GAP rows 37–41 to add in phase 6 (`docs/design-gaps.md`); rows 32, 36 updated.
- Follow-ups for phase 6 `follow-ups/review-fixes.md`: save after change (S-11), card not shown after cold start (S-11), hit areas for art (S-16), second room in `ROOM_ORDER` (v1.1), `roomHold` tuning (S-17).
- Plan-review should check: `PanelState` union change vs existing `tests/variantPanel.test.ts` expectations (phase 1 updates them); `holdPoint` reachability of `rug` under `sofa`; `modeButton` vs tray targets (S-09 F1 pattern).

## 6. Autonomous decisions

1. No AskUserQuestion: complexity MEDIUM, 0 questions — research.md + change.md settle every design choice; remaining product choices decided in plan `## Autonomous decisions` 1–14 with `[human]` rows where they leave the PRD's literal text or add numbers/seams. Would change: maintainer note on disk.
2. "Zmień wygląd"/"Gotowe" chosen over "Poprawki" (clearer imperative for a 7-year-old) — against FR-019's literal word → `[human]` 6.8. Would change: author prefers "Poprawki".
3. Card button reuses `pl.unlock.next` "Dalej" and leads to the room (not the tasks). Would change: playtest.
4. `?e2eStars` seam over 14 played rounds; phase 3 driver `tdd` (pure parser + guard test lead). Would change: maintainer forbids new e2e query switches.
5. Phase 4 break deferred to phase 7 rather than an unprovable break (no spec covers the change seam before phase 7). Would change: plan-review finds a unit-level seam.
