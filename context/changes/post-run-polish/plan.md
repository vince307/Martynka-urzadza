# Task headings, round variety cap, "Obrazki" cut lines, skill id on drawing errors — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-21-post-run-polish` (non-roadmap fix). Sources: observability audit
`context/audits/observability/2026-10-20_2151-start-runda-zebatka-ukryta-karta.md` (N-1, N-4, H-2), follow-up
"(impl-review F3) Cap applied in draw order" of `context/archive/2026-10-20-playtest-fixes-f01-f03/`, and the "Oblicz" item
of the 2026-10-20 run section of `docs/human-checklist.md`. The maintainer's decisions are fixed in
`context/runs/2026-10-21-post-run-polish/scope.md` and copied in `change.md` as PA-1..PA-8; this plan implements them and
does not re-decide them:

- **Headings (PA-1)** — a sign choice ("72 □ 37", tiles < > =) is headed "Wstaw znak", not "Oblicz"; a number to put in
  a box inside an equation is headed "Uzupełnij"; a bare calculation keeps "Oblicz". One pure rule decides it for the
  screen and the narrator, so the speaker reads the same heading.
- **F3 (PA-2)** — at most 2 tasks of one type in a round regardless of draw order; 3 only when the rolled pools force it.
  Shares (one bucket roll per draw) and unlock thresholds unchanged.
- **N-1 (PA-3)** — the "bo gra była w tle" line goes; every cut shows `pl.settings.artCut`; `hiddenMs` stays recorded.
- **H-2 (PA-4)** — the cut count of "Obrazki" counts pictures only (task, room, UI tables), not sounds or the font.
- **N-4 (PA-5)** — a tray with too many coin kinds or a carry past the last written column fails at task generation,
  so the "Ups!" card's `Kod:` carries the skill id; no change in rng use.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`; `MIGRATIONS`, `validateSave` and every frozen fixture
`tests/fixtures/save-v*.json` untouched):

| piece | what it stores | why v4 is enough |
|---|---|---|
| headings | nothing; derived from the task at render/narration time | no saved field |
| F3 | nothing; changes which skills a round draws | rounds are not saved |
| N-1, H-2 | nothing; read the runtime `REGISTRY_KEYS.bootLoad` (outside `SAVE_KEYS`) | never written by the autosaver |
| N-4 | nothing; extra checks in `assertDrawable` | no task field changes |

**A phase that finds it must change what is saved, or the meaning of a saved field, stops with `STATUS: BLOCKED`**
(scope.md hard limit: a v5 need stops the ship at an open PR).

## Current State Analysis

Grounded in `research.md` (its Code References are the source, not re-searched) and re-checked on this branch at `650e649`:

- **Heading.** `isExpression` (`src/core/round/prompt.ts`) decides both sites. Screen: `TaskScene.drawPrompt` draws
  `pl.round.calculate` above every expression prompt except in a word round (`this.kind === 'word'`). Speaker:
  `spokenTask(task, words, calculate)` (`src/core/narration/spoken.ts`) prefixes `${calculate}. ` when
  `isExpression(task.speak ?? task.prompt)`, so the four types whose `speak` is a question (COMPARE_NUM, COMPARE_EXPR,
  MISSING_OP, MISSING) are read without a heading while the screen says "Oblicz". `narrationOf` takes
  `NarrationOptions.calculate` and has no round kind, so a word round is read with "Oblicz." although the screen shows
  no heading. `TaskScene.currentNarration` and `scripts/sample.ts` (`czyta:` line) pass `pl.round.calculate`.
  `TaskScene.fitPromptToSteps` uses `isExpression` for layout only (stays). Research survey (20 draws per skill, E1–E6):
  sign tasks are exactly the expression prompts with a string answer; box-filling prompts are MISSING (box inside),
  FACT_FAMILY `fact_swap_20`, PLACE_VALUE decompose; MISSING "… = □" is a result slot.
- **F3.** `pickVariedSkills` (`src/core/round/variety.ts`) caps in draw order: over every playable step × seeds 1..200
  (12 600 rounds) 159 rounds have a type above 2 that the rolled pools could avoid (repros `E2.1` seeds 1 and 21,
  `E1.10` seed 107). Rolling all buckets first breaks oracle (a) of `tests/variety.test.ts` (bucket per draw per seed).
  A prototype rng-free repair after the unchanged draw left 0 avoidable rounds, 0 bucket changes and the rng in the
  same state.
- **N-1/H-2.** `artHealthLines` (`src/core/artHealth.ts`) takes `cut: number` and `background?: boolean`;
  `UIScene.openSettings` passes `bootLoad.cut.length` and `(hiddenMs ?? 0) > 0`; `createArtHealthView`
  (`src/ui/dom/artHealthView.ts`, `textOf`) maps the cut line to `artCutBackground` or `artCut`. `bootLoad.cutByTable`
  (from `cutByTable`) already splits `task | room | ui | sound | font`. DESIGN-GAP 153 describes the background line.
- **N-4.** `generateTask` (`src/core/tasks/generateTask.ts`) runs generator + `assertDrawable` + tile choices in one
  `try` and rethrows with `skillId` (`skillFailure`); `errorCode` adds `/<skillId>`. `coinLayout`
  (`src/core/round/dragLayout.ts`) throws on `tray.length > TASK_LAYOUT.coinDrag.maxKinds` (and lazily on a wallet index
  past `dropCenters`, already pinned by `tests/coinLayout.test.ts` against `balance.coinDrag.maxTotal`);
  `columnMarks` (`src/core/tasks/written.ts`) throws `RangeError` on a carry past `visual.columns`; both run only in
  `TaskScene`. `ART_LIMITS.trayKinds` (`src/data/measures.ts`, 4) equals `TASK_LAYOUT.coinDrag.maxKinds` (4) with no
  test tying them. `faceDraw`'s throw is a typed `never` guard (unreachable from data); `faceLabel` runs only at
  generation (already carries the id).
- `docs/design-gaps.md` ends at row 153; next free row **154**. `context/foundation/lessons.md` does not exist (checked;
  nothing to apply).
