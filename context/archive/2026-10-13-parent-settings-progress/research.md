---
date: 2026-10-13T05:02:17+02:00
researcher: Claude (autonomous run 2026-10-12-s04-s08, krok research)
git_commit: db487d2
branch: feat/parent-settings-progress
repository: Martynka-urzadza
topic: "S-08 parent-settings-progress: długie przytrzymanie w Phaser 4 i Playwright, wejście gry pod dialogami DOM, zmiana etapu w trakcie sesji, przykłady błędów w historii, najsłabsze umiejętności, auto-czytanie rodzica, e2e i helpery"
tags: [research, parent-settings, long-press, input, stage-change, history, mastery, auto-read, e2e-hook, playwright-cdp]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: ustawienia rodzica i podgląd postępów (S-08)

**Date**: 2026-10-13T05:02:17+02:00
**Researcher**: Claude (autonomous run 2026-10-12-s04-s08)
**Git Commit**: db487d2
**Branch**: feat/parent-settings-progress
**Repository**: Martynka-urzadza

Lessons: `lessons.md` w `context/foundation/` nie istnieje (`ls context/foundation/`), nic nie zastosowano. Kotwice:
plik + symbol, bez numerów linii (kontrakt runu). Trzech równoległych pracowników tylko do odczytu (long press +
Playwright + miejsce ikony; topologia scen + zmiana etapu + auto-czytanie + hak; historia + ranking + helpery e2e);
decydujące twierdzenia sprawdzone ponownie w głównym kontekście (`InputPlugin.isActive`, warunki `manager.enabled` w
`TouchManager`, `currentStepOf` prywatne, `recordRound` i `slice(-historyLength)`, `ROUND_SPEC`). Statystyki poleceń:
jednorazowy skrypt tsx poza repo (ziarno 7, 40 losowań na grywalną umiejętność, 3280 zadań).

## Research Question

Z polecenia kroku i `change.md` § Open questions — rozstrzygnąć z dowodami:
1. rozpoznanie długiego przytrzymania w Phaser 4 na dotyku (zdarzenia, czas, tolerancja ruchu), współistnienie ze
   stuknięciami dziecka, sterowanie z e2e (Playwright touch / CDP);
2. wyłączenie wejścia każdej aktywnej sceny pod dialogami DOM i przywrócenie na każdej ścieżce zamknięcia;
3. dokładne przejście ucznia przy zmianie etapu w trakcie rundy (gwiazdki, otwarta runda, adaptacja, rozgrzewka,
   `pendingUnlock`) bez `scene.restart`;
4. rozszerzenie historii o `{prompt, given, answer}` — gdzie łapać `given`, limit pamięci; ranking „3 najsłabsze”, stan
   pusty;
5. przełącznik auto-czytania i jak nadpisuje `defaultAutoRead` (S-05) w sesji;
6. ryzyka e2e (propozycja id/brzmienia jako follow-up) i deduplikacja helperów e2e bez łamania 15 zielonych specy.

## Summary

- **Long press**: Phaser 4.2.1 obsługuje `touchcancel` (ustawia `pointer.wasCanceled` i emituje zwykły `pointerup`),
  `pointerout` odpala na dotyku przy zjechaniu palcem ze strefy, a `pointermove` obiektu tylko nad obiektem. Zalecenie:
  czysta maszyna stanów w `core` `(state, event, nowMs)` ze zdarzeniami DOWN/MOVE/UP/CANCEL/TICK; scena podaje
  `pointerdown` strefy ikony, scenowy `pointermove` tego samego `pointer.id`, `pointerout` → CANCEL, `pointerup`
  (z `wasCanceled` → CANCEL) i TICK z `update(time)` — jeden zegar (`time`), bez `pointer.downTime`/`getDuration()`
  (mieszają `event.timeStamp` z zegarem pętli). Strefa tylko na ikonie (reguła `UIScene`: żadnej strefy pełnoekranowej),
  ikona 96×96 w prawym dolnym rogu poza notesem: x 1782–1878, y 952–1048 — w trzech widokach z `UIScene` (zadanie,
  podsumowanie/karta, pokój) nic interaktywnego w promieniu ~180 px. CSS już blokuje callout/zaznaczenie; brak tłumienia
  `contextmenu` (tanie zabezpieczenie dla Androida). Playwright 1.64.0 `Touchscreen` ma tylko `tap`; przytrzymanie przez
  surowy CDP `Input.dispatchTouchEvent` (touchStart → czekanie → touchEnd), wzorzec już jest w `tests/e2e/narrator.spec.ts`.
- **Wejście pod dialogami**: zalecany jeden globalny przełącznik `game.input.enabled` (InputManager) z licznikiem
  odwołań: `InputPlugin.isActive` i wszystkie słuchacze okna `TouchManager` sprawdzają `manager.enabled`, więc obejmuje
  każdą scenę, także wybudzoną później, i zatyka przeciek stuknięć przez nakładkę instalacji (`mountInstallHint`).
  Przywracanie trzeba podpiąć pod `onCancel`/`onConfirm` (oraz Escape), bo `openDialog().close()` nie woła callbacków.
- **Zmiana etapu**: gwiazdki otwartej rundy są już w rejestrze (`syncStars`), ale nie w `sessionStars` — ścieżka w
  miejscu musi zrobić `sessionStars += state.starsEarned` jak `beginRound`, inaczej licznik spadnie. Czysta
  `changeStageByParent` zmienia `stage`, `stageOverriddenByParent: true`, `warmupPending: false`, `pendingUnlock: null`,
  `weakStreak: 0`, `easedRounds: 0`; zachowuje `unlockedStep`, `mastery`, `streak`, `history`. W pokoju `TaskScene`
  śpi: `onWake` dziś tylko `render()`; ma porównać `learner.stage` z `this.stage.id` i zastosować zmianę bez
  auto-czytania.
