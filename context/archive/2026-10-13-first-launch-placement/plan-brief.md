# Pierwsze uruchomienie: wiek, etap, bramka rodzica i rozgrzewka — Plan Brief

> Full plan: `context/changes/first-launch-placement/plan.md`
> Research: `context/changes/first-launch-placement/research.md`

## What & Why

S-06 (FR-012, otwiera M3): gra przestaje grać stałego E3. Na zimnym starcie dziecko stuka wiek, gra bierze etap z
tabeli wiek × miesiąc (`docs/ZADANIA.md` §1), a rozgrzewka 6 zadań może go po cichu obniżyć o jeden. Rodzic może,
ale nie musi, przejść bramkę i potwierdzić albo zmienić etap. Każdy slice idzie na produkcję, a zapis przychodzi
dopiero w S-11, więc dziecko musi móc zagrać bez dorosłego.

## Starting Point

`BootScene` od razu startuje `TaskScene`, a ta czyta `balance.defaultStage` ('E3'). Nie ma powitania, placementu, bramki
ani trwałości. Runda (`startRound`, `buildRound`, `pickSkills`) i hak e2e tylko do odczytu już są (S-04, S-05).

## Desired End State

Powitanie z kitu („Ile masz lat?”, 6–10, „Rodzic”). Stuknięcie wieku → rozgrzewka (gdy etap > E1) → zwykłe rundy na
etapie po korekcie. „Rodzic” → bramka 13–19 × 13–19 (klawiatura cyfr DOM, zła odpowiedź = nowe działanie) → panel
wiek + etap → inny etap gra od razu bez rozgrzewki. Dotyk w bramkę nie wciska niczego pod spodem. Etap żyje w uczniu
sesji w rejestrze (szew dla S-07, S-08, S-11).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Kto startuje grę | Dziecko samo na etapie z wieku; rodzic opcjonalnie przez „Rodzic” | Produkcja po każdym slice, zapis dopiero w S-11; bramka jako warunek odcięłaby dziecko (`[human]`, wbrew dosłownemu FR-012) | Orchestrator |
| PRD Open Question 1 | Inny etap od rodzica ⇒ bez rozgrzewki; potwierdzenie/ścieżka dziecka ⇒ rozgrzewka | Ustawienie rodzica ma pierwszeństwo, a rozgrzewka dalej działa | Research / change.md |
| Skład i próg rozgrzewki | 3 z poprzedniego etapu + 3 z pierwszych 2 grywalnych kroków; < 4 z 6 pierwszych prób → −1 | Bez fałszywych błędów z nieprzerobionych kroków; tylko w dół o jeden | Research → Plan |
| Panel rodzica | Wiek + etap w jednym panelu DOM | Ścieżka rodzica sama realizuje FR-012 (wiek → propozycja → potwierdź/zmień) | Plan |
| Bramka | 13–19 × 13–19, klawiatura cyfr w DOM | Poza zasięgiem E6 nawet celowo; bez klawiatury systemowej iPada | Research → Plan |
| Dotyk pod nakładką | `WelcomeScene.input.enabled = false`, póki bramka otwarta | Phaser przekazuje dotyk z DOM do obiektów gry | Research |
| Auto-czytanie | Pierwsze zadanie po powitaniu czytane, gdy `autoRead` (E1–E2) | Stuknięcie wieku w canvas jest gestem | Plan |
| Helper e2e | Faza 4: ścieżka dziecka (`?e2eMonth=9` w buildzie e2e, wiek 8 → E3); faza 6: ścieżka rodzica (wiek 10, wybór E3) | Każda faza zielona w całej bramce, także e2e | Plan |

## Scope

**In scope:** tabela wiek × miesiąc, uczeń sesji, rozgrzewka i korekta, bramka i panel w DOM, `WelcomeScene`,
usunięcie `balance.defaultStage`, rozszerzenie haka, wspólny helper e2e, nowy spec #12 (proposed), tokeny gołych liczb
(follow-up S-05), luki projektu i follow-upy.

**Out of scope:** zapis (S-11), ustawienia rodzica w grze (S-08), wagi/opanowanie (S-07), tryb z obrazkami (S-14),
sztuka powitania (S-16), edycja test-planu, przepuszczanie dotyku przez `installHint`.

## Architecture / Approach

Czysta logika w `src/core/placement.ts`, `src/core/round/warmup.ts`, `src/core/parentGate.ts`; dane w
`src/data/placement.ts` i `balance.ts`. `BootScene` → `needsPlacement` → `WelcomeScene` (canvas: wiek, „Rodzic”) →
nakładki DOM `src/ui/dom/parentGate.ts` i `stagePanel.ts` → uczeń w `REGISTRY_KEYS.learner` → `TaskScene` (rozgrzewka
w tej samej scenie, korekta przy końcu rundy).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Placement (tdd) | Tabela + uczeń sesji | Granice pasm przez zmianę roku |
| 2. Rozgrzewka (tdd) | Skład 3 + 3 i korekta −1 | Puste pierwsze kroki etapów |
| 3. Bramka (tdd) | Działanie, sprawdzenie, cyfry | Trudność dla dziecka vs dorosłego |
| 4. Powitanie (impl) | `WelcomeScene`, `AgeButton`, szew, hak, helper | Specy e2e utkną na powitaniu |
| 5. Bramka i panel DOM (impl) | `parentGate`, `stagePanel`, „Rodzic” | Dotyk przechodzi pod nakładkę |
| 6. Rozgrzewka w scenie (impl) | 6 zadań, cicha korekta, auto-czytanie | Korekta pominięta przy „Do pokoju” |
| 7. Seam sweep (impl) | Luki, follow-upy, tokeny, docs, `[human]` | — |
| 8. E2E dziecko (e2e) | #12 (proposed): wiek → rozgrzewka → korekta | Zależność od daty (`?e2eMonth`, nie `page.clock` — zamroziłby tweeny) |
| 9. E2E rodzic (e2e) | #12 (proposed): bramka, panel, brak przebicia | Odpowiedź bramki z DOM, nie z haka |

**Prerequisites:** S-05 done (jest); baseline `main` @ `37a9a62`: unit 671, e2e 8.
**Estimated effort:** 9 faz, każda dla jednego świeżego agenta; fazy 4–6 największe.

## Open Risks & Assumptions

- 7-latka z klasy 2 dostaje w październiku E1 na ścieżce dziecka przy każdym zimnym starcie do S-11 (`[human]`).
- Auto-czytanie po stuknięciu wieku na iPadzie niepotwierdzone (`[human]`).
- Bramka do policzenia na kartce przez zdeterminowane dziecko E6 — zakres w balansie, playtest S-17.

## Success Criteria (Summary)

- Dziecko bez dorosłego dochodzi od zimnego startu do rundy jednym stuknięciem wieku.
- Rodzic przez bramkę ustawia etap, który naprawdę gra, bez rozgrzewki przy zmianie.
- Rozgrzewka obniża etap najwyżej o jeden, nigdy nie podnosi; dowody w unit i e2e.
