# Lektor poleceń i podsumowanie rundy z „Kolejna runda” i „Do pokoju” — Implementation Plan

## Overview

Roadmapa S-05 (`narrator-round-summary`, zamyka etap M2). Dziecko odsłuchuje polecenie polskim lektorem: przycisk
głośnika w HUD obok licznika gwiazdek, widoczny tylko wtedy, gdy urządzenie ma polski głos (FR-009), czyta polecenie
zamienione na polski tekst mówiony (bez `−`, `·`, `:`, `□`, twardych spacji; działania słownie, cyfry rzymskie
literowane, żeby lektor nie zdradził wyniku). Automatyczne czytanie ma domyślną wartość od etapu (E1–E2 włączone,
od E3 wyłączone), w pamięci sesji. Po piątym zadaniu zamiast zielonego paska końca rundy pojawia się podsumowanie
z kitu („Brawo!”, rząd 5 gwiazdek, „★ +N”, linia bonusu, „Kolejna runda” i „Do pokoju”). „Do pokoju” prowadzi do
pustej sceny pokoju (placeholder rysowany w kodzie, licznik widoczny, „Wróć do notesu”), która wraca na ekran, z którego
dziecko wyszło. Ostatnia (odcinalna) faza kodu rysuje przełącznik „Do pokoju” w HUD między zadaniami (FR-011, follow-up
S-04). Spec e2e ryzyka #11 przechodzi na przyciski podsumowania i pokój; lektor dostaje własny spec na atrapie
`speechSynthesis`.

## Current State Analysis

Z `context/changes/narrator-round-summary/research.md` (gałąź `feat/narrator-round-summary` @ `ad5535b`) i odczytu kodu
w tym kroku:

- `src/core/round.ts`: `RoundState.finished` + `bonusEarned` już są stanem „po rundzie” (`next` dolicza bonus); brak
  nowej fazy reduktora. `src/core/round/view.ts` `roundView`: `barOf` przy `finished` zwraca `{ kind: 'roundEnd', bonus }`,
  `switchVisible: false` na sztywno.
- `src/scenes/TaskScene.ts` `advance`: gałąź `if (this.state.finished)` dolicza `sessionStars` i woła `freshRound`;
  `snapshot` (`TaskSnapshot`) ma `counter` z rejestru (nie rysowany tekst — follow-up S-04); `targets` ma `tiles`,
  `keys`, `next`, `step`. `src/scenes/UIScene.ts`: tylko `StarCounter`, `input.enabled = false`, słucha
  `changedata-stars`. `src/main.ts`: `scene: [BootScene, TaskScene, UIScene]`, hak w `if (__E2E_HOOK__)`.
- `src/ui/widgets/ActionButton.ts` reaguje w `pointerdown`; Phaser 4.2.1 woła `pointerdown` w DOM `touchstart`, który wg
  HTML spec nie daje aktywacji użytkownika (research §1) — mowa musi startować w `pointerup` (DOM `touchend`).
- `src/ui/widgets/StarCounter.ts` ma nieużywane `value()` (rysowany tekst).
- `Task.speak?` (`src/core/tasks/types.ts`) ustawia tylko `generateMissing` (`src/core/tasks/generators/missing.ts`) i ma
  surowe symbole; `validateTask` (`texts`) sprawdza `speak` jak `prompt`. `□` ma trzy znaczenia (liczba w okienku,
  znak porównania, znak działania); generatory COMPARE_NUM (`compareNum.ts`), COMPARE_EXPR (`compareExpr.ts`),
  MISSING_OP (`missingOp.ts`) dają gołe `a □ b`. ROMAN (`roman.ts`, `pl.tasks.romanContexts`) i CALENDAR
  (`calendar.ts`, `pl.tasks.romanMonth`) pokazują cyfry rzymskie, które syntezator przeczyta jako wynik.
- `numberToWords` (`src/core/text/numberWords.ts`) obsługuje 0..1000 (`MAX_NUMBER_WORD`); `formatNumber` grupuje
  ≥ 10 000 twardą spacją. `isExpression` (`src/core/round/prompt.ts`) rozpoznaje gołe działanie.
- Generatory w `src/core/tasks/generators/` importują `pl` z `src/data/pl.ts` (dozwolone); zasady rundy biorą słowa
  i liczby jako argumenty (`roundView(state, answerLine)`, `RoundRules`). ESLint: globale przeglądarki tylko w
  `src/scenes/**`, `src/pwa/**`, `src/ui/**`, `src/testing/**`, `src/main.ts`; `src/core/**` bez Phasera i globali.
- `playwright.config.ts`: projekt `chromium-hook` dopasowuje `ROUND_SPEC = /task-round\.spec\.ts/`; `tests/e2e/task-round.spec.ts`
  ma 3 testy #11 kończące się na `finished` i `counter`. Headless Chromium na Macu opiekuna ma polski głos „Zosia”
  (zmierzone w research) — każdy test e2e musi podstawić `speechSynthesis`.
- `docs/design-gaps.md` wiersz 4 (HUD „Do pokoju”) i 5 (pasek końca rundy) dotyczą tego slice'a.
- `context/foundation/lessons.md` nie istnieje — żadna lekcja nie obowiązuje.

## Desired End State

- Na zadaniu: w HUD głośnik 104 px na lewo od licznika, gdy jest polski głos; stuknięcie (zwolnienie palca) czyta
  polecenie polskim tekstem mówionym („Oblicz. Trzydzieści osiem plus dwadzieścia siedem.”), w drugiej próbie
  „Spróbuj jeszcze raz.” + podpowiedź, w krokach rozwiązania widoczny ostatni krok. Bez polskiego głosu głośnika nie
  ma, a runda działa tak samo. E1–E2: nowe zadanie czytane automatycznie (po pierwszym dotknięciu w sesji).
- Po piątym „Dalej”: ekran podsumowania (licznik w HUD nadal widoczny); „Kolejna runda” startuje nową rundę z zachowaną
  sumą; „Do pokoju” → pusta scena pokoju z licznikiem i „Wróć do notesu”, które wraca na podsumowanie.
- Między zadaniami (po poprawnej odpowiedzi, przed „Dalej”) w HUD jest „Do pokoju”; w trakcie rozwiązywania — nie ma.
  Powrót z pokoju wznawia tę samą rundę w tym samym miejscu.
- `npx playwright test`: seed #8 (produkcja), #11 (3 testy przepisane na podsumowanie + 1 test pokoju) i 2 testy lektora
  (z głosem / bez głosu) na buildzie z hakiem; `npm run build` dalej drukuje `e2e hook: absent (N chunks checked)`.

### Key Discoveries:

- Phaser `ScenePlugin.switch` usypia bieżącą scenę i budzi/startuje docelową w następnym `update`; uśpiona scena
  zachowuje pola i nie dostaje wejścia, `create` nie jest wołane przy `wake` (research §4) — `TaskScene` z rundą
  i `sessionStars` przeżywa pokój bez zapisu.
- Sceny rysują się w kolejności listy: `RoomScene` musi stać przed `UIScene` w `src/main.ts`, żeby licznik był nad pokojem.
- `InputManager.globalTopOnly` zatrzymuje propagację tylko przy trafieniu w interaktywny obiekt, więc `UIScene` z
  włączonym wejściem nie zabiera dotyku kafelkom `TaskScene`.
- `getVoices()` bywa puste do `voiceschanged`; Android raportuje `pl_PL`; bez ustawionego `utterance.voice` Android
  potrafi czytać polski tekst angielskim głosem; Safari po `cancel()` gubi szybkie `speak()` (research §1).

## What We're NOT Doing

- Przełącznik rodzica dla automatycznego czytania i jego zapis (S-08 ekran rodzica, S-11 zapis) — wartość w sesji.
- Dane kosztów zadań remontowych i prawdziwy pokój (S-09, sztuka S-16) — wyróżnienie „Do pokoju” liczone regułą,
  dziś koszt `null`.
- Rozszerzenie `numberToWords` ponad 1000 — liczby > 1000 w mowie zostają cyframi (bez twardej spacji); follow-up,
  jeśli odsłuch na tablecie pokaże złe czytanie.
- Liczebniki w zdaniach (zgoda z rodzajem: „dwie książki”) — w zdaniach cyfry zostają; odsłuch `[human]`.
- Nagrania audio, wybór głosu przez rodzica, tempo jako ustawienie.
- `pl.title` i gołe liczby animacji w widżetach (follow-up S-04 → S-06), kropki kroków rozwiązania (`SolutionSteps`,
  follow-up odłożony), „Oblicz” nad poleceniami porównania (`isExpression`, nowy follow-up).