- **Historia**: jedyne miejsce, gdzie znana jest wartość dziecka, to `answer(state, input)` w `src/core/round.ts` —
  dodać `firstWrong` (równoległe do `outcomes`) ustawiane w gałęzi `first`; `TaskScene.finishRound` dołącza przykład do
  `RoundResult`, `recordRound` zapisuje opcjonalne `example` tylko przy `outcome !== 'first'`. Limit: istniejące 200
  wpisów; najgorszy przypadek ~40 KB. `Task.prompt` to gotowy polski tekst (może mieć `\n` i `□`).
- **Najsłabsze**: opanowanie 0–5 nie odróżnia „nigdy nie grane” od „grane bez błędu” — kandydaci muszą mieć ≥ 1 błąd w
  pierwszej próbie w historii. 22 z 48 grywalnych kroków ma > 1 grywalną umiejętność, a w 4 miejscach nawet typ zadania
  się powtarza — nazwa kroku nie identyfikuje umiejętności; przykłady błędów ją objaśniają. „Krok N z M” po krokach
  grywalnych przez wyeksportowane `currentStepOf`/`playableSteps`.
- **Auto-czytanie**: `defaultAutoRead(stageId, stages)` w `src/core/narration/voice.ts`, liczone w `TaskScene.create` i
  `finishWarmup`. Zalecenie: klucz rejestru `settings` z `autoRead: boolean | null` (null = wybór etapu) i czysta
  `effectiveAutoRead`; `TaskScene` czyta wartość w chwili użycia.
- **E2E**: nowy spec musi trafić do `ROUND_SPEC` w `playwright.config.ts`. Proponowane ryzyko **#14** (follow-up, bez
  edycji test-planu). Deduplikacja: do `support/hook.ts` dochodzą `tapNumber`, `answerWrong`, `phaseIs`, `tapNext`,
  `silenceSpeech`, `holdTouch`, `toPage`; kroki bramki do `support/welcome.ts`; jedyna różnica zachowania
  (`tapTarget` polluje vs `tapNext` jednorazowy `expect`) — zachować oba warianty.
- **Testy DOM**: S-06 nie ma testów jednostkowych DOM (brak jsdom/happy-dom, `vitest.config.mts` bez środowiska); panel
  pokrywa e2e — tak samo w S-08 bez nowej zależności.

## Detailed Findings

### 1. Długie przytrzymanie: Phaser 4, scena, CSS, Playwright

**Zdarzenia Phasera 4.2.1 na dotyku** (`node_modules/phaser/src/input/InputPlugin.js` `update`, `Pointer.js`,
`touch/TouchManager.js`; context7 `/websites/phaser_io_api-documentation` potwierdza `wasCanceled`, `downTime`,
`POINTER_UP_OUTSIDE`, `setTopOnly`):
- TOUCH_START → `pointerover` potem `pointerdown` na obiekcie. TOUCH_MOVE → zdarzenia ruchu, potem over/out: **zjechanie
  palcem ze strefy daje `pointerout` w trakcie gestu**. `pointermove` obiektu tylko gdy palec nad nim; scenowe
  `this.input.on('pointermove')` przy każdym ruchu.
- TOUCH_END i TOUCH_CANCEL mają wspólną gałąź: obiekt dostaje `pointerup`, potem `pointerout`. `touchcancel` przechodzi
  `TouchManager.onTouchCancel` → `InputManager.onTouchCancel` → `Pointer.touchcancel`, który ustawia
  `wasCanceled = true` (`Pointer` — sprawdzone: przypisanie `this.wasCanceled = true` w `touchcancel`). Osobnego
  `pointercancel` na obiekcie nie ma — **maszyna musi traktować `pointerup` z `wasCanceled` jako CANCEL**.
- `pointerupoutside` — tylko scenowe, „puszczono poza canvasem”; `gameout`/`gameover` tylko z `MouseManager` (na dotyku
  nie odpalają).
- `pointer.getDuration()` = `manager.time - downTime`, gdzie `downTime = event.timeStamp` — dwa zegary; nie używać.

**Wejście scen i `topOnly`**: `InputPlugin.isActive` = `manager.enabled && this.enabled && scene.sys.canInput()`
(sprawdzone). `topOnly` domyślnie `true`; `InputManager.updateInputPlugins` idzie od góry i zatrzymuje się na scenie,
która przechwyciła — stąd komentarz klasy `UIScene` zakazujący strefy pełnoekranowej. Strefa ikony musi być tylko
prostokątem ikony; w trakcie przytrzymania `UIScene` przechwytuje ten wskaźnik (dziecko pod spodem nic nie dostaje —
pożądane).

**Wzorzec widżetów**: niewidzialna `scene.add.zone(...).setInteractive()` nad Graphics. `PageButton` (`src/ui/widgets/`):
flaga `pressed` na `pointerdown`, czyszczona na `pointerout`, akcja na `pointerup` gdy `pressed && shown`;
`SpeakerButton`/`RoomSwitchButton` działają na `pointerup` (gest użytkownika dla mowy). Pokazywanie/ukrywanie przez
`zone.input.enabled`.

**Zegar**: zalecana czysta funkcja `(state, event, nowMs) => state` w `src/core/` z DOWN(x,y)/MOVE(x,y)/UP/CANCEL/TICK;
TICK z `UIScene.update(time)` tylko gdy przytrzymanie trwa. Bramka otwiera się w chwili przekroczenia progu (palec wciąż
na ekranie). Odrzucone: `this.time.delayedCall` (drugi właściciel stanu, sprzątanie, zegar sceny pauzuje) i sprawdzanie
dopiero na `pointerup` (dwuznaczność 1,9 vs 2,1 s). Reset maszyny na `sleep`/`shutdown` sceny i przy wstrzymaniu wejścia
(puszczenie palca nad otwartym dialogiem jest gubione — patrz § 2). Opóźnienie TICK ≤ 1 klatka (~16 ms) przy progu 2000 ms
— bez znaczenia.

