---
change_id: e1-shapes-picture-mode
title: E1 z obrazkami — figury, szlaczki, porównywanie liczebności, „który z kolei” i płacenie monetami
status: preparing
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Slice roadmapy **S-14d** (etap M6), autonomiczny run `2026-10-15-fix-s14c-s14d`, gałąź `feat/e1-shapes-picture-mode`
cięta z `main` @ `10d6fe7` (po S-14c, PR #55).

- **Outcome (roadmapa):** 6-latek rozwiązuje E1.1 (SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY), ORDINAL (E1.2),
  BONDS z parami i CHOOSE_OP z obrazkiem oraz MONEY_PAY (przeciąganie monet do portfela, „najmniej monet”, E1.11, E2.2);
  „tryb z obrazkami” dla 6-latków (`docs/design-gaps.md` wiersz 21).
- **PRD:** FR-023 (E1–E2; „każdy etap ma pełny zestaw typów z ZADANIA.md” to kryterium końca M6).
- **Katalog (`docs/ZADANIA.md`):** § 1 (tabela wieku: „6 lat, wrzesień–styczeń → E1 (tryb z obrazkami)”; łagodzenie
  „mniejszy zakres, tryb z obrazkami”; „E1–E2: polecenia krótkie, z obrazkami … liczby jako kropki/obiekty obok cyfr”),
  § 3 E1.1, E1.2, E1.3, E1.11, E2.2; § 4 **SHAPES** (nazwij figurę, dotknij wszystkich trójkątów, intruz; figury w kodzie),
  **PATTERN** (co dalej w szlaczku; ciągi figur i kolorów), **COMPARE_QTY** (dwie grupy, trzy przyciski; tylko E1;
  ikony), **SPATIAL** (przed/za/między/obok, lewa/prawa; „scena — może to być pokój z gry”), **SYMMETRY** (dotykaj kratek,
  druga połowa obrazka; siatka), **ORDINAL** (rząd obiektów; „dotknij czwartego od prawej” / „który z kolei od lewej jest
  zielony?”; E1 do 10; ikony), **BONDS** wariant „połącz pary dające 10”, **CHOOSE_OP** „treść lub obrazek (ptaki
  przylatują / odlatują) + 3 działania”, **MONEY_PAY** („przeciągnij monety do portfela, aż będzie n zł; wariant
  najmniej monet”).
- **Kontrakt runu** § S-14d: blok roadmapy + follow-upy `Trigger: S-14d`; MONEY_PAY to druga gałąź `drag` — helpery e2e
  (`answerRight`) muszą zostać wyczerpujące; grafika z `designs/` może przejść do `public/assets/` (`npm run art`, zgoda
  autora 2026-10-13); 6-latki: duże cele dotyku, tryb z obrazkami. § All slices: `src/core` czyste, testy najpierw, teksty
  w `src/data/`, liczby w `balance.ts`, teacher read `npm run sample -- E1|E2 --count 6`, bez `docs/zrodla/`, **zapis
  zostaje v2**, fixture'y zamrożone, bez `deploy/`, `designs/`, `.gitignore`, `.claude/`.
- **Wzorce:** `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/` (S-13b: druga gałąź `drag` — „ustaw zegar” —
  `src/core/tasks/dragMode.ts`, osobny reducer `src/core/clockSet.ts` obok `blockDrag.ts`, gałąź w helperach e2e,
  `?e2eSkills=`), `context/archive/2026-10-15-text-measure-time-types/` (S-14c: tabela roszczeń, progi odblokowania przy
  dokładaniu umiejętności, follow-upy z triggerami, DESIGN-GAP dla widoku spoza kitu).
- Plik lekcji w `context/foundation/` nie istnieje (sprawdzone 2026-10-15).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/e1-shapes-picture-mode` @ `10d6fe7`. Blok S-14d pisano przy planie S-14 — od tego czasu weszły
S-13b (#49), S-15 (#50), S-14b (#51), save-reason-and-recovery, save-v2-backup-health (#54), S-14c (#55).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-14; „Parallel with S-15” | S-14, S-14b, S-14c, S-15 done. Rejestr (`src/core/tasks/registry.ts` `generators`): 44 typy (do `UNIT_CHOICE`); **brak** SHAPES, PATTERN, COMPARE_QTY, SPATIAL, SYMMETRY, ORDINAL, MONEY_PAY — wszystkie na liście `LATER` w `tests/curriculum.test.ts`. | Nic równoległego. Każdy wdrożony typ wypada z `LATER`. Minigry S-15 biorą tylko `WORD_TYPES` (`src/core/minigames/word.ts`), więc nowe typy ich nie dotykają; harmonogram wariantów (`src/core/variants.ts`) bez zmian. |
| „E1.1 jest dziś pusty” | Prawda: `E1.ts` krok 1 `skills: []` (niegrywalny); `playableSteps(E1)` = 2…11. | E1.1 staje się grywalny → `startableSteps(E1)` rośnie z 10 do 11 kroków. `calendarStart` (`src/core/curriculum.ts`): nowy krok jest na początku listy, więc start kalendarza dla E1 może tylko **zejść** o krok (k′ ≤ k+1, a kroki przesunięte o 1) — `floorToCalendar` niczego nie podnosi, zapisani uczniowie E1 zostają. Rozgrzewka E2 bierze 3 zadania z E1 — research sprawdza, z których kroków (`buildWarmup`), żeby 7-latek nie dostał szlaczka w rozgrzewce bez potrzeby. |
| ORDINAL w E1.2 | E1.2: 2 umiejętności (`compare_num_5` tiles, `count_5` COUNT z ikonami `visual.kind: 'icons'`), próg `ceil(0.5·2)` = 1. | +ORDINAL → 3, próg **2** (wolniej dla zapisanych na E1.2, nic nie ginie). ZADANIA: E1 do 10, ale E1.2 to „liczby 1–5” → zakres 5 w E1.2. Wariant „dotknij czwartego” wymaga dotyku w rysunku (nowy tryb); wariant „który z kolei jest …” działa na kafelkach (decyzja 4). |
| „BONDS z parami i CHOOSE_OP z obrazkiem” | BONDS: generator tekstowy (E1.3 `bonds_5`, E1.4, E1.7, E2); CHOOSE_OP: tekst (E1.3 `choose_op_5`, kinds `sum`/`left`). Brak wariantu „połącz pary”, brak obrazka. Follow-up S-12 (`2026-10-12-generators-remaining-stages`): szablon `sum.bought` z kontekstem `złoty` daje „kupił jeszcze 2 złote” w E1.3 CHOOSE_OP. | **CHOOSE_OP z obrazkiem w zakresie** (`IconGroups`/`visual.icons` już jest; „przylatują/odlatują” = dwie grupy ikon, tiles z 3 działaniami). **BONDS „połącz pary” poza zakresem** — to nowy tryb odpowiedzi (łączenie par), nie wariant generatora (decyzja 3). |
| MONEY_PAY w E1.11, E2.2 | E1.11: 5 umiejętności (próg 3), E2.2: 3 (próg 2). `TaskVisual` `money` + `MoneyTable` + art monet (`public/assets/tasks/money/`, 15 plików) są. `dragMode` (`src/core/tasks/dragMode.ts`) zna `blocks` i `clock`, a dla innego rysunku **rzuca** — dziś MONEY_PAY z rysunkiem `money` nie wszedłby po cichu w gałąź klocków w scenie. | E1.11 +1 → 6, próg 3 (bez zmiany); E2.2 +1 → 4, próg 2 (bez zmiany). Nowa gałąź `DragMode` `'coins'` z osobnym czystym reduktorem (wzorzec `clockSet.ts`, nie przeróbka `blockDrag`; decyzja 5). |
| „Uogólnienie `blockDrag` na nominały” (Unknowns) | `blockDrag.ts` (79 linii) ma `BlockKind = 'hundred' \| 'ten' \| 'one'`, `Mat` jako rekord trzech rodzajów, `maxPerKind`; follow-up S-13b S13-09 (`down` z tym samym `pointerId` podczas niesienia ignorowany) `Trigger: next change to blockDrag`. | Plan wybiera: osobny `coinDrag` (nominały = `MoneyId`, portfel jako lista, „najmniej monet” liczone w core) albo generyczny reduktor sparametryzowany rodzajami. Rekomendacja: generyczne jądro gestu tylko jeśli research pokaże ≥ 70 % wspólnego kodu; inaczej osobny reduktor (decyzja 5). S13-09 wchodzi do zakresu, jeśli `blockDrag` zostanie dotknięty. |
| Ryzyko: `answerRight` w helperach e2e | `tests/e2e/support/hook.ts` `answerRight`/`answerWrong`: gałęzie `state.input === 'drag' && state.clock`, potem **gołe** `state.input === 'drag'` → `buildOnMat`. Zadanie MONEY_PAY wpadłoby w gałąź klocków i zawiodło niejasno (timeout na macie) w każdym spec, który gra rundę E1.11/E2.2. | Hook (`src/testing/e2eHook.ts`) wystawia `dragMode` w `snapshot`; helpery przełączają się na nim wyczerpująco (`switch` z `never`, rzut na nieznaną gałąź) — dokładnie to, co S-13b zrobił dla zegara, ale bez domyślnego „else = klocki”. `buildOnMat`/`setClock` bez zmian; nowy `payCoins`. |
| „Tryb z obrazkami dla 6-latków” (design-gaps 21) | Brak trybu. Wiek jest w zapisie (`SavedLearner.age`, `validateSave` w `src/core/save.ts`); 6-latek trafia do E1 (`src/data/placement.ts`); autoczytanie domyślnie włączone dla E1–E2 (`effectiveAutoRead`, `balance` `autoReadStages`). Kit nie ma ekranu trybu (wiersz 21 nadal otwarty, `docs/art-inventory.md` § 4). | Tryb bez nowego ekranu i bez pola w zapisie: czysta funkcja w core z wieku/łagodzenia, która w rundzie E1 preferuje umiejętności z rysunkiem (`Task.visual`), plus pokazanie liczby jako obiektów tam, gdzie generator to umie (decyzja 2). Wiersz 21 zamknięty opisem albo zawężony — DESIGN-GAP dla wszystkiego, co wymagałoby widoku spoza kitu. |
| SPATIAL i SYMMETRY w E1.1 | Brak generatorów; brak sceny dla SPATIAL (kit ani paczki nie mają; ZADANIA „może to być pokój z gry”); SYMMETRY to dotykanie kratek — `CoordGrid`/`FigureGrid` (S-13b) rysują siatkę, ale nie ma trybu „przełącz kratkę”. | **Poza zakresem**, follow-up z triggerem (decyzja 3). E1.1 jest grywalny z SHAPES, PATTERN, COMPARE_QTY; `LATER` zachowuje SPATIAL i SYMMETRY, test „covers its group-1 types” przechodzi. |
| (nie w roadmapie) progi odblokowania | E1.1: nowy krok; E1.2 2→3 (próg 1→2); E1.3 4→5 przy CHOOSE_OP z obrazkiem jako osobnej umiejętności (próg 2→3) albo 4 przy zamianie parametrów istniejącej (próg bez zmiany). | Plan decyduje dla E1.3; rekomendacja: wariant obrazkowy jako **nowa** umiejętność (mastery per obraz/tekst), wolniejsze odblokowanie zapisane w handoffie i na liście [human]. |

## Scope (propozycja dla `/10x-research` i `/10x-plan`)

| Typ / funkcja | Kroki | Tryb odpowiedzi | Rysunek / grafika | Treść i odmiana |
|---|---|---|---|---|
| SHAPES | E1.1 | tiles (nazwa figury, intruz), `select` („dotknij wszystkich trójkątów”) | figury w kodzie (koło, kwadrat, prostokąt, trójkąt; kolor/wielkość) — nowy `TaskVisual` `shapes` i rysowanie figur **w kafelkach** (dziś `SelectTiles`/`AnswerTiles` mają tekst) | nazwy figur w `src/data/` (mianownik + biernik po „dotknij”: „trójkąty”), kolory z tokenów `layout.ts` |
| PATTERN | E1.1 | tiles (figura/kolor, który jest następny) | rząd figur w kodzie z pustym miejscem; ciąg okresowy AB, ABB, ABC | bez rzeczowników poza nazwami figur; mowa narratora opisuje ciąg |
| COMPARE_QTY | E1.1 | tiles (3 przyciski: „więcej”, „mniej”, „tyle samo” — albo „po lewej / po prawej / tyle samo”) | dwie grupy ikon (`IconGroups`, `ICONS` z `src/data/measures.ts`) | teksty przycisków w `pl.ts`; liczebność do 10 |
| ORDINAL | E1.2 (do 5) | tiles („który z kolei od lewej jest …?” → liczebnik porządkowy/liczba) | rząd ikon, jedna wyróżniona (kolor/ramka) | liczebniki porządkowe w `src/core/text/` lub `src/data/` (pierwszy … piąty; rodzaj wg rzeczownika) |
| CHOOSE_OP z obrazkiem | E1.3 | tiles (3 działania) | dwie grupy ikon + znak „przychodzą/odchodzą” (strzałka w kodzie) | naprawa `sum.bought` + `złoty` (follow-up S-12) przy okazji |
| MONEY_PAY | E1.11 (do 10 zł), E2.2 (do 20 zł) | `drag`, gałąź `coins` (taca nominałów → portfel, „OK”); wariant „najmniej monet” | monety i banknoty z `public/assets/tasks/money/` (są); **portfel bez grafiki → DESIGN-GAP**, rysowany w kodzie | polecenie „Zapłać 7 zł” / „… najmniejszą liczbą monet”; kwoty przez `formatMoney` |
| Tryb z obrazkami | E1 (wiek 6, łagodzenie) | — | preferencja umiejętności z rysunkiem w rundzie | bez nowego tekstu; ewentualny opis w podglądzie rodzica = DESIGN-GAP |

Grafika: 12 ikon jest w `public/assets/tasks/icons/`; 12 kolejnych (banana, cookie, orange, strawberry, shoe, sock, …) jest
w `designs/martynka-expansion-v1/assets/icons/` i może przejść przez `npm run art` (zgoda autora 2026-10-13), jeśli
ORDINAL/COMPARE_QTY potrzebują większej różnorodności — plan decyduje; każdy nowy obrazek wchodzi do `TASK_ART` z
`label` (stand-in) i do precache. Teacher read: `npm run sample -- E1 --count 6` i `-- E2 --count 6`, zapisany w artefakcie
fazy.

## Design source and copy (profile § 6)

- **Widoki kitu, które slice wiąże** (`designs/martynka-maths-A-v1/screenshots/`): `task-tiles.png` (polecenie + rysunek
  + kafelki — wzór dla SHAPES, PATTERN, COMPARE_QTY, ORDINAL, CHOOSE_OP), `hint-tiles.png`, `second-try.png`,
  `solution-step-1.png`, `solution-step-2.png`, `correct.png`, `summary.png`, `unlock.png` (`childName` E1.1),
  `contact-icons.png` i `contact-money.png` (arkusze grafiki), `tablet-1024.png` (cele dotyku). Reguła z
  `style-guide.md`: cele dotyku dziecka ≥ 96 × 96 px w skali odniesienia, odstępy 16–32 px — dla 6-latków plan bierze
  górną granicę. Mata/taca `drag` — wzór z `BlockMat` (S-13, już luka w design-gaps 52–58).
- **Grafika:** monety i banknoty (`public/assets/tasks/money/`, paczka A), ikony (`public/assets/tasks/icons/`, paczka A;
  opcjonalnie +12 z paczki expansion). Figury, szlaczki, strzałki i portfel — rysowane w kodzie.
- **DESIGN-GAP (kandydaci, wiersze w `docs/design-gaps.md` od 100):**
  1. Portfel (cel przeciągania MONEY_PAY) — żadna paczka nie ma grafiki portfela ani widoku płacenia.
  2. Figury i szlaczek **w kafelkach** odpowiedzi (kit ma kafelki z liczbą/tekstem).
  3. Wyróżnienie obiektu w rzędzie (ORDINAL) i strzałka „przylatują/odlatują” (CHOOSE_OP).
  4. „Tryb z obrazkami” (wiersz 21) — kit nie ma ekranu; tryb bez nowego widoku, wiersz aktualizowany.

## Migration expected?

**Nie.** Zapis zostaje **v2** (kontrakt runu). Nowe umiejętności to nowe klucze w otwartej mapie `mastery`
(`validateSave` przyjmuje każdy id), numery kroków się nie zmieniają (E1.1 już istnieje w danych), `unlockedStep` to
liczba. Tryb z obrazkami wynika z `SavedLearner.age` (już w v1/v2) i licznika łagodzenia (`easedRounds`, już w
zapisie) — **bez nowego pola**. Gdyby plan chciał zapisywać przełącznik trybu (np. ustawienie rodzica „tryb z
obrazkami”), to nowe pole w `Settings` → **v3 → slice zatrzymuje się na otwartym PR** (domyślna decyzja maintainera
2026-10-15); rekomendacja: nie zapisywać. Fixture'y `tests/fixtures/save-v1*.json` i v2 bez zmian.

## Risk: MONEY_PAY jako druga gałąź `drag` (helpery e2e)

`answerRight`/`answerWrong` (`tests/e2e/support/hook.ts`) używa każdy spec grający rundę, a `adaptive.spec` gra rundy z
drag blisko limitu 180 s. Dziś rozróżnienie to `state.clock` i domyślne „reszta = klocki”. Wzorzec S-13b
(`dragMode(task)` decyduje z rysunku, nigdy z typu odpowiedzi; scena rozgałęzia się na nim; nieznany rysunek rzuca)
obsługuje to po stronie gry. Po stronie e2e slice musi: (1) wystawić `dragMode` w `snapshot` hooka (build e2e tylko),
(2) zamienić łańcuch `if` w `answerRight`/`answerWrong` na wyczerpujący `switch` po `dragMode` z gałęzią `never`,
(3) dodać `payCoins` (przeciąganie jak `dragTouch`, sondowanie stanu portfela w hooku po każdym ruchu jak `buildOnMat`),
(4) pokazać deliberate break: usunięcie gałęzi `coins` w helperze → spec MONEY_PAY czerwony z czytelnym błędem, nie
timeout. `?e2eSkills=E1.11.money_pay_10` + `e2eVariant=off` dla spec, pełna suita `--workers=4`.

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Źródło | Ocena zakresu |
|---|---|---|
| **MONEY_PAY + `Wallet` + uogólniony `blockDrag`.** `Trigger: S-14d` | `2026-10-14-art-tasks-all-stages` | **W zakresie** — rdzeń slice'u. „Uogólniony `blockDrag`” zastąpiony decyzją 5 (osobny reduktor albo wspólne jądro po researchu). |
| **BONDS z parami i CHOOSE_OP z obrazkiem.** `Trigger: S-14d` | `2026-10-14-drawn-grid-tasks-e3-e4` (wcześniej S-13, S-12) | **CHOOSE_OP z obrazkiem: w zakresie. BONDS „połącz pary”: poza** — nowy tryb odpowiedzi (łączenie dwóch kafelków w parę, stan wielu par); nowy trigger `a pairing answer mode (e.g. SYMMETRY/matching)`. |
| **Oś liczbowa jako podpowiedź dla E1 (kafelki) i ADD_SUB > 30.** `Trigger: S-14d (E1 picture mode) or a layout band above the tiles` | `2026-10-14-number-line-written-arrows` | **Poza zakresem** — wymaga pasa układu nad kafelkami (`pictureLayout`), a tryb z obrazkami nie zmienia układu (decyzja 2). Trigger: `a layout band above the tiles`. |
| **E1.10 `place_read_12`** (przestrzeń zadań 11–12 za mała dla inwariantów). `Trigger: S-14d` | `2026-10-14-number-line-written-arrows` | **Poza zakresem** — bez zmiany przestrzeni zadań (dwie liczby) inwarianty różnorodności (`tests/contentInvariants.test.ts`) nadal nie przejdą; E1.10 ma COUNT `count_12` z dziesiątką i resztą, który już uczy 11–12. Trigger: `a content-invariants exception for tiny task spaces or [human] teacher read of E1.10`. |
| **O4: `E1.2.count_5` losuje 1 ikonę.** `Trigger: [human] 9.8 or a teacher read of E1.2` | `2026-10-14-art-tasks-all-stages` | **W zakresie (tanie)** — ten slice robi teacher read E1.2 (ORDINAL); `min: 2` dla obrazka, jeśli czytanie to potwierdzi. |
| **`sum.bought` + `złoty` („kupił jeszcze 2 złote”) w E1.3 CHOOSE_OP.** (bez triggera S-14d; dotyczy CHOOSE_OP) | `2026-10-12-generators-remaining-stages` | **W zakresie, jeśli faza CHOOSE_OP dotyka szablonów** (flaga kontekstu `buyable`); inaczej zostaje. |
| **S13-09 `blockDrag` `down` z tym samym `pointerId`.** `Trigger: next change to blockDrag` | `2026-10-14-drawn-grid-tasks-e3-e4` | **Warunkowo** — tylko jeśli decyzja 5 wybierze wspólne jądro gestu (wtedy `blockDrag` się zmienia). |
| „Tryb z obrazkami” pominięty (S-06) `Trigger: S-14` | `2026-10-13-first-launch-placement` | **W zakresie** (zgodnie z blokiem roadmapy) — w zawężonej formie decyzji 2. |

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Wybrane: research. Odrzucone: plan od razu. Dlaczego: 5 nowych
   generatorów, nowy rysunek w kafelkach, trzecia gałąź `drag` z nowym reduktorem, helpery e2e każdej suity, tryb
   wpływający na dobór rundy (`buildAdaptiveRound`) i skutek dla `calendarStart`/rozgrzewki — wiele punktów styku.
   Zmieniłoby: nic (krok narzucony przez orkiestratora).
2. **„Tryb z obrazkami” = preferencja doboru, nie nowy ekran ani ustawienie.** Wybrane: czysta funkcja w core (wiek 6
   albo aktywne łagodzenie w E1 → runda E1 bierze najpierw umiejętności z `Task.visual`; ZADANIA § 1 „mniejszy zakres,
   tryb z obrazkami”), autoczytanie zostaje jak jest (domyślnie włączone w E1). Odrzucone: osobny układ ekranu bez tekstu
   (kit nie ma widoku — wymyślanie); przełącznik rodzica (pole w `Settings` → v3). Dlaczego: zero stanu w zapisie,
   żadnego wymyślonego UI, zgodność z kontraktem. Zmieniłoby: autor albo teacher read uzna, że 6-latek potrzebuje
   polecenia bez tekstu (wtedy ekran z kitu albo DESIGN-GAP i osobny slice), albo zgoda na v3.
3. **Zakres, żeby slice był wysyłalny.** W zakresie: SHAPES, PATTERN, COMPARE_QTY (E1.1 grywalny), ORDINAL (E1.2),
   CHOOSE_OP z obrazkiem (E1.3), MONEY_PAY (E1.11, E2.2), tryb z obrazkami (decyzja 2), O4 `count_5`. Poza (follow-upy
   z triggerami przy archiwum): **SPATIAL** (brak sceny w kicie i paczkach → `Trigger: art for a SPATIAL scene or S-16`),
   **SYMMETRY** i **BONDS „połącz pary”** (nowe tryby odpowiedzi: przełączanie kratek, łączenie par →
   `Trigger: a toggle-cells or pairing answer mode`), oś-podpowiedź E1, E1.10 `place_read_12`. Kolejność faz dla planu:
   najpierw treść kafelkowa (SHAPES/PATTERN/COMPARE_QTY/ORDINAL/CHOOSE_OP — jeden nowy rysunek, tryb `tiles`/`select`),
   potem tryb z obrazkami, na końcu MONEY_PAY (reduktor, widżet, gałąź sceny, helpery e2e). Jeśli faza MONEY_PAY
   przekroczy budżet kontekstu runu, plan dzieli ją na „core + widżet” i „scena + e2e”, nie wycina. Odrzucone: cały
   blok roadmapy (SPATIAL bez grafiki = wymyślanie; dwa nowe tryby odpowiedzi podwajają ryzyko e2e). Zmieniłoby: research
   pokaże, że SYMMETRY mieści się w `select` (kratki jako kafelki) — wtedy wchodzi; grafika sceny w paczkach.
4. **ORDINAL na kafelkach („który z kolei od lewej jest …?”), bez „dotknij czwartego”.** Wybrane: tryb `tiles`.
   Odrzucone: dotyk w rysunku (nowy tryb odpowiedzi i nowe cele hooka). Dlaczego: obie formy są w ZADANIA; kafelki
   używają gotowego trybu i helperów. Zmieniłoby: teacher read uzna, że 6-latek nie zna liczebników porządkowych w
   kafelkach → wariant dotyku jako follow-up.
5. **MONEY_PAY: osobna gałąź `DragMode` `'coins'` z własnym czystym reduktorem, bez przerabiania `blockDrag`.**
   Rekomendacja dla planu: wzorzec S-13b (`clockSet.ts` obok `blockDrag.ts`); wspólne jądro gestu (próg startu
   `balance.blockDrag.startDistance`, niesienie, upuszczenie) tylko jeśli research pokaże większość wspólnego kodu.
   Portfel jako lista położonych nominałów (zdejmowanie dotknięciem), wartość i „najmniej monet” liczone w core
   (algorytm zachłanny dla polskich nominałów). Odrzucone: uogólnienie `BlockKind` na nominały (miesza model klocków
   1/10/100 z monetami, rusza S-13 i S-13b drag). Zmieniłoby: research znajdzie ≥ 70 % wspólnego kodu albo plan-review
   uzna duplikację gestu za ryzyko.
6. **Odpowiedź MONEY_PAY = wartość portfela (grosze); „najmniej monet” sprawdzane przez `Task.check`.** Wybrane:
   `answer` liczba groszy, `check` dla wariantu „najmniej monet” (liczba monet = minimum zachłanne). Odrzucone: odpowiedź
   jako lista nominałów (wiele poprawnych zestawów dla zwykłego wariantu). Dlaczego: `check` już istnieje (EVEN_ODD,
   INEQUALITY S-14c). Zmieniłoby: research pokaże, że `check` nie działa dla `drag` (wtedy plan rozszerza).
7. **Zapis zostaje v2.** Wybrane: żadnego pola. Dlaczego: kontrakt; tryb z wieku i łagodzenia (decyzja 2). Zmieniłoby:
   wymóg zapisanego przełącznika trybu albo stanu portfela między sesjami → v3 → slice kończy na otwartym PR.
8. **Grafika:** monety i 12 ikon już w grze; +12 ikon z paczki expansion tylko jeśli research pokaże za małą
   różnorodność (inwarianty) dla ORDINAL/COMPARE_QTY. Portfel rysowany w kodzie + DESIGN-GAP. Zmieniłoby: autor dostarczy
   grafikę portfela.
