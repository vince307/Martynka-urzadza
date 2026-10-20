---
change_id: playtest-fixes-f01-f03
title: Playtest fixes F-01..F-03 (narrator off by default, gear hint and age back, round variety)
status: new
created: 2026-10-20
updated: 2026-10-20
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** `docs/playtest-feedback.md` F-01, F-02, F-03 (parent's notes from playing, 2026-10-17
and 2026-10-18). Autonomous run `2026-10-20-playtest-boot`, slice 1 of 2; the maintainer's decisions are in
`context/runs/2026-10-20-playtest-boot/scope.md` § 1 (copied below under Autonomous decisions). No roadmap status
edits (no row in `context/foundation/roadmap.md`; S-17 playtest-balance stays open and untouched).

**Save format.** Stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`) — hard limit of the run: a change that turns
out to need v5 stops at an open PR and does not merge. None is expected:
- F-01 changes a default in `balance.ts`; `Settings.autoRead` (`boolean | null`) keeps its shape — a parent's saved
  `true`/`false` still wins, a saved `null` now means "off" in every stage.
- F-02 (a) is runtime HUD state (a "hint shown" flag per page load, never in `SAVE_KEYS`); (b) "until the first round
  is finished" must be derived from data the v4 save already holds (e.g. `LearnerState.history` empty /
  `warmupPending`) or kept runtime-only; going back sets the learner to `null`, a state the v4 save already accepts
  ("a save without a learner" → `needsPlacement`). Research confirms both against `validateSave`.
- F-03 changes only how a round picks skills (`src/core/round/pick.ts`, `buildAdaptiveRound`, `buildWarmup`); nothing
  stored.

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

**Content rule:** F-03 touches the round draw, not `src/data/curriculum/` or generators; if the plan touches
`src/data/` (it will: `balance.ts`, `pl.ts`), the teacher read (`npm run sample -- <stage> --count 6`) is recorded in
the impl-review per CLAUDE.md Working rules and scope.md § 1.

## Source claims re-verified against the repo (branch `feat/playtest-fixes-f01-f03` at `64fd3ea`)

| source claim ("Uwagi techniczne") | repo now (symbols) | correction |
|---|---|---|
| F-01: `balance.narrator.autoReadStages` = `['E1', 'E2']` in `src/data/balance.ts` | confirmed: `balance.narrator.autoReadStages: ['E1', 'E2']` | none |
| F-01: auto-read on for E1–E2 until the parent turns it off (`Settings.autoRead`, `effectiveAutoRead` in `src/core/narration/voice.ts`) | confirmed: `effectiveAutoRead(settings, stageId, autoReadStages)` = `settings.autoRead ?? defaultAutoRead(...)`; callers `TaskScene` (auto-read decision), `RoomScene` (reading after the room), `UIScene.openSettings` (`autoReadDefault` for the panel's On/Off) | add: three call sites read the list, so the one-value change reaches all of them; unit tests `tests/narratorVoice.test.ts` and e2e `tests/e2e/narrator.spec.ts`, `parent-settings.spec.ts` may pin the old default — research lists every assertion that assumes E1/E2 read by themselves |
| F-01: "decision against the S-05 plan (auto-read for the younger)" | the plan says it twice: `Martynka-urzadza.md` line "lektor (automatyczne czytanie poleceń to ustawienie rodzica, domyślnie włączone dla E1–E2)" (Założenia) and the narrator bullet "domyślnie włączone dla E1–E2, wyłączone od E3"; **also `context/foundation/prd.md` FR-009** ("domyślnie włączone dla E1–E2, wyłączone od E3") | add: PRD FR-009 contradicts the new default too (see decision D-6) |
| F-02: the gear is muted on purpose (S-08, `src/ui/widgets/SettingsIcon.ts`) | confirmed: class doc "muted, label-free, no feedback while pressed"; look from `HUD_LAYOUT.settings` in `src/data/layout.ts` (`alpha: 0.7`, `iconColor: 0x8fb0a8` grey-teal, `fill: 0xfff5df`); gear is bottom right (`left 1782, top 952`), not "w rogu" of the task card; DESIGN-GAP rows 25 and 28 describe it | the fix is token values in `HUD_LAYOUT.settings` (+ rows 25/28 rewritten), not a widget redesign |
| F-02: opens after a 2 s hold (`balance.parentSettings.holdMs`) and the adult gate 13–19 × 13–19 (`src/core/parentGate.ts`) | confirmed: `balance.parentSettings.holdMs: 2000`, `moveTolerance: 30`; gate numbers live in `balance.parentGate` (`factorMin 13, factorMax 19`), not in `parentGate.ts`; the hold is the pure reducer `longPress` (`src/core/longPress.ts`) fed by `UIScene.feed` | add: a short tap today goes `holding → up → idle` with `fire: false` — the reducer has no "tap" outcome, so the hint needs a new result from `longPress` (a `tap` flag on an `up` before `holdMs` within `moveTolerance`), tested in core |
| F-02: stage change is in the parent panel (`changeStageByParent`) | confirmed: `changeStageByParent` in `src/core/placement.ts`, called by `UIScene` | none |
| F-02: age choice only at the first launch (`WelcomeScene`) | confirmed: `BootScene` starts `WelcomeScene` when `needsPlacement(learner)` (= `learner === null`); no way back to it afterwards | add: CLAUDE.md says `buildWarmup` is in `src/core/placement.ts` — it is in `src/core/round/warmup.ts` (`buildWarmup`, `warmupResult`); `warmupPending` is in `PlacedLearner` and saved (v4 fixtures carry it) |
| F-03: rounds draw 60/30/10 (`balance.curriculum.weights`, `buildAdaptiveRound`, `skillBuckets` in `src/core/curriculum.ts`) | confirmed; the draw itself is `pickRoundSkills` in `src/core/round/pick.ts` (bucket by weight, then a skill uniformly, with repeats; a review step picks a group first) | add: the variety rule belongs in or right after `pickRoundSkills` (skill choice), not in `distinctTasks` |
| F-03: `distinctTasks` (`src/core/round/unique.ts`) only guards the prompt, not the type | confirmed: `taskKey` = prompt + drawing (+ select choices); type (`SkillDef.type`, the generator key) is not looked at | none |
| F-03: the current step often has 1–2 skills of one type, so 60 % of a round is one type | partly: playable skills/types per step (measured now with `playable`): E3 `1:2/2 2:2/2 3:3/1 4:6/2 5:3/2 6:4/2 7:5/3 8:1/1 9:5/3 10:3/3 11:5/4`, E4 `1:8/5 2:1/1 3:4/1 4:4/3 5:1/1 6:5/3 7:6/3 8:2/2`; single-type steps exist in every stage (E1 6,8,10; E2 3,4,5; E3 3,8; E4 2,3,5; E5 1,6; E6 2,6) | add: ~3 of 5 tasks come from `current`; on a one-type step "max 2 per type" and the 60 % share conflict → the relax rule in decision D-3 is load-bearing, not an edge case |
| F-03: the warm-up is not mentioned | `buildWarmup` draws uniformly (`pickSkills`, with repeats) from the previous stage and the first 2 playable steps; same lack of a type rule | the variety rule also applies to the warm-up (scope.md § 1) |

### Design kit and copy this change binds (profile § 6)

- Kit (`designs/martynka-maths-A-v1/`, `style-guide.md`, `screenshots/`): views `welcome.png` (age choice — target of
  "Wróć"), `task-tiles.png` / `task-keypad.png` (task screen where "Wróć" and the gear live). The kit has **no settings
  icon, no hold hint and no back button** → DESIGN-GAP rows (next free number **151** in `docs/design-gaps.md`; rows 25
  and 28 are rewritten for the gear's new look and tap hint).
- Plan sections: `Martynka-urzadza.md` Założenia (lektor line) and the task-screen narrator bullet (F-01, updated);
  the parent settings bullet (stage change behind the gate — unchanged); `docs/ZADANIA.md` section 1 (60/30/10 shares —
  kept).
- Copy keys (`src/data/pl.ts`): new — gear hint "Przytrzymaj, żeby otworzyć ustawienia rodzica" (wording fixed by the
  maintainer), back button "Wróć" (label fixed by the maintainer; an existing key `resume: 'Wróć do notesu'` is a
  different button and is not reused). Existing `pl.settings` auto-read lines unchanged. Numbers (`src/data/balance.ts`):
  `narrator.autoReadStages` → `[]`; new variety numbers (`round.maxPerType` 2, and a no-repeat-in-a-row switch) and any
  hint duration live in `balance`, never in scenes.

## Open follow-ups whose trigger names this area

| follow-up (archive) | trigger | take |
|---|---|---|
| Audit M-1, M-2, M-13 (`TaskScene` `beginRound`/`finishRound`/`applyParentStage` commit order), H-3, H-4 (narrator `onerror`, `unlock`) — `2026-10-13-observability-c1-c2`, `2026-10-13-drawn-widget-tasks-e3-e4`, `2026-10-14-art-stand-in-and-load-signal` | next change to TaskScene round lifecycle / narrator | **Fires** (F-02 b adds a "Wróć" exit from a running round in `TaskScene`; F-01 changes the narrator default). **Out of scope** except where "Wróć" touches the same commit order: research re-reads M-1/M-2/M-13 and the plan must not add a new ordering hole (a "Wróć" mid-round must not commit a half round); a fix of the audit rows themselves stays deferred, re-recorded in this change's follow-ups |
| F5 `UIScene` long-press reset on `suspend` — `2026-10-13-parent-settings-progress` | any new overlay that calls `suspend()` while the HUD exists | **Watch**: the gear hint is drawn in the HUD and must not suspend input; if the plan makes it an overlay holding the input switch, F5 joins (feed `{ type: 'reset' }`) |
| F6 `WelcomeScene.openParent` suspender guard; F4 `active()` guard — `2026-10-13-parent-settings-progress`, `2026-10-13-observability-c1-c2`, `2026-10-13-autosave-versioned-save` | next change to WelcomeScene or UIScene | **Already closed in code**: `WelcomeScene.openParent` has the `undefined` guard and `this.session?.active()` (checked now); the plan notes it and the follow-up is marked closed in this change's follow-ups |
| Calibrate `balance.parentSettings.holdMs`/`moveTolerance` on a tablet — `2026-10-13-parent-settings-progress` | S-17 | **Not fired** (S-17); the hold stays 2 s by the maintainer's decision |
| E1/E2 parent path silent until the first canvas tap — `2026-10-13-first-launch-placement` | S-17 iPad playtest | **Mostly moot** after F-01 (no auto-read by default); left as is |
| Import from the welcome screen — `2026-10-16-save-truth` § 12 | a parent who needs to restore before the first round | **Not fired**; "Wróć" brings the welcome back, which does not add import. Out |
| `prefsKept` false path untested in `UIScene.applySettings` — `2026-10-16-stale-tab-and-health` | next change to `applySettings` | **Fires only if** the plan touches `applySettings` (auto-read is already in it; the default change should not need to). Decided in plan |
| S-07/S-06 prompt uniqueness (`distinctTasks`) — `2026-10-12-narrator-round-summary`, `2026-10-13-first-launch-placement` | S-07 | closed by S-07 (`distinctTasks`); F-03 builds next to it, keeps it |
| Warm-up clean-round bonus unscaled for 6 tasks — `2026-10-13-first-launch-placement` | S-17 | not fired, out |

## Autonomous decisions

Pre-agreed by the maintainer 2026-10-20 (`context/runs/2026-10-20-playtest-boot/scope.md` § 1 — not the agent's
choice; they override skill recommendations and earlier plan text):

- **PA-1 (F-01)** — automatic reading is OFF by default for every stage: `balance.narrator.autoReadStages` = `[]`. The
  parent can still switch it on in the settings panel as today (`Settings.autoRead`, `effectiveAutoRead`). The plan
  `Martynka-urzadza.md` (narrator: auto-read default for younger children) is updated to say so.
- **PA-2 (F-02 a)** — the gear must not look disabled (no greyed / muted look); the FIRST ordinary tap shows a short
  hint "Przytrzymaj, żeby otworzyć ustawienia rodzica" (string in `src/data/pl.ts`). Adult gate and 2 s hold unchanged.
- **PA-3 (F-02 b)** — a "Wróć" button back to the age choice on the warm-up AND on the first round, available only
  until the child has finished her first round; afterwards only the parent changes the stage (settings panel).
- **PA-4 (F-03)** — variety rule: at most 2 tasks of the same type (generator) in an ordinary round, never two of the
  same type in a row; relaxes when the step has too few types, but the 60/30/10 shares (`balance.curriculum.weights`)
  and the step unlock threshold stay. Also applies to the warm-up. Seeded core tests. No save-format change.
- **PA-5** — after the change F-01..F-03 get status "naprawione (#<PR>)" in `docs/playtest-feedback.md` (the ship step,
  docs commit on the slice branch before the merge).
- **PA-6** — save format stays v4; a v5 need stops the ship at an open PR.

Agent decisions in this step (interpretations the scope leaves open; research/plan may refine, never contradict PA-*):

- **D-1 "first round" for PA-3.** Chosen: "Wróć" shows during the warm-up (E2–E6) and during the first ordinary round
  after it (for E1, which has no warm-up, the first ordinary round only); it disappears once that first ordinary round
  is finished. Rejected: "the warm-up counts as the first round" (would make "AND on the first round" meaningless for
  E2–E6 and remove the button exactly when a child sees whether the tasks fit). Why: the child notices a wrong age by
  seeing the tasks; the scope names both screens. Would change: the maintainer reading "first round" as the warm-up.
- **D-2 what "Wróć" undoes.** Chosen: learner back to `null` (age choice again, `WelcomeScene`), the unfinished round
  dropped with no mastery/history written; stars already earned stay (stars only grow, `src/core/stars.ts`; CLAUDE.md
  "never remove stars"); room purchases untouched. "Finished the first round" is derived from saved data (e.g.
  `LearnerState.history` non-empty after `finishRound`) so a reload mid-round keeps the button, without a new save
  field. Rejected: a new saved flag (v5 risk), a full reset (loses stars). Would change: research finding that
  `history` is written before the round ends, or that a learner-less save with stars is refused by `validateSave` —
  then a runtime-only flag (button lost after a reload) is the fallback.
- **D-3 the relax rule for PA-4.** Chosen: draw the bucket by weight exactly as today (shares kept), then pick a skill
  inside that bucket preferring types not yet at the cap and not equal to the previous task's type; only when the
  bucket has no such skill does the constraint relax (first the cap, then the no-repeat), and finally the order of the
  5 tasks may be shuffled to break same-type neighbours. Rejected: re-drawing the bucket when the type is exhausted
  (moves share from `current` to `earlier`, against "shares stay"). Why: the scope keeps 60/30/10 and the unlock
  threshold; `artFilter`'s `minCurrent` stays as is. Would change: research showing order shuffling breaks a
  dependency (e.g. review-step group order, minigame letters) — then shuffling is limited to ordinary rounds.
- **D-4 gear hint scope.** Chosen: the hint shows on the first short tap per page load (runtime flag, not saved),
  drawn in the HUD near the gear for a few seconds (duration in `balance`), never holding the input switch; later short
  taps do nothing (a child is not drawn to the gear). The tap is a new outcome of the pure `longPress` reducer. Rejected:
  a hint on every tap (invites play with the gear), a saved "hint seen" flag (save format). Would change: the
  maintainer wanting it on every tap.
- **D-5 gear look.** Chosen: full opacity and the regular HUD button colours from `layout.ts` tokens (same family as
  the speaker/room switch), still label-free, still no feedback while held (gap 28 unchanged in that part). Rejected:
  a new drawn style. Would change: a designer view of the gear.
- **D-6 PRD FR-009.** Chosen: the plan includes a one-sentence edit of FR-009 in `context/foundation/prd.md` (default
  off for every stage, maintainer decision 2026-10-20) next to the `Martynka-urzadza.md` edit, so the three documents
  agree. Rejected: a follow-up only (leaves the PRD contradicting the code). Would change: the run rule that foundation
  files are written only by their 10x skill — then a follow-up with Trigger "next /10x-prd refresh".
- **D-7 next step.** `/10x-research` (not `/10x-plan` directly): three areas, a reducer extension, a round-picker rule
  with share invariants and a TaskScene exit path that crosses the M-1/M-2/M-13 commit order need grounding.