**iPad Safari / Android**: `src/style.css` na `html, body`: `touch-action: none`, `user-select: none`,
`-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent`; `#game-container, canvas { touch-action: none }`;
viewport `user-scalable=no`. `TouchManager.capture` domyślnie `true` (nie nadpisane w `src/main.ts` `createGame`) —
`preventDefault()` na touchstart/touchend canvasu, co tłumi lupę i callout. **Brak**: tłumienia `contextmenu`
(`this.input.touch.disableContextMenu()` albo `contextmenu` → `preventDefault` na `#game-container`) — tanie
zabezpieczenie dla Chrome na Androidzie; nieprzetestowane na urządzeniu.

**Miejsce ikony** (przestrzeń 1920×1080; `src/data/layout.ts`):
- `UIScene` jest uruchamiana tylko z `TaskScene.create` (`this.scene.launch(SCENE_KEYS.ui)`), więc jest nad zadaniem,
  podsumowaniem, kartą odblokowania i pokojem, **nie** nad powitaniem (tam jest „Rodzic” S-06).
- Notes `TASK_LAYOUT.notebook` x 180–1740, y 204–992; panel pokoju `ROOM_LAYOUT.panel` x 180–1740, y 204–1044 (tylko
  grafika). Najbliżsi sąsiedzi interaktywni: przycisk paska („Dalej”) kończy się przy x ≤ 1601 (y 864–960); przyciski
  podsumowania x 454–1390, y 816–944 (`SUMMARY_LAYOUT.buttons`); karta x 388–1532 (`UNLOCK_LAYOUT`); „Wróć do notesu”
  x 720–1200, y 892–1008 (`ROOM_LAYOUT.resume`); głośnik x 1494–1598 i licznik x 1622–1818 u góry (`HUD_LAYOUT`).
  Identyfikator buildu: lewy dolny róg (tekst w (24, 1056), `PLACEHOLDER_FRAME.margin`).
- Kandydat: 96×96 w x 1782–1878, y 952–1048 (środek prawego marginesu 180 px, 32 px od dołu, 42 px od notesu).
  Wpis w `HUD_LAYOUT` i `HUD_TOUCH_TARGETS`; `MIN_TOUCH_TARGET = 96`.
- Rozmiar CSS 96 px gry przy `Scale.FIT`: 1024×768 → 51,2 px; 1280×720 (projekt Playwright) → 64 px; 1180×820 → ~59 px.

**Playwright 1.64.0**: `playwright-core/types/types.d.ts` `interface Touchscreen` ma tylko `tap(x, y)`.
`tests/e2e/narrator.spec.ts` (test „reads the narration on pointerup only”) już używa
`page.context().newCDPSession(page)` + `Input.dispatchTouchEvent` `touchStart` → klatki → `touchEnd`, z mapowaniem
`toPage` (prostokąt canvasu; ta sama matematyka co `support/hook.ts` `tapScene`). Projekt `chromium-hook`
(Desktop Chrome 1280×720, `hasTouch: true`, port 4397) obejmuje tylko `ROUND_SPEC =
/(task-round|narrator|first-launch|adaptive)\.spec\.ts/` — **nowy spec S-08 trzeba dopisać do tego wyrażenia**.
Proponowany helper w `support/hook.ts` (nieuruchomiony): `holdTouch(page, point, ms, drift?)` — touchStart, opcjonalnie
5 × `touchMove` o `drift`, `waitForTimeout`, `touchEnd`, `cdp.detach()`; CDP ma też `type: 'touchCancel'`. Przypadki:
~2300 ms otwiera bramkę; ~1500 ms i `tapScene` nie; dryf poza tolerancję (np. 60 px gry przy progu ~30) nie. Marginesy
≥ 300 ms wokół progu (pętla klatek + `waitForTimeout`); zamiast czekania na czas lepiej czekać na widoczny dialog
(`getByRole('dialog', { name: … })`) i dla przypadków negatywnych sprawdzić jego brak po upływie progu.

### 2. Wejście gry pod dialogami DOM

**Topologia** (`src/main.ts` `createGame`: `[Boot, Welcome, Task, Room, UI]`; brak `pause`/`run`/`bringToTop` w `src/`):

| Ekran | Task | UI | Room |
|---|---|---|---|
| runda, podsumowanie, karta odblokowania, rozgrzewka | RUNNING | RUNNING | nieuruchomiona albo SLEEPING |
| pokój | SLEEPING | RUNNING | RUNNING |

Podsumowanie, karta i rozgrzewka to flagi w `TaskScene` (`state.finished`, `unlockShown`, `warmup`), nie sceny. Wejście
do pokoju: słuchacz `GAME_EVENTS.toRoom` w `TaskScene.create` (`narrator.cancel()`, `scene.switch(room)`); powrót:
`RoomScene` → `scene.switch(task)` → `'wake'`.

**Dziś** (`WelcomeScene.openParent`): `this.input.enabled = false` tylko na powitaniu; zła odpowiedź bramki — nowe
działanie w tym samym dialogu, wejście dalej wyłączone; anuluj/Escape → `onCancel` = `resume`; zaliczenie → panel etapu
bez przerwy w wyłączeniu; panel anuluj/Escape → `resume`; zatwierdź → `start()` (`input.enabled = true`, start zadania).
`openDialog` (`src/ui/dom/dialog.ts`): brak zamykania kliknięciem w tło, Escape woła `onEscape`, `close()` idempotentne
**bez callbacków** — przywracanie wejścia musi iść przez `onCancel`/`onConfirm`, nie przez `close()`.

