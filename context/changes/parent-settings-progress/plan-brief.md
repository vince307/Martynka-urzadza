# Ustawienia rodzica: zmiana etapu, auto-czytanie i podgląd postępów — Plan Brief

> Full plan: `context/changes/parent-settings-progress/plan.md`
> Research: `context/changes/parent-settings-progress/research.md`

## What & Why

Roadmapa S-08 zamyka M3 (PRD FR-015, US-03, Access Control, FR-009). Rodzic potrzebuje ukrytego miejsca, do którego
dziecko nie trafi przypadkiem: tam zmienia etap (zmiana działa od razu), włącza lub wyłącza automatyczne czytanie
poleceń i widzi zwięzły podgląd postępów, czyli bieżący krok i 3 najsłabsze umiejętności z przykładami błędów.

## Starting Point

Bramka dla dorosłego i panel etapu z S-06 działają tylko na powitaniu. Adaptacja S-07 prowadzi opanowanie i historię
odpowiedzi, ale historia nie zawiera treści zadania ani złej odpowiedzi. Auto-czytanie to pole sceny liczone z etapu.
HUD nie ma ikony ustawień, a nic nie rozpoznaje przytrzymania. Pod dialogami DOM wyłączane jest wejście tylko jednej sceny.

## Desired End State

W prawym dolnym rogu HUD, poza notesem, jest mała ikona. Przytrzymanie jej przez 2 s (zjechanie palcem do 30 px gry
nie przerywa) otwiera bramkę S-06, a po niej panel „Ustawienia rodzica”. Panel ma przyciski etapów, przełącznik
auto-czytania i podgląd postępów: „Krok N z M: tytuł” oraz do 3 umiejętności z opanowaniem i przykładami błędów. Gdy
nie ma jeszcze błędów, pokazuje stan pusty. „Zatwierdź” od razu zastępuje otwartą rundę świeżą rundą nowego etapu, a
licznik gwiazdek się nie zmienia. Pod dialogami gra nie dostaje żadnego dotyku. Wszystko trwa do końca sesji (zapis
przychodzi w S-11).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Gest | 2000 ms, tolerancja 30 px gry, bez informacji zwrotnej; czysta maszyna w `core` z czasem z `update` | Dłużej niż zwykłe przytrzymanie dziecka (US-03 AC); pasek postępu kusiłby dziecko | Research / Plan |
| Miejsce ikony | HUD (`UIScene`), x 1782–1878, y 952–1048, nie na powitaniu | Jedyna scena nad zadaniem i pokojem; na powitaniu jest już „Rodzic” | Change / Research |
| Wejście pod dialogami | Globalne `game.input.enabled` z licznikiem; też powitanie i podpowiedź instalacji | Obejmuje śpiącą scenę i nakładki DOM; przy okazji zamyka przeciek stuknięć przez podpowiedź instalacji (S-06) | Research / Orchestrator |
| Zmiana etapu | Od razu, świeża runda, gwiazdki zostają, przerwana runda nie liczy się do opanowania, `pendingUnlock` czyszczone | US-03 Then; `scene.restart` skasowałby gwiazdki | Change / Research |
| Auto-czytanie | `Settings.autoRead: boolean \| null`, null = domyślna etapu; wybór rodzica trwa przy zmianie etapu | Jedno pole dla S-11; rodzic ustawia dziecko, nie etap | Research / Orchestrator |
| Przykład błędu | Pierwsza zła odpowiedź + polecenie + poprawna, tylko przy błędzie w pierwszej próbie | Rodzic widzi konkretny błąd, który sam objaśnia umiejętność | Change / Research |
| Najsłabsze | Bieżący etap, ≥ 1 błąd w pierwszej próbie; opanowanie ↑, błędy ↓, nowszy błąd, kolejność programu | Opanowanie 0 nie odróżnia „nie grane” od „grane dobrze” | Research |
| Nazwa umiejętności | Tytuł kroku + opanowanie + przykłady | Bez 82 nowych etykiet do teacher read | Research / Orchestrator |
| Panel | Zmiany zbiorczo „Zatwierdź”/„Anuluj”; DOM na `openDialog`, wspólna grupa etapów | Rodzic może obejrzeć podgląd bez skutków | Plan |
| Testy DOM | Bez happy-dom; logika w `core`, panel tylko renderuje, e2e pokrywa DOM | Wzorzec S-06 | Research |

## Scope

**In scope:**
- Ikona, przytrzymanie i bramka nad zadaniem i pokojem.
- Panel z etapem, auto-czytaniem i podglądem.
- Zmiana etapu w miejscu.
- `firstWrong` i przykłady w historii.
- Globalne wstrzymanie wejścia (z podpowiedzią instalacji i `contextmenu`).
- Deduplikacja helperów e2e.
- Spec e2e `#14 (proposed)` × 3.
- DESIGN-GAP 25–28 i follow-upy.

