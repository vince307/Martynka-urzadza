# E1 z obrazkami: figury, szlaczki, „który z kolei” i płacenie monetami — Plan Brief

> Full plan: `context/changes/e1-shapes-picture-mode/plan.md`
> Research: `context/changes/e1-shapes-picture-mode/research.md`

## What & Why

Slice S-14d domyka zestaw typów E1–E2 (PRD FR-023, kryterium M6): sześciolatek dostaje zadania, które da się rozwiązać bez
czytania — figury na kafelkach, szlaczki, porównanie dwóch grup, „który z kolei”, wybór działania do obrazka — i płaci
monetami przeciąganiem do portfela. „Tryb z obrazkami” (design-gaps wiersz 21) wchodzi jako preferencja doboru rundy.

## Starting Point

E1.1 jest pusty, kafelki mają tylko tekst (narrator ich nie czyta), `dragMode` zna klocki i zegar, a helpery e2e traktują
każde inne `drag` jak klocki. Monety, ikony i `IconGroups` już są (S-14); figury umie rysować `CoordGrid` (S-13b).

## Desired End State

E1.1 grywalny (SHAPES, PATTERN, COMPARE_QTY), ORDINAL w E1.2, CHOOSE_OP z obrazkiem w E1.3, MONEY_PAY w E1.11 i E2.2 jako
trzecia gałąź `drag`; runda 6-latka jesienią (lub w łagodzeniu) bierze najpierw zadania z obrazkiem; dwa nowe spece e2e;
zapis nadal v2.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres | Bez SPATIAL, SYMMETRY, BONDS „połącz pary” (follow-upy) | Brak sceny w kicie; dwa nowe tryby odpowiedzi podwajają ryzyko e2e | Research / Plan |
| Kafelki | Kod twarzy `shape:<figura>:<kolor>:<rozmiar>` rysowany wspólnym helperem | Narrator nie czyta kafelków, 6-latek nie czyta nazw | Research |
| ORDINAL | Kafelki z liczbami, zakres 5 w E1.2 | `nouns.ts` nie ma rodzaju; krok E1.2 to „1–5” | Research / Plan |
| CHOOSE_OP z obrazkiem | Nowa umiejętność E1.3 (próg 2 → 3) | Osobne mastery dla obrazka i tekstu | Research |
| Tryb z obrazkami | Filtr kubłów w `buildAdaptiveRound`, tylko E1, wiek 6 wrzesień–styczeń lub `easedRounds > 0` | Zero stanu w zapisie, żadnego wymyślonego ekranu | Research |
| Reduktor drag | Generyczny `trayDrag` (klocki + monety), S13-09 naprawiony we wspólnym jądrze | ~72 % wspólnego kodu; e2e klocków w tej samej fazie | Research |
| Odpowiedź MONEY_PAY | `number[]` groszy + `check` (długość w wariancie „najmniej monet”) | Liczba nie wyraża liczby monet; równość zbiorów błędna | Research (odwraca change.md decyzję 6) |
| Taca | E1.11 1/2/5 zł, E2.2 + 10 zł; ≤ 4 rodzaje, 2 × 2 przy 4 | Cele dotyku ≥ 96 px | Plan |
| Bezpieczeństwo e2e | `dragMode` w haku + wyczerpujący `switch` + `payCoins` w tej samej fazie co dane MONEY_PAY | ~13 nieprzypiętych speców może wylosować monety | Kontrakt runu |
| Zapis | v2, bez nowych pól | Kontrakt runu | Kontrakt |

## Scope

**In scope:** SHAPES, PATTERN, COMPARE_QTY (E1.1); ORDINAL (E1.2); CHOOSE_OP z obrazkiem (E1.3); MONEY_PAY (E1.11, E2.2);
tryb z obrazkami; O4 (`count_5` `min: 2`); naprawa „kupił jeszcze 2 złote”; start kalendarza E1 i progi; spece
`picture-tasks`, `money-pay`.

**Out of scope:** SPATIAL, SYMMETRY, BONDS „połącz pary”, ORDINAL „dotknij czwartego” i słownie, oś-podpowiedź E1, E1.10
`place_read_12`, grafika portfela, ekran trybu z obrazkami, zapis v3.

## Architecture / Approach

Czysty `core`: kod twarzy (`faces.ts`), nowe rysunki `pattern` i `row`, `icons.motion`, `money.pay`; generatory
`(skill, rng) => Task`; `trayDrag.ts` generyczny nad rodzajem, `blockDrag.ts` jako instancja, `coins.ts` (portfel,
`fewestCoins`); `dragMode` → `'coins'`; `pictureMode` + `hasPicture` + filtr obok `withoutArtBlocked`. Widżety: helper
`faceDraw`, `PatternRow`, `IconRow`, strzałka w `IconGroups`, `CoinWallet`. `TaskScene` przełącza się na `dragKind` (`switch` z
`never`), hak e2e wystawia `dragMode`/`wallet`, helpery przełączają się wyczerpująco.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Twarze, SHAPES, PATTERN (tdd) | Generatory i walidacja twarzy | Jednoznaczność intruza i szlaczka |
| 2. Figury na kafelkach, E1.1 (impl) | `faceDraw`, `PatternRow`, dane, start kalendarza | Testy przypięte do E1 |
| 3. COMPARE_QTY, ORDINAL, CHOOSE_OP obraz (tdd) | Generatory, `row`, `motion`, filtr „złotych” | Odmiana po „więcej” |
| 4. Rząd ikon, dane E1.1–E1.3, O4 (impl) | `IconRow`, strzałka, progi | Wolniejsze odblokowanie E1.2/E1.3 |
| 5. Tryb z obrazkami (tdd) | Filtr doboru rundy | Tabela `hasPicture` rozjechana z danymi |
| 6. `trayDrag`, S13-09, taca monet (tdd) | Wspólny reduktor, geometria | Regresja klocków (e2e w fazie) |
| 7. MONEY_PAY w core (tdd) | Generator, `coins`, `check` | Duplikaty monet w `isCorrect` |
| 8. Portfel, hak, helpery, dane (impl) | MONEY_PAY osiągalny i odpowiadalny w e2e | Rozmiar fazy (p8a/p8b) |
| 9. Seam sweep, dokumenty (impl) | Follow-upy, design-gaps 100–104, CLAUDE.md | — |
| 10. e2e obrazki (#11) | `picture-tasks.spec` | Cel dotyku kafelka z figurą |
| 11. e2e monety (#11) | `money-pay.spec` | Gest w skali FIT |

**Prerequisites:** S-14, S-14c na `main` (`10d6fe7`); research zrobiony; E2E włączone (profil § 11).
**Estimated effort:** 11 faz, każda jedna sesja agenta; e2e uruchamia orkiestrator.

## Open Risks & Assumptions

- `[human]` 9.7: decyzje wbrew ZADANIA/roadmapie (zakres, ORDINAL, 10 zł w E1, tryb tylko E1, progi, start wrześniowy).
- `[human]` 9.6: test na tablecie z palcem 6-latka (monety, figury).
- Figury `small` mogą być za małe na 1024 px — zrzuty fazy 2.

## Success Criteria (Summary)

- 6-latek gra E1.1–E1.3 i płaci monetami samym dotykiem, z podpowiedzią i drugą próbą.
- Żaden istniejący spec nie zawiesza się na zadaniu z monetami; pełny e2e `+ 7`.
- `sample` E1/E2 czyste po odczycie nauczyciela; zapis v2, fixture'y bez zmian.
