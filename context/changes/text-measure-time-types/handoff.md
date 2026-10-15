# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 6 of run `2026-10-15-fix-s14c-s14d`. Phase 6 is done and committed (LENGTH `scale` and `twoUnit`, CAPACITY `text`; E5.12, E6.3, E5.5 got skills). The next agent must not get wrong: `CapacityParams` is now a union (`JugCapacityParams | TextCapacityParams`, discriminated by `variant`), so code reading `jugs` must narrow on `variant !== 'text'`; E6.3 now has 3 skills (threshold 2), E5.12 and E5.5 3 each (threshold 2); `vite/e2eHookGuard.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e`, p4 `1ced210`, p5 `43b12f4`, p6 `4319de4` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | 5.5 `[reviewer]`, 5.6 `[visual]`, 6.5 `[reviewer]`, 6.6 `[visual]`; 4.6 `[reviewer]`, 4.7 `[visual]`, 4.8 `[human]`; 1.5, 2.6, 2.7, 3.5, 3.6 as before; phases 7-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/length.ts` | variants `scale` (plan scale, both ways, `scaleOptions`) and `twoUnit` (`generateTwoUnit`, pairs `cm-mm`, `m-cm`, box in the question or in the middle); parser rejects infeasible data |
| `src/core/tasks/generators/capacity.ts` | union params; `text` variant `generateGlasses` (litres to glasses of ½/¼ l, glasses to litres) |
| `src/core/tasks/bounds.ts` | `screenBound` counts `glasses` per litre |
| `src/data/measures.ts` | `SCALE_PLAN_CM`, `SCALE_PLACES`, `TWO_UNIT_PAIRS`, `GLASS_PER_LITRE`, `GLASS_SIGN`, `PITCHER_LIQUIDS` |
| `src/data/nouns.ts`, `src/data/pl.ts` | `szklanka`; `pl.tasks.lengthScale*`, `lengthFact`, `capacityGlass*` |
| `src/data/curriculum/E5.ts`, `E6.ts` | `E5.12.length_scale`, `E5.5.capacity_half_l_e5`, `E6.3.length_two_units` |
| `tests/{lengthText,capacityText}.test.ts` | new; `artFilter`, `unitSkills`, `perimeterSkills`, `capacity` tests updated |
| `plan.md` | rows 5.4 (orchestrator e2e note), 6.1-6.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stubs with an empty task / stub parsers) | `AssertionError: E5.5.capacity_half_l_e5 seed=1 draw=0 prompt="": expected null not to be null`; `test.half ... expected '' to contain '½'`; `expected 5 to be 20` (screenBound); 28 tests red |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2641 passed = baseline 2602 + 39 |
| `sample` E1-E6, deploy and ops scripts | `Naruszenia: 0` each / OK / OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e `--workers=4` (plain command, ran in this session) | 82 passed (5.8 min) = baseline 82 + 0 |
| Deliberate breaks | scale answer off by one (`real = plan * per + 1`) -> `expected 25 to be 24`; `cm-mm` factor 100 -> `lengthText` red (1 failed); `artBlocked` blocks CAPACITY `text` -> 2 failed in `artFilter.test.ts`. Restored, green. Meta-check: the oracles parse the prompt and use a test-owned band table and factors, not the data |
| Teacher read E5.5, E5.12, E6.3 `--count 6` | "Na planie 1 cm to 10 m. Boisko ma na planie 5 cm długości. Ile metrów długości ma naprawdę?" 5 · 10 = 50; "Klasa ma naprawdę 8 m długości" at 1 cm = 2 m; places keep believable sizes (pokój 3-9 m, klasa 6-10, ogród 10-40, sala 20-40, boisko 30-100, ulica 50-100); "8 cm 7 mm = □ mm", "115 cm = 1 m □ cm" (first hint "1 m = 100 cm" names no answer); "W dzbanku jest 5 litrów mleka. Ile szklanek po ¼ l możesz z niego nalać?" 5 · 4 = 20, "4 szklanki po ¼ l to ile litrów?"; the narrator reads "pół litra / ćwierć litra" and "okienko"; agreement (1 litr, 2 litry, 4 szklanki, 20 szklanek) correct |

## 4. Next command

`/10x-tdd text-measure-time-types phase 7` (phase 7, `Driver: tdd`)

## 5. Open

- `[reviewer]` 6.5 (done informally above), `[visual]` 6.6 screenshots (LENGTH scale first try, `twoUnit` with the box in the middle of the prompt, CAPACITY text solution step; 1440x900 and 1024x768); 5.5, 5.6, 4.6, 4.7, 1.5, 2.6, 2.7, 3.5, 3.6 as before; `[human]` 4.8, 9.6.
- Unlock thresholds now (PR body): E5.12 n 2 -> 3 (1 -> 2), E5.5 n 2 -> 3 (1 -> 2), E6.3 n 2 -> 3 (1 -> 2; with phase 5, E6.3 went 1 -> 3, 1 -> 2).
- The `capacity_half_l_e5` follow-up (Trigger S-14c) is closed by this phase; phase 9's follow-up sweep should drop it. The Polish "ćwierć litra" in `speak` also covers the keypad bar.
- Long prompts: the longest new prompt is ~95 characters (scale), fine on the prompt line; first hints are at most 64 characters (checked by `contentInvariants`).

## 6. Autonomous decisions

1. **`CapacityParams` is a union** (`JugCapacityParams`, `TextCapacityParams { variant: 'text'; glasses: ('half'|'quarter')[]; maxLitres }`); `artBlocked` needs no change because it already tested `variant === 'toLitres'`. Rejected: a separate generator type (the plan names CAPACITY). Would change: a text skill that needs a drawn glass.
2. **Scale data** lives in `SCALE_PLACES` (a place with a metre range) and a plan length of 2-12 cm; the generator enumerates (scale, place, plan) triples with a whole real length inside the range, so a remainder is impossible by construction and each place stays believable. Scales are 2, 5 or 10 m per cm (1 rejected: nothing to calculate). Wording "ma na planie 4 cm długości" (a length, not "ma 4 cm"), the place is a nominative subject so no case has to agree.
3. **`twoUnit`:** the question is always the box form (`4 cm 7 mm = □ mm`, `47 mm = 4 cm □ mm`), the small part is 1..factor-1; for metres 30 % of draws take 1..9 centimetres (2 m 5 cm = 205 cm, the trap). Range of the larger part: cm 1..30, m 1..9, limited by `max`.
4. **Glasses prompt:** "W dzbanku jest 5 litrów mleka. Ile szklanek po ¼ l możesz z niego nalać?" (the accusative-safe "jest N litrów X-genitive" avoids a case after the number); `speak` spells the fractions. The first hint is the fact sentence with no digit.
5. **Mixed phase:** none; whole phase TDD, data last. Test-only edit outside the new files: `tests/capacity.test.ts` narrows the params union (`p.variant === 'text'` throws as a fixture error).