- **Baseline** (contract): `main` ba3a7c4, unit 3710, e2e 143. Every phase measures its own branch baseline before its
  first edit and writes `baseline + delta`.

## Desired End State

- A comparison task ("72 □ 37", "2 + 6 □ 4 − 1") and a missing operation ("6 □ 2 = 4") show "Wstaw znak" above the
  expression; "2 + □ = 4", "4 + 1 = 1 + □", "37 = 30 + □" show "Uzupełnij"; "38 + 27" and "17 − 8 = □" keep "Oblicz";
  sentences, pictures and word rounds show no heading (as today).
- The speaker says the heading first, then what it says today: "Wstaw znak. Jaki znak pasuje w okienku? …"; a word
  round is read with no heading. `npm run sample` differs from main only in `czyta:` lines.
- No round has 3 tasks of one type when the rolled pools allowed ≤ 2; buckets per seed and the rng state after the
  draw are exactly as today.
- "Obrazki" shows `artCut` for every cut (no "w tle" line), and only when a picture (task, room or UI table) was cut;
  `bootLoad.hiddenMs` still recorded. DESIGN-GAP 153 says the line is gone.
- A money-pay tray over the coin-tray limit or a written column whose carry runs past the last column throws inside
  `generateTask` (so `Kod: RangeError/<skillId>`); `npm run sample -- E1..E6` byte-identical across that phase.

### Key Discoveries:

- The answer type is the reliable sign signal: `generateCompareNum`, `generateCompareExpr`, `generateMissingOp` set a
  string answer; no other expression-prompt task has one (research § 1 survey).
- The repair keeps every `rng.next()`/`rng.pick` call of today's draw, so oracle (a) and the per-seed shares in
  `tests/variety.test.ts` stay the proof that shares did not move.
- `src/core` may read `src/data/layout.ts` (already done by `src/core/roomHit.ts`, `src/core/round/drawingFit.ts`), so
  the coin-tray limit needs no move to `balance`. `written.ts` imports only a type from `visual.ts`: importing
  `columnMarks` into `visual.ts` makes no runtime cycle.

## What We're NOT Doing

- No save-format change, no new saved field, no change to `MIGRATIONS` or fixtures.
- No change to the `speak` questions of COMPARE_NUM, COMPARE_EXPR, MISSING_OP, MISSING (decision P-2: heading + the
  existing question) and no generator change for the headings; no new heading for sentence or picture tasks.
- No change to `isExpression` or `fitPromptToSteps`; no new `balance` number; `balance.round.variety.maxPerType` and
  `balance.curriculum.weights` unchanged; the warm-up draw `pickVariedFromStage` and `spreadTypes` unchanged.
- No `relaxed` flag for the variety rule (audit N-3, follow-up); no new "Dźwięki" cut line (D-6); no new font section
  (the font keeps its `fontFallback` line in "Obrazki").
- No try/catch around widget renders; no runtime check for `faceDraw` (type-guarded `never`).
- No DOM test of `createArtHealthView` (L-8: vitest runs in node; follow-up). No e2e for a sounds-only cut
  (timing-sensitive; unit oracle instead, follow-up).
- Audit N-2, N-3, N-5, N-6 and every other LOW/MEDIUM still open stay in follow-ups (PA-6). No roadmap status edit.
- No edit of `docs/human-checklist.md` (the run close ticks/annotates it).

## Implementation Approach

Pure rules in `src/core` first with failing tests (heading kind, narrator heading, variety repair, picture cut count,
build-time drawing checks), then the thin scene wiring (narrator options, `drawPrompt`, `UIScene.openSettings`), the
"Obrazki" removal with its e2e pin adapted in the same phase, then docs and the seam sweep, then one e2e phase for the
heading in the browser. Strings in `pl.ts` (`pl.round.heading`), one new DESIGN-GAP row (154), row 153 rewritten.

## Critical Implementation Details

- **Heading rule order (phase 1).** `!isExpression(prompt)` → null; `typeof answer === 'string'` → `sign`; prompt has
  `□` and is not a single trailing result slot → `fill`; else `calculate`. "Single trailing result slot" = exactly one
  `□` in the prompt and the trimmed prompt ends with `= □` (so "7 + 6 = □" → calculate, "4 + 1 = 1 + □" → fill,
  "2 + □ = 4" → fill). A `?` prompt is not a box (calculate).
- **Repair keeps rng (phase 4).** Draw exactly as today, remembering each draw's rolled pool (after the group pick on
  a review step). Only when some type ends above `maxPerType`: search (backtracking, deterministic order) an
  assignment of one type per draw, each type from that draw's own pool, at most `maxPerType` per type, preferring the
  drawn type at every draw; for a draw whose type changes take a skill of the new type from the same pool without rng
  (the first in pool order). No assignment → return the greedy draw unchanged (the forced case). No extra rng call in
  any branch. `spreadTypes` then reorders as today.

## Phase 1: One heading rule for a task (PA-1 core)

Driver: tdd
Driver why: `headingOf` is an absent pure function with an exact oracle per prompt shape — failing tests lead.

### Overview

`src/core/round/heading.ts` decides the heading kind of a task from its prompt and answer.

### Changes Required:

#### 1. Rule

**File**: `src/core/round/heading.ts` (new)

**Intent**: the one place that says which heading a task gets, per Critical Implementation Details; module comment
names PA-1 and that screen and narrator both use it.

**Contract**: `export type HeadingKind = 'calculate' | 'sign' | 'fill'`; `export interface HeadingWords { calculate:
string; sign: string; fill: string }`; `export const headingOf = (task: Pick<Task, 'prompt' | 'answer'>): HeadingKind |
null`. Uses `isExpression`; no Phaser, no rng.

#### 2. Tests

**File**: `tests/heading.test.ts` (new)