- Ręczna edycja `context/foundation/test-plan.md` (nowe ryzyko lektora → follow-up `/10x-test-plan refresh`).
- E2E w CI, WebKit/iPad (manualnie).

## Implementation Approach

Treść mówiona najpierw (fazy 1–2, TDD, z odczytem nauczyciela), potem czyste reguły głosu i moduł lektora na
wstrzykniętym syntezatorze (3), model podsumowania (4), potem UI po ≤ 2 nowe komponenty na fazę: głośnik w HUD (5),
podsumowanie (6), scena pokoju (7), rozszerzenie haka (8), przełącznik HUD (9, odcinalny), seam sweep (10), e2e (11–12).
Każda faza zostawia grę grywalną i bramkę zieloną; do fazy 6 koniec rundy działa po staremu (pasek `roundEnd`).

**Bramka lokalna** (kontrakt § Verification): komendy lint, typecheck, unit, build i e2e **bez zmian** w tym slice.
Faza 12 poszerza `testMatch` projektu `chromium-hook` w `playwright.config.ts` (ta sama komenda `npx playwright test`).

Liczby testów jako baseline + delta: baseline na `main` @ `8467431` = `unit OK Tests 596 passed; e2e OK 4 passed`
(kontrakt). Każda faza mierzy na gałęzi przed zmianą i raportuje `<baseline gałęzi> + <nowe>`.

**Gdzie żyje mowa.** `src/core/narration/` — czyste reguły: tekst mówiony (`spoken.ts`), wybór głosu i domyślne
auto-czytanie (`voice.ts`). Słowa (`plus`, `minus`, `razy`, …) w `pl.speech`, przekazywane argumentem (wzorzec
`roundView(state, answerLine)`). `src/ui/narrator.ts` — fabryka lektora nad **wstrzykniętym** syntezatorem
i konstruktorem wypowiedzi (żadnego dostępu do `window` przy imporcie), testowana w vitest atrapą. `src/main.ts` tworzy
jedną instancję z `window.speechSynthesis` (gdy istnieje) i kładzie ją w rejestrze gry; sceny tylko pokazują przycisk
i przekazują stuknięcie.

**Przepływ scen.** `TaskScene` (zadania + warstwa podsumowania) ⇄ `RoomScene` przez `scene.switch`; `UIScene` równolegle
na górze (licznik, głośnik, przełącznik). Komunikacja przez rejestr (`REGISTRY_KEYS`: `stars`, nowe `narration` —
tekst do odczytu albo `null`, `hud` — widoczność przełącznika) i zdarzenia gry dla stuknięć z HUD.

## Critical Implementation Details

**Gest i mowa.** Głośnik mówi w `pointerup` (nie przez `ActionButton`, który reaguje w `pointerdown`). `src/main.ts`
dokłada jednorazowy nasłuch DOM `pointerup`/`touchend` na kontenerze gry, który woła `narrator.unlock()` (pusta
wypowiedź) — od tego gestu działa auto-czytanie po „Dalej”/„Kolejna runda” (Chrome: sticky activation; iOS: `[human]`).
„Kolejna runda” i „Wróć do notesu” (`PageButton`) reagują w `pointerup`, więc auto-czytanie pierwszego zadania nowej
rundy siedzi w geście. Pierwsze zadanie po zimnym starcie nie jest czytane automatycznie (brak gestu) — znane ograniczenie.

**Kolejność `cancel`/`speak`.** Lektor: `cancel()`, potem `speak` po `balance.narrator.cancelGapMs` (obejście Safari),
trzyma referencję bieżącej wypowiedzi do `end`/`error`, zawsze ustawia `utterance.voice` (polski głos) i `lang`
z głosu, tempo `balance.narrator.rate`. Błąd mowy (`not-allowed`, `interrupted`) jest cichy — nigdy nie blokuje przepływu.
`visibilitychange` → `hidden` → `cancel()`; przejście do pokoju i na podsumowanie → `cancel()`.

**Wykrycie głosu.** Odczyt `getVoices()` od razu, nasłuch `voiceschanged`, odpytywanie co `voicePollMs` do
`voiceTimeoutMs`; po limicie bez polskiego głosu → `available = false` na stałe w sesji (przycisk ukryty), późniejsze
`voiceschanged` może go jeszcze włączyć. Brak `speechSynthesis` w ogóle → lektor „pusty” (zawsze niedostępny).

**`□` w mowie.** Jedna reguła w `spoken.ts`: `□` → „okienko”. Generatory, w których `□` nie jest liczbą (COMPARE_NUM,
COMPARE_EXPR, MISSING_OP), dostają `speak` = pytanie o znak + działanie (wzorzec `generateMissing`), więc „okienko” ma
zawsze sens w kontekście pytania.

## Phase 1: Tekst mówiony w generatorach (porównania, brakujący znak, cyfry rzymskie)

Driver: tdd
Driver why: brak `speak` w COMPARE_NUM/COMPARE_EXPR/MISSING_OP/ROMAN/CALENDAR; failing testy na zadaniach z generatorów (pytanie o znak, brak wyniku w mowie) prowadzą zmianę.

### Overview

Pięć ścieżek generatorów dostaje `speak`: porównania i brakujący znak pytają o znak przed działaniem; ROMAN (odczyt)
i CALENDAR (`romanMonth`) literują cyfry rzymskie tak, że mowa nie zawiera wyniku. `scripts/sample.ts` drukuje `speak`.

### Changes Required:

#### 1. Słowa i szablony

**File**: `src/data/pl.ts`

**Intent**: Pytania o znak (porównanie liczb, porównanie działań, znak działania) i literowanie cyfr rzymskich
(nazwy liter: I „i”, V „fau”, X „iks”, L „el”, C „ce”, D „de”, M „em”) jako funkcje/klucze `pl.tasks`; mowa ROMAN
w trzech kontekstach (zegar, winda, sama liczba) i CALENDAR z datą zapisaną słowami „cyframi rzymskimi …”.

**Contract**: np. `pl.tasks.compareSpeak(expr)`, `pl.tasks.missingOpSpeak(expr)`, `pl.tasks.romanLetters: Record<string, string>`,
`pl.tasks.romanSpeakContexts[]`, `pl.tasks.romanMonthSpeak(day, spelled)` — nazwy dowolne, kształt: szablony biorą
działanie z symbolami (zamieni je faza 2) albo przeliterowaną liczbę rzymską.

#### 2. Generatory

**File**: `src/core/tasks/generators/{compareNum,compareExpr,missingOp,roman,calendar}.ts`, `src/core/text/roman.ts`

**Intent**: Ustawić `speak` (prompt bez zmian). Literowanie jako czysta funkcja obok `toRoman` (`spellRoman(roman, letters)`).
Kierunek „Jak zapisać liczbę 4 cyframi rzymskimi?” bez `speak` (bezpieczny).

**Contract**: `Task.speak` — dla ROMAN odczytu i `romanMonth` nie zawiera ciągu cyfr rzymskich jako tokenu, cyfr
wyniku, `numberToWords(wynik)` ani nazwy miesiąca-wyniku; dla trzech generatorów znaku zawiera pytanie i całe działanie.

#### 3. Sample i testy

**File**: `scripts/sample.ts`, `tests/{compareNum,compareExpr,missingOp,romanGen,calendar}.test.ts`

**Intent**: Sample drukuje linię `mowa:` pod poleceniem, gdy `speak` istnieje. Testy (`forEachDraw`, prawdziwe
umiejętności): `speak` obecny, nie zdradza wyniku (definicja wyżej), przechodzi `validateTask`.

### Success Criteria:

#### Automated Verification:

- Nowe przypadki w pięciu plikach testów czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: ROMAN `speak` = `prompt` → test „nie zdradza wyniku” czerwony; COMPARE_NUM bez `speak` → czerwony; przywrócone; meta-check: przypadki pochodzą z generatorów na danych etapów, nie z ręcznie wpisanych napisów
- `npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0` i pokazują linie `mowa:`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela `npm run sample -- E1` … `-- E6 --count 6` (każdy etap ze zmienionym krokiem: COMPARE_NUM/COMPARE_EXPR/MISSING_OP są w E1, E2, E4, E6; ROMAN w E3, E5; CALENDAR `romanMonth` w E3) dla kroków z COMPARE_NUM, COMPARE_EXPR, MISSING_OP, ROMAN, CALENDAR: pytanie naturalne, nie zdradza wyniku, literowanie cyfr rzymskich zrozumiałe dla dziecka; wynik w `reviews/teacher-read.md`

---

## Phase 2: Tekst mówiony dla rundy

Driver: tdd
Driver why: `spokenText`/`narrationOf` nie istnieją; failing testy (symbole → słowa, liczby słownie w działaniach, niezmiennik po wszystkich umiejętnościach E1–E6) prowadzą implementację.

