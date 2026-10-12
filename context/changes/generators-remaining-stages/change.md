---
change_id: generators-remaining-stages
title: Zadania grupy 1 dla etapów E1–E2 i E5–E6 na wspólnych generatorach
status: planned
created: 2026-10-12
updated: 2026-10-12
archived_at: null
---

## Notes

S-03 z roadmapy (etap M1, zamyka M1): autor wypisuje `npm run sample -- <etap>` dla E1, E2, E5 i E6 z zadaniami
typów grupy 1 (ZADANIA.md §7) z poprawną odpowiedzią, rozpraszaczami, podpowiedzią i odmianą; testy mechaniczne
(`tests/contentInvariants.test.ts`, `tests/curriculum.test.ts`) przechodzą dla wszystkich sześciu etapów.
Dopracowanie treści E1–E2 i E5–E6 poza poprawnością zostaje na M8 (PRD FR-004, Non-Goals); poprawność odpowiedzi,
podpowiedzi, odmiany i zakresów nie jest łagodzona (agent-contract, reguły S-03).

Źródła: `context/foundation/roadmap.md` (S-03), `context/foundation/prd.md` (FR-004, FR-005, Non-Goals),
`docs/ZADANIA.md` §2 (zakresy), §3 (kroki E1, E2, E5, E6), §4 (typy), §7 (grupa 1); wzorce:
`context/archive/2026-10-12-generators-e3-e4/`, `context/archive/2026-10-12-testing-content-invariants/`.

## Roadmap claims vs repo now

Stan sprawdzony na `feat/generators-remaining-stages` cięty z `main` @ `a24b502`.

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| „na tych samych generatorach z danymi etapu” (Outcome) | `src/core/tasks/registry.ts` ma 14 generatorów: ADD_SUB, MISSING, COMPLEMENT, ROUNDING, MULT, DIV, HALF, COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN, CALENDAR, WORD, COMPARE_DIFF. S-02 dostarczył tylko typy potrzebne krokom E3–E4. Brakuje 7 z 18 typów grupy 1 z §7: BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP — a kroki E1–E2 i E5–E6 ich wymagają (np. E1.3 BONDS + CHOOSE_OP, E1.5 CHAIN, E1.7 COMPARE_EXPR, E1.9 MISSING_OP, E2.4/E2.6/E5.9/E6.7 FACT_FAMILY, E2.7 SEQUENCE). | Slice dodaje 7 nowych generatorów + parserów w rejestrze, nie tylko dane etapów. To największa część pracy; „wspólne” znaczy: jeden generator na typ, parametryzowany danymi etapu. |
| „testy mechaniczne … przechodzą dla wszystkich sześciu etapów” | `tests/contentInvariants.test.ts` i `tests/curriculum.test.ts` iterują po `stages` z `src/data/curriculum/index.ts`, który ma tylko E3, E4 — nowe etapy wejdą automatycznie po dopisaniu do `stages`. Ale `GROUP_1` w `tests/curriculum.test.ts` to lista 14 zaimplementowanych typów, a `LATER` nie zna typów E1/E2/E5/E6 spoza grupy 1 (SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, COUNT, ORDINAL, INEQUALITY, MONEY_PAY, ARROW_TABLE, WRITTEN, CLOCK_ELAPSED, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, TIME_UNITS, MIX, LOGIC). | `GROUP_1` rozszerzyć o 7 nowych typów, `LATER` o typy spoza grupy 1 występujące w krokach nowych etapów. Progi niezmienników (`MIN_DISTINCT = 12`, `MAX_TOP_SHARE = 0.15`) mogą nie przejść dla małych przestrzeni E1 (wynik ≤ 5, domki do 6–7) — obniżenie tylko z komentarzem i zmierzoną wartością (contract). |
| „zamyka etap M1 (`sample` dla każdego etapu)” (Risk) | `scripts/sample.ts` działa dla każdego etapu z danymi; lokalna bramka (profil §2, `autonomous-run.env` `GATE_UNIT`) i `.github/workflows/ci.yml` uruchamiają tylko `sample -- E3` i `-- E4`. | Faza „profil” planu dopisuje `sample -- E1/E2/E5/E6` do profilu §2, `autonomous-run.env` i `ci.yml` (contract, reguła S-03). |
| Istniejące generatory pokrywają zakresy E5–E6 przez same dane | Częściowo. `ROUNDING` ma `to: 10` (E6.9 wymaga setek i tysięcy; ROUNDING nie jest w grupie 1 §7, ale S-02 go dodał). `CALENDAR` ma warianty `nextMonth/prevMonth/quarter/romanMonth` — brak dni tygodnia (E1.4), dni miesiąca 30/31 (E5.11), dekady/365 dni (E6.1); `weekdays` już jest w `src/data/calendar.ts`. `NUMBER_WORDS` do 1000 (`MAX_NUMBER_WORD`), E6 „pełne tysiące” poza zakresem. MULT/DIV: E6 4 · 70, 3 · 200, 800 : 4, 96 : 6 nie są wyrażalne obecnymi `factors`/`divisors`/`maxFactor` bez sprawdzenia. COMPARE_NUM do 1 000 000 — formatowanie liczb ≥ 1000 (spacja tysięcy) nieustalone, a `ARITHMETIC_LINE` w niezmiennikach zna tylko `\d+`. ADD_SUB: kształty HTU już są (`src/core/tasks/shapes.ts`). | Research musi zmierzyć, które parametry E5–E6 potrzebują rozszerzeń istniejących generatorów (ROUNDING `to`, nowe warianty CALENDAR, MULT/DIV dla wielokrotności dziesiątek i setek, format liczb ≥ 1000). |
| Prerequisites S-02 | S-02 `done` (archiwum `2026-10-12-generators-e3-e4`), plus `testing-content-invariants` (rejestr parserów, wykonalność przy parsowaniu, `tests/contentInvariants.test.ts`). | Brak korekty; wykonalność z F11 już jest — nowe parsery muszą ją zachować. |
| Unknowns: — | Nieznane są: zachowanie progów niezmienników dla E1, format dużych liczb, granica „grupa 1” vs typy tekstowe spoza §7 (INEQUALITY, TIMES_MORE, ORDER_OPS, PRICE, UNIT_CHOICE, TIME_UNITS). | Zapisane jako pytania dla `/10x-research`. |