**Contract**: literal cases: `38 + 27` → calculate; `3 + 2 − 1` → calculate; `17 − 8 = □` (number) → calculate;
`21 □ 66` with `'<'` → sign; `2 + 6 □ 4 − 1` with `'>'` → sign; `6 □ 2 = 4` with `'+'` → sign; `2 + □ = 4` → fill;
`4 + 1 = 1 + □` → fill; `81 = 80 + □` → fill; `3 + ? = 5` → calculate; a sentence ("Ala ma 3 jabłka…") → null;
a prompt with NBSP-grouped numbers (`12 000 + 5 000`) → calculate. Survey case: every skill of E1–E6 × 20 seeds via
`generateTask`: every task with a string answer and an expression prompt is `sign`; every `sign` task's skill type is
one of COMPARE_NUM, COMPARE_EXPR, MISSING_OP (guards a future type the rule misclassifies, R-3 of research).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error: export a stub returning null first), green after; unit `<branch baseline> + N`
- Deliberate break: return `calculate` for string answers → the three sign cases red; drop the trailing-slot exception → `17 − 8 = □` red; each restored; meta-check: the survey case enumerates generated tasks and asserts a non-zero count of sign tasks (E1, E2, E4, E6) and fill tasks (E1, E2), so it cannot pass vacuously
- `grep -rn "headingOf" src` lists only `src/core/round/heading.ts` (no consumer yet)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (e2e part left to the orchestrator)

---

## Phase 2: The narrator reads the heading (PA-1 speaker)

Driver: tdd
Driver why: the heading prefix for tasks with a `speak` question and the word-round silence are absent behaviour of the pure `spokenTask`/`narrationOf` — failing tests in `tests/spoken.test.ts` lead.

### Overview

`spokenTask` and `narrationOf` take the heading words; the words live in `pl.round.heading`; `TaskScene` and the
sample script pass them; a word round passes none.

### Changes Required:

#### 1. Narration

**File**: `src/core/narration/spoken.ts`

**Intent**: the spoken task is `${heading}. ${spokenText(task.speak ?? task.prompt)}` when `headingOf(task)` gives a
kind and headings are on, else the spoken text alone (decision P-2: the existing question stays after the heading).
Doc comment: the screen and the speaker share `headingOf`.

**Contract**: `spokenTask(task, words, headings: HeadingWords | null): string`; `NarrationOptions` replaces
`calculate: string` with `headings: HeadingWords | null` (null = no heading, a word round). `narrationOf` passes it in
phases `first`, `done` and `second` without a hint (as today).

#### 2. Copy and callers

**Files**: `src/data/pl.ts` (`round.heading: { calculate: 'Oblicz', sign: 'Wstaw znak', fill: 'Uzupełnij' }`, removing
`round.calculate`), `src/scenes/TaskScene.ts` (`currentNarration`: `headings: this.kind === 'word' ? null :
pl.round.heading`), `scripts/sample.ts` (`czyta:` line passes `pl.round.heading`), `docs/design-gaps.md` (row **154**:
"The kit has no heading for a sign choice or a box to fill" — "Wstaw znak" wording from the maintainer, "Uzupełnij"
agent wording consistent with `pl.tasks.bonds`/`sequence`, the author may rephrase; place: the heading above the
expression; files `src/data/pl.ts` `round.heading`, `src/core/round/heading.ts`).

**Intent**: one word table for screen and speaker; `drawPrompt` keeps drawing "Oblicz" until phase 3 (it reads
`pl.round.heading.calculate` in this phase so the build stays green).

**Contract**: `pl.round.heading` satisfies `HeadingWords`; `grep -rn "round.calculate" src scripts tests` empty after.

#### 3. Tests

**File**: `tests/spoken.test.ts`

**Contract**: the `command` helper and the `narrationOf` describe pass `pl.round.heading`; the three "Oblicz. …"
expectations on ADD_SUB stay; new: a COMPARE_NUM task (`prompt '3 □ 5'`, answer `'<'`, `speak` from
`pl.tasks.compareSpeak`) → starts with "Wstaw znak. Jaki znak pasuje w okienku?"; MISSING `2 + □ = 4` → starts with
"Uzupełnij. "; MISSING `7 + 6 = □` → starts with "Oblicz. "; a sentence task → no heading; `headings: null` on an
ADD_SUB task → no "Oblicz." (word round).

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-1 count> + N`
- Deliberate break: keep today's `isExpression(task.speak ?? task.prompt)` gate → the COMPARE_NUM and MISSING cases red; ignore `headings: null` → the word-round case red; each restored; meta-check: the "Wstaw znak." case must fail on today's code with no prefix at all (check the received value), proving the test sees the missing heading
- Sample diff limited to narration: before the first edit save `npm run sample -- <S>` for E1–E6 to the scratchpad; after the change `diff` each; every changed line starts with `      czyta:` and differs only by a heading prefix (`Wstaw znak. `/`Uzupełnij. ` added where today no prefix is read — COMPARE_NUM, COMPARE_EXPR, MISSING_OP, MISSING; `Oblicz. ` replaced by `Uzupełnij. ` where today's plain-expression narration already had it — FACT_FAMILY `fact_swap_20`, PLACE_VALUE decompose; `Oblicz. ` added before a MISSING result-slot question; `Oblicz. ` kept elsewhere); no prompt, answer, choice or hint line changes
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator.spec.ts` compares the spoken text with the hook's `narration`, which this phase changes in step)

#### Manual Verification:

- [reviewer] Teacher read: `npm run sample -- E1 --count 6` … `E6 --count 6`, every `czyta:` line of the changed steps (E1.2, E1.3, E1.7, E1.9, E2.4, E2.7, E3.2, E4.1, E4.6, E6.10 and the PLACE_VALUE decompose steps): heading fits the task, "Wstaw znak." before a sign question is natural for a 6–9-year-old, "Uzupełnij." before "Jaka liczba pasuje w okienku?" reads well
- [human] On a tablet with a Polish voice: tap the speaker on a comparison task — "Wstaw znak" is pronounced clearly and the pause after it is natural

---

## Phase 3: The task screen draws the heading from the rule (PA-1 screen)

Driver: impl
Driver why: scene glue — `drawPrompt` reads the phase-1 rule and the e2e hook exposes the drawn heading; canvas output is proven by phase 9's e2e and screenshots.

### Overview

`TaskScene.drawPrompt` draws `pl.round.heading[headingOf(task)]` (none in a word round); the hook build reports the
drawn heading text.

### Changes Required:

#### 1. Scene

**File**: `src/scenes/TaskScene.ts` (`drawPrompt`)

