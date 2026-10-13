---
type: observability-audit
date: 2026-10-13 06:59
mode: audit
commit: cdeff4a
branch: docs/observability-audit-2026-10-12-s04-s08
dirty_tree: false
areas: [task-round-stars-S04, narrator-round-summary-S05, first-launch-placement-S06, adaptive-curriculum-S07, parent-settings-progress-S08]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: null
findings: { critical: 2, high: 10, medium: 13, low: 14 }
---

# Audyt obserwowalności — S-04…S-08 (2026-10-13)

Zamknięcie runu `2026-10-12-s04-s08`. Audyt statyczny (bez `--runtime`), commit `cdeff4a` (main po PR #24).

## 1. TL;DR

- **Brak jakiejkolwiek granicy błędów.** Nie ma `window` `error`/`unhandledrejection`, a pętla Phasera
  (`RequestAnimationFrame.step`) wywołuje krok gry *przed* zaplanowaniem kolejnej klatki — wyjątek w `create`,
  `update`, tweenie, `delayedCall` albo w `wake` zatrzymuje grę na zawsze: zamrożony ekran, zero komunikatu.
- **Jeden przełącznik wejścia bez `finally`.** Każde okno DOM (bramka, panel etapu, ustawienia) zamyka się
  *przed* wywołaniem callbacku, a zwolnienie `inputSuspender` jest tylko na ścieżce sukcesu. Wyjątek w callbacku =
  płótno wygląda żywo, ale nie reaguje na dotyk; jedyne wyjście to przeładowanie, które kasuje całą sesję (brak zapisu do S-11).
- **„Nie może zepsuć gry” znaczy dziś „połknij bez śladu”.** Wszystkie 3 `catch` w `src/` zwracają domyślną wartość
  bez lokalnego zapisu (lektor, rejestracja SW, podpowiedź instalacji). Lektor może być „włączony” i niemy, a nikt nie wie dlaczego.
- **Ekrany dla rodzica pokazują ustawienia, nie stan faktyczny.** Panel ustawień mówi „Czytanie automatyczne: Wł.” bez
  polskiego głosu; podgląd postępów pokazuje ten sam spokojny pusty stan dla „brak danych”, „brak błędów” i „sesja się
  zresetowała”; utknięcie adaptacji (nigdy nie odblokuje kroku) jest niewidoczne.
- **Mutacja przed wywołaniem, które może rzucić.** `beginRound`, `applyParentStage`, `advance` zmieniają pola sceny
  przed `freshRound()`/`endRound()` — po wyjątku guardy kolejnego tapnięcia pomijają krok zamiast go powtórzyć
  (np. gwiazdki doliczane wielokrotnie).
- **Smoke po wdrożeniu sprawdza transport, nie zachowanie**, a produkcyjny bundel nie ma map źródeł — stos z konsoli
  rodzica to zmanglowane `a.b`.

## 2. Model przechwytywania

- **Platforma:** klient-only offline PWA (Phaser 4.2.1 + TS + Vite), tablet poziomo, dzieci 6–10 lat. Brak backendu
  i kont. PRD zakazuje telemetrii, analityki i jakichkolwiek żądań sieciowych w trakcie gry
  (`context/foundation/prd.md` wiersze 55 i 187).
- **Tracker błędów:** brak — z założenia. Nie rekomendujemy dostawcy SaaS.
- **Gdzie błąd może się pojawić:** wyłącznie konsola przeglądarki (na tablecie dziecka nikt jej nie czyta; dostępna
  tylko przez zdalne debugowanie), service worker, post-deploy smoke `npm run check:deploy`
  (`scripts/check-deploy.ts` `main`), testy CI i lokalne e2e.
- **Granice:** brak globalnego handlera w `src/` (grep: jedyne `onerror` to `utterance.onerror` w `src/ui/narrator.ts`).
  Dwie ścieżki wykonania:
  - *krok RAF* — `node_modules/phaser/src/dom/RequestAnimationFrame.js` `step` wywołuje `callback(time)` przed
    `requestAnimationFrame(step)`; `scene.start`/`switch` idą przez kolejkę `SceneManager.processQueue`, więc `create`
    i handler `wake` też działają w kroku. Wyjątek = śmierć pętli.
  - *listener DOM* — wskaźniki Phasera (`TouchManager` → `InputManager.onTouchStart`) i okna `src/ui/dom/*`.
    Wyjątek przerywa tylko ten handler, zostawiając stan w połowie zmiany.
- **Logowanie:** 0 wywołań `console.*` w `src/`; jedyne wyjście konsolowe w produkcji pochodzi z Phasera
  (np. `FontFile.onProcess` → `console.warn('Font failed to load')`).
- **Czyszczenie / próbkowanie:** nie dotyczy.
- **Tożsamość wdrożenia:** `__BUILD_ID__` = 7 znaków SHA (`vite/config.shared.mjs` `buildId`, fallback `'dev'`),
  rysowany w rogu `TaskScene` i `WelcomeScene` oraz w `#game-container[data-build]` (`src/main.ts`). Brak map źródeł
  (`vite/config.prod.mjs`: terser, `mangle: true`, `build.sourcemap` domyślnie wyłączone).
- **Service worker:** `vite-plugin-pwa`, `skipWaiting` + `clientsClaim` + `cleanupOutdatedCaches`; rejestracja w
  `src/pwa/registerServiceWorker.ts` z `.catch(() => undefined)`.

## 3. Co dociera do obserwatora (statycznie, nieudowodnione w czasie działania)

| Kształt awarii | Dziecko | Rodzic | Opiekun (maintainer) | Werdykt |
|---|---|---|---|---|
| Wyjątek w `TaskScene.create` / `onWake` (np. generator po MAX_ATTEMPTS, nieznany etap) | zamrożony ostatni kadr, brak HUD i zębatki | nic | 1 linia w konsoli, zmanglowany stos | missed |
| Wyjątek w callbacku okna DOM (bramka, panel etapu, ustawienia) | żywy ekran, dotyk nie działa | okno zniknęło, zębatka martwa | 1 linia w konsoli | missed |
| Wyjątek w handlerze przycisku („Kolejna runda”, „Dalej”) | martwy przycisk; każde tapnięcie dolicza gwiazdki | zawyżony licznik | 1 linia w konsoli na tapnięcie | poor |
| Brak polskiego głosu / błąd syntezy | brak lektora | panel: „Czytanie automatyczne: Wł.” | nic (zdarzenie `onerror` porzucone) | missed |
| Font nie załadował się | font zastępczy | nic | `console.warn` z Phasera | poor |
| Rejestracja SW nieudana | gra działa tylko online | nic | nic | missed |
| Zepsuty build wdrożony (pusty canvas) | pusty ekran, z cache także offline | nic | `check:deploy` przechodzi | missed |
| Adaptacja stoi (trafność 60–79%) | te same zadania bez końca | „Krok N z M”, bez postępu | brak testu/symulacji | missed |

## 4. Systemowe przyczyny źródłowe

1. **Brak granicy błędów na obu ścieżkach (RAF i DOM).** `core/` rzuca precyzyjne `RangeError`/`TypeError` przy
   złamanych niezmiennikach danych (rozsądna decyzja: błąd danych ma być głośny w testach), ale w przeglądarce nikt ich
   nie łapie. Wyjaśnia: C-1, H-1, H-2, M-1, M-5.
2. **Efekty uboczne przed wywołaniem, które może rzucić; zwolnienie tylko na ścieżce sukcesu.** Okna zamykają się
   przed `onPass`/`onConfirm`, `suspend()` bez `finally`, `sessionStars`/`stage` zmieniane przed `freshRound()`.
   Wyjaśnia: C-2, M-1, M-2, M-3, L-8.
3. **„Cicho z założenia” bez lokalnego śladu.** Degradacja jest słuszna (gra ma działać), ale usuwa jedyny sygnał.
   Wyjaśnia: H-3, H-4, H-5, M-6, M-7.
4. **Widoki rodzica płaszczą stan.** Funkcje czyste zwracają `null` / `?? domyślne` i gubią powód; panel pokazuje
   ustawienie zamiast stanu efektywnego. Wyjaśnia: H-6, H-7, H-8, M-4, M-8.
5. **Weryfikacja wdrożenia i diagnostyka post-hoc tylko „transportowa”.** Smoke nie uruchamia JS, brak auto-rollbacku,
   brak map źródeł. Wyjaśnia: H-9, M-9, L-9.

## 5. Ustalenia według obszaru

Lokalizacje jako plik + SYMBOL (numery wierszy przy `cdeff4a` tylko pomocniczo).

### Platforma / infrastruktura

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| C-1 | `src/main.ts` (brak handlera) + `phaser/src/dom/RequestAnimationFrame.js` `step` | coverage-gap | **critical** | Każdy wyjątek w kroku gry (create/update/tween/delayedCall/wake) zatrzymuje pętlę na zawsze. Dziecko: zamrożony ekran, bez komunikatu; przeładowanie kasuje sesję. Opiekun: nic poza konsolą. Dotyczy m.in. `TaskScene.create` → `freshRound` → generator `throw` po MAX_ATTEMPTS, `TaskScene.onWake` → `applyParentStage`, `UIScene.update` → `openSettings`. | Globalny `error`/`unhandledrejection` w `main.ts` rysujący spokojną kartę DOM („Ups! Dotknij, aby zacząć od nowa”) z `__BUILD_ID__`; bez sieci. |
| C-2 | `src/ui/dom/parentGate.ts` `submit`, `src/ui/dom/stagePanel.ts` `openStagePanel` (confirm), `src/ui/dom/settingsPanel.ts` (confirm), `src/scenes/UIScene.ts` `openSettings`/`applySettings`, `src/scenes/WelcomeScene.ts` `start`, `src/core/inputSuspend.ts` `createInputSuspender` | swallowed | **critical** | `handle.close()` przed callbackiem; jeśli `getStage`/`progressView`/`openSettingsPanel`/`changeStageByParent`/`placeByParent`/`startLearning` rzuci, `suspend()` nigdy nie jest zwolnione, `releaseInput`/`closeDialog` zostają ustawione → zębatka i „Rodzic” martwe. Dziecko: żywy ekran bez reakcji na dotyk. | Zwalniać w `finally` (lub zamykać okno dopiero po udanym callbacku); test jednostkowy/e2e: callback rzuca → `input.enabled` wraca do `true`. |
| H-9 | `scripts/check-deploy.ts` `main`, `.github/workflows/deploy.yml` (krok po `switch`) | coverage-gap | high | Smoke nie wykonuje JS: build, który startuje do pustego canvasu, przechodzi; nieudany smoke nie wycofuje release'u; nie sprawdza 200 dla każdego URL z precache (font, ikony). | Headless boot smoke (np. Playwright: `data-build` + pierwszy kadr) i automatyczny `rollback` przy porażce — decyzja opiekuna (Playwright dziś nie działa w CI). |
| M-9 | `vite/config.prod.mjs` | identity-lost | medium | Brak map źródeł + mangle: stos z konsoli rodzica nieczytelny bez przebudowy tego SHA. | `build.sourcemap: 'hidden'`, `.map` jako artefakt CI per SHA (niepublikowany). |
| H-5 | `src/pwa/registerServiceWorker.ts` `registerServiceWorker` | swallowed | high | Nieudana rejestracja = gra tylko online; dziecko traci offline bez sygnału. Precache z 404 zostawia stary build — jedyny ślad to stary build id. | Lokalny wpis diagnostyczny (bez sieci) widoczny w panelu rodzica obok build id i stanu SW. |
| M-6 | `src/scenes/BootScene.ts` `preload` (+ `phaser` `FontFile.onProcess`) | swallowed | medium | Font nie ładuje się → font zastępczy, układ mierzony pod inny font; tylko `console.warn`. | Listener `loaderror` / `document.fonts.check` → atrybut `data-font-fallback` lub lokalny wpis diagnostyczny. |
| L-8 | `src/core/inputSuspend.ts` `createInputSuspender` (release) | swallowed | low | Jeśli `onRelease` (reset wskaźników) rzuci, `count` = 0 i `released` = true, ale `enabled` zostaje `false` na zawsze. | Ustawiać `enabled = true` przed `onRelease` lub w `finally`. |
| L-9 | `vite/config.shared.mjs` `buildId` | identity-lost | low | Fallback `'dev'` i build z brudnego drzewa nieoznaczone. | Sufiks `-dirty`/`-dev`. |

### S-04 Runda zadań

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-1 | `src/scenes/TaskScene.ts` `create` → `freshRound` → `buildAdaptiveRound`/`buildWarmup` → generatory (`word.ts`, `div.ts`, `compareExpr.ts`… throw po MAX_ATTEMPTS) | coverage-gap | high | Instancja C-1 na głównej pętli: rzut przed `scene.launch(ui)`, więc nawet zębatka rodzica nie istnieje. | Guard budowy rundy + C-1. |
| M-1 | `TaskScene` `beginRound`, `closeUnlock`, `applyParentStage` | flattened-response | medium | `sessionStars += starsEarned` przed `freshRound()`; po wyjątku każde tapnięcie „Kolejna runda” dolicza tę samą rundę ponownie; w `applyParentStage` `this.stage` już zmienione → stara runda gra pod nowym etapem. | Najpierw zbudować nowy stan, potem zatwierdzić pola. |
| M-2 | `TaskScene` `advance` / `finishRound` / `finishWarmup` | swallowed | medium | Stan „finished” zapisany przed `endRound`; jeśli ten rzuci, kolejne „Dalej” pomija `finishRound` → aktualizacja opanowania/odblokowania/łagodzenia ginie, a po rozgrzewce przychodzi kolejna rozgrzewka. | Zatwierdzać stan po udanym `endRound`; jawna, ponawialna flaga „raz na rundę”. |
| M-3 | `src/core/round.ts` `answer` (gałąź `retype`) | missing-throw | medium | Faza retype nie ma wyjścia (brak stanów porażki — słusznie). Zadanie z odpowiedzią nie do wpisania na keypadzie (ułamek, string, > `maxDigits`) więzi dziecko na zawsze; zero śladu. Skrypt audytora: 24 600 zadań E1–E6 dziś OK, ale to nie test. | Niezmiennik treści w `tests/contentInvariants.test.ts` (odpowiedź keypadu: liczba całkowita ≥ 0, ≤ `maxDigits` cyfr) + asercja w `startRound`. |
| M-5 | `src/core/tasks/generateTask.ts` `generateTask`, `TaskScene.create` `createRng(Date.now() >>> 0)` | missing-context | medium | Komunikat generatora bez `skill.id` i seeda; seed rundy nigdzie nie jest zapisany → błędu nie da się odtworzyć harnessem seedów. | Owinąć z `cause` + `skill.id`; trzymać seed rundy obok build id. |
| L-1 | `src/core/round.ts` `answer`/`next`/`nextSolutionStep` + `TaskScene.submit` | missing-throw | low | Niemożliwe akcje ignorowane cicho; `submit` i tak robi `shake()` — błąd bramkowania widżetu wygląda jak drgnięcie. | Flaga „odrzucone” lub asercja w buildzie dev/e2e. |
| L-2 | `src/core/round/unique.ts` `distinctTasks` | flattened-response | low | Po wyczerpaniu `uniqueRetries` duplikat zostaje (świadomie); kurczenie puli po zmianie treści niewidoczne. | Test minimalnej puli na krok × wagi łagodzenia. |
| L-3 | `TaskScene.sessionStars` vs `registry.stars` | identity-lost | low | Brak niezmiennika licznik = Σ rund; M-1/M-2 mogą je rozjechać. | Jeden właściciel sumy w `core/` (zapis S-11). |

### S-05 Lektor, podsumowanie, pokój

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-6 | `src/ui/dom/settingsPanel.ts` `openSettingsPanel` + `UIScene.openSettings` (nie przekazuje `narrator.available`) | flattened-response | high | Tablet bez polskiego głosu: rodzic widzi „Czytanie automatyczne: Wł.” (domyślnie E1/E2), a nic nie jest czytane; 6-latek, który nie czyta, zostaje bez pomocy. | Przekazać `available`; linia w `pl.ts` („Brak polskiego głosu na tym urządzeniu”). |
| H-3 | `src/ui/narrator.ts` `speakNow` (`utterance.onerror = release`) | swallowed | high | `not-allowed`, `synthesis-failed`, `voice-unavailable` wyglądają jak oczekiwane `interrupted`/`canceled`; głośnik widoczny, tapnięcie nic nie robi, nawet bez wpisu w konsoli. | Ignorować `interrupted`/`canceled`, resztę `console.warn` (+ licznik → narrator niedostępny). |
| H-4 | `src/ui/narrator.ts` `unlock` + `src/main.ts` `unlockSpeech` | missing-throw | high | `unlocked = true` przed `speakNow('')`; odrzucenie (iOS `not-allowed`) i tak zwraca `true`, `main.ts` zdejmuje listenery gestu → auto-czytanie milczy całą sesję. | Uznawać odblokowanie po `onstart`/`onend` pustej wypowiedzi. |
| M-7 | `src/ui/narrator.ts` `safely` | swallowed | medium | Rzucający silnik nieodróżnialny od „brak głosu”, nawet przy zdalnym debugowaniu. | `console.warn` raz na akcję lub `lastError` na narratorze (dla panelu/hooka e2e). |
| M-10 | `src/ui/narrator.ts` polling głosów (`balance.narrator.voiceTimeoutMs`) + `main.ts` `visibilitychange` | coverage-gap | medium | Po 3 s zależność tylko od `voiceschanged` (iOS zawodne); późne głosy = głośnik ukryty całą sesję; po powrocie z tła brak `refresh`. | `refresh()` przy geście i przy `visible`. |
| M-11 | `TaskScene` `autoReadFirst`/`autoReadUnlock` + hook e2e `autoRead` | flattened-response | medium | Hook raportuje *ustawienie*, nie to, czy coś powiedziano; test widzi `autoRead: true` przy ciszy. | „Ostatnio powiedziane / powód pominięcia” w narratorze → hook e2e. |
| L-4 | `src/scenes/RoomScene.ts` / `TaskScene.toRoom` (`scene.switch`) | missing-throw | low | Jeśli Task nie śpi, `switch` cicho robi `start` → reset gwiazdek i rundy; dwa emity w klatce restartują pokój (ważne od S-09). | Lokalna flaga „wychodzę” + sprawdzenie `isSleeping`. |
| L-5 | `tests/narrator.test.ts` | coverage-gap | low | Brak przypadków `onerror` `not-allowed` i rzucającego `speak` — H-3/H-4 niewidoczne także w CI. | Dodać przypadki na fake'ach. |

### S-06 Pierwsze uruchomienie

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-2 | `WelcomeScene.start` → `scene.start(task)` → `TaskScene.create` | coverage-gap | high | Instancja C-1 tuż po tapnięciu wieku: ekran powitalny zamrożony, HUD (i zębatka) jeszcze nie istnieje. | C-1 + guard budowy rundy. |
| M-4 | `src/core/placement.ts` `placeByParent` (`warmupPending: !overridden && …`) + `TaskScene.finishWarmup` | flattened-response | medium | Rodzic, który *potwierdzi* proponowany etap, i tak dostaje rozgrzewkę i może zostać po cichu obniżony; dokumentacja mówi, że wybór rodzica pomija rozgrzewkę. | Pomijać rozgrzewkę po ścieżce rodzica albo jawnie to opisać. |
| M-8 | `TaskScene.finishWarmup` + `settingsPanel` (`stageChoices.show` bez `proposed`) | identity-lost | medium | Obniżenie etapu nie zostawia śladu; rodzic widzi „E2” i nie odróżni „dziecko słabiej” od „zła tabela wiek × miesiąc”. | Trzymać `placedStage` na uczniu (pasuje do zapisu S-11), pokazać „proponowany: E3”. |
| L-6 | `WelcomeScene.choose` (AgeButton) | missing-context | low | `RangeError` w handlerze: `chosen` zostaje `false`, każde tapnięcie rzuca ponownie — przyciski wyglądają dobrze, nic nie robią. | C-1. |
| L-7 | `src/main.ts` miesiąc z `new Date().getMonth()`; `src/testing/e2eHook.ts` `e2eMonth` | config | low | Zły zegar tabletu → inny etap bez śladu; błędny `?e2eMonth` po cichu wraca do dziś (tylko build e2e). | Pokazać założony miesiąc w panelu etapu; w e2e rzucać przy złym parametrze. |

### S-07 Adaptacja

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-7 | `src/core/mastery.ts` `recordRound` + `src/core/curriculum.ts` `unlockReady` + `balance.mastery` | flattened-response | high | +1 za 3 pierwsze próby z rzędu, −1 za każdy błąd → opanowanie dryfuje w dół, gdy p³ < 0,5 (p < ~0,79). Łagodzenie zaczyna się dopiero < 60%. Dziecko 60–79% nigdy nie odblokuje kroku i nikt tego nie widzi (zweryfikowane w kodzie). Także **pytanie projektowe dla opiekuna**. | Pokazać rodzicowi „opanowane k / potrzebne ⌈n/2⌉”; test symulacyjny liczby rund do odblokowania przy p = 0,7–0,8. |
| H-8 | `curriculum.ts` `unlockReady` (`null` = „nie gotowe” / „ostatni krok etapu” / „brak kroków”) | missing-context | high | Po obniżeniu przez rozgrzewkę dziecko stoi na ostatnim kroku niższego etapu; w `src/` nie ma awansu etapu → adaptacja stoi na zawsze, rodzic widzi „Krok M z M”. | Zwracać powód; „etap ukończony” w podglądzie postępów. |
| M-12 | `curriculum.ts` `endRound` (`weakStreak` liczy w trakcie łagodzenia) | missing-context | medium | Łagodzenie może się odnawiać bez końca i spowalnia opanowanie kroku (wzmacnia H-7); niewidoczne w podglądzie i hooku. | „Łagodzenie aktywne (n rund)” w podglądzie; świadoma decyzja o ponownym uzbrajaniu. |
| L-10 | `src/core/round/pick.ts` `pickRoundSkills` | flattened-response | low | Puste kubełki cicho przeliczają wagi (E1: łagodzenie ≈ 29/71; pierwszy krok: łagodzenie bez efektu). | Test efektywnych udziałów łagodzenia per etap. |
| L-11 | `unlockReady`, `progress.ts` `progressView`, fallbacki `?? 1` | identity-lost | low (medium od S-11) | Osierocone id umiejętności po zmianie numeracji kroków; brak `unlockedStep` cicho = krok 1. | Migracja S-11 liczy/loguje nieznane id. |

### S-08 Ustawienia rodzica

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| (C-2) | `UIScene.openSettings` / `applySettings` | swallowed | critical | Patrz C-2 (główna instancja). | — |
| (C-1) | `UIScene.update` → `feed` → `openSettings` | coverage-gap | high | Bramka budowana w kroku RAF: wyjątek przy już wstrzymanym wejściu = zamrożony ekran bez okna. | Odroczyć `openSettings` poza krok (`setTimeout(0)`) + C-1/C-2. |
| H-10 | `src/core/progress.ts` `progressView` + `src/ui/dom/progressView.ts` (`pl.settings.empty`) | flattened-response | high | Ten sam spokojny pusty stan dla: brak rund, brak błędów, reset sesji (przeładowanie/aktualizacja PWA do S-11), świeża zmiana etapu; po resecie „Krok 1” wygląda wiarygodnie. To jedyne okno rodzica. | `kind` widoku (brak danych / brak błędów / sesja od nowa); do S-11 jawna informacja, że postęp znika po zamknięciu aplikacji. |
| M-13 | `TaskScene.applyParentStage` | missing-context | medium | Zmiana etapu w trakcie rundy wyrzuca odpowiedzi tej rundy (bez `endRound`), ale gwiazdki zostają. | Zapisać częściową rundę przez `core/` albo opisać regułę w panelu. |
| L-12 | `UIScene.openSettings` (`if (!stage) closeSettings(); return;` i wczesny `return`) | swallowed | low | Poprawna odpowiedź w bramce, a panel znika; przytrzymanie zębatki nic nie robi — ten sam objaw co C-2, nie do odróżnienia. | Rzucać po zwolnieniu wejścia / `console.warn` w buildzie dev/e2e. |
| L-13 | `src/core/longPress.ts` `longPress` + `UIScene.update` | coverage-gap | low | Inne okno (podpowiedź instalacji) wstrzymuje wejście w trakcie trzymania → podniesienie palca ginie, `tick` może otworzyć bramkę sam po 2 s. Możliwe, nieobserwowane. | Podawać `reset`, gdy suspender jest aktywny. |
| L-14 | `progress.ts` `progressView` (tylko `stage.steps`; historia 200) | missing-context | low | Błędy z poprzedniego etapu (10% + rozgrzewka) nie są pokazywane; umiejętność z opanowaniem 0 znika z listy, gdy jej błędy wypadną z historii. | Nagłówek „tylko ten etap”; ranking po opanowaniu. |

## 6. Zalecana kolejność poprawek

1. **Globalna granica błędów bez sieci** (zamyka C-1, H-1, H-2, L-6 i daje sygnał dla M-1/M-2): `window` `error` +
   `unhandledrejection` w `main.ts` → karta DOM dla dziecka z przyciskiem przeładowania i `__BUILD_ID__`, ukryty
   dla rodzica kod błędu (komunikat, scena, SHA). Ograniczenie: nic nie wychodzi z urządzenia (PRD 55/187).
2. **`finally` dla przełącznika wejścia i okien DOM** (C-2, L-8, L-12): zwolnienie niezależne od wyniku callbacku,
   plus test, w którym callback rzuca.
3. **„Najpierw zbuduj, potem zatwierdź” w `TaskScene`** (M-1, M-2, M-13).
4. **Stan efektywny w panelu rodzica** (H-6, H-10, H-7, H-8, M-8, M-12): głos dostępny/niedostępny, rodzaj pustego
   stanu, postęp do odblokowania, łagodzenie, etap proponowany vs obecny. Wszystko lokalnie, teksty w `pl.ts`.
5. **Lektor zostawia ślad** (H-3, H-4, M-7, M-10, L-5): rozróżnić oczekiwane `interrupted`/`canceled` od reszty.
6. **Diagnostyka post-hoc i wdrożenie** (H-9, M-9, H-5, M-6, L-9): mapy źródeł jako artefakt CI, headless boot smoke,
   auto-rollback — decyzje opiekuna.
7. **Niezmienniki treści/adaptacji w testach** (M-3, M-5, H-7 symulacja, L-2, L-10).

**Propozycja do decyzji opiekuna (nie wdrażać bez zgody):** lokalny bufor ostatnich N błędów (localStorage, a od S-11
IndexedDB obok zapisu), widoczny w panelu rodzica z przyciskiem „Skopiuj”, aby rodzic mógł go *ręcznie* przesłać.
Nic nie jest wysyłane automatycznie; zgodne z zakazem telemetrii, ale to zmiana zakresu PRD (nowa powierzchnia UI).

## 8. Metoda i ograniczenia

- Agenci: 5 audytorów obszarów (S-04…S-08) + 1 audytor infrastruktury, wszyscy tylko do odczytu, na wspólnym
  modelu przechwytywania. Audytor S-04 uruchomił jednorazowy skrypt (poza repo) generujący 24 600 zadań
  (300 seedów × każda grywalna umiejętność E1–E6): wszystkie odpowiadalne.
- Sprawdzone ręcznie: `RequestAnimationFrame.step` (callback przed zaplanowaniem RAF), `UIScene.openSettings`/
  `applySettings`/`closeSettings`, `parentGate.ts` `submit` (`close()` przed `onPass()`), `TaskScene.beginRound`
  (`sessionStars +=` przed `freshRound()`), `inputSuspend.ts` release, `narrator.ts` `speakNow`/`unlock`/`safely`,
  `mastery.ts` `recordRound` + `balance.mastery` (próg dryfu p ≈ 0,794 potwierdzony rachunkiem
  E[⌊G/3⌋] = p³/(1−p³)). Wszystkie się potwierdziły.
- Zdeduplikowano: „generator rzuca w create/onWake/update” to jedna przyczyna (C-1) z wieloma lokalizacjami;
  „okno zamyka się przed callbackiem” to jedna przyczyna (C-2).
- Przegląd całego repo (bez testów): 3 bloki `catch` w `src/` (wszystkie catch-to-default), 0 `console.*` w `src/`,
  104 `throw new` w `src/`, 0 z `cause` (brak przerzucania, więc nic nie ginie — problem w tym, że nic ich nie łapie).
- **Nieudowodnione w czasie działania** (runtime_proof: not-run, z założenia kroku): zamrożenie pętli po wyjątku,
  trwałe wstrzymanie wejścia po wyjątku w callbacku, zachowanie Web Speech na iPadzie/Androidzie (`not-allowed`,
  późne głosy), zachowanie SW przy nieudanym precache, częstość H-7 u prawdziwych dzieci. Prawdopodobieństwo C-1/C-2
  jest dziś niskie (niezmienniki danych są testowane: `tests/contentInvariants.test.ts`, `tests/curriculum.test.ts`);
  waga wynika z kosztu (dziecko utknięte, sesja stracona, zero śladu), nie z częstości.
- Brak harnessu sond; ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>` (statycznie) albo z
  `--runtime` w izolowanym worktree.

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (5 obszarów S-04…S-08), bez pytania; skill zaleca 2–4 — zachowano 5, bo krok je ustalił.
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`); ustalenia oznaczone jako tylko statyczne.
- **Język raportu:** polski (język logu runu i profilu § 1); identyfikatory kodu po angielsku.
- **Waga critical** tylko dla C-1 i C-2 (dziecko utknięte + zero śladu dla wszystkich obserwatorów). Audytor S-05
  oznaczył H-6 jako critical — obniżone do high, bo gra działa dalej, a brak głośnika jest widoczny. Audytor S-08
  oznaczył C-2 jako critical — utrzymane.
- **Telemetria:** żadnego dostawcy; jedyna propozycja (lokalny bufor błędów) oznaczona jako decyzja opiekuna.
- **Co zmieniłoby odpowiedzi:** sonda w czasie działania pokazująca, że Phaser 4 jednak wznawia pętlę po wyjątku
  (obniżyłoby C-1 do high); decyzja opiekuna, że reguła H-7 jest zamierzona (zostałaby tylko luka widoczności).
