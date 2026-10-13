---
change_id: parent-settings-progress
title: Ustawienia rodzica — zmiana etapu, auto-czytanie i podgląd postępów za bramką
status: implemented
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-08 z roadmapy (etap M3, zamyka M3): rodzic po **długim przytrzymaniu ikony** i **bramce dla dorosłego** (ta sama co
w S-06) otwiera ukryte ustawienia: **zmienia etap**, **włącza/wyłącza automatyczne czytanie** (FR-009) i widzi
**zwięzły podgląd postępów** — bieżący krok etapu i 3 najsłabsze umiejętności z przykładami błędów, nie pełną tabelę
(FR-015, US-03, Access Control). Eksport/import/reset to S-12 (M5); zapis to S-11 — do tego czasu wszystko żyje w
sesji. Logika (rozpoznanie długiego przytrzymania, zmiana etapu na uczniu, najsłabsze umiejętności, przykłady błędów,
efektywne `autoRead`) to czysty TypeScript w `src/core/` z testami najpierw; sceny tylko rysują ikonę i przekazują
gest; ustawienia to nakładki DOM z `src/ui/dom/` (jak bramka i panel S-06).

Źródła: `context/foundation/roadmap.md` (`### S-08`, wiersz S-08 w Backlog Handoff z listą follow-upów),
`context/foundation/prd.md` (FR-015, US-03 z AC „Dziecko nie trafia do ustawień przypadkowym stuknięciem ani zwykłym
przytrzymaniem”, „Zmiana etapu przez rodzica ma pierwszeństwo nad propozycją z wieku i jest zapamiętana”, Access
Control „Bramka chroni reset i zmianę etapu przed celowym wejściem dziecka, nie tylko przed przypadkowym”, FR-009,
NFR Prywatność, Business Logic „Rodzic widzi jej skutek w podglądzie postępów (bieżący krok, najsłabsze umiejętności)”,
Persona Rodzic „opanowanie umiejętności, najczęstsze błędy”, Open question 1 o rozgrzewce),
`Martynka-urzadza.md` (§1 lektor, §5 `Settings.autoRead`, `LearnerState.history` „last ~200”, §6 lektor, §8 ustawienia
rodzica, §11 M3), archiwa `context/archive/2026-10-13-adaptive-curriculum/`, `2026-10-13-first-launch-placement/`,
`2026-10-12-narrator-round-summary/` (wzorzec i follow-upy), kod: `src/ui/dom/{dialog,parentGate,stagePanel,overlay}.ts`,
`src/core/parentGate.ts`, `src/core/placement.ts` (`SessionLearner`, `placeByParent`), `src/core/mastery.ts`
(`recordRound`), `src/core/curriculum.ts` (`startLearning`, `skillBuckets`, `unlockReady`, `endRound`),
`src/core/round.ts` (`RoundState`, `answer`), `src/core/types.ts` (`LearnerState`, `Settings`, `Adaptation`),
`src/scenes/{UIScene,TaskScene,WelcomeScene,RoomScene,BootScene}.ts`, `src/data/{balance,pl,layout}.ts`,
`src/testing/e2eHook.ts`, `tests/e2e/*`, `tests/e2e/support/{hook,welcome}.ts`, kit `designs/martynka-maths-A-v1/`
(`style-guide.md`, `screen.css` `.hud`). Plik `lessons.md` w `context/foundation/` nie istnieje (nie ma czego
zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/parent-settings-progress` @ `bfbd18a` (= `main`, po merge'u S-07, PR #23).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-06, S-07 | Oba `done`. S-06: `openParentGate` (`src/ui/dom/parentGate.ts`, mnożenie 13–19 × 13–19 z `balance.parentGate`, logika w `src/core/parentGate.ts`), `openStagePanel` (`src/ui/dom/stagePanel.ts`: wiek + etap → `placeByParent`), wspólne `openDialog` (`src/ui/dom/dialog.ts`: role dialog, focus trap, Escape). `WelcomeScene.openParent` wyłącza `this.input.enabled` pod dialogami. S-07: `SessionLearner` = placement + `Adaptation` + `pendingUnlock` w rejestrze (`REGISTRY_KEYS.learner`). | Bez korekty. Bramkę używamy bez zmian; panel etapu S-06 **nie** pasuje 1:1 (pyta o wiek, woła `placeByParent`, tytuł „Ustawienia startowe”) — nowy panel ustawień z grupą etapów wydzieloną do wspólnego kawałka DOM (decyzja 1). |
| „po długim przytrzymaniu ikony” | Nigdzie nie ma ikony ustawień ani rozpoznawania przytrzymania. HUD (`UIScene`) ma licznik gwiazdek, głośnik i „Do pokoju”; komentarz klasy: wejście tylko na tych widżetach, bez strefy pełnoekranowej (inaczej Phaser zatrzyma stuknięcie). `PageButton` liczy tylko `pointerdown`→`pointerup` na sobie. Kit (`screen.css` `.hud`) ma w HUD: „Do pokoju”, kropki, głośnik, gwiazdki — **bez ikony ustawień**; `style-guide.md`: „Parent review controls belong outside the game scene”. | Nowy widżet ikony w `UIScene` (HUD nad zadaniem i pokojem) poza notesem + czysta maszyna stanów przytrzymania w `core`. DESIGN-GAP: ikona i jej miejsce (decyzja 1). |
| „zmienia etap” | Etap zmienia dziś tylko `WelcomeScene` (przed pierwszą rundą) i `TaskScene.finishWarmup` (w dół o jeden). `TaskScene` trzyma `this.stage` i `this.warmup` w polach; `create()` zeruje `REGISTRY_KEYS.stars` i `sessionStars` — **restart sceny skasowałby gwiazdki**. `startLearning` liczy `unlockedStep` dla **wszystkich** etapów z góry; `mastery` jest per `skillId` (id zawiera etap). | Czysta funkcja zmiany etapu na `SessionLearner` w `core` + metoda `TaskScene`, która podmienia etap i zaczyna świeżą rundę **bez** `scene.restart` (decyzja 2). |
| „włącza lub wyłącza automatyczne czytanie” (roadmap Outcome; PRD FR-009) | `TaskScene.autoRead` to pole sceny ustawiane z `defaultAutoRead(stage, balance.narrator.autoReadStages)` w `create()` i w `finishWarmup`; komentarz: „a parent switch comes with S-08”. `Settings.autoRead` istnieje tylko jako typ (`src/core/types.ts`). | Ustawienia sesji w rejestrze (nowy klucz) z efektywnym `autoRead` liczonym w `core`: wybór rodzica wygrywa i trwa przy zmianie etapu, bez wyboru — domyślna etapu (decyzja 4). |
| „widzi zwięzły podgląd postępów (bieżący krok i 3 najsłabsze umiejętności z przykładami błędów)” | `history` (`recordRound`) trzyma `{ skillId, ok, firstTry, at }`, ostatnie 200 (`balance.mastery.historyLength`). **Brak treści zadania i złej odpowiedzi**: `RoundState` nie zapamiętuje wpisanej wartości (`answer` ją porównuje i odrzuca). Umiejętność nie ma nazwy dla dorosłego — tylko `id`, `type`, `params`; krok ma `title` (autorski, po polsku) i `childName`. | Wpisy historii po błędzie w pierwszej próbie dostają przykład (polecenie + podana odpowiedź + poprawna), a `RoundState` zapamiętuje pierwszą złą odpowiedź zadania; „najsłabsze” i „bieżący krok” liczone w `core` (decyzja 3). |
| „Risk: … podgląd czyta historię z S-07, więc idzie po niej” | Prawda — i historia wymaga rozszerzenia (wyżej). | Patrz decyzja 3. |
| „eksport/import/reset dochodzą dopiero w S-12” | Zgodne (Access Control wymienia je w tych samych ustawieniach). | Panel ustawień ma miejsce na S-12, ale nic z tego tu nie robi. |
| PRD US-03 AC: „Zmiana etapu przez rodzica … jest zapamiętana” | Do S-11 nic nie jest zapisywane (S-06/S-07 decyzja 1); zimny start = powitanie od nowa. | „Zapamiętana” = w sesji; wiersz `[human]` w planie (decyzja 5). |
| Unknowns: — | Faktycznie są: długość przytrzymania, miejsce ikony, los otwartej rundy, kształt historii. | Rozstrzygnięte niżej; resztę doprecyzuje research. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §8 (zawartość ustawień rodzica), PRD FR-015/US-03/Access Control,
`designs/martynka-maths-A-v1/style-guide.md` („Parent review controls belong outside the game scene”; cele dotyku ≥ 96 px
dla kontrolek **dziecka**), `screen.css` `.hud` (elementy HUD).

- **Widok kitu wiązany przez ten slice:** brak — kit nie ma ekranu ustawień, ikony ani podglądu postępów. Wszystko,
  co dodajemy, jest **DESIGN-GAP** z wierszem w `docs/design-gaps.md` (następne numery po 24): (a) ikona ustawień w HUD i
  jej miejsce; (b) panel ustawień rodzica (etap, auto-czytanie, podgląd); (c) podgląd postępów i jego stan pusty (po
  zimnym starcie / przed pierwszą rundą). Wzorzec wyglądu: istniejące dialogi DOM S-06 (`.parent-dialog`,
  `.parent-choices`, `.parent-actions` w `src/style.css`) — nic nowego w stylu poza tym, co panel wymaga.
- **Klucze tekstów do `src/data/pl.ts`:** istniejące `pl.parent.gateTitle`, `gatePrompt`, `gateWrong`, `cancel`,
  `stageHeading`, `pl.stages.*` (nazwy etapów) — użyć ponownie. Nowe (nazwy do planu, wszystkie z teacher read jako nowe
  polskie napisy): tytuł panelu („Ustawienia rodzica”), nagłówek i przełącznik auto-czytania (wł./wył.), nagłówek
  podglądu, „bieżący krok” (krok N z M + tytuł kroku), nagłówek najsłabszych umiejętności, wzór przykładu błędu
  (polecenie → podana odpowiedź, poprawna), stan pusty („za mało odpowiedzi”), „Zamknij”, etykieta ikony (aria).
  Nazwy umiejętności dla rodzica: research rozstrzyga, czy wystarczy `StepDef.title` kroku (istnieje, po polsku), czy
  potrzebna etykieta typu zadania (nowa treść w `src/data/` → teacher read).
- **Nie w tym slice:** eksport, import, reset (S-12), zapis (S-11), profile rodzeństwa (poza v1), pełna tabela opanowania
  (FR-015 ją wyklucza).

## Migration

Nie przewiduję migracji. Profil §4: brak bazy; format zapisu i migracje wchodzą z S-11. Rozszerzenie wpisów `history`
i nowe ustawienia sesji (`autoRead` rodzica) mają kształt pól `LearnerState`/`Settings` z `src/core/types.ts`, więc S-11
zapisze je w wersji 1 formatu bez migracji z czegokolwiek.

## Triggered follow-ups (Trigger: S-08)

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| Przełącznik rodzica dla auto-czytania (`autoRead`) z zapisaną wartością; do tego czasu domyślna etapu na sesję. `Trigger: S-08 (parent settings), S-11 (save)` | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` | **W zakresie** (część sesyjna); zapis — S-11. Decyzja 4. |
| Zmiana etapu z ustawień za tym samym `openParentGate` (panel etapów). `Trigger: S-08` | `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` | **W zakresie** — to rdzeń slice'a. Bramka bez zmian; grupa przycisków etapów wydzielona ze `stagePanel.ts`, żeby oba panele miały jedną (decyzja 1). |
| (impl-review F2) Helpery e2e w 3–4 kopiach (`readHook`, `tapScene`, `fromHook`, `tapNumber`, `answerWrong`/`answerRight`, `phaseIs`; kroki bramki w `support/welcome.ts` `passWelcome` i `first-launch.spec.ts` `openGate`/`typeIntoGate`) → `tests/e2e/support/hook.ts`, kroki bramki eksportowane z `support/welcome.ts`. `Trigger: S-08 (reuses the gate in e2e)` | jw. | **W zakresie, częściowo już zrobione:** `tests/e2e/support/hook.ts` istnieje (S-07: `readHook`, `fromHook`, `tapScene`, `screenIs`, `tapTarget`, `answerRight`, `playRoundRight`) i używa go `adaptive.spec.ts`; kopie zostały w `first-launch.spec.ts`, `narrator.spec.ts`, `task-round.spec.ts` (`readHook`, `fromHook`, `tapScene`, `tapNumber`, `answerWrong`, `answerRight`, `phaseIs`), `openGate`/`typeIntoGate` są lokalne w `first-launch.spec.ts`. S-08 i tak potrzebuje kroków bramki w e2e → najpierw faza refaktoru helperów (bez zmiany asercji), potem nowy spec. |
| `SessionLearner.pendingUnlock` to goły numer kroku bez etapu; zmiana etapu przez rodzica może pokazać kartę z nazwą kroku innego etapu. Zapisać `{ stage, step }` albo czyścić przy zmianie etapu. `Trigger: S-08 (zmiana etapu przez rodzica) or S-11` | `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` | **W zakresie.** Wybieram **czyszczenie przy zmianie etapu** w czystej funkcji zmiany etapu (krok odblokowany zostaje w `unlockedStep` starego etapu, ginie tylko karta — rodzic zmienił etap świadomie). Zmiana typu na `{ stage, step }` zostaje dla S-11, jeśli zapis będzie trzymał kartę między sesjami. |
| Historia bez treści zadania i złej odpowiedzi; „przykłady błędów” wymagają decyzji o polu (np. `taskType` + `skillId` zamiast promptu). `Trigger: S-08` | jw. | **W zakresie.** Decyzja 3: przykład = polecenie + podana odpowiedź + poprawna, tylko we wpisach z błędem w pierwszej próbie. |

Sąsiednie, świadomie poza zakresem: „wcześniejszy zapis ucznia przed codzienną grą” (`Trigger: before S-11, or any deploy
used for daily play`) — S-08 go **wzmacnia** (teraz ginie też wybór rodzica i podgląd), patrz decyzja 5; `mountInstallHint`
przepuszcza stuknięcie do rundy (`Trigger: the next change to src/ui/dom or src/pwa`) — S-08 zmienia `src/ui/dom`, więc
**wchodzi tanio**: ten sam mechanizm wyłączania wejścia gry pod nakładką, którego używają dialogi rodzica (decyzja 1);
`openDialog` bez `stopPropagation` (`Trigger: first Phaser keyboard input`) — S-08 nie dodaje klawiatury Phasera, poza
zakresem; ryzyko e2e #13 do test-planu (`Trigger: /10x-test-plan refresh`) — poza zakresem, ale S-08 proponuje własne
ryzyko (decyzja 6).

## Autonomous decisions

1. **Ikona: w HUD (`UIScene`), na marginesie poza notesem; długie przytrzymanie rozpoznaje czysta maszyna stanów w
   `core`; ustawienia to nakładki DOM S-06, z wyłączonym wejściem gry pod spodem.**
   - Miejsce: `UIScene` działa nad `TaskScene` i nad `RoomScene` (to jedyna scena, która jest w obu), więc rodzic dostaje
     się do ustawień i w zadaniach, i w pokoju. **Nie na powitaniu** — tam jest już przycisk „Rodzic” (S-06). Ikona w
     prawym dolnym rogu, w pasie między notesem (`TASK_LAYOUT.notebook`: x 180–1740, y 204–992) a krawędzią sceny — poza
     każdą strefą dotyku dziecka (kafelki, klawiatura, przyciski strony), mała i wyciszona (rodzic wie, gdzie jest;
     dziecko nie ma powodu jej dotykać). Dokładne współrzędne w `src/data/layout.ts`; research sprawdza, że nie koliduje
     z identyfikatorem buildu (lewy dolny róg), „Do pokoju” ani z pokojem.
   - Przytrzymanie: `pointerdown` na ikonie uruchamia licznik; **ponad `balance` ms (start 2000 ms — dłużej niż „zwykłe
     przytrzymanie” dziecka z US-03 AC)** bez puszczenia i bez zjechania palcem dalej niż próg (px w `balance`) → bramka.
     Puszczenie wcześniej, wyjście poza ikonę albo `pointercancel` → nic, bez żadnej informacji zwrotnej (pasek
     postępu przytrzymania kusiłby dziecko). Logika jako czysta funkcja stanów `(stan, zdarzenie, czas) → stan`
     w `src/core/` (testy najpierw: krótkie stuknięcie, przytrzymanie 1999/2000 ms, ruch, anulowanie, dwa palce); czas
     jako argument (w `core` nie ma `Date`), scena podaje `time.now` i tyka w `update`. Strefa wejścia tylko na ikonie —
     reguła z komentarza `UIScene` (żadnej strefy pełnoekranowej) zostaje, więc gra pod spodem dostaje każde stuknięcie
     jak dziś.
   - Bramka i dialogi: `openParentGate` bez zmian (S-06), potem nowy panel ustawień zbudowany na `openDialog`. Grupę
     przycisków etapów (dziś w `openStagePanel`) wydzielam do wspólnej funkcji w `src/ui/dom/`, żeby panel startowy i
     panel ustawień miały jedną. Pod dialogami **wejście wszystkich aktywnych scen wyłączone** (zadanie, HUD, pokój — nie
     tylko jednej, jak w `WelcomeScene.openParent`; to jest przeciek, który S-06 udowodnił), mowa lektora przerwana; po
     zamknięciu przywrócone. Jedna funkcja „wstrzymaj wejście gry” w warstwie sceny (np. `game.scene.getScenes(true)`),
     której użyje też podpowiedź instalacji (`mountInstallHint`, follow-up S-06), jeśli plan zmieści to tanio.
   - Odrzucone: (a) przytrzymanie licznika gwiazdek albo „Do pokoju” — kontrolki dziecka, dziecko je przytrzymuje;
     (b) nowa scena ustawień w canvasie — kit: „Parent review controls belong outside the game scene”, a S-06 ma
     gotowe DOM-owe dialogi z dostępnością; (c) wielopalcowy gest — trudny do odkrycia dla rodzica i do testu e2e;
     (d) ikona także na powitaniu — dubluje „Rodzic”.
   - Co zmieniłoby odpowiedź: test na tablecie pokaże, że dziecko przytrzymuje róg ekranu (np. trzymając tablet) — wtedy
     dłuższy próg w `balance` albo ikona w innym rogu; kit dostanie ikonę ustawień — wtedy jej miejsce z kitu.
2. **Zmiana etapu w trakcie sesji: czysta funkcja na uczniu + świeża runda nowego etapu bez restartu sceny.**
   - `core`: `changeStageByParent(learner, stage)` (nazwa do planu) → `stage` = nowy, `stageOverriddenByParent: true`,
     `warmupPending: false` (reguła S-06: wybór rodzica pomija rozgrzewkę — PRD Open question 1 rozstrzygnięte w S-06),
     `pendingUnlock: null` (follow-up S-07), `weakStreak: 0` i `easedRounds: 0` (łagodzenie dotyczyło starego etapu).
     **Zostają**: `unlockedStep` (per etap, `startLearning` policzył go z góry dla każdego etapu, więc nowy etap zaczyna
     od podłogi kalendarza albo od kroku zdobytego wcześniej w tej sesji), `mastery`, `streak`, `history` (per
     umiejętność; powrót do etapu zachowuje postęp). Ten sam etap co obecny → bez zmian (nic nie przerywa rundy).
   - Otwarta runda: **przerwana i zastąpiona świeżą rundą nowego etapu** po zamknięciu ustawień (US-03: „kolejna runda
     losuje zadania z E4” — czekanie do końca rundy myliłoby rodzica, który sprawdza efekt od razu). Gwiazdki zdobyte
     w przerwanej rundzie **zostają** (nic nie odbiera gwiazdek; premia za czystą rundę nie jest płacona, bo runda się
     nie skończyła). Odpowiedzi przerwanej rundy **nie** trafiają do opanowania (`endRound` liczy pełne rundy;
     częściowe wyniki to inny kształt danych dla rzadkiej akcji rodzica). Trwająca rozgrzewka — przerwana tak samo,
     `warmupPending: false`. Gdy ustawienia otwarto z pokoju, `TaskScene` śpi: zmiana dotyczy rundy po powrocie
     (scena przy `wake` widzi zmieniony etap i zaczyna świeżą rundę). Podsumowanie / karta „Nowa umiejętność!” na
     ekranie → też zastąpione świeżą rundą (karta znika razem z `pendingUnlock`).
   - Scena: **bez `scene.restart`** — `TaskScene.create()` zeruje `REGISTRY_KEYS.stars` i `sessionStars`, więc restart
     skasowałby gwiazdki sesji. Zamiast tego metoda sceny ustawia `this.stage`, `this.warmup = false`, efektywne
     `autoRead`, dolicza gwiazdki przerwanej rundy do sesji i woła tę samą ścieżkę co `beginRound`.
   - Odrzucone: (a) zmiana od następnej rundy (po „Kolejna runda”) — rodzic nie widzi efektu, US-03 Then; (b) zapis
     częściowej rundy do opanowania — nowa ścieżka w `endRound` tylko dla rzadkiej akcji; (c) wyzerowanie opanowania
     przy zmianie etapu — `mastery` jest per umiejętność, nic nie traci sensu; (d) ponowna rozgrzewka po zmianie przez
     rodzica — S-06: świadomy wybór rodzica ją pomija.
   - Co zmieniłoby odpowiedź: autor zechce, by runda w toku dokończyła się w starym etapie — wtedy flaga „etap od
     następnej rundy” w uczniu, odczytywana w `freshRound`.
3. **Podgląd postępów: historia dostaje przykład błędu; „najsłabsze” i „bieżący krok” liczy `core`.**
   - Dziś `history` = `{ skillId, ok, firstTry, at }` (`recordRound`), bez treści zadania i bez złej odpowiedzi, a
     `RoundState` nie pamięta wpisanej wartości. Wybrane: `RoundState` zapamiętuje **pierwszą** złą odpowiedź każdego
     zadania (wartość jak ją wpisano/stuknięto, jako tekst do pokazania), a wpis historii z błędem w pierwszej próbie
     dostaje opcjonalny przykład `{ prompt, given, answer }` (polecenie jak je widziało dziecko, podana odpowiedź,
     poprawna). Wpisy poprawne bez przykładu (rozmiar). Długość historii bez zmian (200 wpisów).
   - „3 najsłabsze”: wśród umiejętności **bieżącego etapu**, które dziecko już spotkało (są w historii), najniższe
     opanowanie; remis rozstrzyga więcej błędów w historii, potem nowszy błąd. Do każdej do 2 ostatnich przykładów
     błędów. Mniej niż 3 spotkane umiejętności z błędami → pokazujemy tyle, ile jest; zero → stan pusty. Liczby (3, 2)
     w `balance`. „Bieżący krok”: krok z `skillBuckets`/`unlockReady` (najbliższy grywalny ≤ `unlockedStep`), jako
     „krok N z M” (grywalne) + `StepDef.title`. Nazwa umiejętności dla rodzica — `StepDef.title` jej kroku, chyba że
     research pokaże, że w jednym kroku bywa kilka umiejętności nie do odróżnienia (wtedy etykieta typu zadania w danych,
     teacher read). Przykład błędu jest konkretny i sam tłumaczy umiejętność.
   - Odrzucone: (a) `taskType` + `skillId` bez polecenia (propozycja z follow-upu) — rodzic nie zobaczy „przykładu
     błędu”, tylko etykietę; (b) pełna tabela opanowania — FR-015 ją wyklucza; (c) osobny słownik błędów poza
     `history` — drugie źródło, które S-11 musiałby zapisywać osobno; (d) zapis każdej złej próby (także drugiej) —
     druga próba po podpowiedzi to mniej mówiący sygnał, a rośnie rozmiar.
   - Co zmieniłoby odpowiedź: rozmiar zapisu w S-11 okaże się problemem (polecenia słowne do ~3 zdań × 200) — wtedy
     przykłady w osobnym, krótszym buforze per umiejętność.
4. **Auto-czytanie: ustawienie sesji w rejestrze; wybór rodzica wygrywa i trwa przy zmianie etapu.**
   - Wybrane: nowy klucz rejestru z ustawieniami sesji w kształcie `Settings` (`autoRead`) plus informacja, czy rodzic
     wybrał (bez wyboru obowiązuje `defaultAutoRead` etapu — dziś liczone w `TaskScene.create`/`finishWarmup`). Czysta
     funkcja w `core` daje efektywne `autoRead`; `TaskScene` czyta ją zamiast pola liczonego z etapu. Przełączenie
     działa od następnego polecenia (nic nie czyta w trakcie dialogu; mowa jest przerwana przy otwarciu ustawień).
     Kształt pola dla S-11 (np. `autoRead: boolean | null` albo `autoRead` + `autoReadByParent`) — do planu, zgodnie z
     `SaveState.settings`.
   - Odrzucone: (a) przełącznik zmieniający tylko bieżący etap — rodzic ustawia dziecko, nie etap (FR-009 Socrates:
     „dziecko w E3, które słabo czyta”); (b) trzymanie wartości w polu `TaskScene` — ginęłaby przy wyjściu ze sceny i
     nie dałaby się zapisać jednym obiektem.
   - Co zmieniłoby odpowiedź: autor zechce, by zmiana etapu przywracała domyślną wartość — jedna gałąź w funkcji `core`.
5. **Trwałość do S-11: wszystko w sesji; S-11 nie jest wyciągany.**
   - Co rodzic widzi po zimnym starcie (zamknięcie karty, wyrzucenie z pamięci na iPadzie, aktualizacja): gra zaczyna od
     powitania (S-06), etap znów z wieku albo z panelu „Rodzic”, auto-czytanie znów domyślne etapu, a podgląd postępów
     pokazuje **bieżący krok z podłogi kalendarza i stan pusty** („za mało odpowiedzi”) — historia, opanowanie i przykłady
     błędów z wcześniejszych sesji są stracone. US-03 AC „zmiana etapu … jest zapamiętana” jest spełnione tylko w
     obrębie sesji. Wiersz `[human]` w planie z tą decyzją; follow-up „wcześniejszy zapis ucznia przed codzienną grą”
     obejmuje teraz także ustawienia rodzica.
   - Odrzucone: `localStorage` teraz (drugi, niewersjonowany format — to samo uzasadnienie co S-06/S-07 decyzja 1).
   - Co zmieniłoby odpowiedź: opiekun uruchomi „early save” — te same obiekty (`SessionLearner`, ustawienia) trafiają do
     `core/save.ts` wersji 1 bez zmian w S-08.
6. **Prywatność i testy.**
   - Prywatność (PRD NFR, Access Control): nic nie opuszcza urządzenia — żadnych żądań sieciowych, kont, haseł ani
     zapisu poza pamięcią sesji; bramka to działanie, nie hasło; podgląd czyta tylko rejestr gry. Hak e2e (tylko build e2e)
     może pokazać ustawienia/ucznia w snapshocie, ale nigdy odpowiedzi bramki (zasada S-06: „The answer never leaves this
     closure”). Plan ma kryterium: `dist/` bez haka (build guard) i bez nowych żądań sieciowych.
   - Testy: `core` przez `tdd` (maszyna przytrzymania, zmiana etapu, najsłabsze umiejętności, przykład błędu w
     `recordRound`/`RoundState`, efektywne `autoRead`); DOM panelu w testach jednostkowych jak S-06 (research sprawdza, jak
     testowano `parentGate`/`stagePanel`); e2e (lokalnie, `chromium-hook`, port 4397) jeden spec: krótkie stuknięcie i
     krótkie przytrzymanie ikony nic nie otwierają; długie przytrzymanie → bramka → zmiana etapu E3→E4 → następna runda
     ma `learner.stage === 'E4'` i zadania E4; stuknięcie pod dialogiem nie trafia do gry. Długie przytrzymanie w
     Playwright: `page.touchscreen` ma tylko `tap` — research sprawdza CDP `Input.dispatchTouchEvent`
     (touchStart → czekanie → touchEnd) przy `hasTouch`. Propozycja nowego ryzyka (#14, „dziecko wchodzi do ustawień albo
     zmiana etapu nie działa od następnej rundy”) do `context/foundation/test-plan.md` przez `/10x-test-plan refresh` —
     jako follow-up, nie edycja test-planu w tym slice.
   - Odrzucone: e2e z ustawianiem stanu przez hak — hak jest tylko do odczytu (profil §9, S-04).
   - Co zmieniłoby odpowiedź: CDP nie pozwoli na długie przytrzymanie dotykiem — wtedy e2e używa myszy (`mouse.down` →
     czekanie → `mouse.up`; Phaser traktuje oba jako wskaźnik), a ścieżkę dotyku sprawdza bramka wizualna.
7. **Następny krok to `/10x-research parent-settings-progress`, nie `/10x-plan`** (prompt kroku tak narzuca; są otwarte
   pytania niżej). Schowek pominięty (sesja bez interakcji); polecenie jest w `handoff.md` §4.

## Open questions for /10x-research

- Miejsce ikony: wolne pole w prawym dolnym rogu poza notesem przy `Scale.FIT` (1440 i 1024×768), kolizje z
  identyfikatorem buildu, „Do pokoju”, panelem pokoju (`ROOM_LAYOUT`) i kartą/podsumowaniem; rozmiar celu (rodzic, nie
  dziecko — ale ≥ 48 CSS px przy 1024).
- Przytrzymanie w Phaserze 4: `pointerdown`/`pointerup`/`pointerout`/`pointercancel` na strefie w `UIScene`, tykanie
  zegara (`update` vs `time.delayedCall`), czy przytrzymanie na iPadzie Safari nie wywołuje menu kontekstowego /
  zaznaczenia (CSS `touch-action`, `-webkit-touch-callout`); długość progu (2000 ms) wobec zwyczajów dziecka.
- Wyłączenie wejścia pod dialogami: które sceny są aktywne/uśpione w każdym stanie (zadanie, podsumowanie, karta,
  pokój), jak przywrócić `input.enabled` bez włączania wejścia sceny, która go nie miała; czy wspólna funkcja obejmie
  tanio `mountInstallHint`.
- Zmiana etapu w `TaskScene`: dokładne miejsce (metoda + `wake`), co z `shownIndex`, `promptTexts`, `unlockShown`,
  lotem gwiazdki w toku, `REGISTRY_KEYS.roomSwitch`/`narration`; jak hak e2e pokazuje nową rundę.
- Historia: gdzie w `TaskScene.submit`/`core/round.ts` `answer` zachować pierwszą złą odpowiedź (kafelek vs klawiatura,
  typy `select`/porównania z `check`), jak ją pokazać rodzicowi (np. „<” dla COMPARE), jak `endRound` przekazuje przykład
  do `recordRound`; rozmiar historii z poleceniami słownymi.
- Nazwy umiejętności dla rodzica: ile kroków ma > 1 grywalną umiejętność o podobnym `StepDef.title`; czy potrzebna
  etykieta typu.
- Testy DOM: jak S-06 testował `openParentGate`/`openStagePanel` (vitest + jsdom/happy-dom?), czy wspólna grupa etapów
  łamie istniejące testy; czy `first-launch.spec.ts` i `support/welcome.ts` po refaktorze helperów zostają zielone bez
  zmiany asercji.
- E2E długiego przytrzymania dotykiem (CDP `Input.dispatchTouchEvent` w Playwright, projekt `chromium-hook`); cel ikony
  w haku (`targets.settings`), stan dialogu w snapshocie (DOM — tekst można czytać przez `getByRole('dialog')`).