**Intent**: inside the `isExpression(task.prompt)` branch, the heading text comes from `headingOf(task)` and
`pl.round.heading`; nothing drawn in a word round (as today); the scene keeps the drawn heading text in a field the
hook reads (null when none drawn). No new layout constant; same style and position as today's "Oblicz".

**Contract**: no balance numbers or Polish text in the scene beyond `pl` reads; `isExpression` stays the layout
switch.

#### 2. Hook

**Files**: `src/scenes/TaskScene.ts` (`TaskSnapshot` interface and `snapshot()`, which already carry `narration`;
`src/testing/e2eHook.ts` spreads `task().snapshot()` into the hook snapshot, so it needs no edit), `tests/e2e/support/hook.ts`
(snapshot type, beside `narration`)

**Intent**: expose `heading: string | null`, the text the scene drew for the current task (hook build only).

**Contract**: read-only, from the scene field, not recomputed from the task; absent from `dist/` (build guard).

### Success Criteria:

#### Automated Verification:

- `grep -n "headingOf\|round.heading" src/scenes/TaskScene.ts` shows `drawPrompt` and `currentNarration`; `grep -rn "'Oblicz'\|\"Oblicz\"" src --include=*.ts` lists only `src/data/pl.ts`
- Deliberate break: no unit test renders the canvas (node environment); record that the proof is phase 9's spec (break: draw `pl.round.heading.calculate` for every kind → red) plus the [visual] rows
- `npm run build` prints `e2e hook: absent (` (the `heading` field stays in the hook build)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Desktop 1440 and tablet 1024 (hook build, `?e2eSkills=`): a comparison task (E1.2 `compare_num_5`) shows "Wstaw znak" above "a □ b" with tiles < > =; a box-filling task (E1.3 `missing_5` with the box inside, or E2.4 `fact_swap_20`) shows "Uzupełnij"; an ordinary ADD_SUB task shows "Oblicz"; the heading sits where "Oblicz" sat, nothing overlaps at 1024

---

## Phase 4: The variety cap holds regardless of draw order (F3)

Driver: tdd
Driver why: the rng-free repair is absent behaviour of the pure `pickVariedSkills` with seeded repros that fail today (`E2.1` seed 1, `E1.10` seed 107) — failing tests lead.

### Overview

`pickVariedSkills` draws as today and then repairs an avoidable over-cap round without rng.

### Changes Required:

#### 1. Repair

**File**: `src/core/round/variety.ts`

**Intent**: per Critical Implementation Details; module comment updated: the cap holds over the whole round whenever
the rolled pools allow it, the rng calls are still exactly those of `pickRoundSkills`.

**Contract**: `pickVariedSkills` and `variedRound` signatures unchanged; a private helper may hold the search; no rng
in the repair; the returned skills each stay inside their own rolled pool (or group).

#### 2. Tests

**File**: `tests/variety.test.ts`

