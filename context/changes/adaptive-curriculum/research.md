---
date: 2026-10-13T03:15:35+02:00
researcher: Claude (autonomous run 2026-10-12-s04-s08, krok research)
git_commit: afc005f
branch: feat/adaptive-curriculum
repository: Martynka-urzadza
topic: "S-07 adaptive-curriculum: startowy krok bez zapisu, wagi, opanowanie 0–5, odblokowanie, łagodzenie, unikalność poleceń, karta „Nowa umiejętność!”, e2e"
tags: [research, curriculum, mastery, unlock, easing, warm-up, unlock-card, e2e-hook, balance]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: adaptacja trudności (S-07)

**Date**: 2026-10-13T03:15:35+02:00
**Researcher**: Claude (autonomous run 2026-10-12-s04-s08)
**Git Commit**: afc005f
**Branch**: feat/adaptive-curriculum
**Repository**: Martynka-urzadza

Lessons: `lessons.md` w `context/foundation/` nie istnieje (`ls context/foundation/`), nic nie zastosowano. Kotwice:
plik + symbol, bez numerów linii (kontrakt runu). Pomiary pul poleceń: skrypt poza repo (`$TMPDIR/pool/pool.ts`,
2000 losowań na umiejętność, ziarna `createRng(1_000_000 + i)`, predykat grywalności skopiowany z
`src/core/round/pick.ts` `playable`).

## Research Question

Z polecenia kroku i `change.md` § Open questions:

1. Punkt startowy odblokowania bez zapisu (do S-11 każdy zimny start zeruje stan) tak, by produkcja nie zawęziła E3
   do pierwszych kroków (regresja wobec S-04, który losował z całego etapu), a reguły adaptacji działały po S-11.
2. Wzór wag, liczenie opanowania (tylko pierwsza próba, 0–5), reguła odblokowania („większość”), łagodzenie
   („słaba runda”), liczby do `balance.ts`.
3. Unikalność poleceń w rundzie i w rozgrzewce (dwa follow-upy) przy małych pulach (`SMALL_SPACES`).
4. Karta „Nowa umiejętność!”: tekst z kitu, nazwy kroków dla dziecka (nowa treść → teacher read), miejsce w przepływie.
5. E2E: ryzyko test-planu, determinizm istniejących specs, co hak ma wystawić (tylko odczyt) bez wycieku do produkcji.

## Summary

1. **Start = „kalendarz szkolny”, nie pierwszy krok.** Żadne źródło nie mówi, jak wybrać startowy krok w etapie
   (`LearnerState.unlockedStep` ma tylko komentarz „najwyższy odblokowany krok”, `Martynka-urzadza.md` §5; ZADANIA §3
   mówi jedynie, że kroki „idą w kolejności książek”). Jedyne zdanie PRD, które to rozstrzyga, to kryterium sukcesu:
   „W ustawieniach rodzica widać odblokowane kolejne kroki etapu … **zgodne z tym, co jest aktualnie w szkole**”
   (prd.md, Success Criteria). Rekomendacja: czysta funkcja `calendarStart(stage, month, age)` w `core/curriculum.ts`:
   etap za kalendarzem (indeks etapu < `proposeStage(age, month)`) → cały etap odblokowany; inaczej postęp półrocza
   z miesiąca → ostatni krok w kolejności grywalnych kroków, nie mniej niż `minStartSteps` (2). Dla E3 w październiku
   (dziś) to kroki 1, 2, 6 (bieżący 6); w styczniu cały etap. Po S-11 ta sama funkcja jest **podłogą**:
   `unlockedStep = max(zapisany, calendarStart)`, podniesienie podłogą jest ciche (bez karty). Miesiąc już jest w rejestrze
   (`REGISTRY_KEYS.month`, `src/main.ts`), a build e2e przypina go `?e2eMonth=N` (`src/testing/e2eHook.ts` `e2eMonth`).
2. **Liczby do `balance`**: wagi `{ current: 60, earlier: 30, previous: 10 }`, pusty koszyk renormalizowany;
   `mastery: { max: 5, streakForGain: 3, gain: 1, loss: 1, unlockAt: 4, historyLength: 200 }`; odblokowanie, gdy
   liczba grywalnych umiejętności bieżącego kroku z opanowaniem ≥ 4 jest **≥ ceil(0.5 · n)** (`unlockShare: 0.5`, „≥”,
   nie „>” — przy `>` krok z dwiema umiejętnościami byłby blokowany przez jedną trudną, wbrew ZADANIA §1); łagodzenie
   `{ weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } }`; runda słaba =
   mniej niż 3 zadania dobrze w **pierwszej** próbie (rozgrzewka się nie liczy).