**Przeciek nakładki instalacji** (follow-up S-06): słuchacze okna `TouchManager`/`MouseManager` (`input.windowEvents`
domyślnie true) przekazują dotknięcia spoza canvasu do `manager.onTouchStart/End`, gdy `manager.enabled` (sprawdzone: 7
warunków `manager.enabled` w `TouchManager.js`). `mountInstallHint` (`src/pwa/installHint.ts`) niczego nie wyłącza.

**Zalecenie — wariant B** (globalny): `game.input.enabled = false` (InputManager). Pokrywa wszystkie sceny, także
wybudzoną albo uruchomioną później, i nakładkę instalacji (montowaną przy starcie, gdy działa tylko Boot). Kształt:
`suspendGameInput(game) => resume` z licznikiem odwołań (zagnieżdżone dialogi, nakładka instalacji), idempotentne
`resume`; `mountInstallHint` dostaje `game` albo callback z `main.ts` (wołane po `createGame`). Nic w `src/` nie dotyka
dziś `game.input.enabled` (grep). Wariant A (pętla po `game.scene.getScenes(true)` z zapamiętaniem `input.enabled`)
odrzucony: pomija śpiącą `TaskScene` (wybudzona miałaby wejście), nie obejmuje nakładki instalacji, a `UIScene.create`
wymusza `input.enabled = true`.
- Skutki uboczne: puszczenie palca (koniec przytrzymania) trafia w czasie wstrzymania i jest gubione — maszyna
  przytrzymania i flagi `pressed` mają się zresetować przy wstrzymaniu/wznowieniu (nowy `pointerdown` i tak nadpisuje
  `pressed` w `PageButton`/`AnswerTiles`/`Keypad`; ryzyko to najwyżej nieaktualne podświetlenie). Przy wyłączonym
  managerze Phaser nie robi `preventDefault` na touchend, ale touchstart został już zablokowany, więc przeglądarka nie
  syntetyzuje kliknięcia myszy — wniosek ze specyfikacji Touch Events, do potwierdzenia w e2e (stuknięcie pod dialogiem
  nie trafia do gry).
- Mowa: `Narrator.cancel()` (`src/ui/narrator.ts`, w `REGISTRY_KEYS.narrator`) przy otwarciu — jak w `toRoom` i
  w obsłudze `visibilitychange` w `main.ts`.

### 3. Zmiana etapu w trakcie sesji bez `scene.restart`

**Gwiazdki**: `TaskScene.create` zeruje `sessionStars` i `REGISTRY_KEYS.stars` (restart wykluczony). `submit`/`advance`
→ `syncStars` ustawia `REGISTRY_KEYS.stars = sessionStars + state.starsEarned`; premia za czystą rundę dochodzi w
`next()` (`src/core/round.ts`) przy ostatnim „Dalej” razem z `finished`; `beginRound` robi
`this.sessionStars += this.state.starsEarned` przed `freshRound()`. Wniosek: gwiazdki otwartej rundy są już na
liczniku; ścieżka zmiany etapu musi je dodać do `sessionStars`, inaczej następny `syncStars` zmniejszy licznik. Runda
przerwana — premii nie ma (nie ukończona); runda ukończona z podsumowaniem na ekranie — `starsEarned` już z premią, a
`finishRound`/`endRound` już się wykonało, więc jednokrotne dodanie jest poprawne.

**`SessionLearner`** (`src/core/placement.ts`) = `PlacedLearner` (`age`, `stage`, `stageOverriddenByParent`,
`warmupPending`) + `Adaptation` (`unlockedStep: Record<StageId, number>` wypełnione dla każdego etapu w `startLearning`,
`mastery`, `streak`, `history`, `weakStreak`, `easedRounds`) + `pendingUnlock: number | null`.

**Czysta `changeStageByParent(learner, stage)`** (nazwa do planu): ten sam etap → uczeń bez zmian (runda nieprzerwana);
inny → `{ ...learner, stage, stageOverriddenByParent: true, warmupPending: false, pendingUnlock: null, weakStreak: 0,
easedRounds: 0 }`; zostają `unlockedStep`, `mastery`, `streak`, `history`. `buildAdaptiveRound` czyta
`unlockedStep[stage.id] ?? 1`. Zgodne z decyzją 2 w `change.md`, z follow-upem S-07 o `pendingUnlock` (czyszczenie) i z
regułą S-06 (wybór rodzica pomija rozgrzewkę).

**Metoda `TaskScene` w miejscu (np. `applyStage`)** — przebudzona wersja `beginRound`:
1. `narrator?.cancel()`;
2. `tweens.killTweensOf(cameras.main)` i `scrollX = 0` (potrząśnięcie); loty gwiazdek same niszczą grafikę; `TaskScene`
   nie ma zdarzeń `time`;
3. `this.stage = getStage(id)`, `this.warmup = false`, `this.unlockShown = false`;
4. `sessionStars += state.starsEarned`, `state = freshRound()`, `shownIndex = -1`;
5. `render()` (przy `shownIndex = -1` `drawPrompt` niszczy stare teksty/ramki, chowa podsumowanie i kartę, resetuje
   klawiaturę, nowe kafelki, narracja, `roomSwitch`);
6. `autoReadFirst()` tylko gdy zmiana zaszła przy przebudzonej scenie (stuknięcie rodzica w dialogu to gest).
- Przerwana rozgrzewka: `finishWarmup` się nie wykona — pokryte `warmupPending: false` i `warmup = false`. Zmiana przy
  podsumowaniu rozgrzewki: `finishWarmup` już mogło obniżyć etap; wybór rodzica go nadpisuje.