**Contract**: seeded reds with the real curriculum and the weights of the existing real-curriculum describe: `E2.1`
seeds 1 and 21, `E1.10` seed 107 → no type above 2; the real-curriculum loop (every playable step × 200 seeds) gains
"no type above 2 whenever an assignment within the rolled pools exists" (the test computes existence by brute force
over the recorded pools, independent of the implementation's search) and "the next `rng.next()` after
`pickVariedSkills` equals the next after `pickRoundSkills` on the same seed"; oracles (a) buckets per seed, (e) skill
inside its rolled pool/group, the shares and the synthetic cases unchanged and green.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (the seeded repros show 3 of one type on today's code), green after; unit `<phase-3 count> + N`
- Shares and buckets unchanged: `git diff main -- tests/variety.test.ts | grep '^-[^-]'` empty (only additions) and oracle (a) green; `git diff --stat main -- src/data/balance.ts src/core/curriculum.ts src/core/mastery.ts` empty (unlock thresholds and weights untouched)
- Deliberate break: skip the repair → the seeded repros red; take the replacement skill with `rng.pick` → oracle (a) or the rng-state case red; each restored; meta-check: the brute-force existence check must be independent of the repair (it never calls it), otherwise "repair finds one" proves only itself
- `npm run sample -- E1` … `E6` output byte-identical to the phase-3 commit (sample draws per step, not rounds; proves no generator or skill table moved)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (round contents are seeded by `Date.now()` and e2e forces skills with `?e2eSkills`)

---

## Phase 5: "Obrazki" drops the background line (N-1)

Driver: impl
Driver why: a removal (input flag, line field, string, view branch, caller) whose pins are rewritten, not a new behaviour a failing test could lead.

### Overview

Every cut shows `pl.settings.artCut`; `hiddenMs` stays in `bootLoad`, the console and the hook; the e2e pin of the
background line is adapted in this phase.

### Changes Required:

#### 1. Rule, copy, view, caller

**Files**: `src/core/artHealth.ts` (`ArtHealthLinesInput.background` and the `cut` line's `background` field and branch
removed), `src/data/pl.ts` (`settings.artCutBackground` removed), `src/ui/dom/artHealthView.ts` (`textOf` `case 'cut'`
→ `artCut` only), `src/scenes/UIScene.ts` (`openSettings`: no `background` argument)

**Intent**: after H-1 hidden time never causes a cut, so the background cause is false (audit N-1, PA-3).

**Contract**: cut line `{ kind: 'cut'; count: number }`; `REGISTRY_KEYS.bootLoad` still `{ cut, cutByTable, creates,
elapsedMs, hiddenMs }`; `BootScene` unchanged.

#### 2. Design gap

**File**: `docs/design-gaps.md`

**Intent**: row **153** rewritten as closed by post-run-polish: the background line is gone (hidden time no longer
cuts, audit N-1); `hiddenMs` stays in `bootLoad` and the console.

#### 3. Tests and the e2e pin

**Files**: `tests/artHealthLines.test.ts` (the three `background` cases → one case: a load with time hidden and a cut
gives exactly `{ kind: 'cut', count }` with `toEqual`), `tests/artHealthText.test.ts` (`describe('pl.settings.artCutBackground')`
removed; `artCut` text case kept), `tests/e2e/load-and-tab-guard.spec.ts` (`#15 H-1 …`: title "… the cut comes when it
is shown and the panel shows the ordinary cut line"; the last assertions flip to `artCut` visible and no "w tle" text)

**Contract**: e2e test count unchanged (one title edited).

### Success Criteria:

#### Automated Verification:

- `grep -rn "artCutBackground\|background" src/core/artHealth.ts src/ui/dom/artHealthView.ts src/scenes/UIScene.ts src/data/pl.ts` shows no background cut code (only unrelated words, named in the commit); `grep -n "hiddenMs" src/scenes/BootScene.ts src/data/layout.ts` still shows the record
- Unit `<phase-4 count> − removed + added` (three `background` cases replaced by one, the `artCutBackground` describe removed; both numbers named in the commit) and green
- Deliberate break: add `background: true` back to the cut line when hidden → the `toEqual` case red; map `case 'cut'` to `pl.settings.artRestart` in `textOf` → the adapted `#15 H-1` and `#14 B-4` red (orchestrator, or the agent with `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` if Chromium starts); each restored
- `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `load-and-tab-guard.spec.ts` green alone

---

## Phase 6: The cut count counts pictures only (H-2)

Driver: tdd
Driver why: the picture-only cut count is an absent pure helper over `cutByTable` with exact oracles — failing tests lead; the `UIScene` call follows.

### Overview

A start that cut only sounds or the font shows no "Część obrazków…" line.

### Changes Required:

#### 1. Helper and caller

**Files**: `src/core/artHealth.ts`, `src/scenes/UIScene.ts` (`openSettings`)

**Intent**: `pictureCutCount` sums the `task`, `room` and `ui` lists of a `cutByTable` record (0 when the record is
absent or a list is missing); `openSettings` passes it as `cut` instead of `bootLoad.cut.length`. Sounds keep
"Dźwięki" (`effectsLine`), the font its `fontFallback` line.

**Contract**: `pictureCutCount(byTable: Partial<Record<ArtTable | 'font', readonly string[]>> | undefined): number`;
`ArtHealthLinesInput.cut` doc: "How many pictures the boot limit cut".

#### 2. Tests

**File**: `tests/artHealth.test.ts` (it already tests `cutByTable`)

**Contract**: `{ task: [a], room: [b], ui: [], sound: [s], font: [f] }` → 2; only `sound` and `font` → 0, and
`artHealthLines` with that count has no cut line; `undefined` → 0; a record without `ui` → counts the rest.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-5 count> + N`
- Deliberate break: count all five lists → the sounds-only case red; restored; meta-check: the record in the test is built with the real `cutByTable` from file keys of `SOUNDS` and the font key, so it is the shape `BootScene` writes
- `grep -n "cut.length" src/scenes/UIScene.ts` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#14 B-4` and `#15 A-1/A-2` cut pictures, so `artCut` still shows)

#### Manual Verification:

- [visual] Settings "Obrazki" at 1440 and 1024 wide after a cut start (hook build `?e2eArt=stallall`): the ordinary cut line, no "w tle" sentence, layout of the section unchanged

---

## Phase 7: Drawing limits fail at generation with the skill id (N-4)

Driver: tdd
Driver why: the `money` pay and `column` cases of `assertDrawable` are absent rng-free checks with exact failing fixtures — failing tests lead.

### Overview

`assertDrawable` learns the two drawing throws that can still happen only in the scene.

### Changes Required:

#### 1. Checks

**File**: `src/core/tasks/visual.ts` (`assertDrawable`)

**Intent**: `case 'money'` with `pay`: `v.pay.tray.length > TASK_LAYOUT.coinDrag.maxKinds` → `RangeError` (same limit
`coinLayout` enforces, read from `src/data/layout.ts`; no import of `dragLayout`); `case 'column'`: call
`columnMarks(v, 'all')` (the `'first'` phase filters the `'all'` result, so this covers every phase). Comment: audit
N-4; `faceDraw` needs no check (typed `never`), `faceLabel` already runs at generation.

**Contract**: no rng, no field change, `assertDrawable` stays inside `generateTask`'s `try` (unchanged).

#### 2. Tests

**Files**: `tests/generateTaskFailure.test.ts` (its `vi.mock` of the registry with the `FAKE` generator is the seam; the
icon-pool case there is the model), `tests/coinLayout.test.ts`

**Contract**: a `FAKE` test generator returning a money pay visual with `maxKinds + 1` tray kinds → `generateTask`
throws with `skillId` and name `RangeError`; one returning a column whose carry runs past the last column → same; a
test generator calling `faceLabel` on a non-face code → the thrown error carries `skillId`; data invariant
`ART_LIMITS.trayKinds <= TASK_LAYOUT.coinDrag.maxKinds`.

### Success Criteria:

#### Automated Verification:

- New tests red before the change, green after; unit `<phase-6 count> + N`
- Deliberate break: drop the `column` case → the column test red; drop the `money` case → the tray test red; set `ART_LIMITS.trayKinds` to 5 → the invariant red; each restored; meta-check: each bad fixture is first passed to `columnMarks` / `coinLayout(TASK_LAYOUT.coinDrag, tray)` directly in the test and throws there, so it is the scene-throwing input
- Seeds unchanged: `npm run sample -- E1` … `E6` byte-identical to the phase-6 commit (saved before the first edit, `diff` empty); the existing "does not consume rng differently from the generator" case of `tests/generateTask.test.ts` green; `git diff main -- tests/contentInvariants.test.ts tests/solvableInMode.test.ts` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`money-pay.spec.ts`, `written-column.spec.ts` green)

---

## Phase 8: Docs, follow-ups and seam sweep

Driver: impl
Driver why: rule-file text, comments, design-gap rows and the follow-ups file over phases 1–7 — docs and glue, proven by the gate.

### Overview

The rule files say what the code now does; deferred items get triggers; leftovers go.

### Changes Required:

#### 1. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` if it repeats the same facts — grep first)

**Intent**: fix the sentences made untrue: the variety rule ("at most 2 tasks of one type … relaxed …") now holds over
the whole round regardless of draw order (rng-free repair in `pickVariedSkills`); the boot-load sentence that says
"Obrazki" shows `pl.settings.artCutBackground` when the load spent time hidden (now: the ordinary cut line, counting
pictures only via `pictureCutCount`); add one sentence for this change (`headingOf` in `src/core/round/heading.ts`,
`pl.round.heading` "Oblicz"/"Wstaw znak"/"Uzupełnij" for screen and narrator, word round without heading, gap 154;
`assertDrawable` covers the coin tray and the written column; save format stays v4).

#### 2. Comments

**Files**: `src/core/round/prompt.ts` (header: "shown large under the word Oblicz" → under its heading,
`headingOf`), `src/core/narration/spoken.ts`, `src/core/round/variety.ts`, `src/data/layout.ts`
(`REGISTRY_KEYS.bootLoad` comment if it mentions the background line), anything else phases 1–7 left stale (grep
`Oblicz`, `artCutBackground`, `background`, `draw order`)

#### 3. Follow-ups

**File**: `context/changes/post-run-polish/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item, each with a `Trigger:` line: audit N-2, N-3 (relax flag), N-5, N-6 and the
other open rows of the 2026-10-20_2151 report (PA-6); M-1, M-2, M-13, H-3, H-4 (round lifecycle, narrator); `modeWidgets`
not yet the only mode switch in `TaskScene.render`; G-2, G-3, B-4, B-5; "Obrazki" `Kod:` line not muted; L-8 DOM test of
`createArtHealthView`; e2e for a sounds-only cut; the `speak` questions possibly redundant after the heading (Trigger:
teacher read or playtest note that "Wstaw znak. Jaki znak …" is too long → drop them, rng-free); "Uzupełnij" wording
(Trigger: the author rephrases gap 154); finer type key for the variety rule (re-recorded); F3 closed by this change
(entry marked closed, pointing at phase 4).

### Success Criteria:

#### Automated Verification:

- `grep -rn "artCutBackground" src tests CLAUDE.md AGENTS.md` empty; `grep -rn "round.calculate" src scripts tests` empty
- `grep -c "^Trigger:" context/changes/post-run-polish/follow-ups/review-fixes.md` ≥ 12
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS (every path CLAUDE.md names exists)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] The CLAUDE.md sentences match the code (`grep` each named symbol: `headingOf`, `pl.round.heading`, `pictureCutCount`, `assertDrawable` cases); save format v4 stated; DESIGN-GAP 153 and 154 read correctly

---

## Phase 9: The heading on screen and in the narration — e2e (#11)

Driver: e2e
Driver why: risk #11 (the round as the child sees and hears it) — the heading is canvas text drawn by `TaskScene` and the narration is wired by the scene, built in phases 2–3, contract `E2E=on`.

### Overview

One new test in `tests/e2e/narrator.spec.ts` (hook build, port 4397) pins the drawn heading and the spoken heading for
a sign task and a calculation.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/narrator.spec.ts` (title `#11 heading …`)

**Contract**: model on the existing narrator tests (Polish voice fake, `snapshot`, `targets`); `?e2eSkills=E1.2.compare_num_5`
(E1, automatic reading on): `snapshot.heading` equals `pl.round.heading.sign` and `snapshot.narration` starts with
`${pl.round.heading.sign}. `; a second context or round with an E1 ADD_SUB skill id (taken from `src/data/curriculum/E1.ts`):
heading `pl.round.heading.calculate`. Strings from `pl`, never literals in the spec.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate break: `drawPrompt` draws `pl.round.heading.calculate` for every kind → the heading assertion red; `currentNarration` passes `headings: null` → the narration assertion red), green after; restored
- `npx playwright test tests/e2e/narrator.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `headingOf` per prompt shape plus a survey over every skill of E1–E6.
- `spokenTask`/`narrationOf` heading prefix with and without a `speak` question, word round without heading.
- `pickVariedSkills`: seeded repros, brute-force existence oracle, rng state, oracles (a)–(e) unchanged.
- `artHealthLines` cut line without `background`; `pictureCutCount` over the real `cutByTable` shape.
- `assertDrawable` money tray and column; `faceLabel` failure carries the skill id; tray-limit invariant.

### Integration Tests:

- e2e `#15 H-1` adapted (ordinary cut line after a hidden span); new `#11 heading` (screen + narration).

### Manual Testing Steps:

1. Hook build, `?e2eSkills=E1.2.compare_num_5`: "Wstaw znak" above the comparison; speaker says "Wstaw znak. Jaki znak …".
2. A box-filling and an ordinary task: "Uzupełnij" / "Oblicz".
3. `?e2eArt=stallall`: "Obrazki" shows the ordinary cut line.

## Performance Considerations

The repair runs only for a round already over the cap: at most 5 draws × a handful of types, a negligible search.
`assertDrawable`'s column check runs `columnMarks` once per written task at generation.

## Migration Notes

None: save format v4 unchanged (table in Overview).

## Known risks

- The repair picks the first skill of the new type in the pool, so that skill appears a little more often in repaired
  rounds; `distinctTasks` still redraws repeated prompts. Accepted (rng-free is the share contract).
- "Uzupełnij" is agent wording (gap 154); the author may rephrase it — a one-string change in `pl.ts`.
- The heading followed by the existing question ("Wstaw znak. Jaki znak pasuje w okienku?") is slightly redundant, and
  COMPARE_EXPR reads three directives ("Wstaw znak. Porównaj wyniki. Jaki znak pasuje w okienku? …"); a MISSING result slot
  reads "Oblicz. Jaka liczba pasuje w okienku? …". Each is one imperative plus one question (no double question), acceptable
  for a 6–9-year-old; the teacher read 2.5 judges it, follow-up with a trigger (plan review F4).

## Autonomous decisions

- **P-1 "… = □" (MISSING result slot) keeps "Oblicz"** (research recommendation). Rejected: "Uzupełnij" for every box.
  Why: the slot is a calculation with a box for the result (the `prompt.ts` comment already calls "17 − 8 = □" a
  calculation); the child computes, nothing is to be balanced. Would change: the teacher read preferring one heading
  per generator type (then MISSING gets `fill` for both shapes — one condition in `headingOf`).
- **P-2 Speaker = heading + what it says today** (research option (b)). Rejected: (a) heading + bare spoken prompt,
  dropping the four `speak` questions. Why: no generator or task-data change (lower content risk, rng-free trivially);
  the question explains the "okienko" a 6-year-old hears; PA-1 only requires the same heading. Would change: the teacher
  read or a playtest note that it is too long (follow-up, Trigger in phase 8).
- **P-3 A word round is read without a heading** (research side note, decided in scope). Why: PA-1 "the narrator reads
  the same heading" — the screen draws none there; `NarrationOptions.headings: null` is one line in the scene. Would
  change: nothing in this run.
- **P-4 Headings keyed on answer type + box position, one pure function** (change.md D-1/D-2, research R-3). Rejected:
  a per-type list in the scene. Would change: a future expression task with a string answer that is not a sign (the
  phase-1 survey case turns red).
- **P-5 F3 = unchanged draw + rng-free backtracking repair** (D-4, research R-2). Rejected: rolling buckets first
  (breaks oracle (a)), re-rolling (moves shares). Would change: the maintainer accepting different buckets per seed.
- **P-6 N-1 removal adapts e2e `#15 H-1` in the same phase** (step prompt). Rejected: a separate e2e phase. Why: the
  spec pins the removed line and would stay red otherwise; the test count does not change.
- **P-7 H-2 via `pictureCutCount` in core; font keeps its line in "Obrazki"** (D-6, R-5). Rejected: a new font section.
  Would change: the maintainer asking for a cut cause in "Dźwięki".
- **P-8 N-4 narrowed to the coin tray and the column** (D-7, R-4); the wallet-place limit stays a data invariant
  (already pinned); `faceDraw` unchecked (typed `never`). Would change: an ESLint boundary rule against `core` reading
  `data/layout`.
- **P-9 One e2e phase (#11 heading) after the sweep; the hook gains `heading`.** Rejected: no e2e (the canvas text
  would be proven only by screenshots). Would change: the hook snapshot already carrying the drawn prompt texts.
- **P-10 No `[human]` row for a PRD conflict**: no decision here goes against the PRD's literal text (the PRD names no
  heading wording; FR-009 asks only that the child can hear the task). The one `[human]` row (2.6) is a real-device
  listening check.

