---
date: 2026-10-15T09:21:02+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s14c-s14d, research step)
git_commit: f3aa5043d23c5b4410e41e4774d559dfc7d0ae91
branch: feat/e1-shapes-picture-mode
repository: Martynka-urzadza
topic: "S-14d e1-shapes-picture-mode: SHAPES, PATTERN, COMPARE_QTY (E1.1), ORDINAL (E1.2), CHOOSE_OP with a picture (E1.3), MONEY_PAY as a third drag branch (E1.11, E2.2), picture mode for 6-year-olds, E1 calendar start and thresholds, O4 and the sum.bought/złoty template bug"
tags: [research, tasks, generators, curriculum, E1, picture-mode, drag, money, coins, blockDrag, e2e, tiles, calendar-start, unlock]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-14d e1-shapes-picture-mode

**Git Commit**: `f3aa504` · **Branch**: `feat/e1-shapes-picture-mode` · Research only, no product code changed.
Anchors are file + symbol (run contract: no line numbers). `docs/zrodla/` was not read; every task shape below is an
original example built from the type definitions in `docs/ZADANIA.md` § 1–4, not a textbook task.
`context/foundation/lessons.md` does not exist (checked with `ls`), so no lesson applies.

Four read-only workers covered (A) the task model, tiles, `TaskPicture`/`pictureLayout`, icons, COUNT, CHOOSE_OP,
BONDS, `check`, narration and validation; (B) `dragMode`, `blockDrag`, `clockSet`, `dragLayout`, `BlockMat`, the
`TaskScene` drag wiring, money data/art, the e2e hook and helpers, touch sizes; (C) E1/E2 curriculum data,
`calendarStart`, buckets, warm-up, easing, curriculum/content-invariant tests, auto-read, minigames; (D) ZADANIA,
PRD, design gaps, style guide, art folders, roadmap. Decisive anchors re-read in the main context: `dragMode`
(`src/core/tasks/dragMode.ts`, full file), the `skill` helper default `'tiles'` (`src/data/curriculum/E1.ts`, which
corrects worker A's guess that E1 BONDS is keypad), the `easing` comment in `src/data/balance.ts`, `Context.price`
in `src/data/wordTemplates.ts` ("none = never bought"; `złoty` has none, `rogalik` has one), `captureFirstWrong`
(`src/core/round.ts`, records only number/string inputs), `nouns` (`src/data/nouns.ts`: forms only, no gender field),
`CoordGrid.drawItem` (`src/ui/widgets/CoordGrid.ts`: circle/square/triangle/star/heart drawn in code) and the
follow-up texts in `context/archive/*/follow-ups/review-fixes.md`.

## Research Question

From `change.md` (claims table, scope table, decisions 1–8) and the step prompt: per in-scope type, what are the task
shapes, number ranges, answer mode, drawing kind (code-drawn shapes vs icon art) and a picture-first hint a 6-year-old
can follow by ear? How should MONEY_PAY drag work (reducer pattern, pointerId guard, cancel, tap-to-remove, "najmniej
monet", wallet layout, touch targets on a 1024 tablet), and how do the e2e helpers stay exhaustive? What is picture
mode as a core preference (who, how it changes skill choice, no save field)? What do the E1 calendar start and
thresholds do, and how are O4 and the "kupił jeszcze 2 złote" bug fixed?

## Summary

1. **Figures in tiles are required, not optional.** `AnswerTiles.setChoices` and `SelectTiles.setChoices`
   (`src/ui/widgets/`) draw a rounded rect plus `String(value)` only. The narrator never reads tile labels
   (`src/core/narration/spoken.ts` reads `task.speak ?? task.prompt` and the hints), so a 6-year-old cannot pick
   between tiles labelled "koło"/"trójkąt". PATTERN ("what comes next") is only answerable with drawn figures in the
   tiles; SHAPES is picture-first the same way ("Dotknij trójkąta." over figure tiles). Recommendation: a pure
   choice-face code in core (e.g. a `shape:<id>:<colour>` string parsed by a core function) that both tile widgets
   draw with the existing `CoordGrid.drawItem` figure code moved into a shared helper; plain choices keep text.
   DESIGN-GAP row 100.
2. **ORDINAL and CHOOSE_OP-with-picture need one new drawing each, both icon-based.** `IconGroups.render` draws
   the same icon at every spot with no highlight and no arrow; `TaskVisual` `icons` is
   `{icon, groups, framed}`. ORDINAL: a new `row` visual (a list of different `IconId`s, art already shipped, 12 ids
   in `ICONS`, `src/data/measures.ts`) asked as "Który z kolei od lewej jest gruszka?" with number tiles 1–5 in E1.2.
   CHOOSE_OP: the existing `icons` visual with two framed groups plus an optional `motion: 'come' | 'go'` arrow drawn
   in code. COMPARE_QTY needs no new drawing (`icons`, `groups: [a, b]`, `framed: true`) and three text tiles.
3. **MONEY_PAY: the 70 % share criterion of change.md decision 5 is met.** Worker B counted about 57 of 79 lines of
   `src/core/blockDrag.ts` as kind-agnostic (event union, `Carrying`, geometry interface, `idle`, `put`/`take`, the
   reducer: about 95 % of `stepBlockDrag`); only `BlockKind`, `emptyMat`, `matValue`, `initialBlockDrag` are
   block-specific. Recommendation (reverses decision 5's default, by its own reversal condition): a generic
   tray-to-mat reducer over a kind type `K` (counts per kind, a total cap instead of / beside `maxPerKind`), with
   blocks and coins as two instances, and **S13-09 fixed in the shared core** (`down` during a carry = drop + fresh
   grab, as `stepClockSet` already does). Layout and widget share less (~50 % of `dragGeometry`, ~35–40 % of
   `BlockMat`): coins get their own `dragLayout` variant and widget (`Wallet`, drawn in code, DESIGN-GAP).
4. **The submitted MONEY_PAY value must carry the coin count, so a number is not enough.** `TaskScene.submit` passes
   one value to `answer` → `isCorrect` (`src/core/round.ts`: `task.check` first, then set equality for arrays, then
   `===`). For "najmniej monet" the check needs the coins, not just the total. Recommended contract: the wallet
   submits a `number[]` of grosze per coin; `Task.answer` = the greedy minimal list; `check(input)` = sum equals the
   target (plain variant) and additionally `length === answer.length` (fewest-coins variant). Without `check` the set
   equality of `isCorrect` would wrongly accept `[2,2,1]` vs `[2,1]` and reject other correct sets. Side effects:
   `captureFirstWrong` stores only number/string inputs (a wrong wallet is not kept as a parent mistake example),
   `canonicalInput` (`src/core/round/canonicalInput.ts`) needs a money branch, `validateTask` must call the new
   `dragMode` branch.
5. **The e2e helpers fall into the blocks branch today** (`answerRight`/`answerWrong` in
   `tests/e2e/support/hook.ts`: `drag && state.clock` then bare `drag` → `buildOnMat`), and the snapshot has no
   `dragMode` field (`TaskScene.snapshot`). Unpinned E3 specs can draw an E2.2 skill through the `previous` bucket
   and the warm-up (`skillBuckets` in `src/core/curriculum.ts`, `buildWarmup` in `src/core/round/warmup.ts`), so a
   MONEY_PAY task can appear in roughly a dozen specs (list in § 5). An exhaustive `switch (state.dragMode)` with a
   `never` default and a `payCoins` helper are mandatory, not cosmetic.
6. **Picture mode: no static knowledge of "has a picture" exists.** `visual` is known only on a generated `Task`;
   there is no type→visual table (grep for `pictureMode`, `VISUAL_TYPES`, `hasVisual`: no hits). Recommendation: a
   pure `pictureMode(learner, month)` (stage E1 and either age 6 in the age-6 autumn band of `placementData`, or
   `easedRounds > 0`) and a pure static predicate `hasPicture(skill)` (type + params table in `src/data/`, kept honest
   by a test that samples each E1/E2 skill and compares with `task.visual !== undefined`), applied in
   `buildAdaptiveRound` after `skillBuckets` like `withoutArtBlocked` (filter `earlier`/`previous` to picture skills;
   filter `current` only while at least the unlock threshold remains; return the originals when a bucket would
   empty). No save field: age, stage and `easedRounds` are already in v2 (`SavedLearner`, `src/core/types.ts`).
7. **Calendar start for E1 moves only in September** (age 6, not behind): today `[3,4,6,8,10,11]` for Sep–Jan/Feb+,
   with E1.1 playable `[2,4,6,8,10,11]` (`calendarStart`, n 10 → 11; worker C computed both with node).
   `floorToCalendar` never lowers a saved step, so live saves are unaffected. Three tests pin today's values:
   `tests/curriculumStart.test.ts` (`ORACLE` E1 row and the `playableSteps` list) and the title "E1 step 1 is the only
   gap left at the start" in `tests/curriculumEnd.test.ts`.
8. **Thresholds**: E1.2 2 → 3 skills, `unlockThreshold` 1 → 2; E1.3 4 → 5 if the picture variant is a new skill
   (2 → 3); E1.11 5 → 6 (3 → 3); E2.2 3 → 4 (2 → 2); E1.1 new with 3+ skills. Slower for saved learners on E1.2/E1.3,
   nothing lost.
9. **O4 is a one-line data fix**: `E1.2.count_5` is `COUNT {min: 1, max: 5, tens: false}`; `parseCountParams` needs
   `min < max`, so `min: 2` is valid and leaves 4 counts × 12 icons. **The złoty bug** comes from `sum.bought`
   (`src/data/wordTemplates.ts`) with the unfiltered `rng.pick(contexts)` in `generateChooseOp`
   (`src/core/tasks/generators/chooseOp.ts`); `Context.price` already means "buyable" ("none = never bought") and
   `złoty` has none. The same unfiltered pick exists in WORD (`word.ts`, `sum` kind) and COMPARE_DIFF. The archived
   follow-up names `Trigger: S-17`, but the fix is cheap and on the same path as the CHOOSE_OP phase.

## Detailed Findings

### 1. Catalogue and requirements (worker D)

- `docs/ZADANIA.md` § 1: age 6 Sept–Jan → "E1 (tryb z obrazkami)", Feb–Aug → E1 (no picture-mode label). Easing:
  "2 rundy z rzędu poniżej 3/5 → … łatwiejszych wariantów (mniejszy zakres, tryb z obrazkami)". Presentation:
  "E1–E2: polecenia krótkie, z obrazkami … Liczby jako kropki/obiekty obok cyfr." Answers: tiles, keypad, drag, select.
  Nothing else defines picture mode — **the catalogue is silent on its mechanics**; the recommendation in Summary 6
  is an inference.
- § 3: E1.1 SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY; E1.2 "Liczby 1–5" COUNT, ORDINAL, COMPARE_NUM; E1.3
  "+ i − do 5 z obrazkami" incl. CHOOSE_OP z obrazkiem; E1.11 "pieniądze do 10 zł" incl. MONEY_PAY; E2.2 "Pieniądze
  do 20 zł" incl. MONEY_PAY. § 2 table: E1 money "1, 2, 5 zł, 10 zł; ≤ 10 zł"; E2 "≤ 20 zł; banknoty do 100 zł".
- § 4: SHAPES "Nazwij figurę, dotknij wszystkich trójkątów, wskaż intruza (inny kolor/kształt/wielkość). E1–E2.
  Grafika: figury w kodzie." PATTERN "Ciągi figur i kolorów (E1–E2), ciągi okresowe." COMPARE_QTY "Dwie grupy
  obiektów, trzy przyciski. Tylko E1 (i tryb z obrazkami). Grafika: ikony." ORDINAL "Rząd obiektów; „dotknij
  czwartego od prawej” albo „który z kolei od lewej jest zielony?”. E1 do 10, E2 do 20. Grafika: ikony." CHOOSE_OP
  "Treść lub obrazek (ptaki przylatują / odlatują) + 3 działania". MONEY_PAY "Przeciągnij monety do portfela, aż
  będzie n zł; wariant „najmniej monet”." BONDS variant "połącz pary dające 10" (out of scope, decision 3).
- Contradiction to note: ORDINAL "E1 do 10" vs step E1.2 "Liczby 1–5". Resolution: the step wins inside E1.2 (range
  5); a later E1 step may reuse ORDINAL to 10 (none planned here).
- Hints: ZADANIA names an E1 hint only for ADD_SUB ("E1 obrazki") and the general "delikatna podpowiedź (obrazek, oś
  liczbowa, rozbicie działania)". The narrator reads hints (`narrationOf`, `spoken.ts`), so hints can be spoken
  instructions about the picture.
- PRD: FR-023 (full type set per stage ends M6); FR-009 auto-read; NFR touch ≥ 96 px at 1920×1080 (≥ 48 CSS px at
  1024×768); picture mode is named only in the easing business rule. No FR defines picture mode.
- `docs/design-gaps.md`: row 21 "picture mode … has no kit screen | Skipped … follow-up (S-14)"; highest row 99, so
  new rows start at **100**; row 55 describes `BlockMat`; row 59 `MoneyTable`; row 74 shapes drawn in `CoordGrid`.
- Art: `public/assets/tasks/icons/` 12 WebP (apple, book, croissant, cup, cushion, flower, key, lamp, pear, pencil,
  teapot, yarn); `money/` 15 WebP (9 coins, 6 notes). `designs/martynka-expansion-v1/assets/icons/` holds 24 icons,
  12 not shipped (banana, block, button, cookie, flowerpot, orange, paintbrush, scissors, shoe, sock, strawberry,
  watering-can). **No wallet/purse art in `designs/`** (filename search wallet|portfel|purse|sakiew: none);
  `docs/art-inventory.md` § 5 lists the wallet as "do domówienia".
- Style guide (`designs/martynka-maths-A-v1/style-guide.md`): child controls ≥ 96 × 96 at reference size, gaps
  16–32 px; code-drawn helpers: ivory faces, teal lines, oak frames, 4 px contours; "distinguish active positions with
  geometry as well as colour"; "touch wrapper of at least 96 px even when the illustrated object itself is smaller".
  No shape-specific colours (existing: `CoordGrid` uses `CHART_COLORS` with `PLACEHOLDER_COLORS` fallback).

### 2. Per-type task shapes, modes, drawings and hints

All answers in E1 default to `tiles` (`skill` helper in `src/data/curriculum/E1.ts`); E2 defaults to keypad.
Prompts are short and read aloud (auto-read on for E1–E2: `effectiveAutoRead`, `balance.narrator.autoReadStages`).

| Type (step) | Shapes and ranges | Mode | Drawing | Hint for a 6-year-old (spoken; result only in the last line) |
|---|---|---|---|---|
| **SHAPES** (E1.1) | (a) "Dotknij trójkąta." — 3–4 figure tiles, one triangle; (b) "Dotknij wszystkich kół." — select over 5–6 figure tiles; (c) "Który nie pasuje?" — 4 figure tiles, one differs in shape, colour or size. Figures: koło, kwadrat, trójkąt, prostokąt (+ optional star/heart already in `GRID_ITEM_IDS`) | tiles (a, c), select (b) | figures in tiles (new choice face); no picture area needed | (a) "Trójkąt ma 3 boki i 3 rogi." → "Policz rogi w każdej figurze." → "Trójkąt to ta figura z 3 rogami." (c) "Popatrz na kolor, kształt i wielkość." → "Trzy figury są takie same, jedna jest inna." |
| **PATTERN** (E1.1) | periodic rows AB, ABB, AAB, ABC (shape and/or colour), 6–8 shown + 1 gap; "Co będzie dalej?" | tiles (3 figure tiles) | row of figures in the picture area (new visual `pattern`, drawn in code) + figure tiles | "Powtarza się: koło, kwadrat, koło, kwadrat." → "Po kwadracie jest koło." → answer named |
| **COMPARE_QTY** (E1.1) | two groups 1–10, "Gdzie jest więcej jabłek?" / "… mniej …"; tiles "Po lewej", "Po prawej", "Tyle samo" (`pl.ts`); equal groups a fixed share | tiles (text, 3) | `icons` with `groups: [a, b]`, `framed: true` (exists) | "Policz jabłka po lewej: 4." → "Policz po prawej: 6." → "6 to więcej niż 4, więc po prawej." |
| **ORDINAL** (E1.2) | row of 3–5 different icons, "Który z kolei od lewej jest klucz?"; answer 1–5 on number tiles (numbers, not ordinal words: `nouns` has no gender field, so "pierwszy/pierwsza/pierwsze" agreement would need new data; the narrator can say the question; a later step may add ordinal-word tiles) | tiles (numbers) | new visual `row` (list of `IconId`), optional left-hand start marker drawn in code | "Zacznij od lewej strony." → "Pokazuj palcem: 1, 2, 3 …" → "Klucz jest trzeci od lewej: 3." |
| **CHOOSE_OP picture** (E1.3) | "Na talerzu były 3 jabłka. Doszły 2." → tiles "3 + 2", "3 − 2", "2 + 1"; go: "… 2 zabrano"; totals ≤ 5 | tiles (expressions, as today) | `icons` with two framed groups + new optional `motion: 'come' \| 'go'` arrow | "Jabłek przybywa czy ubywa?" → "Przybywa, więc dodajemy." → "3 + 2" |
| **MONEY_PAY** (E1.11) | "Zapłać 7 zł." / "Zapłać 7 zł najmniejszą liczbą monet."; targets 2–10 zł; tray 1, 2, 5 zł coins (ZADANIA E1 lists the 10 zł note too: plan decides; with the note "pay 10 zł" becomes a one-drag task) | drag (`coins`) | coin art (exists) on the tray and in the wallet; wallet drawn in code | "Połóż największą monetę, która nie jest za duża." → "5 zł i jeszcze 2 zł." → "5 + 2 = 7" |
| **MONEY_PAY** (E2.2) | targets to 20 zł; tray 1, 2, 5 zł + 10 zł note (4 kinds; a 20 zł note makes "pay 20" trivial) | drag (`coins`) | as above | as above, two steps "10 zł + 5 zł + 2 zł = 17 zł" |

Notes:
- **Content invariants** (`tests/contentInvariants.test.ts`): ≥ `MIN_DISTINCT` 12 distinct keys (prompt +
  `visualKey` + choices) per 1000 draws unless a `SMALL_SPACES` entry, and top share ≤ `MAX_TOP_SHARE` 0.15 with no
  exception. Icons and figure faces enter the key, so ORDINAL (12 icons × positions) and COMPARE_QTY pass easily;
  SHAPES (a) must vary target/distractor figures and colours, and MONEY_PAY E1 (targets 2–10, 2 variants = 18
  prompts) is near the limit but above 12 and below 0.15 if targets are uniform.
- **`validateVisual`** (`src/core/tasks/visual.ts`), `visualKey`, `describeVisual` and `TaskPicture.render` are
  exhaustive switches; each new kind (`row`, `pattern`, and the `motion` field) needs a case in all of them, a
  `visualShape` (default 'wide') and an `ART_LIMITS` bound if it uses icon art.
- **New nouns**: `prostokąt` is not in `src/data/nouns.ts` (koło, kwadrat, trójkąt are); every noun in a prompt must
  be added with its forms (validator rule).
- **`tests/curriculum.test.ts`**: each implemented type leaves `LATER`; every playable step needs a `childName`
  (≤ 28 chars, unique per stage), so E1.1 needs one (kit `unlock.png` shows the card; the name is copy in
  `src/data/curriculum/E1.ts`).

### 3. MONEY_PAY drag mechanics (worker B, `dragMode` re-read)

- `dragMode` returns `'blocks'` for no drawing or `blocks`, `'clock'` for `clock`, and throws for any other kind, so a
  `money` drag task throws today in `canonicalInput`, `validateTask` and `TaskScene` task-open.
- `stepBlockDrag` (`src/core/blockDrag.ts`): state `{mat, carrying}`; events down/move/up/cancel/reset; pointerId
  guard on move/up; `startDistance` latch (`balance.blockDrag.startDistance` 12); tap on tray adds, tap on a mat
  block removes, drag tray→mat adds, drag mat→outside removes; `cancel`/`reset` drop the carry. **S13-09**: `down`
  with the same pointerId while carrying returns `state` unchanged (a lost `touchcancel` leaves a block "in the air").
  `stepClockSet` (`src/core/clockSet.ts`) already treats every `down` as a fresh grab.
- Recommended core: generalise the reducer over `K extends string` (`Mat<K> = Record<K, number>`, rules
  `{startDistance, maxPerKind?, maxTotal?}`), keep `stepBlockDrag`/`initialBlockDrag`/`matValue` as thin block
  instances so `BlockMat`, `canonicalInput` and existing tests stay, and add `walletCoins(mat)` → grosze list and
  `fewestCoins(target, ids)` (greedy is optimal for the Polish 1-2-5 series) in core. A wallet modelled as counts per
  denomination makes tap-to-remove "remove one coin of that kind" (the hit test returns the kind of the tapped coin).
  Alternative if plan-review prefers isolation: a separate `coinDrag.ts` copy (rejected here: duplicates ~57 lines
  and leaves S13-09 open in one of two copies).
- Layout and touch: `TASK_LAYOUT.drag` tray 440×300 split into n columns; with gap 16 that is 212 px (2 kinds),
  136 (3), 98 (4), 75 (5) wide; at 1024 wide the scale is 1024/1920 ≈ 0.533 (`Scale.FIT`), so 96 game px ≈ 51 CSS px.
  A 4-kind coin tray must be **2 × 2** (212 × 142 px tiles) or wider; 5+ kinds in one row break the 96 px rule.
  Recommendation: at most 4 kinds per task, tray in a 2 × 2 grid, wallet on the mat rect (944 × 460) with coins laid
  out by `moneyLayout`-like rows, each placed coin's touch wrapper ≥ 96 px, total cap 10 (`ART_LIMITS.moneyItems`).
- Scene: `TaskScene` holds a boolean `clockTask` and `feedDrag` branches `if (clockTask) stepClockSet … else
  stepBlockDrag`; `okTarget` the same. A third mode needs a stored `DragMode` and a `switch` (with `never`) in the
  task-open, render, `feedDrag`, wrong-answer reset and `okTarget` paths.
- Submit: blocks submit `matValue` (number), clock submits `"h.mm"` (string); both rely on `===`. MONEY_PAY submits
  the wallet as `number[]` with `check` (Summary 4). `submit` already computes `open.check?.(value)` for the report.

### 4. Picture mode (worker C, Summary 6)

- Who: ZADANIA labels only "6 lat, wrzesień–styczeń"; easing names picture mode for every stage, but picture skills
  only differ in E1/E2. Inputs available without a save field: `learner.age`, `learner.stage`, `easedRounds`
  (`LearnerState`/`Adaptation`, `src/core/types.ts`) and the month (passed from `main.ts`, already used by
  `calendarStart`). Recommendation: `pictureMode` true when stage is E1 and (age 6 with the month in the autumn band
  of `placementData.table`, or `easedRounds > 0`); a band read from data keeps the rule in one place.
- Where: insertion point (a) in worker C's list — after `skillBuckets`, before `pickRoundSkills`, in
  `buildAdaptiveRound` (pattern `withoutArtBlocked`, `src/core/round/artFilter.ts`). Rejected: (b) retrying generation
  inside `distinctTasks` (wastes draws, hides the rule), (c) replacing the 20/50/30 easing (the `balance.easing` comment
  says the weights were chosen "instead of 'smaller range, picture mode'": picture mode is additive, not a replacement).
- Effect in E1 (after this slice): picture skills exist in E1.1 (all), E1.2 (count, ordinal), E1.3 (choose_op
  picture), E1.4 (`count_7`), E1.8 (ruler), E1.10 (`count_12`), E1.11 (clock, money, mass, pay). E1.5–E1.7 and E1.9
  have none, so the `current` filter falls back and only `earlier` is biased there.
- Warm-up: `buildWarmup` draws `previousCount` 3 skills uniformly from **all** playable E1 skills for an E2 learner,
  so E1.1 skills become eligible. Harmless (easy E1 content, the warm-up only lowers a stage), but the plan may exclude
  steps whose types are "Tylko E1 (i tryb z obrazkami)" from a warm-up if the teacher read finds them odd.
- Minigames and variants: `WORD_TYPES` = ADD_SUB, MULT, DIV and `drawTask` rejects visuals (`src/core/minigames/word.ts`);
  `src/core/variants.ts` has no type knowledge. New types change neither.

### 5. E2E helpers (worker B)

- `TaskScene.snapshot` exposes `input`, `mat`, `carrying` (block state always), `clock` (null unless `clockTask`),
  `correctChoices`, `visual` — no `dragMode`. `targets()` exposes `drag: blockMat.targets()` and `clock`.
- `answerRight`/`answerWrong` order: tiles, select, `drag && clock`, **bare `drag` → `buildOnMat`**, digits, keypad,
  `unanswerable(never)`. A MONEY_PAY task would time out in `buildOnMat` polling, and the `never` check cannot catch it
  because `input` is still `'drag'`.
- Specs that can meet E2.2/E1.11 skills unpinned (via `previous` bucket or warm-up): error-boundary, narrator,
  parent-settings (unpinned tests), room-purchase, room-change, save-backup-health, save-transfer-blocked,
  save-restart, save-transfer, task-round, save-migration (E3 fixture), first-launch, minigames. Pinned specs
  (`e2eSkills`: art-tasks, art-stand-in, clock-set, grid-tasks, inequality, number-line, written-column, drawn-tasks)
  are safe. Exact reachability of E1.11 for E1 specs was not computed.
- Required: `dragMode` in the snapshot (hook build only); `switch (state.dragMode)` in both helpers with `blocks` →
  `buildOnMat`, `clock` → `setClock`, `coins` → `payCoins`, `never` default; `payCoins(page, grosze[])` modelled on
  `buildOnMat` (one CDP session, drag tray kind → wallet, poll the wallet in the snapshot after each coin);
  `answerWrong` for coins pays target + 1 zł (or, fewest variant, a correct total with one extra coin, which exercises
  `check`). A new MONEY_PAY spec with `?e2eSkills=E1.11.<id>&e2eVariant=off` and a deliberate break (remove the
  `coins` case → readable throw, not a timeout).

### 6. Curriculum effects (worker C)

- E1 today: step 1 `skills: []`; playable/startable `[2..11]`; E1.2 `compare_num_5`, `count_5`; E1.3 `add_sub_5`,
  `missing_5`, `bonds_5`, `choose_op_5`; E1.11 five skills; E2.2 three skills (`money_count_20`, `money_change_20`,
  `capacity_litres`). ORDINAL, MONEY_PAY are declared in `types` without skills.
- `calendarStart`: `k = min(n, max(1, max(minStartSteps 2, ceil(progress·n))))` over `startableSteps`;
  `progress = (position − semesterStart + 0.5)/5`, position 0 = September. September: n 10 → `ceil(0.1·10)=1→2` →
  step 3; n 11 → `ceil(1.1)=2` → step 2. Other months unchanged (values in Summary 7).
- `unlockThreshold(n) = ceil(0.5·n)`; `unlockReady` unlocks at most one step per round.
- `artBlocked` (`src/core/round/artFilter.ts`) covers MONEY_COUNT, MASS (non-text), CAPACITY `toLitres`; MONEY_PAY uses
  coin art, so it needs an `artBlocked` branch (any tray id missing) or the coin stand-in box must be draggable.

## Code References

- `src/core/tasks/dragMode.ts` `dragMode`, `DragMode` — throws for any drawing except blocks/clock.
- `src/core/blockDrag.ts` `stepBlockDrag`, `BlockDragState`, `Carrying`, `matValue` — reducer to generalise; S13-09.
- `src/core/clockSet.ts` `stepClockSet` — fresh grab on every `down`.
- `src/core/round/dragLayout.ts` `dragLayout`, `dragGeometry`, `dragKinds`; `src/data/layout.ts` `TASK_LAYOUT.drag`, `MIN_TOUCH_TARGET`.
- `src/ui/widgets/BlockMat.ts` `BlockMat`; `src/ui/widgets/MoneyTable.ts`; `src/ui/widgets/artLayout.ts` `moneyLayout`, `iconsLayout`.
- `src/scenes/TaskScene.ts` `clockTask`, `feedDrag`, `submit`, `okTarget`, `snapshot`, `targets`.
- `src/core/round.ts` `isCorrect`, `answer`, `captureFirstWrong`; `src/core/round/canonicalInput.ts` `canonicalInput`.
- `src/core/tasks/types.ts` `Task` (`check`, `visual`, `answer: number | string | number[]`).
- `src/core/tasks/visual.ts` `TaskVisual`, `validateVisual`, `visualKey`, `describeVisual`, `visualShape`.
- `src/ui/widgets/AnswerTiles.ts` `setChoices`, `src/ui/widgets/SelectTiles.ts` `setChoices` — text-only faces.
- `src/ui/widgets/IconGroups.ts` `render`; `src/ui/widgets/TaskPicture.ts` `render`; `src/core/round/pictureLayout.ts` `pictureLayout`.
- `src/ui/widgets/CoordGrid.ts` `drawItem`; `src/data/gridItems.ts` `GRID_ITEM_IDS`.
- `src/data/measures.ts` `ICONS`, `MONEY`, `COIN_IDS`, `NOTE_IDS`, `ART_LIMITS`; `src/core/text/measure.ts` `formatMoney`.
- `src/core/tasks/generators/count.ts` `parseCountParams`; `chooseOp.ts` `generateChooseOp`; `bonds.ts`; `money.ts`.
- `src/data/wordTemplates.ts` `Context.price`, template `sum.bought`, context `złoty`.
- `src/core/curriculum.ts` `calendarStart`, `startableSteps`, `floorToCalendar`, `skillBuckets`, `buildAdaptiveRound`, `unlockThreshold`, `endRound`.
- `src/core/round/pick.ts` `pickRoundSkills`, `playable`; `src/core/round/warmup.ts` `buildWarmup`; `src/core/round/artFilter.ts` `withoutArtBlocked`.
- `src/data/placement.ts` `placementData`; `src/data/balance.ts` `easing`, `blockDrag`, `clockSet`, `narrator`.
- `src/testing/e2eHook.ts` snapshot getter; `tests/e2e/support/hook.ts` `answerRight`, `answerWrong`, `buildOnMat`, `setClock`, `dragTouch`.
- `tests/curriculum.test.ts` `LATER`, `GROUP_1`; `tests/contentInvariants.test.ts` `MIN_DISTINCT`, `MAX_TOP_SHARE`, `SMALL_SPACES`; `tests/curriculumStart.test.ts` `ORACLE`; `tests/curriculumEnd.test.ts`.

## Architecture Insights

- Drag branches are decided from the drawing (`dragMode`), never from the answer type; the S-13b pattern adds one
  reducer per gesture family. Coins and blocks are the same gesture family (tray → mat counts), the clock is not.
- Content filters on round composition live in pure core between `skillBuckets` and `pickRoundSkills`
  (`withoutArtBlocked`) and keep the current step at its unlock threshold; picture mode fits the same slot.
- The narrator reads prompts and hints, never tile faces: any E1 choice a 6-year-old must distinguish without reading
  has to be a picture.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md`: "MONEY_PAY + `Wallet` + uogólniony
  `blockDrag`" `Trigger: S-14d` — supported; this research confirms generalisation is viable (Summary 3). O4
  `count_5` "rozważyć min 2" — supported (Summary 9).
- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md`: "BONDS with pairs and CHOOSE_OP with
  a picture" `Trigger: S-14d` — CHOOSE_OP part in scope; S13-09 `Trigger: next change to blockDrag` — fires if the
  plan generalises the reducer.
- `context/archive/2026-10-14-number-line-written-arrows/follow-ups/review-fixes.md`: E1 hint number line
  (`Trigger: S-14d (E1 picture mode) or a layout band above the tiles`) and E1.10 `place_read_12` (`Trigger: S-14d`) —
  both stay out (change.md decision 3); they need re-triggering at archive.
- `context/archive/2026-10-12-generators-remaining-stages/follow-ups/review-fixes.md`: `sum.bought` + `złoty`
  "Add a per-context flag (e.g. `buyable`)" `Trigger: S-17` — partially superseded: `Context.price` already is that
  flag; no new field needed.
- change.md decision 5 (separate reducer unless ≥ 70 % shared): the measured share (~72 % of the file, ~95 % of the
  reducer) meets its reversal condition; decision 6 (answer = grosze number) is contradicted for the fewest-coins
  variant (a number cannot carry the coin count) — the plan should adopt the `number[]` + `check` contract.

## Related Research

- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/research.md` (S-13b: clock-set drag branch, `dragMode`).
- `context/archive/2026-10-15-text-measure-time-types/research.md` (S-14c: `check` on tiles, threshold table pattern).

## Open Questions

1. Should E1.11 MONEY_PAY include the 10 zł note on the tray (ZADANIA lists it for E1 money)? Recommendation: coins
   only in E1.11 (1, 2, 5 zł), note from E2.2 — a teacher read decides.
2. Should ORDINAL tiles show ordinal words? Needs noun gender data that `src/data/nouns.ts` lacks; numbers first.
3. Picture-mode month band: ZADANIA labels only Sept–Jan; whether a 6-year-old in Feb–Aug also gets it is a product
   choice (recommendation: band only, as the catalogue says; easing covers weaker children all year).
4. Wallet look (dashed mat vs. a drawn purse): no kit view or art — DESIGN-GAP, author may supply art later.
5. Exact reachability of E1.11 in the E1 e2e specs (first-launch, minigames) was not computed; the exhaustive helper
   makes it irrelevant for correctness.
