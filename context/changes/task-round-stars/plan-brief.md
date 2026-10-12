# Runda zadań dotykiem z gwiazdkami — Plan Brief

> Full plan: `context/changes/task-round-stars/plan.md`
> Research: `context/changes/task-round-stars/research.md`

## What & Why

S-04: pierwsza scena z wejściem gracza. Dziecko gra rundę 5 zadań dotykiem (kafelki albo klawiaturka), dostaje
gwiazdkę za każde poprawne zadanie (także w drugiej próbie) i +2 za rundę bez błędu; błąd daje potrząśnięcie,
podpowiedź i drugą próbę, drugi błąd — rozwiązanie krok po kroku i przepisanie wyniku bez gwiazdki. To pierwsza rzecz,
w którą córka zagra, więc placeholdery muszą być czytelne, a logika nie może zdradzać wyniku w pierwszej podpowiedzi.

## Starting Point

21 generatorów i dane E1–E6 istnieją (S-03); gra rysuje tylko `BootScene` z placeholderem, `src/ui/widgets/` jest pusty,
nie ma `balance.ts`, sekcji `pl.round` ani czcionki. Pierwsza linia podpowiedzi zdradza wynik w wielu typach (zmierzone).
E2E ma tylko seed #8 na buildzie produkcyjnym (port 4398).

## Desired End State