## References

- Research: `context/changes/post-run-polish/research.md`
- Change identity, PA-1..PA-8, D-1..D-8: `context/changes/post-run-polish/change.md`
- Scope: `context/runs/2026-10-21-post-run-polish/scope.md`
- Audit: `context/audits/observability/2026-10-20_2151-start-runda-zebatka-ukryta-karta.md` (N-1, N-4, H-2)
- F3: `context/archive/2026-10-20-playtest-fixes-f01-f03/follow-ups/review-fixes.md`
- Format example: `context/archive/2026-10-20-audit-boot-hidden-tab/plan.md`
- Test-plan risks #11, #15: `context/foundation/test-plan.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: One heading rule for a task (PA-1 core)

#### Automated

- [x] 1.1 New tests red before the change (assertion, not import error: export a stub returning null first), green after; unit `<branch baseline> + N` — 11f0c69
- [x] 1.2 Deliberate break: return `calculate` for string answers → the three sign cases red; drop the trailing-slot exception → `17 − 8 = □` red; each restored; meta-check: the survey case enumerates generated tasks and asserts a non-zero count of sign tasks (E1, E2, E4, E6) and fill tasks (E1, E2), so it cannot pass vacuously — 11f0c69
- [x] 1.3 `grep -rn "headingOf" src` lists only `src/core/round/heading.ts` (no consumer yet) — 11f0c69
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (e2e part left to the orchestrator) — 11f0c69

