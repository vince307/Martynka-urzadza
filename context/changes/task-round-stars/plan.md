# Runda zadań dotykiem z gwiazdkami, podpowiedzią i drugą próbą — Implementation Plan

## Overview

Roadmapa S-04 (`task-round-stars`, etap M2, pierwszy wycinek z wejściem gracza). Dziecko gra rundę 5 zadań dotykiem
(kafelki albo klawiaturka 0–9 z „kasuj” i „OK”), widzi kropki postępu, dostaje 1 gwiazdkę za każde zadanie rozwiązane
w pierwszej lub drugiej próbie i +2 za rundę bez błędu. Po pierwszym błędzie: delikatne potrząśnięcie, podpowiedź (jeśli
pierwsza linia nie zdradza wyniku) i druga próba; po drugim błędzie rozwiązanie krok po kroku i przepisanie wyniku bez
gwiazdki. Licznik gwiazdek jest zawsze widoczny w równoległej scenie UI. Liczbowe odpowiedzi E1 przechodzą na 4 kafelki
(decyzja opiekuna 2026-10-12). Ryzyko test-planu #11 (runda przez prawdziwy dotyk) dostaje e2e przez hak tylko do
odczytu w osobnym buildzie e2e; seed #8 nadal testuje bundel produkcyjny, a `npm run build` sam pada, gdy znacznik haka
trafi do produkcji. Plus F14 (pierwsza podpowiedź MISSING zdradza wynik).

## Current State Analysis

Z `context/changes/task-round-stars/research.md` (sprawdzone na gałęzi `feat/task-round-stars` @ `7b4222e`):

- `src/main.ts` `createGame` rejestruje tylko `BootScene`; `src/scenes/BootScene.ts` rysuje placeholder `fontFamily: 'sans-serif'`.
  `src/ui/widgets/` jest pusty; `src/ui/dom/overlay.ts` dotyczy nakładek DOM.
- `src/data/layout.ts`: `MIN_TOUCH_TARGET = 96`, `PLACEHOLDER_COLORS` (ivory, turquoise, deepTeal, butter), `FONT_SIZES`
  (112/48/32). Brak kolorów kafelków (`#E3F0D9`), poprawnej (`#E5F2D4`), podpowiedzi (`#FFF0B9`), kropki zrobionej (`#A6CF7F`).
  `src/data/pl.ts` nie ma sekcji ekranu zadań. `src/data/balance.ts` nie istnieje.
- `Task` (`src/core/tasks/types.ts`): `answer`, `choices?`, `hint: string[]`, `check?`. `SkillDef.answer` (`src/core/types.ts`)
  = `'tiles' | 'keypad' | 'drag' | 'select'`. Żaden generator nie czyta `skill.answer`; `choices` dają tylko generatory
  znaków/napisów. 10 liczbowych umiejętności E1 ma domyślne `'keypad'` (helper `skill` w `src/data/curriculum/E1.ts`).
- `numberChoices` (`src/core/tasks/distractors.ts`) — zmierzone 10 umiejętności × 1000 × count 3/4: 0 wyjątków; BONDS
  z granicą `boundOf` daje niemożliwe kafelki (5 przy „4 = 1 + □”) — potrzebuje granicy = wylosowanej sumy.
- Wycieki `hint[0]` (4 850 zadań): wielolinijkowe podpowiedzi są bezpieczne poza HALF (linia 0 kończy się wynikiem)
  i ROUNDING (fałszywy alarm — „68 jest między 60 a 70” kończy się wynikiem 70, ale to dobra podpowiedź); jednolinijkowe
  zdradzają wynik (MISSING, COMPLEMENT, DIV, COMPARE_DIFF, ROMAN, EVEN_ODD, NUMBER_WORDS, część ADD_SUB/MULT/WORD).
  `generateMissing` (`src/core/tasks/generators/missing.ts`) zwraca jedną linię `pl.tasks.missingHint(inverse)` z wynikiem (F14).