**Out of scope:**
- Zapis (S-11).
- Eksport, import i reset (S-12).
- Pełna tabela opanowania.
- Etykiety umiejętności w danych.
- Zapis częściowej rundy.
- Edycja test-planu.
- E2E w CI.

## Architecture / Approach

`core` dostaje czyste funkcje, każdą z testami:
- `longPress` i `createInputSuspender`;
- `effectiveAutoRead` i `changeStageByParent`;
- `firstWrong` w `RoundState`, `roundResults` i `example` w `recordRound`;
- `progressView` (oraz eksportowany `currentStep`).

Rejestr jest magistralą sesji: `learner` i nowe `settings`. `UIScene` ma ikonę i otwiera dialogi DOM (bramka, a po niej
`settingsPanel` z `stageChoices` i `progressView`). Po „Zatwierdź” zapisuje ucznia i ustawienia, a potem emituje
`GAME_EVENTS.parentStage`. `TaskScene` w odpowiedzi woła `applyParentStage`; jeśli śpi, robi to przy `wake`.
Auto-czytanie liczy w chwili użycia.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Helpery e2e (impl) | Kopie w `support/`, 15 speców bez zmian asercji | Ukryta różnica zachowania (`tapNext` vs `tapTarget`) |
| 2. Przytrzymanie + licznik (tdd) | `longPress`, `createInputSuspender`, `balance.parentSettings` | Drugi palec / jednokrotne `fire` |
| 3. Ustawienia i etap (tdd) | `effectiveAutoRead`, `changeStageByParent`, `Settings.autoRead \| null` | — |
| 4. Przykłady błędów (tdd) | `firstWrong`, `roundResults`, `example` w historii | Typ wartości z kafelka vs klawiatury |
| 5. Podgląd (tdd) | `progressView`, `currentStep` eksportowany | Ranking przy remisach |
| 6. Sklejka scen (impl) | Wstrzymanie wejścia, getter auto-czytania, `applyParentStage`, hak | Gwiazdki przy zmianie etapu |
| 7. Ikona + panel (impl) | `SettingsIcon`, `settingsPanel`, `stageChoices` | Kolizja ikony z HUD/pokojem |
| 8. Podgląd w panelu (impl) | `progressView` DOM + stan pusty | Panel przy 1024×768 |
| 9. Seam sweep (impl) | DESIGN-GAP 25–28, follow-upy, `CLAUDE.md`, wiersze `[human]` | — |
| 10. E2E gest (e2e #14) | Tylko 2 s otwierają bramkę; dotyk pod dialogiem nie trafia do gry | Chromium w sesji agenta |
| 11. E2E przepływ (e2e #14) | Zmiana etapu, auto-czytanie, podgląd po błędzie | Czas testu |

**Prerequisites:** S-06 i S-07 są `done` (na `main` @ `bfbd18a`), a gałąź `feat/parent-settings-progress` istnieje.
Baseline: unit 881, e2e 15.

**Estimated effort:** 11 faz, każda dla jednego świeżego agenta. Fazy UI mają najwyżej 2 nowe komponenty.

## Open Risks & Assumptions

- Do S-11 wszystko jest sesyjne: po zimnym starcie podgląd jest pusty, a wybory rodzica znikają (wiersz `[human]` 9.6).
- Przytrzymanie na iPadzie i Androidzie (lupa, `contextmenu`, kalibracja progu) sprawdzi tylko urządzenie (wiersz 9.7).
- Odstępstwa od dosłownego PRD zbiera wiersz `[human]` 9.8:
  - przerwana runda nie liczy się do opanowania;
  - „3 najsłabsze” tylko spośród umiejętności z błędami;
  - nazwa umiejętności to tytuł kroku;
  - podgląd tylko z bieżącego etapu;
  - ikona w HUD.
- Agent może nie uruchomić Chromium w swojej sesji. Wtedy fazy 10–11 przekazują e2e orkiestratorowi z patchami przerw.

## Success Criteria (Summary)

- Dziecko nie otwiera ustawień stuknięciem, krótkim przytrzymaniem ani przesuwaniem palca. Stuknięcie pod dialogiem nie
  trafia do rundy.
- Rodzic zmienia E3 na E4: następna runda jest od razu z E4, a gwiazdki zostają. Wybór auto-czytania trwa.
- Po błędzie w pierwszej próbie podgląd pokazuje tę umiejętność, jej opanowanie i przykład z odpowiedzią dziecka.