### Overview

Czysta funkcja zamienia polecenie (albo `speak`) na polski tekst dla syntezatora; druga wybiera, co czyta głośnik
w danej fazie rundy.

### Changes Required:

#### 1. Słowa lektora

**File**: `src/data/pl.ts`

**Intent**: Sekcja `pl.speech`: „plus”, „minus”, „razy”, „podzielić przez”, „równa się”, „okienko”, „mniejsze niż”,
„większe niż” (dla kafelków/hintów z `<`, `>`), znaki zapytania/pauzy.

**Contract**: `pl.speech` jako obiekt słów; typ `SpeechWords` w `core` (struktura, nie import z `data`).

#### 2. Reguły

**File**: `src/core/narration/spoken.ts` (nowy)

**Intent**: `spokenText(text, words)`: dzieli tekst na zdania/linie (`\n`, `. `, `? ` i dwukropek przyklejony do słowa,
`/(?<=\p{L}):\s/u` — nigdy ` : ` dzielenia, bo „12 : 3 = □” też zawiera `: `); segment będący gołym
działaniem (`isExpression`) dostaje liczby ≤ 1000 słownie (`numberToWords`), większe cyframi bez twardej spacji — liczby
wyłuskiwane wzorcem `NUMBER_SOURCE` i `parseNumber` (`src/core/text/formatNumber.ts`), nigdy dzieleniem po białych znakach
(NBSP to `\s`: „12 345” nie może dać „dwanaście trzysta czterdzieści pięć”); poza działaniami NBSP usuwana tylko między
cyframi (jedyne źródło NBSP to `formatNumber`); symbole
`+ − · : = □ < >` na słowa (`:` tylko między liczbami); twarde spacje usunięte; `\n` → „. ”. Polecenie będące gołym
działaniem dostaje prefiks `pl.round.calculate` + „.” (kit: „Oblicz. 38 plus 27”). `narrationOf(state, words, calculate,
tryAgain)` → tekst do odczytu: `first`/`done` — polecenie (`task.speak ?? task.prompt`); `second` — „Spróbuj jeszcze
raz.” + `firstHint` (albo samo polecenie, gdy podpowiedzi brak); `solution`/`retype` — ostatnia widoczna linia kroku;
`finished` → `null`.

**Contract**: `spokenText(text: string, words: SpeechWords): string`; `narrationOf(state: RoundState, opts: { words; calculate; tryAgain; answerLine }): string | null` — zwraca gotowy tekst mówiony (już po `spokenText`); sceny nie wołają `spokenText` drugi raz.

#### 3. Sample i testy

**File**: `scripts/sample.ts`, `tests/spoken.test.ts` (nowy)

**Intent**: Sample drukuje linię `czyta:` (wynik `spokenText` dla `speak ?? prompt`). Testy: przypadki z kitu
(„38 + 27” → „Oblicz. trzydzieści osiem plus dwadzieścia siedem”), MISSING z okienkiem, dzielenie vs dwukropek w zdaniu
(„Uzupełnij ciąg:” bez „podzielić przez”; „12 : 3 = □” → „dwanaście podzielić przez trzy …”; FACT_FAMILY „… Sprawdź: 4 · 3 = □”),
NBSP („12 345 □ 12 354” zawiera „12345” i „12354”, nie „dwanaście”; „Zaokrąglij 12 345 …” → „12345”), liczba 1000 → „tysiąc”,
1001 → cyfry (strażnik zakresu `numberToWords`); niezmiennik po wszystkich umiejętnościach E1–E6 × ziarna (`stages`,
`generateTask`): wynik bez `− · □ < >`, NBSP, `=` i `:` między cyframi; **niezmiennik „mowa nie zdradza wyniku”** na tych
samych zadaniach: (i) `spokenText(speak ?? prompt)` nie ma samodzielnego tokenu cyfr rzymskich (`/(?<![\p{L}])[IVXLCDM]+(?![\p{L}])/u`
— syntezator czyta go jak liczbę); (ii) jeśli żadna forma odpowiedzi (cyfry bez NBSP, `numberToWords(answer)` dla liczby
całkowitej ≤ 1000, odpowiedź-tekst małymi literami, słowo `pl.speech` dla odpowiedzi-znaku `< > = + − · :`) nie występuje
jako token w widocznym poleceniu, to nie występuje też jako token w tekście mówionym; `narrationOf` dla każdej fazy (`round.test`
wzorce budowania stanu).

### Success Criteria:

#### Automated Verification:

- `tests/spoken.test.ts` czerwony przed implementacją, zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `□` nie zamieniane → niezmiennik czerwony; `:` w „Uzupełnij ciąg:” → „podzielić przez” → czerwony; ROMAN `speak` bez literowania (cyfry rzymskie w mowie) → niezmiennik „nie zdradza wyniku” czerwony; liczby dzielone po `\s` → przypadek „12 345” czerwony; przywrócone; meta-check: niezmiennik iteruje prawdziwe `stages`, więc łapie też `speak` z fazy 1
- `npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0` i pokazują `czyta:`
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Odczyt nauczyciela linii `czyta:` z `npm run sample -- E1/E3/E6 --count 6`: działania słownie poprawne, zdania naturalne do odsłuchu, nic nie zdradza wyniku; słowa `pl.speech`; zapis w `reviews/teacher-read.md`

---

## Phase 3: Wybór głosu, domyślne auto-czytanie i moduł lektora

Driver: tdd
Driver why: lektora nie ma; failing testy na atrapie syntezatora (pusta lista → `voiceschanged`, limit czasu, `pl_PL`, `cancel` przed `speak`) prowadzą implementację.

### Overview

Czyste reguły głosu w `core` i moduł UI nad wstrzykniętym `speechSynthesis`, bez prawdziwych głosów w testach.

### Changes Required:

#### 1. Reguły

**File**: `src/core/narration/voice.ts` (nowy), `src/data/balance.ts`

**Intent**: `pickPolishVoice(voices)` normalizuje `lang` (`_`→`-`, małe litery, prefiks `pl`), preferuje
`localService === true`, zwraca indeks/obiekt albo `null`. `defaultAutoRead(stageId, autoReadStages)`.
Balans: `narrator: { rate: 0.85, voicePollMs: 250, voiceTimeoutMs: 3000, cancelGapMs: 80, autoReadStages: ['E1', 'E2'] }`.

**Contract**: `pickPolishVoice<V extends { lang: string; localService: boolean }>(voices: readonly V[]): V | null`;
`defaultAutoRead(stageId: string, stages: readonly string[]): boolean`.

#### 2. Moduł lektora

**File**: `src/ui/narrator.ts` (nowy)

**Intent**: `createNarrator(synth | undefined, makeUtterance, timers, opts)` → `{ available, onAvailability(cb), speak(text),
unlock(), cancel() }` (zachowanie w Critical Implementation Details). Bez kodu na poziomie modułu; nie dotyka `window`.

**Contract**: interfejs `Narrator`; typy syntezatora jako minimalny podzbiór (`getVoices`, `speak`, `cancel`,
`addEventListener('voiceschanged')`), żeby atrapa w teście i stub w e2e pasowały.

#### 3. Testy

**File**: `tests/narratorVoice.test.ts`, `tests/narrator.test.ts` (nowe)

**Intent**: `pickPolishVoice` dla `pl-PL`, `pl_PL`, `PL`, brak, tylko sieciowy; `defaultAutoRead` E1–E6. Moduł z atrapą
i fałszywymi zegarami (`vi.useFakeTimers`): lista pusta → `voiceschanged` → dostępny; nigdy → po limicie niedostępny;
`speak` woła `cancel`, potem `speak` z polskim `voice`, `lang`, `rate`; `synth` `undefined` → niedostępny, `speak` no-op;
błąd wypowiedzi nie rzuca.

### Success Criteria:

#### Automated Verification:

- Dwa nowe pliki testów czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `utterance.voice` nieustawiany → test czerwony; `pickPolishVoice` bez normalizacji `_` → czerwony; przywrócone; meta-check: atrapa zgłasza głosy tak jak Android (`pl_PL`) i Chromium (pusta lista do zdarzenia)
- `npm run lint` zielony; granica `src/core/**` domknięta: `speechSynthesis` i `SpeechSynthesisUtterance` dopisane do `no-restricted-globals` w `eslint.config.mjs` (dziś lista ma tylko `window`, `document`, `navigator`, `localStorage`, a `no-undef` jest wyłączone dla TS — rdzeń mógłby ich użyć bez błędu) i przypadek w `tests/lint-boundaries.test.ts`; `src/ui/**` ma już globale przeglądarki; komenda bramki bez zmian
- Pełna bramka lokalna zielona

