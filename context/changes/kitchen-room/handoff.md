# Handoff — `kitchen-room` (slice S-22)

Written by the `/10x-plan kitchen-room` step of run 2026-10-30-rooms-kitchen (2026-10-31). The plan is written
(`plan.md`, 7 phases, `change.md` status `planned`, roadmap S-22 `planning`); no code yet. The next agent must not get
this wrong: **the boot loads ONE room (`bootRoomArt(currentRoom)`), every other room a child can see (the next room and
done rooms on the celebration card) loads at runtime through `roomArtLoader` on the HUD loader, and
`balance.loader.totalMs` stays 50 000** — the plan's "Room-art load moments" table is the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/kitchen-room`, cut from `main` at `942e237` (merge of #117, F-04 shipped) |
| Commits | 3 on top of `942e237`: change identity, research, `docs(kitchen-room): plan` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 38 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kitchen-room/plan.md` | the plan: 7 phases with Driver lines, the room-art load-moment table, `## Autonomous decisions` K-0..K-13, `## Progress` |
| `context/changes/kitchen-room/plan-brief.md` | two-page brief |
| `context/changes/kitchen-room/change.md` | status `preparing` → `planned`, `updated` 2026-10-31 |
| `context/foundation/roadmap.md` | S-22 `proposed` → `planning` (At a glance + item body), frontmatter `updated` 2026-10-31 |
| `context/changes/kitchen-room/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/kitchen-room` |
| `metadata-guard.mjs inspect` / `mark-planned` | inspect hashes read; `{"changed":true}` |
| Success Criteria ↔ Progress mapping (python count per phase) | phases 1–6: automated + manual bullets equal the Progress rows (4, 4, 4, 5, 8, 10); phase 7: 3 automated rows |
| Driver lines | every `## Phase N:` has `Driver:` and `Driver why:` as its first lines (1 tdd, 2 impl, 3 tdd, 4 impl, 5 impl, 6 impl, 7 e2e) |
| lint / typecheck / unit / build / e2e | NOT run: docs-only step (contract baseline unit 4014, e2e 170 is inherited, unverified here) |
| deliberate break | none (no test written) |

## 4. Next command

`/10x-plan-review kitchen-room`

## 5. Open

- Manual Progress rows (human checklist): 4.5 [visual] celebration on the salon (one room); 5.6 [reviewer] teacher read of
  the kitchen copy; 5.7 [reviewer] kitchen geometry vs `designs/martynka-locations-v2/manifest.json`; 5.8 [human] S-17
  tunes kitchen costs; 6.6 [visual] seven-state matrix at 1440 + 1024; 6.7 [human] salon change mode unreachable until
  S-23 (against PRD FR-019's literal text, decision K-6); 6.8 [human] salon green board vs kitchen cream margin;
  6.9 [human] offline tablet check of the runtime kitchen load; 6.10 [reviewer] (CI at ship) job `check` of workflow `CI`.
- e2e specs that change in phase 5 (teaser → kitchen tile, "Dalej" moves): `tests/e2e/rooms-as-data.spec.ts`,
  `tests/e2e/room-change.spec.ts` (FR-019 change-mode half re-homed to `tests/e2e/kitchen-room.spec.ts` in phase 7),
  `tests/e2e/salon-extra-slots.spec.ts`; checked: `adaptive`, `final-art-room-done`, `health-lines`, `minigames`,
  `room-purchase` (tap `cardNext`). `tests/e2e/salon-art.spec.ts` #16 changes in phase 2.
- DESIGN-GAP rows from 175 (phase 6): kitchen copy, celebration view, kitchen tile without thumbnail, green vs cream,
  room-neutral mismatch lines, salon change mode until S-23.
- Follow-ups re-recorded in phase 6 (`context/changes/kitchen-room/follow-ups/review-fixes.md`): F-04 5 (atlas), 6 (SW
  warning), 7 (open-panel guard), 12, 13 (L-R8), final-art-salon F1/F2, salon-style §27/§28, VO2/F5/F7; new: S-23 draws
  done rooms through `roomArtLoader`; house/street celebration copy and keepsake (S-23/S-24).
- `starBurst` (`src/ui/widgets/starBurst.ts`) must return its emitter in phase 4 (contract in the plan).

## 6. Autonomous decisions

- **Fixed by the maintainer (scope.md):** kitchen from locations-v2 via `npm run art`; one parameterised celebration,
  room intensity only; one room in renovation; kitchen costs 5–15 only; the budget measured, never silently raised.
  Would change: a new maintainer instruction.
- **Boot = the room in renovation; runtime = the next room and done rooms on the card (K-1, K-2).** Rejected: all rooms
  at boot (57.8 s), raising `totalMs`, downscale (52.7 s), atlas, loading at the last task or at "Dalej". Why: measured
  budget and the card is the first screen needing other rooms. Would change: the runtime load proving unreliable
  offline (then a recorded `totalMs` raise + `[human]` row) or stand-ins visible on the card on a normal link (then load
  at the last task).
- **Runtime loader on the HUD scene loader (K-3).** Rejected: `RoomScene.load` (sleeps). Would change: a conflict with
  the music load seen in e2e.
- **Celebration as `celebrationView(intensity, reducedMotion, table)`, house/street rows present but unreachable,
  narrator line unchanged (K-4, K-5).** Would change: the maintainer asking for the room's name; S-23/S-24.
- **Against PRD FR-019 literal text: the salon's change mode is unreachable after "Dalej" until S-23 (K-6),** `[human]`
  row 6.7. Rejected: a second button on the card (FR-040), staying in the salon (FR-033). Would change: the maintainer
  wanting the salon revisitable before S-23.
- **Kitchen task order counter → fridge → table → coffee → bench → rack after the stage; costs 5, 7, 9, 10, 12, 13, 15
  (K-7); copy "szafki", "Ustaw naczynia", agreeing variant adjectives (K-8); room-neutral parent lines (K-9); no save
  change (K-10).** Would change: S-17, the teacher read, a persisted celebration flag.
- **F-04 follow-ups 6 and 7 re-recorded, not fixed (K-11); offline proof = precache check + `[human]` tablet check, not
  an e2e (K-12).** Would change: a phase touching those paths; a regression report.
- **Drivers (K-13):** 1 tdd, 2 impl, 3 tdd (fake-loader precedent `tests/soundMusic.test.ts`), 4 impl, 5 impl, 6 impl
  (seam sweep, last impl), 7 e2e (#2, #16).
- **Skill checkpoints decided in place:** complexity (HIGH, 0 questions: research + scope settle every product choice),
  phase-structure approval (approved as written), clipboard copy skipped (unattended). Lessons file absent; none applied.
