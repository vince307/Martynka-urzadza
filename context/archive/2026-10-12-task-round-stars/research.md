---
date: 2026-10-12T21:14:03+02:00
researcher: Claude (krok /10x-research, run 2026-10-12-s04-s08)
git_commit: 84d63ea
branch: feat/task-round-stars
repository: Martynka-urzadza
topic: "S-04 task-round-stars: automat rundy w core, polityka podpowiedzi wobec zmierzonych wycieków wyniku, kafelki E1 i tryb 'select', podział scen i widżetów, cele dotykowe, budowa haka e2e poza bundlem produkcyjnym, pokrycie ryzyka #11"
tags: [research, round, stars, hints, tiles, select, phaser4, ui-scene, e2e, test-hook, M2]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (krok /10x-research)
---

# Research: S-04 task-round-stars

**Date**: 2026-10-12T21:14:03+02:00
**Researcher**: Claude (krok /10x-research, run 2026-10-12-s04-s08)
**Git Commit**: 84d63ea
**Branch**: feat/task-round-stars
**Repository**: Martynka-urzadza

## Research Question

Pytania z `change.md` (§ Roadmap claims vs repo now, § Open questions for /10x-research, § Triggered follow-ups)
i z promptu kroku:

1. Automat rundy w `core`: 5 zadań, kropki postępu, pierwsza próba → podpowiedź → druga próba → rozwiązanie krok
   po kroku + przepisanie wyniku; gwiazdki za zadanie (także w drugiej próbie), bonus za czystą rundę, gwiazdek nigdy
   nie ubywa.
2. Polityka podpowiedzi wobec zmierzonych wycieków wyniku w `hint[0]`: które generatory potrzebują nieprzeciekającej
   pierwszej podpowiedzi (F14 i szerzej), czy maskowanie wystarcza.
3. Kafelki dla liczbowych umiejętności E1 (`SkillDef.answer`, dystraktory z `numberChoices`, które generatory muszą
   dać `choices`) i tryb wielokrotnego zaznaczania dla dwóch umiejętności `'select'`.
4. Podział scen (Task, nakładka UI z licznikiem gwiazdek) i widżety do `src/ui/widgets/`; dotyk < 100 ms, cele
   ≥ 96 px w 1920×1080; czcionka.
5. Hak testowy tylko dla e2e bez ruszania wpisu `webServer` aplikacji należącego do `/10x-e2e-setup`; dowód, że
   hak nie trafia do `dist/` produkcyjnego.