Gra startuje w rundzie E3: zeszyt, polecenie czcionką Atkinson ≥ 64 px, kropki postępu, kafelki/klawiaturka, licznik
„★ N” w równoległej scenie UI. Wszystkie stany (podpowiedź, druga próba, kroki, przepisanie, „Brawo! +1 ★”, koniec
rundy z bonusem) działają bez kar. E1 odpowiada na 4 kafelkach. `npx playwright test` sprawdza seed #8 na produkcji
i rundę dotykiem (#11) na osobnym buildzie z hakiem; `npm run build` pada, jeśli hak trafi do produkcji.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
|---|---|---|---|
| Logika rundy | Czysty reduktor w `core` (`first → second → solution → retype → done`), TDD | Sceny tylko renderują; reguły gwiazdek testowalne właściwościami | Research |
| Pierwsza podpowiedź | `hint[0]` tylko przy ≥ 2 liniach i linii 0 bez wyniku; ROUNDING wyjęty; inaczej „Spróbuj jeszcze raz” | Maska ogólna zmierzona jako niebezpieczna; pełne podpowiedzi to S-17 | Research + Plan |
| F14 | MISSING: działanie odwrotne bez wyniku, potem z wynikiem | Follow-up jawnie przypisany do S-04 | Research |
| Kafelki | `generateTask` dokłada 4 kafelki dla `'tiles'` (przycięte do rozmiaru zakresu: BONDS suma 2 → 3); BONDS przez `tileRange` `{0, suma}` | Jedno wejście dla rundy, sample i walidatora; ziarna bez zmian | Research + Plan |
| Po poprawnej | Przycisk „Dalej” (kit), bez auto-przejścia | Tempo dziecka, bez „timera” | Research + Plan ([human]) |
| `'select'` | Wyłączone z losowania do S-13 | Brak widoku w kicie; żaden krok nie pustoszeje | Research + Plan ([human]) |
| Czcionka | TTF w `public/fonts/`, `ttf` w prekeszu | NFR: lokalna czcionka z polskimi znakami, offline | Research |
| Hak e2e | Osobny build `dist-e2e/` na 4397, drugi projekt Playwrighta; seed #8 zostaje na produkcji (4398) | Ograniczenie orkiestratora: #8 testuje bundel produkcyjny | Plan |
| Dowód braku haka | Plugin-strażnik w `npm run build` (błąd przy znaczniku; kontrola pozytywna w buildzie e2e) | Działa lokalnie, w CI i w Deploy bez zmiany komend | Plan |
| Koniec rundy | Pasek „+2 ★” i „Dalej” → kolejna runda; podsumowanie w S-05 | Dziecko widzi bonus bez wymyślania ekranu | Plan |

## Scope

**In scope:** reduktor rundy, model widoku, wybór umiejętności, bufor klawiaturki, polityka podpowiedzi, F14, kafelki E1,
`balance.ts`, czcionka, tokeny, `pl.round`, sceny Task/UI, widżety (ProgressDots, AnswerTiles, Keypad, FeedbackBar,
SolutionSteps, StarCounter), hak e2e + strażnik, spec #11, profil, luki projektu, follow-upy.

**Out of scope:** `'select'`/`'drag'` UI (S-13), podsumowanie i lektor (S-05), przełącznik zadania/pokój (S-05/S-09),
placement (S-06), odblokowywanie (S-07), zapis (S-11), pełne podpowiedzi klasy b/c (S-17), e2e w CI, spec #9.

## Architecture / Approach

`core` decyduje: `generateTask` → `buildRound` → `RoundState` (reduktor) → `roundView` (co narysować). `TaskScene`
trzyma stan, rysuje widżety z `roundView` i przekazuje dotyk do reduktora; `UIScene` rysuje licznik z `registry`.
Liczby z `src/data/balance.ts`, teksty z `pl.round`, geometria i kolory z `layout.ts`. Hak (`src/testing/e2eHook.ts`)
istnieje tylko pod `if (__E2E_HOOK__)` i czyta `TaskScene.snapshot()`/`targets()`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Kafelki E1, `generateTask` (tdd) | 4 kafelki dla `'tiles'`, E1 na kafelkach | Niemożliwe kafelki BONDS |
| 2. Pierwsza podpowiedź, F14 (tdd) | `firstHint`/`solutionSteps`, MISSING 2 linie | Wyciek wyniku w nowym typie |
| 3. Automat rundy (tdd) | Reduktor, gwiazdki, bonus | Podwójna wypłata |
| 4. Widok, wybór, klawiaturka (tdd) | `roundView`, `pickSkills`, `keypadInput` | `'select'` w losowaniu |
| 5. Czcionka, tokeny, TaskScene + ProgressDots (impl) | Grywalny ekran bez wejścia | Czcionka poza prekeszem |
| 6. AnswerTiles + Keypad (impl) | Dotyk → odpowiedź | Cele < 96 px |
| 7. FeedbackBar + SolutionSteps (impl) | Podpowiedź, kroki, „Dalej” | Stan bez wyjścia |
| 8. UIScene + StarCounter (impl) | Licznik, lot gwiazdki, koniec rundy | Lot blokuje wejście |
| 9. Hak e2e + strażnik (impl) | Build z hakiem na 4397, seed na produkcji | Hak w produkcji |
| 10. Seam sweep, profil, docs (impl) | Port 4397 w profilu, DESIGN-GAP, follow-upy | Martwe resztki faz |
| 11. Runda dotykiem #11 (e2e) | Spec: czysta runda, druga próba, przepisanie | Tap obok celu przy `Scale.FIT` |

**Prerequisites:** S-03 done; Playwright Chromium zainstalowany; `npx playwright` poza sandboxem.
**Estimated effort:** ~11 sesji agenta (po jednej na fazę) + review i ship.

## Open Risks & Assumptions

- Drugi build w `npx playwright test` wydłuża bramkę e2e (~+7 s) i zajmuje port 4397.
- Reakcja < 100 ms sprawdzalna tylko na iPadzie (`[human]`).
- Cztery decyzje wbrew dosłownemu tekstowi PRD/planu czekają na opiekuna (`[human]` 10.5–10.8).

## Success Criteria (Summary)

- Dziecko gra pełną rundę dotykiem; czysta runda daje 7 gwiazdek, druga próba 1, przepisanie 0; nic nie odbiera gwiazdek.
- Pierwsza podpowiedź nigdy nie zdradza wyniku (poza zamierzonym przedziałem ROUNDING).
- Seed #8 (produkcja) i spec #11 (hak) zielone; produkcyjny `npm run build` dowodzi braku haka.