- Odpowiedzi przerwanej rundy nie trafiają do `endRound` (decyzja 2).

**Z pokoju**: `onWake = () => this.render()` w `TaskScene.create` — dziś tylko przerysowuje (stary etap, stara runda).
Zalecenie: ustawienia zapisują ucznia w rejestrze; przy `wake` `TaskScene` porównuje `learner.stage !== this.stage.id` i
robi `applyStage` **bez** auto-czytania (dziś przebudzenie nigdy nie czyta; „Wróć do notesu” to nie gest mowy w
sensie reguły S-05). Jeden punkt wejścia: przebudzona → teraz, śpiąca → przy `wake`. Zdarzenia `game.events` dochodzą do
śpiącej sceny (`toRoom` ma strażnika `this.sys.isSleeping()`), więc rozgłoszenie zmiany potrzebowałoby tego samego
strażnika.

### 4. Historia z przykładami błędów, „3 najsłabsze”, bieżący krok

**Kształt odpowiedzi** (`src/core/tasks/types.ts` `Task`): `answer: number | string | number[]`, `choices?` (są → kafelki,
inaczej klawiatura; `src/core/round/view.ts` `roundView`), `check?` (tylko EVEN_ODD select), `prompt: string`, `speak?`,
`visual?` (żaden generator go nie ustawia). Grywalne (`src/core/round/pick.ts` `playable`) tylko `tiles` i `keypad`.
W 3280 próbkach: liczba + klawiatura 2040, liczba + kafelki 546, tekst + kafelki 694 (`<`/`>`/`=`, `+`/`−`,
„parzysta”/„nieparzysta”, dni tygodnia/miesiące, rzymskie, liczebniki słownie, wyrażenia CHOOSE_OP). `number[]` tylko w
niegrywalnym EVEN_ODD select (czeka na S-13). **Nie ma** odpowiedzi wielopolowych (DIV zwraca `answer: q`) ani zadań z
zegarem/miarką (M6).

**Gdzie łapać `given`**: `TaskScene` — `AnswerTiles` i `Keypad` wołają `submit(value)` → `answer(this.state, value)`;
klawiatura podaje `Number(buffer)` (`src/core/round/keypad.ts` `keypadInput`), kafelek — wartość wyboru. `RoundState`
(`tasks, rules, index, phase, solutionStep, outcomes, starsEarned, bonusEarned, finished`) wartości nie trzyma.
Zalecenie: `firstWrong: readonly (number | string | null)[]` obok `outcomes`, inicjowane w `startRound`, ustawiane tylko w
gałęzi `case 'first'` przy złej odpowiedzi; reduktor zostaje czysty.

**Przepływ do historii**: `TaskScene.finishRound` buduje `results = tasks.map((task, i) => ({ skillId, outcome }))` →
`endRound` (`src/core/curriculum.ts`) → `recordRound` (`src/core/mastery.ts`), który dopisuje
`{ skillId, ok: outcome !== 'retype', firstTry: outcome === 'first', at }` i tnie `.slice(-rules.historyLength)` (200,
`balance.mastery.historyLength`; sprawdzone). Rozszerzenie: `RoundResult` dostaje opcjonalny przykład
`{ prompt: task.prompt, given, answer }` (wartości surowe, JSON-safe; formatowanie do wyświetlenia: liczba →
`formatNumber` z `src/core/text/formatNumber`, tekst bez zmian, tablica → `join(', ')` jak `solutionSteps` w
`src/core/round/hints.ts`), a wpis historii — opcjonalne `example` tylko gdy `outcome !== 'first'`. Rozgrzewka też jest
zapisywana do historii.

**`Task.prompt`**: końcowy polski tekst (szablon już wypełniony); może zawierać `\n` (BONDS: 120/3280), `□`, NBSP w
dużych liczbach. W DOM: `white-space: pre-line` albo zamiana `\n` na spację. Długości: mediana 9 znaków, p95 77, maks 115
(CHOOSE_OP, WORD 103, COMPARE_DIFF 82) — jedno ziarno, maks może być nieco wyższe.

**Pamięć**: przykład ~150–200 B JSON; gdyby każdy z 200 wpisów go miał — ~40 KB. Istniejący limit 200 wpisów wystarcza
(przykład starzeje się z wpisem); osobny bufor zbędny.

**Opanowanie** (`recordRound`, `balance.mastery`): liczba całkowita 0–5, brak klucza = 0; +1 po 3 poprawnych w pierwszej
próbie z rzędu; −1 przy `second` i `retype` (nie niżej niż 0); `unlockAt` 4. **Wniosek**: „nigdy nie grana” i „grana
dwa razy dobrze” mają oba 0 — ranking tylko po opanowaniu jest błędny. Zalecany ranking: kandydaci = umiejętności
bieżącego etapu (`SkillDef.stage`; id ma prefiks etapu, np. `E4.4.complement_next_ten`) z ≥ 1 błędem w pierwszej próbie
w historii; sortowanie: opanowanie rosnąco, potem liczba (lub odsetek) błędów malejąco, potem nowszy błąd; do 3; przy
każdej do 2 najnowszych przykładów. Historia zawiera też umiejętności poprzedniego etapu (koszyk „previous”), rozgrzewki
i starego etapu po zmianie przez rodzica — filtr po etapie to decyzja planu (zalecam bieżący etap, zgodnie z FR-015
„bieżący krok etapu i 3 najsłabsze”).

