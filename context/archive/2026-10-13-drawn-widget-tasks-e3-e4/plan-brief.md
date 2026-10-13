# Zadania z rysunkami w kodzie dla E3–E4 i tryby `select`/`drag` — Plan Brief

> Full plan: `context/changes/drawn-widget-tasks-e3-e4/plan.md`
> Research: `context/changes/drawn-widget-tasks-e3-e4/research.md`

## What & Why

Roadmapa S-13 (M6): córka (E3) ma zobaczyć nowe typy zadań, zanim powstaną wszystkie. Dziecko rozwiązuje w rundzie zadania
z zegarem, linijką, klockami dziesiątkowymi i diagramem słupkowym narysowanymi w kodzie, odpowiada dotykiem — także
zaznaczaniem kilku kafelków (`select`) i przeciąganiem klocków (`drag`).

## Starting Point

`Task.visual` istnieje jako `unknown` i nic go nie czyta; tryb odpowiedzi wynika z `task.choices`; `playable` wpuszcza tylko
`tiles`/`keypad`; kroki E3.3, E3.4, E3.5, E4.3, E4.7 są puste; dwie umiejętności `select` (E1.6, E3.7) czekają na UI.
21 generatorów grupy 1, żadnego rysunku na ekranie zadania.

## Desired End State

Zadania CLOCK (E3.3, E3.11, E4.3), LENGTH (E3.5, E4.7), PLACE_VALUE (E3.6, E4.1, E4.8; budowa z klocków E3.6, E4.1) i DATA
(E3.4) losują się w rundach z rysunkiem; podpowiedź i kroki rozwiązania stoją obok rysunku. `select` i `drag` działają
dotykiem, przerwany dotyk nigdy nie kładzie klocka. Zapis zostaje v1.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres slice'a | S-13 bez siatki (PUZZLE_GRID, GRID, PERIMETER) i „ustaw zegar” → nowe S-13b | Siatka to osobna rodzina widżetów; z nią > 9 faz | Research / Plan |
| `drag` w S-13 | Tak (fazy 8–9), tylko PLACE_VALUE „zbuduj” do 99 | Zakres mieści się w planie (po plan-review 11 mniejszych faz), warunek przeniesienia nie zachodzi | Research / Plan |
| Model rysunku | Unia `TaskVisual` (`clock`, `ruler`, `blocks`, `bars`) + `visualKey` w kluczu unikalności | Stały prompt „Która godzina?” nie może być duplikatem | Research |
| Tryb odpowiedzi | `Task.input` stemplowany w `generateTask` ze `skill.answer` | `roundView` dziś zgaduje z `choices` | Research |
| Kroki rozwiązania przy rysunku | Obok rysunku (kafelki: rysunek w lewo, linie w prawo; klawiatura: rysunek mniejszy u góry, linie pod nim) | Dziecko widzi to, co liczy | Plan |
| DATA | Słupki 3–4, wartości 1–10, bez remisów, etykiety z `src/data/charts.ts` | Katalog bez zakresu; oś 0–10 czytelna | Plan |
| CLOCK | 3 kafelki z zapisem „15.00”/„7.30” (ZADANIA), wbrew podpisowi kitu „3:30” | Zapis szkolny; klawiatura nie ma kropki | Research / Plan |
| Gest `drag` | Własny reduktor w `core`; stuknięcie też dokłada/zdejmuje klocek | Drag Phasera liczy anulowanie jako upuszczenie; 7-latki na szkle | Research / Plan |
| Szew e2e | `?e2eSkills` (hak, marker), klucz rejestru `forcedSkills` | Deterministyczny spec `select`/`drag` | Plan |
| Podpowiedź na rysunku | Nie (tylko tekst), follow-up | Bez wymogu katalogu | Plan |
| Zapis | v1 bez zmian; podgląd rodzica bez rysunku | Jednokierunkowe drzwi | Research |

## Scope