- `'select'`: `E1.6.even_odd_select_10` i `E3.7.select_even_30` (`answer: number[]`); kroki E1.6 i E3.7 mają też inne umiejętności.
- `playwright.config.ts`: jeden `webServer` (`npm run build && npm run preview -- --port ${PORT} --strictPort`, port 4398),
  projekt `chromium` z `hasTouch`; seed `tests/e2e/seed.spec.ts` (#8) sprawdza start offline z `fromServiceWorker()`.
  Pola wpisu aplikacji i `context/foundation/test-stack.md` § E2E należą do `/10x-e2e-setup`.
- `vite/config.shared.mjs` `sharedConfig.define` ma `__BUILD_ID__`; `pwaOptions.workbox.globPatterns` nie obejmuje `ttf`.
  `vite/config.prod.mjs` ma `logLevel: 'warning'` (Vite `info` niewidoczne w logu CI). Zmierzone w research: `define`
  z `process.env` + `if (__FLAG__)` usuwa moduł haka z bundla (terser), znacznik 0 trafień bez flagi.
- Czcionka Atkinson Hyperlegible Next jest w śledzonym `designs/martynka-maths-A-v1/fonts/` (TTF 114 KB + `OFL.txt`).

## Desired End State

- `npm run dev` / build: gra startuje od razu w rundzie (etap domyślny E3 z `balance.ts`); kropki postępu, polecenie
  ≥ 64 px czcionką Atkinson, kafelki albo klawiaturka, licznik „★ N” w prawym górnym rogu przez cały czas.
- Poprawna odpowiedź: kafelek/wpis zielony, pasek „Brawo! +1 ★” i „Dalej”, gwiazdka leci do licznika (nie blokuje).
  Błąd: potrząśnięcie, żółty pasek z podpowiedzią albo samym „Spróbuj jeszcze raz”, druga próba. Drugi błąd: kroki
  rozwiązania („Następny krok” / „Już wiem”), potem przepisanie wyniku bez gwiazdki. Po 5. zadaniu bonus „+2 ★” za
  rundę bez błędu i „Dalej” zaczyna kolejną rundę. Gwiazdek nigdy nie ubywa.
- `src/core/round.ts` (reduktor), `src/core/round/*` lub równoważne pliki w `core` mają testy jednostkowe i właściwości;
  `generateTask` daje kafelki każdej umiejętności `'tiles'`; E1 liczbowe są `'tiles'` z 4 kafelkami.
- `npx playwright test` buduje dwa serwery: produkcyjny na 4398 (seed #8, bez zmian) i build z hakiem na 4397
  (spec #11); `npm run build` bez `E2E_HOOK=1` pada, gdy znacznik haka jest w którymkolwiek chunku, i drukuje
  `e2e hook: absent (N chunks checked)`.

### Key Discoveries:

- Phaser 4.2.1: `scene.launch` dla równoległej `UIScene`, `this.registry` + `changedata-<key>`, `setInteractive()` +
  `pointerdown`, `tweens.add`/`tweens.chain`/`killTweensOf`, `load.font(key, url)`; mapowanie wskaźnika przy `Scale.FIT`
  jest automatyczne (research §4).
- Playwright scala `env` wpisu `webServer` z `process.env` (`node_modules/playwright/lib/runner/index.js`); tablica
  `webServer` jest dozwolona (`test-stack.md` § E2E, kontrakt § E2E); serwery startują po kolei.
- `tests/contentInvariants.test.ts` liczy różnorodność po `prompt|choices` — kafelki dołożone przez `generateTask`
  sztucznie zawyżyłyby różnorodność, więc istniejące niezmienniki dalej wołają generator, a niezmiennik kafelków jest osobny.
- `src/core/**` nie importuje Phasera ani globali przeglądarki (ESLint + `tests/lint-boundaries.test.ts`); `src/data/**`
  importuje z `core` tylko `core/text/*` i typy. Liczby balansu wchodzą do `core` jako argumenty, nie importem z `data`.

## What We're NOT Doing

- Tryby `'select'` i `'drag'` — wyłączone z losowania rundy do S-13 (follow-up); żaden krok nie zostaje pusty.
- Podsumowanie rundy, „Kolejna runda”/„Do pokoju”, lektor (S-05); przełącznik zadania/pokój (S-05/S-09) — nie rysowany.
- Wybór etapu po wieku (S-06), odblokowywanie kroków i wagi 60/30/10 (S-07), ustawienie „ogranicz ruch” (S-08).
- Zapis gwiazdek (S-11) — gwiazdki żyją w pamięci sesji; przeładowanie je zeruje.
- Pełne podpowiedzi metodą szkolną dla typów klasy b/c (COMPLEMENT, HALF, DIV, WORD, COMPARE_DIFF, …) — follow-up S-17;
  zdania metody z kitu („Najpierw dodaj 20, potem 7.”) — treść S-17.
- E2E w CI (test-plan §7), WebKit, pomiar wydajności; spec #9 (nakładka portretowa) — follow-up.
- Asercja braku haka w `scripts/check-deploy.ts` na żywej stronie — patrz Autonomous decisions 7.
- Ręczna edycja `context/foundation/test-plan.md` (właściciel `/10x-test-plan`) — follow-up.

## Implementation Approach

Logika najpierw w `core` przez TDD (fazy 1–4), potem sceny i widżety po ≤ 2 komponenty na fazę (5–8), potem hak e2e
i strażnik bundla (9), seam sweep z profilem i dokumentami (10), na końcu spec e2e #11 (11). Każda faza zostawia grę
działającą i bramkę zieloną.

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build i e2e są w tym slice **bez zmian**.
Faza 9 dokłada strażnika do wnętrza `npm run build` (ta sama komenda; nowa linia w wyjściu) i drugi wpis `webServer`
do `npx playwright test` (ta sama komenda; dłuższy przebieg, port 4397). Faza 10 zapisuje port 4397 i opis w profilu
§ 2, § 3 i `context/foundation/autonomous-run.env` (tylko komentarze/opis; zmienne `GATE_*` bez zmian).

Liczby testów jako baseline + delta: baseline na `main` @ `58244a5` = `unit OK Tests 441 passed; e2e OK 1 passed`
(kontrakt). Każda faza mierzy na gałęzi przed zmianą i raportuje `<baseline gałęzi> + <nowe>`.

**Hak e2e — wybór (ograniczenie orkiestratora: seed #8 zostaje na buildzie produkcyjnym).** Wpis aplikacji
`webServer` zostaje bajtowo ten sam (build produkcyjny do `dist/`, preview na 4398) i dalej obsługuje projekt `chromium`
z seedem. Dochodzi drugi wpis tablicy: `E2E_HOOK=1` (przez `env`) build do `dist-e2e/` i `vite preview --outDir dist-e2e`
na porcie 4397 (`E2E_HOOK_PORT` nadpisuje; 4397 nie jest chroniony, profil § 3; nigdy 4173), oraz drugi projekt
`chromium-hook` (`baseURL` 4397, `testMatch` tylko spec rundy; projekt `chromium` dostaje `testIgnore` dla tego speca).
`dist-e2e/` do `.gitignore` i do `globalIgnores` ESLint. Odrzucone: `env` na wpisie aplikacji (rekomendacja research —
seed biegłby na buildzie z hakiem, wbrew ograniczeniu).

**Dowód braku haka w produkcji.** Plugin Vite `e2eHookGuard` w `vite/config.prod.mjs` (`generateBundle`): gdy
`process.env.E2E_HOOK !== '1'` i dowolny chunk zawiera znacznik `__martynkaE2E` → błąd builda; gdy `E2E_HOOK === '1'`
i żaden chunk go nie zawiera → też błąd (kontrola pozytywna: hak nie wyparował). Przy sukcesie drukuje
`e2e hook: absent (N chunks checked)` / `e2e hook: present (…)` przez `console.log` (logLevel `warning` ukrywa `info`).
Działa w bramce lokalnej (`npm run build`), w CI (job `check`) i w Deploy (job `build`) bez zmiany komend.

## Critical Implementation Details

**Kolejność rng.** `generateTask` dokłada kafelki **po** wywołaniu generatora, z tego samego rng — istniejące ziarna
i testy generatorów dają te same zadania. BONDS zna wylosowaną sumę, więc zwraca `tileRange` (nowe opcjonalne pole
`Task`), a `generateTask` używa `task.tileRange ?? { min: 0, max: boundOf(skill) }`. Liczba kafelków =
`min(tileCount, max − min + 1)`: BONDS z sumą 2 ma tylko 3 możliwe wartości {0, 1, 2}, a `numberChoices` przy count 4
rzuca `RangeError` (zmierzone w plan review: 54/600 zadań `E1.3.bonds_5` przy zakresie `{1, suma}`).

**Stan rundy jest jeden.** Scena trzyma `RoundState` z `core` i po każdej akcji rysuje `roundView(state)`; licznik w
`UIScene` czyta `registry` (`stars`), który `TaskScene` ustawia z `state`. Hak e2e czyta ten sam `RoundState` przez
publiczne metody `TaskScene` (`snapshot()`, `targets()`), nigdy przez DOM i nigdy nie ustawia stanu.

**Reakcja na dotyk < 100 ms.** Podświetlenie kafelka/wpis cyfry w handlerze `pointerdown` synchronicznie, przed
tweenami; lot gwiazdki i potrząśnięcie nie blokują wejścia (poza fazą `solution`, gdzie aktywne są tylko przyciski kroków).

## Phase 1: Kafelki E1 i wspólne wejście `generateTask`

Driver: tdd
Driver why: `generateTask`, `tileRange` i niezmiennik „`'tiles'` ⇒ kafelki z odpowiedzią” nie istnieją; failing test po danych etapów prowadzi zmianę (risk #1, #5).

### Overview

Jedno wejście w `core` łączy generator z trybem odpowiedzi: umiejętność `'tiles'` bez `choices` dostaje 4 kafelki
z `numberChoices`. 10 liczbowych umiejętności E1 przechodzi na `'tiles'`. `scripts/sample.ts` pokazuje kafelki.

### Changes Required:

#### 1. Wejście `generateTask`

**File**: `src/core/tasks/generateTask.ts` (nowy), `src/core/tasks/types.ts`

**Intent**: Wywołać generator z rejestru, a dla `skill.answer === 'tiles'` bez `choices` i z liczbową odpowiedzią dołożyć
`numberChoices(answer, rng, { count, ...range })`. Rzuca czytelny błąd dla nieznanego typu.

**Contract**: `generateTask(skill: SkillDef, rng: Rng, opts: { tileCount: number }): Task`; `Task.tileRange?: { min: number; max: number }`
(zakres kafelków, gdy generator zna węższy niż `boundOf`). Zadania z `choices` od generatora przechodzą bez zmian.

#### 2. BONDS z `tileRange`

**File**: `src/core/tasks/generators/bonds.ts`

**Intent**: Ustawić `tileRange` = `{ min: 0, max: <wylosowana suma> }`, żeby żaden kafelek nie był większy od sumy
(0 to wiarygodny błędny kafelek także przy `zero: false`). `generateTask` przycina liczbę kafelków do rozmiaru zakresu,
więc suma 2 daje 3 kafelki (FR-006: 3–4), suma ≥ 3 daje 4.

**Contract**: dodatkowe pole w zwracanym `Task`; prompt, answer i hint bez zmian.

#### 3. Balans i dane E1

**File**: `src/data/balance.ts` (nowy), `src/data/curriculum/E1.ts`

**Intent**: Utworzyć plik balansu z liczbą kafelków (4, kit `task-tiles.png`); 10 liczbowych umiejętności E1
(`E1.3.add_sub_5`, `E1.3.missing_5`, `E1.3.bonds_5`, `E1.4.bonds_6_7`, `E1.5.add_sub_9`, `E1.5.chain_9`, `E1.5.word_9`,
`E1.7.bonds_10`, `E1.7.complement_10`, `E1.9.add_sub_10`) dostaje `'tiles'`; komentarz pliku mówi, że wszystkie odpowiedzi E1 to kafelki.

**Contract**: `export const balance = { tiles: { count: 4 } } as const` (kolejne fazy rozszerzają ten obiekt);
helper `skill` w E1 bez zmiany sygnatury.

#### 4. Sample i niezmiennik

**File**: `scripts/sample.ts`, `tests/generateTask.test.ts` (nowy), `tests/contentInvariants.test.ts`

**Intent**: Sample woła `generateTask` z `balance.tiles.count` i drukuje kafelki; nowy test po każdej umiejętności
każdego etapu (`stages`): `'tiles'` ⇒ 2–4 unikalne kafelki zawierające odpowiedź, nieujemne, w zakresie; `'keypad'` ⇒
odpowiedź liczbowa nieujemna; ziarna jak `forEachDraw` (`tests/helpers.ts`). BONDS: każdy kafelek ≤ suma, 3 kafelki przy
sumie 2, 4 przy sumie ≥ 3, zero wyjątków `RangeError` dla `E1.3.bonds_5` (sumy 2–5). Kafelki dołożone przez
`generateTask` mają ≥ 3 pozycje (kafelki od generatora mogą mieć 2, np. `monthDays`).
Istniejące niezmienniki różnorodności dalej wołają generator (nie `generateTask`).

**Contract**: test używa `stages` z `src/data/curriculum/index.ts` i `validateTask`.

### Success Criteria:

#### Automated Verification:

- Nowy test `tests/generateTask.test.ts` czerwony przed implementacją (E1 `'tiles'` bez kafelków), zielony po; unit: `<baseline gałęzi> + N` passed
- Deliberate break: `generateTask` nie dokłada kafelków → test czerwony; przywrócone; meta-check: test iteruje prawdziwe dane etapów, nie syntetyczną umiejętność
- `npm run sample -- E1` pokazuje kafelki przy zadaniach liczbowych i kończy się `Naruszenia: 0`
- Pełna bramka lokalna (lint, typecheck, unit + deploy-testy + sample E1–E6, build, e2e) zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1 --count 6`: każde zadanie 10 zmienionych umiejętności — kafelki możliwe i bliskie, jednoznaczne, odpowiedź wśród nich, BONDS bez kafelka większego od sumy; wynik w `reviews/teacher-read.md`

---

## Phase 2: Pierwsza podpowiedź bez wyniku i F14

Driver: tdd
Driver why: polityka `firstHint`/`solutionSteps` i dwulinijkowa podpowiedź MISSING nie istnieją; failing testy na prawdziwych zadaniach HALF, ROUNDING i MISSING prowadzą implementację (risk #1).

### Overview

Czysta reguła w `core` decyduje, co dziecko widzi po pierwszym błędzie i jakie kroki pokazuje rozwiązanie. MISSING
z niewiadomym składnikiem dostaje dwie linie: działanie odwrotne bez wyniku, potem z wynikiem.

### Changes Required:

#### 1. Polityka podpowiedzi

**File**: `src/core/round/hints.ts` (nowy)

**Intent**: `firstHint(task)` zwraca `hint[0]`, gdy podpowiedź ma ≥ 2 linie i linia 0 nie zdradza wyniku (definicja niżej),
albo gdy typ jest na liście wyjątków (`ROUNDING` — linia 0 to przedział, nie wynik); inaczej `null` (scena pokazuje samo
„Spróbuj jeszcze raz”). `solutionSteps(task)` zwraca wszystkie linie `hint`, a gdy żadna nie zawiera wyniku jako tokenu,
dokłada linię z `pl`-owym formatem wyniku przekazanym przez wywołującego.

**Contract**: `firstHint(task: Task): string | null`; `solutionSteps(task: Task, answerLine: (answer: string) => string): string[]`;
`FIRST_HINT_EXEMPT_TYPES: readonly string[]` (typ z prefiksu `skillId` albo z przekazanej umiejętności — implementujący wybiera, test pokrywa).
Zdradza wynik (jedna definicja dla kodu i testów, ustalona w plan review): odpowiedź liczbowa → **ostatnia liczba**
linii 0 (liczby formatowane jak w podpowiedziach, `formatNumber`, z odstępem tysięcy) równa się odpowiedzi; odpowiedź
napisowa lub zbiór → nigdy (zmierzone: 0 wycieków w COMPARE_NUM, CHOOSE_OP, MISSING_OP, CALENDAR; trafienia `=`
w COMPARE_EXPR to znak równania, nie wynik). Samo wystąpienie odpowiedzi w środku linii **nie** jest wyciekiem —
zmierzone zbieżności (operand równy wynikowi): CHAIN 50/200, BONDS 74/600, WORD 24/104, ADD_SUB 10/1985.
SEQUENCE z krokiem równym wynikowi („o 10 mniejsza”, wynik 10) zostaje fałszywie zablokowany (10/200) — akceptowane.
`solutionSteps` dokłada linię wyniku, gdy ostatnia liczba ostatniej linii ≠ odpowiedź (liczbowa) albo ostatnia linia
nie zawiera odpowiedzi (napis).

#### 2. F14 — MISSING

**File**: `src/core/tasks/generators/missing.ts`, `src/data/pl.ts`

**Intent**: Dla niewiadomego składnika: linia 0 `Policz w drugą stronę: 16 − 9` (bez wyniku), linia 1 `16 − 9 = 7`.
Dla niewiadomego wyniku jedna linia zostaje (reguła rundy pokaże „Spróbuj jeszcze raz”).

**Contract**: `pl.tasks.missingHint(inverse)` dostaje wyrażenie bez `= wynik`; ostatnia linia arytmetyczna zawiera
wynik (`tests/contentInvariants.test.ts` `ARITHMETIC_LINE`).

#### 3. Testy

**File**: `tests/hints.test.ts` (nowy), `tests/missing.test.ts`

**Intent**: Na zadaniach z prawdziwych generatorów (HALF, ROUNDING, ADD_SUB wielo- i jednolinijkowe, MISSING obu
slotów) — `firstHint` dla HALF i jednolinijkowych zwraca `null`, dla ROUNDING linię przedziału; po wszystkich
umiejętnościach E1–E6 × ziarna: dla odpowiedzi liczbowej ostatnia liczba `firstHint` ≠ wynik (poza ROUNDING),
zbieżność w środku linii (CHAIN, ADD_SUB) nie blokuje podpowiedzi, a `solutionSteps` zawsze kończy się wynikiem. MISSING: 2 linie dla składnika,
linia 0 bez wyniku.

**Contract**: wzorzec `forEachDraw` (`tests/helpers.ts`).

### Success Criteria:

#### Automated Verification:

- `tests/hints.test.ts` i nowe przypadki `tests/missing.test.ts` czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `firstHint` zwraca `hint[0]` bezwarunkowo → test HALF/MISSING czerwony; MISSING z jedną linią → czerwony; przywrócone; meta-check: przypadki pochodzą z generatorów, nie z ręcznie wpisanych napisów
- `npm run sample -- E3` i `-- E4` (kroki z MISSING) kończą się `Naruszenia: 0`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E3 --count 6`, `-- E4 --count 6` i `-- E1 --count 6` dla kroków z MISSING: linia 0 uczy działania odwrotnego bez wyniku, linia 1 je kończy; zapis w `reviews/teacher-read.md`

---

## Phase 3: Automat rundy i gwiazdki

Driver: tdd
Driver why: reduktor rundy nie istnieje; failing testy przejść, gwiazdek i bonusu (US-01, FR-006–FR-008) prowadzą implementację (risk #11 część unit).

### Overview

Czysty reduktor `RoundState` z fazami `first → second → solution → retype → done`, wynikami zadań, gwiazdkami
i bonusem. Liczby rundy z `balance.ts`.

### Changes Required:

#### 1. Reduktor rundy

**File**: `src/core/round.ts` (nowy)

**Intent**: `startRound(tasks, rules)`; `answer(state, input)` porównuje `task.check?.(input) ?? input === task.answer`;
przejścia: `first`+dobra → `done` (+1, `first`); `first`+zła → `second`; `second`+dobra → `done` (+1, `second`);
`second`+zła → `solution` (krok 0); `nextSolutionStep` aż do ostatniego, potem `retype`; `retype`+dobra → `done`
(+0, `retype`); `retype`+zła → `retype` (bez kary). `next(state)` przechodzi do kolejnego zadania albo kończy rundę;
koniec: bonus, gdy wszystkie wyniki `first`. Zadanie płaci najwyżej raz.

**Contract**: `RoundRules = { length; starPerTask; cleanRoundBonus }`; `RoundState { tasks; index; phase; solutionStep;
outcomes: ('first'|'second'|'retype'|null)[]; starsEarned; bonusEarned; finished }`; funkcje czyste, bez mutacji.
Akcje niedozwolone w danej fazie zwracają ten sam stan.

#### 2. Balans rundy

**File**: `src/data/balance.ts`

**Intent**: Dołożyć `round: { length: 5, starPerTask: 1, cleanRoundBonus: 2 }` i `defaultStage: 'E3'` (plan §6, decyzja 1 z `change.md`).

**Contract**: rozszerzenie obiektu `balance`.

#### 3. Testy

**File**: `tests/round.test.ts` (nowy)

**Intent**: Scenariusze: czysta runda = 5 + 2; druga próba = +1 i brak bonusu; dwa błędy → kroki → przepisanie = +0;
zła odpowiedź w `retype` nie zmienia gwiazdek; właściwość (losowe sekwencje akcji, ziarna): `starsEarned` nigdy nie
maleje, suma ∈ [0, 7], zadanie płaci ≤ 1; odpowiedź-napis i `check` (zbiór) działają.

**Contract**: zadania testowe z `generateTask` albo minimalne `Task` — oba warianty.

### Success Criteria:

#### Automated Verification:

- `tests/round.test.ts` czerwony przed implementacją, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `retype` + dobra daje +1 → czerwony; bonus przy wyniku `second` → czerwony; przywrócone; meta-check: test właściwości łapie oba bez znajomości implementacji
- Pełna bramka lokalna zielona

---

## Phase 4: Model widoku rundy, wybór umiejętności i bufor klawiaturki

Driver: tdd
Driver why: `roundView`, `pickSkills` i `keypadInput` nie istnieją; failing testy mapowania fazy na pasek/przyciski, wykluczenia `'select'` i limitu cyfr prowadzą implementację.

### Overview

Wszystko, co scena musi zdecydować, staje się czystą funkcją w `core`: co narysować dla danego stanu, które
umiejętności wolno losować i jak klawiaturka zmienia wpis.

### Changes Required:

#### 1. Model widoku

**File**: `src/core/round/view.ts` (nowy)

**Intent**: `roundView(state, hintsFor)` zwraca: kropki (`done`/`current`/`todo` z wynikiem), tryb wejścia (`tiles` z
kafelkami / `keypad`), pasek (`none` | `hint` z linią lub bez | `solution` z liniami do kroku i przyciskiem `next`/`gotIt`
| `retype` z ostatnim krokiem | `correct` z gwiazdką lub bez | `roundEnd` z bonusem lub bez), czy wejście aktywne,
czy przełącznik widoczny (zawsze `false` w trakcie zadania — FR-011, przygotowane dla S-05/S-09).

**Contract**: typ `RoundView` (pola nazwane jak wyżej; klucze tekstów, nie teksty — scena mapuje je na `pl`).

#### 2. Wybór umiejętności

**File**: `src/core/round/pick.ts` (nowy)

**Intent**: `pickSkills(stage, rng, count)` losuje równomiernie umiejętności kroków etapu, tylko `'tiles'`/`'keypad'`
z generatorem; `buildRound(stage, rng, rules, tileCount)` składa zadania przez `generateTask`.

**Contract**: wejście `StageDef`; wyjście `SkillDef[]` / `Task[]`; pusty wynik → `RangeError`.

#### 3. Bufor klawiaturki

**File**: `src/core/round/keypad.ts` (nowy)

**Intent**: `keypadInput(buffer, key, maxDigits)` dla cyfr, `delete`; `ok` zwraca liczbę albo `null` dla pustego bufora; bez zer wiodących.

**Contract**: `maxDigits` z `balance.keypad.maxDigits` (nowe pole, 7 — największe odpowiedzi E6).

#### 4. Testy

**File**: `tests/roundView.test.ts`, `tests/pick.test.ts`, `tests/keypad.test.ts` (nowe)

**Intent**: każda faza → oczekiwany pasek; `'select'`/`'drag'` nigdy nie wylosowane dla E1–E6 (1000 ziaren); limit cyfr, kasowanie, puste OK.

### Success Criteria:

#### Automated Verification:

- Trzy nowe pliki testów czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `pickSkills` bez filtra trybu → test `'select'` czerwony; `roundView` w `retype` bez ostatniego kroku → czerwony; przywrócone; meta-check: filtr sprawdzany na prawdziwych `stages`, gdzie `'select'` istnieje (E1.6, E3.7)
- Pełna bramka lokalna zielona

---

## Phase 5: Czcionka, tokeny, teksty i scena zadania z kropkami

Driver: impl
Driver why: scena, zasób czcionki i stałe układu — rusztowanie UI bez nowej logiki; czerwone/zielone dają testy układu i prekesz.

### Overview

`BootScene` ładuje lokalną czcionkę i startuje `TaskScene`, która buduje rundę z `core`, rysuje zeszyt, polecenie
i kropki postępu (`ProgressDots`). Nowe komponenty: `TaskScene`, `ProgressDots`.

### Changes Required:

#### 1. Czcionka offline

**File**: `public/fonts/AtkinsonHyperlegibleNext.ttf`, `public/fonts/OFL.txt` (kopie z `designs/martynka-maths-A-v1/fonts/`), `vite/config.shared.mjs`

**Intent**: Czcionka z polskimi znakami w prekeszu (NFR); `ttf` w `pwaOptions.workbox.globPatterns`.

**Contract**: glob `**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}`; licencja OFL obok pliku.

#### 2. Tokeny i teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `PLACEHOLDER_COLORS` + `tile` `#E3F0D9`, `correct` `#E5F2D4`, `hint` `#FFF0B9`, `dotDone` `#A6CF7F`;
`FONT_SIZES` + `prompt` 64, `answer` 90, `key` 58, `expression` 112, `hint` 32; `FONT_FAMILY`; geometria zeszytu,
HUD, kropek, kafelków, klawiaturki, paska (z kitu, research §7) jako stałe; `ANIMATION` (potrząśnięcie, lot gwiazdki 850 ms).
`pl.round`: „Oblicz”, „Brawo!”, „Brawo! +1 ★”, „Dalej”, „Spróbuj jeszcze raz”, „Następny krok”, „Już wiem”, „kasuj”,
„OK”, licznik `★ N`, bonus i linia wyniku rozwiązania (dwie ostatnie poza kitem → DESIGN-GAP).

**Contract**: tylko stałe; żadna liczba balansu ani tekst w scenie.

#### 3. Sceny

**File**: `src/scenes/BootScene.ts`, `src/scenes/TaskScene.ts` (nowy), `src/ui/widgets/ProgressDots.ts` (nowy), `src/main.ts`

**Intent**: `BootScene.preload` → `load.font`; `create` → `scene.start('Task')`, zachowując `data-build`.
`TaskScene` trzyma `RoundState` (`buildRound` z `balance.defaultStage`, rng z ziarna czasu), rysuje polecenie
(lub „Oblicz” + działanie) i `ProgressDots` z `roundView`. Wejście jeszcze nieaktywne.

**Contract**: `scene: [BootScene, TaskScene]`; klucze scen jako stałe; `ProgressDots.update(dots)`.

#### 4. Test układu

**File**: `tests/layout.test.ts` (nowy)

**Intent**: Wszystkie stałe celów dotykowych ≥ `MIN_TOUCH_TARGET`, `FONT_SIZES.prompt` ≥ 64, kolory w palecie.

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts` zielony; unit `<baseline gałęzi> + N`
- Po `npm run build`: `grep -c AtkinsonHyperlegibleNext dist/sw.js` ≥ 1
- Deliberate break: `ttf` usunięty z `globPatterns` → grep 0; wysokość kafelka 90 → `tests/layout.test.ts` czerwony; przywrócone; meta-check: grep dotyczy listy prekeszu, nie samego pliku w `dist/`
- Pełna bramka lokalna zielona (seed #8 dalej startuje offline — także z czcionką)

#### Manual Verification:

- [reviewer] Nowe teksty `pl.round` czytane jak przez nauczyciela: krótkie, poprawne, bez ostrych komunikatów
- [visual] Zrzut startu rundy (polecenie czcionką Atkinson, kropki: bieżąca turkusowa, przyszłe puste) przy 1440×900 i 1024×768

---

## Phase 6: Kafelki i klawiaturka

Driver: impl
Driver why: widżety Phasera renderujące gotowy stan i przekazujące dotyk do `core`; czysta geometria testowana jednostkowo.

### Overview

Nowe komponenty: `AnswerTiles` (3–4 kafelki 254×136, liczby i napisy), `Keypad` (0–9, „kasuj”, „OK”, pole wpisu).
`TaskScene` przekazuje dotyk do `answer`/`keypadInput` i przerysowuje.

### Changes Required:

#### 1. Geometria

**File**: `src/ui/widgets/geometry.ts` (nowy, bez importu Phasera)

**Intent**: `tileRow(count, area)` i `keypadGrid(area)` zwracają prostokąty celów w przestrzeni 1920×1080.

**Contract**: prostokąty ≥ `MIN_TOUCH_TARGET`, bez nakładania, wewnątrz obszaru; test `tests/geometry.test.ts`.

#### 2. Widżety

**File**: `src/ui/widgets/AnswerTiles.ts`, `src/ui/widgets/Keypad.ts` (nowe), `src/scenes/TaskScene.ts`

**Intent**: Kafelki i klawisze reagują w `pointerdown` (natychmiastowe podświetlenie), emitują wybór; scena woła
`answer(state, input)`; poprawna odpowiedź zmienia kolor kafelka/pola na `correct` (pasek w fazie 7).
Kafelki pokazują `task.choices` w kolejności z `core`.

**Contract**: `AnswerTiles.setChoices(choices)`, zdarzenie wyboru z wartością; `Keypad` z buforem z `keypadInput`;
oba udostępniają środki celów (`targets()`), które faza 9 wystawi hakowi.

### Success Criteria:

#### Automated Verification:

- `tests/geometry.test.ts` zielony; unit `<baseline gałęzi> + N`
- Deliberate break: odstęp kafelków ujemny → test nakładania czerwony; przywrócone; meta-check: test sprawdza prostokąty używane przez widżet (ta sama funkcja), nie kopię
- Pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty stanów task-tiles i task-keypad (porównanie z `designs/martynka-maths-A-v1/screenshots/task-tiles.png`, `task-keypad.png`) przy 1440×900 i 1024×768; cele ≥ 48 CSS px przy 1024×768 (`tablet-1024.png`)

---

## Phase 7: Pasek podpowiedzi, kroki rozwiązania i „Dalej”

Driver: impl
Driver why: renderowanie gotowego `roundView` (fazy 3–4) i tweeny; logika już przetestowana w `core`.

### Overview

Nowe komponenty: `FeedbackBar` (żółty pasek podpowiedzi/przepisania, zielony „Brawo! +1 ★” z „Dalej”), `SolutionSteps`
(kolejne linie, „Następny krok”/„Już wiem”). Potrząśnięcie po błędzie.

### Changes Required:

#### 1. Widżety paska

**File**: `src/ui/widgets/FeedbackBar.ts`, `src/ui/widgets/SolutionSteps.ts` (nowe)

**Intent**: Rysują pasek z `roundView` (klucze → `pl.round`); przyciski ≥ 96 px wysokości (min. szerokość 220).
W `retype` ostatni krok zostaje widoczny, a dla kafelków kafelek odpowiedzi ma obrys w kolorze `hint`.

**Contract**: `update(view.bar)`; zdarzenia `next`, `gotIt`, `continue`.

#### 2. Scena

**File**: `src/scenes/TaskScene.ts`

**Intent**: Błąd → potrząśnięcie (`ANIMATION.shake`, `killTweensOf` przed kolejnym) i pasek; „Dalej” → `next(state)`;
kroki → `nextSolutionStep`. Brak czerwieni i krzyżyków.

### Success Criteria:

#### Automated Verification:

- Unit `<baseline gałęzi> + 0` (brak nowej logiki; `roundView` pokryty w fazie 4)
- Deliberate break: `roundView` w fazie `retype` zwraca pasek `none` → `tests/roundView.test.ts` czerwony; przywrócone; meta-check: dowodzi modelu, nie rysowania — rysowanie pokrywa spec e2e (faza 11) i zrzuty
- Pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty stanów hint (z linią i bez — „Spróbuj jeszcze raz”), second try, solution steps (krok 1 i ostatni), retype, correct — przy 1440×900 i 1024×768; porównanie z `hint-tiles.png`, `hint-keypad.png`, `second-try.png`, `solution-step-1.png`, `solution-step-2.png`, `correct.png`
- [reviewer] Brak czerwonego krzyżyka, licznika czasu i ujemnej zmiany gwiazdek w żadnym stanie (US-01 AC)

---

## Phase 8: Nakładka UI z licznikiem gwiazdek, lot gwiazdki i koniec rundy

Driver: impl
Driver why: równoległa scena i widżet renderujące stan już policzony w `core`.

### Overview

Nowe komponenty: `UIScene` (uruchamiana `scene.launch`, zawsze nad `TaskScene`), `StarCounter` („★ N”, 196 px).
Gwiazdka leci do licznika równolegle (nie blokuje „Dalej”); po 5. zadaniu pasek końca rundy z bonusem i „Dalej”
rozpoczynającym kolejną rundę.

### Changes Required:

#### 1. Nakładka

**File**: `src/scenes/UIScene.ts`, `src/ui/widgets/StarCounter.ts` (nowe), `src/scenes/TaskScene.ts`, `src/main.ts`

**Intent**: `TaskScene` ustawia `registry` `stars` (suma sesji = suma rund) po każdej zmianie; `UIScene` słucha
`changedata-stars`. Lot gwiazdki (`tweens.chain`, 850 ms) z miejsca odpowiedzi do licznika; licznik aktualizuje się
od razu (bez czekania na tween). Koniec rundy: pasek `roundEnd` (bonus lub bez) i „Dalej” → nowa runda z `buildRound`.

**Contract**: klucz `registry` jako stała; `scene: [BootScene, TaskScene, UIScene]`; `UIScene` bez wejścia.

### Success Criteria:

#### Automated Verification:

- Unit `<baseline gałęzi> + 0`
- Deliberate break: bonus doliczony dwa razy w `next` → `tests/round.test.ts` czerwony; przywrócone; meta-check: dowodzi reduktora, licznik na ekranie sprawdza spec e2e (faza 11)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzut round end with bonus (+2 ★, licznik ★ 7 po czystej rundzie) przy 1440×900 i 1024×768; zrzut 420×760 pokazuje nakładkę „Obróć tablet” nad działającą rundą
- [human] Na iPadzie: reakcja na dotyk kafelka/klawisza < 100 ms (NFR), lot gwiazdki nie blokuje „Dalej”

---

## Phase 9: Hak e2e w osobnym buildzie i strażnik bundla produkcyjnego

Driver: impl
Driver why: konfiguracja builda, Playwrighta i moduł tylko do odczytu; czerwone/zielone daje strażnik builda i jego test.

### Overview

Flaga `__E2E_HOOK__` (wzorem `__BUILD_ID__`), moduł haka bez efektów ubocznych przy imporcie, plugin strażnika
w buildzie produkcyjnym, drugi serwer i projekt Playwrighta na buildzie z hakiem. Seed #8 zostaje na buildzie produkcyjnym.

### Changes Required:

#### 1. Flaga i hak

**File**: `vite/config.shared.mjs`, `src/vite-env.d.ts`, `src/testing/e2eHook.ts` (nowy), `src/main.ts`, `src/scenes/TaskScene.ts`, `eslint.config.mjs`

**Intent**: `define.__E2E_HOOK__ = JSON.stringify(process.env.E2E_HOOK === '1')`; `main.ts` woła `installE2EHook(game)`
tylko w `if (__E2E_HOOK__)`. Hak definiuje `window.__martynkaE2E` z getterami (zamrożone kopie): indeks zadania, faza,
odpowiedź, tryb wejścia, kafelki, wyniki, gwiazdki rundy i sumy, `finished`, oraz środki celów (kafelki, klawisze,
„OK”, „Dalej”, „Następny krok”/„Już wiem”) w przestrzeni 1920×1080 — z publicznych `TaskScene.snapshot()` i `targets()`.
Brak setterów. `src/testing/**` dostaje globale przeglądarki w ESLint.

**Contract**: znacznik `__martynkaE2E` występuje tylko w `src/testing/e2eHook.ts`; moduł bez kodu na poziomie modułu poza deklaracjami.

#### 2. Strażnik

**File**: `vite/e2eHookGuard.mjs` (nowy, + deklaracja typów dla testów), `vite/config.prod.mjs`, `tests/e2eHookGuard.test.ts` (nowy)

**Intent**: Plugin `generateBundle` (patrz Implementation Approach): błąd, gdy znacznik jest w produkcji albo brak go
w buildzie z hakiem; linia `e2e hook: absent (N chunks checked)` / `e2e hook: present (N chunks checked)` przez `console.log`.
Funkcja sprawdzająca czysta i testowana.

**Contract**: `checkE2EHook(chunks: { fileName: string; code: string }[], expectHook: boolean): { ok: boolean; message: string }`.

#### 3. Playwright

**File**: `playwright.config.ts`, `.gitignore`

**Intent**: `webServer` jako tablica: wpis aplikacji bez zmian (pierwszy), drugi
`npm run build -- --outDir dist-e2e && npm run preview -- --outDir dist-e2e --port ${HOOK_PORT} --strictPort` z
`env: { E2E_HOOK: '1' }`, `url` 4397, `reuseExistingServer: false` (plan review: stary serwer na 4397 ma ten sam
`data-build` = SHA commita, więc spec nie odróżniłby nieaktualnego kodu; zajęty port pada głośno → `E2E_HOOK_PORT`). Projekt `chromium` dostaje
`testIgnore: /task-round\.spec\.ts/`; nowy projekt `chromium-hook` (te same `use` + `baseURL` 4397, `testMatch: /task-round\.spec\.ts/`).
`HOOK_PORT = Number(process.env.E2E_HOOK_PORT ?? 4397)`. `.gitignore`: `dist-e2e`; ESLint `globalIgnores`: `dist-e2e/**`.

**Contract**: pola wpisu aplikacji i `test-stack.md` § E2E nietknięte; komenda e2e bramki `npx playwright test` bez zmian.

### Success Criteria:

#### Automated Verification:

- `tests/e2eHookGuard.test.ts` zielony; unit `<baseline gałęzi> + N`
- `npm run build` drukuje `e2e hook: absent (N chunks checked)` i `grep -rl __martynkaE2E dist/` nic nie znajduje
- `E2E_HOOK=1 npm run build -- --outDir dist-e2e` drukuje `e2e hook: present` i grep znajduje znacznik w `dist-e2e/`
- Deliberate break 1: `define.__E2E_HOOK__` na sztywno `true` → `npm run build` pada z komunikatem strażnika; przywrócone
- Deliberate break 2: `window.__martynkaE2E = …` na poziomie modułu `src/testing/e2eHook.ts` + import bez warunku → `npm run build` pada; przywrócone; meta-check: dowodzi realnej ścieżki wycieku (efekt uboczny importu), nie tylko flagi
- `npx playwright test` zielony: seed #8 na 4398 (produkcja) `1 passed`, oba serwery wystartowane i zabite po przebiegu (`lsof -ti :4397` i `lsof -ti :4398` puste)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] (CI at ship) Job `check` workflow `CI` na PR: w kroku `Run npm run build` po linii `> vite build --config vite/config.prod.mjs` (widzianej w runie 38294537061, job 114962348864) jest linia pasująca do `e2e hook: absent \([0-9]+ chunks checked\)`; `gh run view <id> --log --job <job id>` poza sandboxem, log do pliku w scratchpadzie, potem `grep -E`

---

## Phase 10: Seam sweep, profil, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja, profil i porządki po fazach 1–9, bez nowej logiki.

### Overview

Zapis portu 4397 i opisu w profilu, luki projektu, follow-upy, aktualizacja `CLAUDE.md`/`AGENTS.md` i przegląd szwów.

### Changes Required:

#### 1. Profil i env

**File**: `context/foundation/autonomous-run.md` (§ 2 wiersz e2e, § 3), `context/foundation/autonomous-run.env`

**Intent**: § 3: port 4397 = serwer e2e builda z hakiem (`E2E_HOOK_PORT`), uruchamiany przez Playwright, nie chroniony,
zabijany po przebiegu; § 2 e2e: opis „dwa serwery: produkcja 4398 (seed #8), hak 4397 (#11)”; build: strażnik haka
w `npm run build`. W env tylko komentarz przy `GATE_E2E`/`GATE_BUILD`; wartości bez zmian.

**Contract**: `validate-rule-files.sh` PASS.

#### 2. Luki projektu i follow-upy

**File**: `docs/design-gaps.md` (nowy), `context/changes/task-round-stars/follow-ups/review-fixes.md` (nowy)

**Intent**: Wiersze DESIGN-GAP: przycisk „Podpowiedź” przed błędem (kit) vs automatyczna podpowiedź (plan); „Pokaż
kroki” po pierwszym błędzie vs kroki po drugim; zwykła próba po krokach vs przepisanie bez gwiazdki; „Do pokoju”
w HUD (FR-011, brak pokoju); koniec rundy przed S-05 (bonus „+2 ★”); linia wyniku rozwiązania; tryb `'select'`.
Follow-upy z `Trigger:`: podpowiedzi klasy b/c (S-17), UI `'select'` (S-13), przełącznik (S-05/S-09), test-plan §3 wiersz
fazy 5, tabela narzędzi i §6.6 (`/10x-test-plan refresh`), spec #9 (`/10x-test-plan refresh`), asercja w `check-deploy` (warunek: hak poza `if`).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md` (Current state), `AGENTS.md` (jeśli opisuje sceny/strukturę), pliki faz 1–9

**Intent**: Current state: sceny Boot/Task/UI, widżety, `core/round*`, `balance.ts`, hak e2e i strażnik, dwa serwery e2e;
w akapicie o prekeszu (Commands) lista globów dostaje `ttf` (dziś „js, css, html, png, webp, ogg, m4a and woff2”).
Seam sweep: zduplikowane helpery (np. formatowanie wyniku w `hints.ts` vs `generateTask`, stałe kluczy scen/registry
w kilku plikach), nieaktualne komentarze (`E1.ts` „keypad”, `BootScene` placeholder, `main.ts` lista scen), martwe
klucze `pl` (`bootPlaceholder`, jeśli nieużywany), nieużywane eksporty z faz 1–9; wiersze kitu/test-planu zostają
follow-upami (właściciel `/10x-test-plan`).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: profil wskazuje nieistniejący plik → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ten profil (lista plików § 10)
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak zduplikowanych helperów, nieaktualnych komentarzy i martwych kluczy z faz 1–9; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`
- [human] Decyzja: „Dalej” po poprawnej odpowiedzi zamiast automatycznego przejścia („następne zadanie”, plan §6)
- [human] Decyzja: po pierwszym błędzie samo „Spróbuj jeszcze raz” bez podpowiedzi, gdy pierwsza linia zdradza wynik (FR-008 mówi „pierwsza podpowiedź”)
- [human] Decyzja: umiejętności `'select'` (E1.6, E3.7) wyłączone z losowania do S-13 (US-01 „odblokowane kroki”)
- [human] Decyzja: przełącznik zadania/pokój nierysowany do S-05/S-09 (FR-011 „widoczny między zadaniami”)

---

## Phase 11: Runda dotykiem — e2e ryzyka #11

Driver: e2e
Driver why: ryzyko #11 istnieje tylko w renderowanym UI (dotyk przez `Scale.FIT`, kafelki, klawiaturka, licznik); runda zbudowana w fazach 5–8, hak w fazie 9, kontrakt `E2E=on`.

### Overview

Jeden spec `tests/e2e/task-round.spec.ts` (projekt `chromium-hook`), wzorowany na seedzie: czeka na stan, nigdy na czas;
dotyk przez `page.touchscreen.tap` przy `hasTouch`; współrzędne z haka przeliczone przez `canvas.getBoundingClientRect()`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/task-round.spec.ts` (nowy)

**Intent**: Na starcie asercja, że hak istnieje (czytelny błąd przy starym serwerze). Testy: (1) czysta runda: 5 ×
poprawny dotyk + „Dalej” → hak `starsTotal` = 7, `finished`, bonus; (2) jeden zły dotyk → faza `second` → poprawny →
+1 i brak bonusu na końcu; (3) dwa złe → `solution` → „Następny krok”…„Już wiem” → `retype` → poprawny → +0 za to zadanie.
Zły wpis: inny kafelek niż odpowiedź albo `answer + 1` na klawiaturce. Asercje na stanie z haka, nie na tekście zadań ani pikselach.
Tytuł z identyfikatorem ryzyka `#11`.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; komenda `npx playwright test tests/e2e/task-round.spec.ts`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/task-round.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 3` passed (seed na 4398 nadal zielony)
- Deliberate break: handler `pointerdown` kafelka zgłasza sąsiedni kafelek (indeks + 1) → spec czerwony; przywrócone; meta-check: dowodzi ścieżki dotyku przez scenę, a nie reduktora (testy unit zostają zielone przy tej przerwie) — cytat czerwieni w handoff §3
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Testing Strategy

### Unit Tests:

- `generateTask`: kafelki dla każdej umiejętności `'tiles'` wszystkich etapów; BONDS w zakresie sumy.
- `firstHint`/`solutionSteps`: brak wyniku w pierwszej podpowiedzi (poza ROUNDING), wynik zawsze w rozwiązaniu; F14.
- Reduktor rundy: scenariusze US-01 i właściwość „gwiazdek nigdy nie ubywa, suma ≤ 7, zadanie płaci ≤ 1”.
- `roundView`, `pickSkills` (bez `'select'`/`'drag'`), `keypadInput`, geometria celów ≥ 96 px, stałe układu, strażnik haka.

### Integration Tests:

- `npm run sample -- E1..E6` z kafelkami; `npm run build` ze strażnikiem; seed #8 (produkcja) i spec #11 (hak) w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty wszystkich stanów (task-tiles, task-keypad, hint, second try, solution steps, retype, correct, round end with bonus) przy 1440×900 i 1024×768, plus 420×760 z nakładką „Obróć tablet”.
2. iPad: dotyk < 100 ms, lot gwiazdki nie blokuje.
3. Odczyt nauczyciela E1 (kafelki) i MISSING (F14).

## Performance Considerations

Reakcja na dotyk synchronicznie w `pointerdown`; tweeny nie blokują wejścia; czcionka ładowana raz w `BootScene`
(114 KB w prekeszu). Build e2e dokłada ~7 s do `npx playwright test`.

## Migration Notes

Brak: bez bazy danych; gwiazdki w pamięci do S-11 (profil § 4).

## Known risks

- **Dwa buildy na każdy `npx playwright test`** (także pojedynczy spec i `--project chromium`): wpisy `webServer` są
  globalne, Playwright 1.64 stawia je po kolei (`createPluginSetupTasks` w `node_modules/playwright/lib/runner/index.js`).
  `dist/` i `dist-e2e/` się nie zderzają (osobne `outDir`, `emptyOutDir` każdego tylko w swoim katalogu), preview 4398
  dalej serwuje `dist/`. Koszt: drugi build terserem na każdym przebiegu bramki e2e od fazy 9.
- **Precache + czcionka**: +114 552 B (jeden plik `AtkinsonHyperlegibleNext.ttf`) w `/fonts/`, nie w `/_app/`, więc
  asercja seeda #8 `/_app/*.js ≥ 2` się nie zmienia; `FontFace` z kontrolowanej strony idzie przez service worker,
  więc start offline obejmuje czcionkę. Ryzyko: brak `ttf` w globach = cichy fallback na `sans-serif` offline (pilnuje 5.2).
- **FR-008 częściowo**: po pierwszym błędzie bez podpowiedzi zostają wszystkie typy z jednolinijkową podpowiedzią
  (MISSING z niewiadomym wynikiem, COMPLEMENT, DIV, COMPARE_DIFF, ROMAN, EVEN_ODD, NUMBER_WORDS, część ADD_SUB/MULT/WORD)
  i HALF — decyzja `[human]` 10.6, treść S-17.

## References

- Research: `context/changes/task-round-stars/research.md`
- PRD: `context/foundation/prd.md` US-01, FR-006, FR-007, FR-008, FR-011, NFR
- Plan gry: `Martynka-urzadza.md` §6, §11 (M2), §14; `docs/ZADANIA.md` §1, §4, §7
- Test-plan: `context/foundation/test-plan.md` ryzyko #11, #8; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md`, `screenshots/` (task-tiles, task-keypad, hint-*, second-try, solution-step-*, correct, tablet-1024)
- F14: `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md`
- Format: `context/archive/2026-10-12-generators-remaining-stages/plan.md`

## Autonomous decisions

1. **„Dalej” po poprawnej odpowiedzi, bez auto-przejścia.** Odrzucone: przejście po czasie. Dlaczego: kit `correct.png`
   ma „Dalej”; automat to timer w odczuciu dziecka (PRD: bez timerów); e2e stuka „Dalej” deterministycznie. Wbrew
   dosłownemu „następne zadanie” z planu §6 → wiersz `[human]` 10. Zmieniłoby: opiekun chce auto-przejścia po locie gwiazdki.
2. **ROUNDING jawnie wyjęty z reguły pierwszej podpowiedzi (lista typów w `core`).** Odrzucone: zaakceptować fałszywe
   blokady (~58% zadań ROUNDING bez podpowiedzi). Dlaczego: linia 0 to przedział — dobra podpowiedź, nie wynik.
   Zmieniłoby: S-17 przepisze podpowiedź ROUNDING tak, że linia 0 nie kończy się granicą.
3. **Po pierwszym błędzie, gdy linia 0 zdradza wynik, tylko „Spróbuj jeszcze raz”.** Odrzucone: maska ogólna (zmierzona
   jako niebezpieczna) i przepisanie podpowiedzi 10 typów teraz (S-17). Wbrew dosłownemu FR-008 („pierwsza podpowiedź”)
   → wiersz `[human]` 10. Zmieniłoby: opiekun woli pełne podpowiedzi metodą szkolną już w S-04 (wtedy nowe fazy treści).
4. **Czcionka TTF teraz, `ttf` w prekeszu.** Odrzucone: konwersja do `woff2` (brak narzędzia bez natywnych zależności),
   odłożenie do S-16 (NFR wymaga lokalnej czcionki z polskimi znakami już w pierwszej grywalnej scenie). Zmieniłoby: `woff2` w paczce grafika.
5. **4 kafelki dla E1 (`balance.tiles.count`).** Odrzucone: 3. Dlaczego: kit `task-tiles.png` ma 4; zmierzone 0 wyjątków
   `numberChoices` przy count 4 nawet dla `max: 5`. Zmieniłoby: obserwacja, że 4 kafelki przytłaczają w E1 (zmiana liczby w balansie).
6. **Hak e2e w osobnym buildzie `dist-e2e/` na porcie 4397, drugi projekt Playwrighta; seed #8 na produkcji (4398).**
   Odrzucone: `env` na wpisie aplikacji (research — seed biegłby na buildzie z hakiem; ograniczenie orkiestratora),
   `--mode e2e` (zmienia komendę wpisu aplikacji), port 4399 (wizualny; `reuseExistingServer` mógłby trafić w serwer dev).
   Koszt: drugi build (~7 s). Zmieniłoby: opiekun pozwala na jeden build albo port 4397 okaże się zajęty (wtedy `E2E_HOOK_PORT`).
7. **Strażnik braku haka wewnątrz `npm run build` (plugin), bez osobnego grepa i bez asercji w `check-deploy`.**
   Odrzucone: osobny krok grep w CI/deploy (zmiana workflowów i komendy bramki, łatwo pominąć lokalnie), asercja w
   `scripts/check-deploy.ts` (żywa strona serwuje bundel zbudowany tym samym strażnikiem; follow-up warunkowy). Dlaczego:
   jedna kontrola działa w bramce lokalnej, CI `check` i Deploy `build` bez zmiany komend i ma kontrolę pozytywną.
   Zmieniłoby: deploy budujący inną komendą niż `npm run build`.
8. **`'select'` i `'drag'` wyłączone z losowania do S-13.** Odrzucone: UI wielokrotnego zaznaczania teraz (brak widoku
   w kicie, przepisanie wyniku dla zbioru niezdefiniowane). → wiersz `[human]` 10. Zmieniłoby: opiekun chce `'select'` już w S-04.
9. **Przełącznik zadania/pokój nierysowany; `roundView.switchVisible` przygotowane.** Odrzucone: przycisk donikąd.
   → wiersz `[human]` 10. Zmieniłoby: S-05 potrzebuje go wcześniej.
10. **Koniec rundy: pasek „Brawo! +2 ★” (bonus) i „Dalej” → kolejna runda; bez podsumowania (S-05).** Odrzucone: auto-start
    kolejnej rundy (dziecko nie zobaczy bonusu), ekran podsumowania (S-05). Kopia bonusu poza kitem → DESIGN-GAP.
11. **Etap domyślny E3 z `balance.defaultStage`, losowanie równomierne kroków** (decyzja 1 z `change.md`). Zmieniłoby: S-06/S-07.
12. **Linia wyniku w rozwiązaniu dokładana, gdy żaden krok nie zawiera wyniku; w `retype` kafelek odpowiedzi z obrysem.**
    Odrzucone: przepisanie bez widocznego wyniku. Dlaczego: FR-008 „przepisuje wynik” wymaga, by wynik był widoczny. Kopia poza kitem → DESIGN-GAP.
13. **Liczby balansu do `core` jako argumenty** (`RoundRules`, `tileCount`, `maxDigits`), nie import z `src/data`.
    Dlaczego: granice modułów (ESLint) i testowalność. Zmieniłoby: nic w tym slice.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Kafelki E1 i wspólne wejście `generateTask`

#### Automated

- [x] 1.1 Nowy test `tests/generateTask.test.ts` czerwony przed implementacją, zielony po; unit `<baseline gałęzi> + N` — 9f57306
- [x] 1.2 Deliberate break: `generateTask` bez kafelków → czerwony; przywrócone; meta-check na prawdziwych danych etapów — 9f57306
- [x] 1.3 `npm run sample -- E1` pokazuje kafelki i kończy się `Naruszenia: 0` — 9f57306
- [x] 1.4 Pełna bramka lokalna zielona — 9f57306

#### Manual

- [ ] 1.5 [reviewer] Odczyt nauczyciela `sample -- E1 --count 6` dla 10 zmienionych umiejętności (kafelki)

### Phase 2: Pierwsza podpowiedź bez wyniku i F14

#### Automated

- [x] 2.1 `tests/hints.test.ts` i nowe przypadki `tests/missing.test.ts` czerwone przed, zielone po; unit `<baseline gałęzi> + N` — d77b9c8
- [x] 2.2 Deliberate break: `firstHint` bezwarunkowo / MISSING jednolinijkowy → czerwony; przywrócone; meta-check na zadaniach z generatorów — d77b9c8
- [x] 2.3 `npm run sample -- E3` i `-- E4` kończą się `Naruszenia: 0` — d77b9c8
- [x] 2.4 Pełna bramka lokalna zielona — d77b9c8

#### Manual

- [ ] 2.5 [reviewer] Odczyt nauczyciela kroków z MISSING (`sample -- E1/E3/E4 --count 6`)

### Phase 3: Automat rundy i gwiazdki

#### Automated

- [x] 3.1 `tests/round.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 7d99976
- [x] 3.2 Deliberate break: gwiazdka w `retype` / bonus przy `second` → czerwony; przywrócone; meta-check właściwości — 7d99976
- [x] 3.3 Pełna bramka lokalna zielona — 7d99976

### Phase 4: Model widoku rundy, wybór umiejętności i bufor klawiaturki

#### Automated

- [x] 4.1 `tests/roundView.test.ts`, `tests/pick.test.ts`, `tests/keypad.test.ts` czerwone przed, zielone po; unit `<baseline gałęzi> + N` — 6593472
- [x] 4.2 Deliberate break: `pickSkills` bez filtra / `roundView` `retype` bez kroku → czerwony; przywrócone; meta-check na `stages` — 6593472
- [x] 4.3 Pełna bramka lokalna zielona — 6593472

### Phase 5: Czcionka, tokeny, teksty i scena zadania z kropkami

#### Automated

- [x] 5.1 `tests/layout.test.ts` zielony; unit `<baseline gałęzi> + N` — 4471d8c
- [x] 5.2 Po `npm run build`: `grep -c AtkinsonHyperlegibleNext dist/sw.js` ≥ 1 — 4471d8c
- [x] 5.3 Deliberate break: bez `ttf` w glob → grep 0; kafelek 90 → test czerwony; przywrócone; meta-check — 4471d8c
- [x] 5.4 Pełna bramka lokalna zielona (seed #8 offline z czcionką) — 4471d8c

#### Manual

- [ ] 5.5 [reviewer] Nowe teksty `pl.round` czytane jak przez nauczyciela
- [ ] 5.6 [visual] Zrzut startu rundy (czcionka, kropki) przy 1440×900 i 1024×768

### Phase 6: Kafelki i klawiaturka

#### Automated

- [x] 6.1 `tests/geometry.test.ts` zielony; unit `<baseline gałęzi> + N` — 6396fcb
- [x] 6.2 Deliberate break: ujemny odstęp kafelków → czerwony; przywrócone; meta-check — 6396fcb
- [x] 6.3 Pełna bramka lokalna zielona — 6396fcb

#### Manual

- [ ] 6.4 [visual] Zrzuty task-tiles i task-keypad przy 1440×900 i 1024×768; cele ≥ 48 CSS px przy 1024×768

### Phase 7: Pasek podpowiedzi, kroki rozwiązania i „Dalej”

#### Automated

- [x] 7.1 Unit `<baseline gałęzi> + 0` — 6ab3f66
- [x] 7.2 Deliberate break: `roundView` `retype` → `none` → czerwony; przywrócone; meta-check (model, nie rysowanie) — 6ab3f66
- [x] 7.3 Pełna bramka lokalna zielona — 6ab3f66

#### Manual

- [ ] 7.4 [visual] Zrzuty hint (z linią i bez), second try, solution steps (pierwszy i ostatni krok), retype, correct przy 1440×900 i 1024×768
- [ ] 7.5 [reviewer] Brak czerwonego krzyżyka, licznika czasu i ujemnej zmiany gwiazdek

### Phase 8: Nakładka UI z licznikiem gwiazdek, lot gwiazdki i koniec rundy

#### Automated

- [x] 8.1 Unit `<baseline gałęzi> + 0` — bc357da
- [x] 8.2 Deliberate break: bonus doliczony dwa razy → czerwony; przywrócone; meta-check — bc357da
- [x] 8.3 Pełna bramka lokalna zielona — bc357da

#### Manual

- [ ] 8.4 [visual] Zrzut round end with bonus (+2 ★, ★ 7) przy 1440×900 i 1024×768; 420×760 z nakładką „Obróć tablet”
- [ ] 8.5 [human] iPad: dotyk < 100 ms, lot gwiazdki nie blokuje „Dalej”

### Phase 9: Hak e2e w osobnym buildzie i strażnik bundla produkcyjnego

#### Automated

- [x] 9.1 `tests/e2eHookGuard.test.ts` zielony; unit `<baseline gałęzi> + N` — cbf1722
- [x] 9.2 `npm run build` drukuje `e2e hook: absent (N chunks checked)`; grep `__martynkaE2E` w `dist/` pusty — cbf1722
- [x] 9.3 `E2E_HOOK=1 npm run build -- --outDir dist-e2e` drukuje `e2e hook: present`; znacznik w `dist-e2e/` — cbf1722
- [x] 9.4 Deliberate break 1: `__E2E_HOOK__` na sztywno `true` → build pada; przywrócone — cbf1722
- [x] 9.5 Deliberate break 2: efekt uboczny importu haka → build pada; przywrócone; meta-check — cbf1722
- [x] 9.6 `npx playwright test` zielony: seed #8 na 4398 (produkcja), oba serwery zabite po przebiegu — cbf1722
- [x] 9.7 Pełna bramka lokalna zielona — cbf1722

#### Manual

- [ ] 9.8 [reviewer] (CI at ship) Job `check`: w `Run npm run build` linia `e2e hook: absent \([0-9]+ chunks checked\)` po `> vite build --config vite/config.prod.mjs` (run 38294537061, job 114962348864)

### Phase 10: Seam sweep, profil, luki projektu, follow-upy i dokumentacja

#### Automated

- [ ] 10.1 `validate-rule-files.sh` PASS
- [ ] 10.2 Deliberate break: profil wskazuje nieistniejący plik → FAIL; przywrócone; meta-check
- [ ] 10.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual

- [ ] 10.4 [reviewer] Seam sweep: duplikaty, nieaktualne komentarze, martwe klucze; DESIGN-GAP w kodzie i w `docs/design-gaps.md`
- [ ] 10.5 [human] Decyzja: „Dalej” zamiast automatycznego przejścia (plan §6)
- [ ] 10.6 [human] Decyzja: samo „Spróbuj jeszcze raz”, gdy pierwsza linia zdradza wynik (FR-008)
- [ ] 10.7 [human] Decyzja: `'select'` wyłączone z losowania do S-13 (US-01)
- [ ] 10.8 [human] Decyzja: przełącznik zadania/pokój nierysowany do S-05/S-09 (FR-011)

### Phase 11: Runda dotykiem — e2e ryzyka #11

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/task-round.spec.ts` zielony; pełne e2e `<baseline gałęzi e2e> + 3`
- [ ] 11.2 Deliberate break: `pointerdown` kafelka zgłasza indeks + 1 → spec czerwony; przywrócone; meta-check (unit zielone przy tej przerwie)
- [ ] 11.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite
