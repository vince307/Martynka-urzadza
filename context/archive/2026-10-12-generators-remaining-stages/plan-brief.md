# Generatory dla pozostałych etapów (E1–E2, E5–E6) — Plan Brief

> Full plan: `context/changes/generators-remaining-stages/plan.md`
> Research: `context/changes/generators-remaining-stages/research.md`

## What & Why

S-03 zamyka M1: autor wypisuje zadania grupy 1 (ZADANIA §7) dla E1, E2, E5, E6 na tych samych generatorach co E3–E4, a testy mechaniczne przechodzą dla wszystkich sześciu etapów (PRD FR-004, FR-005). Pełne dopracowanie treści tych etapów czeka na M8, ale poprawność odpowiedzi, podpowiedzi, odmiany i zakresów nie jest łagodzona.

## Starting Point

Rejestr ma 14 generatorów z S-02; brakuje 7 typów grupy 1 (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP). Losowanie ADD_SUB daje 13–21 % `a − a` na zakresach E1, CALENDAR nie zna dni tygodnia, ROUNDING tylko dziesiątki, liczby ≥ 10 000 nie mają zapisu ani nie widzą ich niezmienniki. `stages` = E3, E4.

## Desired End State

`npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0`; niezmienniki treści i test programu przechodzą po każdej umiejętności sześciu etapów; bramka lokalna i CI uruchamiają sample dla wszystkich etapów; jedyne odstępstwa od progów to dwa nazwane wyjątki małych przestrzeni E1 ze zmierzoną wartością.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres generatorów | 7 nowych typów + rozszerzenia ADD_SUB, CALENDAR, EVEN_ODD, COMPARE_NUM, ROUNDING, DIV, MULT | Każdy krok E1–E6 z typem grupy 1 musi mieć umiejętność | Research |
| `a − a` w ADD_SUB | rzadkie (`SAME_SHARE`) w generatorze, nie wyższy próg | Ten sam defekt co iloraz 1 w DIV, naprawiony tak samo | Research |
| Małe przestrzenie E1 | wyjątek `MIN_DISTINCT` per id (`E1.7.complement_10`, `E1.6.even_odd_single_10`) | Dopełnienie do 10 ma 9 zadań; globalny próg chroni 100+ umiejętności | Research |
| Odpowiedzi liczbowe E1 | klawiaturka, kafelki → follow-up S-04 | Brak ekranu w M1; wbrew literze ZADANIA §4, więc wiersz `[human]` | Research / Plan |
| Luty w „ile dni ma miesiąc” | pominięty | Katalog mówi o 30/31 dniach; 28/29 wymaga wielu odpowiedzi | Research |
| Zapis dużych liczb | `formatNumber` od 10 000, U+00A0; jeden wzorzec liczby dla testów i walidatora | Polska norma; inaczej niezmienniki są ślepe na „10 000” | Research / Plan |
| Podział | 10 faz (8 × tdd/impl logiki i danych + profil/CI/sweep) | Każdą fazę robi świeży agent; ≤ 2 nowe generatory na fazę | Plan |
| F12 (`70 − 9`) | rozbicie dla `a ≥ 20`, `10 − b` jedną linią | Szkolna metoda bez dziwnego „10 − 10 = 0” w E1 | Plan |
| Podpowiedź `4 · 70` | `4 · 7 = 28`, `28 · 10 = 280` | Obecna (połowienie) jest poprawna, ale nieszkolna | Plan |

## Scope

**In scope:** 7 generatorów z parserami odrzucającymi niewykonalne dane; rozszerzenia istniejących generatorów; `E1.ts`, `E2.ts`, `E5.ts`, `E6.ts`; `GROUP_1` / `LATER`; wyjątki małych przestrzeni; `formatNumber`; profil § 2, env, `ci.yml`, dokumentacja, follow-upy, seam sweep.

**Out of scope:** typy grup 2–4 i tekstowe spoza §7; kafelki E1; luty; NUMBER_WORDS > 1000; MISSING_OP z · i :; obrazki; sceny; F14, F10, F6; pełne dopracowanie treści E1–E2/E5–E6.

## Architecture / Approach

Jeden generator na typ w `src/core/tasks/generators/`, parametryzowany danymi etapu z `src/data/curriculum/`; teksty w `src/data/`; wspólna arytmetyka w `src/core/tasks/arith.ts`. Niezmienniki (`tests/contentInvariants.test.ts`) i test programu (`tests/curriculum.test.ts`) iterują po `stages`, więc nowe etapy wchodzą do nich automatycznie. Dane etapu wchodzą dopiero po generatorach wszystkich jego typów grupy 1.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. ADD_SUB + F12 + BONDS (tdd) | rzadkie `a − a`, rozbicie `70 − 9`, domki liczb | zmiana wydruku E3 |
| 2. CHAIN + MISSING_OP (tdd) | trzy składniki, brakujący znak; `arith.ts` | wyniki pośrednie poza zakresem |
| 3. COMPARE_EXPR + SEQUENCE (tdd) | porównanie działań, ciąg z luką | liczby ujemne w ciągu malejącym |
| 4. FACT_FAMILY + CHOOSE_OP (tdd) | przemienność, sprawdzanie, wybór działania | drugi poprawny kafelek (zamiana składników) |
| 5. CALENDAR + EVEN_ODD (tdd) | dni tygodnia z przypadkami, dni miesiąca, fakty; zero | błędne formy „po środzie / przed środą” |
| 6. Dane E1 + E2 (impl) | dwa etapy; nowa komenda bramki (sample E1–E4) | małe przestrzenie E1 |
| 7. formatNumber + COMPARE_NUM (tdd) | „1 000 000”, niezmienniki widzą grupowane liczby | ciche wyłączenie sprawdzeń |
| 8. ROUNDING + DIV + MULT (tdd) | setki/tysiące, `quotients`, `4 · 70` | remisy przy zaokrąglaniu |
| 9. Dane E5 + E6 (impl) | dwa etapy; nowa komenda bramki (sample E1–E6) | ·0/·1 blisko progu w E5.4 |
| 10. Bramka, CI, docs, sweep (impl) | profil, env, `ci.yml`, follow-upy, porządki | CI rozjechane z lokalną bramką |

**Prerequisites:** S-02 i `testing-content-invariants` zarchiwizowane (są); gałąź `feat/generators-remaining-stages`.
**Estimated effort:** 10 sesji agenta (po jednej na fazę), każda z pełną bramką ~20 s.

## Open Risks & Assumptions

- Wyjątki małych przestrzeni mają wartości zmierzone w fazie 6; jeśli pomiar różni się od research (9 / ~11), wpisuje się wartość zmierzoną.
- E5.4 MULT ·0/·1 = 32,8 % przy progu 35 % — mały zapas; przy przekroczeniu poprawia się dane kroku, nie próg.
- Formy przypadków dni tygodnia i treści CHOOSE_OP sprawdza tylko odczyt nauczyciela (walidator zna tylko słownik rzeczowników).
- Niezmienniki ~120 umiejętności × 1000 losowań: oczekiwane ~15 s zamiast < 5 s.

## Success Criteria (Summary)

- `npm run sample -- <etap>` dla E1–E6: kod 0, `Naruszenia: 0`, zadania w każdym kroku z typem grupy 1.
- `npm test` zielone z niezmiennikami dla wszystkich etapów; CI job `check` uruchamia sample dla sześciu etapów.
- Odczyt nauczyciela E1, E2, E5, E6 (`--count 6`) bez błędów odpowiedzi, podpowiedzi i odmiany.