3. **Unikalność**: porównywać `Task.prompt` (zwykły string; `visual` nie dodaje różnorodności — zmierzone), ponowne
   losowanie tej samej umiejętności do `balance.round.uniqueRetries` (20) razy, potem duplikat akceptowany (bez wyjątku).
   Najmniejsza pula grywalnej umiejętności to 9 poleceń (`E1.7.complement_10`), najmniejsza pula jednokrokowa
   na starcie to 25 (`E1.2.compare_num_5`), więc 5–6 różnych poleceń zawsze istnieje; szansa porażki 20 prób przy 5
   zajętych z 9 ≈ (5/9)^20 ≈ 8·10⁻⁶. Jedna funkcja w `core` dla `buildRound` i `buildWarmup`.
4. **Karta**: kit `unlock.png` / `preview.js` (`screen==='unlock'`) / `maths.css` `.unlock-card`: tytuł „Nowa
   umiejętność!”, ikona książki, jedna krótka nazwa (przykłady kitu: „Dodawanie do 10”, „Dodawanie do 100”), przycisk
   „Dalej”; pokazywana **po „Kolejna runda”**, „Dalej” startuje nową rundę. Nazwy kroków dla dziecka to nowe pole
   danych w `src/data/curriculum/*` — 48 grywalnych kroków (42 osiągalnych kartą), teacher read.
