# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by the `/10x-plan` step of run 2026-10-21-post-run-polish: `plan.md` (9 phases, each with `Driver:`) and
`plan-brief.md` are committed; nothing is implemented. The one thing the next agent must not get wrong: the F3 fix
keeps every rng call of today's draw (repair after the draw, no rng), and the heading rule keys on answer type + box
position in one pure `headingOf` used by both screen and narrator.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | 3 on top of `ba3a7c4` (identity, research, this step `docs(post-run-polish): plan`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 42 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/post-run-polish/plan.md` | implementation plan: 9 phases (1 tdd heading rule, 2 tdd narrator, 3 impl screen + hook `heading`, 4 tdd F3 repair, 5 impl N-1 removal + e2e #15 H-1 adapted, 6 tdd H-2 `pictureCutCount`, 7 tdd N-4 `assertDrawable`, 8 impl docs + seam sweep + follow-ups, 9 e2e #11 heading), `## Autonomous decisions` P-1..P-10, `## Progress` |
| `context/changes/post-run-polish/plan-brief.md` | two-page brief |
| `context/changes/post-run-polish/change.md` | frontmatter `status: planned` (metadata guard only) |
| `context/changes/post-run-polish/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/post-run-polish` |
| body Success Criteria vs `## Progress` (python check) | 9 phases, every phase 1:1 (4/6/5/5/5/5/4/5/3 rows) |
| `grep -c '^Driver:' plan.md` | 9 |
| roadmap sync | `context/foundation/roadmap.md` has no Change ID `post-run-polish` — untouched (non-roadmap change) |
| lint / typecheck / unit / build / e2e | not run — docs-only plan step (step prompt: no builds, e2e or servers); baseline inherited, unverified: unit 3710, e2e 143 |

No deliberate break (docs step).

## 4. Next command

`/10x-plan-review post-run-polish`

## 5. Open

- Manual rows (human checklist): 2.5 [reviewer] teacher read of `czyta:` lines (`npm run sample -- <S> --count 6`); 2.6
  [human] tablet listening check of "Wstaw znak"; 3.5 [visual] headings at 1440/1024 (comparison, box-filling, "Oblicz");
  6.5 [visual] "Obrazki" with a cut at 1440/1024; 8.5 [reviewer] CLAUDE.md symbols.
- DESIGN-GAP: row 154 added in phase 2 (`pl.round.heading`), row 153 rewritten in phase 5.
- e2e: phase 5 edits `tests/e2e/load-and-tab-guard.spec.ts` `#15 H-1` (title + last assertions → `artCut`), count +0;
  phase 9 adds one test to `tests/e2e/narrator.spec.ts` (+1). The orchestrator runs e2e at gates.
- Sample stability: phase 2 diff limited to `czyta:` lines; phases 4 and 7 `npm run sample` byte-identical to their
  parent commit.
- Follow-ups to record in phase 8 (`follow-ups/review-fixes.md`, ≥ 12 `Trigger:` lines): audit N-2, N-3, N-5, N-6 and
  other open rows; M-1/M-2/M-13/H-3/H-4; `modeWidgets` in `TaskScene.render`; G-2/G-3/B-4/B-5; "Obrazki" `Kod:` not
  muted; L-8; sounds-only cut e2e; `speak` question redundancy; "Uzupełnij" wording; finer variety type key; F3 closed.

## 6. Autonomous decisions

- PL-1 "… = □" keeps "Oblicz" (plan P-1); rejected "Uzupełnij" for every box. Why: a result slot is a calculation.
  Would change: teacher read preferring one heading per generator type.
- PL-2 Speaker = heading + today's text, `speak` questions kept (P-2); rejected dropping them. Why: no generator change,
  the question explains "okienko". Would change: teacher read or playtest calling it too long.
- PL-3 Word round read without a heading (P-3), in scope. Why: PA-1 "same heading" and the screen shows none. Would
  change: nothing in this run.
- PL-4 Phase headings follow the format example (`## Phase N:` with `Driver:`/`Driver why:` as the first lines under
  it; `### Phase N:` only in `## Progress`), not duplicated `###` body headings. Why: the format example passed the
  orchestrator's gates in run 2026-10-20. Would change: the orchestrator's driver check reading only `### Phase N:` body
  headings (then add them above `Driver:`).
- PL-5 One e2e phase (#11 heading, hook gains `heading`) and the N-1 e2e pin adapted inside phase 5 (P-6, P-9). Would
  change: the hook already exposing drawn prompt texts.
- PL-6 No PRD conflict found (P-10); the only `[human]` row is the device listening check 2.6.
- PL-7 No sub-agents: research had located every symbol; a few greps confirmed skill ids and the narration hook path.
  Would change: an area outside the named files.
