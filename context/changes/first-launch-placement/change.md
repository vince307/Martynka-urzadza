---
change_id: first-launch-placement
title: Pierwsze uruchomienie — wiek, etap potwierdzony przez rodzica za bramką i rozgrzewka
status: plan_reviewed
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-06 z roadmapy (otwiera etap M3): przy pierwszym uruchomieniu dziecko stuka swój wiek (6–10), gra proponuje etap
E1–E6 z wieku i bieżącego miesiąca (tabela `docs/ZADANIA.md` §1 „Wybór poziomu na starcie”), rodzic po bramce dla
dorosłego potwierdza albo zmienia etap, a rozgrzewka 6 zadań (z bieżącego i poprzedniego etapu) koryguje start
tylko w dół. Wybrany etap zastępuje stałe `balance.defaultStage` ('E3') i od niego zależą `defaultAutoRead` (S-05)
oraz losowanie umiejętności rundy (`pickSkills`, S-04). Logika (`placement`: wiek + miesiąc → etap, skład rozgrzewki,
korekta w dół; bramka: wyzwanie i sprawdzenie) to czysty TypeScript w `src/core/` z testami najpierw; scena powitania
i panel rodzica tylko rysują i przekazują stuknięcia.

Źródła: `context/foundation/roadmap.md` (`### S-06`, Unknown = PRD Open Question 1, Risk: bramka używana potem
w S-08 i S-12), `context/foundation/prd.md` (FR-012; US-03 AC „Zmiana etapu przez rodzica ma pierwszeństwo nad
propozycją z wieku i jest zapamiętana”; Access Control: „bramka dla dorosłego (np. proste działanie do rozwiązania)…
chroni reset i zmianę etapu przed celowym wejściem dziecka, nie tylko przed przypadkowym”; Open Questions 1),
`Martynka-urzadza.md` §2 p. 1, §4 (`core/placement.ts`, `scenes/WelcomeScene.ts`), §5 (`LearnerState.age`, `stage`,
`stageOverriddenByParent`), §7 (ustawienia rodzica, bramka = „proste działanie do rozwiązania, żeby dziecko nie
weszło ani przypadkiem, ani celowo”), §11 M3, §13 (pytanie otwarte o rozgrzewkę); `docs/ZADANIA.md` §1 (tabela
wiek × miesiąc, etapy = klasa × półrocze, rozgrzewka); archiwa `context/archive/2026-10-12-narrator-round-summary/`
i `context/archive/2026-10-12-task-round-stars/` (wzorzec i follow-upy); kod `src/main.ts`, `src/scenes/*`,
`src/core/round.ts`, `src/core/round/pick.ts`, `src/data/balance.ts`, `src/core/narration/voice.ts`.
Plik `lessons.md` w `context/foundation/` nie istnieje (nie ma czego zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/first-launch-placement` @ `37a9a62` (= `main`, po merge'u S-05, PR #21).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-05 | S-05 `done` (archiwum `2026-10-12-narrator-round-summary`, PR #21). Są `TaskScene`, `RoomScene`, `UIScene` (licznik, głośnik, przełącznik „Do pokoju”), `SummaryPanel`, `src/ui/narrator.ts`, hak e2e `src/testing/e2eHook.ts`. | Brak korekty. |
| „przy pierwszym uruchomieniu dziecko podaje wiek (6–10)” | Brak sceny powitania. `SCENE_KEYS` w `src/data/layout.ts` = `boot`, `task`, `room`, `ui`; `BootScene.create` od razu `scene.start(SCENE_KEYS.task)`; `src/main.ts` rejestruje `BootScene, TaskScene, RoomScene, UIScene`. | Nowa `WelcomeScene` (plan §4) między `BootScene` a `TaskScene`; `BootScene` decyduje (przez czystą funkcję w `core`) „powitanie czy zadania”. |
| „pierwsze uruchomienie” | Nie ma żadnej trwałości: `src/storage/` pusty, brak `idb-keyval` w `package.json`, brak `src/core/save.ts`; gwiazdki żyją tylko w sesji (`TaskScene.sessionStars`, rejestr `REGISTRY_KEYS.stars`). Typy `SaveState`/`LearnerState` (`age`, `stage`, `stageOverriddenByParent`) istnieją tylko w `src/core/types.ts`. Zapis to S-11. | Bez S-11 „pierwsze uruchomienie” zdarza się przy każdym starcie aplikacji. Patrz Autonomous decisions 1. |
| „gra proponuje etap wg wieku i miesiąca” | Brak `src/core/placement.ts`. Tabela tylko w `docs/ZADANIA.md` §1 (6 lat → E1 zawsze, z dopiskiem „tryb z obrazkami” we wrześniu–styczniu; 7 → E1/E2/E2; 8 → E3/E4/E4; 9 → E5/E6/E6; 10+ → E6). Dane wszystkich etapów E1–E6 są (`src/data/curriculum/index.ts` `getStage`, `availableStages`); E1 ma same umiejętności `'tiles'`, więc jest grywalny (`pickSkills` nie rzuci). | Tabela jako dane (np. w `src/data/`), reguła w `core/placement.ts`; miesiąc wstrzykiwany jako argument (`src/core/**` bez globali; scena podaje `new Date().getMonth()`). „Tryb z obrazkami” dla 6 lat nie istnieje (obrazki/COUNT z grafiką to S-13/S-14) — poza zakresem, 6 lat → zwykłe E1. |
| „rodzic po bramce dla dorosłego potwierdza lub zmienia etap” | Brak jakiejkolwiek bramki i panelu rodzica; brak długiego przytrzymania (to wejście do ustawień z S-08). Kit nie ma widoku bramki ani wyboru etapu. Style guide: „Parent review controls belong outside the game scene”. | Bramka i panel wyboru etapu jako nowe elementy (DESIGN-GAP), patrz Autonomous decisions 2. |
| „rozgrzewka 6 zadań koryguje start w dół” | Runda ma stałą długość z `balance.round.length` (5): `startRound(tasks, rules)` tnie `tasks.slice(0, rules.length)`; `buildRound` losuje z jednego etapu (`pickSkills(stage, rng, count)`, jednostajnie, z powtórzeniami). Brak reguły korekty i progów. | Rozgrzewka = runda z innymi `RoundRules` (długość 6 z `balance`) i składem z dwóch etapów; reguła „dużo błędów → etap niżej, komplet → zostajemy” jako czysta funkcja z progiem w `balance.ts`. Czy rozgrzewka płaci gwiazdki i czy pokazuje podsumowanie — do research/plan (domyślnie: tak, jak zwykła runda — brak stanów porażki). |
| Etap gry | `balance.defaultStage = 'E3'` („stage played until placement exists (S-06)”); czyta go tylko `TaskScene.create` (`getStage(balance.defaultStage)`), stamtąd `defaultAutoRead(stage.id, balance.narrator.autoReadStages)` i `buildRound(this.stage, …)` w `TaskScene.freshRound`. | Patrz Autonomous decisions 3: etap z wyniku placementu w rejestrze gry; `balance.defaultStage` usunięte. |
| Unknown: PRD OQ 1 (rozgrzewka po świadomym ustawieniu przez rodzica) | Nierozstrzygnięte w PRD, planie §13 i ZADANIA §1 („Otwarte”). | Rozstrzygnięte niżej (Autonomous decisions 4) z wierszem `[human]` do planu. |
| Risk: „bramka używana potem w S-08 i S-12” | S-12 (eksport/import) potrzebuje `<input type="file">` i pobrania pliku — DOM. Wzorzec nakładek DOM już jest: `src/ui/dom/overlay.ts`, `rotateOverlay.ts`, napisy w `pl.ts`. | Bramka w `src/ui/dom/` (DOM), logika w `src/core/`. Patrz Autonomous decisions 2. |
| „Parallel with: S-07” | W tym runie seryjnie (S-06 → S-07). S-07 zmieni `pickSkills` (wagi, `unlockedStep`) i potrzebuje etapu startowego. | S-06 przekazuje etap jednym szwem (obiekt ucznia w rejestrze), który S-07 rozszerza; S-06 nie rusza wag ani `unlockedStep`. |
| E2E (test-plan) | Specy `tests/e2e/task-round.spec.ts` (ryzyko #11) i `tests/e2e/narrator.spec.ts` robią `page.goto('/')` i od razu grają rundę (hak `__martynkaE2E`, `screen`: `task`/`summary`/`room`). Test-plan nie ma ryzyka dla pierwszego uruchomienia. | Po S-06 każdy start przechodzi przez powitanie ⇒ oba specy potrzebują wspólnego kroku „przejdź powitanie” (stuknięcia przez prawdziwą ścieżkę: wiek, bramka, etap, rozgrzewka); hak tylko do odczytu dostaje `screen: 'welcome'` i cele przycisków/odpowiedź bramki (tylko build e2e). Nowe ryzyko „pierwsze uruchomienie” — do `/10x-test-plan refresh` (follow-up), w planie spec cytuje #11 jako rozszerzenie. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` (wiąże przy konflikcie), `docs/ZADANIA.md` §1,
`designs/martynka-maths-A-v1/style-guide.md` („Welcome asks „Ile masz lat?” with buttons 6–10. Age and school level
are separate settings in the future game”; „welcome prompt 86 px”; „Parent review controls belong outside the game
scene”), `preview.js` (`render`, gałąź `screen==='welcome'`), `maths.css`.

- **Widok kitu wiązany przez ten slice:** `screenshots/welcome.png` — `.welcome-brand` „Martynka urządza” (62 px,
  800, góra 64 px; = `pl.title`), notes, `.page-title` „Ile masz lat?” (86 px, 750, top 290), `.age-buttons`
  (5 przycisków 218×190 px, odstęp 28 px, left 363, top 526, gradient `#f8fff0`→`#dceecf`, ramka 5 px `#abc49b`,
  promień 38, cyfry 112 px), ikony `welcome-flower` i `welcome-cushion` (sztuka z paczki; do S-16 placeholdery
  rysowane w kodzie albo pominięte — `public/assets/` nie istnieje).
- **Klucze tekstów z kitu do `src/data/pl.ts`:** `pl.title` (jest, dotąd nieużywany — follow-up), „Ile masz lat?”,
  cyfry 6–10 (liczby, nie napisy).
- **Brak w kicie → DESIGN-GAP** (komentarz `DESIGN-GAP` w kodzie + wiersz w `docs/design-gaps.md`, nic nie wymyślone
  ponad minimum): (a) ekran „poproś rodzica” po wyborze wieku i wejście do bramki; (b) bramka dla dorosłego
  (działanie, pole odpowiedzi, „Anuluj”); (c) panel rodzica: proponowany etap, opisy E1–E6 („klasa 1, I półrocze” —
  z ZADANIA §1), wybór innego etapu, „Zatwierdź”; (d) wejście w rozgrzewkę i jej wynik (czy dziecko widzi, że
  etap się zmienił — zalecenie: nie, korekta jest cicha, dziecko widzi zwykłe podsumowanie); (e) „tryb z obrazkami”
  dla 6-latka. Nowe polskie napisy (bramka, panel rodzica, opisy etapów) → teacher read w planie.
- **Nie w tym slice:** `unlock.png` (S-07), ustawienia rodzica i długie przytrzymanie (S-08), eksport/import (S-12).

## Migration

Nie przewiduję migracji. Profil §4: brak bazy danych; format zapisu i migracje (`src/core/save.ts`,
`src/storage/idb.ts`) wchodzą z S-11. Wynik placementu (wiek, etap, `stageOverriddenByParent`) to stan w pamięci
sesji w kształcie pól `LearnerState`, tak by S-11 tylko go zapisał.

## Triggered follow-ups (Trigger: S-06)

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| `pl.title` i gołe liczby animacji/obrysu w widżetach (`lineStyle(3/4)`, `shakeMs / 6`) | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` („Carried over from S-04”, `Trigger: S-06 (Welcome screen uses the title)`); ten sam wpis w archiwum S-04 z `Trigger: S-05` (przeniesiony) | **`pl.title` w zakresie** — `WelcomeScene` rysuje `.welcome-brand` z `pl.title`, co zamyka tę część. **Gołe liczby — w zakresie jako mały wiersz seam-sweep** ostatniej fazy kodu: dziś `Keypad` (`lineStyle(3, …)` w `paintButton`, `lineStyle(4, …)` w `paintField`), `RoomSwitchButton.draw` (`lineStyle(4 * u, …)`) i `TaskScene` (`ANIMATION.shakeMs / 6`) → tokeny w `src/data/layout.ts`; tanie, bez zmiany wyglądu. Gdyby plan przekroczył ~6 faz kodu, ta część wraca jako follow-up `Trigger: S-08` (bramka/ustawienia dotkną widżetów). |

Inne wpisy w archiwach nie mają `Trigger: S-06`. Sąsiednie, świadomie poza zakresem: „Parent switch for auto-read”
(`Trigger: S-08, S-11`), „ten sam prompt dwa razy w rundzie” (`Trigger: S-07` — rozgrzewka losuje przez ten sam
`pickSkills`, więc może to pokazać; nie naprawiamy tu), hak e2e `targets.nextRound`/`toRoom` przy otwartym pokoju
(`Trigger: the next change to src/testing/e2eHook.ts` — S-06 zmienia hak (`screen: 'welcome'`), więc **wchodzi przy
okazji**: `null`, gdy `screen === 'room'`).

## Autonomous decisions

1. **Trwałość do S-11: wynik placementu tylko w pamięci sesji; powitanie przy każdym starcie aplikacji.**
   - Wybrane: czysta funkcja w `core` (np. `needsPlacement(learner: PlacementResult | null)`) decyduje w `BootScene`
     „powitanie czy zadania”; wynik (wiek, etap, `stageOverriddenByParent`) trzymany w rejestrze gry w kształcie pól
     `LearnerState`. Dziś `learner` jest zawsze `null` przy starcie ⇒ powitanie, bramka i rozgrzewka przy każdym
     uruchomieniu (także po wyrzuceniu karty z pamięci na iPadzie). S-11 tylko podaje wczytany stan do tej samej
     funkcji. W planie wiersz `[human]`: „Do S-11 gra pyta o wiek i bramkę rodzica przy każdym starcie (jak dziś
     gubi gwiazdki) — świadoma decyzja, nie błąd”.
   - Odrzucone: (a) mały zapis ustawienia w `localStorage` teraz — drugi, niewersjonowany format obok planowanego
     `core/save.ts` + `storage/idb.ts`, który S-11 musiałby migrować; łamie zasadę planu (zapis wersjonowany,
     migracja w `core/save.ts`); to ciche wciągnięcie S-11; (b) wyciągnięcie S-11 (zapis `LearnerState`) do S-06 —
     zmiana roadmapy, której ten krok nie może zrobić sam; (c) pominięcie powitania do S-11 — S-06 nie dowiózłby FR-012.
   - Dlaczego: dziś cały postęp (gwiazdki) też ginie przy restarcie, więc powitanie przy starcie jest spójne z obecnym
     stanem gry; FR-012 jest weryfikowalne w sesji; S-11 wpina się w jeden szew.
   - Co zmieniłoby odpowiedź: opiekun chce, by córka grała codziennie na produkcji przed S-11 (bramka rodzica przy
     każdym starcie byłaby uciążliwa) — wtedy jawna decyzja w roadmapie: wcześniejszy mały plasterek S-11
     („zapis `LearnerState` + `version` w `core/save.ts` i `storage/idb.ts`”) przed S-07, nie `localStorage`.
2. **Bramka dla dorosłego: działanie poza zasięgiem klas 1–3, w DOM (`src/ui/dom/`), logika w `src/core/`.**
   - Wybrane: `src/core/parentGate.ts` (nazwa do potwierdzenia w planie) — czyste `createChallenge(rng, ranges)` i
     `checkAnswer(challenge, input)`; wyzwanie = iloczyn dwucyfrowej przez dwucyfrową (np. 23 · 14; zakresy w
     `balance.ts`), poza programem E1–E6 i poza tabliczką mnożenia; zła odpowiedź = nowe działanie, bez blokady
     czasowej i bez „błąd” (brak stanów porażki), „Anuluj” wraca do ekranu dziecka. Nakładka DOM w `src/ui/dom/`
     (np. `parentGate.ts`) z polem `inputmode="numeric"` — klawiatura systemowa dla dorosłego, napisy w `pl.ts`;
     ten sam moduł otwiera potem ustawienia (S-08, po długim przytrzymaniu) i eksport/import (S-12, który i tak
     potrzebuje DOM: `<input type="file">`). Panel wyboru etapu też w DOM.
   - Odrzucone: (a) hasło/PIN/konto (kontrakt i PRD: nigdy); (b) „przytrzymaj 3 s” lub „stuknij w rogi” — dziecko
     zrobi to celowo, PRD chce ochrony także przed celowym wejściem; (c) słowne „wpisz liczbę czterdzieści siedem” —
     uczeń E4+ czyta liczebniki (NUMBER_WORDS w programie); (d) bramka w canvasie Phaser z `Keypad` — działa, ale
     S-12 i tak wymaga DOM, a style guide każe trzymać kontrolki rodzica poza sceną gry; DOM daje też e2e na tekście.
   - Dlaczego: PRD Access Control i plan §7 wprost: „proste działanie do rozwiązania”, chroniące także przed celowym
     wejściem; dwucyfrowe mnożenie jest proste dla dorosłego, a niewykonalne w pamięci dla dziecka z klas 1–3.
   - Co zmieniłoby odpowiedź: playtest (S-17) pokaże, że córka rozwiązuje bramkę (np. na kartce) — wtedy trudniejsze
     działanie w danych; albo research pokaże, że nakładka DOM nad canvasem psuje dotyk/skalowanie na iPadzie —
     wtedy bramka w canvasie z istniejącym `Keypad`, a DOM tylko dla plików w S-12.
3. **Etap z placementu zastępuje `balance.defaultStage` jednym szwem w rejestrze.**
   - Wybrane: nowy klucz rejestru (np. `REGISTRY_KEYS.learner`) z wynikiem placementu, ustawiany przez scenę
     powitania po rozgrzewce; `TaskScene.create` czyta etap stamtąd zamiast `balance.defaultStage`, więc
     `defaultAutoRead(stage.id, balance.narrator.autoReadStages)` i `buildRound(stage, …)` (`pickSkills`) działają bez
     zmian sygnatur. `balance.defaultStage` usunięte (żadnego cichego E3). Rozgrzewka używa istniejącej maszyny rundy
     (`startRound` z `RoundRules` o długości 6 z `balance`, skład z bieżącego i poprzedniego etapu przez czystą
     funkcję obok `buildRound`) i tej samej `TaskScene` (tryb rozgrzewki) — bez drugiej sceny zadań; `autoRead`
     rozgrzewki z proponowanego etapu (6–7-latek w E1/E2 słyszy polecenia od razu).
   - Odrzucone: (a) zapis etapu do `balance` w trakcie gry (dane balansu nie są stanem); (b) przekazanie etapu tylko
     przez `scene.start(key, data)` — S-07/S-08 potrzebują wspólnego, zmienialnego stanu ucznia, a S-11 zapisuje go
     w całości; (c) osobna `WarmupScene` z kopią logiki rundy.
   - Dlaczego: jedno źródło prawdy dla etapu; S-07 rozszerza ten sam obiekt o `unlockedStep`/`mastery`, S-08 zmienia
     `stage`, S-11 go zapisuje.
   - Co zmieniłoby odpowiedź: research pokaże, że `TaskScene` w trybie rozgrzewki komplikuje podsumowanie/„Do pokoju”
     ponad miarę — wtedy rozgrzewka jako osobny przebieg tej samej sceny bez podsumowania (od razu do zwykłej rundy).
4. **PRD Open Question 1: rozgrzewka pomijana, gdy rodzic *zmienił* etap; gdy tylko *potwierdził* propozycję z wieku —
   rozgrzewka się odbywa i może obniżyć etap o jeden.**
   - Wybrane: `stageOverriddenByParent = true` tylko przy wyborze innego etapu niż propozycja; wtedy brak rozgrzewki
     (ustawienie rodzica ma pierwszeństwo: ZADANIA §1, PRD US-03 AC). Potwierdzenie propozycji = „wiek jest tylko
     podpowiedzią”, więc rozgrzewka koryguje w dół (najwyżej o jeden etap; nigdy w górę; E1 bez rozgrzewki albo bez
     korekty — do planu). Wiersz `[human]` w planie nazywa decyzję jako odpowiedź na PRD OQ 1 (właściciel: autor).
   - Odrzucone: (a) rozgrzewka zawsze koryguje — unieważnia świadomy wybór rodzica i łamie „ustawienie rodzica ma
     pierwszeństwo”; (b) rozgrzewka zawsze pomijana po bramce — ponieważ rodzic zawsze przechodzi bramkę (FR-012),
     rozgrzewka nigdy by nie działała, a FR-012 jej wymaga.
   - Dlaczego: jedyny podział, przy którym obie części FR-012 (rodzic potwierdza/zmienia + rozgrzewka koryguje w dół)
     mają sens jednocześnie.
   - Co zmieniłoby odpowiedź: autor rozstrzygnie OQ 1 inaczej (np. „rozgrzewka zawsze, rodzic tylko ustawia sufit”)
     — reguła to jedna czysta funkcja i jedna gałąź w scenie, zmiana tania.
5. **Następny krok to `/10x-research first-launch-placement`, nie `/10x-plan`** (skill domyślnie proponuje plan).
   - Dlaczego: prompt kroku tak narzuca; są też otwarte pytania (niżej). Schowek pominięty (sesja bez interakcji);
     polecenie jest w `handoff.md` §4.
   - Co zmieniłoby odpowiedź: nic w tym kroku — kolejność łańcucha ustala orkiestrator.

## Open questions for /10x-research

- Przejścia scen Phaser 4: `BootScene` → `WelcomeScene` → `TaskScene` (rozgrzewka) → `TaskScene` (zwykłe rundy);
  czy `UIScene` (licznik, głośnik, „Do pokoju”) startuje już przy powitaniu (kit `welcome.png` nie ma HUD) i jak
  `TaskScene.create` (restart czyści pola) przyjmuje tryb rozgrzewki.
- Nakładka DOM nad canvasem z `Scale.FIT`: wzorzec `src/ui/dom/overlay.ts`; blokowanie stuknięć do canvasu pod
  nakładką, klawiatura systemowa na iPadzie w poziomie (czy zasłania pole), `inputmode="numeric"`, focus.
- Rozgrzewka: skład 6 zadań z bieżącego i poprzedniego etapu (proporcja, ZADANIA nie podaje — dane w `balance`),
  próg „dużo błędów” (pierwsza próba vs po podpowiedzi; `RoundState.outcomes`), czy płaci gwiazdki i pokazuje
  podsumowanie, E1 (brak etapu niżej), czy korekta jest widoczna dla dziecka/rodzica.
- Miesiąc: granice „wrzesień–styczeń / luty–czerwiec / lipiec–sierpień” jako dane; testy na każdy miesiąc i wiek.
- Hak e2e (tylko odczyt): `screen: 'welcome' | 'gate' | 'warmup'`, cele przycisków wieku, odpowiedź bramki (tylko
  build e2e), etap; wspólny helper „przejdź powitanie” dla `task-round.spec.ts` i `narrator.spec.ts`; nowy spec
  pierwszego uruchomienia (wiek → bramka → zmiana/potwierdzenie → rozgrzewka → etap), tekst DOM sprawdzalny wprost.
- Opisy etapów dla rodzica w `pl.ts` (klasa × półrocze z ZADANIA §1) i teacher read nowych napisów.