5. **E2E**: żadne ryzyko test-planu nie pokrywa adaptacji (#2 wspomina tylko utratę „mastery”); propozycja nowego
   ryzyka do odświeżenia test-planu niżej. Istniejące specs zostają deterministyczne: najwięcej poprawnych pierwszych
   prób w **zwykłych** rundach jednej sesji to 5, a odblokowanie wymaga co najmniej 12 (4 × seria 3) w jednej
   umiejętności bieżącego kroku. Hak (tylko build e2e) dostaje zamrożoną kopię stanu adaptacji i `screen: 'unlock'` +
   cel „Dalej”; już dziś wystawia `answer` — dopuszczalne, bo strażnik buildu (`vite/e2eHookGuard.mjs`) dowodzi
   nieobecności haka w `dist/`.

## Detailed Findings

### 1. Punkt startowy odblokowania

**Co mówią źródła (cytaty zebrane w tym kroku):**

- prd.md Success Criteria: „W ustawieniach rodzica widać odblokowane kolejne kroki etapu i rosnące opanowanie
  umiejętności, zgodne z tym, co jest aktualnie w szkole.”
- prd.md US-01 AC: „Każde zadanie jest w zakresie liczb bieżącego etapu i odblokowanych kroków”.
- prd.md Business Logic: wejścia reguły to „etap ustawiony przy pierwszym uruchomieniu …, wynik rozgrzewki, historia
  odpowiedzi … per umiejętność, wynik ostatnich rund” — **miesiąc nie jest wejściem reguły kroków**, tylko etapu
  (FR-012). To luka/niedopowiedzenie PRD: reguła startowego kroku nie istnieje; kryterium „zgodne z tym, co w szkole”
  jest jedynym tekstem, który ją ukierunkowuje.
- ZADANIA §1 „Etapy”: E1 = klasa 1, I półrocze … E6 = klasa 3, II półrocze; §3: „Kroki są małe i idą w kolejności
  książek.” Wniosek (nie fakt źródła): kolejność kroków przybliża kolejność w półroczu szkolnym, więc miesiąc w półroczu
  przybliża, dokąd doszła klasa. Żaden krok nie ma przypisanego miesiąca.
- prd.md Persona: „w klasie 2 (etap startowy E3, od lutego 2027 E4)” — zmiana etapu w lutym nie ma mechanizmu
  (S-08 rodzic; decyzja 5 w `change.md`).
- `Martynka-urzadza.md` §5 `LearnerState.unlockedStep: Record<StageId, number>` — „najwyższy odblokowany krok w etapie”;
  żadnej wartości początkowej.

**Kod:** `src/core/round/pick.ts` `pickSkills` losuje jednostajnie z grywalnych umiejętności **wszystkich** kroków etapu;
`firstPlayableSteps` używa tylko rozgrzewka (`src/core/round/warmup.ts` `buildWarmup`). Miesiąc sesji jest w rejestrze
(`src/data/layout.ts` `REGISTRY_KEYS.month`, ustawiany w `src/main.ts` przed scenami; „scenes never call Date”), a uczeń
ma `age` (`src/core/placement.ts` `SessionLearner`). `proposeStage(age, month, data)` daje etap „kalendarzowy”.

**Grywalne kroki (zmierzone, predykat `playable`):**

| Etap | Grywalne kroki (kolejno) | P | Umiejętności na krok |
|---|---|---|---|
| E1 | 2, 3, 4, 5, 6, 7, 9, 11 | 8 | 1, 4, 2, 3, 1, 3, 2, 1 |
| E2 | 1, 3, 4, 5, 6, 7, 9, 10 | 8 | 1, 1, 1, 1, 1, 3, 1, 1 |
| E3 | 1, 2, 6, 7, 8, 9, 10, 11 | 8 | 2, 2, 1, 2, 1, 2, 3, 2 |
| E4 | 1, 2, 4, 5, 6, 8 | 6 | 1, 1, 4, 1, 5, 1 |
| E5 | 1, 2, 3, 4, 6, 7, 8, 9, 10, 11 | 10 | 1, 2, 2, 2, 1, 1, 1, 2, 1, 1 |
| E6 | 1, 4, 5, 6, 7, 8, 9, 10 | 8 | 1, 2, 1, 1, 1, 3, 2, 2 |

Bez grywalnych umiejętności (pomijane przez wskaźnik bieżącego kroku): E1 1, 8, 10; E2 2, 8; E3 3, 4, 5; E4 3, 7;
E5 5, 12; E6 2, 3, 11. E1.6 i E3.7 mają po jednej umiejętności niegrywalnej (`select`).

**Rozważone opcje:**

| Opcja | Różnorodność na produkcji do S-11 | Adaptacja po S-11 | Źródło |
|---|---|---|---|
| A. Pierwszy grywalny krok (`firstPlayableSteps(stage,1)`) | **Regresja**: E3 → kroki 1 (2 umiejętności) + 10% E2; po renormalizacji pustego koszyka „wcześniejsze” 60/(60+10) ≈ 86% z kroku 1 przy każdym zimnym starcie | działa | brak tekstu; sprzeczne z „zgodne z tym, co w szkole” |
| B. Cały etap odblokowany, wagi faworyzują wczesne kroki | jak dziś | **nie działa**: nie ma czego odblokować, karta nigdy | sprzeczne z FR-014 |
| C. Etap wybrany przez rodzica = cały etap | jak dziś tylko dla ścieżki rodzica | częściowo | brak tekstu |
| **D. Kalendarz szkolny (rekomendacja)** | E3 w październiku: kroki 1, 2, 6 + 10% E2; rośnie z miesiącem; od stycznia cały etap | działa (podłoga + odblokowania ponad nią) | Success Criteria „zgodne z tym, co jest aktualnie w szkole”; ZADANIA §1 (półrocza), §3 (kolejność książek) |

**Reguła D (propozycja do planu, czysta, w `core/curriculum.ts`):**

```
pos(month)   = (month + 4) mod 12            // wrzesień 0 … czerwiec 9, lipiec 10, sierpień 11
semStart(E)  = 0 dla E1/E3/E5 (I półrocze), 5 dla E2/E4/E6 (II półrocze)
behind       = order(stage) < order(proposeStage(age, month))   // etap już przerobiony w szkole
progress     = behind ? 1 : clamp((pos − semStart + 0.5) / 5, 0, 1)
k            = clamp(max(minStartSteps, ceil(progress · P)), 1, P)
calendarStart= numer k-tego grywalnego kroku etapu
```

Wynik dla etapu = etap kalendarzowy (P i listy z tabeli wyżej; `minStartSteps = 2`):

| Etap | 1. mies. półrocza | 2. | 3. | 4. | 5. | po półroczu |
|---|---|---|---|---|---|---|
| E1 (IX–I) | krok 3 | 4 | 5 | 7 | 11 | 11 (cały) |
| E2 (II–VI) | krok 3 | 4 | 5 | 7 | 10 | 10 (cały) |
| E3 (IX–I) | krok 2 | **6** (październik) | 7 | 9 | 11 | 11 |
| E4 (II–VI) | krok 2 | 2 | 4 | 6 | 8 | 8 |
| E5 (IX–I) | krok 2 | 3 | 6 | 8 | 10 | 11 |
| E6 (II–VI) | krok 4 | 5 | 6 | 8 | 10 | 10 |

Przypadki brzegowe (sprawdzone na `placementData`, `src/data/placement.ts`): warm-up obniżył E3 → E2 w październiku →
`behind` → cały E2 (bieżący krok 10; łagodzenie zadziała, jeśli za trudno). Rodzic wybiera E4 w październiku dla
8-latka → nie `behind`, `pos` przed półroczem → `minStartSteps` (krok 2). Wiek 10+ (zawsze E6 w tabeli): w październiku
E6 nie jest `behind` → start od kroku 4. Wiek 6 wiosną: E1 = etap kalendarzowy, `pos` po półroczu → cały E1 (6-latki
wiosną bywają już w klasie 1, ZADANIA §1: „dzieci idą do szkoły w roku, w którym kończą 7 lat”). Ścieżka rodzica w e2e
(`tests/e2e/support/welcome.ts` `passWelcome`: wiek `'10+'`, „Klasa 2, I półrocze”, bez `?e2eMonth`) daje E3 `behind`
wobec E6 → **cały E3 niezależnie od dnia uruchomienia** — deterministycznie.

**Po S-11:** na starcie sesji `unlockedStep[stage] = max(zapisany, calendarStart(...))` — ta sama funkcja, więc do S-11
zimny start = podłoga kalendarza, a reguły opanowania przesuwają krok ponad nią w sesji. Podniesienie podłogą jest ciche
(karta tylko za opanowanie; PRD Business Logic: „jedynym jawnym sygnałem jest scenka odblokowania”). Zmiana etapu przez
rodzica (S-08) startuje nowy etap tą samą funkcją. Co zmieniłoby odpowiedź: autor chce, by krok był wyłącznie zasłużony
(opcja A) — wtedy na produkcji do S-11 regresja różnorodności jest świadoma i potrzebny wiersz `[human]`.

### 2. Wagi, opanowanie, odblokowanie, łagodzenie

**Źródła:** ZADANIA §1 „Etapy”: „~60% bieżący krok, ~30% wcześniejsze kroki tego etapu, ~10% powtórka z poprzedniego
etapu”; „Adaptacja trudności”: „Liczy się tylko pierwsza próba. 3 poprawne z rzędu → +1; błąd → −1 … Opanowanie ≥ 4
w większości umiejętności kroku (udział w `balance.ts`) → odblokowanie … Jedna trudna umiejętność nie blokuje całego
kroku. 2 rundy z rzędu poniżej 3/5 → gra na chwilę wraca do łatwiejszych wariantów (mniejszy zakres, tryb z
obrazkami).” PRD FR-007: „druga próba … nie liczy się jako sukces do opanowania (historia rozróżnia pierwszą i drugą
próbę)”; FR-013/FR-014 jak wyżej, notka: „wymaga ≥4 w większości umiejętności kroku, nie we wszystkich”.

**Wagi (losowanie każdego zadania rundy):** koszyki — `current` = grywalne umiejętności kroku `unlockedStep`;
`earlier` = grywalne umiejętności wcześniejszych kroków etapu (≤ `unlockedStep`, bez bieżącego); `previous` = grywalne
umiejętności **całego** poprzedniego etapu (`previousStage`, `src/core/placement.ts`; E1 nie ma). Krok: wybierz koszyk
z prawdopodobieństwem proporcjonalnym do wagi wśród niepustych, potem umiejętność jednostajnie w koszyku (`rng.pick`).
Uzasadnienie „całego poprzedniego etapu”: po zakończeniu półrocza wszystkie jego kroki są przerobione (reguła D: etap
`behind` → cały). `src/core/rng.ts`: `next()`, `int(min,max)` (obustronnie domknięty), `pick`, `shuffle`, `chance`.

**Opanowanie (czysta funkcja na wynik zadania, `core/mastery.ts`):** `RoundState.outcomes` (`src/core/round.ts`:
`'first' | 'second' | 'retype' | null`). `'first'` → `streak[skill] += 1`; gdy `streak == streakForGain` (3) →
`mastery = min(max, mastery + gain)`, `streak = 0`. `'second'` / `'retype'` (pierwsza próba błędna) → `mastery =
max(0, mastery − loss)`, `streak = 0`. `history.push({ skillId, ok: outcome !== 'retype', firstTry: outcome === 'first',
at })`, przycięte do `historyLength` (200, plan §5 „ostatnie ~200”). `at` jako argument (w `core` brak `Date`).
Minimalnie 12 poprawnych pierwszych prób jednej umiejętności, by z 0 osiągnąć 4.

**Kiedy aktualizować:** raz, na końcu rundy (`TaskScene.advance`, gdy `state.finished`, w tym samym miejscu co
`finishWarmup`), z całej tablicy `outcomes` w kolejności. Argumenty: „Do pokoju” to `scene.switch` (scena śpi, stan rundy
żyje — `TaskScene.create` listener `toRoom`, `wake` tylko `render`), więc nic nie ginie ani się nie dubluje; zamknięcie
karty w trakcie rundy i tak traci rundę (gwiazdki też); FR-020 / plan §8 każą zapisywać natychmiast po „końcu rundy”,
więc S-11 dostanie jeden punkt zapisu. Rozgrzewka: opanowanie tak (prawdziwe pierwsze próby), seria słabych rund nie.
`finishWarmup` po obniżeniu etapu przelicza `calendarStart` dla nowego etapu (ten sam `age`, `month`).

**Odblokowanie:** na końcu zwykłej rundy, po aktualizacji opanowania: `n` = grywalne umiejętności bieżącego kroku,
`m` = te z `mastery ≥ unlockAt` (4); odblokuj następny grywalny krok, gdy `m ≥ ceil(unlockShare · n)` i bieżący nie
jest ostatnim grywalnym. Najwyżej jeden krok na rundę. „Większość” — sprzeczność w źródłach: dosłowna większość (`>`)
przy `n = 2` wymaga obu umiejętności, czyli jedna trudna blokuje krok, wbrew ZADANIA §1. `≥ ceil(0.5·n)` daje: n=1→1,
2→1, 3→2, 4→2, 5→3 (największe n w danych to 5, E4 krok 6). Uwaga do `change.md` decyzji 2: tam założono `> 0,5`
(„obu z dwóch”) — research to koryguje; wniosek o e2e się nie zmienia (próg 12 prób w jednej umiejętności zostaje).

**Łagodzenie:** runda słaba = `outcomes.filter('first').length < weakBelow` (3; „poniżej 3/5”, liczone jak opanowanie,
pierwsza próba — wniosek: „3/5” bez doprecyzowania, a PRD Business Logic wymienia „wynik ostatnich rund” obok historii
pierwsza/druga próba). `weakStreak` +1 za słabą rundę, 0 za inną; przy `weakStreak == weakRounds` (2) → `easedRounds = 
rounds` (2), `weakStreak = 0`. Póki `easedRounds > 0`, picker używa `easing.weights` (20/50/30), na końcu rundy
`easedRounds −= 1`. Pusty koszyk renormalizowany — dla E1 na pierwszych krokach łagodzenie może być pustą operacją.
„Mniejszy zakres, tryb z obrazkami” (PRD Business Logic, ZADANIA §1): zakresy są w `params` umiejętności i chronione
parserami (`src/core/tasks/registry.ts`) i `tests/contentInvariants.test.ts`; trybu z obrazkami nie ma (S-14). Wagi ku
wcześniejszym krokom i poprzedniemu etapowi dają mniejsze zakresy pośrednio — odstępstwo od dosłownego tekstu (już
decyzja 4 w `change.md`, wiersz `[human]` w planie). Czy w łagodzeniu blokować odblokowanie — źródła milczą;
rekomendacja: nie blokować (opanowanie liczy się z prawdziwych prób; prostsza reguła), zmiana wobec decyzji 4 do
rozstrzygnięcia w planie.

**Proponowany kształt `balance` (nazwy do planu):**

```ts
curriculum: { weights: { current: 60, earlier: 30, previous: 10 }, minStartSteps: 2, unlockShare: 0.5 },
mastery:    { max: 5, unlockAt: 4, streakForGain: 3, gain: 1, loss: 1, historyLength: 200 },
easing:     { weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } },
round:      { ...istniejące, uniqueRetries: 20 },
```

Stan ucznia: `LearnerState` (`src/core/types.ts`) + pola łagodzenia (`weakStreak`, `easedRounds`) dopisane do typu
(decyzja 1 w `change.md`); tylko sesyjne (`warmupPending`, oczekująca karta `pendingUnlock: number | null`) poza
`LearnerState` w `SessionLearner`.

### 3. Unikalność poleceń

- Follow-upy: `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` („the same prompt twice in
  a row … `pickSkills` draws skills with repeats and the generator can repeat its numbers”, `Trigger: S-07`) i
  `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` („The warm-up can show the same prompt
  twice”, `Trigger: S-07`).
- `Task.prompt` to `string` (`src/core/tasks/types.ts`); prompt+`visual` daje tyle samo różnych wartości co sam
  prompt dla każdej umiejętności (pomiar) — porównanie samego `prompt` wystarcza.
- Pule < 20 poleceń (2000 losowań): `E1.4.calendar_weekdays` 14, `E1.6.even_odd_single_10` 11, `E1.7.bonds_10` 18,
  `E1.7.complement_10` 9, `E3.10.half_30` 15, `E4.6.mult_5_10` 18. `SMALL_SPACES` istnieje tylko w
  `tests/contentInvariants.test.ts` (`complement_10` minDistinct 9, `even_odd_single_10` 11; `MIN_DISTINCT = 12`) — nie
  w `src/`; S-07 go nie zmienia.
- Reguła: `distinctTasks(skills, rng, gen, retries)` — dla każdej pozycji generuj zadanie wybranej umiejętności; jeśli
  `prompt` już był w rundzie, losuj ponownie (ta sama umiejętność) do `retries` razy; po limicie zostaw duplikat (żadnego
  wyjątku, żadnej pętli bez końca). Ponowne losowanie umiejętności zamiast zadania zmieniłoby rozkład wag — nie.
  Najgorszy przypadek realny: 5 zadań z jednej 9-elementowej puli → po 4 zajętych szansa porażki 20 prób
  (4/9)^20 ≈ 10⁻⁷; rozgrzewka 6 zadań bierze 3 z poprzedniego etapu i 3 z dwóch pierwszych grywalnych kroków, pule ≥ 20
  poza E1 (E2 rozgrzewka: E1 poprzedni etap — wiele umiejętności).
- Test: wiele ziaren × wszystkie etapy × kalendarzowe starty, „brak duplikatu `prompt` w rundzie” + test z
  generatorem o puli 1 (stała odpowiedź), że limit kończy się duplikatem, a nie zawieszeniem.

### 4. Karta „Nowa umiejętność!”

- Kit: `designs/martynka-maths-A-v1/style-guide.md` „The unlock card uses “Nowa umiejętność!” and one short skill
  name”, „Unlock skill label 48 px”; `preview.js` `render` gałąź `screen==='unlock'`: `<h2>Nowa umiejętność!</h2>`,
  `assets/icons/book.png`, `.unlock-name` („Dodawanie do 100” dla wieku ≥ 9, inaczej „Dodawanie do 10” — przykłady
  podglądu, nie dane), przycisk „Dalej”; akcja `round` przy `!unlocked` przechodzi na `unlock` — karta po „Kolejna
  runda”. `maths.css` `.unlock-card`: left 388, top 284, 1144×660, ramka 7 px `#d8bc6f`, promień 46, gradient 120°
  `#fffef4`→`#fff0c8`; `h2` 66 px/800, margines górny 56; `.unlock-art` 200×200; `.unlock-name` 48 px/750;
  `.page-button` w karcie 450×108, 44 px, `bottom: 36`, `left: 338`.
- Kod: brak; wzorzec widżetu `src/ui/widgets/SummaryPanel.ts` + `PageButton.ts`; przycisk „Dalej” ma klucz
  `pl.round.next` (`src/data/pl.ts`). Rekomendacja: `pl.unlock = { title: 'Nowa umiejętność!', next: 'Dalej' }` (osobny
  klucz, ten sam tekst — karta nie zależy od paska rundy).
- **Nazwy dla dziecka**: `StepDef.title` jest „author-facing … not shown to the child” (`src/core/types.ts`). Nowe pole
  (np. `StepDef.childName`) dla każdego grywalnego kroku: 48 kroków, z czego 42 osiągalne kartą (pierwszy grywalny krok
  etapu nigdy nie jest odblokowywany przez opanowanie); S-08 pokaże „bieżący krok” rodzicowi — ta sama nazwa. Forma
  z kitu: rzeczownik odczasownikowy + zakres, mianownik, ≤ ~28 znaków, jedna linia przy 48 px w 1144 px. Teacher read
  (CLAUDE.md Working rules) — nowa treść w `src/data/`.
- Przepływ: odblokowanie liczone w `core` na końcu rundy (zapisane jako `pendingUnlock`); „Kolejna runda” przy
  `pendingUnlock` pokazuje kartę zamiast nowej rundy; „Dalej” czyści `pendingUnlock` i startuje rundę (już z nowym
  krokiem). „Do pokoju” → powrót → podsumowanie → „Kolejna runda” → karta (stan w rejestrze, nie w scenie).
  DESIGN-GAP (kit milczy): czytanie karty na głos; karta po „Do pokoju” (kit pokazuje tylko ścieżkę „Kolejna runda”).

### 5. E2E i hak

- Test-plan (`context/foundation/test-plan.md` § 2): ryzyka #1–#11; żadne nie dotyczy adaptacji/odblokowania; #2
  wymienia utratę „mastery” (S-11); #12 istnieje tylko jako „#12 (proposed)” w nagłówku `tests/e2e/first-launch.spec.ts`;
  § 7 wyklucza „task content in browser e2e — e2e asserts flows, never pixels or task text”. `test-stack.md` § E2E nie
  wspomina projektu `chromium-hook` ani portu 4397 (luka dokumentacji, nie tego slice'a).
- **Proponowane brzmienie (follow-up „test-plan refresh”, nie odświeżać w runie):** „#13 Adaptacja nie prowadzi
  dziecka: runda losuje spoza odblokowanych kroków, druga próba podnosi opanowanie, krok nie odblokowuje się po
  opanowaniu większości umiejętności albo karta „Nowa umiejętność!” blokuje przejście do następnej rundy. Wpływ: średni,
  prawdopodobieństwo: średnie. Warstwa: testy jednostkowe `core/curriculum` i `core/mastery` (wiele ziaren) + jeden
  lokalny e2e: dziecko gra poprawnie, aż hak pokaże `screen: 'unlock'`, „Dalej” startuje rundę, `unlockedStep` wzrósł.
  Anty-wzorce: ustawianie opanowania z testu, stałe ziarno rng, asercja treści zadania.” Plus dopisanie #12.
- **Determinizm istniejących specs** (`tests/e2e/task-round.spec.ts`, `narrator.spec.ts`, `first-launch.spec.ts`):
  żaden nie sprawdza treści zadania, odpowiedzi idą przez `snapshot.input` (`tiles`/`keypad`), rng = `Date.now()`
  (`TaskScene.create`). Najwięcej poprawnych pierwszych prób w jednej sesji: 11 (`first-launch` „age 8 … clean warm-up”:
  6 rozgrzewki + 5 rundy) — w zwykłych rundach najwyżej 5. Odblokowanie wymaga ≥ 12 w jednej umiejętności bieżącego
  kroku → niemożliwe w żadnym spec. Ścieżka rodzica (`passWelcome`) przy regule D to cały E3 = ostatni krok → brak
  dalszego odblokowania; łagodzenie po 2 słabych rundach zmienia tylko wagi. Jeśli plan wybierze inną regułę startu
  zależną od miesiąca, `passWelcome` musi dostać `?e2eMonth` (dziś go nie podaje).
- **E2E karty przez produkt (wykonalne):** np. 8-latek, `?e2eMonth=8` (wrzesień), ścieżka rodzica z „Klasa 2, II
  półrocze” (E4, bez rozgrzewki, `stageOverriddenByParent`) → reguła D: E4 krok 2 (1 umiejętność, `add_sub_100_units`,
  734 polecenia); bieżący koszyk 60% → ~3 zadania na rundę → ~4 rundy (20 zadań) do 12 prób; spec w pętli z
  ograniczeniem (np. ≤ 10 rund), bez zapisu stanu z testu. Alternatywa z rozgrzewką dłuższa.
- **Hak** (`src/testing/e2eHook.ts` `installE2EHook`): dziś `snapshot.learner` = zamrożona kopia
  `REGISTRY_KEYS.learner`, więc pola `LearnerState` dojdą same; dopisać `screen: 'unlock'` (gdy karta widoczna) i cel
  `targets.unlockNext`; ewentualnie wyliczony `currentStep` i `eased: boolean` dla czytelnych asercji. Hak już wystawia
  `answer`/`choices` (`TaskScene.snapshot`) — to tylko build e2e: `__E2E_HOOK__` (`vite/config.shared.mjs`) usuwa kod
  z produkcji, a `vite/e2eHookGuard.mjs` `checkE2EHook` przerywa `npm run build`, gdy marker `__martynkaE2E` jest
  w jakimkolwiek chunku (komunikat `e2e hook: absent (N chunks checked)`).

### F5 (follow-up): interfejs `PlacementData` w `core`

`src/core/placement.ts` importuje `type { placementData }` z `src/data/placement.ts`. `eslint.config.mjs` zabrania w
`src/core/**` tylko Phasera; dla `src/data/**` dozwolone są z `core` wyłącznie `core/text/*` i typy. Import typu
core → data **nie łamie** lintu — to higiena architektury (plan §4: „core decyduje, data wypełnia”). Ten sam wzorzec dla
typów balansu: interfejsy (`CurriculumBalance`, `MasteryBalance`, `EasingBalance`, `PlacementData`) w `core`,
`src/data/balance.ts` / `placement.ts` je spełniają (`satisfies`), sceny przekazują wartości.

## Code References

- `src/core/round/pick.ts` `playable`, `firstPlayableSteps`, `pickSkills`, `buildRound` — dzisiejszy wybór (jednostajny, cały etap)
- `src/core/round/warmup.ts` `buildWarmup`, `warmupResult` — rozgrzewka (pierwsze grywalne kroki, korekta w dół)
- `src/core/round.ts` `Outcome`, `RoundState.outcomes`, `answer`, `settle` — wynik pierwszej/drugiej próby
- `src/core/placement.ts` `SessionLearner`, `previousStage`, `proposeStage` — uczeń sesji i etap kalendarzowy
- `src/data/placement.ts` `placementData.monthBands`, `table` — pasma miesięcy i tabela wiek × miesiąc
- `src/core/types.ts` `LearnerState`, `StepDef.title`, `SkillDef` — model danych
- `src/data/balance.ts` `balance` — miejsce na nowe gałęzie
- `src/scenes/TaskScene.ts` `create`, `advance`, `startNextRound`, `freshRound`, `finishWarmup`, `snapshot`, `targets`
- `src/main.ts` (miesiąc sesji, `e2eMonth`, `installE2EHook`); `src/data/layout.ts` `REGISTRY_KEYS`
- `src/testing/e2eHook.ts` `e2eMonth`, `installE2EHook`; `vite/e2eHookGuard.mjs` `checkE2EHook`, `e2eHookGuard`
- `tests/e2e/support/welcome.ts` `passWelcome`, `passWelcomeAsChild`; `tests/contentInvariants.test.ts` `SMALL_SPACES`
- `src/ui/widgets/SummaryPanel.ts`, `PageButton.ts` — wzorzec karty

## Architecture Insights

- Wszystkie reguły adaptacji to czyste funkcje `(learner, wejście, balance) → learner` w `core/curriculum.ts` i
  `core/mastery.ts`; scena woła je w jednym miejscu (koniec rundy) i rysuje kartę — zgodnie z „Scenes render state,
  `core/` decides” (kontrakt runu).
- Podłoga kalendarza sprawia, że stan „bez zapisu” i „po zapisie” różnią się tylko `max(...)`, więc S-11 nie zmienia
  reguł S-07.
- Miesiąc jako argument (nie `Date`) i `?e2eMonth` w buildzie e2e czynią start deterministycznym w testach.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-first-launch-placement/` — `SessionLearner` w rejestrze, `month` w rejestrze, rozgrzewka;
  follow-upy `Trigger: S-07` (duplikat w rozgrzewce, F5) i „early save” (`Trigger: before S-11`), które reguła D łagodzi
  dla postępu nauki (zimny start wraca do kalendarza, nie do kroku 1).
- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` — duplikat polecenia w rundzie.
- `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` — ` = ?` po wyrażeniu (`Trigger: S-07 …`),
  przeniesiony przez `change.md` na S-16.
- `change.md` decyzja 2 („większość” jako `> 0,5`) — **częściowo sprzeczna** z tym badaniem (próg `≥ ceil(0.5·n)`);
  reszta decyzji 1–6 podtrzymana; decyzja 4 („w łagodzeniu nie ma odblokowania”) — źródła milczą, rekomendacja odwrotna,
  do rozstrzygnięcia w planie.

## Related Research

- `context/archive/2026-10-13-first-launch-placement/research.md` — reguła wiek × miesiąc → etap.

## Open Questions

- Startowy krok (reguła D) to rekomendacja bez dosłownego tekstu PRD/planu → wiersz `[human]` w planie (opcje A–D wyżej).
- Odblokowanie w trakcie łagodzenia: blokować czy nie (źródła milczą).
- Czy karta czyta się na głos (DESIGN-GAP) i czy pokazać ją po „Do pokoju” (DESIGN-GAP).
- Brzmienie 48 nazw kroków dla dziecka — teacher read.
