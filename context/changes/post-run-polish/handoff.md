# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by the `/10x-plan-review` step of run 2026-10-21-post-run-polish: verdict PROCEED, three WARNINGs fixed in
`plan.md`, nothing implemented. The one thing the next agent must not get wrong: phase 1 is test-first for an absent pure
`headingOf` (`src/core/round/heading.ts`) — export a stub returning null first so the new tests fail on an assertion.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | 4 on top of `ba3a7c4` (identity, research, plan, this step `docs(post-run-polish): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/reviews/plan-review.md` | plan review report (F1–F5, verdict PROCEED) |
| `context/changes/post-run-polish/plan.md` | edited: phase 3 hook files (`TaskSnapshot`/`snapshot()` in `TaskScene.ts`), 2.3 sample-diff wording (body + Progress), phase 6 test file `tests/artHealth.test.ts`, phase 7 tests in `tests/generateTaskFailure.test.ts` (`FAKE` seam), Known risks narration length |
| `context/changes/post-run-polish/change.md` | status `plan_reviewed` |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/post-run-polish` |
| throwaway vitest of `pickVariedSkills` on today's code (file removed, tree clean) | `E2.1` seeds 1, 21: buckets current×3, previous, current → PLACE_VALUE ×3 (previous draw took ADD_SUB, avoidable); `E1.10` seed 107: COUNT ×3 with an earlier draw on COUNT (avoidable) — phase 4 repros are red today |
| greps (`round.calculate` consumers, `artCutBackground` in e2e, `assertDrawable` money skips `pay`, `columnMarks` RangeError, `ART_LIMITS.trayKinds` = `maxKinds` = 4, no jsdom/happy-dom) | as the plan states, except F1/F3 locations (fixed) |
| Progress↔Phase, `Driver:` lines | 9/9 phases 1:1, 9 drivers, all correct |
| lint / typecheck / unit / build / e2e | not run — review step (step prompt: no builds, e2e or servers); baseline inherited, unverified: unit 3710, e2e 143 |

No deliberate break (docs step).

## 4. Next command

`/10x-tdd post-run-polish phase 1`

## 5. Open

- Manual rows (human checklist): 2.5 [reviewer] teacher read of `czyta:` lines; 2.6 [human] tablet listening check of
  "Wstaw znak"; 3.5 [visual] headings at 1440/1024; 6.5 [visual] "Obrazki" with a cut at 1440/1024; 8.5 [reviewer]
  CLAUDE.md symbols.
- DESIGN-GAP: row 154 added in phase 2 (`pl.round.heading`), row 153 rewritten in phase 5.
- e2e: phase 5 adapts `tests/e2e/load-and-tab-guard.spec.ts` `#15 H-1` (+0); phase 9 adds one test to
  `tests/e2e/narrator.spec.ts` (+1).
- Review F4 (narration length, COMPARE_EXPR three directives) in plan Known risks; follow-up recorded in phase 8.
- Follow-ups to record in phase 8 (`follow-ups/review-fixes.md`, ≥ 12 `Trigger:` lines) — list in plan phase 8.

## 6. Autonomous decisions

- PR-1 Deep review done by direct greps and one throwaway vitest instead of a sub-agent. Why: every risky claim sat in
  named files; a sub-agent would re-read the same. Would change: a claim spanning unnamed modules.
- PR-2 F1–F3 fixed in plan.md as WARNINGs (wrong file / over-strict criterion), not RETHINK. Why: each is a location or
  wording fix, the approach is sound. Would change: a driver or seed contract found wrong.
- PR-3 Heading wording accepted as a teacher would ("Wstaw znak" also for MISSING_OP; "Uzupełnij" for a box inside an
  equation; "Oblicz" for a result slot). Would change: the teacher read 2.5 or the author rephrasing gap 154.
- PR-4 Narration "heading + existing question" accepted (one imperative + one question, not a double question);
  recorded as F4. Would change: playtest note that it is too long.
