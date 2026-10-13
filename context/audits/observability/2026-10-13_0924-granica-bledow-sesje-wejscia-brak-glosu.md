---
type: observability-audit
date: 2026-10-13 09:24
mode: audit
commit: 298c74d
branch: docs/observability-audit-2026-10-13-fix-observability
dirty_tree: false
areas: [error-boundary-restart-card, dialog-input-sessions, no-polish-voice-line]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_0659-runda-lektor-start-adaptacja-ustawienia.md
findings: { critical: 0, high: 2, medium: 3, low: 5 }
---

# Audyt obserwowalności — granica błędów, sesje wejścia, brak polskiego głosu (2026-10-13)

Zamknięcie runu `2026-10-13-fix-observability` (fix `observability-c1-c2`, PR #27, merge `298c74d`). Audyt
statyczny (bez `--runtime`), audyt uzupełniający do raportu z 06:59. Obszar z argumentów kroku: „granica błędów i
oddawanie dotyku po awarii: karta „Ups! Gra się zatrzymała.”, sesje wejścia w oknach dialogowych, linia o braku
polskiego głosu”.

## 1. TL;DR

- **C-1 i C-2 zamknięte.** Jest jedna granica błędów na krawędzi (`src/ui/dom/errorBoundary.ts`
  `installErrorBoundary`: `window` `error` + `unhandledrejection`), decyzja „fatalne czy szum” w czystym
  `src/core/errorSignal.ts` `isFatalSignal`, spokojna karta DOM (`src/ui/dom/errorCard.ts` `mountErrorCard`) i
  usypianie pętli. Okna rodzica uruchamiają callbacki w `openInputSession(...).run`, które zwalnia przełącznik przy
  wyjątku; `createInputSuspender` przywraca wejście w `finally` (L-8).
- **Karta jest dla dziecka, nie dla opiekuna.** Jedynym śladem awarii nadal jest `console.error` w zmanglowanym
  bundlu bez map źródeł; karta pokazuje tylko `Wersja <sha>`, bez kodu błędu, który rodzic mógłby przekazać (N-4).
- **Granica powstaje dopiero w ciele `main.ts`.** Wyjątek przy ewaluacji modułów lub w `createNarrator` (przed
  `installErrorBoundary`) nadal daje pusty ekran bez karty (N-1).
- **Lektor bez zmian:** H-3 (`speakNow` `onerror = release`) i H-4 (`unlock` zwraca `true` przed potwierdzeniem)
  nadal otwarte; `src/ui/narrator.ts` nie zmienił się od `cdeff4a`.
- **H-6 zamknięte** (linia `pl.settings.noVoice` sterowana `narrator.onAvailability`); **H-7 częściowo** (reguła
  zmieniona decyzją opiekuna, ale rodzic dalej nie widzi postępu do odblokowania; H-8 otwarte).
- 0 ustaleń CRITICAL.

## 2. Model przechwytywania (zmiany względem raportu 06:59)

- **Platforma i tracker:** bez zmian — klient-only offline PWA, brak trackera i sieci z założenia (PRD).
- **Granica (nowa):** `src/main.ts` woła `installErrorBoundary(window, onFatal)` *przed* `createGame`, ale *po*
  ewaluacji wszystkich importów i po `createNarrator`. Słuchacze w fazie bąbelkowania (błędy ładowania zasobów nie
  bąbelkują, więc się nie liczą).
- **Klasyfikacja:** `isFatalSignal` — nie-fatalne: `foreign` (`event.filename` spoza `location.origin`, np.
  rozszerzenia), `error` bez obiektu błędu z komunikatem pustym / `Script error.` / `ResizeObserver loop…`,
  odrzucenia o nazwie `AbortError` lub `NotAllowedError`. Nie-fatalne → `console.warn('Ignored browser noise:')`;
  fatalne → `console.error(original)` + `onFatal`.
- **`onFatal` (`main.ts`):** trzy kroki, każdy w osobnym `attempt` (try/catch → `console.error`):
  `mountErrorCard(document.body, __BUILD_ID__, reload)`, `suspend()` bez zwolnienia (karta jest ostateczna),
  `game.loop.sleep()`. Flaga `handling` chroni przed ponownym wejściem. Restart = `window.location.reload()`.
- **Karta:** `role="alertdialog"`, `z-index: 18` (`.overlay-error` w `src/style.css`) — nad oknami rodzica,
  pod nakładką „Obróć tablet”; idempotentna (`mounted?.isConnected`).
- **Sesje wejścia:** `src/core/inputSuspend.ts` `openInputSession` (`run` kończy sesję przy wyjątku i rzuca dalej
  do granicy; `end` co najwyżej raz). Używają go `UIScene.openSettings` i `WelcomeScene` (start rodzica); test AST
  `tests/dialogSessions.test.ts` sprawdza, że 8 callbacków siedzi w `session.run`.
- **Wyzwalacze testowe:** `?e2eFail=step|boot|settings` (`src/testing/e2eHook.ts` `e2eFail`, rejestr
  `REGISTRY_KEYS.forcedFailure`) tylko za `__E2E_HOOK__`; `vite/e2eHookGuard.mjs` pilnuje, by znaczniki nie trafiły do
  `dist/`.
- **Logowanie:** 4 wywołania `console.*` w `src/` (wszystkie w granicy i `onFatal`), 107 `throw new`, 5 bloków
  `catch` (granica ×2, `narrator.ts` `safely`, SW, podpowiedź instalacji).
- **Tożsamość wdrożenia:** bez zmian (`__BUILD_ID__`, brak map źródeł — M-9 otwarte); teraz widoczna także na karcie.

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Opiekun | Werdykt |
|---|---|---|---|---|
| Wyjątek w kroku gry (create/update/tween/wake) | karta „Ups! Gra się zatrzymała.” + „Zacznij od nowa” | karta z `Wersja <sha>` | `console.error`, zmanglowany stos | caught (child), poor (maintainer) — e2e `error-boundary.spec.ts` #15 „exception in a frame” |
| Wyjątek przy starcie (`BootScene.create`) | karta | karta | `console.error` | caught — e2e #15 „fails while the game boots” |
| Wyjątek w callbacku okna rodzica | karta; sesja zwolniona | karta | `console.error` | caught — e2e #15 „parent settings callback” + `tests/dialogSessions.test.ts` |
| Wyjątek przy ewaluacji modułów / w `createNarrator` | pusty ekran | nic | 1 linia w konsoli | missed (N-1) |
| Szum przeglądarki (`ResizeObserver`, obcy skrypt) | nic (słusznie) | nic | `console.warn` | ignored by design — e2e #15 „browser noise” |
| Odrzucenie `NotAllowedError`/`AbortError` z kodu gry | gra działa, akcja nie zadziałała | nic | `console.warn` jako „szum” | missed (N-2) |
| Brak polskiego głosu | brak lektora | linia `noVoice` w panelu | — | caught — e2e `parent-settings.spec.ts` (H-6) |
| Błąd syntezy (`not-allowed`, `synthesis-failed`) | cisza | „Włączone”, brak linii (głos jest) | nic | missed (H-3, H-4) |

## 4. Systemowe przyczyny źródłowe

1. **Granica zakłada, że kod startowy nie rzuca.** Instalacja w ciele modułu wejściowego jest naturalna, ale
   wszystko, co wykonuje się wcześniej (importy, `createNarrator`), leży poza nią. Wyjaśnia N-1.
2. **Sygnał kończy się na ekranie i w konsoli.** Brak trackera jest decyzją PRD; karta słusznie nie pokazuje stosu
   dziecku — ale nie zostawia też niczego, co rodzic mógłby przekazać (kod, scena), a konsola nie ma map źródeł.
   Wyjaśnia N-4 (oraz otwarte M-9, H-9).
3. **„Cicho z założenia” w lektorze** — bez zmian od 06:59. Wyjaśnia H-3, H-4 (oraz M-7, M-10, L-5).
4. **Lista szumu po nazwie, nie po źródle.** `QUIET_REJECTIONS` rozpoznaje szum po `name`, więc prawdziwy błąd gry
   o tej nazwie zostanie potraktowany jak szum. Wyjaśnia N-2.

## 5. Ustalenia według obszaru

Lokalizacje jako plik + SYMBOL.

### Granica błędów i karta

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-1 | `src/main.ts` (kolejność: importy → `createNarrator` → `installErrorBoundary`) | coverage-gap | medium | Wyjątek przy ewaluacji modułu (dane etapów, `pl.ts`, Phaser) albo w `createNarrator` = pusty ekran bez karty, jak przed fixem. Prawdopodobieństwo niskie (dane sprawdza CI: `tests/contentInvariants.test.ts`, `npm run sample`), koszt jak dawne C-1. | Mały moduł granicy importowany jako pierwszy (side-effect import na początku `main.ts`) albo `createNarrator` przeniesione za `installErrorBoundary`; e2e: wymuszony wyjątek przed `createGame`. |
| N-2 | `src/core/errorSignal.ts` `QUIET_REJECTIONS`, `isFatalSignal` | swallowed | low | Odrzucenie z kodu gry o nazwie `AbortError`/`NotAllowedError` (np. przyszłe `audio.play()` w M7, `navigator.share`) jest logowane jako szum: akcja nie działa, karty nie ma, w konsoli „Ignored browser noise”. Dziś żaden kod gry nie tworzy takich obietnic. | Zostawić listę, ale wymagać obsługi takich obietnic lokalnie (lint/regula w przeglądzie) albo logować je pod osobnym prefiksem. |
| N-3 | `src/main.ts` `onFatal` (brak `narrator.cancel()`) | coverage-gap | low | Kolejka lektora (auto-czytanie E1/E2) może mówić dalej nad kartą — dziecko słyszy polecenie zadania, którego nie widzi. | Dodać `attempt(() => narrator.cancel())` w `onFatal`. |
| N-4 | `src/ui/dom/errorCard.ts` `mountErrorCard` + `src/main.ts` `onFatal` | missing-context | medium | Karta pokazuje tylko `Wersja <sha>`; komunikat, scena i nazwa błędu idą wyłącznie do `console.error` (zmanglowany stos, brak map — M-9). Rodzic, który zgłosi „gra się zatrzymała”, nie ma czego przekazać; opiekun nie odtworzy błędu. Rekomendacja z 06:59 („ukryty dla rodzica kod błędu”) nie została wdrożona. | Krótki kod na karcie (np. `name` + skrót komunikatu + klucz sceny), bez stosu; lokalny bufor błędów to nadal **decyzja opiekuna**, nie dostawca. |
| N-6 | `src/main.ts` restart `window.location.reload()` + `scripts/check-deploy.ts` `main` | coverage-gap | low | Błąd deterministyczny w zbuforowanym buildzie daje kartę przy każdym uruchomieniu aż do kolejnego wdrożenia; smoke po wdrożeniu nadal nie uruchamia JS (H-9), więc taki build nie zostanie wykryty po stronie serwera. | Headless boot smoke (H-9) — decyzja opiekuna. |

### Sesje wejścia w oknach dialogowych

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-5 | `src/ui/dom/stagePanel.ts` `openStagePanel` (confirm: `handle.close()` → `placeByParent` → `onConfirm`), `src/ui/dom/parentGate.ts` `submit` | swallowed | low | Kod okna przed wywołaniem callbacku (np. `placeByParent`) jest poza `session.run`; po wyjątku sesja zostaje otwarta. Objaw dla dziecka zakrywa karta (wyjątek z listenera DOM zawsze dociera do granicy), więc dotyk nie jest „martwy” — ale poprawność zależy teraz od karty, nie od sesji. `tests/dialogSessions.test.ts` sprawdza tylko callbacki scen. | Wywołać `placeByParent` w scenie (wewnątrz `session.run`) albo opisać w komentarzu, że granica jest tu siatką bezpieczeństwa. |
| L-12 | `src/scenes/UIScene.ts` `openSettings` (`if (!stage) { this.closeSettings(); return; }`) | swallowed | low | Bez zmian: poprawna odpowiedź w bramce, panel się nie otwiera, zero śladu. | Jak w raporcie 06:59. |

### Linia o braku polskiego głosu i lektor

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-3 | `src/ui/narrator.ts` `speakNow` (`utterance.onerror = release`) | swallowed | high | Bez zmian. Dodatkowo linia `noVoice` mówi „głos jest”, gdy głos jest na liście, ale synteza zawodzi — panel rodzica nadal nie odróżnia „głos jest” od „głos działa”. | Rozróżnić `interrupted`/`canceled` od reszty; po N porażkach narrator niedostępny → linia się pokaże. |
| H-4 | `src/ui/narrator.ts` `unlock` + `src/main.ts` `unlockSpeech` | missing-throw | high | Bez zmian. | Jak w raporcie 06:59. |
| H-7r | `src/core/mastery.ts` `recordRound` (reguła zmieniona) + `src/core/progress.ts` `progressView` | flattened-response | medium | Reguła „błąd zeruje serię, nie odejmuje punktu” usuwa dryf w dół (model z researchu runu: rundy do odblokowania przy 60/70/80 % ≈ 19/14/11 zamiast 335/61/20). Rodzic nadal nie widzi „opanowane k / potrzebne ⌈n/2⌉”; „etap ukończony” (H-8) nadal zlewa się z „nie gotowe”. | Pokazać postęp do odblokowania w podglądzie (H-7/H-8 razem). |

## 6. Zalecana kolejność poprawek

1. **N-1** — przenieść instalację granicy na sam początek (osobny moduł importowany jako pierwszy) i
   `createNarrator` za nią; jeden e2e. Mały koszt, zamyka ostatnią ścieżkę „pusty ekran bez śladu”.
2. **N-4 + M-9** — krótki kod błędu na karcie i mapy źródeł jako artefakt CI per SHA (niepublikowany): rodzic ma co
   przekazać, opiekun ma czym to odczytać. Bez sieci; lokalny bufor błędów = decyzja opiekuna.
3. **H-3, H-4 (+ M-7, M-10, L-5)** — lektor zostawia ślad; dopiero wtedy linia `noVoice` mówi prawdę także o
   niedziałającej syntezie.
4. **H-7r + H-8** — postęp do odblokowania i „etap ukończony” w podglądzie postępów.
5. **N-3, N-5, N-2, N-6** — drobne: wyciszenie lektora w `onFatal`, `placeByParent` w sesji, reguła dla obietnic
   o „cichych” nazwach, boot smoke (H-9).

## 7. Zmiany od ostatniego audytu

| Poprzednie id | Status | Dowód |
|---|---|---|
| C-1 | fixed (z resztą N-1) | `src/ui/dom/errorBoundary.ts` `installErrorBoundary`, `src/core/errorSignal.ts` `isFatalSignal`, `src/ui/dom/errorCard.ts` `mountErrorCard`, `src/main.ts` `onFatal` (`loop.sleep`, `suspend`); e2e `tests/e2e/error-boundary.spec.ts` (krok, boot, callback ustawień, szum). Poza granicą: ewaluacja modułów i `createNarrator` (N-1). |
| C-2 | fixed (z resztą N-5) | `src/core/inputSuspend.ts` `openInputSession` (`run` → `end` przy wyjątku), `UIScene.openSettings` i `WelcomeScene` (wszystkie callbacki w `session.run`), `tests/dialogSessions.test.ts`, `tests/inputSuspend.test.ts`. Kod okna przed callbackiem (`stagePanel` `placeByParent`) nadal poza sesją, ale zakrywa go karta. |
| H-3 | still open | `src/ui/narrator.ts` bez zmian od `cdeff4a` (`git log cdeff4a..298c74d -- src/ui/narrator.ts` puste); `utterance.onerror = release`. |
| H-4 | still open | `src/ui/narrator.ts` `unlock`: `unlocked = true` przed `speakNow('')`; `main.ts` `unlockSpeech` bez zmian. |
| H-6 | fixed | `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (`watchVoice` → `noVoice.hidden`, odsubskrybowanie w `close`), `UIScene.openSettings` przekazuje `narrator.onAvailability`, `pl.settings.noVoice`; e2e `parent-settings.spec.ts` (linia widoczna bez głosu, ukryta z głosem). Reszta (głos jest, synteza nie działa) należy do H-3. |
| H-7 | changed (częściowo zamknięte) | `src/core/mastery.ts` `recordRound` (błąd: `streak = 0`, opanowanie bez zmian), `balance.mastery` bez `loss`, `tests/mastery.test.ts`, PRD FR-013 i ZADANIA § 1 przeredagowane. Widoczność dla rodzica nie dodana → H-7r. |
| L-8 | fixed | `createInputSuspender`: `target.enabled = true` w `finally` po `onRelease`. |
| L-12 | still open | `UIScene.openSettings` gałąź `if (!stage)`. |
| H-1, H-2, L-6 | fixed (przez C-1) | Wyjątek w `TaskScene.create` / po wyborze wieku trafia do granicy → karta. |
| M-1, M-2, M-13 | not re-checked | Poza obszarem; karta czyni je ostatecznymi (sesja kończy się kartą), ale pola sceny nadal zmieniane przed `freshRound`/`endRound`. |
| pozostałe (H-5, H-8, H-9, H-10, M-3…M-12, L-1…L-11, L-13, L-14) | not re-checked | Poza obszarem tego audytu. |

## 8. Metoda i ograniczenia

- Jeden audytor (ten krok), bez subagentów: obszar jest mały (11 plików `src/` zmienionych w PR #27) i ściśle
  związany z wcześniejszymi ustaleniami. Przeczytane w całości: `errorBoundary.ts`, `errorCard.ts`, `errorSignal.ts`,
  `inputSuspend.ts`, `main.ts`, `UIScene.openSettings`/`applySettings`/`closeSettings`, `stagePanel.ts`, diff
  `WelcomeScene`, `settingsPanel.ts`, `BootScene`, `TaskScene.update`, `e2eHook.ts` `e2eFail`, fragmenty `narrator.ts`.
- Uruchomione lokalnie: `npx vitest run tests/errorSignal.test.ts tests/inputSuspend.test.ts
  tests/dialogSessions.test.ts tests/mastery.test.ts` → 4 pliki, 39 testów zielone. E2E i build **nie** były
  uruchamiane w tym kroku; dowody e2e (23/23, przełamania czerwone) pochodzą z logu runu
  (`context/runs/2026-10-13-fix-observability/run-log.md`) i nie zostały tu powtórzone.
- Przegląd repo (`src/`): 5 bloków `catch`, 4 `console.*`, 107 `throw new`.
- **Nieudowodnione w czasie działania:** zachowanie granicy na prawdziwym iPadzie/Androidzie (Safari: `filename` dla
  błędów modułów, kolejność `error` vs. zatrzymanie RAF), N-1 (wyjątek przed instalacją granicy), N-3 (lektor nad
  kartą), H-3/H-4 na prawdziwych silnikach mowy, pętla „karta przy każdym starcie” po zepsutym wdrożeniu (N-6).
- Brak harnessu sond; ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszar:** z argumentów kroku, bez pytania (jeden obszar z trzema częściami → trzy klucze w `areas`).
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`); `runtime_proof: not-run`.
- **Subagenci:** nie uruchomiono — obszar mieści się w jednym odczycie, a skill zakłada fan-out dla 2–4 przepływów
  full-stack; ryzyko: mniejsza szerokość przeglądu poza obszarem (stąd „not re-checked” w § 7).
- **Język raportu:** polski (jak raport 06:59 i log runu); identyfikatory po angielsku.
- **Wagi:** 0 critical — żadna ścieżka nie zostawia dziecka bez wyjścia *i* bez śladu, z wyjątkiem N-1, które ma
  niskie prawdopodobieństwo (dane sprawdzane w CI), stąd medium. H-3/H-4 zachowują wagę high z poprzedniego raportu.
  Reszta H-7 obniżona do medium (dryf w dół usunięty; zostaje tylko luka widoczności).
- **Telemetria:** żadnego dostawcy; lokalny bufor błędów i kod na karcie to propozycje do decyzji opiekuna.
- **Co zmieniłoby odpowiedzi:** sonda pokazująca, że Safari nie wypełnia `filename` lub podaje inny origin dla
  bundla (wtedy `foreign` mógłby połknąć prawdziwe błędy → N-2 do high); wyjątek przy ewaluacji modułów widziany w
  praktyce (N-1 do high).