**In scope:** model rysunku i trybu; 4 generatory (CLOCK, LENGTH, PLACE_VALUE, DATA); widżety `ClockFace`, `Ruler`,
`BaseTenBlocks`, `BarChart`, `SelectTiles`, `BlockMat`; nowe umiejętności i `childName` w E3/E4; tryby `select` i `drag`;
helpery e2e; spec `drawn-tasks`; DESIGN-GAP 52–58; S-13b w roadmapie.

**Out of scope:** siatka, obwód, „ustaw zegar” (S-13b); oś liczbowa, słupek pisemny, grafy, figury, grupa 3 (S-14);
podświetlanie na rysunku; zmiana zapisu; setki i regrupowanie na macie.

## Architecture / Approach

Czysty `core`: `TaskVisual` + `visualKey` + `validateVisual` → generatory → `generateTask` (stempel trybu) → `roundView`
(`input`, `visual`) → `TaskScene` rysuje `TaskPicture` w prostokącie z `pictureLayout`. `select` = czysty stan zaznaczenia +
`SelectTiles`; `drag` = reduktor `blockDrag` na surowych zdarzeniach + `BlockMat`. `playable` dopuszcza tryb dopiero razem z
helperami e2e (sześć speców losuje E3).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Model rysunku (tdd) | `TaskVisual`, `Task.input`, unikalność, `sample` | Zmiana typu `RoundView.input` w scenie |
| 2. CLOCK + LENGTH (tdd) | Generatory z parserami i 1000 losowań | Przejście przez 12, wycieki tekstowe |
| 3. PLACE_VALUE + DATA (tdd) | Generatory odczytu, budowy, diagramu | Remisy, odmiana etykiet |
| 4. Rysunek w scenie + `ClockFace` + `Ruler` (impl) | Pierwsze rysunki, linie obok rysunku | Miejsce na linie rozwiązania |
| 5. `BaseTenBlocks` + `BarChart` (impl) | Wszystkie rysunki odczytu | Zawijanie klocków w prostokącie |
| 6. Dane E3/E4 (impl) | 5 nowych kroków grywalnych | Testy i e2e przypięte do kolejności |
| 7. Tryb `select` (impl) | E1.6, E3.7 w rundach; szew `?e2eSkills` | Helpery e2e przed `playable` |
| 8. Reduktor `blockDrag` (tdd) | Gest w `core` | Anulowanie ≠ upuszczenie |
| 9. Tryb `drag` (impl) | Budowa liczby z klocków | Odczucie na tablecie |
| 10. Dokumentacja + seam sweep (impl) | Follow-upy, `CLAUDE.md`, DESIGN-GAP | Follow-upy z triggerem plikowym |
| 11. E2E #11 (e2e) | `drawn-tasks.spec.ts` (+5) | Chromium w sesji agenta |

**Prerequisites:** S-12 done (`b57433c`); baseline unit 1247, e2e 37.
**Estimated effort:** 11 sesji agenta (jedna na fazę) + odczyt nauczyciela + bramka wizualna.

## Open Risks & Assumptions

- Pula „wcześniejsze” od razu dostaje zegar/diagram/linijkę dla dziecka na E3 ≥ 6 (akceptowane, łatwe zadania).
- E3.5 i E4.7 częściowe do S-13b/S-14 (próg odblokowania zmieni się później).
- Przeciąganie na prawdziwym tablecie — tylko `[human]` 9.8.
- `[human]`: zapis czasu wbrew kitowi (4.6), zakres wbrew roadmapie (6.9), decyzje wbrew ZADANIA (10.6, w tym kierunek 24-godzinny i budowa bez setek), teksty (10.7).

## Success Criteria (Summary)

- Runda E3 z zegarem, diagramem, linijką, klockami, `select` i `drag` gra się dotykiem do podsumowania (e2e (e)).
- `npm run sample -- E3/E4 --count 6` bez naruszeń, odczyt nauczyciela zaakceptowany.
- Pełna bramka zielona w każdej fazie; e2e baseline + 5; zapis v1 nietknięty.
