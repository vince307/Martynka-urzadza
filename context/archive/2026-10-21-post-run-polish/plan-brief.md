# Task headings, round variety cap, "Obrazki" cut lines, skill id on drawing errors — Plan Brief

> Full plan: `context/changes/post-run-polish/plan.md`
> Research: `context/changes/post-run-polish/research.md`

## What & Why

Polish after run 2026-10-20: a comparison task ("72 □ 37", tiles < > =) is headed "Oblicz", which tells the child to
calculate when they must choose a sign; the variety rule can still give 3 tasks of one type because it caps in draw
order; "Obrazki" blames the background for cuts that hidden time can no longer cause and counts sounds and the font as
pictures; two drawing throws give an "Ups!" code without the skill id. Decisions are the maintainer's (scope.md, PA-1..PA-8).

## Starting Point

`isExpression` alone decides "Oblicz" on screen (`TaskScene.drawPrompt`) and, separately, in the narrator
(`spokenTask`, which skips tasks whose `speak` is a question). `pickVariedSkills` checks the cap per draw. `artHealthLines`
takes `cut = bootLoad.cut.length` and a `background` flag. `coinLayout` and `columnMarks` throw only in the scene.

## Desired End State

Sign choices say "Wstaw znak", a number to put in a box inside an equation says "Uzupełnij", calculations keep "Oblicz";
the speaker says the same heading first; word rounds have none. No round has 3 of one type unless the rolled pools force
it, with the same buckets and rng state per seed. "Obrazki" shows the ordinary cut line, only for cut pictures. A bad coin
tray or written column fails at generation with `Kod: RangeError/<skillId>`. Save format stays v4.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Heading words | "Wstaw znak" (sign), "Uzupełnij" (box inside), "Oblicz" (calculation) | Maintainer's wording for signs; "Uzupełnij" is the game's own box instruction (gap 154) | Scope / Research / Plan |
| Heading rule | One pure `headingOf` on answer type + box position, used by screen and narrator | No per-type list to drift; PA-1 wants the same heading heard | Research |
| "… = □" | "Oblicz" | A result slot is a calculation (P-1) | Plan |
| Speaker | Heading + today's text (question kept) | No generator change; the question explains "okienko" (P-2) | Plan |
| Word round | No heading read | The screen shows none there (P-3) | Plan |
| F3 | Same draw, then rng-free backtracking repair | Keeps one bucket roll per draw, so shares per seed are untouched | Research |
| N-1 | Background line removed, e2e #15 H-1 adapted in the same phase | Hidden time no longer cuts | Scope |
| H-2 | `pictureCutCount` over `cutByTable` task+room+ui | Sounds and font have their own lines | Scope / Research |
| N-4 | `assertDrawable` gains coin-tray and column checks | Fails inside `generateTask`, rng-free | Scope / Research |

## Scope

**In scope:** heading rule + copy + narrator + screen + hook field; variety repair; N-1 removal; H-2 count; N-4 checks;
DESIGN-GAP 153 rewritten, 154 added; CLAUDE.md sentences; follow-ups file; one e2e test.

**Out of scope:** `speak` question changes; audit N-2, N-3, N-5, N-6 and other LOWs; DOM test of the "Obrazki" view;
sounds-only cut e2e; save format; roadmap edits.

## Architecture / Approach

Pure core first (`src/core/round/heading.ts`, `spoken.ts`, `variety.ts`, `artHealth.ts`, `tasks/visual.ts`), then thin
scene wiring (`TaskScene.currentNarration`/`drawPrompt`, `UIScene.openSettings`), words in `pl.round.heading`, the e2e
hook reports the drawn heading.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Heading rule (tdd) | `headingOf` + survey test | A future string-answer expression misclassified |
| 2. Narrator heading (tdd) | Spoken heading, word round silent, `pl.round.heading`, gap 154 | Sample diff beyond `czyta:` lines |
| 3. Screen heading (impl) | `drawPrompt` from the rule, hook `heading` | Canvas only, proven by phase 9 + screenshots |
| 4. F3 repair (tdd) | Cap holds regardless of order | Changing buckets/rng (oracle (a) guards) |
| 5. N-1 removal (impl) | Ordinary cut line, e2e #15 H-1 adapted | e2e left red if not adapted |
| 6. H-2 count (tdd) | Pictures-only cut count | — |
| 7. N-4 checks (tdd) | Coin tray and column at generation | rng use (sample byte-identical) |
| 8. Docs + sweep (impl) | CLAUDE.md, comments, follow-ups with triggers | Stale sentences |
| 9. e2e #11 heading | Screen + narration heading in the browser | Load flakes |

**Prerequisites:** branch `feat/post-run-polish` at the plan commit; baseline unit 3710, e2e 143.
**Estimated effort:** ~9 short agent sessions.

## Open Risks & Assumptions

- "Uzupełnij" is agent wording (gap 154); the author may rephrase.
- "Wstaw znak. Jaki znak pasuje w okienku?" is slightly redundant (follow-up with a trigger).
- The repair's first-in-pool choice makes that skill slightly more frequent in repaired rounds.

## Success Criteria (Summary)

- The comparison task on the warm-up shows and says "Wstaw znak".
- No avoidable 3-of-a-kind round over every step × 200 seeds; shares unchanged.
- "Obrazki" never mentions the background and ignores sound/font cuts; drawing errors name the skill.
