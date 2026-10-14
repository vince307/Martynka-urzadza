# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-plan-review` step: `reviews/plan-review.md` (0 critical, 5 warnings, 3 observations, VERDICT: PROCEED)
exists, its fixes are applied in `plan.md`, and `change.md` is `plan_reviewed`. Nothing is implemented. The next agent must
not plan generator params that fail `tests/contentInvariants.test.ts` thresholds (≥ 12 distinct, top ≤ 15 %): phases 3–4 now
measure them for every skill planned in phases 5–8, and TEMPERATURE uses `low`/`high` (never `max`).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | 4 on top of `bb00d7f`: change identity, research, plan, `docs(art-tasks-all-stages): plan review` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 71 (`grep -c '^- \[ \]' plan.md`; criteria count unchanged, 71 = 71) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/art-tasks-all-stages/reviews/plan-review.md` | Review report: grounding, triggered follow-ups table, product decisions checked, F1–F8 with decisions, VERDICT line |
| `context/changes/art-tasks-all-stages/plan.md` | Fixes F1–F7 applied in place (phase 1 § 4/§ 5, phase 2 § 5 + 2.6, phase 3 § 2 + 3.2, phase 4 § 1/§ 2 + 4.2, phase 5/6/8 tables, phase 9 follow-up, phase 10 spec (d), Critical Implementation Details, Known risks, autonomous decision 16) |
| `context/changes/art-tasks-all-stages/plan-brief.md` | One risk line summarising the review changes |
| `context/changes/art-tasks-all-stages/change.md` | `status: planned → plan_reviewed` |
| `context/changes/art-tasks-all-stages/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `ls designs/martynka-maths-A-v1/assets/{money,measuring,icons}` + per-file `test -f` for the 38 bound files | all 38 present; `file`: coins/weights/jugs/icons 512², notes 768×512, scale 1024×768, thermometer frame 512×1536 (observed) |
| `which cwebp` / `cwebp -version` | `/usr/local/bin/cwebp`, 1.1.0 (observed) |
| `vite/config.shared.mjs` `globPatterns` | includes `webp`, `maximumFileSizeToCacheInBytes` 10 MiB (observed) |
| `reference/thermometer-face.js` | −30 → y1260, +30 → y300, 16 px/°C — matches plan (observed) |
| measurement of `E2.1.place_read_20` params with the existing PLACE_VALUE generator (1000 draws, invariant seeds) | 10 distinct, top 11 % → fails `MIN_DISTINCT` 12 → `SMALL_SPACES` entry planned (observed); `E1.10.place_read_12` tiles 54 distinct (ok) |
| criteria vs Progress count | 71 = 71 (observed) |
| `validate-rule-files.sh` | PASS, 243 paths, missing 0 (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main `bb00d7f` per contract: unit 1482, e2e 42 — inherited, unverified) |

No deliberate break: nothing testable was changed.

## 4. Next command

`/10x-tdd art-tasks-all-stages` (phase 1, Driver: tdd)

## 5. Open

- `[human]` rows (post-run checklist): 2.9 WebP/loose files/`tasks/measuring/` vs plan § 10 PNG; 8.9 S-14 narrowed vs
  roadmap literal; 9.7 MONEY_PAY deferred, MASS balanced only, negatives and zł + gr on tiles, temperatures 5/2 °C;
  9.8 text and `childName` acceptance (now incl. MASS „ile brakuje do pół kilograma / 1 kilograma”); 9.9 tablet sharpness,
  WebP in Safari, „12 zł 50 gr” on a tile.
- E2E phases needing the orchestrator (request-file): 2 (seed #8 per-image precache assertion; `e2e-break-p2.patch` now
  ignores ONE file, `note-500zl.webp`), 10 (`art-tasks.spec.ts`, patches p10a–p10d); phases 5–8 need a full-suite run.
- Known risks added by the review (plan.md `## Known risks`): scale/money at 768×190 beside the keypad (trigger: unreadable
  weights on screenshot 5.9 → `visualShape` makes `scale` tall); 200/500 zł notes precached without a skill; `requestfailed`
  in the seed may catch unrelated requests (filter to `/assets/` and `/_app/`, never weaken).
- Follow-ups to file in phase 9 (`follow-ups/review-fixes.md`): as listed in plan phase 9 § 1, plus 200/500 zł notes
  (`Trigger: S-14c or a money skill above 100 zł`).
- Profile change planned in phase 9: `context/foundation/autonomous-run.md` § 10 row `public/assets` "absent on purpose".
- DESIGN-GAP rows from 59 (plan phase 9 § 1).
- Budget cut order if a phase overruns: E5.5 ½ l/½ kg extras, then `E6.1.temperature_diff`.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Skill triage questions (`AskUserQuestion` "how to proceed", per-finding triage) decided in place (contract rule 1):
   every WARNING with an obvious fix applied to `plan.md`, F8 accepted into Known risks. Rejected: saving the report with
   PENDING decisions. Would change: a maintainer message on any finding.
2. F1: MASS `half`/`convert` reworded to „ile dekagramów brakuje do pół kilograma / 1 kilograma” instead of a constant
   answer. Rejected: keeping „Ile dekagramów to pół kilograma?” (one fact; fails `MAX_TOP_SHARE`). Would change: the teacher
   read finding „brakuje” too hard for E2.8 → that skill moves to S-14c as text.
3. F1: CAPACITY mixes jug kinds in one row (`jugs: JugId[]`). Rejected: loosening `MAX_TOP_SHARE` or adding liquid nouns.
   Would change: the phase-4 measurement showing a single-kind row already passes.
4. F4: E4.1 money capped at 100 zł; 200/500 zł notes kept in the pipeline unused. Rejected: dropping them from `TASK_ART`
   (the pipeline converts the kit set; re-adding later costs a pipeline edit) and placing them in E4.8 (MONEY not in its
   ZADANIA types). Would change: a teacher read wanting 200/500 zł in E4.1.
5. Product decisions reviewed and kept, each with a `[human]` row (WebP, narrowed scope, MONEY_PAY, MASS balanced, tiles for
   negatives/zł + gr, 5/2 °C). None clearly wrong. Would change: maintainer override.
6. Review done without the skill's sub-agent: the risky claims were few and file-local, checked directly (grounding table
   in the report). Would change: none.
