# Handoff — `final-art-salon` (slice S-16a)

Written by the ship step (archive + ship) before the push, so the archived copy is final. The next agent must not get wrong: nothing is left to run for this slice; PR, CI, merge and deploy results live in the run log, not here.

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-salon`, cut from `main` at `334ff69` |
| Commits | phases 1-10 (`d5d6993` … `9362f3f`), review fix `898517d`, impl-review docs `ce89b62`, visual gate `13e535f`, this handoff, then `chore(archive): close final-art-salon` |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in `context/runs/2026-10-15-s16a-salon-art/run-log.md` |
| `change.md` status | `archived` (folder moved to `context/archive/2026-10-15-final-art-salon/`) |
| `## Progress` | 2 rows open, both [human]: 2.5, 10.4 (post-run checklist, not a blocker) |
| Roadmap | S-16a `done` (At a glance + body + `## Done`); Backlog Handoff refreshed (S-16a done, S-16b still blocked on sound files, S-17 prerequisite met) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `reviews/visual-review.md`, `reviews/impl-review.md`, `reviews/plan-review.md` | verdicts (visual PASS; impl-review reviewed phases 1-10) |
| `screenshots/` | 69 JPEG frames, README with route and seams |
| `follow-ups/review-fixes.md` | every re-triggered `Trigger: S-16` item, new S-16a items, F1-F5, VO1-VO3 |

## 3. Verification

| Command | Result |
|---|---|
| local gate | last observed by the impl-review step on `1dc079b` + comment-only `898517d`: unit 2939 = baseline 2839 + 100, e2e 98 = 93 + 5; visual gate and this step changed docs only |
| `validate-rule-files.sh` | run after the archive move (result in the run log) |
| forge CI, merge, deploy | run log |

## 4. Next command

`none — shipped`

## 5. Open

- [human] 2.5: remap rule B (`remapLegacySalon`, round up, no refund; gifted furniture gets variant 0; old `tasksDone` 9-10 surplus 10/25 stars not refunded, room done). [human] 10.4: iPad PWA playthrough (full renovation, smoothness at ≈ 59 MB of textures, loading screen offline on first launch).
- Restated triggers: F1 (`RoomScene.fadeStage` after sleep) `Trigger: the next change to RoomScene.fadeStage or a tablet check (10.4) showing it`; F2 (`drawRoomMiniature` with partly missing art) `Trigger: the next change to RoomDoneCard or drawRoomMiniature`; VO1-VO3 unchanged; costs `Trigger: S-17`; rollback risk `Trigger: any deploy rollback of the build that shipped S-16a`.

## 6. Autonomous decisions

1. Archived with 2 open [human] rows (2.5, 10.4). Why: both are maintainer checks after the run (a decision to confirm, a tablet playthrough), no automated row is open; the step prompt fixes this answer. Would change: the maintainer rejecting rule B (then a new change implements rule A).
2. No SHA repoint at archive. Why: the branch is merged with a merge commit (`--merge`), so every phase SHA stays in `main` history. Would change: a squash merge.
3. F1 trigger restated (the visual gate 7.4 did not show the paused fade, so its first trigger can no longer fire). Would change: nothing.
