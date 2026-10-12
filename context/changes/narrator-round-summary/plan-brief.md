# Lektor poleceń i podsumowanie rundy — Plan Brief

> Full plan: `context/changes/narrator-round-summary/plan.md`
> Research: `context/changes/narrator-round-summary/research.md`

## What & Why

S-05 zamyka etap M2: dziecko może odsłuchać polecenie polskim lektorem (FR-009), a po rundzie widzi podsumowanie
z gwiazdkami i wybiera „Kolejna runda” albo „Do pokoju” (FR-010). Słabiej czytające dziecko nie utknie na poleceniu,
a koniec rundy staje się punktem wyboru zamiast automatycznej kolejnej rundy.

## Starting Point

S-04 dał rundę dotykiem (`src/core/round.ts`, `roundView`, `TaskScene`, `UIScene` z licznikiem, hak e2e w osobnym
buildzie). Koniec rundy to dziś zielony pasek „Runda bez błędu! +2 ★” i „Dalej” (DESIGN-GAP 5). Nie ma mowy, sceny
pokoju ani przełącznika w HUD; `Task.speak` ma tylko MISSING, z surowymi symbolami.

## Desired End State

Głośnik w HUD (tylko z polskim głosem) czyta polecenie słownie („Oblicz. trzydzieści osiem plus dwadzieścia siedem”),
w drugiej próbie podpowiedź; E1–E2 czytają nowe zadania same. Po rundzie: „Brawo!”, rząd 5 gwiazdek, „★ +N”, linia
bonusu, „Kolejna runda” i „Do pokoju” → pusta scena pokoju z licznikiem i „Wróć do notesu”. Między zadaniami w HUD
jest „Do pokoju”. E2E #11 kończy się na podsumowaniu i pokoju; lektor ma spec na atrapie syntezatora.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Gdzie mowa | reguły w `src/core/narration/`, lektor w `src/ui/narrator.ts` nad wstrzykniętym `speechSynthesis` | granica ESLint i testy na atrapie bez prawdziwych głosów | Research / Plan |
| Gest | mowa w `pointerup`, jednorazowe odblokowanie na pierwszym DOM `touchend` | dotykowy `pointerdown` (Phaser w `touchstart`) nie daje aktywacji | Research |
| `□` w mowie | „okienko”; porównania i brakujący znak dostają pytanie w `speak` | jedna reguła, sens nadaje pytanie z generatora | Plan |
| Cyfry rzymskie | literowane w `speak` (ROMAN, CALENDAR) | syntezator przeczytałby wynik | Research |
| Liczby | słownie w działaniach ≤ 1000, w zdaniach cyfry | `numberToWords` do 1000; rodzaj liczebnika nieznany | Research / Plan |
| Powrót z pokoju | na ekran, z którego dziecko wyszło (kit) | jedna ścieżka `scene.switch`; wbrew `change.md` decyzja 3 → `[human]` | Plan |
| „+N” i bonus | „+N” z bonusem, osobna linia bonusu, rząd gwiazdek = zadania z gwiazdką | dziecko widzi, za co dostało +2 | Plan |
| Wyróżnienie „Do pokoju” | reguła teraz, koszt `null` do S-09 | brak danych zadań remontowych → `[human]` | change.md |
| `autoRead` | domyślne od etapu, w sesji, bez przełącznika | ekran rodzica to S-08 → `[human]` | change.md |
| Podsumowanie | warstwa w `TaskScene` | `RoundState.finished` już jest tym stanem | Plan |
| Przełącznik HUD | ostatnia faza kodu, odcinalna | FR-011 + follow-up S-04, tanio skoro pokój istnieje | change.md / orkiestrator |

## Scope

**In scope:** `speak` 5 ścieżek generatorów, tekst mówiony rundy, wybór głosu i moduł lektora, głośnik w HUD,
podsumowanie, pusta scena pokoju, przełącznik HUD, rozszerzenie haka (ekran, rysowany licznik), e2e #11 i lektora,
DESIGN-GAP-y, follow-upy.

**Out of scope:** przełącznik rodzica i zapis `autoRead` (S-08/S-11), koszty i prawdziwy pokój (S-09/S-16), liczby
> 1000 słownie, liczebniki w zdaniach, `pl.title` (S-06), kropki kroków, edycja test-planu.

## Architecture / Approach

`core` liczy tekst mówiony (`spokenText`, `narrationOf`), głos (`pickPolishVoice`), domyślne `autoRead` i widok
podsumowania (`summaryView`). `main.ts` tworzy jeden lektor i kładzie go w rejestrze. `TaskScene` publikuje
`narration` i widoczność przełącznika w rejestrze; `UIScene` (teraz z wejściem) rysuje głośnik i przełącznik i woła
lektora. `TaskScene` ⇄ `RoomScene` przez `scene.switch` (uśpiona scena zachowuje rundę); `UIScene` na górze.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. `speak` w generatorach (tdd) | pytania o znak, literowane cyfry rzymskie | mowa zdradza wynik (teacher read) |
| 2. Tekst mówiony rundy (tdd) | `spokenText`, `narrationOf`, `czyta:` w sample | `:` w zdaniach czytany jako dzielenie |
| 3. Głos i moduł lektora (tdd) | `pickPolishVoice`, `createNarrator` na atrapie | puste `getVoices()`, `pl_PL` |
| 4. Model podsumowania (tdd) | `summaryView`, `switchVisible` | — |
| 5. Głośnik w HUD (impl) | `SpeakerButton`, lektor w grze | `UIScene` z wejściem zabiera dotyk |
| 6. Podsumowanie (impl) | `PageButton`, `SummaryPanel`, koniec `roundEnd` | — |
| 7. Pokój (impl) | `RoomScene`, powrót | kolejność scen (licznik nad pokojem) |
| 8. Hak e2e (impl) | ekran, `counterText`, podsumowanie, głośnik | wyciek haka do produkcji (strażnik) |
| 9. Przełącznik HUD (impl, odcinalna) | `RoomSwitchButton` | — |
| 10. Seam sweep (impl) | luki, follow-upy, dokumentacja, `[human]` | — |
| 11. E2E #11 (e2e) | podsumowanie i pokój dotykiem | — |
| 12. E2E lektora (e2e) | głośnik → syntezator, brak głosu | — |

**Prerequisites:** S-04 na `main` (jest, PR #20); build z hakiem i projekt `chromium-hook`.
**Estimated effort:** 12 faz, każda dla jednego świeżego agenta.

## Open Risks & Assumptions

- iOS: czy jeden gest odblokowuje mowę na sesję (auto-czytanie po „Dalej”) — `[human]`.
- Jakość polskiego głosu na tabletach (PRD OQ 7) — przepływ działa bez głosu.
- Pierwsze zadanie po zimnym starcie nie jest czytane automatycznie.

## Success Criteria (Summary)

- Dziecko z polskim głosem słyszy polecenie bez symboli i bez zdradzonego wyniku; bez głosu nie widzi głośnika i gra dalej.
- Po rundzie wybiera „Kolejna runda” albo „Do pokoju” i wraca z pokoju tam, skąd wyszło, z tą samą liczbą gwiazdek.
- Bramka lokalna zielona; hak nieobecny w produkcji.
