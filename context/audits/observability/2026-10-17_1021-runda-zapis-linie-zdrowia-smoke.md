---
type: observability-audit
date: 2026-10-17 10:21
mode: audit
commit: d235d0d
branch: docs/observability-audit-2026-10-16-audit-sweep
dirty_tree: false
areas: [child-round-art-draw-widgets-gestures-daily-puzzle, save-backups-export-import-reset-second-tab-older-build, health-lines-obrazki-dzwieki-offline-boot-limit-deploy-smoke]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-16_1419-stara-karta-offline-obrazki-dzwieki.md
findings: { critical: 0, high: 1, medium: 17, low: 23 }
---

# Audyt obserwowalności: runda dziecka, zapis i panel rodzica, linie zdrowia i smoke (2026-10-17)

Ten raport zamyka run `2026-10-16-audit-sweep`. Run wydał trzy slice'y. Każdy z nich zamykał ustalenia z ośmiu wcześniejszych audytów (2026-10-14_0445 … 2026-10-16_1419):

| PR | Slice | Merge |
|---|---|---|
| #79 | fix `child-flow-guards` (zadania, widżety, gesty) | `24b3e4b` |
| #80 | fix `save-truth` (zapis, import/reset, druga karta) | `dfc49ae` |
| #81 | fix `health-lines-and-smoke` (obrazki, dźwięk, offline, smoke) | `d235d0d` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Runda:** dziecko w rundzie. Losowanie przy brakujących obrazkach, widżety i gesty (portfel, zegar, klocki), dzienna zagadka (#79).
- **Zapis:** zapis gry i panel rodzica. Kopie zapasowe, eksport, import i reset, druga karta i starsza wersja (#80).
- **Zdrowie:** linie zdrowia i smoke deployu. „Obrazki”, „Dźwięki”, „Gra bez internetu”, start z limitem, smoke precache (#81).

Zakres:

- Nie zgłaszam ponownie tego, co run naprawił; dowody są w § 7.
- Zgłaszam to, co zmiany runu wprowadziły albo zostawiły otwarte.
- Follow-upy runu cytuję i nie powielam: `context/archive/2026-10-16-child-flow-guards/`, `2026-10-16-save-truth/` i `2026-10-17-health-lines-and-smoke/`, w każdym `follow-ups/review-fixes.md`. Odwołuję się do nich w formie „FU-CFG #n”, „FU-ST #n” i „FU-HLS #n”.

Lokalizacje w tabelach są podane jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 1 HIGH, 17 MEDIUM, 23 LOW.** Run zamknął wszystkie MEDIUM z zakresu. Prawie wszystkie nowe ustalenia leżą między rekordem a linią dla człowieka, a nie w samym wychwyceniu błędu.
- **HIGH H-1: limit startu liczy zegar ścienny, a kolejka loadera stoi, gdy karta jest w tle.** Zmiana B-3 przeniosła limit `balance.loader.totalMs` na zegar ścienny. Loader Phasera przesuwa jednak pliki z `list` do `inflight` tylko w `update()` sceny, a ten nie biegnie przy ukrytej karcie. Pierwszy start, który zejdzie do tła na dłużej niż pozostały limit, odcina wszystkie czekające pliki. Rodzic czyta wtedy „przy lepszym internecie”, a `bootLoad` nie zapisuje czasu w tle.
- **Przyczyna 1: jedna liczba albo jedna zmienna za kilka przyczyn.**
  - `bootLoad.cut` liczy obrazki, dźwięki i czcionkę razem (H-2).
  - `mainCause` zostawia jedną przyczynę z kilku (H-4).
  - Kod blokady w „Zapis gry” pochodzi z `lastFailure`, a nie z drogi, która zablokowała zapis (Z-1).
- **Przyczyna 2: id umiejętności dołączane przy budowie rundy, nie przy rysowaniu.** Nowe asercje #79 (`assertPool`, `lineTicks`, `pictureLayout` w `drawPrompt`, `numberChoices`) rzucają bez `Skill <id>`. Wynik to „Ups!” w środku rundy bez kodu (C-1, C-2, C-3, I-1).
- **Przyczyna 3: zapasy i „najlepsza próba” bez śladu.** Wyczerpane powtórzenia losowania obrazków (C-4), rozgrzewka bez powtórzeń (C-5), odczyt kopii zapasowych zwijany do „brak kopii” (Z-4) oraz nowe moduły `saveChannel` i `writerId` z pustymi `catch` (Z-9) nie zostawiają linii ani w konsoli, ani w panelu.
- **Przyczyna 4: zdania dla rodzica dobierane po zgrubnej przyczynie.** Część porad jest fałszywa w części przypadków:
  - `siteDataAdvice` po `NewerSave` przy wymuszonym zastąpieniu (Z-8); wykonanie tej porady skasowałoby nowszy zapis;
  - „pomija zadania” po fallbacku (H-3);
  - „zamknij inne okna” przy poprzedniej stronie tej samej karty (Z-7).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-16 14:19)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci. Kanały człowieka:
  - co widzi dziecko;
  - karty DOM;
  - panel rodzica za bramką, czytany raz przy otwarciu;
  - konsola tabletu (terser, bez map źródeł);
  - log CI smoke'u deployu.
- **Granica błędów:** `installErrorBoundary` (`src/ui/dom/errorBoundary.ts`) i `isFatalSignal` nie zmieniły się. `QUIET_REJECTIONS` nadal zawiera AbortError, NotAllowedError, EncodingError i NotSupportedError. Nowość: cichy sygnał loguje `noiseLine` z nazwą i komunikatem, a `guardDecode` (`src/ui/decodeSeam.ts`) nazywa przy źródle plik dźwięku, którego nie da się zdekodować (S-2 zamknięte).
- **Runda:**
  - `generateTask` opakowuje błąd generatora w `Skill <id>: …` z `cause`. Część pętli dostała granicę `drawUntil` (`src/core/tasks/retry.ts`).
  - `buildAdaptiveRound` losuje ponownie zadania zablokowane obrazkiem (G-4) i woła `onFallback`.
  - `canSubmit` blokuje OK przy niesionym elemencie.
  - `rawToDragEvent` niesie `pointerId` przy anulowaniu.
- **Zapis:**
  - `saveChannel` (BroadcastChannel) daje wczesny sygnał innej karty.
  - `writerId` (sessionStorage) odróżnia poprzednią stronę tej samej karty (`PreviousPageSave`).
  - `startCounter` (localStorage) liczy starty `unavailable` przed wymuszeniem.
  - Rekord `backup-status` przeżywa restart, a kopie zapasowe można wyeksportować.
  - `olderWriter` wykrywa zapis starszego buildu.
  - Format zostaje v4.
- **Zdrowie:**
  - Limity startu biegną na timerach okna (`bootLimitDue`).
  - `artCauses` daje przyczyny `fetch`, `network`, `decode`, `cut` i `never`, a `cutByTable` grupuje odcięte pliki według tabel.
  - Sekcja „Dźwięki” ma linię zablokowanych efektów (`lockedCount`) i przyczynę muzyki.
  - `offlineView` ma `updateFailed`, a `registration.update()` jest wywoływane raz na start.
  - Smoke robi HEAD każdego wpisu precache, także przy rollbacku.
- **Seamy e2e:** run nie dodał nowych nazw parametrów `?e2e…`. Wszystkie osiem czytników ma markery w `vite/e2eHookGuard.mjs` (sprawdzone ręcznie). Nowe wartości (`slowfail`, `ui`) siedzą w istniejących markerach. Stała `UI_MISSING_URL` nie jest markerem (I-8).
- **Przegląd repozytorium** (`src/` bez `src/testing`, audytor infrastruktury, ten sam wzorzec przed i po):

  | | 9b7fe37 | d235d0d |
  |---|---|---|
  | linie z `catch` | 44 | 68 |
  | puste `catch {}` w jednej linii | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint` `prompt()`) |
  | `console.error` | 6 | 9 |
  | `console.warn` | 30 | 53 |

  19 bloków `catch` nie ma wywołania loga. Większość zamienia błąd w dane widoczne później w panelu. Naprawdę ciche bez danych są: `saveChannel` (konstruktor, `post`, `close`), `writerId` (`createWriterId`, `end`, `parse`), `narrator.safely`, `installHint`, `motion`.

## 3. Co dociera do obserwatora (statycznie; e2e runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Pierwszy start, karta w tle dłużej niż limit | sesja z zapasami, zadania z obrazkami pominięte | „nie zdążyła się wczytać… przy lepszym internecie” | `Boot load cut after N ms` i N linii „(timeout or network)” | mylące (H-1, H-6) |
| Odcięte tylko dźwięki | cisza efektów | „Obrazki”: trzy linie OK i „część obrazków nie zdążyła się wczytać” | `Boot load cut` | sprzeczne (H-2) |
| 3 pliki odcięte i 2 z 404 | zapasy | jedna przyczyna `cut`, „uruchom ponownie” | linie `loaderror` | 404 bez porady (H-4) |
| Wyczerpane powtórzenia losowania obrazka (ORDINAL) | pole z polskim podpisem | nic, że dziecko je spotkało | nic | missed (C-4) |
| `assertPool` / `lineTicks` przy rysowaniu | „Ups!” w środku rundy | nic (karta bez kodu) | `RangeError …` bez umiejętności | niediagnozowalne (C-2, I-1) |
| Blokada kanałem drugiej karty | karta odmowy z `Kod: OtherWriterSave` | „Zapis gry”: dobre zdanie, kod wcześniejszej, innej awarii | nic | częściowo (Z-1) |
| Odczyt kopii zapasowych pada albo wisi | — | „brak kopii”, przycisk znika | `console.error` | spłaszczone (Z-4) |
| Wymuszone zastąpienie odrzucone `NewerSave` | gra bez zapisu, bez karty | rada „usuń dane witryny” | `replace failed` | szkodliwa rada (Z-8) |
| Wpis precache 404 po deployu | — | — | smoke czerwony, job czerwony, release zostaje | caught, bez auto-rollbacku (I-9) |
| Wpis precache: błąd sieci po stronie CI | — | — | `<url> 0 timeout` | błędna etykieta (H-7) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord ma szczegół, linia go zwija.** Run zbudował bogate rekordy runtime: `cutByTable`, `causes`, `wrongSize`, licznik fallbacków, `backupError` dla każdej próby, `blockedBy` z pięciu dróg. Zdania dla rodzica liczą jednak z jednej liczby albo z jednej zmiennej (`cut.length`, `mainCause`, `lastFailure`). Wyjaśnia H-2, H-3, H-4, H-5, Z-1, Z-3. Kod jest lokalnie rozsądny, ale każda nowa droga blokady albo nowa tabela zostawia linię nieaktualną.
2. **Nazwa umiejętności jest dołączana na granicy budowy rundy, a nie rysowania.** WNA-02 naprawiono per wywołanie. Każda nowa asercja widżetu startuje znowu bez nazwy, a karta „Ups!” nie ma `Kod:`. Wyjaśnia C-1, C-2, C-3, I-1, I-3.
3. **„Najlepsza próba = cisza” w nowych modułach.** `saveChannel` i `writerId` wracają do starego zachowania bez linii, choć `startCounter` i `soundPrefs` z tego samego runu ostrzegają przy każdej porażce. Nie ma wspólnego `warnOnce(name)` ani reguły lint. Wyjaśnia Z-9, Z-10, C-4, C-5, I-11.
4. **Naprawa B-3 wprowadziła nowe niedopasowanie zegarów.** Limit liczy czas rzeczywisty, a postęp loadera idzie za pętlą gry. Wyjaśnia H-1, H-6.
5. **Kontrole wykrywają, ale nie działają.** Smoke biegnie po `switch` bez automatycznego rollbacku, krok `Status` nie biegnie po porażce, a strażnik e2e zna tylko listę markerów. Wyjaśnia I-8, I-9, H-8.

## 5. Ustalenia według obszaru

### 5.1 Dziecko w rundzie (#79)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| C-1 | `src/scenes/TaskScene.ts` `drawPrompt` (`pictureLayout(…)` bez `skillId`) | identity-lost | medium | `drawPrompt` biegnie przed wywołaniami z nazwą, więc tam pierwsza asercja rzuca bez id umiejętności. Dziecko widzi „Ups!” przy otwarciu zadania, rodzic nic, konsola minifikowany stack. Dziś latentne, bo walidator egzekwuje `TALL_MODES`. | Przekazać `task.skillId`; zrobić `skillId` wymaganym w `pictureLayout`, `answerSpans` i `hintPictureLayout`. |
| C-2 | `src/ui/widgets/{IconGroups,IconRow,Jugs,MoneyTable}.ts` `render` → `assertPool`; `NumberLine.render` → `lineTicks` (`src/core/tasks/visual.ts`) | identity-lost | medium | #79 zamienił ciche gubienie elementów w rzuty przy rysowaniu: przy otwarciu zadania albo po pierwszym błędzie (linia liczbowa podpowiedzi). Dziecko widzi „Ups!” w środku rundy, a mistrzostwo z tej rundy przepada (gwiazdki zostają). Konsola: `RangeError: icons: 13 pieces…` bez umiejętności. Tak samo `coinLayout`, `columnSteps` i `faceDraw`. | Sprawdzać pulę i podziałki w `generateTask` (`validateVisual`), żeby błąd padł przy budowie rundy z nazwą; albo owinąć `TaskPicture.render` w `Skill <id>`. |
| C-3 | `src/core/tasks/generateTask.ts` `generateTask` (`numberChoices` po `try`) | identity-lost | medium | Kafelki dokładane po generatorze rzucają `RangeError numberChoices(…)` bez id umiejętności. Zmiana danych `tileRange` albo `boundOf` daje „Ups!” przy „Kolejna runda” albo przy starcie, i nie da się go przypisać. | Przenieść krok kafelków do tego samego `try`. |
| C-4 | `src/core/curriculum.ts` `buildAdaptiveRound` (pętla `artRetries`) | swallowed | medium | Po 8 nieudanych powtórzeniach zostaje zadanie z polem zastępczym. Brak licznika, `onFallback` i linii. Dla ORDINAL przy kilku brakujących ikonach zdarza się to w około 7% losowań (FU-CFG „F6” mówi tylko, że powtórzenia rzadko pomagają). „Obrazki” nie mówią, że dziecko trafiło na taki brak. | Liczyć wyczerpane powtórzenia per umiejętność w tym samym liczniku co `onFallback`; linia „spotkane w rundach: N”. |
| C-5 | `src/scenes/TaskScene.ts` `freshRound` (rozgrzewka) → `src/core/round/warmup.ts` `buildWarmup` | coverage-gap | medium | Powtórzenie losowania G-4 działa tylko w rundzie adaptacyjnej. Rozgrzewka E2 losuje 3 umiejętności E1 (ORDINAL, COUNT) i może pokazać pola zastępcze. Rozgrzewka decyduje o etapie: poniżej 4 z 6 obniża go po cichu. Rodzic widzi niższy etap bez przyczyny. | Ten sam `generate` z powtórzeniem w `buildWarmup`; fallback rozgrzewki zapisany w wyniku runtime. |
| C-6 | `src/core/trayDrag.ts` `stepTrayDrag` (`down` innego `pointerId` → `idle`) vs `src/core/clockSet.ts` | flattened-response | low | GRD-02 naprawione tylko dla zegara. Przy monetach i klockach drugi palec upuszcza niesiony element. Osiągalne tylko przy myszy i dotyku naraz (`activePointers` 1, FU-CFG „F4”). | Zasada zegara także w `stepTrayDrag`. |
| C-7 | `TaskScene.create`: OK w `BlockMat`, `CoinWallet`, `ClockSet` (`canSubmit`) | swallowed | low | OK przy trzymanym elemencie nic nie robi: bez sygnału i bez loga. Z utraconym `up` (FU-CFG „F4”) dziecko stuka OK bez odpowiedzi. Hook e2e nie raportuje `carrying`. | `carrying` w `TaskSnapshot`; delikatny sygnał, gdy kit go przewidzi. |
| C-8 | `src/core/round.ts` `captureNote` / `exampleValue`; `src/core/progress.ts` | missing-context | low | Notatka PIC-05 („Kwota się zgadza…”) dociera do dziecka, ale nie do rodzica. Przykład „błędu” ma tę samą sumę i nie ma powodu. | Dopisać rodzaj notatki do `given` (format v4 bez zmian). |
| C-9 | `src/core/round/canonicalInput.ts` (tylko testy); `TaskScene.render` `markHint(task.answer)` | coverage-gap | low | TXT-03 zamknięte testem (1000 losowań). W runtime rozjazd `check` i kafelków zostawia dziecko w `retype` bez podświetlenia. Nic nie jest logowane. | `canonicalInput` w `try` przy wejściu w `retype`, jeden `console.error` z umiejętnością. |
| C-10 | `TaskScene.render` `overflowWarned` → `console.warn` | logged-not-captured | low | Przepełnienie linii rozwiązania (WNA-04) trafia tylko do konsoli. Bramka wizualna widziała je na `E3.5.pyramid_30` (FU-CFG, sekcja visual gate). | Zbiór runtime przepełnionych umiejętności i jedna linia w panelu. |

### 5.2 Zapis gry i panel rodzica (#80)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| Z-1 | `src/core/autosave.ts` `noticeOtherWriter` → `refuseWrites`; `src/core/saveHealth.ts` `offState` (`code: lastFailure?.error ?? lastError`) | identity-lost | medium | Blokada z kanału ustawia `blockedBy='otherTab'`, ale nie ustawia kodu. Karta dziecka mówi `Kod: OtherWriterSave`. „Zapis gry” pokazuje poprawne zdanie z kodem wcześniejszej, innej awarii (np. `timeout`) albo bez kodu. Test sprawdza słuchacza, nie panel. | `blockCode` ustawiany w `refuseWrites` i `block`, czytany przez `offState`; oznaczyć źródło kanału. |
| Z-2 | `autosave.ts` `attempt` → `noteOwed()`; `tryCopy` (`noteOwed` tylko przy `final` lub limicie) | missing-context | low | Okno kopii po zapisie to znany FU-ST #23. Nowe jest to, że próby 1–2 nie aktualizują rekordu (`error: null`). Po zamknięciu aplikacji panel mówi „starej kopii nie udało się zachować” bez `Kod:`. | Zapisywać rekord z `backupError` po każdej nieudanej próbie. |
| Z-3 | `saveHealth.ts` `migrationOf` (`failed`/`pending` po `migrationWrittenAt` → `null`) | coverage-gap | medium | Gdy kopia pada poniżej limitu albo jest w toku, linii migracji nie ma. `earlierFailures` odejmuje `backupFailures`, więc rodzic czyta „Zapis działa”. To przeczy komentarzowi V1. | `failed`/`pending` → linia `copy:'pending'` z `backupError`. |
| Z-4 | `src/scenes/UIScene.ts` `openSettings` → `saver.readBackups()` (`[]` przy błędzie albo timeoucie); `src/storage/idb.ts` `readBackups` | flattened-response | medium | Nieudany albo wiszący odczyt wygląda jak „brak kopii”: przycisk „Zachowaj kopię starego zapisu” znika, choć panel może mówić „Stara kopia została”. Rodzic czeka do 5 s bez informacji. | `{copies, error}`, linia „nie udało się sprawdzić kopii (Kod)”; odczyt per wersja. |
| Z-5 | `autosave.ts` `withTimeLimit` `onLate` → `lateWrite='failed'` | identity-lost | medium | Zapis po timeoucie, który ląduje później jako odmowa (`OtherWriterSave`, `NewerSave`, `PreviousPageSave`), zostawia tylko `'failed'`. Brak blokady i karty do następnego zapisu. Panel mówi „failing” z `timeout`. | Przekazać nazwę błędu do `onLate`; odmowa → `refuseWrites`. |
| Z-6 | `UIScene.openExport` (`device.kind !== 'summary'` → `pl.saveTransfer.exportNotDevice`) | flattened-response | medium | Przy `otherTab`, `newer` albo `fatal` zapis urządzenia był wczytany, a rodzic czyta, że kopia „nie ma wcześniejszego postępu”. Prawdziwe ryzyko (kopia starsza niż najnowszy zapis) nie jest nazwane. Wiąże się z FU-ST #5 i #8. | Ostrzeżenie dla każdej przyczyny; dla `otherTab`/`newer` „ta kopia może być starsza niż najnowszy zapis”. |
| Z-7 | `autosave.ts` `attempt` (`PREVIOUS_PAGE_SAVE` → `refuseWrites('otherTab')`); `pl.settings.saveOff.otherTab` | flattened-response | low | Odmowa po przeładowaniu tej samej karty każe rodzicowi „zamknąć inne okna”, których nie ma. | Przyczyna albo zdanie `previousPage`. |
| Z-8 | `src/ui/dom/saveSummaryView.ts` `failureText`; `autosave.ts` `replace` (`NEWER_SAVE` → `blockedBy ??= 'newer'`) | flattened-response | medium | Wymuszone zastąpienie odrzucone `NewerSave` pokazuje `siteDataAdvice`. Wykonanie tej rady skasuje nowszy zapis. Ta gałąź nie woła `onBlocked`, więc nie ma karty i gra toczy się bez zapisu. | `NewerSave` i inne odmowy jako tekst „plain”; `onBlocked` także z `replace`. |
| Z-9 | `src/storage/saveChannel.ts` `createSaveChannel` (`post`, `close`, konstruktor); `src/storage/writerId.ts` `createWriterId`, `end`, `parse` | swallowed | low | sessionStorage, który rzuca, albo brak BroadcastChannel nie zostawiają śladu. `PreviousPageSave` cicho staje się `OtherWriterSave`, a wczesny sygnał jest wyłączony. Komunikaty kanału przed powstaniem autosavera (`main.ts`) przepadają. (Scala I-5, I-6.) | Jeden `console.warn(name)` na fallback; flaga runtime `channel: ok\|off` w „Zapis gry”. |
| Z-10 | `src/main.ts` odczyt `backupRecord` (`.catch` → `null`) | flattened-response | low | Nieczytelny rekord wygląda jak „nigdy nie migrowano”, więc znika linia o utraconej kopii. | Runtime `backupRecordError`, linia „nie wiadomo”. |
| Z-11 | `src/core/saveFile.ts` `exportFileText` (`String(input.raw)`) | flattened-response | low | Surowa wartość, której nie da się serializować, daje plik `"[object Object]"`, a dialog i tak mówi `shared`. | Porażka i `exportInvalid`. |
| Z-12 | `autosave.ts` `skipped` / `blockedBy` (tylko runtime) | coverage-gap | low | Po „Zacznij od nowa” na karcie odmowy nic nie pamięta, że nieaktualna karta zgubiła N zmian. Ten sam wzorzec co FU-ST #4 (SRR-07), ale dla odmów. | Mały rekord `profile:default:last-refusal` (przyczyna, `skipped`, czas). |

### 5.3 Linie zdrowia i smoke deployu (#81)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-1 | `src/scenes/BootScene.ts` `preload` → `arm(schedule.cutAt…)` (timery okna, B-3) wobec Phasera `LoaderPlugin.update` / `checkLoadQueue` | coverage-gap | **high** | Ukryta karta wstrzymuje pętlę, więc kolejka loadera stoi, a zegar ścienny biegnie. Pierwszy start schowany na dłużej niż reszta 50 s odcina wszystkie czekające pliki (Android, ok. 120 plików, 6 równoległych). Dziecko ma całą sesję z zapasami i pominiętymi zadaniami. Rodzic czyta „przy lepszym internecie”. `bootLoad` ma `elapsedMs`, ale nie ma czasu w tle. Regresja wprowadzona przez naprawę B-3: wcześniej limit stał razem z pętlą. Pomaga restart. | Odliczać czas ukrycia (`visibilitychange`) od limitu albo zapisać go w `bootLoad` i dać osobną linię „gra była w tle”. Dowód runtime: e2e z `page.evaluate` ukrywającym kartę. |
| H-2 | `UIScene.openSettings` → `artHealthLines({ cut: bootLoad.cut.length })`; `src/core/artHealth.ts` `artHealthLines` | flattened-response | medium | `cut` liczy też dźwięki i czcionkę. Dźwięki są w kolejce ostatnie (B-6), więc odcina się je najczęściej. Wtedy „Obrazki” mają trzy linie OK i jednocześnie „część obrazków nie zdążyła się wczytać”. „Dźwięki” mówią tylko „N dźwięków nie wczytało się”. | Do „Obrazki” `cutByTable.task+room+ui`; „Dźwięki” z własną przyczyną (`withCauses` dla tabeli dźwięków). |
| H-3 | `artHealth.ts` `artHealthLines` (linia `skipped`); `TaskScene` `onFallback` / `artFallbackRounds` | missing-context | medium | ASL-04 naprawione częściowo. Po fallbacku (`current`/`all`) dziecko dostaje zadania z polami zastępczymi, a panel nadal mówi „Zadania z tymi obrazkami gra na razie pomija”. Licznik loguje co 10 rund, więc zwykła sesja (3–8 rund) nie daje linii. | Flaga fallbacku w rejestrze; zdanie „część pokazuje podpis”; log pierwszego fallbacku. |
| H-4 | `artHealth.ts` `mainCause` + `artHealthLines` (`cutSaysIt`) | flattened-response | medium | Mieszane przyczyny zwinięte do jednej: 3 odcięte i 2 z 404 dają `cut`. Pliki z 404 nie mają porady „restart nie pomoże”, więc rodzic restartuje w kółko. | Linia na każdą odrębną przyczynę albo zawsze linia `fetch`/`decode` obok `cut`. |
| H-5 | `BootScene` `withCauses` → `wrongSize` | logged-not-captured | low | Tekstura o innym rozmiarze niż w tabeli trafia do rejestru i konsoli, ale „Obrazki” mówią OK. | Wyciszona linia per tabela przy niepustym `wrongSize`. |
| H-6 | `BootScene` handler `loaderror` przy `cutLoad` | noise | low | Każdy odcięty plik daje „… failed to load: key src (timeout or network)” przed podsumowaniem. Konsola obwinia sieć za limit gry. | Pominąć albo przemianować linię, gdy `this.cut` zawiera klucz. |
| H-7 | `scripts/check-deploy.ts` `headEntry` (`catch {}`) | identity-lost | low | Każdy błąd sieci (DNS, TLS, ECONNRESET) daje `<url> 0 timeout` w logu CI. (Scala I-10.) | `error.cause?.code ?? error.name` w powodzie. |
| H-8 | `scripts/deploy-check/parse.ts` `entryVerdict` (tylko HEAD) | coverage-gap | low | Plik o długości 0 albo ucięty przechodzi smoke, a Workbox go precache'uje. `/sw.js` nie ma kontroli typu. | `content-length > 0`; `contentTypeCheck('/sw.js', …)`. |
| H-9 | `src/ui/sound.ts` `record` (`played` zeruje `lockedCount`), `locked()` = `game.sound.locked` | coverage-gap | low | Po przerwaniu na iOS (rozmowa, tło) kontekst bywa `suspended`, a `locked` jest false. „Dźwięki” nie mówią „zablokowane”, choć jest cisza. Przy wyłączonych efektach i włączonej muzyce linia wiecznie mówi „ruszy po dotknięciu”. | Liczyć też `context.state !== 'running'` i oczekiwania muzyki. |
| H-10 | `src/core/errorSignal.ts` `QUIET_REJECTIONS` (wobec `guardDecode`) | swallowed | low | Dekodowanie ma już własny handler, a dopasowanie po samej nazwie dalej wycisza własne nieobsłużone odrzucenia EncodingError, NotSupportedError i AbortError (np. `void start()`; `guardedPut` odrzuca AbortError). Zostaje tylko `Quiet rejection`. | Usunąć nazwy dekodowania albo dodać kontrolę pochodzenia. |
| H-11 | `src/storage/soundPrefs.ts` `probe` | coverage-gap | low | W prywatnym oknie iOS `localStorage` działa tylko do zamknięcia, więc próba przechodzi i linia „obowiązuje do zamknięcia” się nie pojawia. | Opisać jako znany limit albo łączyć z `persistence`. |

### 5.4 Platforma i infrastruktura

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| I-1 | `src/main.ts` callback `installErrorBoundary` → `src/ui/dom/errorCard.ts` `mountErrorCard` | identity-lost | medium | Zdjęcie karty „Ups!” od rodzica ma build, ale nie przyczynę. Nazwa błędu jest tylko w konsoli i w `saver.block('fatal', …)`, czyli w panelu, którego nie da się otworzyć, bo karta trzyma wejście. (TXT-06 znane dla rundy; tu dla każdej awarii.) | `Kod:` przez `pl.saveFailed.detail(errorName(error), build)`, plus id umiejętności, jeśli jest. |
| I-2 | `src/ui/dom/errorBoundary.ts` `handle` (`console.error(original)`) | missing-context | low | Linia fatalna bez buildu, z minifikowanym stackiem. | `Fatal (<build>): <name> — <message>` przed obiektem. |
| I-3 | `generateTask` (`new Error(\`Skill …\`)`) | identity-lost | low | `RangeError` i `TypeError` z generatora stają się `Error`, a `errorName` mówi „Error”. | Zachować `name: cause.name`. |
| I-4 | `src/storage/idb.ts` `guardedPut`, `putBackupOnce` (nie-`Error` → `DOMException('put failed','UnknownError')`) | identity-lost | medium | Na starym WebKit (cel safari14) `DOMException` może nie dziedziczyć z `Error`. Wtedy prawdziwy `QuotaExceededError` albo `DataCloneError` zostaje przemianowany na `UnknownError`, który jest w `LOST_CONNECTION`, i ponawiany jak zerwane połączenie. | Opakowanie na podstawie `errorName(e)`. |
| I-7 | `src/main.ts` przed `installErrorBoundary` (`createNarrator`, importy modułów) | coverage-gap | low | Rzut w konstruktorze lektora albo przy ewaluacji modułu daje pustą stronę bez karty. | Granica błędów przed lektorem. |
| I-8 | `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` wobec `BootScene` `UI_MISSING_URL` | config | low | Wartości seamów importowane do scen (`missing-on-purpose`, `E2E_BOOT_LIMITS`) nie są markerami. Wyciek przez porażkę eliminacji martwego kodu byłby niewidoczny. Dziś `dist/` czysty (sprawdzone). Wiąże się z FU-HLS #18. | Dodać `missing-on-purpose` i unikalny token z `E2E_BOOT_LIMITS` do markerów. |
| I-9 | `.github/workflows/deploy.yml` „Smoke check” po „Switch release”; krok `Status` bez `if: always()` | logged-not-captured | medium | Czerwony smoke zostawia zepsuty build serwowany dzieciom. Jedyny sygnał to czerwony job i e-mail GitHuba. `vps status` nie biegnie właśnie wtedy, gdy byłby potrzebny. Część „deploy/” to FU-HLS #2 i FU-ST #18. | `Status` z `if: always()`; decyzja opiekuna o automatycznym rollbacku po czerwonym smoke'u. |
| I-11 | `src/ui/narrator.ts` `safely`; `src/pwa/installHint.ts` `prompt().catch`; `src/ui/motion.ts` | swallowed | low | Awarie mowy, podpowiedzi instalacji i `matchMedia` bez śladu (linia dostępności głosu częściowo pokrywa mowę). | Jeden `console.warn` z nazwą na sesję. |

## 6. Rekomendowana kolejność poprawek

1. **H-1 (limit startu a karta w tle).** Jedyna regresja runu na poziomie HIGH. Odliczanie czasu ukrycia w `bootLimitDue` i zapis `hiddenMs` w `bootLoad`. Mała zmiana w jednym miejscu, test jednostkowy na czystej regule, e2e z ukryciem karty.
2. **Kod na karcie „Ups!” i id umiejętności przy rysowaniu (I-1, C-1, C-2, C-3, I-3).** Jedno `Kod:` na karcie zamyka „niediagnozowalne” dla każdej awarii fatalnej. Walidacja puli i podziałek w `generateTask` przenosi rzuty z rysowania do budowy rundy, gdzie umiejętność jest znana.
3. **Rekord → linia (H-2, H-3, H-4, Z-1, Z-3).** Czytać `cutByTable`, flagę fallbacku, wszystkie przyczyny i `blockCode`, które już istnieją. Bez nowych danych.
4. **Szkodliwa i myląca rada dla rodzica (Z-8, Z-6, Z-7).** `failureText` traktuje odmowy jako „plain”; `onBlocked` z `replace`; zdania per przyczyna.
5. **Ciche fallbacki (C-4, C-5, Z-4, Z-9, Z-10).** Wspólny `warnOnce(name)` i liczniki runtime; „spotkane w rundach” w „Obrazki”.
6. **Deploy (I-9, H-7, H-8).** `if: always()` w `Status`, nazwa błędu sieci w smoke'u, `content-length > 0`. Rollback automatyczny to decyzja opiekuna (`deploy/` należy do człowieka).
7. **Reszta niskich:** C-6..C-10, Z-2, Z-5, Z-11, Z-12, H-5, H-6, H-9..H-11, I-2, I-4, I-7, I-8, I-11.

Ograniczenia każdej poprawki:

- nic nie opuszcza urządzenia;
- tekst dla rodzica tylko w `src/data/pl.ts`;
- `src/core` bez przeglądarki;
- zapis zostaje v4 (Z-12 wymaga nowego klucza poza formatem, nie nowej wersji).

## 7. Zmiany od ostatniego audytu (2026-10-16 14:19 i osiem raportów objętych runem)

| Poprzedni id | Status | Dowód |
|---|---|---|
| T-1 (starszy build nadpisuje) | **changed** (wykrycie) | `olderWriter` → `pl.settings.olderWriter`; zapobieganie to FU-ST #21/#27. |
| T-2 (wykrycie dopiero przy zapisie) | **fixed** (przy dostępnym BroadcastChannel) | `saveChannel` + `channelVerdict`; cichy fallback Z-9; niezweryfikowane na iPadOS (FU-ST #16). |
| T-3 (przeładowanie = „inne okno”) | **changed** | `writerId` + `PREVIOUS_PAGE_SAVE`; zdanie dla rodzica dalej „inne okna” (Z-7). |
| T-4 | still open | FU-ST #8. |
| T-5 (brak `Kod:` na karcie odmowy) | **fixed** | `mountSaveRefusedCard` z `pl.saveFailed.detail(error, __BUILD_ID__)`. |
| O-1 / P-3 (smoke nie sprawdza serwowanych plików) | **fixed** (strona serwera) | `precacheServed(await headAll(precache))`, także przy rollbacku; nazwa z workera to FU-HLS #1; luki H-7, H-8. |
| O-2 (aktualizacja za aktywnym workerem = „gotowa”) | **fixed** | `offlineView` `updateFailed`. |
| O-3 (brak `update()`) | **changed** | `registration.update()` raz na start; powrót z tła to FU-HLS #12. |
| O-4, O-5 | not re-checked | Poza próbką audytorów; brak sygnału regresji. |
| U-1 / G-2 / G-3 (zapasy bez śladu) | **changed** | Wybrany zapas w rekordzie (`artFallbacks.ts`); miniatura per pokój to FU-HLS #3. |
| U-2 / B-4 (powód „odcięte limitem”) | **fixed**, nowe luki | Linia `cut` w „Obrazki”; liczy także dźwięki (H-2), mieszane przyczyny (H-4). |
| U-3 / B-5 (etykieta `loaderror`) | **fixed** | `loadErrorLine` z tabelą, kluczem, src i statusem; szum przy odcięciu (H-6). |
| B-3 (limit na zegarze gry) | **changed** | Timery okna i `bootLimitDue`; nowe niedopasowanie z loaderem (H-1). |
| B-6 (kolejność kolejki) | **fixed** | `bootQueue`, dźwięki na końcu. |
| M-1 / S-4 (zablokowany kontekst audio) | **changed** | `lockedCount`/`effectsLine`; przerwanie iOS bez `locked` (H-9). |
| M-2 (ustawienie dźwięku po restarcie) | **changed** | `probe` przy starcie; prywatne okno iOS (H-11). |
| S-2 (`QUIET_REJECTIONS` bez nazwy) | **fixed** | `noiseLine`, `guardDecode`; nazwy zbędne po naprawie (H-10). |
| S-5, S-7, S-9, S-10 | **fixed** | `musicCause`/`musicCode`, ostrzeżenie raz na id, `missing` uzupełniane. |
| PIC-01..06 | **fixed** | `artBlocked` `ORDINAL`, `canSubmit`, `buckets.current.length`, `exampleValue`, notatka `tooManyCoins`, stała kolejność COMPARE_QTY. Notatka nie dociera do rodzica (C-8). |
| TXT-01, TXT-02, TXT-04 | **fixed** | `reviewWeights`, test pierwszej podpowiedzi, `unlockReady` null na kroku powtórki. |
| TXT-03 | **changed** | Tylko test (C-9). |
| GRD-02 | **changed** | Tylko zegar (C-6). |
| GRD-03, GRD-05 | **fixed** | `rawToDragEvent` z `pointerId`; `drawUntil` (pętla cyfr `addSub` znana). |
| GRD-04 | still open (produkcja) | `drawingFit` tylko w testach (FU-CFG „F3”). |
| WNA-01, WNA-03 | **fixed** | `TALL_MODES` i `hintVisual` w `validateTask`. |
| WNA-02 | **changed** (częściowo) | Nazwa w `pictureLayout`, `answerSpans`, `hintPictureLayout`; nie w `drawPrompt` ani przy rysowaniu (C-1, C-2). |
| SV2-10 | **fixed** | `lastTaskSettled`, `countRound` + `flush('now')`, `variantCounted`. |
| G-4 | **changed** | Powtórzenie losowania w rundzie adaptacyjnej; bez sygnału (C-4) i bez rozgrzewki (C-5). |
| SVB-01..04, SRR-08, SRR-09, SV2-04, V-1, R-4, S12-04, S12-07 | **fixed** | Kolejno: `backupRecord` + `migrationOf`, `onWait`, `onLate` → `lateWrite`, `brokenView` + `replaceUnconfirmed`, `startCounter` + `forceAfterStarts`, `keepsOldSave`, `openBackupExport`, `unreadableCode`, `roomStateProblems`, `exportInvalid`, `downloadStarted`. |
| SRR-01, S12-08, V-4, FU-3 | not re-checked | Audytor zapisu nie powiązał ich z konkretnym symbolem; zmiany są w diffie #80, ale bez potwierdzenia w tym audycie. |
| T-1..T-5 ze starszych raportów, P-2, P-4 (strona `scripts/`) | **fixed** | `precacheCovers` przy SHA; strona `deploy/` to FU-HLS #2. |

## 8. Metoda i ograniczenia

- **Sposób:** czterech równoległych audytorów tylko do odczytu, zgodnie z domyślną ścieżką skilla:
  - po jednym na obszar (diff każdego PR-a przeczytany w całości, potem wywołania);
  - jeden audytor infrastruktury (granica błędów, kod przed nią, tożsamość błędu, build na kartach, seamy e2e, przegląd repo, `deploy.yml`).
  Diff runu: `9b7fe37..d235d0d`, 95 plików w `src/`, `scripts/` i `vite/`, ok. 2430 dodanych linii.
- **Scalanie:** I-5 i I-6 weszły do Z-9, I-10 do H-7. Z-1 obniżone z high do medium (zdanie przyczyny jest prawidłowe, zły jest tylko kod). Z-2 obniżone z high do low (okno kopii to znany FU-ST #23; nowy jest tylko brak kodu w rekordzie).
- **Sprawdzone ręcznie:**
  - `refuseWrites` nie ustawia `lastFailure`/`lastError`, a `offState` czyta kod z nich (Z-1);
  - `noteOwed` przed pierwszym zapisem i `tryCopy` zapisujący rekord tylko przy `final` lub limicie (Z-2);
  - `failureText` zwraca `siteDataAdvice` dla każdej odmowy spoza `Busy/Blocked/InvalidSave`, a gałąź `NEWER_SAVE` w `replace` nie woła `onBlocked` (Z-8);
  - `artHealthLines` dostaje `cut: bootLoad.cut.length` z całej listy, a `cutByTable` istnieje obok (H-2);
  - limity w `BootScene.preload` na `window.setTimeout` z komentarzem „also while the tab is hidden” (H-1);
  - `numberChoices` poza `try` w `generateTask` (C-3);
  - `assertPool` wołane w `render` czterech widżetów (C-2);
  - `QUIET_REJECTIONS` niezmienione w runie (H-10);
  - każdy parametr `?e2e…` czytany w `src/` ma marker w `E2E_HOOK_MARKERS` (I-8: tylko wartości stałych poza listą).
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond ani przeglądarki; e2e runu cytowane, nie powtarzane.
  - H-1: zatrzymanie kolejki loadera przy ukrytej karcie wynika z kodu Phasera 4.2.1 (`LoaderPlugin.update` na zdarzeniu UPDATE sceny) i z wstrzymania pętli; nie zmierzono go na prawdziwym Androidzie (por. FU-HLS #13).
  - H-9: przerwanie kontekstu audio na iPadzie nietestowane.
  - I-4: dziedziczenie `DOMException` z `Error` na iPadOS 14 nieweryfikowane.
  - T-2 na iPadOS w trybie aplikacji z ekranu głównego (FU-ST #16) i e2e na dwóch buildach (FU-ST #15) dalej otwarte.
  - Lokalny `dist/` sprawdzony na markery był z commitu runu `d090f0b`, nie z `d235d0d`.
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (trzy), bez pytania. Odrzucone: wybór z dokumentów bazowych. Zmieniłoby to polecenie opiekuna, by audytować inne przepływy.
- **`--runtime`:** nieuruchomiony, bo krok jest wyraźnie statyczny. Zmieniłoby to przekazanie `--runtime` albo potrzeba dowodu H-1 przed poprawką.
- **Subagenci:** domyślna ścieżka skilla, czyli trzech audytorów obszarów i jeden infrastruktury. Odrzucone: jeden czytelnik całego diffu, jak w raporcie 14:19, bo diff runu (ok. 2430 linii, 95 plików) jest pięć razy większy. Zmieniłoby to run z diffem rzędu kilkuset linii.
- **Poprzedni raport:** 2026-10-16 14:19 (najnowszy na `main`). Tabela zmian obejmuje też id z ośmiu raportów, które run zamykał.
- **Ważność H-1:** HIGH, nie MEDIUM. Za HIGH: sygnał jest widoczny, ale wskazuje złą przyczynę (rubryka „undiagnosable”), i regresję wprowadziła naprawa tego runu. Za MEDIUM: dotyczy tylko pierwszego startu schowanego do tła na dłużej niż limit, a restart pomaga. Zmieniłby to pomiar pokazujący, że Phaser przy ukrytej karcie nadal przesuwa kolejkę (np. przez `disableVisibilityChange`).
- **Ważność Z-1 i Z-2:** obniżone względem audytora (uzasadnienie w § 8). Zmieniłoby to zgłoszenie rodzica, który działał według złego kodu, albo brak `backup-v3` po aktualizacji.
- **Pytania skilla do użytkownika** (dostosowanie obszarów, sondy, usunięcie harnessu): nie zadane, zgodnie z kontraktem runu. Wybrano domyślne.