**Nazwy dla rodzica**: `StepDef = { step, title (autorski, „nie pokazywany dziecku”), childName?, types, skills }`;
`SkillDef` bez etykiety. Grywalne kroki / kroki z > 1 grywalną umiejętnością: E1 8/5, E2 8/1, E3 8/6, E4 6/2, E5 10/4,
E6 8/4 — razem **22 z 48**, 82 grywalne umiejętności. Przykłady: E4.6 „Mnożenie i dzielenie do 50” (5 umiejętności),
E4.4 „Dopełnianie do dziesiątki” (4), E1.3 „Działania do 5” (4). Typ zadania powtarza się w kroku w 4 miejscach (E4.4
ADD_SUB ×2, E4.6 MULT ×2, E4.6 DIV ×2, E6.9 ROUNDING ×2). Opcje: (a) `StepDef.title` + przykłady błędów (bez nowej
treści; dwie pozycje mogą mieć tę samą nazwę — przykład je rozróżnia); (b) nowe pole `label` w `SkillDef` dla 82
umiejętności (nowa treść w `src/data/`, teacher read, duża powierzchnia); (c) etykieta typu zadania (~20 typów, w
`pl.ts`) + tytuł kroku — nadal niejednoznaczne w 4 miejscach. Zalecam (a), ewentualnie grupowanie pozycji z tego samego
kroku — decyzja planu.

**Bieżący krok**: `currentStepOf(steps, unlockedStep)` w `src/core/curriculum.ts` jest prywatne (sprawdzone: `const`, nie
`export`), używane w `skillBuckets` i `unlockReady` — wyeksportować (albo wystawić `currentStep(stage, adaptation)`),
nie powielać. „Krok N z M”: N = pozycja w `playableSteps(stage)` (od 1), M = ich liczba; surowe `step`/`steps.length`
dałoby np. w E1 „krok 2 z 11” z krokami nieosiągalnymi.

**Stany puste**: historia pusta (każdy zimny start do S-11; przed pierwszą ukończoną rundą — wyniki trafiają do
historii dopiero w `finishRound`); brak błędów w pierwszej próbie; < 3 umiejętności z błędami (pokazać tyle, ile jest);
tylko wpisy rozgrzewki/innego etapu; po zmianie etapu stare wpisy zostają (filtr po etapie daje stan pusty nowego
etapu).

### 5. Auto-czytanie

`defaultAutoRead(stageId, stages)` w `src/core/narration/voice.ts`; lista `balance.narrator.autoReadStages =
['E1','E2']` (`src/data/balance.ts`). Liczone w `TaskScene.create` i `TaskScene.finishWarmup`; użyte w `autoReadFirst`
(gdy `phase === 'first'`; wołane z `create`, `advance`, `beginRound`), `autoReadUnlock`, i w `snapshot().autoRead`.
Głośnik HUD (`UIScene.create`, `SpeakerButton`) jest ręczny i niezależny od auto-czytania. `REGISTRY_KEYS`
(`src/data/layout.ts`): `stars`, `narration`, `narrator`, `roomSwitch`, `learner`, `month` — dochodzi `settings`.
`src/core/types.ts`: `Settings = { autoRead: boolean }`, `SaveState.settings: Settings`.
Zalecenie: wartość sesji `{ autoRead: boolean | null }` (null = brak wyboru rodzica → domyślna etapu) i czysta
`effectiveAutoRead(settings, stageId, autoReadStages) = settings.autoRead ?? defaultAutoRead(...)` (lista przekazywana,
bo `core` nie importuje `data/balance`). `TaskScene` liczy wartość w chwili użycia (getter z rejestru i `this.stage`)
zamiast pola — przełączenie działa od następnego polecenia, a przypisania w `create`/`finishWarmup` znikają.
Alternatywa: `autoRead: boolean` + `autoReadByParent: boolean` (nie zmienia typu `Settings`). Obie pasują do S-11
wersji 1 bez migracji; `null` zmienia typ `Settings` z planu § 5 — decyzja planu.

### 6. Hak e2e, ryzyko, helpery, testy DOM

**Hak** (`src/testing/e2eHook.ts` `installE2EHook`, `window.__martynkaE2E`, tylko gettery): `snapshot` (na powitaniu
`{ screen: 'welcome', learner }`, dalej `TaskScene.snapshot()` + `screen`, zamrożony `learner`, `counterText`,
`speakerVisible`) i `targets` (kafelki, klawisze, `next`, `step`, `nextRound`, `toRoom`, `unlockNext` — trzy ostatnie
null w pokoju, `resume`, `speaker`, `roomSwitch`). Po zmianie etapu widać: `stage` i `learner.stage` nowe,
`stageOverriddenByParent: true`, `index` 0, `phase 'first'`, `starsEarned` 0, `starsTotal`/`counterText` bez zmian. W
pokoju przed przebudzeniem `learner.stage !== snapshot.stage`. Dodatki zgodne z regułą „tylko odczyt”:
`targets.settingsIcon` (z `UIScene`, nie null w pokoju), `snapshot.settings` (zamrożona kopia), opcjonalnie
`inputSuspended`. Stan dialogu — przez prawdziwy DOM (`getByRole('dialog', { name })`), nigdy odpowiedź bramki w haku.
Strażnik buildu: `vite/e2eHookGuard.mjs` (`checkE2EHook`, znacznik `__martynkaE2E`) w `vite/config.prod.mjs`,
`__E2E_HOOK__` w `vite/config.shared.mjs`, test `tests/e2eHookGuard.test.ts` — nowe gettery w tym samym module są
objęte.

