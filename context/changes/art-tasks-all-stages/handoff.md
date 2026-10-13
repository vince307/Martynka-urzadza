# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-research` step: `research.md` settles the first raster load, the WebP pipeline, answer modes,
MONEY_PAY, curriculum/test effects, e2e runtime, nouns and the save format; no code yet. The next agent must not
plan MONEY_PAY into S-14 (research decision 1: dropped, follow-up) and must not plan any new answer mode — every new
skill is tiles or keypad so the e2e helpers stay untouched.

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | 2 on top of `bb00d7f`: change identity, `docs(art-tasks-all-stages): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-tasks-all-stages/research.md` | Research: 11 findings sections, code references by symbol, 4 autonomous decisions, proposed 9 phases for `/10x-plan`, open questions |
| `context/changes/art-tasks-all-stages/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/art-tasks-all-stages/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `which cwebp` / `cwebp -version` | `/usr/local/bin/cwebp`, 1.1.0 (observed by a research worker) |
| same `cwebp` command twice on one kit PNG (scratchpad) | identical SHA (observed by a research worker) |
| throwaway `node --import tsx` script in the scratchpad: dummy skill in E1.8, E1.10, E2.2, E2.8, E5.5, `calendarStart` for every age × month | start-step shifts tabled in research § 7 (observed by a research worker; nothing written in the repo) |
| spot checks in main context: `vite/config.shared.mjs` `globPatterns` has `webp`; `src/main.ts` no `mipmapFilter`; E1 tiles-only header + `tests/generateTask.test.ts` pin; `validate.ts` `NEGATIVE_NUMBER`/`NUMBER_WORD`; `plural.ts` `pluralCategory` throws on negatives | confirmed (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main bb00d7f per contract: unit 1482 passed, e2e 42 passed — inherited, unverified) |

No deliberate break: nothing testable was changed.

## 4. Next command

`/10x-plan art-tasks-all-stages`

## 5. Open

- Plan inputs (research § "Proposed S-14 phases"): P1 core visual kinds + money format + validator negative allowance
  and string-answer leak check (`src/core/tasks/validate.ts` `validateTask`, `src/core/round/hints.ts` `leaksAnswer`) +
  unified `Rect`; P2 assets (`scripts/make-task-art.mjs`, `public/assets/tasks/**`, `src/data/taskArt.ts`,
  `BootScene.preload`, seed offline assertion); P3 money; P4 mass; P5 capacity; P6 temperature + O2 layout; P7
  COUNT/MULT_GROUPS; P8 S-13 widget data + curriculum test pins; P9 e2e + visual gate.
- **Seed gap:** `tests/e2e/seed.spec.ts` passes even if an asset is not precached (`requestfailed` not collected) —
  P2 must add the assertion (e2e request-file protocol).
- **O2 triggered:** `TASK_LAYOUT.picture.keypadSolution` (`src/data/layout.ts`) gives a thermometer 63×190 px —
  picture-left layout needed (`src/core/round/pictureLayout.ts` `pictureLayout`); this also fires the "three Rect
  types" follow-up.
- Tests to update (research § 8): `tests/curriculumStart.test.ts` `ORACLE` + `playableSteps`,
  `tests/curriculumPick.test.ts` (E5 step 5 fallback), `tests/curriculumEnd.test.ts` (E2.1 pin, E5 4→6),
  `tests/progress.test.ts` (E5 step 5), `tests/curriculum.test.ts` (five `childName`s).
- Follow-up to file at plan/archive: MONEY_PAY (generic `stepBlockDrag`, wallet layout, `Wallet`, drag-variant
  dispatch, `tests/e2e/support/hook.ts` branches) → S-14d or its own slice.
- Nouns to add with accusative if used in prompts (`src/data/nouns.ts`): litr, kilogram, dekagram, stopień, moneta,
  banknot, odważnik, dzbanek, lampa, klucz, kłębek, czajniczek; decimals only as abbreviations on screen.
- Carried from the previous handoff: profile § 10 `public/assets` row goes stale (orchestrator); plan § 10 "PNG" vs
  WebP and loose files vs atlas → [human] checklist row; DESIGN-GAP candidates listed in `change.md`.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. MONEY_PAY dropped from S-14 (follow-up). Rejected: generic reducer + wallet in S-14. Why: new layout, widget,
   drag-variant dispatch, hook targets/helpers and a non-number input — ≈ 2 phases and a risk to every spec using
   `answerRight`. Would change: phase budget left after P1–P9 or a maintainer request.
2. String tiles for negative temperatures and zł+gr amounts; number tiles in E1; keypad from E3 for whole units;
   `Keypad` unchanged (confirms change.md decision 5). Would change: a teacher read finds tiles too guessable in E5/E6.
3. Asset pipeline = local `cwebp` script, committed outputs, sizes ≤ 2× display (≈ 0.5 MB). Would change: the
   maintainer wants CI to regenerate art (WASM encoder dependency).
4. Missing image is non-fatal with a drawn fallback (`textures.exists`). Would change: a decision to make missing art
   a build/test failure.
5. Scope split S-14b/c/d confirmed; S-14 = 9 phases. If tight, cut next: E5.5 ¼ l/¼ kg extras, then E6.1 differences.
   Would change: the plan sizing a phase larger than ~2 UI components.
6. Research ran without `AskUserQuestion` (contract rule 1); scope came from `change.md`.
