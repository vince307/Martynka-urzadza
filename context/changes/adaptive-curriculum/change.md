---
change_id: adaptive-curriculum
title: Adaptacja trudności — wagi kroków, opanowanie 0–5, „Nowa umiejętność!” i łagodzenie
status: implemented
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-07 z roadmapy (etap M3): gra przestaje losować umiejętności jednostajnie z całego etapu (`pickSkills`, S-04) i
losuje z **odblokowanych kroków** według wag (bieżący krok / wcześniejsze kroki etapu / poprzedni etap; start 60/30/10),
prowadzi **licznik opanowania 0–5** każdej umiejętności liczący tylko pierwszą próbę (3 poprawne z rzędu +1, błąd −1),
**odblokowuje następny krok**, gdy opanowanie ≥ 4 ma większość umiejętności kroku (udział w balansie), pokazuje wtedy
kartę **„Nowa umiejętność!”** i **łagodzi trudność** po dwóch rundach z rzędu poniżej 3/5. Wszystkie liczby w
`src/data/balance.ts`. Logika (plan §4: `core/curriculum.ts` — wybór umiejętności, wagi, odblokowanie;
`core/mastery.ts` — liczniki, adaptacja) to czysty TypeScript z testami najpierw; `TaskScene` tylko rysuje kartę i
przekazuje stuknięcia.