6. Które ryzyka planu testów slice pokrywa e2e (#11) i nieaktualny wiersz 5 w `test-plan.md` §3.
7. Design: wiązane widoki i sekcje specyfikacji, istniejące komponenty współdzielone, kopia z kitu kontra luki.

## Summary

- **Runda (P1).** PRD jest spójny co do liczb: 1 gwiazdka za zadanie rozwiązane w pierwszej lub drugiej próbie,
  +2 za rundę bez błędu, przepisanie wyniku po rozwiązaniu bez gwiazdki, gwiazdek nigdy nie ubywa
  (`context/foundation/prd.md` US-01, FR-006, FR-007, FR-008; `Martynka-urzadza.md` §6 „Ekran zadań”). Milczy
  o tym, co po błędnym przepisaniu wyniku, i czy krok „Dalej” jest przyciskiem. Rekomendacja: czysty reduktor
  `src/core/round.ts` z fazami `first → second → solution → retype → done` (szczegóły niżej); błędne przepisanie
  zostaje w `retype` (brak stanu porażki).
- **Podpowiedzi (P2).** Z 21 generatorów 8 typów ma bezpieczną pierwszą linię zawsze, a w wieloliniowych
  podpowiedziach ADD_SUB i MULT linia 0 nie zawiera wyniku w żadnym zmierzonym zadaniu (wycieki ADD_SUB 554/1050
  i MULT 173/350 to dokładnie zadania z podpowiedzią jednolinijkową). Ogólne maskowanie („… = ?”) **nie** jest
  bezpieczne: przy ROUNDING chowa górną granicę, przy COMPLEMENT i DIV wynik stoi w środku linii, a przy ADD_SUB/MULT
  maska tylko powtarza pytanie. Rekomendacja: zostaje decyzja 3 z `change.md` (pokaż `hint[0]` tylko przy ≥ 2 liniach
  i gdy linia 0 nie kończy się wynikiem; inaczej sama „Spróbuj jeszcze raz”), F14 naprawiony w `generateMissing`,
  pozostałe typy klasy „c” do follow-upu `Trigger: S-17`.
- **Kafelki E1 (P3).** 10 umiejętności E1 jest na klawiaturce; żaden generator nie czyta `skill.answer`, wszystkie
  `choices` powstają dziś w generatorach. Symulacja 10 × 1000 losowań: `numberChoices(answer, rng, {count: 3|4,
  min: 0, max})` nie rzuca ani razu, pozycja odpowiedzi ~równomierna. BONDS potrzebuje granicy = wylosowana suma
  (inaczej kafelek 5 przy „4 = 1 + □”). Rekomendacja: wspólne wejście w `core` (np. `generateTask`) dokładające
  `choices` dla `'tiles'` bez `choices`, BONDS ustawia własne; nowy niezmiennik „`'tiles'` ⇒ choices z odpowiedzią”.
  Tryb `'select'`: wyłączyć 2 umiejętności z losowania w S-04 (roadmapa przypisuje pierwszy `select` do S-13).
- **Sceny (P4).** `TaskScene` + równoległa `UIScene` (licznik gwiazdek) uruchamiana przez `scene.launch`, licznik
  przez `this.registry` (`changedata-stars`). Phaser przelicza dotyk przy `Scale.FIT` sam. Widżety: kafelki,
  klawiaturka, kropki postępu, licznik, pasek podpowiedzi/kroków. Czcionka w kicie jest **TTF**, a glob prekeszu
  nie obejmuje `ttf` — trzeba dodać `ttf` do `globPatterns` albo przekonwertować do `woff2`.
- **Hak e2e (P5).** Zmierzone: flaga `define` (wzorem `__BUILD_ID__`) ustawiana z `process.env` i `if (__FLAG__)`
  usuwa moduł haka z bundla (eksperyment Vite 6 + terser: znacznik 0 trafień w buildzie bez flagi, 1 z flagą).
  Rekomendacja: klucz `env` we wpisie `webServer` aplikacji (dozwolony dodatek wg
  `.claude/skills/10x-e2e-setup/references/playwright-setup-templates.md` § „Who owns what in the config”;
  Playwright scala `env` z `process.env`), bez drugiego serwera i portu. Dowód braku: grep znacznika w `dist/`
  po `npm run build` w CI i asercja w `scripts/check-deploy.ts` na żywych bundlach.
- **Ryzyka (P6).** Slice pokrywa e2e tylko #11 (runda dotykiem); #9 (nakładka „Obróć tablet”) nadal nie ma speca
  mimo statusu fazy 5; wiersz fazy 5 w `test-plan.md` §3 mówi „not started”, choć seed #8 działa — nieaktualny.
- **Design (P7).** Kit daje kopię „Brawo!”, „Dalej”, „Spróbuj jeszcze raz”, „Następny krok”, „Już wiem”, „Oblicz”,
  „kasuj”, „OK” i zdania pasków kroków; konflikty z planem: przycisk „Podpowiedź” przed błędem, „Pokaż kroki” po
  pierwszym błędzie, „Do pokoju” w HUD w trakcie zadania (FR-011), druga próba po krokach zamiast przepisania bez
  gwiazdki. Plan wygrywa (profil §6), luki do `docs/design-gaps.md`.

## Detailed Findings

### 1. Automat rundy i gwiazdki

Źródła wymagań (cytaty):
- `prd.md` US-01 AC: „Błędna odpowiedź pokazuje podpowiedź i drugą próbę; nigdy czerwonego krzyżyka, licznika czasu
  ani ujemnej zmiany gwiazdek”; „Runda bez błędu daje 5 + 2 gwiazdki; runda z drugimi próbami daje 1 gwiazdkę za każde
  zadanie rozwiązane w drugiej próbie”; „każdy cel dotykowy ma co najmniej 96 px w scenie 1920×1080”.
- FR-006: kafelki 3–4 lub klawiaturka 0–9 z „kasuj” i „OK”, kropki postępu, długość rundy (domyślnie 5) w danych balansu.
- FR-007: 1 gwiazdka za poprawne zadanie (także w drugiej próbie), +2 za rundę bez błędu, druga próba nie liczy się
  do opanowania („historia rozróżnia pierwszą i drugą próbę”).
- FR-008: po błędzie delikatne potrząśnięcie i pierwsza podpowiedź, druga próba; po drugiej pomyłce rozwiązanie
  krok po kroku, potem „jeszcze raz wpisuje wynik (bez gwiazdki)” i przechodzi dalej.
- FR-011: licznik gwiazdek zawsze widoczny; przełącznik zadania/pokój ukryty w trakcie zadania.
- `Martynka-urzadza.md` §6 (wartości startowe `balance.ts`): runda 5, 1 gwiazdka za zadanie, +2 za rundę bez błędu,
  druga próba 1 gwiazdka bez zaliczenia do opanowania; §9: „ogranicz ruch” wyłącza lot gwiazdki.

Milczenia i niejasności (rekomendacja w nawiasie):
- „Bez błędu” — czy zadanie rozwiązane w drugiej próbie kasuje bonus: implikowane tak (bonus tylko gdy każde zadanie
  rozwiązano w pierwszej próbie).
- Błędne przepisanie wyniku po rozwiązaniu: brak (zostać w `retype`, ponownie pokazać wynik, bez kary; brak stanu porażki).
- „Wpisuje” przy kafelkach: brak (dotknięcie właściwego kafelka; kafelek odpowiedzi może być wyróżniony — decyzja planu).
- Przejście po poprawnej odpowiedzi: plan §6 „następne zadanie”, kit `correct.png` ma „Brawo! +1 ★” i przycisk „Dalej”
  (rekomendacja: „Dalej” z kitu — tempo w rękach dziecka, e2e stuka „Dalej”; lot gwiazdki trwa równolegle, NFR
  „nie blokuje przejścia” spełniony). Alternatywa: auto-przejście po krótkim czasie — to też jest „timer” w odczuciu
  dziecka, odrzucam.
- Potrząśnięcie: tylko „delikatne”, bez parametrów (wartości w `src/data/balance.ts` lub `layout.ts`).

Rekomendowany model (`src/core/round.ts`, czysty, TDD):
- `RoundState { tasks: Task[]; index; phase: 'first'|'second'|'solution'|'retype'|'done'; solutionStep; outcomes: ('first'|'second'|'retype'|null)[]; starsEarned }`
  oraz funkcje `answer(state, input)`, `nextSolutionStep(state)`, `advance(state)`.
- Przejścia: `first` + dobra → `done` (+1, outcome `first`); `first` + zła → `second` (pokaż pierwszą podpowiedź wg P2);
  `second` + dobra → `done` (+1, outcome `second`); `second` + zła → `solution` (kroki `hint` po kolei, „Następny krok”,
  ostatni „Już wiem”) → `retype`; `retype` + dobra → `done` (+0, outcome `retype`); `retype` + zła → `retype`.
- Koniec rundy: bonus `+2` gdy wszystkie outcomes = `first`. Niezmiennik do testu właściwości: `starsEarned` nigdy
  nie maleje, suma ∈ [0, 5·1 + 2]; zadanie płaci najwyżej raz (kit `preview.js` `check()`, „paid”).
- Kropki postępu: stan z `outcomes` + `index` (kit: bieżąca turkusowa z halo, zrobione zielone `#a6cf7f`, przyszłe puste).
- Porównanie odpowiedzi: `task.check?.(input) ?? input === task.answer` wystarcza; odpowiedzi i kafelki pochodzą
  z tych samych stałych (`opSign` z U+2212, `SIGNS`), więc bez normalizacji; klawiaturka daje liczbę.
- Historia `firstTry` do `LearnerState.history` (`src/core/types.ts`) — zapis dopiero S-11, ale outcome rundy już
  rozróżnia pierwszą i drugą próbę (FR-007).

### 2. Polityka podpowiedzi — pomiar wycieków

Pomiar: każda umiejętność E1–E6, 50 ziaren (4 850 zadań), skrypt jednorazowy w scratchpadzie. „Wyciek” = wynik jako
osobny token w `hint[0]`, po odsianiu przypadkowych zbieżności (np. BONDS, CHAIN, SEQUENCE).

| Typ | Budowa podpowiedzi (symbol) | Linie | `hint[0]` zdradza | Klasa |
|---|---|---|---|---|
| ADD_SUB | `generateAddSub` → `addSubHint` | 1–3 | 53% (tylko jednolinijkowe) | a (wielolinijkowe) / c (1 linia) |
| MISSING | `generateMissing` (`pl.tasks.missingHint`) | 1 | 100% | b (niewiadoma składnik) / c (niewiadoma wynik) — F14 |
| COMPLEMENT | `generateComplement` → `pl.tasks.complementHint` | 1 | 100%, w środku linii | c |
| ROUNDING | `generateRounding` → `pl.tasks.roundingHint` | 2 | 0% realnie (wynik = jedna z granic w linii 0) | a |
| MULT | `generateMult` → `multHint` | 1–3 | 49% (tylko jednolinijkowe, gałąź `a≤2 \|\| b≤2 \|\| b∈{5,10,100}`) | a / c |
| DIV | `generateDiv` (linia `d · q = d·q`) | 1 | 100%, w środku | b (maska pozycyjna) |
| HALF | `generateHalf` | 2 | 100% (obie linie) | c |
| COMPARE_NUM | `generateCompareNum` (`describe`, `largeHint`, `pl.tasks.compareEqualHint`) | 1–4 | przypadek równych liczb (21%): „To takie same liczby” zdradza „=” | a / c |
| EVEN_ODD | `generateEvenOdd` (`pl.tasks.evenOddHint`, `selectEvenHint`) | 1 | 100% wariantu single | b / a (select) |
| NUMBER_WORDS | `generateNumberWords` → `hintFor` | 1 | ~100% | c |
| ROMAN | `generateRoman` → `pl.tasks.romanHint` | 1 | do liczby: trailing; do rzymskich: rozpisuje cyfry | b / c |
| CALENDAR | `generateCalendar` (`weekdaysList`, `monthsList`, `knuckleHint`, `quarterHint`, `romanMonthHint`) | 1–2 | listy zawierają odpowiedź jako ściągę (OK); kwartał zdradza | a / c (kwartał) |
| WORD | `generateWord` → szablony `src/data/wordTemplates.ts` | 1–2 | 87% (jednolinijkowe) | b / a (dwukrokowe) |
| COMPARE_DIFF | `generateCompareDiff` | 1 | 100% | b |
| BONDS, CHAIN, CHOOSE_OP, COMPARE_EXPR, MISSING_OP, FACT_FAMILY, SEQUENCE | odpowiednie `generate*` | 2–3 | 0% realnie | a |

Wnioski:
- W tym zestawie (4 850 zadań) linia 0 wielolinijkowej podpowiedzi zdradza wynik tylko w HALF (obie linie
  zawierają wynik; linia 0 kończy się nim). Reguła „≥ 2 linie i `hint[0]` nie kończy się tokenem wyniku” przepuszcza
  wszystkie bezpieczne linie 0 i blokuje HALF; ROUNDING zostałby zablokowany fałszywie w ~58% (linia 0 „68 jest
  między 60 a 70” kończy się wynikiem 70) — bezpieczne, ale traci dobrą podpowiedź. Plan może wyjąć ROUNDING jawną
  listą typów albo zaakceptować stratę.
- Maskowanie ogólne odrzucone (dowód wyżej). Maska per typ działa dla MISSING (składnik), WORD/COMPARE_DIFF
  jednolinijkowych, EVEN_ODD single, ROMAN do liczby, DIV (pozycyjnie) — to zmiana treści/typów, a nie reguła rundy;
  rekomenduję ją jako S-17 razem z klasą c, poza F14.
- F14 (`context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md`): `generateMissing` zwraca dziś jedną
  linię — `Policz w drugą stronę: 16 − 9 = 7` (niewiadomy składnik) albo gołe `5 − 2 = 3` (niewiadomy wynik). F14 każe
  najpierw pokazać działanie odwrotne bez wyniku, a wynik dopiero w rozwiązaniu. Rekomendacja: dla składnika dwie linie
  (`Policz w drugą stronę: 16 − 9` bez wyniku, potem `16 − 9 = 7`); dla wyniku zostaje jedna linia (to samo działanie
  co pytanie — reguła rundy pokaże samo „Spróbuj jeszcze raz”).
- Testy, które zmiana podpowiedzi musi utrzymać: `tests/contentInvariants.test.ts` (`ARITHMETIC_LINE` sprawdza
  arytmetykę czystych linii; **ostatnia** linia arytmetyczna musi zawierać wynik; liczby w podpowiedzi ≤ granica
  umiejętności; linia z „?” lub „□” przestaje pasować do regexu i po cichu wypada ze sprawdzenia),
  `src/core/tasks/validate.ts` `validateTask` (pusta podpowiedź, `NEGATIVE_NUMBER`, zgodność liczebników ze
  słownikiem `src/data/nouns.ts`, `ACCUSATIVE_ONE`).
- Kit pokazuje podpowiedź jako zdanie metody („Najpierw dodaj 20, potem 7.”); dane mają linie działań — zdania metody
  to treść S-17. Kopia pasków kroków z kitu: „Dodajemy po kolei.”, „Liczymy po kolei.”, „Liczymy razem.”.

### 3. Kafelki E1 i tryb 'select'

- Tryby (z `stages` w `src/data/curriculum/index.ts`): E1 10 keypad / 7 tiles / 1 select; E2 8/2/0; E3 11/4/1;
  E4 12/1/0; E5 10/4/0; E6 10/3/0; `'drag'` nieużywany. Helper `skill` w `src/data/curriculum/E1.ts` ma domyślne
  `'keypad'`, komentarz pliku „Numeric answers use the keypad”.
- 10 liczbowych umiejętności E1 (wszystkie odpowiedzi `number`, bez `choices`): `E1.3.add_sub_5` (0..5),
  `E1.3.missing_5` (1..5), `E1.3.bonds_5` (1..4), `E1.4.bonds_6_7` (1..6), `E1.5.add_sub_9` (0..9), `E1.5.chain_9`
  (1..9), `E1.5.word_9` (1..9, odpowiedź 1 ~30%), `E1.7.bonds_10` (1..9), `E1.7.complement_10` (1..9),
  `E1.9.add_sub_10` (0..10). Granica BONDS przez `boundOf` w `src/core/tasks/bounds.ts` (największa z `totals`).
- `choices` dziś: wyłącznie w generatorach (COMPARE_NUM/EXPR `SIGNS`, MISSING_OP, EVEN_ODD, CALENDAR, ROMAN,
  NUMBER_WORDS, CHOOSE_OP; `numberChoices` w ROMAN, NUMBER_WORDS `any`, CALENDAR timeFacts — wszędzie `count: 3`).
  Żaden generator nie czyta `skill.answer`. Nigdy nie dają `choices`: ADD_SUB, MISSING, BONDS, CHAIN, WORD, COMPLEMENT,
  MULT, DIV, HALF, ROUNDING, SEQUENCE, FACT_FAMILY, COMPARE_DIFF.
- Symulacja `numberChoices` (`src/core/tasks/distractors.ts`) dla 10 umiejętności × 1000 × count 3 i 4,
  `min: 0`, `max = boundOf`: 0 wyjątków; odpowiedź 0 działa; pozycja odpowiedzi 31–36% (3) / 22–29% (4).
  Osobliwości: przy odpowiedzi 10 kandydaci `swapDigits(10)=1` i `10−10=0` (80/1000 zadań z kafelkiem dalej niż ±2);
  BONDS z `max` = największa suma daje niemożliwe kafelki (5 przy „4 = 1 + □”) i 0 mimo `zero: false`.
- `validateTask` sprawdza dla `choices` tylko: brak ujemnych, brak duplikatów, odpowiedź (nie-tablica) wśród kafelków.
  Nie sprawdza liczności 3–4, granic ani tego, że umiejętność `'tiles'` w ogóle ma `choices`; tego niezmiennika nie ma też
  w `tests/contentInvariants.test.ts` (klucz różnorodności tam to `prompt|choices`, więc dodanie kafelków sztucznie
  zawyża różnorodność — uwaga z archiwum S-03, research §4.4).
- Rekomendacja: jedno wejście w `core/tasks` (np. `generateTask(skill, rng)`): woła generator, a gdy
  `skill.answer === 'tiles'` i brak `choices`, dokłada `numberChoices(answer, rng, {count, min, max: boundOf(skill)})`
  po wygenerowaniu (rng zużyty po generatorze, więc istniejące testy i ziarna bez zmian). BONDS ustawia `choices`
  sam (zna wylosowaną sumę; min 1 przy `zero: false`). `count` z `balance.ts` (kit `task-tiles.png` ma 4 kafelki).
  Niezmiennik przez `generateTask` dla każdej umiejętności: `'tiles'` ⇒ 2–4 unikalne kafelki z odpowiedzią w granicach;
  `'keypad'` ⇒ odpowiedź liczbowa, nieujemna. Runda i `scripts/sample.ts` używają `generateTask`, inaczej
  czytanie nauczycielskie E1 nie zobaczy kafelków.
- `'select'`: `E1.6.even_odd_select_10` i `E3.7.select_even_30` (`generateEvenOdd`: 6 kafelków `SELECT_TILES`, 2–4
  parzyste, `answer: number[]`, `check` przez `sameSet`). Roadmapa § S-13 (Risk) wprowadza pierwsze tryby „drag”
  i „select”; archiwum `2026-10-12-generators-e3-e4/plan-brief.md` mówi „UI select dojdzie w S-04/S-13”; przepływ
  „przepisz wynik” jest dla wielu odpowiedzi niezdefiniowany, kit nie ma widoku. Rekomendacja: filtr w `core` wyłącza
  `'select'` (i `'drag'`) z losowania S-04, follow-up `Trigger: S-13`; kroki E1.6 i E3.7 mają inne umiejętności
  (`E1.6.even_odd_single_10`, `E3.7.even_odd_30`, `E3.7.number_words_30`), więc żaden krok nie zostaje pusty.
  Minimum, gdyby plan chciał teraz: 6 przełączanych kafelków + „Gotowe” (kopii brak w kicie → DESIGN-GAP).

### 4. Sceny, widżety, dotyk, czcionka

- Dziś: `src/main.ts` `createGame` z `scene: [BootScene]`, bez sekcji `input`; wynik `createGame` jest porzucany
  (gra nie jest nigdzie wystawiona). `src/scenes/BootScene.ts` używa `fontFamily: 'sans-serif'`.
  `src/data/layout.ts`: `GAME_WIDTH`, `GAME_HEIGHT`, `MIN_TOUCH_TARGET = 96`, `PLACEHOLDER_COLORS` (ivory, turquoise,
  deepTeal, butter), `FONT_SIZES` (title 112, subtitle 48, caption 32). `src/data/pl.ts` nie ma sekcji ekranu zadań.
  `src/ui/widgets/` pusty; `src/ui/dom/overlay.ts` (`createOverlay`, `createText`, `createButton`) dotyczy nakładek DOM.
- ESLint (`eslint.config.mjs`): `src/core/**` bez Phasera i globali przeglądarki; `src/data/**` importuje z `core`
  tylko `core/text/*` i typy; sceny/ui mają globale przeglądarki. **Brak** reguły zakazującej literałów tekstu/liczb
  w scenach — zasada „bez tekstu i liczb balansu w scenach” jest konwencją sprawdzaną w review.
- Phaser 4.2.1 (`node_modules/phaser/types/phaser.d.ts`): `ScenePlugin.launch`/`run`, `bringToTop`; globalny
  `this.registry` (`DataManager`) z `registry.events.on('changedata-<key>')`; mapowanie wskaźnika przy `Scale.FIT`
  automatyczne (`InputManager.transformPointer`, `ScaleManager.displayScale`); `setInteractive()` + `'pointerdown'`;
  `input.topOnly` domyślnie true; `this.tweens.add` (potrząśnięcie: `x` z `yoyo`/`repeat`), `this.tweens.chain`
  (lot gwiazdki), `killTweensOf`; `this.load.font(key, url, format)` dodaje `FontFace` przed pierwszym tekstem.
- Rekomendacja scen: `BootScene` ładuje czcionkę i startuje `TaskScene` + `scene.launch('UI')`; `TaskScene` trzyma
  `RoundState` z `core` i renderuje; `UIScene` rysuje licznik z `registry` (`stars`). Przełącznik zadania/pokój nie
  rysowany (decyzja 2 z `change.md`; kit ma „⌂ Do pokoju” w HUD, sprzeczne z FR-011 w trakcie zadania).
- Widżety (`src/ui/widgets/`): `AnswerTiles` (3–4 kafelki, 254×136 w kicie), `Keypad` (klawisze 104 wys. × ~161,
  odstęp 16, „kasuj”, „OK”, pole wpisu 124 wys.), `ProgressDots` (5 kropek 40 px, odstęp 22), `StarCounter` („★ 12”,
  196 px), `HintBar`/`SolutionSteps` (żółty pasek ≥ 100 wys., „Następny krok”/„Już wiem”). Przycisk HUD w kicie ma
  min. 104 wys. Wszystkie cele ≥ 96 px (`MIN_TOUCH_TARGET`) — kafelek 136 wys., klawisz 104 wys. spełniają.
- Dotyk < 100 ms (NFR): reakcja wizualna (podświetlenie kafelka/wpis cyfry) w handlerze `pointerdown`, bez czekania
  na tweeny; tylko ręczny pomiar na iPadzie (`test-plan.md` §8 Open: wydajność poza e2e).
- Czcionka: kit ma `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf` (114 KB, TTF) + `OFL.txt`.
  `vite/config.shared.mjs` `pwaOptions.workbox.globPatterns` nie obejmuje `ttf` → czcionka spoza prekeszu złamałaby
  offline. Opcje: (a) dodać `ttf` do glob i skopiować TTF + `OFL.txt` do `public/fonts/`; (b) konwersja do `woff2`
  (brak narzędzia bez natywnych zależności w repo); (c) odłożyć do S-16. Rekomendacja (a): NFR wymaga lokalnej czcionki
  z polskimi znakami, a seed #8 i tak sprawdzi start offline. Rozmiary do `FONT_SIZES`: polecenie 64, odpowiedź 90,
  klawisz 58, działanie 112, podpowiedź 30–34; kolory do `PLACEHOLDER_COLORS`: kafelki `#E3F0D9`, poprawna `#E5F2D4`,
  podpowiedź `#FFF0B9`, kropka zrobiona `#a6cf7f`.

### 5. Hak e2e poza produkcją

- Dziś: `playwright.config.ts` ma jeden wpis `webServer` (`npm run build && npm run preview -- --port ${PORT} --strictPort`,
  `reuseExistingServer: !process.env.CI`), zapisany w `context/foundation/test-stack.md` § E2E (właściciel
  `/10x-e2e-setup`). Kontrakt runu: jedyny dodatkowy port to port E2E (4398).
- Zasady własności (`.claude/skills/10x-e2e-setup/references/playwright-setup-templates.md` § „Who owns what in the
  config”): `/10x-e2e` może dodać wpisy tablicy dla serwerów mocków albo **klucz `env` we wpisie aplikacji lub krok
  między build i preview**; „an extra env variable is not a difference”, więc `test-stack.md` zostaje bez zmian.
- Playwright (`node_modules/playwright/lib/runner/index.js`, `launchProcess` w pluginie webServer) uruchamia komendę
  z `env: {...DEFAULT_ENVIRONMENT_VARIABLES, ...process.env, ...this._options.env}` — klucz `env` dochodzi do `vite build`.
- Eksperyment (minimalny projekt w scratchpadzie, poza repo; binarka `node_modules/.bin/vite` repo): `define: { __E2E_HOOK__: JSON.stringify(process.env.E2E_HOOK === '1') }`,
  `if (__E2E_HOOK__) installE2EHook(state)`, Vite 6 + terser: znacznik z modułu haka 0 trafień w buildzie bez flagi,
  1 trafienie z flagą — Rollup/terser usuwa martwą gałąź i nieużywany moduł bez efektów ubocznych.
- Rekomendacja: `vite/config.shared.mjs` dodaje `__E2E_HOOK__` do `define` (deklaracja w `src/vite-env.d.ts` obok
  `__BUILD_ID__`); moduł haka (np. `src/testing/e2eHook.ts`, nowy katalog wymaga wpisu w globach ESLint dla globali
  przeglądarki) bez efektów ubocznych na poziomie modułu; `src/main.ts` wywołuje go tylko w `if (__E2E_HOOK__)`.
  Wpis aplikacji dostaje `env: { E2E_HOOK: '1' }`. Odrzucone: (1) drugi wpis `webServer` z buildem do `dist-e2e/`
  na drugim porcie — łamie kontrakt (jeden dodatkowy port) i podwaja czas budowy; (2) `--mode e2e` w komendzie — zmienia
  komendę wpisu aplikacji, a nie tylko dokłada `env`; (3) DOM-owe lustro rundy — anty-wzorzec #11.
- Koszt: seed #8 biegnie na buildzie z hakiem (różnica = jeden moduł tylko do odczytu; `sw.js` i prekesz tworzone tak
  samo). Przy `reuseExistingServer` stary serwer bez haka da czytelny błąd „hak nie istnieje”, nie fałszywą zieleń.
