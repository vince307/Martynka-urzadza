# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-plan` step: `plan.md` (10 phases, 71 Progress rows) and `plan-brief.md` exist, `change.md` is
`planned`, the roadmap marks S-14 `planning` and adds S-14b/S-14c/S-14d `proposed`; no code yet. The next agent must not
plan MONEY_PAY or any new answer mode into S-14, and must keep the step order unchanged until phase 8 (phases 5–7 add skills
only to already playable steps).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | 3 on top of `bb00d7f`: change identity, research, `docs(art-tasks-all-stages): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 71 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-tasks-all-stages/plan.md` | Plan: 10 phases (tdd 1, 3, 4; impl 2, 5, 6, 7, 8, 9; e2e 10), Critical Implementation Details (visual model, measure texts, `allowNegative`, `keypadBeside`, `ArtImage` + hook `art`, `TASK_ART` loading), 15 autonomous decisions, `## Progress` |
| `context/changes/art-tasks-all-stages/plan-brief.md` | Two-page brief: key decisions, phases at a glance, risks |
| `context/changes/art-tasks-all-stages/change.md` | Frontmatter `status: preparing → planned` |
| `context/foundation/roadmap.md` | S-14 → `planning` (table + body, Risk note on the narrowing); new S-14b `number-line-written-arrows`, S-14c `text-measure-time-types`, S-14d `e1-shapes-picture-mode` (`proposed`, table, bodies, Backlog Handoff rows, stream E line); S-13b Risk gains PERIMETER E5.12/E6.3; `updated: 2026-10-14` |
| `context/changes/art-tasks-all-stages/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| criteria vs Progress count (awk over `#### … Verification:` bullets vs `grep -c '^- \[ \]'`) | 71 = 71 (observed) |
| `metadata-guard.mjs inspect` → `mark-planned --expected-sha256 5c90394…` | `{"changed":true}`, status `planned` (observed) |
| spot checks: `src/core/tasks/visual.ts` (`validateVisual` switch not exhaustive), `src/core/round/pictureLayout.ts` (`PictureRect`), `TASK_LAYOUT.picture.keypadSolution` 768×190, `src/core/tasks/validate.ts` `ValidationContext {max, nouns}`, `Task` has no `type`, `tests/e2e/seed.spec.ts` counts only `response`, `BootScene.preload` font only, `docs/design-gaps.md` last row 58, `tests/e2e/support/welcome.ts` `passWelcomeAsParent` | confirmed (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main `bb00d7f` per contract: unit 1482, e2e 42 — inherited, unverified) |

No deliberate break: nothing testable was changed.

## 4. Next command

`/10x-plan-review art-tasks-all-stages`

## 5. Open

- `[human]` rows (post-run checklist): 2.9 WebP/loose files/`tasks/measuring/` vs plan § 10 PNG; 8.9 S-14 narrowed vs
  roadmap literal; 9.7 MONEY_PAY deferred, MASS balanced only, negatives and zł + gr on tiles, temperatures step 5/2 °C;
  9.8 text and `childName` acceptance; 9.9 tablet sharpness, WebP in Safari, „12 zł 50 gr” on a tile.
- E2E phases needing the orchestrator (request-file): 2 (seed #8 precache assertion, `e2e-break-p2.patch`), 10
  (`art-tasks.spec.ts`, patches p10a–p10d); phases 5–8 need a full-suite run by the orchestrator.
- Profile change planned in phase 9: `context/foundation/autonomous-run.md` § 10 row `public/assets` "absent on purpose".
- Follow-ups to file in phase 9 (`follow-ups/review-fixes.md`): MONEY_PAY + `Wallet` (`Trigger: S-14d`), text MASS/LENGTH
  and PLACE_VALUE ≥ 1000 (`Trigger: S-14c`), number line hint (`Trigger: S-14b`), picture highlight, chart O2, atlas
  (`Trigger: S-16`), `check:deploy` for assets.
- DESIGN-GAP rows from 59 (listed in plan phase 9 § 1).
- Budget cut order if a phase overruns: E5.5 ½ l/½ kg extras, then `E6.1.temperature_diff`.
- `cwebp` must exist on the implementing machine (`/usr/local/bin/cwebp` 1.1.0 per research); CI never runs `npm run art`.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Complexity HIGH, zero questions asked (contract rule 1): every solution choice was settled by research/change.md or
   decided below. Would change: a maintainer message overriding a research decision.
2. Ten phases (3 tdd, 6 impl, 1 e2e), ≤ 2 new UI components each. Rejected: research's 9-phase cut (generators + widgets +
   data per type in one phase) — phases too big and the step order would change in several phases. Would change: plan-review
   finding a phase still too big (split 8 into data + test pins).
3. Step order changes once (phase 8); phases 5–7 add skills only to already playable steps. Rejected: data per type phase
   (five `ORACLE` rewrites). Would change: none.
4. Thermometer is the only `tall` visual using the new "beside" solution layout; chart O2 stays a follow-up. Rejected:
   beside for every keypad picture (ruler and scale are wide). Would change: a screenshot showing the scale or chart
   unreadable at 768×190.
5. Temperatures E3 step 5 °C, E5–E6 step 2 °C. Rejected: 1 °C (~4.5 px per degree). Would change: tablet screenshot with
   readable 1 °C ticks.
6. MASS masses from a plausibility table per icon (`SCALE_ITEMS` in `src/data/measures.ts`). Rejected: any mass on any icon
   ("a 5 kg apple"). Would change: new art (sacks, boxes) from the art inventory.
7. Hook `snapshot.art` reports texture key + loaded per shown image (S-13 impl-review F1 lesson); the e2e spec is 4 tests
   aiming < 60 s (F2 lesson). Would change: a cheaper proof of texture state found in the hook.
8. MONEY_PAY placed into S-14d (not its own roadmap item). Rejected: a separate item. Why: S-14d already brings E1–E2 touch
   modes and pictures. Would change: maintainer prefers money as its own slice.
9. Seed #8 precache assertion lands in phase 2 (impl, request-file) because it proves that phase's pipeline, although the
   contract puts e2e phases after the seam sweep. Would change: plan-review insisting all e2e edits go to phase 10.
10. Roadmap: S-14 → `planning`, S-14b/S-14c/S-14d `proposed`, S-13b Risk gains PERIMETER E5.12/E6.3, committed with the
    plan (step prompt).