---

## Phase 4: Model podsumowania i widoczność przełącznika

Driver: tdd
Driver why: `summaryView` i reguła `switchVisible` między zadaniami nie istnieją; failing testy (gwiazdki z wyników, bonus, wyróżnienie przy koszcie) prowadzą implementację (risk #11 część unit, FR-010, FR-011).

### Overview

Czysty widok ekranu podsumowania i poprawiona widoczność przełącznika w `roundView`. Pasek `roundEnd` zostaje do fazy 6.

### Changes Required:

#### 1. Widok podsumowania

**File**: `src/core/round/summary.ts` (nowy)

**Intent**: `summaryView(state, { starsTotal, nextRoomTaskCost })` → `{ earned: starsEarned (z bonusem), bonus:
bonusEarned, stars: outcomes.map(o => o === 'first' || o === 'second'), roomHighlighted: cost !== null && starsTotal >= cost }`;
`null` dla stanu niezakończonego.

**Contract**: typ `SummaryView`; funkcja czysta.

#### 2. Przełącznik

**File**: `src/core/round/view.ts`

**Intent**: `switchVisible = !finished && phase === 'done'` (między zadaniami: po poprawnej odpowiedzi przed „Dalej”;
FR-011). Komentarz pola zaktualizowany.

**Contract**: pole `RoundView.switchVisible` bez zmiany typu.

#### 3. Testy

**File**: `tests/summary.test.ts` (nowy), `tests/roundView.test.ts`

**Intent**: czysta runda → 5 pełnych, `earned` 7, `bonus` 2; runda z `retype` → 4 pełne, brak bonusu; `roomHighlighted`
dla `null`, równości i braku; `switchVisible` tylko w `done` przed końcem rundy, nigdy w `first`/`second`/`solution`/`retype`.

### Success Criteria:

#### Automated Verification:

- `tests/summary.test.ts` i nowe przypadki `tests/roundView.test.ts` czerwone przed, zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `switchVisible` = `true` w `first` → czerwony; `stars` liczy `retype` jako gwiazdkę → czerwony; przywrócone; meta-check: stany budowane reduktorem (`answer`/`next`), nie ręcznie
- Pełna bramka lokalna zielona

---

## Phase 5: Głośnik w HUD i podłączenie lektora

Driver: impl
Driver why: widżet i sklejka scen nad logiką z faz 2–3; czerwone/zielone dają test układu i e2e w fazie 12.

### Overview

Nowy komponent: `SpeakerButton` (104×104, ikona głośnika rysowana w kodzie: trójkąt + dwa łuki). `UIScene` dostaje
wejście i pokazuje głośnik, gdy lektor dostępny i jest tekst do odczytu. `TaskScene` publikuje `narration` w rejestrze
i woła auto-czytanie przy nowym zadaniu.

### Changes Required:

#### 1. Tokeny i rejestr

**File**: `src/data/layout.ts`

**Intent**: `HUD_LAYOUT.speaker` (left 1494 = licznik − 24 − 104, top 44, 104×104, kolory HUD kitu `#fffdf2`/`#fff0cc`/`#d3b77d`,
ramka 5, promień 32); `REGISTRY_KEYS.narration`, `REGISTRY_KEYS.narrator`; `TASK_TOUCH_TARGETS` (albo nowe `HUD_TOUCH_TARGETS`) z głośnikiem.

**Contract**: tylko stałe.

#### 2. Lektor w grze

**File**: `src/main.ts`

**Intent**: Utworzyć jeden lektor (`createNarrator(window.speechSynthesis` gdy istnieje, `new SpeechSynthesisUtterance`,
zegary okna, `balance.narrator`), zapisać w `game.registry` (`REGISTRY_KEYS.narrator`), jednorazowe `unlock` na
pierwszym DOM `pointerup`/`touchend` kontenera, `cancel` na `visibilitychange` → `hidden`.

**Contract**: żadnego tekstu ani liczby balansu w `main.ts` poza referencją do `balance`.

#### 3. Sceny i widżet

**File**: `src/ui/widgets/SpeakerButton.ts` (nowy), `src/scenes/UIScene.ts`, `src/scenes/TaskScene.ts`

**Intent**: `SpeakerButton` reaguje w `pointerup`, ma `target()` (null, gdy ukryty). `UIScene`: `input.enabled = true`,
głośnik widoczny = `narrator.available && registry.narration !== null`, stuknięcie → `narrator.speak(registry.narration)`.
`TaskScene.render` ustawia `narration` = `narrationOf(...)` (gotowy tekst mówiony; słowa z `pl.speech`); przy nowym zadaniu
i `autoRead` (z `defaultAutoRead(stage.id, balance.narrator.autoReadStages)`, pole sceny) woła `narrator.speak`.
DESIGN-GAP (d): kit bez głosu prosi dorosłego, plan ukrywa przycisk.

**Contract**: `SpeakerButton.setVisible(on)`, `target()`; `UIScene` nie decyduje o tekście, tylko czyta rejestr.

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts` obejmuje głośnik (≥ `MIN_TOUCH_TARGET`, w HUD, nie nachodzi na licznik); unit `<baseline gałęzi> + N`
- Deliberate break: szerokość głośnika 90 → test układu czerwony; przywrócone; meta-check: test czyta tę samą stałą, której używa widżet
- Pełna bramka lokalna zielona (e2e 4 passed: atrapa nie jest jeszcze potrzebna, bo E3 nie czyta automatycznie, a testy nie stukają głośnika)

#### Manual Verification:

- [visual] Zrzuty task-tiles i task-keypad z głośnikiem w HUD oraz task-tiles bez polskiego głosu (głośnik ukryty) przy 1440×900 i 1024×768; porównanie z `task-tiles.png`/`task-keypad.png`

---

## Phase 6: Ekran podsumowania z „Kolejna runda” i „Do pokoju”

Driver: impl
Driver why: renderowanie gotowego `summaryView` (faza 4) w scenie; logika w `core` przetestowana.

### Overview

Nowe komponenty: `PageButton` (450×128, wariant główny turkusowy, drugorzędny kremowy, wyróżniony; reaguje w `pointerup`),
`SummaryPanel` („Brawo!”, rząd 5 gwiazdek 98 px, „★ +N”, linia bonusu, dwa przyciski). Pasek `roundEnd` znika.

### Changes Required:

#### 1. Tokeny i teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `SUMMARY_LAYOUT` z kitu (tytuł top 290 86 px; gwiazdki left 656 top 420 gap 26 rozmiar 98; „★ +N” top 578
124 px; przyciski left 454 top 816 gap 36, 450×128, 46 px, ramka 5, promień 32); kolory drugorzędne `#fffbee`/`#fff0ca`/`#c0a363`
i wyróżnienia (DESIGN-GAP a). `pl.summary`: „Kolejna runda”, „Do pokoju”, `earned(n)` „+N”; tytuł = `pl.round.correct`;
bonus = `pl.round.bonus` (linia pod „+N”, tylko przy bonusie, DESIGN-GAP b).

**Contract**: tylko stałe; cele w `TASK_TOUCH_TARGETS`/nowym zbiorze sprawdzanym testem układu.

#### 2. Model widoku i pasek

**File**: `src/core/round/view.ts`, `src/ui/widgets/FeedbackBar.ts`, `tests/roundView.test.ts`

**Intent**: Usunąć wariant `roundEnd` z unii `bar` (przy `finished` → `none`) i gałąź w `FeedbackBar`; test zaktualizowany.

**Contract**: `RoundView['bar']` bez `roundEnd`.

#### 3. Scena i widżety

**File**: `src/ui/widgets/PageButton.ts`, `src/ui/widgets/SummaryPanel.ts` (nowe), `src/scenes/TaskScene.ts`

**Intent**: Przy `finished` `TaskScene` chowa kafelki/klawiaturkę/polecenie/kropki (zeszyt zostaje) i pokazuje
`SummaryPanel` z `summaryView(state, { starsTotal, nextRoomTaskCost: null })`; `narration` = `null` (głośnik ukryty),
`narrator.cancel()`. „Kolejna runda” → logika z dawnej gałęzi `advance` (dolicza `sessionStars`, `freshRound`) i
auto-czytanie pierwszego zadania; „Do pokoju” — zdarzenie `toRoom` (w tej fazie bez celu; scena w fazie 7).
DESIGN-GAP (c): rząd gwiazdek = zadania z gwiazdką.

**Contract**: `SummaryPanel.show(view)`, `hide()`, `targets(): { nextRound; toRoom }`; `PageButton.target()`.

### Success Criteria:

#### Automated Verification:

- Test układu obejmuje przyciski strony (≥ `MIN_TOUCH_TARGET`, bez nakładania); `tests/roundView.test.ts` bez `roundEnd`; unit `<baseline gałęzi> + N`
- Deliberate break: wysokość `PageButton` 90 → test układu czerwony; przywrócone; meta-check: ta sama stała co widżet
- `npx playwright test` zielony: testy #11 kończą się na piątym „Dalej” i asercji `finished`, które nadal są prawdą (spec przepisuje faza 11)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Nowe teksty `pl.summary` czytane jak przez nauczyciela (kopia z kitu: „Kolejna runda”, „Do pokoju”)
- [visual] Zrzuty summary: czysta runda (5 gwiazdek, „★ +7”, linia bonusu) i runda z przepisaniem (4 pełne, bez bonusu), licznik w HUD widoczny, głośnik ukryty — przy 1440×900 i 1024×768; porównanie z `summary.png`

---

## Phase 7: Pusta scena pokoju i powrót

Driver: impl
Driver why: nowa scena-placeholder i przejścia Phasera (`scene.switch`); brak nowej logiki w `core`.

### Overview

Nowy komponent: `RoomScene` (tło-placeholder rysowane w kodzie z podpisem, „Wróć do notesu” jako `PageButton` 480×116).
„Do pokoju” z podsumowania → `scene.switch(room)`; powrót → `scene.switch(task)` wznawia `TaskScene` w stanie, w którym
była (podsumowanie). Licznik z `UIScene` nad pokojem.

### Changes Required:

#### 1. Tokeny, teksty, klucze

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `SCENE_KEYS.room`; `ROOM_LAYOUT` (tło, podpis, `resume` left 720 top 892 480×116 48 px turkus); `pl.room`:
„Wróć do notesu” (kit) i podpis placeholdera (np. „Tu powstanie pokój”) — DESIGN-GAP (e).

**Contract**: tylko stałe.

#### 2. Scena

**File**: `src/scenes/RoomScene.ts` (nowy), `src/main.ts`, `src/scenes/TaskScene.ts`

**Intent**: `scene: [BootScene, TaskScene, RoomScene, UIScene]` (UI na górze). `TaskScene` przed przejściem: `narrator.cancel()`,
`narration` = `null`; po `wake` (`this.events.on('wake')`) — ponowne ustawienie `narration` i rejestru z bieżącego stanu
(bez auto-czytania). `RoomScene` nie trzyma stanu rundy. `.return-note` z kitu pominięta (licznik HUD wystarcza).

**Contract**: `RoomScene.resumeTarget(): Point | null` dla haka.

### Success Criteria:

#### Automated Verification:

- Test układu obejmuje `resume` (≥ `MIN_TOUCH_TARGET`); unit `<baseline gałęzi> + N`
- Deliberate break: `resume` wysokość 90 → test układu czerwony; przywrócone; meta-check: przejścia scen dowodzi e2e (faza 11), nie ten test
- Pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Podpis placeholdera pokoju i „Wróć do notesu” czytane jak przez nauczyciela
- [visual] Zrzut room (placeholder, licznik w HUD nad pokojem, „Wróć do notesu”) i summary po powrocie (ten sam wynik) przy 1440×900 i 1024×768

---

## Phase 8: Hak e2e — ekran, rysowany licznik, podsumowanie, głośnik, pokój

Driver: impl
Driver why: sklejka tylko do odczytu w buildzie e2e; czerwone/zielone daje istniejący strażnik builda.

### Overview

Migawka haka mówi, który ekran widać, jaki tekst ma rysowany licznik (follow-up S-04), co pokazuje podsumowanie i co
przeczyta głośnik; cele dostają przyciski podsumowania, pokoju i głośnika.

### Changes Required:

#### 1. Hak

**File**: `src/testing/e2eHook.ts`, `src/scenes/TaskScene.ts`, `src/scenes/UIScene.ts`, `src/scenes/RoomScene.ts`

**Intent**: `snapshot` dokłada: `screen: 'task' | 'summary' | 'room'` (pokój aktywny → `room`; `finished` → `summary`;
inaczej `task`), `counterText` (`StarCounter.value()` przez publiczną metodę `UIScene`), `summary: SummaryView | null`,
`narration: string | null`, `speakerVisible`, `autoRead`. `targets` dokłada `nextRound`, `toRoom`, `resume`, `speaker`.
Pole `counter` (rejestr) zostaje dla zgodności specu do fazy 11, potem usunięte w fazie 11. Wszystko zamrożone kopie,
bez setterów.

**Contract**: znacznik `__martynkaE2E` tylko w `src/testing/e2eHook.ts`; import haka tylko w gałęzi `if (__E2E_HOOK__)`.

### Success Criteria:

#### Automated Verification:

- `npm run build` drukuje `e2e hook: absent (N chunks checked)`; `grep -rl __martynkaE2E dist/` pusty
- `E2E_HOOK=1 npm run build -- --outDir dist-e2e` drukuje `e2e hook: present`
- Deliberate break: `installE2EHook(game)` wywołane w `src/main.ts` poza `if (__E2E_HOOK__)` → `npm run build` pada z komunikatem strażnika; przywrócone; meta-check: sam import bez wywołania NIE jest przerwą (Rollup usuwa nieużyty eksport razem ze znacznikiem, build zostaje zielony) — przerwa musi wciągnąć kod haka do bundla; scen nie importują haka (cykl `e2eHook` → `TaskScene`)
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

---

## Phase 9: Przełącznik „Do pokoju” w HUD między zadaniami

Driver: impl
Driver why: widżet HUD nad gotową regułą `switchVisible` (faza 4) i istniejącym przejściem do pokoju (faza 7). Faza odcinalna: bez niej slice nadal spełnia FR-009/FR-010; wtedy wiersz 4 design-gaps i follow-up wracają na S-09.

### Overview

Nowy komponent: `RoomSwitchButton` (316×104, ikona domu rysowana w kodzie + „Do pokoju”, lewy górny róg HUD). Widoczny
tylko, gdy `roundView.switchVisible`; stuknięcie → ta sama ścieżka co „Do pokoju” z podsumowania; powrót wznawia rundę
w fazie `done` (dziecko stuka „Dalej”).

### Changes Required:

#### 1. Tokeny, rejestr, widżet

**File**: `src/data/layout.ts`, `src/ui/widgets/RoomSwitchButton.ts` (nowy), `src/scenes/UIScene.ts`, `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`

**Intent**: `HUD_LAYOUT.roomSwitch` (left 104, top 44, 316×104); `REGISTRY_KEYS.roomSwitch` ustawiane przez `TaskScene`
z `view.switchVisible`; `UIScene` pokazuje przycisk i emituje zdarzenie gry `toRoom`, które `TaskScene` obsługuje jak
przycisk podsumowania. Przed `scene.switch` do pokoju `TaskScene` zeruje `REGISTRY_KEYS.roomSwitch` (obok `narration`),
a po `wake` odtwarza je z `roundView` — inaczej „Do pokoju” z HUD zostaje widoczne w pokoju (uśpiona `TaskScene` nie
renderuje), a stuknięcie trafiłoby do uśpionej sceny przez `game.events` (słuchacze `game.events` działają także w uśpionej
scenie — Phaser `Systems.sleep` ich nie odpina; obsługa `toRoom` w `TaskScene` sprawdza `this.sys.isSleeping()`). W pokoju przełącznikiem jest „Wróć do notesu” (FR-011). Hak: `targets.roomSwitch`. `UIScene` zdejmuje komentarz DESIGN-GAP 4; wiersz 4 w
`docs/design-gaps.md` przepisany: kit pokazuje „Do pokoju” zawsze, PRD FR-011 ukrywa w trakcie rozwiązywania.

**Contract**: `RoomSwitchButton.setVisible(on)`, `target()`; tekst `pl.summary.toRoom` współdzielony.

### Success Criteria:

#### Automated Verification:

- Test układu obejmuje przełącznik (≥ `MIN_TOUCH_TARGET`, nie nachodzi na kropki postępu); unit `<baseline gałęzi> + N`
- Deliberate break: `switchVisible` = `phase !== 'solution'` → `tests/roundView.test.ts` czerwony; przywrócone; meta-check: dowodzi reguły, rysowanie dowodzi e2e (faza 11)
- Pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty: correct z przełącznikiem „Do pokoju” w HUD, hint (second try) bez przełącznika, room po wejściu z HUD, task po powrocie (ta sama runda, faza `done`) przy 1440×900 i 1024×768

---

## Phase 10: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–9, bez nowej logiki.

### Overview

Luki projektu, follow-upy, `CLAUDE.md`/`AGENTS.md`, przegląd szwów i wiersze decyzji dla opiekuna.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: Usunąć wiersz 5 (pasek końca rundy zastąpiony podsumowaniem); dodać: (a) wyróżniony „Do pokoju”, (b) linia
bonusu w podsumowaniu, (c) znaczenie rzędu gwiazdek, (d) brak głosu → przycisk ukryty, (e) pusty pokój bez sztuki,
(f) licznik HUD na podsumowaniu (kit bez HUD); wiersz 4 jak w fazie 9 (albo bez zmian, gdy faza 9 odcięta).
Każdy wiersz ma komentarz `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/narrator-round-summary/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — koszt bieżącego zadania remontowego do `summaryView` (S-09); `numberToWords` > 1000 w mowie
(warunek: odsłuch na tablecie); „Oblicz” nad porównaniami (`isExpression`, S-17 albo następna zmiana `drawPrompt`);
ryzyko lektora w test-plan (`/10x-test-plan refresh`); przełącznik rodzica `autoRead` (S-08) i zapis (S-11); przeniesione
z S-04: `pl.title` i gołe liczby animacji (S-06), kropki kroków (następna zmiana `SolutionSteps`).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md` (Current state), `AGENTS.md` (jeśli opisuje sceny/strukturę), pliki faz 1–9

**Intent**: Current state: lektor (`src/core/narration/`, `src/ui/narrator.ts`), podsumowanie, `RoomScene`, HUD,
rozszerzony hak. Seam sweep: duplikaty (literowanie rzymskie vs `romanBreakdown`, kolory HUD w kilku stałych),
nieaktualne komentarze (`UIScene` „takes no input”, `view.ts` „never during a task”, `main.ts` lista scen), martwe
klucze (`pl.round.next` w końcu rundy, `TaskSnapshot.counter`), nieużywane eksporty.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: profil (`context/foundation/autonomous-run.md`) wskazuje nieistniejący plik → `validate-rule-files.sh` FAIL; przywrócone; meta-check: walidator czyta ten profil (lista plików § 10) — ta sama przerwa co w S-04 10.2
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–9; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`
- [human] Decyzja: auto-czytanie tylko jako domyślna wartość od etapu w sesji, bez przełącznika rodzica do S-08 (FR-009 „ustawienie rodzica”)
- [human] Decyzja: „Do pokoju” w wariancie zwykłym do S-09 — wyróżnienie liczone regułą, ale koszt bieżącego zadania remontowego jeszcze nie istnieje (FR-010)
- [human] Decyzja: z pokoju powrót na ekran, z którego dziecko wyszło (kit), zamiast nowej rundy (`change.md` decyzja 3)
- [human] Decyzja: pierwsze zadanie po zimnym starcie nie jest czytane automatycznie (wymóg gestu przeglądarki), także w E1–E2
- [human] Odsłuch na iPadzie (Safari, PWA) i tablecie z Androidem: jakość polskiego głosu, liczebniki w zdaniach („2 książki”), literowanie cyfr rzymskich, czy jedno dotknięcie odblokowuje auto-czytanie na całą sesję (PRD Open Question 7)

---

## Phase 11: Podsumowanie i pokój dotykiem — e2e ryzyka #11

Driver: e2e
Driver why: ryzyko #11 (runda dotykiem do końca) kończy się teraz na podsumowaniu i jego przyciskach, które istnieją tylko w renderowanym UI i przejściach scen; zbudowane w fazach 6–9, hak w fazie 8, kontrakt `E2E=on`.

### Overview

`tests/e2e/task-round.spec.ts` (projekt `chromium-hook`): wszystkie testy podstawiają `speechSynthesis` bez głosów
(`page.addInitScript`, kod testu), koniec rundy sprawdzany na podsumowaniu i rysowanym liczniku, nowy test pokoju.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/task-round.spec.ts`, `src/scenes/TaskScene.ts` (usunięcie `TaskSnapshot.counter` po przejściu specu na `counterText`)

**Intent**: Testy 1–3 kończą się `screen === 'summary'`, `summary.earned`/`stars`/`bonus` zgodnymi z PRD i `counterText`
równym sumie; test 1 dodatkowo stuka „Kolejna runda” → `screen === 'task'`, `index 0`, suma zachowana. Nowy test:
runda do podsumowania → „Do pokoju” → `screen === 'room'`, `counterText` bez zmian → „Wróć do notesu” → `screen === 'summary'`
z tym samym `summary`; plus (gdy faza 9 jest, w tym samym teście pokoju, więc delta zostaje +1) poprawna odpowiedź → `roomSwitch` widoczny →
pokój (`targets.roomSwitch === null`) → powrót → ta sama runda, `phase === 'done'`, „Dalej” działa. Tytuły z `#11`.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `npx playwright test tests/e2e/task-round.spec.ts`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/task-round.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 1` passed
- Deliberate break: powrót z pokoju przez `scene.start(task)` zamiast `switch` → test pokoju czerwony (runda od nowa); przywrócone; meta-check: unit zielone przy tej przerwie, więc spec dowodzi przejścia scen — cytat czerwieni w handoff §3
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Phase 12: Lektor przez dotyk na atrapie syntezatora

Driver: e2e
Driver why: widoczność głośnika i ścieżka `pointerup` → lektor → syntezator istnieją tylko w renderowanym UI (`UIScene` nad `TaskScene`); zbudowane w fazach 5 i 8; ryzyko bez numeru w test-plan (PRD NFR „brak głosu nie blokuje przepływu”, follow-up `/10x-test-plan refresh`), kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/narrator.spec.ts` na buildzie z hakiem; atrapa `speechSynthesis` + `SpeechSynthesisUtterance`
w `page.addInitScript` zapisuje wypowiedzi (tekst, `voice.lang`, `rate`) w globalu testu (nie haka).

### Changes Required:

#### 1. Spec i projekt

**File**: `tests/e2e/narrator.spec.ts` (nowy), `playwright.config.ts`

**Intent**: Projekt `chromium-hook` dopasowuje oba speki (`/(task-round|narrator)\.spec\.ts/`), `chromium` je ignoruje.
Test 1 (polski głos `pl_PL` w atrapie): głośnik widoczny, stuknięcie → ostatnia wypowiedź = `snapshot.narration`,
bez `□ − ·` i NBSP, `voice.lang` zaczyna się od `pl`; po złej odpowiedzi stuknięcie czyta „Spróbuj jeszcze raz…”.
Test 2 (bez głosów): po limicie wykrycia głośnik ukryty (`targets.speaker === null`), runda grana do podsumowania.

**Contract**: komenda bramki `npx playwright test` bez zmian; zasady e2e jak w fazie 11.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/narrator.spec.ts` zielony; pełne `npx playwright test`: `<baseline gałęzi e2e> + 2` passed
- Deliberate break: `UIScene` z `input.enabled = false` → test 1 czerwony (stuknięcie nie dochodzi do lektora); przywrócone; meta-check: testy unit lektora (faza 3) zostają zielone, więc spec dowodzi ścieżki dotyku przez HUD — cytat czerwieni w handoff §3
- Pełna bramka lokalna zielona; serwery 4397/4398 zabite

---

## Testing Strategy

### Unit Tests:

- `speak` generatorów porównań, brakującego znaku, ROMAN i CALENDAR: obecny, nie zdradza wyniku.
- `spokenText` i `narrationOf`: niezmiennik po wszystkich umiejętnościach E1–E6 (bez symboli i NBSP), przypadki z kitu.
- `pickPolishVoice`, `defaultAutoRead`, moduł lektora na atrapie z fałszywymi zegarami.
- `summaryView`, `switchVisible`, stałe układu (głośnik, przyciski strony, `resume`, przełącznik) ≥ 96 px.

### Integration Tests:

- `npm run sample -- E1..E6` z liniami `mowa:`/`czyta:`; `npm run build` ze strażnikiem haka; seed #8 (produkcja),
  #11 (podsumowanie, pokój) i spec lektora w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty: task-tiles/task-keypad z głośnikiem i bez, summary (czysta / z przepisaniem), room, summary po powrocie,
   correct z przełącznikiem, hint bez przełącznika, task po powrocie — przy 1440×900 i 1024×768.
2. Odczyt nauczyciela: `mowa:`/`czyta:` w sample, teksty `pl.summary`, `pl.room`.
3. iPad i Android: odsłuch, gest, auto-czytanie po „Kolejna runda”.

## Performance Considerations

Wykrycie głosu odpytuje co 250 ms najwyżej 3 s i nie blokuje startu; `speak` po `cancel` z 80 ms przerwą; podsumowanie
i pokój rysowane raz (obiekty pokazywane/chowane, nie tworzone przy każdym `render`).

## Migration Notes

Brak: bez bazy danych; `autoRead` i gwiazdki w pamięci sesji do S-11 (profil § 4).

## Known risks

- **iOS i sticky activation**: niepotwierdzone pierwotnym źródłem, czy jeden gest odblokowuje mowę na sesję — auto-czytanie
  po „Dalej” (`pointerdown`) może na iPadzie milczeć; „Kolejna runda” mówi w `pointerup`. Wiersz `[human]` 10.
- **Jakość polskiego głosu** (PRD OQ 7): nie do sprawdzenia w headless; przepływ działa bez głosu (spec fazy 12).
- **`UIScene` z włączonym wejściem** nad `TaskScene`: dotyk poza przyciskami HUD musi dochodzić do kafelków — pilnują
  testy #11 (faza 11) od pierwszego przebiegu po fazie 5.
  Phaser blokuje niższe sceny, gdy dotyk trafi w dowolny interaktywny obiekt `UIScene` (`InputPlugin.update`, `total > 0`):
  w `UIScene` żadnej pełnoekranowej strefy trafień ani interaktywnego tła, tylko przyciski HUD (plan-review F8).
- **NUMBER_WORDS „Jak zapisać słownie liczbę 23?”**: syntezator przeczyta „23” jako „dwadzieścia trzy”, czyli brzmienie
  odpowiedzi. To nie przeciek ponad widoczne polecenie (dziecko zna liczbę z cyfr; ćwiczenie to zapis słowny), więc
  niezmiennik „nie zdradza wyniku” (faza 2) przechodzi bez wyjątku; odczyt nauczyciela 2.5 ocenia, czy to zostaje (plan-review F9).

## References

- Research: `context/changes/narrator-round-summary/research.md`; change: `context/changes/narrator-round-summary/change.md`
- PRD: `context/foundation/prd.md` FR-009, FR-010, FR-011, NFR (lektor, bez dźwięku), Open Question 7
- Plan gry: `Martynka-urzadza.md` §3, §6, §11 (M2), §14
- Test-plan: `context/foundation/test-plan.md` ryzyko #11, „Narrator voice quality”; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/style-guide.md`, `screenshots/summary.png`, `task-tiles.png`, `task-keypad.png`, `preview.js` (`speak`, `hud`, `render`), `screen.css`, `maths.css`
- Follow-upy S-04: `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md`
- Format: `context/archive/2026-10-12-task-round-stars/plan.md`

## Autonomous decisions

1. **Z pokoju powrót na ekran, z którego dziecko wyszło (kit `preview.js` `roomReturn`), nie nowa runda.** Wbrew
   `change.md` decyzja 3 („z podsumowania powrót startuje nową rundę”). Odrzucone: nowa runda po powrocie z
   podsumowania. Dlaczego: kit wiąże (profil § 6); jedna ścieżka `scene.switch` dla podsumowania i przełącznika HUD,
   bez specjalnego przypadku; dziecko i tak ma „Kolejna runda” na podsumowaniu. → wiersz `[human]` 10. Zmieniłoby:
   opiekun chce, by pokój był „przerwą” zerującą rundę.
2. **„★ +N” = gwiazdki rundy z bonusem; osobna linia bonusu pod spodem tylko przy bonusie; rząd 5 gwiazdek = zadania
   z gwiazdką (pierwsza lub druga próba).** Odrzucone: bonus tylko w „+N” (dziecko nie wie, za co +2), zawsze 5 pełnych
   (kit; myli przy przepisaniu). DESIGN-GAP b, c. Zmieniłoby: kit dostanie wariant podsumowania z bonusem.
3. **Wyróżnienie „Do pokoju” jako reguła `summaryView` z `nextRoomTaskCost: null` do S-09** (`change.md` decyzja 2).
   Wbrew dosłownemu FR-010 w produkcji nieosiągalne → wiersz `[human]` 10. Zmieniłoby: opiekun chce wyróżnienia już
   teraz (wtedy tymczasowy `balance.room.firstTaskCost`).
4. **Auto-czytanie w sesji z domyślną wartością od etapu, bez przełącznika** (`change.md` decyzja 5). Wbrew FR-009
   („ustawienie rodzica”) do S-08 → wiersz `[human]` 10. Na produkcji E3 ⇒ wyłączone; dowód w unit (`defaultAutoRead`)
   i w module lektora. Zmieniłoby: S-06 (placement) albo S-08 (ekran rodzica) wcześniej.
5. **Mowa w `pointerup` + jednorazowe odblokowanie na pierwszym DOM `pointerup`/`touchend`; `PageButton` w `pointerup`;
   `ActionButton` bez zmian.** Odrzucone: przestawienie wszystkich przycisków na `pointerup` (S-04 mierzy reakcję
   < 100 ms w `pointerdown`), mowa w `pointerdown` (nie daje aktywacji na dotyku, HTML spec). Zmieniłoby: odsłuch
   na iPadzie pokaże, że auto-czytanie po „Dalej” milczy — wtedy „Dalej” też w `pointerup`.
6. **Słowa mowy w `pl.speech` przekazywane do `core` argumentem; reguły w `src/core/narration/`, lektor w `src/ui/narrator.ts`.**
   Odrzucone: import `pl` w `core/narration` (generatory to robią, ale zasady rundy trzymają wzorzec argumentów),
   nowy katalog `src/audio/` (zmiana granic ESLint bez zysku). Zmieniłoby: nic w tym slice.
7. **`□` → „okienko” jedną regułą; generatory znaku dostają pytanie w `speak`.** Odrzucone: osobne słowa dla `□` zależnie
   od typu w `spoken.ts` (wiedza o typach poza generatorem). Zmieniłoby: odczyt nauczyciela uzna „okienko” w porównaniu
   za mylące — wtedy `speak` porównań bez `□` („Porównaj 3 i 5”).
8. **Liczby słownie tylko w segmentach-działaniach (≤ 1000), w zdaniach cyfry.** Odrzucone: `numberToWords` do milionów
   teraz, liczebniki w zdaniach (wymaga rodzaju rzeczownika). Zmieniłoby: odsłuch na tablecie (wiersz `[human]` 10).
9. **Podsumowanie jako warstwa w `TaskScene`, nie osobna scena.** Odrzucone: `SummaryScene` (trzecie przejście scen,
   stan rundy w dwóch miejscach). Dlaczego: `RoundState.finished` już jest stanem podsumowania; `scene.switch` do pokoju
   i z powrotem zachowuje go bez przekazywania. Zmieniłoby: podsumowanie dostanie animacje/tło kolidujące z zeszytem.
10. **Przełącznik HUD jako ostatnia faza kodu (9), odcinalna** (`change.md` decyzja 3, orkiestrator). Zmieniłoby: faza
    9 nie zmieści się w kontekście jednego agenta — wtedy wiersz 4 i follow-up wracają na S-09.
11. **Stub `speechSynthesis` w każdym speku z hakiem przez `page.addInitScript` (kod testu); hak tylko do odczytu, dalej
    nieobecny w produkcji (strażnik).** Odrzucone: wstrzykiwanie atrapy w buildzie e2e (kod testowy w bundlu), poleganie na
    braku głosów w headless (zmierzone: „Zosia” jest). Zmieniłoby: nic.
12. **Spec lektora jako osobny plik w projekcie `chromium-hook` (poszerzony `testMatch`).** Odrzucone: dopisanie do
    `task-round.spec.ts` (inne ryzyko; #11 dotyczy rundy). Zmieniłoby: `/10x-test-plan refresh` nada lektorowi numer
    ryzyka — tytuły dostaną ten numer.
13. **Brak watchdoga `onend`** (research: Safari bywa bez `onend` po `cancel`). Odrzucone: zegar na każdą wypowiedź.
    Dlaczego: lektor nie czeka na koniec mowy do żadnej decyzji; `cancel` przed każdym `speak` wystarcza. Zmieniłoby:
    funkcja zależna od końca mowy (np. podświetlanie).
14. **Kolejność faz: treść mówiona przed modułem i UI; pasek `roundEnd` usuwany dopiero w fazie 6**, żeby każda faza
    zostawiała grę z działającym końcem rundy.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Tekst mówiony w generatorach (porównania, brakujący znak, cyfry rzymskie)

#### Automated

- [x] 1.1 Nowe przypadki w pięciu plikach testów czerwone przed, zielone po; unit `<baseline gałęzi> + N` — d361c99
- [x] 1.2 Deliberate break: ROMAN `speak` = `prompt` / COMPARE_NUM bez `speak` → czerwony; przywrócone; meta-check na zadaniach z generatorów — d361c99
- [x] 1.3 `npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0` i pokazują `mowa:` — d361c99
- [x] 1.4 Pełna bramka lokalna zielona — d361c99

#### Manual

- [ ] 1.5 [reviewer] Odczyt nauczyciela `sample -- E1` … `-- E6 --count 6` dla COMPARE_NUM, COMPARE_EXPR, MISSING_OP, ROMAN, CALENDAR (`reviews/teacher-read.md`)

### Phase 2: Tekst mówiony dla rundy

#### Automated

- [x] 2.1 `tests/spoken.test.ts` czerwony przed, zielony po; unit `<baseline gałęzi> + N` — 2d43a08
- [x] 2.2 Deliberate break: `□` niezamieniane / dwukropek w zdaniu → „podzielić przez” / cyfry rzymskie w mowie / liczby dzielone po `\s` → czerwony; przywrócone; meta-check na `stages` — 2d43a08
- [x] 2.3 `npm run sample -- E1` … `-- E6` kończą się `Naruszenia: 0` i pokazują `czyta:` — 2d43a08
- [x] 2.4 Pełna bramka lokalna zielona — 2d43a08

#### Manual

- [ ] 2.5 [reviewer] Odczyt nauczyciela linii `czyta:` (`sample -- E1/E3/E6 --count 6`) i słów `pl.speech` (`reviews/teacher-read.md`)

### Phase 3: Wybór głosu, domyślne auto-czytanie i moduł lektora

#### Automated

- [x] 3.1 `tests/narratorVoice.test.ts` i `tests/narrator.test.ts` czerwone przed, zielone po; unit `<baseline gałęzi> + N` — 7955b4e
- [x] 3.2 Deliberate break: bez `utterance.voice` / bez normalizacji `_` → czerwony; przywrócone; meta-check atrapy (Android `pl_PL`, Chromium pusta lista) — 7955b4e
- [x] 3.3 `npm run lint` zielony; `speechSynthesis`/`SpeechSynthesisUtterance` zakazane w `src/core/**` (ESLint + `tests/lint-boundaries.test.ts`) — 7955b4e
- [x] 3.4 Pełna bramka lokalna zielona — 7955b4e

### Phase 4: Model podsumowania i widoczność przełącznika

#### Automated

- [x] 4.1 `tests/summary.test.ts` i nowe przypadki `tests/roundView.test.ts` czerwone przed, zielone po; unit `<baseline gałęzi> + N` — 1f0b93e
- [x] 4.2 Deliberate break: `switchVisible` w `first` / `retype` jako gwiazdka → czerwony; przywrócone; meta-check (stany z reduktora) — 1f0b93e
- [x] 4.3 Pełna bramka lokalna zielona — 1f0b93e

### Phase 5: Głośnik w HUD i podłączenie lektora

#### Automated

- [x] 5.1 `tests/layout.test.ts` obejmuje głośnik; unit `<baseline gałęzi> + N` — b83cd7b
- [x] 5.2 Deliberate break: głośnik 90 px → test układu czerwony; przywrócone; meta-check — b83cd7b
- [x] 5.3 Pełna bramka lokalna zielona (e2e 4 passed) — b83cd7b

#### Manual

- [ ] 5.4 [visual] Zrzuty task-tiles i task-keypad z głośnikiem oraz task-tiles bez głosu przy 1440×900 i 1024×768

### Phase 6: Ekran podsumowania z „Kolejna runda” i „Do pokoju”

#### Automated

- [x] 6.1 Test układu obejmuje przyciski strony; `tests/roundView.test.ts` bez `roundEnd`; unit `<baseline gałęzi> + N` — 074daca
- [x] 6.2 Deliberate break: `PageButton` 90 px → test układu czerwony; przywrócone; meta-check — 074daca
- [x] 6.3 `npx playwright test` zielony (testy #11 kończą się na `finished`) — 074daca
- [x] 6.4 Pełna bramka lokalna zielona — 074daca

#### Manual

- [ ] 6.5 [reviewer] Teksty `pl.summary` czytane jak przez nauczyciela
- [ ] 6.6 [visual] Zrzuty summary (czysta runda z bonusem; runda z przepisaniem) z licznikiem w HUD przy 1440×900 i 1024×768

### Phase 7: Pusta scena pokoju i powrót

#### Automated

- [x] 7.1 Test układu obejmuje `resume`; unit `<baseline gałęzi> + N` — b146a0f
- [x] 7.2 Deliberate break: `resume` 90 px → test układu czerwony; przywrócone; meta-check — b146a0f (obserwowany czerwony: resume height 90 < 96; meta-check: PageButton rysuje z tej samej stałej, przejścia scen dowodzi e2e fazy 11)
- [x] 7.3 Pełna bramka lokalna zielona — b146a0f

#### Manual

- [ ] 7.4 [reviewer] Podpis placeholdera pokoju i „Wróć do notesu” czytane jak przez nauczyciela
- [ ] 7.5 [visual] Zrzuty room (licznik nad pokojem) i summary po powrocie przy 1440×900 i 1024×768

### Phase 8: Hak e2e — ekran, rysowany licznik, podsumowanie, głośnik, pokój

#### Automated

- [x] 8.1 `npm run build` drukuje `e2e hook: absent (N chunks checked)`; grep `__martynkaE2E` w `dist/` pusty — 58d7497
- [x] 8.2 `E2E_HOOK=1 npm run build -- --outDir dist-e2e` drukuje `e2e hook: present` — 58d7497
- [x] 8.3 Deliberate break: bezwarunkowe wywołanie `installE2EHook` w `main.ts` → build pada; przywrócone; meta-check (sam import to nie przerwa) — 58d7497
- [x] 8.4 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0` — 58d7497 (unit 669 = baza 669 + 0; e2e: orkiestrator 4 passed na niezacommitowanym drzewie, Chromium w tej sesji: MachPort 1100)

### Phase 9: Przełącznik „Do pokoju” w HUD między zadaniami

#### Automated

- [x] 9.1 Test układu obejmuje przełącznik; unit `<baseline gałęzi> + N` — a9504c9 (unit 670 = baza 669 + 1)
- [x] 9.2 Deliberate break: `switchVisible` = `phase !== 'solution'` → czerwony; przywrócone; meta-check — a9504c9
- [x] 9.3 Pełna bramka lokalna zielona — a9504c9 (e2e: orkiestrator, MachPort w tej sesji)

#### Manual

- [ ] 9.4 [visual] Zrzuty correct z przełącznikiem, hint bez przełącznika, room z HUD, task po powrocie przy 1440×900 i 1024×768

### Phase 10: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [ ] 10.1 `validate-rule-files.sh` PASS
- [ ] 10.2 Deliberate break: profil wskazuje nieistniejący plik → FAIL; przywrócone; meta-check
- [ ] 10.3 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual

- [ ] 10.4 [reviewer] Seam sweep: duplikaty, nieaktualne komentarze, martwe klucze; DESIGN-GAP w kodzie i w `docs/design-gaps.md`
- [ ] 10.5 [human] Decyzja: auto-czytanie jako domyślna wartość od etapu w sesji, bez przełącznika rodzica do S-08 (FR-009)
- [ ] 10.6 [human] Decyzja: „Do pokoju” bez wyróżnienia do S-09 (FR-010)
- [ ] 10.7 [human] Decyzja: z pokoju powrót na ekran, z którego dziecko wyszło (kit), nie nowa runda (`change.md` decyzja 3)
- [ ] 10.8 [human] Decyzja: pierwsze zadanie po zimnym starcie nie jest czytane automatycznie (gest przeglądarki)
- [ ] 10.9 [human] Odsłuch na iPadzie (Safari, PWA) i Androidzie: jakość głosu, liczebniki w zdaniach, cyfry rzymskie, jedno odblokowanie na sesję (PRD OQ 7)

### Phase 11: Podsumowanie i pokój dotykiem — e2e ryzyka #11

#### Automated

- [ ] 11.1 `npx playwright test tests/e2e/task-round.spec.ts` zielony; pełne e2e `<baseline gałęzi e2e> + 1`
- [ ] 11.2 Deliberate break: powrót przez `scene.start` zamiast `switch` → spec czerwony; przywrócone; meta-check (unit zielone)
- [ ] 11.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite

### Phase 12: Lektor przez dotyk na atrapie syntezatora

#### Automated

- [ ] 12.1 `npx playwright test tests/e2e/narrator.spec.ts` zielony; pełne e2e `<baseline gałęzi e2e> + 2`
- [ ] 12.2 Deliberate break: `UIScene` bez wejścia → spec czerwony; przywrócone; meta-check (unit lektora zielone)
- [ ] 12.3 Pełna bramka lokalna zielona; serwery 4397/4398 zabite
