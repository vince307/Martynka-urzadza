# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-plan-review kitchen-room` step of run 2026-10-30-rooms-kitchen (2026-10-31). The plan is reviewed
(VERDICT: PROCEED) and now has **8 phases**: the review added phase 6 "Visit a done room in its change mode (FR-019)"
and renumbered docs/sweep to 7 and e2e to 8. The next agent must not get this wrong: **`refreshHealth(room)` is a no-op
while `room` is pending in `roomArtLoader` (plan review F1) — "Obrazki" must never list a room still loading — and the
boot loads ONE room (`bootRoomArt(currentRoom)`) with `balance.loader.totalMs` unchanged at 50 000.**

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` (merge of #117, F-04 shipped) |
| Commits | 4 on top of `942e237`: change identity, research, plan, `docs(kitchen-room): plan review` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`; was 38, +4 for the new phase 6) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kitchen-room/reviews/plan-review.md` | the review: 1 CRITICAL, 3 WARNING, 2 OBSERVATION, all triaged; ends `VERDICT: PROCEED — …` |
| `context/changes/kitchen-room/plan.md` | edited: F1 (pending-health rule in Critical details, phase-3 contract/test/break), F2 (new phase 6, K-6 rewritten, end state, load-moment rows, NOT-doing, phase 8 fourth test), F3 (`TaskScene` backdrop re-capture on `roomLoad`, phase 4), F4 (follow-up 4 and M-5 in the phase-7 re-record list, `Trigger:` ≥ 10), new `## Known risks`; phases renumbered, Progress rebuilt |
| `context/changes/kitchen-room/plan-brief.md` | K-6 row, phases table (8), risks and scope lines aligned with the plan |
| `context/changes/kitchen-room/change.md` | `status: planned` → `plan_reviewed` |
| `context/changes/kitchen-room/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/kitchen-room` |
| Phase↔Progress check (python over plan.md) | 8 phases; titles match; criteria bullets = Progress rows per phase 4/4/4/5/8/4/10/3; no checkbox outside `## Progress` |
| Driver lines | 1 tdd, 2 impl, 3 tdd, 4 impl, 5 impl, 6 impl, 7 impl (seam sweep, last impl), 8 e2e |
| Code grounding (grep/read) | `BootScene` `queuers.room`/`tables`/`roomArtHealth`, `main.ts` `preBoot` currentRoom, `sound.ts` `startMusic`, `RoomScene` `resolve`/`dispatch`/`showCard`/card callback/`refresh`/`onSleep`, `RoomDoneCard` `recordFallback`, `house.ts` `nextRoom`/`houseRoomList`, `backdrop.ts` `backdropMode`, `TaskScene` wake re-capture, `UIScene` `missingRoomLabels`: all as the plan (or the review) states |
| lint / typecheck / unit / build / e2e | NOT run: docs-only step (contract baseline unit 4014, e2e 170 inherited, unverified here) |
| deliberate break | none (no test written) |

## 4. Next command

`/10x-tdd kitchen-room phase 1`

## 5. Open

- Manual Progress rows (human checklist): 4.5 [visual] celebration on the salon (one room); 5.6 [reviewer] teacher read
  of the kitchen copy; 5.7 [reviewer] kitchen geometry vs `designs/martynka-locations-v2/manifest.json`; 5.8 [human]
  S-17 tunes kitchen costs; 7.6 [visual] eight-state matrix at 1440 + 1024 (frame 8 = the visit button); 7.7 [human]
  accept the interim "Salon"/"Kuchnia" visit button until S-23 (K-6 revised); 7.8 [human] salon green board vs kitchen
  cream margin; 7.9 [human] offline tablet check of the runtime kitchen load; 7.10 [reviewer] (CI at ship) job `check`.
- Phase 6 placement risk: the bottom bar is full (`ROOM_LAYOUT.resume`, `taskButton`, `modeButton`); `ROOM_LAYOUT.visitButton`
  must pass the extended `tests/layout.test.ts` overlap check and visual frame (8).
- Known risks in plan.md: runtime loads skip `wrongSizes` (F5); a visited done room is not judged by "Obrazki"; keyed
  `on('addfile')` on the shared HUD loader (F6).
- e2e specs that change in phase 5: `tests/e2e/rooms-as-data.spec.ts`, `tests/e2e/room-change.spec.ts` (its FR-019
  change-mode half re-homed to `tests/e2e/kitchen-room.spec.ts` phase 8: salon via the visit button + kitchen's own),
  `tests/e2e/salon-extra-slots.spec.ts`; `tests/e2e/salon-art.spec.ts` #16 changes in phase 2.
- DESIGN-GAP rows from 175 (phase 7): kitchen copy, celebration view, kitchen tile without thumbnail, green vs cream,
  room-neutral mismatch lines, the interim visit button.
- Follow-ups re-recorded in phase 7 (`context/changes/kitchen-room/follow-ups/review-fixes.md`): F-04 4, 5, 6, 7, 12, 13,
  F1, F2/§27/§28, VO2/F5/F7, salon-load-health M-5, runtime `wrongSizes`; new: S-23 replaces the visit button and draws
  done rooms through `roomArtLoader`; house/street celebration copy and keepsake (S-23/S-24).

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** kitchen from locations-v2 via `npm run art`; one parameterised celebration,
  room intensity only; one room in renovation; kitchen costs 5–15 only; the budget measured, never silently raised.
  Would change: a new maintainer instruction.
- **F2 / K-6 revised: keep FR-019 "poprawki" with an interim done-room visit button (new phase 6), not a `[human]`
  acceptance of the loss.** Chosen: runtime `visiting` in `RoomScene` (read first by `resolve()`, reset on
  create/wake/sleep), one button named after the other done room, art via `roomArtLoader.ensure`. Rejected: leaving the
  salon unreachable and invisible until S-23 (removes a live must-have; S-23 depends on undelivered art); a second card
  button (FR-040); moving `currentRoom` for a visit (would move the renovation, backdrop, save). Why: `resolve()` is the
  single source of the shown room and a done room has no purchase path, so it fits one phase and keeps FR-033/FR-039.
  Would change: the maintainer preferring the gap until S-23, or S-23 landing first.
- **F1 fixed as CRITICAL (not WARNING):** the step prompt makes "Obrazki never reports a not-yet-loaded room" a hard
  requirement and the plan's own "Dalej" contract violated it. Would change: nothing.
- **F3, F4 fixed in place; F5, F6 recorded under `## Known risks`** (both mitigated by existing tests or the contract).
  Would change: a phase finding a wrongly sized runtime file in the visual gate → add the size check to `roomArtLoader`.
- **Phase 6 driver impl, not tdd:** the pure part (`visitTarget`) is a few lines beside scene wiring; its unit test is
  written in the phase. Would change: the helper growing past a one-screen rule.
- **Verdict PROCEED, not RETHINK:** the approach (per-room boot, runtime HUD loader, one celebration view) is sound and
  grounded; fixes were targeted. Skill checkpoints decided in place: "how to proceed" → save and triage myself (no
  AskUserQuestion). Lessons file absent; none applied.