### Phase 2: The narrator reads the heading (PA-1 speaker)

#### Automated

- [x] 2.1 New tests red before the change, green after; unit `<phase-1 count> + N` — 3be7518
- [x] 2.2 Deliberate break: keep today's `isExpression(task.speak ?? task.prompt)` gate → the COMPARE_NUM and MISSING cases red; ignore `headings: null` → the word-round case red; each restored; meta-check: the "Wstaw znak." case must fail on today's code with no prefix at all (check the received value), proving the test sees the missing heading — 3be7518
- [x] 2.3 Sample diff limited to narration: before the first edit save `npm run sample -- <S>` for E1–E6 to the scratchpad; after the change `diff` each; every changed line starts with `      czyta:` and differs only by a heading prefix (`Wstaw znak. `/`Uzupełnij. ` added where today no prefix is read — COMPARE_NUM, COMPARE_EXPR, MISSING_OP, MISSING; `Oblicz. ` replaced by `Uzupełnij. ` where today's plain-expression narration already had it — FACT_FAMILY `fact_swap_20`, PLACE_VALUE decompose; `Oblicz. ` added before a MISSING result-slot question; `Oblicz. ` kept elsewhere); no prompt, answer, choice or hint line changes — 3be7518
- [x] 2.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`narrator.spec.ts` compares the spoken text with the hook's `narration`, which this phase changes in step) — 3be7518 (e2e 143+0, orchestrator)

#### Manual

- [ ] 2.5 [reviewer] Teacher read: `npm run sample -- E1 --count 6` … `E6 --count 6`, every `czyta:` line of the changed steps (E1.2, E1.3, E1.7, E1.9, E2.4, E2.7, E3.2, E4.1, E4.6, E6.10 and the PLACE_VALUE decompose steps): heading fits the task, "Wstaw znak." before a sign question is natural for a 6–9-year-old, "Uzupełnij." before "Jaka liczba pasuje w okienku?" reads well
- [ ] 2.6 [human] On a tablet with a Polish voice: tap the speaker on a comparison task — "Wstaw znak" is pronounced clearly and the pause after it is natural

### Phase 3: The task screen draws the heading from the rule (PA-1 screen)

#### Automated

- [x] 3.1 `grep -n "headingOf\|round.heading" src/scenes/TaskScene.ts` shows `drawPrompt` and `currentNarration`; `grep -rn "'Oblicz'\|\"Oblicz\"" src --include=*.ts` lists only `src/data/pl.ts` — 8a0f76d
- [x] 3.2 Deliberate break: no unit test renders the canvas (node environment); record that the proof is phase 9's spec (break: draw `pl.round.heading.calculate` for every kind → red) plus the [visual] rows — 8a0f76d
- [x] 3.3 `npm run build` prints `e2e hook: absent (` (the `heading` field stays in the hook build) — 8a0f76d
- [x] 3.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` — 8a0f76d (e2e 143+0, orchestrator)

#### Manual

- [ ] 3.5 [visual] Desktop 1440 and tablet 1024 (hook build, `?e2eSkills=`): a comparison task (E1.2 `compare_num_5`) shows "Wstaw znak" above "a □ b" with tiles < > =; a box-filling task (E1.3 `missing_5` with the box inside, or E2.4 `fact_swap_20`) shows "Uzupełnij"; an ordinary ADD_SUB task shows "Oblicz"; the heading sits where "Oblicz" sat, nothing overlaps at 1024

### Phase 4: The variety cap holds regardless of draw order (F3)

#### Automated

- [x] 4.1 New tests red before the change (the seeded repros show 3 of one type on today's code), green after; unit `<phase-3 count> + N` — ccf03af
- [x] 4.2 Shares and buckets unchanged: `git diff main -- tests/variety.test.ts | grep '^-[^-]'` empty (only additions) and oracle (a) green; `git diff --stat main -- src/data/balance.ts src/core/curriculum.ts src/core/mastery.ts` empty (unlock thresholds and weights untouched) — ccf03af
- [x] 4.3 Deliberate break: skip the repair → the seeded repros red; take the replacement skill with `rng.pick` → oracle (a) or the rng-state case red; each restored; meta-check: the brute-force existence check must be independent of the repair (it never calls it), otherwise "repair finds one" proves only itself — ccf03af
- [x] 4.4 `npm run sample -- E1` … `E6` output byte-identical to the phase-3 commit (sample draws per step, not rounds; proves no generator or skill table moved) — ccf03af
- [ ] 4.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (round contents are seeded by `Date.now()` and e2e forces skills with `?e2eSkills`)

### Phase 5: "Obrazki" drops the background line (N-1)

#### Automated

- [x] 5.1 `grep -rn "artCutBackground\|background" src/core/artHealth.ts src/ui/dom/artHealthView.ts src/scenes/UIScene.ts src/data/pl.ts` shows no background cut code (only unrelated words, named in the commit); `grep -n "hiddenMs" src/scenes/BootScene.ts src/data/layout.ts` still shows the record — bb295b4
- [x] 5.2 Unit `<phase-4 count> − removed + added` (three `background` cases replaced by one, the `artCutBackground` describe removed; both numbers named in the commit) and green — bb295b4
- [x] 5.3 Deliberate break: add `background: true` back to the cut line when hidden → the `toEqual` case red; map `case 'cut'` to `pl.settings.artRestart` in `textOf` → the adapted `#15 H-1` and `#14 B-4` red (orchestrator, or the agent with `npx playwright test tests/e2e/load-and-tab-guard.spec.ts` if Chromium starts); each restored — bb295b4
- [x] 5.4 `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty — bb295b4
- [ ] 5.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `load-and-tab-guard.spec.ts` green alone

### Phase 6: The cut count counts pictures only (H-2)

#### Automated

- [ ] 6.1 New tests red before the change, green after; unit `<phase-5 count> + N`
- [ ] 6.2 Deliberate break: count all five lists → the sounds-only case red; restored; meta-check: the record in the test is built with the real `cutByTable` from file keys of `SOUNDS` and the font key, so it is the shape `BootScene` writes
- [ ] 6.3 `grep -n "cut.length" src/scenes/UIScene.ts` empty
- [ ] 6.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#14 B-4` and `#15 A-1/A-2` cut pictures, so `artCut` still shows)