- Dowód braku w produkcji: (a) po `npm run build` bez flagi grep znacznika haka w `dist/` = 0 — krok w `.github/workflows/ci.yml`
  i deploy (`build`), plus w lokalnej bramce; (b) `scripts/check-deploy.ts` `main` już pobiera każdy bundle z żywej
  strony (`bundlesFromHtml`) — dołożyć asercję braku znacznika. Uwaga: lokalny `dist/` po przebiegu e2e zawiera hak
  (build w `webServer`), więc grep lokalny musi iść po świeżym `npm run build`.
- Co hak wystawia (tylko odczyt, `Object.freeze`, gettery): indeks zadania, faza, poprawna odpowiedź bieżącego zadania,
  gwiazdki (runda i suma), outcomes, oraz środki celów (kafelki, klawisze, „Dalej”, „Następny krok”/„Już wiem”)
  w przestrzeni 1920×1080; test przelicza na CSS przez `canvas.getBoundingClientRect()` (skala = szerokość/1920 przy
  `Scale.FIT`, przesunięcie z `CENTER_BOTH`) i stuka `page.touchscreen.tap` przy `hasTouch: true` (projekt `chromium`
  w `playwright.config.ts` już go ma). Hak nie ma setterów — test nie ustawia stanu, który potem sprawdza (#11 anty-wzorzec).

### 6. Ryzyka planu testów

- #11 (`context/foundation/test-plan.md` §2): runda 5 zadań przez prawdziwy dotyk, gwiazdka za zadanie, zły dotyk →
  podpowiedź + druga próba z gwiazdką, czysta runda → bonus. Poziom: unit dla logiki w `core` (TDD) + lokalny e2e
  dla ścieżki dotyku. Rekomendowane scenariusze e2e: (1) czysta runda → +7 na liczniku/hak; (2) jeden zły dotyk →
  druga próba → +1 i brak bonusu; (3) dwa złe → kroki → przepisanie → +0. Asercje na stanie z haka i licznika, nie
  na tekście zadań (§8: e2e nie sprawdza pikseli ani treści).
- #8 seed zostaje (na buildzie z hakiem, patrz P5). #9 (nakładka portretowa) nie ma speca, choć faza 5 go wymienia — poza
  S-04; #10 po S-11.
- Nieaktualne w `test-plan.md`: §3 wiersz fazy 5 „not started” (seed działa od profilu 2026-10-12), tabela narzędzi
  „none yet — see Phase 5”, §6.6 „TBD”. Właściciel to `/10x-test-plan` — follow-up, nie ręczna edycja `context/foundation/`.

### 7. Design — wiązanie i kopia

- Wiązane widoki (`designs/martynka-maths-A-v1/screenshots/`): `task-tiles.png`, `task-keypad.png`, `hint-tiles.png`,
  `hint-keypad.png`, `second-try.png` (pikselowo jak `hint-tiles.png`), `solution-step-1.png`, `solution-step-2.png`,
  `correct.png`, `tablet-1024.png`. Sekcje `style-guide.md`: „Task states”, „Font and spacing”, „Palette and rendering”.
- Układ HUD (kit): y 40–152; „⌂ Do pokoju” 316 px po lewej; kropki wyśrodkowane; licznik „★ 12” 196 px po prawej;
  zeszyt left 180, top 204, 1560×788, ramka 16 px turkus. Klawiaturka: left 1040, top 342, szer. 516; działanie
  „38 + 27 = ?” 112 px po lewej. Kafelki: 4 × 254×136, odstęp 24, od x=416, y=724, cyfry 90 px. Poprawna: kafelek
  `#d7ebc1` z ramką `#547e3d`, pasek „Brawo! +1 ★” + „Dalej” (96 wys., min. 220), gwiazdka 100 px leci 850 ms.
- Kopia z kitu (dokładna): „Brawo!”, „Brawo! +1 ★”, „Dalej”, „Spróbuj jeszcze raz”, „Podpowiedź”, „Pokaż kroki”,
  „Następny krok”, „Już wiem”, „Oblicz”, „kasuj”, „OK”, „Dodajemy po kolei.”, „Liczymy po kolei.”, „Liczymy razem.”.
- Konflikty kit ↔ plan (plan wygrywa, wiersze w `docs/design-gaps.md`): przycisk „Podpowiedź” dostępny przed błędem;
  „Pokaż kroki” już po pierwszym błędzie; po krokach kolejna zwykła próba zamiast przepisania bez gwiazdki; „Do pokoju”
  w HUD w trakcie zadania (FR-011).
- Luki (DESIGN-GAP): tryb `'select'` (jeśli nie wyłączony), stan końca rundy przed S-05, stan „przepisz wynik” (brak
  osobnego tekstu w kicie; rekomendacja: ten sam żółty pasek z kopią kitu, bez nowego zdania).

## Code References

- `src/core/types.ts` `SkillDef.answer`, `LearnerState.history` — tryby odpowiedzi, rozróżnienie pierwszej próby
- `src/core/tasks/types.ts` `Task` (`answer`, `choices`, `hint`, `check`), `Generator`
- `src/core/tasks/distractors.ts` `numberChoices`, `pickChoices`
- `src/core/tasks/bounds.ts` `boundOf`; `src/core/tasks/registry.ts` `generators`
- `src/core/tasks/validate.ts` `validateTask`
- `src/core/tasks/generators/missing.ts` `generateMissing` (F14); `bonds.ts` `generateBonds`; `evenOdd.ts` `generateEvenOdd` (`SELECT_TILES`, `sameSet`)
- `src/data/curriculum/E1.ts` helper `skill`, 10 umiejętności keypad; `src/data/curriculum/E3.ts` krok 7
- `tests/contentInvariants.test.ts` `ARITHMETIC_LINE`, klucz różnorodności `prompt|choices`
- `src/main.ts` `createGame`; `src/scenes/BootScene.ts` `BootScene`; `src/data/layout.ts` `FONT_SIZES`, `PLACEHOLDER_COLORS`, `MIN_TOUCH_TARGET`
- `vite/config.shared.mjs` `sharedConfig.define`, `pwaOptions.workbox.globPatterns`; `src/vite-env.d.ts` `__BUILD_ID__`
- `playwright.config.ts` `webServer`, projekt `chromium` (`hasTouch`); `tests/e2e/seed.spec.ts`
- `scripts/check-deploy.ts` `main` (`bundlesFromHtml`); `.github/workflows/ci.yml` job `check`

## Architecture Insights

- `core` decyduje, scena renderuje: runda jako czysty reduktor nad `Task`, testowalny bez Phasera; scena zamienia
  dotknięcia na `answer(...)` i rysuje `phase`.
- Jedno wejście `generateTask` łączy generator z trybem odpowiedzi — generatory zostają czystymi funkcjami treści,
  a sample, walidator i runda widzą te same kafelki.
- Flagi budowania idą wzorem `__BUILD_ID__` (`define`), co daje usuwanie martwego kodu bez osobnej konfiguracji Vite.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-generators-remaining-stages/follow-ups/review-fixes.md` — „E1 numeric answers use the keypad … Trigger: S-04” (wspierane: nadal keypad); S-17: COMPLEMENT metoda krokowa, DIV dla nastolatków, szlif podpowiedzi E1–E2/E5–E6 (wspierane, otwarte).
- `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md` F14 — pierwsza podpowiedź MISSING zdradza wynik (wspierane: 150/150 w pomiarze `change.md`, potwierdzone tu).
- `context/archive/2026-10-12-generators-e3-e4/plan-brief.md` (EVEN_ODD) — „UI select dojdzie w S-04/S-13” (częściowo: roadmapa § S-13 przypisuje pierwszy select do S-13).
- `context/archive/2026-10-12-generators-remaining-stages/research.md` §4.4 — `choices` zawyżają różnorodność w `contentInvariants` (wspierane).
- `context/foundation/roadmap.md` § S-04 Decisions (2026-10-12) — kafelki E1 i hak e2e w osobnym buildzie (wspierane; nazwa pola to `answer`, nie `answerMode`).

## Related Research

- `context/archive/2026-10-12-generators-remaining-stages/research.md`
- `context/archive/2026-10-12-generators-e3-e4/research.md`

## Open Questions

Wybory dla `/10x-plan` (rekomendacja w nawiasie):
1. Przejście po poprawnej odpowiedzi: „Dalej” z kitu czy auto (Dalej).
2. ROUNDING przy regule podpowiedzi: zaakceptować fałszywe blokady czy jawnie wyjąć typ (wyjąć listą w `core`).
3. Czcionka: TTF + `ttf` w prekeszu teraz czy S-16 (teraz).
4. Liczba kafelków E1: 3 czy 4 (4 jak w kicie, z `balance.ts`).
5. `'select'`: wyłączyć z losowania do S-13 czy zbudować teraz (wyłączyć).
6. Gdzie stoi grep braku haka: CI + deploy + `check-deploy` (wszystkie trzy; lokalnie po świeżym `npm run build`).
Ręczne: reakcja na dotyk < 100 ms na iPadzie (opiekun).
