---
change_id: post-run-polish
title: Post-run polish (task headings, round variety cap, "Obrazki" cut lines, skill id on drawing errors)
status: impl_reviewed
created: 2026-10-21
updated: 2026-10-21
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** observability audit `context/audits/observability/2026-10-20_2151-start-runda-zebatka-ukryta-karta.md`
N-1, N-4, H-2 (H-2 first raised in `context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md`);
follow-up "(impl-review F3) Cap applied in draw order" in
`context/archive/2026-10-20-playtest-fixes-f01-f03/follow-ups/review-fixes.md`; the "Oblicz" item of the 2026-10-20
run section of `docs/human-checklist.md` (comparison task on the warm-up shows "Oblicz" over "72 □ 37" with tiles
< > =, screenshot `context/archive/2026-10-20-playtest-fixes-f01-f03/screenshots/desktop-warmup-tiles.jpg`).
Autonomous run `2026-10-21-post-run-polish`, its only slice; the maintainer's decisions are in
`context/runs/2026-10-21-post-run-polish/scope.md` (copied below under Autonomous decisions). No roadmap status edits.

**Save format.** Stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`) — hard limit of the run: a change that needs v5
stops at an open PR, no merge. **None is expected:** the heading is derived from the task at render time; the
variety cap changes only which skills a round draws (nothing stored); N-1/H-2 read the runtime `REGISTRY_KEYS.bootLoad`
record (outside `SAVE_KEYS`); N-4 moves checks into `generateTask` (no stored field).

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

**Content rule:** the heading texts live in `src/data/pl.ts`, so the teacher read (`npm run sample -- <stage> --count 6`,
CLAUDE.md Working rules) is recorded in the impl-review for every stage with a changed heading (E1–E6). N-4 must not
change rng use: `npm run sample -- E1..E6` output identical before and after (scope.md).

## Source claims re-verified against the repo (branch `feat/post-run-polish` at `ba3a7c4`)

| source claim | repo now (symbols) | correction |
|---|---|---|
| "Oblicz": a comparison task gets the heading `pl.round.calculate`, drawn by `TaskScene` | confirmed: `TaskScene.drawPrompt` (the prompt-drawing branch of `render`) draws `pl.round.calculate` above any prompt where `isExpression(task.prompt)` (`src/core/round/prompt.ts`, regex of digits, signs, `□`, `=`, `?`), except in a word round; `COMPARE_NUM` "21 □ 66" matches | add: the heading is chosen by the prompt's *shape*, not by the task type — every bare expression gets it (survey below) |
| "Oblicz": "the narrator reads the same heading" (scope) | **not today**: `spokenTask` (`src/core/narration/spoken.ts`) prefixes `calculate` only when `task.speak ?? task.prompt` is an expression; COMPARE_NUM, COMPARE_EXPR, MISSING_OP and MISSING set `speak` to a question (`pl.tasks.compareSpeak` "Jaki znak pasuje w okienku? …", `compareExprSpeak`, `missingOpSpeak`, `pl.tasks.missing` "Jaka liczba pasuje w okienku?"), so the screen says "Oblicz" while the speaker asks the right question | the bug is screen-only for those four; the heading rule must be one pure function in `core` used by both `TaskScene` and `spokenTask` (decision D-2) |
| F3: `pickVariedSkills` caps in draw order, so an earlier-bucket draw can take a type slot a later one-type current draw then exceeds (E2 step 5: 3 × ADD_SUB) | confirmed: `pickVariedSkills` (`src/core/round/variety.ts`) per draw rolls a bucket (`rng.next`), picks a pool (`rng.pick` on a review step), filters `open` by `seen < maxPerType`, falls back to the whole pool when `open` is empty; called only by `variedRound` ← `buildAdaptiveRound` (`src/core/curriculum.ts`); `spreadTypes` reorders without rng | add: the warm-up (`pickVariedFromStage`, one pool per half) cannot hit this (its pool always has other types unless the stage itself is one-type); the fix is in `pickVariedSkills` only. The module doc promises "exactly the rng calls of `pickRoundSkills`"; a fix that keeps the call count keeps the bucket shares per seed (decision D-4). Audit N-3 (silent relax flag) is the same function but not in scope |
| N-1: `UIScene.openSettings` passes `background: hiddenMs > 0`; `artHealthLines` then emits `{ kind: 'cut', background: true }` → `pl.settings.artCutBackground` | confirmed: `UIScene.openSettings` (`background: …hiddenMs ?? 0) > 0`), `artHealthLines` (`src/core/artHealth.ts`), `createArtHealthView` (`src/ui/dom/artHealthView.ts`) picks `artCutBackground` vs `artCut`; `BootScene` writes `bootLoad.hiddenMs` | none; removal touches `ArtHealthLinesInput.background`, the `cut` line's `background?` field, `pl.settings.artCutBackground`, DESIGN-GAP row 153 in `docs/design-gaps.md`, and the tests/e2e that pin the background line (research lists them, e.g. e2e #15 H-1 of `load-and-tab-guard.spec.ts`) |
| H-2: "Obrazki" count `cut: bootLoad.cut.length`, which includes sounds and the font | confirmed: `UIScene.openSettings` passes `bootLoad.cut.length`; `BootScene` already records `cutByTable` (`task`, `room`, `ui`, `sound`, `font`) via `cutByTable` in `src/core/artHealth.ts` | none for the count (`cutByTable.task + room + ui`) |
| H-2 / scope: "sounds and font have their own sections" | sounds: yes, "Dźwięki" (`effectsLine` in `src/core/sound.ts`; a cut sound is not in the audio cache, so `BootScene` puts it in `soundHealth.missing`); **font: no own section** — the font is the `{ kind: 'font' }` line *inside* "Obrazki" (`pl.settings.fontFallback`, from `REGISTRY_KEYS.fontHealth`) | the font keeps its existing line in "Obrazki" (it already says the text uses a system font); only the cut *count* drops the font. No new section (decision D-6) |
| N-4: `coinLayout`, `columnSteps`/`columnMarks`, `faceDraw` throw while drawing, so `errorCode` gives `Kod: Error`/`RangeError` without the skill id | partly: `errorCode` (`src/core/save.ts`) appends `/<skillId>` only for errors carrying `skillId` (`skillFailure` in `src/core/tasks/generateTask.ts`, which wraps the generator and `assertDrawable`). **`coinLayout`** (`src/core/round/dragLayout.ts`, called in `TaskScene` with `TASK_LAYOUT.coinDrag`): two throws, too many coin kinds (`maxKinds`) and a coin index past the wallet's `dropCenters` (the latter at drag time) — not covered. **`columnSteps`** is already called by the WRITTEN generator (`src/core/tasks/generators/written.ts`), so its borrow throw already fails inside `generateTask` with the id; **`columnMarks`** (carry off the last column) runs only in `TaskScene` — not covered. **`faceDraw`**'s throw is a `never` exhaustiveness guard: unknown figures make `parseFace` return null and the widgets draw text, so it is unreachable from data; the reachable face throw is `faceLabel` (`src/core/tasks/faces.ts`, TypeError "not a face code"/"unknown figure") | scope narrows to `coinLayout` (kinds count; wallet places via `balance.coinDrag.maxTotal` vs `dropCenters`) and `columnMarks` added to `assertDrawable`-style checks at generation; `faceDraw` needs no runtime check (type-guarded); research checks where `faceLabel` runs (generation vs scene) |
| N-4: "with no change in rng use" | `assertDrawable` is called inside `generateTask`'s `try`, after the generator, before tile choices; it uses no rng | none; the new checks must be rng-free and must not import Phaser (`src/core` boundary). `coinLayout` needs `TASK_LAYOUT.coinDrag` limits from `src/data/layout.ts` — research confirms `core/tasks` may read that (it already reads `balance` and `ART_LIMITS`) or the limits move to `balance` |

### Which tasks get the generic heading today (survey, 20 draws per skill of E1–E6, `isExpression(task.prompt)`)

| type · answer mode | example prompt | gets "Oblicz" | fits? |
|---|---|---|---|
| ADD_SUB · keypad / tiles | `400 − 267`, `3 + 4` | always | yes |
| CHAIN · tiles | `3 + 2 − 1` | always | yes |
| MULT · keypad | `7 · 80` | always | yes |
| DIV · keypad | `800 : 2` | always | yes |
| ORDER_OPS · keypad | `29 + 4 · 8` | always | yes |
| **COMPARE_NUM** · tiles (< > =) | `21 □ 66` (E1.2, E2.7, E4.1, E6.10) | always | **no** — choose a sign |
| **COMPARE_EXPR** · tiles (< > =) | `2 + 6 □ 4 − 1` (E1.7) | always | **no** — compare and choose a sign |
| **MISSING_OP** · tiles (+ −) | `6 □ 2 = 4` (E1.9) | always | **no** — choose the operation sign |
| MISSING · tiles / keypad | `2 + □ = 4`, `7 · 5 = □` (E1.3, E3.2, E4.6) | always | weak — fill the box with a number |
| FACT_FAMILY · keypad (`fact_swap_20` only) | `1 + 10 = □ + 1` (E2.4) | 20 of 80 draws | weak — fill the box |
| PLACE_VALUE · keypad (`place_decompose_100`, `place_value_10000`) | `81 = 80 + □` | 26 of 200 draws | weak — fill the box |

Every other type (word problems, pictured tasks, sentences) never gets the heading. Word rounds draw no heading.

### Design kit and copy this change binds (profile § 6)

- Kit: `designs/martynka-maths-A-v1/preview.html` has only the "Oblicz · 9 lat" keypad demo (bare calculation); **no
  heading for a sign choice or a box to fill** → DESIGN-GAP row(s) (next free number **154** in `docs/design-gaps.md`).
  `style-guide.md` has no heading copy.
- Plan/catalogue: `docs/ZADANIA.md` (COMPARE_NUM, COMPARE_EXPR, MISSING_OP, MISSING task types), section 1 (60/30/10
  shares — kept).
- Copy keys (`src/data/pl.ts`): existing `pl.round.calculate` "Oblicz" (kept for calculations); new heading key(s) under
  `pl.round` — "Wstaw znak" (wording fixed by the maintainer) and, if the plan keeps decision D-1, one for a box to fill
  (agent wording, DESIGN-GAP 154/155, author may rephrase); existing speak lines `pl.tasks.compareSpeak`,
  `compareExprSpeak`, `missingOpSpeak`, `pl.tasks.missing`. "Obrazki": `pl.settings.artCut` (kept),
  `pl.settings.artCutBackground` (removed with N-1), `pl.settings.fontFallback` (unchanged). Numbers: `balance.round.variety.maxPerType` (2, unchanged), `balance.curriculum.weights` (unchanged).
- Parent-panel sections: "Obrazki" (`src/ui/dom/artHealthView.ts`, N-1 + H-2); "Dźwięki" unchanged; the "Ups!" card
  `Kod:` line (`src/ui/dom/errorCard.ts`, N-4, text unchanged, only the code gains `/<skillId>`).

## Open follow-ups whose trigger names this area

| follow-up (archive) | trigger | take |
|---|---|---|
| (impl-review F3) Cap applied in draw order — `2026-10-20-playtest-fixes-f01-f03` | a playtest note of 3 tasks of one kind | **In scope** (scope.md F3); closed by this change |
| Finer type key for the variety rule (`byType`) — same | maintainer counts set-the-clock and read-the-clock as different kinds | not fired; out |
| Audit N-3 relax flag in `pickVariedSkills` — audit 2026-10-20_2151 § 5.1 | (audit LOW) | out (scope: other LOWs stay in follow-ups); re-recorded in this change's follow-ups since the same function changes |
| Audit M-1, M-2, M-13, H-3, H-4 (`TaskScene` round lifecycle, narrator) — `2026-10-20-playtest-fixes-f01-f03` | next change to the `TaskScene` round lifecycle or the narrator | **Fires on the narrator** (heading in `spokenTask`); out of scope, the change does not touch the round lifecycle; re-recorded |
| `modeWidgets` not yet the only mode switch in `TaskScene.render` — `2026-10-16-child-flow-guards` | next change to `TaskScene.render` | **Fires** (heading drawing in `render`'s prompt branch); out of scope, re-recorded |
| L-8 DOM test of `createArtHealthView`; "Obrazki" `Kod:` line not muted — `2026-10-20-audit-boot-hidden-tab` | next change to `src/ui/dom/artHealthView.ts` | **Fires** (N-1 removes the background branch there). L-8: the plan may add a small DOM test of the cut line since it edits that branch (decided in plan); the muted `Kod:` line stays out (visual, not in scope) |
| G-2, G-3, B-4, B-5 (cut reason, `loaderror` label) — `2026-10-16-stale-tab-and-health` | next change to `BootScene.preload` or to `artHealth` | **Fires** (`artHealthLines` changes); out of scope beyond H-2, re-recorded |
| H-6 and MEDIUM/LOW rows of 2026-10-17 audit — `2026-10-20-audit-boot-hidden-tab` | next change to `loadErrorLine` or the file a row names | fires only for H-2's own row (closed here); rest out |
| A-6 / B-6 (cut boot) — `2026-10-20-audit-boot-hidden-tab`, `2026-10-17-health-lines-and-smoke` | a report of a cut boot / device measurement | not fired |
| ASL-05/08/09, A-9 forced-skill path — `2026-10-20-audit-boot-hidden-tab`, `2026-10-17-health-lines-and-smoke` | next change to `artFilter.ts` or `TaskScene.freshRound` / `withoutArtBlocked` | not fired (neither is touched) |
| ORDINAL art rule — `2026-10-16-child-flow-guards` | next change to `artFilter.ts` or `ordinal.ts` | not fired |

## Autonomous decisions

Pre-agreed by the maintainer 2026-10-21 (`context/runs/2026-10-21-post-run-polish/scope.md`; they override skill
recommendations and earlier plan text):

- **PA-1 ("Oblicz")** — a comparison task (choose < > =, e.g. "72 □ 37") gets the heading "Wstaw znak" instead of
  "Oblicz"; every other task type that gets the generic heading where it does not fit gets a fitting one (text in
  `src/data/pl.ts`, teacher read). The narrator reads the same heading.
- **PA-2 (F3)** — the cap of 2 tasks per type holds regardless of draw order; 3 of one type only when the 60/30/10
  shares force it (a one-type step). Shares and the unlock threshold unchanged; seeded tests in core.
- **PA-3 (N-1)** — remove the separate "bo gra była w tle" sentence; the ordinary cut line stays; `hiddenMs` is still
  recorded in `bootLoad`. Update DESIGN-GAP 153.
- **PA-4 (H-2)** — the number of cut files in "Obrazki" counts pictures only (no sounds, no font).
- **PA-5 (N-4)** — errors thrown while drawing (`coinLayout`, `columnSteps`/`columnMarks`, `faceDraw`) carry the skill
  id in `Kod:`, preferably by validating when the task is built (like `assertDrawable`), with no change in rng use
  (seeds and `npm run sample` unchanged).
- **PA-6** — every other LOW of audit 2026-10-20_2151 stays in follow-ups.
- **PA-7** — save format stays v4; a v5 need stops at an open PR.
- **PA-8** — content changes in `src/data/` or generators need the teacher read (`npm run sample -- <stage> --count 6`).

Agent decisions in this step (research/plan may refine, never contradict PA-*):

- **D-1 headings per type.** Chosen: three heading kinds — "Oblicz" for bare calculations (ADD_SUB, CHAIN, MULT, DIV,
  ORDER_OPS); "Wstaw znak" for sign choices (COMPARE_NUM, COMPARE_EXPR — PA-1 — and MISSING_OP, whose answer is a
  sign + / −, so the maintainer's wording fits it too); a "fill the box" heading for a number in `□` (MISSING,
  FACT_FAMILY swap, PLACE_VALUE decompose), candidate "Uzupełnij" (common school instruction; agent wording,
  DESIGN-GAP row 154, author may rephrase). Rejected: keeping "Oblicz" over `□`-number equations (scope asks to check
  every type where it does not fit, and the speaker already says "Jaka liczba pasuje w okienku?"); one heading per
  generator type (more copy, no gain). Would change: the teacher read finding "Oblicz" natural over "2 + □ = 4" in
  E1 textbooks' style, or the maintainer naming the wording — then only the sign-choice kind changes.
- **D-2 one rule for screen and speaker.** Chosen: the heading is picked by one pure function in `src/core/round/`
  (from the task: answer is a sign → sign heading; prompt contains `□` with a number answer → fill heading; bare
  expression → calculate; else none), returning a key; `TaskScene` and `spokenTask`/`narrationOf` both use it, and the
  words come from `pl`. For tasks whose `speak` already asks the question, the narrator says the heading followed by the
  expression (research checks whether the `speak` question then becomes redundant and may be dropped for these four
  types — a generator data change, rng-free, under the teacher read). Rejected: keying on `task.skillId`/type lists in
  the scene (scene logic, drifts from new types). Would change: research finding a type whose answer/prompt shape the
  rule misclassifies.
- **D-3 sample stability.** The heading change alters the `czyta:` lines of `npm run sample` (narration) but no prompt,
  answer or choice; N-4 must leave the whole sample output identical. The plan records a before/after diff of
  `npm run sample` per stage limited to `czyta:` lines.
- **D-4 F3 approach.** Chosen: keep one `rng.next()` per draw for the bucket roll so the 60/30/10 shares per seed stay
  as today, and make the skill pick inside a non-current bucket avoid a type that the *current* bucket would be forced
  to repeat (or: roll all buckets first, then pick current draws before the others); the plan picks the variant whose
  seeded tests prove "≤ 2 per type unless the rolled current share alone exceeds 2 of a one-type step". Rejected:
  re-rolling a bucket (moves shares, against PA-2). Would change: the plan showing that changing round seeds breaks
  pinned e2e expectations (`?e2eSkills` bypasses the draw, so none are expected).
- **D-5 N-1 wording.** Chosen: delete `pl.settings.artCutBackground`, the `background` input and the line's
  `background` field; every cut shows `pl.settings.artCut`; DESIGN-GAP 153 rewritten as "closed by post-run-polish:
  the background line is gone; `hiddenMs` stays in `bootLoad` and the console". Rejected: the audit's alternative
  (background only when hidden longer than half the limit) — the maintainer chose removal. Would change: nothing in
  this run (pre-agreed).
- **D-6 H-2 and the font.** Chosen: `cut` = `cutByTable.task + room + ui` lengths; the font keeps its existing
  `fontFallback` line in "Obrazki", "Dźwięki" keeps its missing-effects line; no new "cut" line for sounds (the
  audit's `withCauses` for sounds is a follow-up, not in scope). Would change: the maintainer asking for a cut cause
  in "Dźwięki".
- **D-7 N-4 coverage.** Chosen: extend `assertDrawable` (or a sibling run in the same `try` of `generateTask`) with a
  `money.pay` check (tray kinds ≤ coin-tray `maxKinds`, wallet total ≤ the art's places) and a `column` check
  (`columnMarks(v, 'all')` does not throw); `faceDraw` stays as is (type-guarded `never`), and the plan proves with a
  test that `validateTask` / generation already rejects a non-face tile value where `faceLabel` would throw. Rejected:
  wrapping `TaskPicture.render`/`modeWidgets` in a scene try/catch (scene logic, scope prefers build-time checks).
  Would change: research finding `coinLayout`'s spec must stay scene-only (then the limits move to `balance`).
- **D-8 next step.** `/10x-research` (not `/10x-plan`): five areas across core, scene, narrator and DOM panel, with
  e2e specs that pin the background line and narration texts to find.