**Ryzyko do test-planu** (follow-up, bez edycji `context/foundation/test-plan.md` w tym slice): Risk Map ma #1–#11;
#12 (pierwsze uruchomienie) i #13 (adaptacja / karta) są tylko „proposed” w tytułach specy i follow-upach
(`context/archive/2026-10-13-first-launch-placement/…`, `…-adaptive-curriculum/…`). Proponowane **#14**: „Dziecko
wchodzi do ustawień rodzica stuknięciem lub zwykłym przytrzymaniem, stuknięcie pod dialogiem rodzica trafia do gry, albo
zmiana etapu przez rodzica nie działa od razu (kolejna runda wciąż ze starego etapu, gwiazdki znikają)”; Impact High,
Likelihood Medium; Source: PRD FR-015, US-03 AC, Access Control; roadmap S-08. Odpowiedź: unit w `core` (maszyna
przytrzymania, `changeStageByParent`, ranking, `effectiveAutoRead`) + jeden lokalny e2e (touch przez CDP). Anty-wzorce:
ustawianie etapu przez hak, czekanie stałym czasem zamiast na dialog, asercja treści zadania (test-plan § 7: e2e
sprawdza przepływ, nie tekst). Spec w tytule jako `#14 (proposed)` (konwencja #12/#13).

**Helpery** (15 × `test(`: seed 1, task-round 4, first-launch 6, narrator 3, adaptive 1 — zgodne z baseline):
- `tests/e2e/support/hook.ts` eksportuje: typy `Point`, `Snapshot`, `Targets`; `readHook`, `fromHook`, `snapshot`,
  `targets`, `tapScene`, `screenIs`, `tapTarget` (polluje), `answerRight`, `playTaskRight`, `playRoundRight`; prywatne
  `tapNumber`.
- `tests/e2e/support/welcome.ts`: prywatne kopie `readHook` (typ `WelcomeHook`), `tapScene`, `openWelcome`; eksport
  `passWelcomeAsParent` (bramka inline: nienazwany `getByRole('dialog')`, regex po `textContent`), `passWelcome`,
  `passWelcomeAsChild`.
- Kopie: `task-round.spec.ts` (identyczne `readHook`, `fromHook`, `snapshot`, `targets`, `tapScene`, `tapNumber`,
  `answerRight`, `screenIs`; lokalne `answerWrong`, `phaseIs`, `tapNext` — jednorazowy `expect`, `cleanTask`);
  `first-launch.spec.ts` (identyczne j.w. + `answerWrong`, `phaseIs`; `playTask`, `playRound`; bramka `gateProblem`,
  `typeIntoGate`, `openGate` z `?e2eMonth=OCTOBER`, `openPanel`); `narrator.spec.ts` (`fromHook` z wbudowanym
  `readHook`, `tapScene` przez `toPage`, `phaseIs`, `tapNumber`, `answer(page, right)`, `tapNext`; atrapy mowy
  unikalne); `adaptive.spec.ts` już importuje z `support`. „Cicha `speechSynthesis`” w `addInitScript` skopiowana w
  `beforeEach` task-round, first-launch i adaptive.
- Deduplikacja bez zmiany asercji: (1) `hook.ts` eksportuje też `tapNumber`, `answerWrong`, `phaseIs`, `tapNext`
  (semantyka task-round), `silenceSpeech`, `toPage`, `holdTouch`; (2) `readHook`/`fromHook`/`snapshot`/`targets`
  generyczne (`<S extends BaseSnapshot = Snapshot>`) albo `Snapshot`/`Targets` z opcjonalnymi polami — specy zachowują
  swoje dodatkowe pola; (3) `welcome.ts` importuje `readHook`/`tapScene`, eksportuje `openWelcome(page, month?)`,
  `gateProblem`, `typeIntoGate`, `openGate`; `passWelcomeAsParent` na nich (nazwany dialog jest równoważny — otwarty jest
  jeden); (4) specy usuwają kopie; (5) `cleanTask`/`playTask`/`playRound` zostają lokalne — jedyna realna różnica
  zachowania to `tapTarget` (polluje) vs `tapNext` (jednorazowy `expect`): zostawić oba; (6) `answer(page, right)` w
  narratorze jako jednolinijkowy wrapper. „Identyczne” — z lektury, nie z diffu.

**Testy DOM S-06**: brak. `tests/parentGate.test.ts` testuje tylko czysty `src/core/parentGate.ts`; brak testów
`stagePanel`/`dialog`; `vitest.config.mts` bez środowiska (Node), brak jsdom/happy-dom w devDependencies. DOM S-06
pokrywa `tests/e2e/first-launch.spec.ts` i `support/welcome.ts`. Dla S-08: logika w `core` (tdd) + e2e, bez nowej
zależności (dodanie happy-dom wymagałoby osobnej decyzji).

**test-stack.md § E2E**: Playwright 1.64.0, `playwright.config.ts`; pojedynczy spec `npx playwright test
tests/e2e/<name>.spec.ts`; całość `npx playwright test`; baza `http://localhost:4398`; seed `tests/e2e/seed.spec.ts`
(#8); poza sandboxem. Projekt `chromium-hook`/4397 nie jest tam opisany (istniejący follow-up `/10x-e2e-setup` re-run).

## Code References

- `node_modules/phaser/src/input/InputPlugin.js` `isActive`, `update` — warunek `manager.enabled`, kolejność zdarzeń
- `node_modules/phaser/src/input/touch/TouchManager.js` `onTouchCancel`, słuchacze okna — `manager.enabled`
- `node_modules/phaser/src/input/Pointer.js` `touchcancel` (`wasCanceled`), `getDuration`
- `src/scenes/UIScene.ts` komentarz klasy (bez strefy pełnoekranowej), `create` (`input.enabled = true`)
- `src/scenes/TaskScene.ts` `create` (zerowanie gwiazdek, `onWake`, `toRoom`, `autoRead`), `beginRound`, `syncStars`,
  `submit`, `finishRound`, `finishWarmup`, `autoReadFirst`, `snapshot`
- `src/scenes/WelcomeScene.ts` `openParent` — wyłączenie wejścia jednej sceny
- `src/ui/dom/dialog.ts` `openDialog` — `close()` bez callbacków; `src/ui/dom/stagePanel.ts` `openStagePanel`;
  `src/ui/dom/parentGate.ts` `openParentGate`
- `src/pwa/installHint.ts` `mountInstallHint` — przeciek stuknięć
- `src/ui/narrator.ts` `Narrator.cancel`
- `src/core/round.ts` `RoundState`, `startRound`, `answer`, `next`
- `src/core/mastery.ts` `recordRound`; `src/core/curriculum.ts` `endRound`, `currentStepOf` (prywatne), `playableSteps`,
  `skillBuckets`, `unlockReady`, `startLearning`
- `src/core/placement.ts` `SessionLearner`, `placeByParent`; `src/core/types.ts` `Settings`, `SaveState`, `LearnerState`
- `src/core/narration/voice.ts` `defaultAutoRead`; `src/data/balance.ts` `narrator.autoReadStages`, `mastery`
- `src/data/layout.ts` `TASK_LAYOUT`, `HUD_LAYOUT`, `HUD_TOUCH_TARGETS`, `MIN_TOUCH_TARGET`, `ROOM_LAYOUT`,
  `SUMMARY_LAYOUT`, `UNLOCK_LAYOUT`, `REGISTRY_KEYS`
- `src/core/tasks/types.ts` `Task`; `src/core/round/keypad.ts` `keypadInput`; `src/core/round/pick.ts` `playable`;
  `src/core/round/hints.ts` `solutionSteps`
- `src/testing/e2eHook.ts` `installE2EHook`; `vite/e2eHookGuard.mjs` `checkE2EHook`
- `playwright.config.ts` `ROUND_SPEC`; `tests/e2e/support/{hook,welcome}.ts`; `tests/e2e/narrator.spec.ts` (CDP touch)
- `src/style.css` (`touch-action`, `-webkit-touch-callout`); `designs/martynka-maths-A-v1/style-guide.md` („Parent
  review controls belong outside the game scene”)

## Architecture Insights

- Wzorzec „logika w `core`, scena podaje zdarzenia i czas” (S-04–S-07) rozciąga się na gest: maszyna przytrzymania jest
  czystym reduktorem z czasem jako argumentem, jak `answer` w `round.ts`.
- Globalne wstrzymanie wejścia na poziomie InputManagera jest jedynym miejscem, które obejmuje sceny śpiące i
  nakładki DOM montowane przed scenami gry.
- Rejestr gry pozostaje magistralą sesji (`learner`, nowe `settings`); sceny czytają w chwili użycia — to też kształt,
  który S-11 zapisze jednym obiektem.
- Kit: brak widoku ustawień, ikony i podglądu → DESIGN-GAP (wiersze po 24 w `docs/design-gaps.md`); wzorzec wyglądu =
  dialogi S-06 (`.parent-dialog`, `.parent-choices`, `.parent-actions` w `src/style.css`). Teksty istniejące do
  ponownego użycia: `pl.parent.gateTitle`, `gatePrompt`, `gateWrong`, `cancel`, `stageHeading`, `pl.stages.*`.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` — przełącznik `autoRead` rodzica
  (Trigger: S-08, S-11): wspierane — § 5.
- `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` — zmiana etapu za `openParentGate`
  (Trigger: S-08): wspierane; helpery e2e w kopiach (Trigger: S-08): częściowo nieaktualne (S-07 utworzył
  `support/hook.ts`), kopie nadal w 3 specach — § 6.
- `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` — historia bez treści i złej odpowiedzi
  (Trigger: S-08): wspierane, rozwiązanie § 4 (polecenie zamiast `taskType` + `skillId`); `pendingUnlock` bez etapu
  (Trigger: S-08 or S-11): wspierane, czyszczenie w `changeStageByParent` (§ 3); ryzyko #13 proposed — numeracja #14
  dla S-08.
- `context/changes/parent-settings-progress/change.md` decyzje 1–6: potwierdzone, z korektami: (a) wstrzymanie wejścia
  globalne (`game.input.enabled`), nie pętla po scenach — decyzja 1 zostawiała mechanizm otwarty; (b) ranking nie może
  opierać się na samym opanowaniu (0 dla nigdy-nie-granych) — doprecyzowanie decyzji 3; (c) przy zmianie etapu trzeba
  dodać gwiazdki otwartej rundy do `sessionStars` — doprecyzowanie decyzji 2; (d) nowy spec do `ROUND_SPEC`.

## Related Research

- `context/archive/2026-10-13-adaptive-curriculum/research.md` — adaptacja, `pendingUnlock`, hak e2e
- `context/archive/2026-10-13-first-launch-placement/research.md` — bramka rodzica, panel etapu, rozgrzewka

## Open Questions

Decyzje dla `/10x-plan` (wszystkie z rekomendacją wyżej):
1. Kształt `Settings` w sesji: `autoRead: boolean | null` vs `autoRead` + `autoReadByParent` (§ 5).
2. Nazwa umiejętności dla rodzica: tytuł kroku + przykłady (zalecane) vs etykieta w danych (§ 4).
3. Filtr historii po bieżącym etapie dla rankingu (zalecane) i próg kandydata (≥ 1 błąd w pierwszej próbie).
4. Tolerancja ruchu (px gry) i próg (2000 ms) w `balance` — próg z decyzji 1; tolerancję zalecam ~30 px gry (mniej niż
   połowa ikony), do potwierdzenia na tablecie.
5. Czy `mountInstallHint` wchodzi w ten slice (tanio przy wariancie B) — decyzja planu.
Nierozstrzygnięte faktycznie (tylko urządzenie): zachowanie iPada przy długim przytrzymaniu przy `capture=true`,
`contextmenu` na Androidzie, czy syntetyczne kliknięcie po puszczeniu palca nad dialogiem nie pojawia się (sprawdzi e2e).
