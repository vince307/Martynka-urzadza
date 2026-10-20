# Playtest fixes F-01..F-03 — Plan Brief

> Full plan: `context/changes/playtest-fixes-f01-f03/plan.md`
> Research: `context/changes/playtest-fixes-f01-f03/research.md`

## What & Why

Three notes from the family playtest (`docs/playtest-feedback.md`): the narrator read every E1/E2 task aloud by
itself (F-01); the age could not be corrected and the settings gear looked disabled (F-02); one task type filled 3–4
of 5 tasks in a round (F-03). The maintainer fixed the answers in `context/runs/2026-10-20-playtest-boot/scope.md` § 1.

## Starting Point

`balance.narrator.autoReadStages` is `['E1','E2']`; the gear is drawn at 70 % opacity in grey-teal and a short tap does
nothing; the age choice appears only at first launch; `pickRoundSkills` picks a skill uniformly inside the rolled
bucket, so a one- or two-type step repeats types (41.9 % of rounds have > 2 of one type).

## Desired End State

No task is read aloud unless the parent turns it on. The gear looks active; the first tap shows "Przytrzymaj, żeby
otworzyć ustawienia rodzica". A child who chose her own age sees "Wróć" during the warm-up and her first round and can
go back to the age choice with her stars kept. A round has at most 2 tasks of one type and no two of a type in a row,
unless the step has too few types; the 60/30/10 draw and the unlock threshold are unchanged. Save format stays v4.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Auto-read default | off for every stage | maintainer decision | Scope (PA-1) |
| Gear | full colour, hint on first tap per page load, gate and 2 s hold unchanged | maintainer decision; once avoids inviting play | Scope (PA-2) / Plan (A-6) |
| "Wróć" window | warm-up + first ordinary round, derived from saved `variants` + `history` | no new save field (v4) | Scope (PA-3) / Research |
| "Wróć" for parent-placed learner | hidden | the child corrects her own age, not the parent's choice | Plan (A-2) |
| "Wróć" placement / confirm | left margin, whole round, no confirm | leave a too-hard task at once; one age tap is cheap | Plan (A-3, A-4) |
| Type | `SkillDef.type` (generator) | what a child perceives | Research (R-2) / Plan (A-1) |
| Variety mechanism | cap in the pick (same rng stream → same buckets), rng-free reorder for neighbours | shares kept exactly, testable draw by draw | Plan (A-5) |
| PRD FR-009 | not hand-edited; follow-up + `[human]` row | foundation files belong to `/10x-prd` | Plan (A-7) |

## Scope

**In scope:** `balance.ts` default; `longPress` tap result; gear tokens + `SettingsHint` widget; `ageBackOffered`
predicate + "Wróć" in `TaskScene`; `variety.ts` for rounds and the warm-up; design gaps 151–152; `Martynka-urzadza.md`,
`CLAUDE.md`, follow-ups; e2e #12 and #14.

**Out of scope:** save format, adult gate, variant rounds, finer type keys, PRD/ZADANIA edits, audit M-1/M-2/M-13/H-3/H-4
fixes, the "naprawione (#PR)" status (ship step).

## Architecture / Approach

Pure rules in `src/core` with seeded tests first (variety, tap, predicate), then thin scene wiring (`curriculum.ts`,
`warmup.ts`, `UIScene`, `TaskScene`), numbers in `balance.ts`, strings in `pl.ts`, geometry in `layout.ts`. "Wróć"
exits by cleanup → learner `null` → `flush('now')` → stop UI/Room → start welcome, never touching `finishRound`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Round variety (tdd) | `variety.ts`, wired in `buildAdaptiveRound` | rng stream drift changes shares |
| 2. Warm-up variety (tdd) | shared cap, reorder per half | halves broken |
| 3. Narrator default + tap (tdd) | `autoReadStages: []`, `longPress.tap` | `roomGesture` reacting to the new field |
| 4. Gear look + hint (impl) | tokens, `SettingsHint`, UIScene wiring | hint covering a button |
| 5. "Wróć" predicate (tdd) | `ageBackOffered`, learner-less save round-trip | v1-migrated saves |
| 6. "Wróć" button (impl) | `PageButton` in the left margin, `backToAge` | half a round committed |
| 7. Docs + seam sweep (impl) | plan, CLAUDE.md, follow-ups | stale rule-file facts |
| 8. e2e #12 | way back, stars kept, reload, gone after round 1 | debounce timing |
| 9. e2e #14 | tap hint once, hold opens gate | fixed sleeps |

**Prerequisites:** branch `feat/playtest-fixes-f01-f03`; the contract baseline line is still a placeholder, so each
phase measures its own branch baseline.
**Estimated effort:** 9 small phases, one agent session each.

## Open Risks & Assumptions

- On a one-type step the cap must relax (15 of 62 steps): those rounds keep 3+ tasks of one type, spread apart.
- The variety pick favours rarer types inside a bucket, so per-skill practice shifts (bucket volume does not).
- A v1-migrated child with exactly one finished round could still see "Wróć" (history ≤ 6) — accepted.

## Success Criteria (Summary)

- A fresh E1 child hears nothing until she taps the speaker; the parent can still turn reading on.
- A tap on the gear explains the hold; a wrong age is corrected by the child herself before round 2.
- Rounds no longer repeat a task type 3–4 times when the step has other types.
