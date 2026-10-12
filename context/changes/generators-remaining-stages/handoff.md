# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 5` step of run `2026-10-12-s03-remaining-stages`. Phases 1–5 are committed (`3361723`, `c0e8bc9`, `308c458`, `0b5382e`, `8f4a7ee`). Phases 6–10 remain.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `8f4a7ee` `feat(generators-remaining-stages): CALENDAR dni tygodnia, dni miesiąca, fakty; EVEN_ODD z zerem (p5)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 19 (11 ticked: 1.1–1.3, 2.1–2.2, 3.1–3.2, 4.1–4.2, 5.1–5.2) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/calendar.ts` | CALENDAR variants `nextWeekday`, `prevWeekday`, `monthDays` (no February), `timeFacts` added; old variants draw in the same rng order |
| `src/core/tasks/generators/evenOdd.ts` | `EvenOddParams.min` (0 or 1, default 1); parser rejects other values |
| `src/data/calendar.ts` | `Weekday {name, after, before}` (`weekdays` is now objects), `Month.days`, `timeFacts` (5 facts with hint) |
| `src/data/pl.ts` | `nextWeekday`, `prevWeekday`, `weekdaysHint`, `monthDays`, `knuckleHint`, `monthDaysHint`; `evenOddHint` handles 0 |
| `tests/calendar.test.ts`, `tests/evenOdd.test.ts` | new tests (describe `generateCalendar weekdays, month lengths and time facts`; EVEN_ODD min 0 and parser) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | no stub needed (parser/data-driven): `AssertionError: expected [Function] to not throw an error but 'TypeError: CALENDAR params.variants m…' was thrown` (new variants) and EVEN_ODD min tests failing on `expected undefined to be 1` style assertions; 5 calendar + 2 evenOdd tests red |
| GREEN | `npx vitest run tests/calendar.test.ts tests/evenOdd.test.ts`: 12 passed |
| `npm run lint` / `typecheck` / `build` | OK |
| `npm test` | branch baseline 264 + 7 = 271 passed (33 files) |
| deploy test scripts, `sample -- E3`, `sample -- E4` | OK, `Naruszenia: 0` each; `sample -- E3 --seed 2` diff before/after empty |
| Deliberate break | no week wrap: `expected -1 to be +0` (nextWeekday, Sunday) and `expected -1 to be 6` (prevWeekday, Monday); `monthDays` drawing from all months: `Ile dni ma luty?` red. Restored, 7 green. Meta-check: the February break is caught by the validator's answer-in-choices rule (28 not in [30, 31]) as well as by the "not luty" assertion, so the test proves February never appears but not that it is excluded for the stated reason; the week order test uses `weekdays` indexes, so wrong `after`/`before` case data is only caught by the teacher read |
| Teacher read | "Jaki dzień tygodnia jest po środzie?" → czwartek, hint "Dni tygodnia po kolei: poniedziałek, …, niedziela"; "Ile dni ma październik?" tiles 30/31, hints "Policz na knykciach: wysokie kostki to miesiące dłuższe, doliny między nimi to krótsze." / "Październik ma 31 dni."; "Ile lat ma dekada?" tiles 12/10/8, hint "Dekada to tyle lat, ile palców mamy u obu rąk."; "Liczba 0 jest parzysta czy nieparzysta?" hint "Zero kończy się cyfrą 0, więc jest parzyste". Cases (po środzie, przed niedzielą, przed poniedziałkiem) correct |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 6`

## 5. Open

- Phase 6 is the E1/E2 data phase: needs the new `unit` command (sample E1–E4) in profile § 2, env and ci.yml per the plan. `LATER` types keep `brak generatora`.
- `monthDays` has only two tiles `[30, 31]` (per plan); `timeFacts` "Ile dni ma rok, który nie jest przestępny?" is 365 only (no leap-year variant). Weekday hint lists all days (method hint, includes the answer as part of the list).
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad).

## 6. Autonomous decisions

1. Manual gate / commit message / next-phase / unrelated-dirty-paths prompts: committed the planned set only, took the proposed subject, stopped after phase 5. Phase keeps `Driver: tdd`; data (`calendar.ts`, `pl.ts`) was done inline as scaffolding.
2. No stub before RED: new variants are rejected by the existing parser, so the first run already fails on assertions, not a missing module.
3. `monthDays` hint is two lines (knuckle method, then the month length); `timeFacts` single data hint line. Would change: a teacher read wanting a result line for timeFacts.
4. `change.md` status not touched.