## Design binding

- Widoki kitu: **brak** — slice nie dotyka ekranu (generatory + dane + testy + skrypt). Brak DESIGN-GAP, `docs/design-gaps.md` nie powstaje.
- Spec, który wiąże: `docs/ZADANIA.md` §2 (zakresy E1, E2, E5, E6), §3 (kroki E1, E2, E5, E6), §4 (BONDS, CHAIN, MISSING_OP, COMPARE_EXPR, SEQUENCE, FACT_FAMILY, CHOOSE_OP oraz istniejące typy), §7 (grupa 1, model danych `Skill`/`Task`); `Martynka-urzadza.md` (model danych, reguły treści).
- Klucze tekstów (profil §6): `src/data/pl.ts` → `pl.tasks` (nowe polecenia nowych typów), `pl.words`; `src/data/wordTemplates.ts` (`templates`, `contexts`, `people`, `compareTemplates`; CHOOSE_OP i WORD E1–E2); `src/data/calendar.ts` (`weekdays`, `months`, `quarters`); `src/data/nouns.ts` (odmiana). Nowe dane etapów: `src/data/curriculum/E1.ts`, `E2.ts`, `E5.ts`, `E6.ts` + `index.ts`.

## Migration

Nie oczekuje się (profil §4: brak bazy; format zapisu i migracje przychodzą z S-11). `SkillDef`/`StageDef` w `src/core/types.ts` mogą się rozszerzyć, ale nic nie jest jeszcze zapisywane.

## Triggered follow-ups

Żaden plik `context/archive/*/follow-ups/review-fixes.md` nie ma linii `Trigger:` (format sprzed reguły). Wpisy, które w treści wskazują S-03:

