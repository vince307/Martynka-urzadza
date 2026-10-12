---
change_id: task-round-stars
title: Runda zadań dotykiem z gwiazdkami, podpowiedzią i drugą próbą
status: preparing
created: 2026-10-12
updated: 2026-10-12
archived_at: null
---

## Notes

S-04 z roadmapy (etap M2, pierwszy wycinek z wejściem gracza): dziecko rozwiązuje rundę zadań dotykiem (kafelki
lub klawiaturka) z kropkami postępu, dostaje gwiazdkę za każde poprawne zadanie (także w drugiej próbie) i bonus
za rundę bez błędu; po błędzie potrząśnięcie i podpowiedź, po drugiej pomyłce rozwiązanie krok po kroku
i przepisanie wyniku; licznik gwiazdek zawsze widoczny. Logika rundy w `src/core/` (TDD), scena tylko renderuje.
Decyzja opiekuna 2026-10-12: w E1 odpowiedzi liczbowe na 3–4 kafelkach. E2e rundy (ryzyko #11 planu testów)
przez hak testowy tylko do odczytu w osobnym buildzie e2e, nieobecny w bundlu produkcyjnym.

Źródła: `context/foundation/roadmap.md` (S-04 z Decisions), `context/foundation/prd.md` (FR-006, FR-007, FR-008,
FR-011, US-01, NFR: dotyk < 100 ms, cele ≥ 96 px, tekst poleceń ≥ 64 px, czcionka lokalna),
`Martynka-urzadza.md` §2, §6 (ekran zadań, wartości startowe `balance.ts`), §11 (M2), §14;
`docs/ZADANIA.md` §1 „Zasady prezentacji” (tryby odpowiedzi), §4 (ADD_SUB: E1 kafelki 3–4),
§7 (model `Task`); `context/foundation/test-plan.md` ryzyko #11, etap 5, §6.6;
`context/foundation/test-stack.md` § E2E. Wzorce: `context/archive/2026-10-12-generators-remaining-stages/`,
`context/archive/2026-10-12-test-plan-refresh-2026-10-12/`. Plik `lessons.md` w `context/foundation/` nie istnieje.

## Roadmap claims vs repo now

Stan sprawdzony na `feat/task-round-stars` @ `58244a5` (= `main`).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-03 | S-03 `done` (archiwum `2026-10-12-generators-remaining-stages`); `src/data/curriculum/index.ts` ma E1–E6; 21 generatorów w `src/core/tasks/registry.ts` (`generators`). | Brak korekty. |
| „kafelki lub klawiaturka” (Outcome) | `src/ui/widgets/` jest pusty (`.gitkeep`), brak jakiegokolwiek widżetu. `SkillDef.answer` w `src/core/types.ts` ma cztery tryby: `'tiles' \| 'keypad' \| 'drag' \| 'select'`. Dane: 21 umiejętności `'tiles'`, 2 `'select'` (EVEN_ODD `variant: 'select'`: `E1.6.even_odd_select_10` i `E3.7.select_even_30` — ten drugi jest w etapie domyślnym z decyzji 1; odpowiedź `number[]`), reszta `'keypad'` (domyślne); `'drag'` nieużywany. Odpowiedzi kafelkowe bywają napisami (dni tygodnia, miesiące, rzymskie, liczebniki słownie, znaki `<`/`>`/`=`, `+`/`−`). | Slice musi obsłużyć też `'select'` (zaznaczanie wielu kafelków + zatwierdzenie) albo świadomie wyłączyć te 2 umiejętności z losowania do czasu S-07/S-13. Kafelki: liczby i napisy. `'drag'` poza zakresem. |
| „S-04 zmienia `answerMode` umiejętności E1” (Decisions) | Pole nazywa się `answer` (`SkillDef.answer`), nie `answerMode`. W `src/data/curriculum/E1.ts` helper `skill()` ma domyślne `'keypad'`; komentarz pliku mówi „Numeric answers use the keypad”. Umiejętności liczbowe E1 na klawiaturce: 10 (`E1.3.add_sub_5`, `E1.3.missing_5`, `E1.3.bonds_5`, `E1.4.bonds_6_7`, `E1.5.add_sub_9`, `E1.5.chain_9`, `E1.5.word_9`, `E1.7.bonds_10`, `E1.7.complement_10`, `E1.9.add_sub_10`). | Zmiana dotyczy `answer` tych 10 umiejętności i komentarza pliku; ZADANIA §4 wymienia kafelki E1 wprost tylko przy ADD_SUB, decyzja opiekuna rozciąga to na wszystkie odpowiedzi liczbowe E1. Zmiana w `src/data/` → czytanie nauczycielskie (`sample -- E1 --count 6`). |
| „dobiera dystraktory” (Decisions) | `numberChoices` w `src/core/tasks/distractors.ts` już istnieje (3–4 kafelki, sąsiedzi ±1/±2/±10, zamiana cyfr, bez ujemnych) i używają go CALENDAR/ROMAN/NUMBER_WORDS. Generatory ADD_SUB, MISSING, BONDS, CHAIN, WORD, COMPLEMENT nie zwracają `choices` (zmierzone: 0 z 1050 zadań ADD_SUB). `validateTask` w `src/core/tasks/validate.ts` sprawdza `choices`, gdy są. | To jest podpięcie istniejącego helpera, nie nowy algorytm. Do rozstrzygnięcia w research: generator dokłada `choices`, gdy `skill.answer === 'tiles'`, czy wspólna warstwa w `core` (round). Niezmiennik: każda umiejętność `'tiles'` daje `choices` z odpowiedzią (dziś niesprawdzane). Uwaga: przy `max: 5` sąsiedzi wypadają z zakresu (np. odpowiedź 0 lub 5), a BONDS ma odpowiedź w postaci pary/liczby — zmierzyć. |
| „po błędzie … podpowiedź” = „pierwszy krok z `hint`” (plan §6) i reguła CLAUDE.md „hints … without giving the result away in the first step” | `Task.hint: string[]`. Zmierzone (50 ziaren × każda umiejętność E1–E6): `hint[0]` zawiera wynik w 100% zadań MISSING, COMPLEMENT, DIV, COMPARE_DIFF, HALF; ~99% ROUNDING; ~95% WORD; 55% ADD_SUB; 50% MULT; często dlatego, że podpowiedź ma jedną linię (MISSING, COMPLEMENT, DIV, COMPARE_DIFF, ROMAN, EVEN_ODD, NUMBER_WORDS zawsze 1 linia). | Ekran nie może po prostu pokazać `hint[0]` po pierwszym błędzie — zdradziłby wynik. Potrzebna reguła rundy w `core` (patrz Autonomous decisions 3) plus F14 dla MISSING. Pełne wieloetapowe podpowiedzi dla pozostałych typów to treść (follow-up S-17). |
| „licznik gwiazdek jest zawsze widoczny, przełącznik ukryty w trakcie zadania” (Outcome, FR-011) | `src/main.ts` rejestruje tylko `BootScene`; brak `TaskScene`, `UIScene`, `RoomScene`. Pokój powstaje w S-09, „Do pokoju” w podsumowaniu w S-05. | Licznik gwiazdek w nakładce UI wchodzi w S-04. Przełącznik zadania/pokój nie ma dokąd prowadzić — patrz Autonomous decisions 2. |
| Gwiazdki „dostaje” (US-01) | Brak zapisu: `src/storage/` pusty, `SaveState` tylko jako typ w `src/core/types.ts`; zapis to S-11. | Gwiazdki żyją w pamięci sesji; przeładowanie je zeruje do S-11. Brak migracji (patrz niżej). |
| Liczby balansu „w `balance.ts`” (FR-006, plan §6) | `src/data/balance.ts` nie istnieje. | Slice tworzy `src/data/balance.ts`: długość rundy 5, 1 gwiazdka za zadanie, +2 za rundę bez błędu, druga próba = 1 gwiazdka (bez zaliczenia do opanowania). |
| Skąd runda bierze zadania | Brak `placement` (S-06) i `curriculum`/`mastery` (S-07); BootScene nie przechodzi do żadnej sceny. US-01 AC: „w zakresie liczb bieżącego etapu i odblokowanych kroków”. | Potrzebny tymczasowy wybór etapu i umiejętności — patrz Autonomous decisions 1. |
| NFR: tekst ≥ 64 px, polskie znaki z czcionki dołączonej lokalnie | `src/scenes/BootScene.ts` używa `fontFamily: 'sans-serif'`; `FONT_SIZES` w `src/data/layout.ts` ma tylko `title` 112, `subtitle` 48, `caption` 32. Czcionka Atkinson Hyperlegible Next (OFL) jest tylko w `designs/martynka-maths-A-v1/fonts/` (gitignored). `PLACEHOLDER_COLORS` nie ma koloru kafelków (`#E3F0D9`), poprawnej odpowiedzi (`#E5F2D4`) ani podpowiedzi (`#FFF0B9`). | Rozmiary z przewodnika stylu (polecenie 64, klawiaturka 58, działanie 112, podpowiedź 30–34) i brakujące kolory palety dopisać do `src/data/layout.ts`. Czcionka: decyzja w research/plan (licencja OFL pozwala skopiować `woff2` do `public/`; prekesz obejmuje `woff2`) albo świadome odłożenie do S-16 z wpisem. |
| E2e rundy „wymaga haka testowego tylko do odczytu w osobnym buildzie e2e” (Decisions, test-plan etap 5) | `playwright.config.ts` ma jeden `webServer`: `npm run build && npm run preview` (build produkcyjny, `dist/`). `context/foundation/test-stack.md` § E2E należy do `/10x-e2e-setup` (contract: pola `webServer` aplikacji zmienia tylko ten skill; wolno dodać wpis w formie tablicy). Brak trybu builda e2e w `vite/`. Test-plan §3 etap 5 ma status „not started”, choć seed `tests/e2e/seed.spec.ts` już działa (profil §11). | Research musi rozstrzygnąć: osobny build e2e (np. `vite build --mode e2e` do innego katalogu niż `dist/`, flaga przez `define` jak `__BUILD_ID__`, martwy kod usunięty z produkcji) i jak go serwować bez naruszania pól `/10x-e2e-setup` (drugi wpis `webServer` w tablicy na porcie E2E? jedyny dodatkowy port dozwolony to port E2E). Dowód: grep `dist/` po nazwie haka = 0 trafień. Seed (#8) musi dalej działać na buildzie produkcyjnym. |
| Reakcja na dotyk < 100 ms (NFR) | Brak sceny z wejściem; brak pomiaru. | Sprawdzalne tylko na urządzeniu; wiersz ręczny dla opiekuna (iPad). |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §6 (wiąże przy konflikcie), `docs/ZADANIA.md`,
`designs/martynka-maths-A-v1/style-guide.md` § „Task states”, „Font and spacing”, „Palette and rendering”.

- **Widoki kitu wiązane przez ten slice** (`designs/martynka-maths-A-v1/screenshots/`, `preview.html`):
  `task-tiles.png`, `task-keypad.png` (stan bezczynny), `hint-tiles.png`, `hint-keypad.png` (po pierwszym błędzie),
  `second-try.png`, `solution-step-1.png`, `solution-step-2.png` (rozwiązanie krok po kroku), `correct.png`
  (poprawna odpowiedź, gwiazdka do licznika), `tablet-1024.png` (sprawdzenie celów ≥ 48 CSS px przy 1024×768).
- **Nie w tym slice:** `summary.png` (S-05), `welcome.png` (S-06), `unlock.png` (S-07), `contact-*.png` (S-13/S-16),
  `overview.png` (galeria).
- **Klucze tekstów z kitu do `src/data/pl.ts`** (dziś brak sekcji rundy): „Brawo!”, „Dalej”, „Spróbuj jeszcze raz”,
  „Podpowiedź”, „Pokaż kroki”, „Następny krok”, „Już wiem”, „Oblicz” (nagłówek zadania z samym działaniem),
  klawisze „kasuj” i „OK”. Polecenia zadań już są w `pl.tasks` i `src/data/wordTemplates.ts`.
- **Tokeny** (do `src/data/layout.ts`): kafelki `#E3F0D9`, poprawna `#E5F2D4`, podpowiedź/druga próba `#FFF0B9`,
  gwiazdki `#F1CE6B` (jest jako `butter`), tekst `#245C59` (`deepTeal`), przyciski `#54BEB4` (`turquoise`);
  rozmiary 64/58/112/30–34 px; cele ≥ 96 px, odstępy 16–32 px.
- **Konflikty kit ↔ plan (plan wygrywa, zapisać w `docs/design-gaps.md`):** w kicie podpowiedź i „Pokaż kroki” to
  przyciski, które dziecko stuka samo; plan §6 i FR-008 każą pokazać podpowiedź automatycznie po pierwszym błędzie,
  a rozwiązanie po drugim, potem przepisanie wyniku bez gwiazdki. Kit pokazuje podpowiedź jako zdanie metody
  („Najpierw dodaj 20, potem 7.”), generatory dają linie działań — brak zdań metody w danych.
- **Kandydaci na DESIGN-GAP** (komentarz w kodzie + wiersz w `docs/design-gaps.md`, plik powstaje przy pierwszej
  luce w kroku implementacji): (1) tryb `'select'` — kit nie ma widoku zaznaczania wielu kafelków ani przycisku
  zatwierdzenia; (2) koniec rundy bez podsumowania (S-05) — kit nie ma stanu „runda skończona” poza `summary.png`;
  (3) ekran „wpisz wynik jeszcze raz” po pokazaniu rozwiązania — kit wraca do zwykłej próby bez osobnego tekstu;
  (4) przełącznik zadania/pokój — kit ma przycisk „Do pokoju” w pasku, ale pokoju nie ma do S-09.

## Migration

Nie przewiduję migracji. Profil §4: brak bazy danych; format zapisu i jego migracje (`src/core/save.ts`) wchodzą
z S-11. Gwiazdki tej rundy są stanem w pamięci. Jeżeli plan doda `stars` do zapisu, to dopiero S-11.

## Triggered follow-ups (Trigger: S-04)

| Źródło | Follow-up | Moje zdanie o zakresie |
|---|---|---|
| `context/archive/2026-10-12-generators-remaining-stages/follow-ups/review-fixes.md` (Planned, phase 10) | „E1 numeric answers use the keypad; ZADANIA section 4 asks for 3–4 tiles (ADD_SUB). Trigger: S-04” | **W zakresie** — to ta sama decyzja opiekuna z roadmapy (Decisions 2026-10-12). Dotyczy 10 umiejętności E1 i podpięcia `numberChoices`; wiersz 10.7 [human] z tamtego handoffu jest tym samym rozstrzygnięty (kafelki). |
| `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` **F14** (bez linii `Trigger:`, ale tekst mówi „przy S-04 (ekran zadań)”) | Pierwsza podpowiedź MISSING zdradza wynik; pokazać działanie odwrotne bez wyniku jako pierwszy krok, wynik dopiero w rozwiązaniu krok po kroku. | **W zakresie** — wciąż otwarte (`generateMissing` zwraca 1 linię z wynikiem, 150/150). Zmiana generatora + czytanie nauczycielskie. Ten sam problem dotyczy COMPLEMENT, DIV, COMPARE_DIFF, HALF, ROUNDING, WORD, części ADD_SUB/MULT: w S-04 rozwiązuje go reguła rundy (decyzja 3), a pełne podpowiedzi metodą szkolną dla tych typów zostają przy istniejącym follow-upie `Trigger: S-17` (COMPLEMENT/DIV) — do rozszerzenia o listę typów w follow-upach tego slice'u. |

Pozostałe wpisy z `context/archive/*/follow-ups/review-fixes.md` mają inne wyzwalacze (S-13, S-17, F6 deploy,
F10–F12 zamknięte w S-02/S-03, AGENTS.md, parametry ≥ 10 000) — poza zakresem.

## Autonomous decisions

1. **Źródło zadań do czasu S-06/S-07: etap domyślny z `src/data/balance.ts` (E3), umiejętności losowane
   równomiernie z kroków etapu, które mają umiejętności; bez odblokowywania.**
   - Odrzucone: (a) losowanie z wszystkich etapów; (b) parametr URL do wyboru etapu w buildzie produkcyjnym;
     (c) czekanie z rundą na S-07.
   - Dlaczego: córka jest w E3–E4 (roadmap `main_goal: market-feedback`, PRD), plan §6 trzyma liczby w `balance.ts`,
     a S-06/S-07 i tak podmienią wybór. Jedna funkcja w `core` (np. `pickSkill(stage, rng)`) jest miejscem, które
     S-07 zastąpi wagami 60/30/10. Kafelki E1 sprawdzi test jednostkowy i `sample -- E1`, nie rozgrywka.
   - Co zmieniłoby odpowiedź: research pokaże, że US-01 („odblokowane kroki”) wymaga ograniczenia do kroku ≤ N już
     teraz; albo e2e potrzebuje wybrać etap — wtedy wybór tylko w buildzie e2e, nigdy w produkcji.
2. **Przełącznik zadania/pokój nie jest rysowany w S-04; licznik gwiazdek tak. Reguła widoczności (ukryty w trakcie
   zadania, widoczny między zadaniami) może trafić do `core` jako czysta funkcja stanu rundy, gotowa dla S-05/S-09.**
   - Odrzucone: przycisk „Do pokoju” prowadzący donikąd albo do pustej sceny.
   - Dlaczego: pokój powstaje w S-09, „Do pokoju” w podsumowaniu w S-05; przycisk bez celu to zachowanie wymyślone
     poza kitem i planem. FR-011 w części „licznik zawsze widoczny” jest dostarczony.
   - Co zmieniłoby odpowiedź: opiekun chce widzieć przełącznik już teraz (np. jako wyszarzony) albo plan S-05
     potrzebuje go w nakładce UI wcześniej.
3. **Polityka podpowiedzi w `core`: po pierwszym błędzie pokazujemy `hint[0]` tylko, gdy nie zawiera wyniku
   (i podpowiedź ma ≥ 2 linie); w przeciwnym razie „Spróbuj jeszcze raz” bez linii z wynikiem. Po drugim błędzie —
   wszystkie linie `hint` krok po kroku, potem przepisanie wyniku bez gwiazdki. F14 (MISSING) naprawiony w generatorze
   jako dwie linie: działanie odwrotne z □, potem z wynikiem.**
   - Odrzucone: (a) zawsze `hint[0]` (zdradza wynik w 55–100% zadań wielu typów); (b) przepisanie podpowiedzi
     wszystkich generatorów w S-04 (duża zmiana treści dziesięciu typów, właściwe miejsce S-17).
   - Dlaczego: CLAUDE.md wymaga podpowiedzi, które nie zdradzają wyniku w pierwszym kroku; reguła w `core` jest
     testowalna (TDD) i działa dla każdego typu, a F14 jest jawnie przypisany do S-04.
   - Co zmieniłoby odpowiedź: research pokaże, że maskowanie (`… = ?`) jednej linii daje dobrą podpowiedź dla
     większości typów — wtedy maska zamiast pominięcia; albo opiekun chce pełnych podpowiedzi metodą szkolną już
     w S-04 dla E3–E4 (jakość treści E3–E4 jest wymagana przez plan §11 M1).
4. **Koniec rundy w S-04: bonus +2 doliczony do licznika i od razu następna runda; podsumowanie z „Kolejna runda”
   i „Do pokoju” zostaje w S-05.**
   - Odrzucone: własny ekran końca rundy z nowymi tekstami (poza kitem — tekst wymyślony).
   - Dlaczego: roadmap przypisuje podsumowanie S-05 (FR-010); stan „runda skończona” wystawia hak e2e, więc ryzyko #11
     (bonus za czystą rundę) jest sprawdzalne bez ekranu.
   - Co zmieniłoby odpowiedź: plan S-04 uzna, że bez minimalnego podsumowania dziecko nie zauważy bonusu — wtedy
     użyć kluczy z kitu („Brawo!”, „Kolejna runda”) i wciągnąć część S-05.
5. **Następny krok to `/10x-research task-round-stars`, nie `/10x-plan`** (skill domyślnie proponuje plan).
   - Dlaczego: prompt kroku narzuca `/10x-research`; poza tym otwarte są pytania wymagające eksploracji: build e2e
     z hakiem i `webServer`, sposób podpięcia `choices` do E1, tryb `'select'`, czcionka, sceny Phaser 4 (nakładka UI
     równoległa, tweeny potrząśnięcia i lotu gwiazdki, mapowanie dotyku przy `Scale.FIT`).
   - Co zmieniłoby odpowiedź: nic w tym kroku — kolejność łańcucha ustala orkiestrator.
6. **Schowek pominięty** (`pbcopy` z sesji bez interakcji nie ma odbiorcy); polecenie jest w `handoff.md` §4.

## Open questions for /10x-research

- Build e2e: tryb Vite i katalog wyjściowy, flaga `define`, jak serwować go w Playwright bez zmiany pól
  `/10x-e2e-setup` (tablica `webServer`?), dowód braku haka w `dist/` (grep), wpływ na seed #8.
- Co hak wystawia (tylko odczyt): poprawna odpowiedź bieżącego zadania, indeks zadania, gwiazdki, faza próby,
  współrzędne kafelków/klawiszy w przestrzeni 1920×1080 i ich mapowanie na CSS przy `Scale.FIT`.
- `choices` dla E1: w generatorach czy w warstwie rundy; zachowanie `numberChoices` przy małych zakresach
  (`max: 5`, odpowiedź 0); BONDS (format odpowiedzi); niezmiennik „`'tiles'` ⇒ `choices`” w
  `tests/contentInvariants.test.ts`.
- Porównanie odpowiedzi: liczby, napisy, `number[]` (select), `Task.check`.
- Phaser 4: równoległa scena UI (`scene.launch`), tweeny (potrząśnięcie, lot gwiazdki bez blokowania przejścia —
  NFR), wejście dotykowe i reakcja < 100 ms, ładowanie czcionki `woff2` przed pierwszym tekstem.
- Kolejność i treść kroków rozwiązania przy drugiej pomyłce dla podpowiedzi jednolinijkowych.