Źródła: `context/foundation/roadmap.md` (`### S-07`, wiersz w tabeli statusu z listą follow-upów), `context/foundation/prd.md`
(FR-013, FR-014, Business Logic: wejścia = etap, wynik rozgrzewki, historia odpowiedzi per umiejętność z informacją
pierwsza/druga próba, wyniki ostatnich rund; wyjścia = następne zadanie, moment odblokowania, chwilowe złagodzenie
„mniejszy zakres, tryb z obrazkami”; „jedynym jawnym sygnałem jest scenka odblokowania”; rodzic widzi skutek w
podglądzie — S-08), `Martynka-urzadza.md` (§2 p. 3, §4 `core/curriculum.ts`, `core/mastery.ts`, `data/balance.ts`
„progi opanowania”, §5 `LearnerState.unlockedStep`/`mastery`/`streak`/`history`, §6 „druga próba … nie liczy się do
opanowania”, §11 M3 „Gotowe, gdy … kolejne kroki odblokowują się po opanowaniu poprzednich”), `docs/ZADANIA.md` §1
„Etapy” (wagi ~60/30/10), „Adaptacja trudności” (umiejętność = typ × krok; „Jedna trudna umiejętność nie blokuje całego
kroku”), §3 (kolejność kroków), §7 (model danych generatora); archiwa `context/archive/2026-10-13-first-launch-placement/`
i `context/archive/2026-10-12-narrator-round-summary/` (wzorzec, follow-upy); kod `src/core/round/pick.ts`
(`pickSkills`, `buildRound`, `firstPlayableSteps`), `src/core/round.ts` (`RoundState.outcomes`), `src/core/round/warmup.ts`
(`buildWarmup`, `warmupResult`), `src/core/placement.ts` (`SessionLearner`), `src/data/balance.ts`, `src/data/curriculum/*`,
`src/scenes/TaskScene.ts` (`create`, `freshRound`, `finishWarmup`, `startNextRound`, `snapshot`), `src/testing/e2eHook.ts`.
Plik `lessons.md` w `context/foundation/` nie istnieje (nie ma czego zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/adaptive-curriculum` @ `fd68216` (= `main`, po merge'u S-06, PR #22).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-05; Parallel with: S-06 | S-05 i S-06 `done`. S-06 dał `SessionLearner` (`src/core/placement.ts`: `age`, `stage`, `stageOverriddenByParent`, `warmupPending`) w rejestrze (`REGISTRY_KEYS.learner`), `WelcomeScene`, rozgrzewkę jako pierwszą rundę `TaskScene` (`freshRound` → `buildWarmup`; `finishWarmup` → `warmupResult`). Run jest seryjny. | Brak równoległości. S-07 rozszerza **ten sam** obiekt ucznia w rejestrze o pola `LearnerState` (`unlockedStep`, `mastery`, `streak`, `history`) i stan łagodzenia; rozgrzewka zostaje, jak jest. |
| „gra losuje zadania z odblokowanych kroków według wag” | `pickSkills(stage, rng, count)` losuje **jednostajnie, z powtórzeniami** z grywalnych umiejętności **wszystkich** kroków etapu (`playable`: `tiles`/`keypad` + zarejestrowany generator). Nigdzie nie ma `unlockedStep` ani wag; `LearnerState.unlockedStep` istnieje tylko jako typ w `src/core/types.ts`. Wywołują: `buildRound` (`TaskScene.freshRound`), `buildWarmup` (`src/core/round/warmup.ts`), testy `tests/pick.test.ts`, `tests/warmup.test.ts`. | Nowy wybór w `src/core/curriculum.ts` (nazwa z planu §4): koszyki „bieżący krok / wcześniejsze kroki / poprzedni etap” z wagami z `balance`; pusty koszyk (np. pierwszy krok, E1 bez poprzedniego etapu) — wagi renormalizowane po niepustych. `buildRound` dostaje ucznia. `pickSkills` zostaje dla rozgrzewki (patrz decyzja 2). |
| Kroki = kolejność z ZADANIA §3 | Wiele kroków **nie ma grywalnych umiejętności** (typy grup 2–3 czekają na M6): np. E3 kroki 3, 4, 5; E1 kroki 1, 8, 10; E4 3, 7; E6 2, 3, 11. E3 krok 7 ma `select_even_30` (`answer: 'select'`, niegrywalne). Policzone skryptem w tym kroku (rejestr generatorów × `answer`). | „Bieżący krok” przesuwa się tylko po krokach z grywalnymi umiejętnościami (puste są przeskakiwane; gdy M6 doda im umiejętności, trafią do koszyka „wcześniejsze”). „Większość umiejętności kroku” liczona tylko z grywalnych. Start: `unlockedStep` = pierwszy grywalny krok etapu (`firstPlayableSteps(stage, 1)`). |
| „licznik opanowania 0–5 każdej umiejętności, licząc tylko pierwszą próbę” | Wynik zadania jest w `RoundState.outcomes` (`'first' | 'second' | 'retype' | null`), `Task.skillId` istnieje. Liczników brak. | Czysta funkcja w `src/core/mastery.ts` (plan §4) na wyniku zadania: `'first'` → seria +1 (co `balance` zadań z rzędu → opanowanie +1, max 5); `'second'`/`'retype'` (= błąd w pierwszej próbie) → opanowanie −1 (min 0), seria od zera. Druga próba **nie** podnosi (ZADANIA §1, plan §6). Plus `history` (ostatnie N wpisów, N w `balance`; `at` jako argument — w `core` nie ma `Date`), bo S-08 czyta z niej „najczęstsze błędy”. |
| „odblokowuje kolejny krok przy opanowaniu w większości umiejętności” | Brak. | `core/curriculum.ts`: `share` grywalnych umiejętności bieżącego kroku z opanowaniem ≥ próg (oba w `balance`) → następny grywalny krok. Najwyżej jeden krok na koniec rundy. Ostatni krok etapu: brak dalszego odblokowania (zmiana etapu to rodzic, S-08) — decyzja 5. |
| „ze scenką „Nowa umiejętność!”” | Kit **ma** widok: `designs/martynka-maths-A-v1/screenshots/unlock.png` + `preview.js` (`screen==='unlock'`) + `maths.css` `.unlock-card`. Brak w kodzie. Kroki mają tylko `StepDef.title` „author-facing … not shown to the child”. | Karta w `TaskScene` jako widżet `src/ui/widgets/` (nie nowa scena), decyzja 3. Krótka nazwa kroku dla dziecka to **nowa treść** w `src/data/curriculum/*` (pole kroku) → teacher read. |
| „łagodzi trudność po dwóch słabych rundach” | Brak. „Mniejszy zakres” — zakresy liczb są w `params` umiejętności, generatory odrzucają niewykonalne dane (`registry` parsery), `tests/contentInvariants.test.ts` sprawdza każdą umiejętność; „tryb z obrazkami” nie istnieje (design-gaps wiersz 21, follow-up `Trigger: S-14`). | Łagodzenie = **inne wagi** (więcej wcześniejszych kroków i poprzedniego etapu, czyli naturalnie mniejszych zakresów) przez `balance` rund; bez przepisywania `params` i bez trybu z obrazkami. Odstępstwo od dosłownego „mniejszy zakres, tryb z obrazkami” → wiersz `[human]` w planie. Decyzja 4. |
| „wartości w danych balansu” | `src/data/balance.ts` istnieje (`round`, `warmup`, `parentGate`, `keypad`, `narrator`, `tiles`). | Nowe gałęzie, np. `balance.curriculum` (wagi 60/30/10, wagi łagodzenia, próg 4, udział większości) i `balance.mastery` (seria 3, +1, −1, max 5, długość historii), `balance.easing` (próg 3/5, 2 rundy, czas łagodzenia). Nazwy do planu. |
| „Risk: czysta logika w core/ … niezależna od scen” | Prawda dla logiki, ale scena się zmienia: `TaskScene.freshRound` (wybór), koniec rundy (aktualizacja ucznia, karta), hak e2e (`learner` w snapshocie, cel „Dalej” karty). Granica ESLint: `src/core` bez Phaser i bez globali; `src/data` importuje z `core` tylko `core/text/*` i typy. | Bez korekty co do zasady; plan ma fazy `tdd` dla `core` i `impl` dla sceny/widżetu/haka. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md`, `docs/ZADANIA.md` §1, `designs/martynka-maths-A-v1/style-guide.md`
(„The unlock card uses „Nowa umiejętność!” and one short skill name”; „Unlock skill label 48 px”), `preview.js`
(`render`, gałąź `screen==='unlock'`; kolejność: podsumowanie → „Kolejna runda” → karta → „Dalej” → nowa runda),
`maths.css` (`.unlock-card`: left 388, top 284, 1144×660, ramka 7 px `#d8bc6f`, promień 46, gradient `#fffef4`→`#fff0c8`;
`h2` 66 px / 800, margines górny 56; `.unlock-art` 200×200; `.unlock-name` 48 px / 750; przycisk `.page-button` 450×108,
44 px, `bottom: 36`).

- **Widok kitu wiązany przez ten slice:** `screenshots/unlock.png` — notes, karta, „Nowa umiejętność!”, ikona książki
  (`assets/icons/book.png` — sztuki nie ma, `public/assets/` nie istnieje: placeholder rysowany w kodzie do S-16),
  krótka nazwa umiejętności, przycisk „Dalej”.
- **Klucze tekstów do `src/data/pl.ts`:** „Nowa umiejętność!” (nowy klucz), „Dalej” (jest: `pl.round.next` — do
  sprawdzenia, czy użyć tego samego klucza). Nazwy kroków dla dziecka (np. „Dodawanie do 10”, „Dodawanie do 100” z kitu)
  — w danych kroków (`src/data/curriculum/*`), nie w `pl.ts`; teacher read.
- **Brak w kicie → DESIGN-GAP** (komentarz + wiersz w `docs/design-gaps.md`): (a) czy karta czyta się na głos
  (lektor) — kit milczy; (b) karta po „Do pokoju” zamiast „Kolejna runda” (kit pokazuje tylko ścieżkę „Kolejna runda”);
  (c) widoczność łagodzenia — PRD: jedynym jawnym sygnałem jest karta odblokowania, więc łagodzenie jest ciche (nie
  luka, tylko potwierdzenie). Nic poza tym nie jest wymyślane.
- **Nie w tym slice:** podgląd postępów i zmiana etapu przez rodzica (S-08), zapis (S-11), tryb z obrazkami (S-14).

## Migration

Nie przewiduję migracji. Profil §4: brak bazy; format zapisu i migracje (`src/core/save.ts`, `src/storage/idb.ts`)
wchodzą z S-11. Stan adaptacji jest w pamięci sesji w kształcie pól `LearnerState` (patrz decyzja 1), żeby S-11 zapisał
go w wersji 1 formatu bez migracji z czegokolwiek.

## Triggered follow-ups (Trigger: S-07)

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| Ta sama treść polecenia dwa razy w jednej rundzie (`pickSkills` losuje z powtórzeniami, generator może powtórzyć liczby; np. „Liczba 22 jest parzysta czy nieparzysta?” jako zadania 2 i 3) | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` | **W zakresie.** S-07 przepisuje budowanie rundy; unikalność `prompt` w rundzie jako reguła w `core` (ponowne losowanie zadania, limit prób z `balance`, test na wielu ziarnach). Uwaga: przy łagodzeniu albo na pierwszym kroku z jedną umiejętnością (np. E2 krok 1, `EVEN_ODD` o małym zakresie) pula różnych poleceń bywa mała — limit prób zamiast gwarancji, z testem, że limit nie zapętla. |
| Rozgrzewka może pokazać to samo polecenie dwa razy (dwa kroki z tej samej puli) | `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` | **W zakresie**, ta sama reguła unikalności zastosowana w `buildWarmup` (wspólna funkcja). |
| (impl-review F5) `src/core/placement.ts` importuje typ `placementData` z `src/data/placement.ts` (core → data) | jw. | **W zakresie**, tani: interfejs `PlacementData` w `core`, `data/placement.ts` go spełnia. S-07 i tak dodaje do `core` typy danych balansu (wagi, progi) — te same reguły: `core` deklaruje interfejsy, `data` je wypełnia, sceny łączą. |
| Wyrażenie bez ` = ?` (kit pisze `38 + 27 = ?`) | `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` (`Trigger: S-07 (curriculum stages) or a kit revision of the task screen`) | **Poza zakresem, przenoszę na `Trigger: S-16`.** S-07 zmienia wybór umiejętności, nie rysowanie polecenia (`TaskScene.drawExpression`); dopisek wymaga sprawdzenia szerokości najdłuższych wyrażeń E5–E6 obok klawiatury na zrzutach obu rozdzielczości — naturalne miejsce to S-16 (docelowa grafika ekranu zadań). Plan dopisze przeniesiony wpis do `follow-ups/review-fixes.md` tego slice'a. |
| (visual O1) `□` w zdaniu | `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` | Już zamknięty (`9b9b9d3`, `wrapBlankLines`/`TaskScene.drawSentence`). Nic do zrobienia. |

Sąsiednie, świadomie poza zakresem: „wcześniejszy zapis samego ucznia przed codzienną grą” (`Trigger: before S-11, or
any deploy used for daily play`) — S-07 go **wzmacnia** (teraz tracone jest też opanowanie), patrz decyzja 1;
przełącznik rodzica dla `autoRead` i helpery e2e (`Trigger: S-08`); premia za czystą rozgrzewkę (`Trigger: S-17`).

## Autonomous decisions

1. **Trwałość do S-11: stan adaptacji tylko w pamięci sesji, w kształcie `LearnerState`; S-11 nie jest wyciągany.**
   - Co dziecko przeżywa na produkcji do S-11: każdy zimny start (zamknięcie karty, wyrzucenie z pamięci na iPadzie,
     aktualizacja) zaczyna od powitania (S-06), rozgrzewki (etap > E1), **pierwszego grywalnego kroku etapu i opanowania
     0 we wszystkich umiejętnościach**. Dziecko znów rozwiązuje najłatwiejsze kroki i może drugi raz zobaczyć „Nowa
     umiejętność!” dla kroku odblokowanego wczoraj. Gwiazdki też giną (jak dziś). W obrębie jednej sesji adaptacja działa
     w pełni (także po „Do pokoju” i powrocie — stan jest w rejestrze gry, nie w polach sceny).
   - Kształt: `SessionLearner` rośnie do pełnego `LearnerState` (`unlockedStep: Record<StageId, number>`,
     `mastery`, `streak`, `history`) plus pola łagodzenia (seria słabych rund, pozostałe rundy złagodzone), które plan dopisze
     do `LearnerState` w `src/core/types.ts` — format zapisu jeszcze nie istnieje, więc S-11 zapisze je w wersji 1 bez
     migracji. Pola tylko sesyjne (`warmupPending`) zostają poza `LearnerState`. Wszystkie aktualizacje to czyste funkcje
     `(learner, wynik, balance) → learner`, więc S-11 tylko wczytuje i zapisuje obiekt (autosave po zmianie stanu).
   - Odrzucone: (a) `localStorage` teraz — drugi, niewersjonowany format (to samo uzasadnienie co S-06 decyzja 1);
     (b) wyciągnięcie S-11 — zmiana roadmapy, nie decyzja tego kroku; (c) trzymanie liczników w polach `TaskScene` —
     ginęłyby przy `scene.restart` i nie dałyby się zapisać jednym obiektem.
   - W planie wiersz `[human]`: „Do S-11 każdy zimny start zeruje kroki i opanowanie (oprócz powitania i gwiazdek) —
     świadoma decyzja; follow-up »wcześniejszy zapis ucznia przed codzienną grą« z S-06 dotyczy teraz także postępu nauki”.
   - Co zmieniłoby odpowiedź: opiekun uruchomi follow-up „early save” (wcześniejszy mały plasterek S-11) — wtedy ten sam
     obiekt `LearnerState` trafia do `core/save.ts` wersji 1 bez zmian w S-07.
2. **Picker adaptacyjny zastępuje `pickSkills` w zwykłej rundzie; rozgrzewka i e2e zostają nietknięte.**
   - Wybrane: nowa `pickRoundSkills(stage, previousStage, learner, rng, count, weights)` (nazwa do planu) w
     `src/core/curriculum.ts`; `buildRound` przyjmuje ucznia i wagi. `buildWarmup` zostaje na `pickSkills` +
     `firstPlayableSteps` (rozgrzewka ma testować etap od początku, niezależnie od odblokowania) — dostaje tylko regułę
     unikalności poleceń. `pickSkills` zostaje jako prymityw rozgrzewki (i jego testy). Rozgrzewka aktualizuje opanowanie
     (to prawdziwe pierwsze próby), ale nie liczy się do serii słabych rund (ma własną korektę etapu).
   - E2E: build e2e nie dostaje ziarna ani nadpisania balansu. Specy czytają odpowiedź i cele z haka
     (`snapshot.answer`, `targets`), więc wybór umiejętności ich nie dotyczy; `#11` (ścieżka rodzica, E3 krok 1, bez
     rozgrzewki) i narrator grają 1–3 rundy — odblokowanie wymaga co najmniej 12 poprawnych pierwszych prób (4 serie po 3)
     umiejętności E3 kroku 1 (przy udziale „większości” > 0,5 — obu z dwóch), więc karta „Nowa umiejętność!” w nich nie wypadnie; łagodzenie po dwóch słabych rundach
     zmienia tylko wagi, nie przepływ. `#12` (pierwsze uruchomienie) dotyczy rozgrzewki — bez zmian. Research ma
     potwierdzić to na kodzie specs (`tests/e2e/task-round.spec.ts`, `narrator.spec.ts`, `first-launch.spec.ts`) i
     sprawdzić, ile stuknięć wymaga e2e karty przez produkt (krok z jedną umiejętnością, np. E2 krok 1) — bez zapisu stanu
     z testu.
   - Odrzucone: (a) stałe ziarno rng w buildzie e2e — ukrywa rozkład, specy go nie potrzebują; (b) parametr URL
     nadpisujący opanowanie w buildzie e2e — stan osiągalny tylko przez produkt (profil §9); (c) wybór adaptacyjny także
     w rozgrzewce — rozgrzewka testuje start etapu, a kroki odblokowane nie istnieją jeszcze przed nią.
   - Co zmieniłoby odpowiedź: research pokaże, że któryś spec gra tyle rund, że karta może wypaść — wtedy spec omija kartę
     przez cel z haka (`targets.unlockNext`) zamiast zmiany balansu.
3. **„Nowa umiejętność!” to karta (widżet) w `TaskScene`, nie nowa scena; kit view `unlock.png`.**
   - Wybrane: widżet `src/ui/widgets/UnlockCard.ts` (kształt jak `SummaryPanel`), rysowany na notesie w miejscu
     podsumowania. Kolejność jak w kicie: odblokowanie liczone w `core` na końcu rundy (przy `next`, gdy `finished`), karta
     pokazana po stuknięciu „Kolejna runda”, „Dalej” startuje nową rundę już z nowym krokiem. Gdy dziecko wybierze „Do
     pokoju”, karta czeka do „Kolejna runda” (DESIGN-GAP b). Placeholder książki rysowany w kodzie. Hak e2e dostaje
     `screen: 'unlock'` i cel przycisku (tylko build e2e).
   - Odrzucone: (a) osobna `UnlockScene` — kit rysuje kartę na tym samym notesie, a stan rundy (podsumowanie, HUD,
     „Do pokoju”) żyje w `TaskScene`; nowa scena dubluje przejścia, które S-05/S-06 już ustabilizowały; (b) nakładka DOM —
     to ekran dziecka, nie kontrolka rodzica; reszta ekranów dziecka jest w canvasie; (c) karta w trakcie rundy —
     przerywa rundę.
   - Co zmieniłoby odpowiedź: research pokaże, że `TaskScene` po S-06 (rozgrzewka + podsumowanie + pokój) jest zbyt
     splątana — wtedy karta jako stan widoku w `core/round/view.ts`, scena tylko przełącza widżety.
4. **Łagodzenie = wagi łagodzenia przez kilka rund, bez zmiany `params` i bez trybu z obrazkami.**
   - Wybrane: runda „słaba” = poprawnych w pierwszej próbie < próg (3 z 5) — liczba i próg w `balance`; dwie słabe z rzędu
     → następne N rund (`balance`, start 1–2) losuje z wagami łagodzenia (np. bieżący 20 / wcześniejsze 50 / poprzedni etap
     30); bez wcześniejszych kroków i poprzedniego etapu (E1 krok pierwszy) łagodzenie nie ma czego wybrać i jest pustą
     operacją. W łagodzeniu nie ma odblokowania. Ciche dla dziecka (PRD: jedyny jawny sygnał to karta).
   - Odrzucone: (a) mniejszy zakres przez przepisywanie `params` w locie — generatory i `tests/contentInvariants.test.ts`
     gwarantują jakość tylko dla danych z kroków; przeskalowane parametry ominęłyby teacher read i parsery;
     (b) „tryb z obrazkami” — nie istnieje (S-14); (c) cofnięcie `unlockedStep` — odbiera dziecku krok, a PRD „nie da się
     niczego stracić”.
   - Odstępstwo od dosłownego tekstu PRD Business Logic („mniejszy zakres, tryb z obrazkami”) → wiersz `[human]` w planie.
   - Co zmieniłoby odpowiedź: autor chce dosłownie mniejszego zakresu — wtedy łagodne warianty jako osobne umiejętności w
     danych kroków (z teacher read), wybierane przy łagodzeniu; tryb z obrazkami wraca z S-14.
5. **Koniec etapu: na ostatnim grywalnym kroku nie ma dalszego odblokowania ani automatycznej zmiany etapu.**
   - Wybrane: dziecko gra dalej z wagami (bieżący = ostatni krok); przejście do następnego etapu to decyzja rodzica (S-08,
     US-03 „rodzic zmienia etap … kolejna runda losuje z E4”). `unlockedStep` jest per etap (`Record<StageId, number>`),
     więc zmiana etapu w S-08 zaczyna od zapamiętanego kroku tamtego etapu albo od pierwszego grywalnego.
   - Odrzucone: automatyczny awans etapu — PRD go nie opisuje, a etap = klasa × półrocze (szkoła, nie gra).
   - Co zmieniłoby odpowiedź: autor zechce awansu po opanowaniu całego etapu — jedna reguła w `core/curriculum.ts` i
     karta z nazwą etapu.
6. **Następny krok to `/10x-research adaptive-curriculum`, nie `/10x-plan`** (prompt kroku tak narzuca; są otwarte
   pytania niżej). Schowek pominięty (sesja bez interakcji); polecenie jest w `handoff.md` §4.

## Open questions for /10x-research

- Dokładne reguły na kodzie: gdzie w `TaskScene` aktualizować ucznia (po każdej odpowiedzi czy na końcu rundy z
  `RoundState.outcomes`) tak, by „Do pokoju” w trakcie rundy i powrót nie gubiły ani nie dublowały wyników; jak
  `finishWarmup` (zmiana etapu w dół) łączy się z `unlockedStep` nowego etapu.
- „Większość”: udział `> 0.5` czy `≥ 0.5` (krok z 2 umiejętnościami: czy 1 z 2 wystarcza — ZADANIA: „jedna trudna
  umiejętność nie blokuje całego kroku”); kroki z 1 umiejętnością.
- Koszyk „poprzedni etap”: wszystkie grywalne kroki poprzedniego etapu czy tylko ostatnie; E1 bez poprzedniego.
- Unikalność poleceń: rozmiar puli różnych poleceń dla najmniejszych umiejętności (np. `EVEN_ODD` do 10, `COMPLEMENT`),
  limit ponownych losowań; czy porównywać `prompt` czy `skillId + answer`.
- Krótkie nazwy kroków dla dziecka: które kroki są osiągalne przez odblokowanie (krok drugi i dalsze grywalne w E1–E6),
  forma z kitu („Dodawanie do 10”), teacher read; czy karta czyta się na głos (narrator `autoRead`).
- Hak e2e (tylko odczyt): `learner` z `unlockedStep`/`mastery` w snapshocie (zamrożone kopie), `screen: 'unlock'`, cel
  „Dalej”; czy e2e karty przez produkt jest wykonalne (liczba stuknięć) i czy test-plan potrzebuje nowego ryzyka.
- F5: miejsce interfejsów danych w `core` (`PlacementData`, typy balansu) zgodne z regułami ESLint granic
  (`tests/lint-boundaries.test.ts`).