#### Manual

- [ ] 6.5 [visual] Settings "Obrazki" at 1440 and 1024 wide after a cut start (hook build `?e2eArt=stallall`): the ordinary cut line, no "w tle" sentence, layout of the section unchanged

### Phase 7: Drawing limits fail at generation with the skill id (N-4)

#### Automated

- [ ] 7.1 New tests red before the change, green after; unit `<phase-6 count> + N`
- [ ] 7.2 Deliberate break: drop the `column` case → the column test red; drop the `money` case → the tray test red; set `ART_LIMITS.trayKinds` to 5 → the invariant red; each restored; meta-check: each bad fixture is first passed to `columnMarks` / `coinLayout(TASK_LAYOUT.coinDrag, tray)` directly in the test and throws there, so it is the scene-throwing input
- [ ] 7.3 Seeds unchanged: `npm run sample -- E1` … `E6` byte-identical to the phase-6 commit (saved before the first edit, `diff` empty); the existing "does not consume rng differently from the generator" case of `tests/generateTask.test.ts` green; `git diff main -- tests/contentInvariants.test.ts tests/solvableInMode.test.ts` empty
- [ ] 7.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`money-pay.spec.ts`, `written-column.spec.ts` green)

### Phase 8: Docs, follow-ups and seam sweep

#### Automated

- [ ] 8.1 `grep -rn "artCutBackground" src tests CLAUDE.md AGENTS.md` empty; `grep -rn "round.calculate" src scripts tests` empty
- [ ] 8.2 `grep -c "^Trigger:" context/changes/post-run-polish/follow-ups/review-fixes.md` ≥ 12
- [ ] 8.3 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS (every path CLAUDE.md names exists)
- [ ] 8.4 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 8.5 [reviewer] The CLAUDE.md sentences match the code (`grep` each named symbol: `headingOf`, `pl.round.heading`, `pictureCutCount`, `assertDrawable` cases); save format v4 stated; DESIGN-GAP 153 and 154 read correctly

### Phase 9: The heading on screen and in the narration — e2e (#11)

#### Automated

- [ ] 9.1 Spec red before (deliberate break: `drawPrompt` draws `pl.round.heading.calculate` for every kind → the heading assertion red; `currentNarration` passes `headings: null` → the narration assertion red), green after; restored
- [ ] 9.2 `npx playwright test tests/e2e/narrator.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 1`; total equals `npx playwright test --list | tail -1`
- [ ] 9.3 Full local gate green
