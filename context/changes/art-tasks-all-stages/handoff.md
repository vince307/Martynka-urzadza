# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-new` step: the change folder exists with `change.md` (identity, roadmap corrections, full
remaining-steps inventory, scope split, assets weight, triggered follow-ups, decisions); no code yet. The next agent
must not plan the whole "full set per stage": S-14 is narrowed to pack A art (money, scale, jugs, thermometer, icons)
plus data-only reuse of S-13 widgets (change.md `## Autonomous decisions` 1); written column, graphs, number line,
text-only types and E1.1 are proposed as S-14b/S-14c/S-14d.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | 1 on top of `bb00d7f`: `docs(art-tasks-all-stages): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-tasks-all-stages/change.md` | Change identity: roadmap claim vs repo table, steps × missing types × widget/art × answer mode for E1–E6, S-14 scope (types, steps, widgets, exact kit files, `public/assets/` names), proposed S-14b/S-14c/S-14d, design-kit bindings and DESIGN-GAP candidates (rows from 59), assets weight (WebP measured), migration verdict (none), triggered follow-ups, 7 autonomous decisions |
| `context/changes/art-tasks-all-stages/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `git merge-base HEAD main` | `bb00d7f` (observed) |
| inventory script over `src/data/curriculum/E1.ts`–`E6.ts` (step `types` minus skill types, `node --import tsx`) | 63 steps, 10 without skills, 37 with a missing type, 32 distinct missing types (observed; tabled in change.md) |
| `cwebp -q 85 -alpha_q 90 -resize ½` over `designs/martynka-maths-A-v1/assets/{money,measuring}/*.png` (scratchpad output, not committed) | 31 files → 331 204 bytes WebP vs ≈ 9.9 MB PNG (observed) |
| `grep -n "Trigger:" context/archive/*/follow-ups/review-fixes.md` filtered for S-14/money/scale/thermometer/number line/written/picture | 10 entries, all tabled in change.md (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main bb00d7f per contract: unit 1482 passed, e2e 42 passed — inherited, unverified) |

No deliberate break: nothing testable was changed.

## 4. Next command

`/10x-research art-tasks-all-stages`

## 5. Open

- Research questions (from change.md): first raster loading in `src/scenes/BootScene.ts` (`preload`) and precache proof
  (`vite/config.shared.mjs` `globPatterns`, `tests/e2e/seed.spec.ts`); asset conversion script in `scripts/` (model
  `scripts/make-icons.mjs`; `cwebp` at `/usr/local/bin`, not a dependency); new `TaskVisual` kinds in
  `src/core/tasks/visual.ts` (`visualKey`, `validateVisual`, `describeVisual`) and where denominations/weights/ml live
  (core vs `src/data/`, boundary rule); generalising `src/core/blockDrag.ts` (`BlockKind`) and
  `src/core/round/dragLayout.ts` for MONEY_PAY without breaking `E4.1.place_build_100` / `adaptive.spec.ts`;
  O2 keypad-solution picture rect (`TASK_LAYOUT.picture.keypadSolution` in `src/data/layout.ts`, `pictureLayout`);
  tiles vs keypad for negative temperatures and zł+gr amounts (`src/core/round/keypad.ts` has no `−`/`,`);
  `reference/thermometer-face.js` mapping into Phaser Graphics; effect of 5 newly playable steps (E1.8, E1.10, E2.2,
  E2.8, E5.5) on `src/core/curriculum.ts` (`calendarStart`, `floorToCalendar`, `skillBuckets`) and warm-up.
- Proposed roadmap items not yet written: S-14b `number-line-written-arrows`, S-14c `text-measure-time-types`,
  S-14d `e1-shapes-picture-mode`, and S-13b widened with PERIMETER E5.12/E6.3 — the plan step (or `/10x-roadmap`)
  records them.
- Profile drift for the orchestrator: `context/foundation/autonomous-run.md` § 10 lists `public/assets` as absent until
  S-16; S-14 creates it (agents do not edit the profile).
- Plan § 10 says money "PNG"; S-14 ships WebP (decision 3) — candidate [human] checklist row.
- Missing nouns if icons enter prompts: `lampa`, `klucz`, `kłębek`, `czajniczek`, plus measure nouns (`dzbanek`,
  `odważnik`, `litr`, `kilogram`, `dekagram`, `stopień`) in `src/data/nouns.ts`.
- DESIGN-GAP candidates (not yet in `docs/design-gaps.md`): wallet drop target, money table layout, item on a pan /
  level-only scale, missing gram/5 dag/tonne weights, other vessels, plates for MULT_GROUPS, negative temperature input,
  keypad-solution picture (rev. rows 52/57).
- Triggered follow-ups in scope: O2, `pictureLayout` select/drag overlap, three `Rect` types, `pointerupoutside`
  (if drag wiring changes). Out (re-trigger at archive): number line → S-14b; BONDS pairs / CHOOSE_OP picture and
  picture mode → S-14d; hint highlight → "S-16 or a teacher read"; mat regrouping → "a child stuck on E4.8".
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Scope split — S-14 = pack A art types (MONEY_COUNT, MONEY_CHANGE, MONEY_PAY, MASS at balance, CAPACITY,
   TEMPERATURE, COUNT, MULT_GROUPS) + data for S-13 widgets in E1/E2/E5/E6; the rest → proposed S-14b/c/d and S-13b.
   Rejected the full set (~25–30 phases) and money-only. Reverses if research finds widgets smaller (pull in top S-14c
   text types) or MONEY_PAY too risky (move it out).
2. MONEY_PAY kept but first to cut. Reverses if generalising `blockDrag` endangers E4.8 / `adaptive.spec`.
3. Assets as script-generated WebP at half resolution, committed, no atlas (331 KB vs ≈ 10 MB). Reverses if the
   visual gate shows blur on a DPR-2 tablet (then full resolution, still WebP).
4. MASS drawn only at balance; heavier/lighter, grams, 5 dag, tonne, gross/net/tare as text (S-14c), never invented
   art. Reverses if the maintainer supplies a separate beam/pans or gram weights.
5. Negative temperatures and zł+gr amounts answered with tiles; `Keypad` unchanged. Reverses if research finds tiles
   too guessable for E5/E6.
6. No save migration (mastery keyed by skill id; `validateSave` checks shape only). Reverses if gesture state or amounts
   had to be saved — rejected.
7. Next step `/10x-research` (fixed by the orchestrator; warranted by the unknowns above).
