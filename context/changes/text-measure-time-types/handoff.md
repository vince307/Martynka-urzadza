# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 5 of run `2026-10-15-fix-s14c-s14d`. Phase 5 is done and committed (UNIT_CHOICE, text MASS; E5.7, E6.3, E6.5 got skills). The next agent must not get wrong: `MassParams` is now a union (`ScaleMassParams | TextMassParams`, discriminated by `variant`), so code reading `weights` must narrow on `variant !== 'text'`; phase 6 adds `E6.3.length_two_units` (E6.3 then has 3 skills, threshold 2) and `E5.12`/`E5.5` skills; `vite/e2eHookGuard.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e`, p4 `1ced210`, p5 `43b12f4` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | 5.4 (e2e part), 5.5 `[reviewer]`, 5.6 `[visual]`; 4.6 `[reviewer]`, 4.7 `[visual]`, 4.8 `[human]`; 1.5, 2.6, 2.7, 3.5, 3.6 as before; phases 6-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/unitChoice.ts` | UNIT_CHOICE: item + number from `UNIT_ITEMS`, tiles = answer + 2 other units, `speak` without "okienko"; registered |
| `src/core/tasks/generators/mass.ts` | union params; text variant: `net|gross|tare` (pack, unit g or kg), `kgToG`, `fractionKg`, `tToKg`, `qToKg`; `parseTextParams` |
| `src/core/round/artFilter.ts` | `artBlocked` narrows on `variant`: text MASS is never blocked |
| `src/data/measures.ts` | `UNIT_TILES`, `UNIT_ITEMS`, `MASS_PACKS` (gross range per pack), `MASS_FACTORS` |
| `src/data/nouns.ts`, `src/data/pl.ts` | gram, dekagram, kilogram, tona, kwintal; `pl.tasks.unitChoice*`, `massPack*`, `massAsk`, `massFact`, `mass*KgPrompt`, `massToKiloPrompt`; `elapsedToHourFirst` reworded |
| `src/data/curriculum/E5.ts`, `E6.ts` | `E5.7.unit_choice` (tiles), `E5.7.mass_grams`, `E6.3.mass_tare_kg`, `E6.5.mass_tonne` |
| `tests/{unitChoice,unitSkills}.test.ts`, `tests/{mass,artFilter,curriculum,perimeterSkills,clockElapsed}.test.ts` | new and updated tests (`UNIT_CHOICE` added to `GROUP_1`) |

## 3. Verification

| command | result |
|---|---|
| RED (stubs with an empty task) | `AssertionError: T.unit_choice.length seed=1 draw=0 prompt="": expected [ { …(3) } ] to deeply equal []`; mass text `T.mass_net_g seed=1 draw=0 prompt="": expected [ … ] to deeply equal []`; toHour hint: `expected 'Do pełnej godziny liczymy od 60 minut.' to be 'Godzina ma 60 minut. Od 60 odejmij mi…'`; data: `expected [ 'E6.3.perimeter_composite' ] to include 'E6.3.mass_tare_kg'` |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2602 passed = baseline 2561 + 41 |
| `sample` E1-E6, deploy and ops scripts | exit 0 each / OK / OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, plain `--workers=4`); expected 82 passed = baseline 82 + 0. Phase 4's row 4.5 ticked from the orchestrator note (82 passed on `1ced210`) |
| Deliberate breaks | `artBlocked` blocks text -> `E5.7.mass_grams: expected true to be false`; Kromka chleba re-unitised to dag (a second sensible tile) -> 2 `unitChoice` tests red; tare up to twice the gross -> 4 `mass` tests red (`expected 0 to be greater than 0`). Restored, green. Meta-check: the artBlocked test uses the real curriculum skills (E5.7/E6.3/E6.5) and the unit oracle is a test-owned band table, not the data |
| Teacher read E5.7, E6.3, E6.5 `--count 6` | "Pies waży 8 □." tiles kg/dag/g, first hint without digit or unit, second "Pies jest cięższy niż plecak, a lżejszy niż dorosły", last "Pies waży 8 kg."; "Ile kwintali to 500 kilogramów?", "Ile kilogramów to 4 tony / 5 ton / 7 kwintali"; "Słoik miodu: zawartość (netto) waży 210 g, a opakowanie (tara) 40 g. Ile waży całość (brutto)?" with 210 + 40 = 250; first read had "Wiadro farby 58 kg" and tare 1 of 58: replaced by a gross range per pack (`MASS_PACKS`) |

## 4. Next command

`/10x-tdd text-measure-time-types phase 6` (phase 6, `Driver: tdd`)

## 5. Open

- `[reviewer]` 5.5 (done informally above), `[visual]` 5.6 screenshots (UNIT_CHOICE unit tiles first try and hint, MASS tare on the keypad, MASS tonne solution step; 1440x900 and 1024x768); 4.6, 4.7, 1.5, 2.6, 2.7, 3.5, 3.6 as before; `[human]` 4.8, 9.6.
- 5.4 stays unticked until the orchestrator's e2e run (`82 + 0`).
- Unlock thresholds now (PR body): E5.7 n 2 -> 4 (threshold 1 -> 2), E6.3 n 1 -> 2 (1 -> 1; phase 6 makes it 3, threshold 2), E6.5 n 2 -> 3 (1 -> 2).
- The narrator reads a pack prompt without the brackets ("zawartość, netto waży …"); acceptable, a `speak` could be added later.

## 6. Autonomous decisions

1. **CLOCK_ELAPSED `toHour` first hint** (orchestrator probe of phase 4): now "Godzina ma 60 minut. Od 60 odejmij minuty, które już minęły." (59 characters, fits the keypad bar); the test asserts the exact text.
2. **`MassParams` is a union** with `ScaleMassParams` unchanged and `TextMassParams { variant: 'text'; kinds; unit?; max }`; `unit` ('g'|'kg') is required only when a pack kind is listed. `artBlocked` narrows on `variant` (plan-review F7). Rejected: a separate generator type (the plan names MASS). Would change: a text skill that needs dag.
3. **UNIT_CHOICE tiles:** the answer plus two other units of the quantity; `dag` is only ever a distractor (the same mass reads in g and in dag); tonne is not a tile (E6 text MASS owns it). Each item has a `like` second hint that names no unit. `speak` reads "Jaka to jednostka?" instead of "okienko".
4. **Packs carry a gross range** (`MASS_PACKS`), tare is at most a quarter of the gross (g: steps of 50 and 10; kg: whole numbers); wording is the same colon form for all three kinds.
5. **Conversions** `kgToG`, `tToKg`, `qToKg` go both ways like TIME_UNITS, counts 2..9 (tonnes 2..5) and `max` bounds the larger number on screen; `fractionKg` is "pół / ćwierć kilograma w gramach" (20 % each) and "Na wadze jest 250 g. Ile gramów brakuje do 1 kg?".
6. **E5.7.mass_grams** lists all five pack/conversion kinds in grams (max 5000), E6.3 only pack kinds in kg (max 100), E6.5 `tToKg` and `qToKg` (max 5000).
7. **Mixed phase:** none; whole phase TDD, data last.
