# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-plan` step of run 2026-10-30-rooms-kitchen: `plan.md` (7 phases, 35 Progress rows) and
`plan-brief.md` are written, `change.md` is `planned`, roadmap F-04 is `planning`. The one thing the next agent must not
get wrong: phase 1 commits `tests/fixtures/save-v4-salon.json` while `SAVE_VERSION` is still 4 (that is what makes it a
genuine v4 sample) and no later phase may edit it; the v5 migration table is frozen in core and lists only the salon.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` (confirmed with `git branch --show-current`) |
| Commits | 3 on the branch after this step: change identity, research, and this step's `docs(rooms-as-data): plan` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`, sha256 f780d138…) |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/rooms-as-data/plan.md` | the plan: 7 phases with `Driver:` lines, Autonomous decisions P-0..P-11, Progress |
| `context/changes/rooms-as-data/plan-brief.md` | two-page brief with the key-decision table |
| `context/changes/rooms-as-data/change.md` | frontmatter only: `status: preparing -> planned` |
| `context/foundation/roadmap.md` | F-04 status `ready -> planning` (At a glance row and item body) |
| `context/changes/rooms-as-data/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/rooms-as-data` |
| `metadata-guard.mjs inspect` / `mark-planned` | inspect ok (change.md 409593f4…); mark-planned `{"changed":true}` |
| `grep -c '^- \[ \]' plan.md` | 35 = the Success Criteria bullets of phases 1-7 (4+5+5+4+5+9+3), one-to-one |
| `grep -c "^## Phase\|^Driver: "` on plan.md | 14 (7 phase headings, 7 Driver lines) |
| `gh run view 41118206318 --log` (CI `check`, job 124277837113) | `Tests  3959 passed \| 3 skipped (3962)`, `e2e hook: absent (2 chunks checked)` — cited in row 6.9 |
| code spot-checks (grep/sed of `src/core/save.ts`, `src/data/rooms.ts`, `src/data/roomArt.ts`, `scripts/make-task-art.mjs`, `RoomDoneCard.ts`, `main.ts`, `e2eHook.ts`) | match research; `freshSession(` has 10 call sites in 8 files; `RoomDef.name` read only by `UIScene` `roomName` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source change |

## 4. Next command

`/10x-plan-review rooms-as-data`

## 5. Open

- Phase drivers: 1 tdd (house rules + v4 salon fixture), 2 tdd (save v5), 3 impl (load path, room list, `v4-salon` seam),
  4 impl (name, thumbnail, `RoomDoneCard` per-tile fix), 5 impl (art table + script per room), 6 impl (docs, follow-ups,
  seam sweep incl. CLAUDE.md v4 -> v5, visual), 7 e2e (`tests/e2e/rooms-as-data.spec.ts`, risks #10, #2).
- Manual rows (human checklist): 6.6 `[visual]` salon states + done card + "Zapis gry" at 1440/1024 vs `main`; 6.7
  `[human]` rollback below v5 shows `pl.saveFuture` (`deploy/README.md` note); 6.8 `[human]` update proven without two real
  builds (decision P-6); 6.9 `[reviewer] (CI at ship)`.
- Plan-review attention: `freshSession(house)` signature churn in tests (no default house in core); the phase-7 done-card
  test buys all 12 salon tasks through touch (timeout); `mergeHouse` marks the save dirty on the first v5 load because the
  frozen table lacks the kitchen cell (intended).
- DESIGN-GAP: none added (no new copy; `pl.room.names.salon` reuses "Salon").
- Follow-ups: listed in plan phase 6 § 2 (written to `follow-ups/review-fixes.md` in phase 6).

## 6. Autonomous decisions

- Fixed by the maintainer (scope.md): v5 = house + floor grid, lossless salon move, frozen v4 fixture, write-once
  `backup-v4`, no art or balance in F-04. Would change: a new maintainer instruction.
- P-1 frozen v5 table lists only the salon. Rejected: freezing salon/kitchen/`kids-room`. Why: data merges its rooms at load;
  a guessed id frozen forever lingers as an extra room. Would change: needing a save's grid without data.
- P-2 data house = salon + kitchen only. Why: kitchen id fixed by the pack, needed for the "Wkrótce" tile; kids' room and
  closed cells wait for S-25/S-23. Would change: those slices fixing their ids.
- P-3 renovation rule runs at load only; "Dalej" wired in S-22. Rejected: wiring "Dalej" now (invisible with one room,
  fires `RoomScene` follow-ups). Would change: S-22 cancelled while a second room ships.
- P-6 update proven by the real IndexedDB load path in unit tests + the in-memory e2e seam, not two real builds — departs
  from test-plan phase 4's two-build wish → `[human]` row 6.8. Would change: v6 or a cross-build report.
- Other plan decisions (P-4 `house` checked last, P-5 data wins for a known house, P-7 `RoomDef.name` removed, P-8 optional
  thumbnail falls back to drawn, P-9 "Stan salonu" copy left for S-22, P-10 seven phases, P-11 risk ids) are in plan.md
  `## Autonomous decisions` with their reversal conditions.
- Skill checkpoints decided in place: complexity HIGH, zero questions asked (research + scope settle every product choice);
  phase structure approved by the agent; no clipboard copy (unattended); no sub-agents (research's Code References covered
  the file set).