| Follow-up | Źródło | Stan | Moja ocena zakresu |
|---|---|---|---|
| F11 — wykonalność kształt + `bridge` + `max` w `parseAddSubParams` | `2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` | Rozwiązany przez `testing-content-invariants` (enumeracja przy parsowaniu, `TypeError`). | Poza zakresem jako praca; w zakresie jako wymóg: 7 nowych parserów odrzuca niewykonalne parametry tak samo. |
| F12 — podpowiedź `DT−U` (70 − 9) i skośność składników w trybie bez kształtów | jw. | Otwarty; wskazany „S-17 albo razem z danymi E5–E6 (S-03)”. | **W zakresie**: E5.1 (53 − 7) i E6.6 (764 − 8, 450 − 70) używają tych samych rozbić; poprawność podpowiedzi nie jest łagodzona. Mała zmiana w `addSub.ts` z testem. Skośność: tylko jeśli dane E1/E2/E5 korzystają z trybu bez kształtów i niezmienniki ją pokażą. |
| F10 — `shape` dla ADD_SUB, osobne umiejętności + i − | `2026-10-12-generator-test-harness/follow-ups/review-fixes.md` | `shapes` zrealizowane w S-02; rozdzielenie + / − dla adaptacji wskazane na S-07. | Poza zakresem (S-07). |
| F14 — pierwsza podpowiedź MISSING zdradza wynik | `2026-10-12-generators-e3-e4/…` | Otwarty, wskazany na S-04. | Poza zakresem (S-04, ekran zadań). Nowe generatory nie powielają tego wzorca tam, gdzie to tanie (FACT_FAMILY, MISSING_OP). |
| F6 — nagłówki hardeningu Caddy | `2026-10-11-installable-offline-pwa/…` | Otwarty, `deploy/`. | Poza zakresem (run nie wysyła zmian w `deploy/`). |

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Odrzucone: `/10x-plan` (domyślne w skillu), `/10x-frame`. Dlaczego: roadmapa zakłada „te same generatory”, a w repo brakuje 7 typów grupy 1 i kilku rozszerzeń parametrów; trzeba zmierzyć przestrzenie zadań E1 wobec progów niezmienników i ustalić format dużych liczb, zanim plan podzieli fazy. Zmieniłoby to: gdyby wszystkie kroki nowych etapów dało się wyrazić istniejącymi generatorami — wtedy wprost `/10x-plan`. Krok narzuca też prompt orkiestratora.
2. **Jeden slice z 7 nowymi generatorami, bez dzielenia S-03.** Odrzucone: rozbicie na „nowe generatory” i „dane etapów” albo odsunięcie typów bez generatora (pusty krok). Dlaczego: FR-004 wymaga grupy 1 dla E1–E6 w M1, a `tests/curriculum.test.ts` nie przepuszcza kroku bez umiejętności dla typu grupy 1; nowe typy są tekstowe, małe i mają wzorzec w istniejących generatorach. Plan ma je rozłożyć na fazy (np. typy E1–E2, typy E5–E6, dane etapów, profil/CI). Zmieniłoby to: research wykazujący, że slice przekroczy rozsądny rozmiar (np. > 6 faz) — wtedy split w roadmapie przez `/10x-roadmap`.
3. **Grupa 1 = 18 typów z ZADANIA §7 plus typy już zaimplementowane (ROUNDING, HALF, COMPARE_DIFF).** Typy tekstowe spoza §7 (INEQUALITY, TIMES_MORE, ORDER_OPS, PRICE, UNIT_CHOICE, TIME_UNITS) i rysunkowe trafiają do `LATER`. Odrzucone: dodanie ich teraz. Dlaczego: §7 i FR-004 wyznaczają zakres M1; rozszerzenie to scope creep. Zmieniłoby to: research pokazujący krok E5/E6, którego wszystkie typy są poza grupą 1 i krok zostaje pusty — nadal dopuszczalne (jak E3.3), więc tylko notatka.
4. **F12 w zakresie, F10/F14/F6 poza.** Uzasadnienie w tabeli follow-upów. Zmieniłoby to: research pokazujący, że F12 wymaga przebudowy podpowiedzi ADD_SUB szerszej niż jeden przypadek — wtedy zostaje na S-17 z wpisem w follow-ups.
5. **Bez migracji i bez DESIGN-GAP.** Slice nie ma widoku ani zapisu. Zmieniłoby to: zmiana zapisywanego formatu (nie istnieje przed S-11) albo nowy tekst UI poza poleceniami zadań.
6. **`status: new`** zgodnie ze skillem `/10x-new` (przejścia robią kolejne skille).
