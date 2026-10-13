---
change_id: observability-c1-c2
title: Granica błędów, zwalnianie wejścia po wyjątku, stan lektora w ustawieniach i opanowanie bez kary
status: implemented
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

Fix from the 2026-10-13 observability audit (PR #25): C-1 uncaught exception freezes the Phaser loop with no message; C-2 dialog closes before its callback so a throw leaves input suspended; H-6 settings panel claims auto-read On without a Polish voice; plus maintainer decision H-7: a first-try miss resets the streak and no longer subtracts a mastery point.

Zmiana spoza roadmapy (autonomiczny run `2026-10-13-fix-observability`, gałąź `feat/observability-c1-c2` cięta z `main`
@ `a34aeee`). Brak bloku roadmapy — nie edytujemy statusów w `context/foundation/roadmap.md`. Źródła: audyt
`context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md` (C-1, C-2, H-6, H-7 oraz
pokrewne L-8, L-12, H-1, H-2, L-6), kontrakt runu `context/runs/2026-10-13-fix-observability/agent-contract.md`
(„Slice-specific rules”: decyzja opiekuna o H-7, zakaz telemetrii, handler na krawędzi, `try/finally` dla przełącznika
wejścia, wyzwalacz błędu tylko w buildzie e2e), PRD (`context/foundation/prd.md`: Ograniczenia „żadnych żądań do
internetu w trakcie gry, brak telemetrii”, NFR Prywatność, FR-009, FR-013, FR-014, Business rule „nie da się przegrać ani
niczego stracić”, Open question 7 o lektorze), archiwa `context/archive/2026-10-13-parent-settings-progress/` i
`context/archive/2026-10-13-adaptive-curriculum/` (wzorzec). Plik `lessons.md` w `context/foundation/` nie istnieje.

## Audit claims vs repo now

Stan sprawdzony na `feat/observability-c1-c2` @ `a34aeee` (audyt pisany na `cdeff4a`; między nimi tylko PR #25 i #26,
same dokumenty).

| Audit claim (plan-time) | Repo now | Correction |
|---|---|---|
| C-1: brak `window` `error`/`unhandledrejection` w `src/` | Potwierdzone: grep `addEventListener('error'`, `unhandledrejection`, `onerror` w `src/` → tylko `utterance.onerror` w `src/ui/narrator.ts` `speakNow`. `src/main.ts` nie ma handlera. | Bez korekty. Handler na krawędzi: `src/main.ts` + nowa karta DOM w `src/ui/dom/` (ESLint: `core/` bez globali przeglądarki). |
| C-1: `RequestAnimationFrame.step` woła callback przed zaplanowaniem kolejnej klatki | Potwierdzone w `node_modules/phaser/src/dom/RequestAnimationFrame.js` `step`: `_this.callback(time)` potem `requestAnimationFrame(step)` — wyjątek przerywa łańcuch. | Bez korekty. Nie próbujemy wskrzeszać pętli (stan sceny po wyjątku jest niepewny) — karta z ponownym uruchomieniem (decyzja 1). |
| C-1: przykłady `TaskScene.create` → `freshRound`, `TaskScene.onWake` → `applyParentStage`, `UIScene.update` → `openSettings` | Symbole istnieją: `TaskScene.applyParentStage`, `onWake` w `TaskScene.create`, `UIScene.update` → `feed` → `openSettings`. | Bez korekty. H-1/H-2/L-6 (instancje C-1) zamyka ta sama granica; osobny guard budowy rundy — poza zakresem (decyzja 5). |
| C-2: `parentGate.ts` `submit` zamyka okno przed `onPass()` | Potwierdzone: `handle.close(); onPass();` w `openParentGate` `submit`; tak samo `cancel` → `onCancel()`. | Bez korekty. |
| C-2: `stagePanel.ts` (confirm), `settingsPanel.ts` (confirm) zamykają przed callbackiem | Potwierdzone: `openStagePanel` → `handle.close(); onConfirm(placeByParent(…))` — **`placeByParent` liczony po zamknięciu, w tym samym wyrażeniu**; `openSettingsPanel` → `handle.close(); onConfirm({…})`. | Bez korekty; dochodzi `placeByParent` jako możliwe źródło wyjątku w samym panelu. |
| C-2: `UIScene.openSettings`/`applySettings` zwalniają wejście tylko na ścieżce sukcesu | Potwierdzone: `onPass` woła `getStage`, `progressView`, `openSettingsPanel` bez `finally`; `applySettings` woła `changeStageByParent` **przed** `closeSettings()` — wyjątek zostawia `releaseInput` ustawione, a `openSettings` ma guard `this.releaseInput` → zębatka martwa. Po zwolnieniu `game.events.emit(GAME_EVENTS.parentStage)` → `TaskScene.applyParentStage` synchronicznie (wyjątek tam już po zwolnieniu wejścia → przypadek C-1). | Bez korekty. |
| C-2: `WelcomeScene.start` | Potwierdzone: `startLearning(…)` liczony przed `resumeInput()`; wyjątek → `closeDialog` = undefined dopiero po nim, `releaseInput` zostaje, „Rodzic” i wiek martwe. `openParent` rzutuje rejestr bez guardu (follow-up S-08 F6). | Bez korekty. |
| C-2/L-8: `createInputSuspender` zwalnia `enabled` po `onRelease` | Potwierdzone w `src/core/inputSuspend.ts`: `onRelease?.(); target.enabled = true;` — rzut z `onRelease` (reset wskaźników z `main.ts`) zostawia `enabled = false` przy `count = 0`. | L-8 wchodzi do zakresu (ta sama funkcja, kontrakt: „release must happen even when the callback throws”), z zachowaniem resetu wskaźników (fix S-08 F1). |
| H-6: `openSettingsPanel` nie dostaje `narrator.available`; `UIScene.openSettings` go nie przekazuje | Potwierdzone: `SettingsPanelOptions` ma `stage`, `autoRead`, `autoReadDefault`, `progress`, callbacki — bez dostępności głosu; `refresh` ustawia `aria-pressed` z `chosenReading ?? autoReadDefault(stage)`. `Narrator.available` i `onAvailability` istnieją (`src/ui/narrator.ts`), `UIScene` ma `this.narrator`. Teksty: `pl.settings.autoReadHeading/On/Off` — brak linii o braku głosu. | Bez korekty; nowa linia w `pl.ts` (teacher read) i DESIGN-GAP (kit nie ma ustawień ani stanu „brak głosu”). |
| H-7: `recordRound` odejmuje `rules.loss` przy błędzie w pierwszej próbie; `balance.mastery.loss = 1` | Potwierdzone: gałąź `else` w `src/core/mastery.ts` `recordRound` → `Math.max(0, mastery − rules.loss)`, `streak = 0`; `balance.mastery` `{ …, loss: 1, … }` z komentarzem „a miss = -1”. `MasteryRules.loss` używany także w `tests/mastery.test.ts` i `tests/curriculumEnd.test.ts` (stała `MASTERY`). E2E: żaden spec nie czyta opanowania (grep `mastery` w `tests/e2e/` pusty). | Decyzja opiekuna: błąd → seria 0, opanowanie bez zmian (decyzja 4). Audyt traktował H-7 jako lukę widoczności — jej część „pokazać rodzicowi k / ⌈n/2⌉” zostaje poza zakresem. |
| Audyt: „0 wywołań `console.*` w `src/`” | Potwierdzone (bez zmian od `cdeff4a`). | Konsola jest dozwolona (kontrakt); granica błędów loguje `console.error`. |

## Design binding

Źródło prawdy (profil § 6): `Martynka-urzadza.md`, `docs/ZADANIA.md`, `designs/martynka-maths-A-v1/style-guide.md`,
`screenshots/`, `preview.html`; teksty w `src/data/pl.ts`; wspólne komponenty `src/ui/dom/` (`openDialog`, `createButton`,
`createText`, style `.parent-dialog`) i `src/ui/widgets/`.

- **Widoki kitu wiązane przez tę zmianę:** brak. Kit nie ma ekranu błędu/awarii (`screenshots/` ma tylko zadanie,
  podpowiedzi, podsumowanie, odblokowanie, powitanie, przegląd) ani stanu „brak głosu”, a ekran ustawień jest już
  DESIGN-GAP 26 (S-08). Dwa nowe wiersze w `docs/design-gaps.md` (po 28): (a) karta błędu dla dziecka z przyciskiem
  ponownego uruchomienia i małym `__BUILD_ID__` — zbudowana z części dialogów S-06, nic nowego w stylu poza tym, czego
  wymaga pełnoekranowa nakładka; (b) linia „brak polskiego głosu” w sekcji czytania panelu ustawień. **Nie wymyślamy**
  ilustracji ani nowego wzoru wizualnego.
- **Klucze tekstów (`src/data/pl.ts`, każdy nowy z teacher read):** nowa grupa dla karty błędu (tytuł spokojny,
  bez „błąd”/„awaria”; jedno zdanie; przycisk ponownego uruchomienia; etykieta wersji dla rodzica), jedna linia
  `pl.settings` o braku polskiego głosu. Istniejące `pl.settings.autoReadHeading/On/Off` bez zmian. Brzmienie decyduje
  plan; kierunek z audytu („Ups! Dotknij, aby zacząć od nowa”, „Brak polskiego głosu na tym urządzeniu”).

## Migration

Brak migracji (profil § 4: brak bazy; format zapisu dopiero S-11). Zmiana `MasteryRules` (usunięcie `loss`) dotyczy
tylko reguły w pamięci sesji — nic nie jest zapisywane.

## H-7 jest zmianą reguły produktu — zdania do aktualizacji w planie

| Plik | Zdanie dziś | Kierunek |
|---|---|---|
| `context/foundation/prd.md` FR-013 | „(seria poprawnych podnosi, błąd obniża)” i „(start: 60/30/10, 3 z rzędu +1, błąd −1)” | „błąd zeruje serię”; „3 z rzędu +1, błąd zeruje serię (bez odejmowania)”. Edycja istniejącego pliku foundation wymuszona kontraktem — w fazie planu, opisana w commicie. |
| `docs/ZADANIA.md` § 1 „Adaptacja trudności” | „3 poprawne z rzędu → +1; błąd → −1 (długość serii i wartości zmian w `balance.ts`).” | „3 poprawne z rzędu → +1; błąd zeruje serię, opanowanie nie spada …” |
| `src/data/balance.ts` `mastery` (komentarz + pole `loss`) | „3 correct in a row = +1, a miss = -1” | komentarz i pole zgodnie z decyzją 4 |
| `src/core/mastery.ts` `recordRound`, `MasteryRules` | gałąź błędu odejmuje `rules.loss` | błąd: `streak = 0`, opanowanie bez zmian |
| `tests/mastery.test.ts` (nagłówek „a miss on the first try = -1”, testy „lowers mastery by one and resets the streak after a second-try answer”, „lowers mastery after a retype as well”), `tests/curriculumEnd.test.ts` (stała `MASTERY` z `loss: 1`) | zakładają −1 | odwrócone asercje: opanowanie bez zmian, seria 0 |
| `Martynka-urzadza.md` (§ 6 „druga próba … nie liczy się do opanowania”, § 11 M3) | brak zdania o −1 | bez zmian (sprawdzone grepem) |
| `context/foundation/test-plan.md` | brak zdania o −1 ani ryzyka adaptacji z tą regułą | bez zmian; ewentualne nowe ryzyko jako follow-up |
| `CLAUDE.md`, `AGENTS.md` | „mastery 0–5 from the first try” — bez −1 | bez zmian |
| Archiwa (`context/archive/2026-10-13-adaptive-curriculum/*`) | opisują −1 historycznie | nie edytujemy historii |

## Triggered follow-ups

Przeszukane: `context/archive/*/follow-ups/review-fixes.md` pod kątem przełącznika wejścia, nakładek, lektora,
opanowania i plików, które ta zmiana dotknie.

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| (F6) `WelcomeScene.openParent` rzutuje `registry.get(REGISTRY_KEYS.inputSuspender)` bez guardu `undefined`, który ma `UIScene.openSettings`. `Trigger: the next change to WelcomeScene or UIScene` | `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md` | **W zakresie** — C-2 i tak zmienia `WelcomeScene.openParent`/`start` i `UIScene`; jeden styl przy okazji. |
| (F5) Stan długiego przytrzymania wraca do spoczynku tylko w `UIScene.openSettings`; obca nakładka wstrzymująca wejście nad HUD zostawia przytrzymanie uzbrojone. `Trigger: any new overlay that calls suspend() while the HUD exists` | jw. | **Poza zakresem**, choć wyzwalacz formalnie pasuje, jeśli karta błędu wstrzyma wejście (decyzja 2): karta jest końcowa (jedyne wyjście to przeładowanie), więc uzbrojone przytrzymanie nie ma skutku. Wraca przy pierwszej nakładce, po której gra toczy się dalej. |
| (F4) `mountInstallHint` zostawia listener `beforeinstallprompt` z `preventDefault()`. `Trigger: the next change to src/pwa` | jw. | **Poza zakresem** — zmiana nie dotyka `src/pwa/` (handler w `main.ts` + `src/ui/dom/`). Jeśli plan jednak dotknie `src/pwa/`, wchodzi tanio. |
| `mountInstallHint` przepuszcza stuknięcie do rundy. `Trigger: the next change to src/ui/dom or src/pwa` | `context/archive/2026-10-13-first-launch-placement/follow-ups/review-fixes.md` | **Już zamknięte** przez S-08: `main.ts` podaje `mountInstallHint` funkcję `suspender.suspend()`. Do odnotowania jako zamknięte w research. |
| (F6 S-06) `openDialog` `handleKey` bez `stopPropagation`. `Trigger: first Phaser keyboard input in src` | jw. | **Poza zakresem** — brak klawiatury Phasera. |
| e2e hook: w pokoju `targets.nextRound`/`targets.toRoom` raportują przyciski uśpionego podsumowania; raportować `null` przy `screen === 'room'`. `Trigger: the next change to src/testing/e2eHook.ts` | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` | **Warunkowo w zakresie**: jeśli wyzwalacz błędu dla e2e (decyzja 3) trafi do `src/testing/e2eHook.ts` (jak `e2eMonth`), poprawka wchodzi w tej samej fazie (mała, read-only). |
| `Narrator.unlock` mówi pustą wypowiedź (WebKit może zignorować). `Trigger: iPad listening test (plan row 10.9)` | jw. | **Poza zakresem** — wyzwalacz to test na iPadzie; pokrewne H-4 też poza zakresem (decyzja 5). |
| `SpeakerButton`/`RoomSwitchButton` — wspólny przycisk HUD. `Trigger: S-09 or the next change to a HUD button` | jw. | **Poza zakresem** — H-6 zmienia panel DOM, nie przycisk głośnika. |
| Ryzyko lektora do test-planu. `Trigger: /10x-test-plan refresh` | jw. | **Poza zakresem** (właściciel: `/10x-test-plan refresh`). Ta zmiana zaproponuje własne ryzyko (granica błędów / zablokowane wejście) jako follow-up. |
| Kalibracja `unlockAt`, `unlockShare`, łagodzenie. `Trigger: S-17` | `context/archive/2026-10-13-adaptive-curriculum/follow-ups/review-fixes.md` | **Poza zakresem**, ale H-7 zmienia dynamikę, którą S-17 będzie stroić — odnotować w follow-upach tej zmiany. |
| `firstPlayableSteps`/`playableSteps` — jedno źródło. `Trigger: next change to pick.ts or curriculum.ts` | jw. | **Poza zakresem** — H-7 zmienia `mastery.ts`, nie `pick.ts`/`curriculum.ts`. |
| (F7) `pl.settings.empty` także dla dziecka bez błędów. `Trigger: S-11, or a parent's feedback on the preview` | `context/archive/2026-10-13-parent-settings-progress/follow-ups/review-fixes.md` | **Poza zakresem** (audyt H-10). Uwaga: bez −1 dziecko z błędami nadal ma przykłady błędów w historii, więc podgląd „najsłabszych” nadal działa — research sprawdza ranking `progressView` po zmianie H-7. |

## Autonomous decisions

1. **C-1: jedna granica błędów na krawędzi — `window` `error` + `unhandledrejection` w `src/main.ts`, karta DOM z
   `src/ui/dom/` z ponownym uruchomieniem (`location.reload()`); żadnej sieci.**
   - Karta pokazuje się raz (idempotentnie) na **każdy** nieprzechwycony wyjątek, także z listenera DOM, w którym pętla
     Phasera żyje dalej — stan po przerwanym w połowie handlerze jest niepewny (audyt M-1/M-2), a spokojny restart jest
     lepszy niż żywy ekran z rozjechanym stanem. Dziecko widzi spokojne zdanie i przycisk; mały `__BUILD_ID__` dla
     rodzica; bez stosu. `console.error` z oryginalnym błędem zostaje (konsola dozwolona).
   - Odrzucone: (a) wznawianie pętli Phasera (`game.loop` restart) — scena po wyjątku w `create`/`wake` jest w połowie
     zbudowana; (b) `try/catch` w każdej scenie — rozproszone i łatwe do pominięcia; (c) lokalny bufor błędów z
     „Skopiuj” — audyt sam oznacza go jako zmianę zakresu PRD do decyzji opiekuna; (d) karta tylko dla błędów z kroku
     RAF — nie da się tego wiarygodnie rozpoznać w handlerze `error`.
   - Co zmieniłoby odpowiedź: research znajdzie łagodne zdarzenia `error` w docelowych przeglądarkach (np.
     „ResizeObserver loop …”, błędy rozszerzeń, `error` zasobu bez `ErrorEvent.error`) — wtedy filtr w czystej funkcji
     (testowalnej) decyduje, co pokazuje kartę; zapis S-11 — wtedy przycisk może obiecać powrót do postępu.
2. **C-2 + L-8: zwolnienie przełącznika wejścia nie zależy od wyniku callbacku.**
   - `createInputSuspender`: `target.enabled = true` w `finally` wokół `onRelease` (reset wskaźników zostaje — fix
     S-08 F1). Czysty test w `tests/` najpierw (rzucający `onRelease` → `enabled` wraca).
   - Właściciele blokady (`UIScene.openSettings`/`applySettings`, `WelcomeScene.openParent`/`start`) zwalniają w
     `try/finally` i **przepuszczają wyjątek dalej**, żeby zobaczyła go granica z decyzji 1 (połknięcie = dokładnie
     ten wzorzec, który audyt krytykuje). Okna DOM mogą nadal zamykać się przed callbackiem — liczy się, że blokada
     wraca. Karta błędu sama wstrzymuje wejście gry (nakładka DOM nie zatrzymuje dotyku Phasera — S-06) i nigdy go
     nie zwalnia (końcowa).
   - Odrzucone: zamykanie okna dopiero po udanym callbacku — zostawia dziecku/rodzicowi okno, które „nie działa”, i
     nie rozwiązuje blokady; łapanie i ciche ignorowanie — zakazane przez kontrakt.
   - Co zmieniłoby odpowiedź: research pokaże, że wszystkie ścieżki da się owinąć w jednym miejscu (np. helper
     „trzymaj wejście na czas okna” w `src/ui/dom/`) — wtedy jeden helper zamiast `finally` w każdej scenie.
3. **E2E: wyzwalacz błędu tylko w buildzie e2e (flaga zapytania czytana jak `?e2eMonth`, pod `__E2E_HOOK__`),
   nieobecny w `dist/` — dowód: strażnik buildu (`vite/e2eHookGuard.mjs`) + grep po `dist/`.** Spec sprawdza: po
   wymuszonym wyjątku widać kartę, przycisk przeładowuje; po wyjątku w callbacku okna rodzica dotyk znów działa (lub
   widać kartę). Nigdy `page.clock`. Odrzucone: wyjątek wstrzyknięty przez `page.evaluate` w obiekty gry — test
   zależny od wnętrza sceny. Co zmieniłoby odpowiedź: research pokaże, że `page.evaluate(() => { throw … })` z
   `setTimeout` wystarcza dla `error` bez żadnego kodu w buildzie — wtedy bez flagi dla C-1 (flaga zostaje tylko dla
   C-2, jeśli potrzebna).
4. **H-7: usuwam regułę odejmowania — `MasteryRules.loss` i `balance.mastery.loss` znikają; błąd w pierwszej próbie
   zeruje serię, opanowanie bez zmian.**
   - Dlaczego usunięcie zamiast `loss: 0`: opiekun zdecydował o regule, nie o strojeniu; pokrętło na 0 zaprasza do
     ponownego włączenia kary, która według audytu (dryf w dół przy p < ~0,79) blokuje odblokowanie kroków dziecku
     z trafnością 60–79 %. PRD FR-013 mówi, że „wartości zmian są liczbami w danych balansu” — `gain` i
     `streakForGain` zostają w danych, więc zdanie FR-013 zmieniamy tylko w części o błędzie.
   - Dodatkowo: test własności „opanowanie nigdy nie maleje” w `tests/mastery.test.ts`. Symulacja liczby rund do
     odblokowania przy p = 0,7–0,8 i widok „opanowane k / potrzebne ⌈n/2⌉” dla rodzica — poza zakresem (S-17 / H-7
     widoczność).
   - Odrzucone: `loss: 0` w danych (martwe pokrętło); kara tylko po rozwiązaniu (retype) — opiekun nie rozróżnił.
   - Co zmieniłoby odpowiedź: opiekun zechce strojonej kary w S-17 — wtedy pole wraca z wartością domyślną 0.
5. **Zakres: C-1, C-2 (+ L-8, F6), H-6, H-7. Poza zakresem:** guard budowy rundy (H-1/H-2 — granica je łapie),
   „najpierw zbuduj, potem zatwierdź” w `TaskScene` (M-1, M-2, M-13), ślad lektora (H-3, H-4, M-7, M-10, L-5), widoki
   rodzica (H-8, H-10, M-8, M-12), wdrożenie i mapy źródeł (H-9, M-9, H-5, M-6, L-9), L-12 (cichy `return` w
   `openSettings` — po decyzji 2 ten sam objaw znika, bo wejście wraca). Zostają w audycie; plan dopisze follow-upy
   z `Trigger:` dla tych, które ta zmiana przybliża.
   - Co zmieniłoby odpowiedź: research pokaże, że M-1 (`sessionStars +=` przed `freshRound()`) po decyzji 1 dalej
     może się objawić (np. wyjątek w handlerze przycisku bez karty) — wtedy wchodzi jako mała faza.
6. **H-6: panel dostaje `available` (i subskrypcję `onAvailability`, jeśli głos dojdzie przy otwartym panelu —
   rozstrzyga research), pod przełącznikiem czytania pokazuje linię o braku polskiego głosu; przełącznik zostaje
   aktywny** (rodzic może ustawić wybór na później, głos może dojść — `voiceschanged`). Odrzucone: ukrycie/wyłączenie
   przełącznika — gubi wybór rodzica, a PRD FR-009 robi z czytania ustawienie rodzica niezależne od urządzenia. Co
   zmieniłoby odpowiedź: kit dostanie wzór stanu „niedostępne”.
7. **Następny krok: `/10x-research`, nie `/10x-plan`** — trzeba ustalić łagodne zdarzenia `error`, czy vitest ma DOM
   (dziś brak `jsdom`/`happy-dom` w `package.json` → testy DOM tylko przez e2e) i jak wyzwolić wyjątek w buildzie e2e.
