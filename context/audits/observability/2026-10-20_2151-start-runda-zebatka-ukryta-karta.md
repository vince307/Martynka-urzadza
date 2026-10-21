---
type: observability-audit
date: 2026-10-20 21:51
mode: audit
commit: 1a9f661
branch: docs/observability-audit-2026-10-20-playtest-boot
dirty_tree: false
areas: [child-start-and-round-age-warmup-back-variety-narrator-off, gear-and-parent-settings-hint-gate-health-sections, boot-and-failures-hidden-tab-limit-ups-card-code-newersave-refusal]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-17_1021-runda-zapis-linie-zdrowia-smoke.md
findings: { critical: 0, high: 0, medium: 1, low: 5 }
---

# Audyt obserwowalności: start dziecka i runda, zębatka rodzica, start gry przy ukrytej karcie (2026-10-20)

Ten raport zamyka run `2026-10-20-playtest-boot`. Run wydał dwa slice'y:

| PR | Slice | Merge |
|---|---|---|
| #90 | fix `playtest-fixes-f01-f03` (F-01 lektor wyłączony, F-02 podpowiedź zębatki i „Wróć”, F-03 różnorodność rundy) | `48c2c7e` |
| #91 | fix `audit-boot-hidden-tab` (H-1 limit przy ukrytej karcie, I-1 `Kod:` na „Ups!”, Z-8 odmowa `NewerSave`) | `1a9f661` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Start i runda:** wybór wieku, rozgrzewka z przyciskiem „Wróć”, losowanie rundy z regułą różnorodności, lektor domyślnie wyłączony (#90).
- **Zębatka:** podpowiedź po stuknięciu, bramka, sekcje zdrowia „Obrazki” i „Zapis gry” (#90, #91).
- **Start gry i awarie:** limit wczytywania przy ukrytej karcie, karta „Ups!” z `Kod:`, odmowa zastąpienia zapisu `NewerSave` (#91).

Zakres: diff runu `64fd3ea..1a9f661` w `src/` (26 plików, +458/−83; `scripts/`, `vite/`, `deploy/` i `.github/` bez zmian). Follow-upy runu cytuję, nie powielam: `context/archive/2026-10-20-playtest-fixes-f01-f03/follow-ups/review-fixes.md` („FU-PF”) i `context/archive/2026-10-20-audit-boot-hidden-tab/follow-ups/review-fixes.md` („FU-BHT”). Lokalizacje są podane jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 1 MEDIUM, 5 LOW.** Run zamknął jedyne HIGH poprzedniego audytu (H-1) i trzy MEDIUM (I-1, Z-8, C-3). Nowy kod (#90) nie dodał żadnego `catch` ani cichego fallbacku: liczniki przeglądu repozytorium są identyczne jak na `d235d0d`.
- **H-1 naprawione:** limity startu liczą czas widoczny (`bootLimitDue(schedule, wall, hiddenMs)`), timery są zdejmowane przy ukryciu i uzbrajane przy powrocie, a `bootLoad.hiddenMs` stoi obok `elapsedMs`. Pozostaje drobna nieścisłość: linia „bo gra była w tle” pojawia się przy każdym `hiddenMs > 0`, choć po tej poprawce czas w tle z definicji nie powoduje odcięcia (N-1, ryzyko przyjęte w planie jako A-3).
- **Karta „Ups!” ma `Kod:`** (`errorCode`: nazwa błędu plus `/<skillId>`). Id umiejętności jest jednak tylko w błędach z `generateTask`. Rzuty przy rysowaniu, których `assertDrawable` nie obejmuje (`coinLayout`, `columnSteps`/`columnMarks`, `faceDraw`), nadal dają kod bez umiejętności (C-2, zawężone).
- **Przyczyna 1 (nadal otwarta): rekord ma szczegół, linia go zwija.** `artHealthLines` dostaje `cut: bootLoad.cut.length` z dźwiękami i czcionką. Nowa linia „w tle” dziedziczy ten błąd: odcięte same dźwięki dają zdanie o obrazkach (H-2, teraz w dwóch wariantach).
- **Przyczyna 2 (nowa, łagodna): decyzje dziecka i reguły bez śladu dla rodzica.** „Wróć” zmienia etap i wiek bez żadnego zapisu przyczyny (N-2), a reguła różnorodności rozluźnia się bez sygnału (N-3). Nic nie jest zepsute; rodzic po prostu nie wie, dlaczego etap albo runda wygląda inaczej.

## 2. Model przechwytywania (zmiany względem raportu 2026-10-17 10:21)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci w czasie gry (PRD). Kanały człowieka: to, co widzi dziecko; karty DOM; panel rodzica za bramką (czytany raz przy otwarciu); konsola tabletu (terser, bez map źródeł); log CI smoke'u deployu.
- **Granica błędów:** `installErrorBoundary` (`src/ui/dom/errorBoundary.ts`) bez zmian, `isFatalSignal` i `QUIET_REJECTIONS` bez zmian. Nowość: callback w `src/main.ts` przekazuje `errorCode(error)` (`src/core/save.ts`) do `mountErrorCard` (`src/ui/dom/errorCard.ts`), a karta pokazuje `pl.saveFailed.detail(code, build)`, tę samą linię `Kod:` co karty zapisu. Pierwszy kod wygrywa (karta idempotentna).
- **Tożsamość błędu w rundzie:** `generateTask` (`src/core/tasks/generateTask.ts`) ma jeden `try` obejmujący generator, `assertDrawable` (pule `ART_LIMITS` i podziałki linii liczbowej, `src/core/tasks/visual.ts`) i kafelki `numberChoices`. Błąd jest opakowany przez `skillFailure`: komunikat `Skill <id>: …`, `cause`, zachowana nazwa (`RangeError` zostaje `RangeError`) i pole `skillId`. `TaskScene` nie ma żadnego `catch`, więc taki błąd dociera do granicy z nazwą i umiejętnością.
- **Start gry:** `BootScene.preload` liczy limity `balance.loader` na zegarze ściennym minus czas ukrycia (`HiddenSpan`, `startHidden`/`endHidden`/`hiddenMsAt` w `src/core/bootLimits.ts`). Przy ukryciu oba timery są zdejmowane; przy powrocie uzbrajane według fazy. Słuchacz `visibilitychange` jest zdejmowany przy `COMPLETE` i przy `shutdown`. Linia konsoli przy odcięciu podaje `(hidden N ms)`. Rekord `REGISTRY_KEYS.bootLoad` ma `hiddenMs` (także w hooku e2e).
- **Zapis:** `Autosaver.replace` przy `NewerSave` woła `refuseWrites('newer', NEWER_SAVE)`, więc `onBlocked` podnosi kartę odmowy, a `failureText` (`src/ui/dom/saveSummaryView.ts`) pokazuje `pl.saveTransfer.deviceNewer` zamiast `siteDataAdvice`. `replace` pomija kontrolę innego piszącego (`write(state, 'replace')`), więc `NewerSave` to jedyna odmowa, jaką może dostać. `openDialog` (`src/ui/dom/dialog.ts`) oddaje fokus karcie podniesionej pod dialogiem.
- **Start dziecka:** `ageBackOffered` / `firstRoundDone` (`src/core/placement.ts`) decydują o „Wróć”; `TaskScene.backToAge` porzuca otwartą rundę bez `finishRound`, ustawia `learner` na `null`, robi `flush('now')` i startuje `WelcomeScene`. Gwiazdki zostają.
- **Runda:** `variedRound` / `pickVariedSkills` / `spreadTypes` (`src/core/round/variety.ts`) i `pickVariedFromStage` w `buildWarmup`; cap `balance.round.variety.maxPerType` 2. Zużycie rng jak w `pickRoundSkills`.
- **Panel rodzica:** `SettingsIcon` w pełnym kolorze; krótkie stuknięcie (`longPress` zwraca `tap`) pokazuje raz na ładowanie strony `SettingsHint` na `balance.parentSettings.hintMs` (`REGISTRY_KEYS.settingsHintShown`). Bramka i przytrzymanie 2 s bez zmian. Sekcja „Obrazki” dostaje `background: hiddenMs > 0`.
- **Lektor:** `balance.narrator.autoReadStages` = `[]`. Dostępność głosu jest nadal badana przy tworzeniu lektora (`voiceschanged` w `src/ui/narrator.ts`), więc linia „brak polskiego głosu” w ustawieniach nie zależy od czytania automatycznego.
- **Seamy e2e:** run nie dodał parametrów `?e2e…` ani nie zmienił `vite/e2eHookGuard.mjs`; hook dostał tylko pola odczytu (`hiddenMs`, `settingsHint`, cel `ageBack`).
- **Przegląd repozytorium** (`src/` bez `src/testing`, ten sam wzorzec co w poprzednim raporcie):

  | | d235d0d | 1a9f661 |
  |---|---|---|
  | linie z `catch` | 68 | 68 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 53 | 53 |

## 3. Co dociera do obserwatora (statycznie; e2e runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Pierwszy start schowany do tła na dłużej niż 50 s | ładowanie trwa dalej po powrocie, bez odcięcia | nic (brak odcięcia) | brak linii | **naprawione** (H-1; e2e #15 w `load-and-tab-guard`) |
| Wolne łącze, rodzic przełączył aplikację na 2 s, potem odcięcie po 50 s widocznych | zapasy | „bo gra była w tle” | `Boot load cut after … (hidden 2000 ms)` | mylące zdanie, dobra konsola (N-1) |
| Odcięte tylko dźwięki, karta była chwilę w tle | cisza efektów | „Obrazki”: „Część obrazków nie zdążyła się wczytać, bo gra była w tle” | `Boot load cut` | sprzeczne (H-2) |
| Generator albo pula obrazka rzuca w rundzie | „Ups!” | zdjęcie karty: `Kod: RangeError/E3.5.x · build` | stack z `Skill E3.5.x:` i `cause` | **diagnozowalne** (I-1, C-3) |
| `coinLayout` / `columnSteps` rzuca przy rysowaniu | „Ups!” | `Kod: Error` albo `RangeError` bez umiejętności | stack bez umiejętności | częściowo (C-2) |
| Wymuszone zastąpienie odrzucone `NewerSave` | karta odmowy po zamknięciu dialogu | „Nowsza wersja gry zapisała już postępy… Uruchom grę ponownie.” | `autosave: replace failed` | **naprawione** (Z-8) |
| Dziecko stuka „Wróć” i wybiera inny wiek | powitanie, nowa rozgrzewka | nowy etap w panelu bez przyczyny | nic | bez śladu (N-2) |
| Krok ma za mało typów na regułę różnorodności | 3 zadania jednego typu | nic | nic | bez śladu (N-3) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord ma szczegół, linia go zwija** (z poprzedniego raportu, nadal otwarte). `cutByTable` istnieje, ale „Obrazki” czytają `cut.length`; nowy wariant „w tle” wziął tę samą liczbę. Wyjaśnia H-2 (rozszerzone), H-3, H-4, Z-1.
2. **Zdanie przyczyny wybierane po sygnale pośrednim.** Flaga `background` to „karta była kiedykolwiek ukryta”, a nie „ukrycie spowodowało odcięcie”; po poprawce H-1 te dwie rzeczy są rozłączne. Plan przyjął to świadomie (A-3). Wyjaśnia N-1.
3. **Id umiejętności tylko na granicy generowania.** `assertDrawable` przeniósł do generowania cztery pule i podziałki, ale nie układ portfela, słupka ani figur. Wyjaśnia C-2 (zawężone), N-4.
4. **Decyzje dziecka i reguł bez rekordu runtime.** „Wróć”, rozluźnienie reguły różnorodności i cap w kolejności losowania (FU-PF „F3”) działają poprawnie, ale nie zostawiają linii ani licznika. Wyjaśnia N-2, N-3 oraz otwarte C-5.

## 5. Ustalenia według obszaru

### 5.1 Dziecko na starcie i w rundzie (#90)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-2 | `src/scenes/TaskScene.ts` `backToAge`; `src/core/placement.ts` `ageBackOffered` | missing-context | low | Dziecko stuka „Wróć”, wybiera inny wiek i dostaje inny etap. Porzucona runda nie trafia do historii (zgodnie z planem). Rodzic widzi w panelu etap, którego nie wybierał, bez informacji, że dziecko samo się przestawiło; `stageOverriddenByParent` jest false w obu przypadkach. Ten sam wzorzec co C-5 (rozgrzewka cicho obniża etap). | Runtime albo mały licznik poza formatem (`placedBy: 'child-back'`, liczba powrotów) i jedna wyciszona linia przy etapie w panelu. Format v4 bez zmian. |
| N-3 | `src/core/round/variety.ts` `pickVariedSkills` (`open.length > 0 ? open : pool`), `pickVariedFromStage` | swallowed | low | Gdy pula nie ma innego typu, reguła F-03 rozluźnia się po cichu; cap liczony w kolejności losowania pozwala na 3 zadania jednego typu (FU-PF „F3”, E2 krok 5: 3 × ADD_SUB). Jedynym sygnałem jest kolejna notatka z playtestu. | Zwracać obok umiejętności flagę `relaxed` i liczyć ją w tym samym liczniku runtime co `onFallback`; w e2e hooku `round.varietyRelaxed`. |

### 5.2 Zębatka i ustawienia rodzica (#90, #91)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-1 | `src/scenes/UIScene.ts` `openSettings` (`background: hiddenMs > 0`) → `src/core/artHealth.ts` `artHealthLines` → `pl.settings.artCutBackground` | flattened-response | low | Po H-1 odcięcie oznacza, że skończył się czas **widoczny** (wolne łącze). Każde ukrycie, nawet 1 s, zamienia jednak linię na „bo gra była w tle… Uruchom grę ponownie”. Rodzic na wolnym łączu restartuje i znów dostaje odcięcie, bez rady „przy lepszym internecie”. Konsola ma prawdę (`hidden N ms`). Przyjęte w planie jako A-3. | `background` tylko wtedy, gdy ukrycie trwało dłużej niż np. połowa limitu albo gdy pliki w locie przy ukryciu nie wróciły; inaczej zwykła linia `artCut`. |
| N-5 | `src/scenes/UIScene.ts` `showHintOnce` (`REGISTRY_KEYS.settingsHintShown`, raz na ładowanie strony) | missing-context | low | Podpowiedź „Przytrzymaj…” znika po 3 s i nie wraca do przeładowania. Rodzic, który ją przegapił, znów widzi zębatkę „bez reakcji” (pierwotny F-02 a). Hook e2e widzi `settingsHint`, człowiek nie ma śladu. Znane jako FU-PF „Settings hint on every tap vs once”. | Zostawić do notatki z playtestu (trigger FU-PF); ewentualnie podpowiedź także przy drugim stuknięciu po N s. |

### 5.3 Start gry i awarie (#91)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-4 | `src/core/save.ts` `errorCode` wobec `src/core/round/dragLayout.ts` `coinLayout`, `src/core/tasks/written.ts` `columnSteps`/`columnMarks`, `src/ui/widgets/faceDraw.ts` | identity-lost | medium | `Kod:` na „Ups!” ma umiejętność tylko dla błędów z `generateTask`. Portfel z za dużą liczbą rodzajów monet, słupek, który pożycza poza kolumną, albo nieznana figura rzucają przy rysowaniu i dają `Kod: Error` / `RangeError` bez id. Zdjęcie karty od rodzica nie wskaże zadania. (Zawężona część C-2; `assertDrawable` pokrywa ikony, rząd, dzbanki, pieniądze i linię liczbową.) | Dołożyć `coinLayout` i `columnMarks` do `assertDrawable` (to czyste funkcje z `core`) albo owinąć `TaskPicture.render` / `modeWidgets` w `Skill <id>` z `skillId`. |
| N-6 | `src/main.ts` callback `installErrorBoundary` (`errorCode(error)`, gdzie `error` = `event.error ?? event.message`) | identity-lost | low | Gdy przeglądarka da zdarzenie `error` bez obiektu błędu (stary WebKit, błąd w obsłudze zdarzenia), kod to `Error`, bo `errorName` czyta `name` z ciągu znaków. Karta mówi `Kod: Error`, konsola ma komunikat. Rzadkie. | Przy wartości tekstowej `Kod:` z pierwszych słów komunikatu albo stała `NoErrorObject`. |

### 5.4 Platforma i infrastruktura

Run nie zmienił `scripts/`, `vite/`, `deploy/` ani `.github/`. Ustalenia I-2, I-4, I-7, I-8, I-9, I-11, H-7, H-8 z poprzedniego raportu są nadal otwarte (kod bez zmian, § 7). Brak nowych ustaleń.

## 6. Rekomendowana kolejność poprawek

1. **H-2 + N-1 razem (linie „Obrazki”).** Czytać `cutByTable.task + room + ui` zamiast `cut.length` i uzależnić wariant „w tle” od czasu ukrycia, który mógł zaszkodzić. Jedna zmiana w `UIScene.openSettings` i `artHealthLines`, testy czystej reguły, bez nowych danych.
2. **N-4 (id umiejętności przy rysowaniu).** `coinLayout` i `columnMarks` w `assertDrawable`; zamyka resztę C-2 i daje pełny `Kod:` na każdej „Ups!” z rundy.
3. **Reszta otwartych MEDIUM z 2026-10-17:** Z-1, Z-3, Z-4, Z-5, Z-6 (zapis), H-3, H-4 (obrazki), C-4, C-5 (zapasy w losowaniu), I-4, I-9 (platforma). Bez zmian priorytetów względem poprzedniego raportu.
4. **Ślady decyzji (N-2, N-3, C-5):** jeden licznik runtime „runda/rozgrzewka/etap” z flagami `relaxed`, `childBack`, `warmupLowered` i jedna wyciszona linia w panelu.
5. **Niskie:** N-5 (czeka na playtest), N-6, pozostałe LOW z poprzedniego raportu.

Ograniczenia każdej poprawki: nic nie opuszcza urządzenia; tekst dla rodzica tylko w `src/data/pl.ts`; `src/core` bez przeglądarki; zapis zostaje v4 (liczniki poza formatem albo runtime).

## 7. Zmiany od ostatniego audytu (2026-10-17 10:21)

| Poprzedni id | Status | Dowód |
|---|---|---|
| H-1 (limit na zegarze ściennym przy ukrytej karcie, HIGH) | **fixed** | `bootLimitDue(schedule, wall, hiddenMs)`, `bootLimitReached`, `onVisibility` w `BootScene.preload` zdejmuje i uzbraja timery; `bootLoad.hiddenMs`; e2e #15 H-1. Urządzenie fizyczne niezmierzone (FU-BHT „Real-device hidden-tab measurement”). Nowa drobna nieścisłość: N-1. |
| I-1 (karta „Ups!” bez przyczyny) | **fixed** | `mountErrorCard(…, errorCode(error), …)` → `pl.saveFailed.detail`; tekst z `/<skillId>` dla błędów generowania. Przypadek bez obiektu błędu: N-6. |
| Z-8 (`siteDataAdvice` po `NewerSave`) | **fixed** | `failureText` zwraca `deviceNewer` dla `NEWER_SAVE`; `replace` woła `refuseWrites('newer', …)`, więc `onBlocked` podnosi kartę; `replace` nie może dostać innej odmowy (pomija kontrolę piszącego). Fokus po zamknięciu dialogu: VG-1 w `openDialog`. |
| C-1 (`drawPrompt` bez `skillId`) | **fixed** | `pictureLayout(…, task.skillId)` w `TaskScene.drawPrompt`. |
| C-2 (asercje puli przy rysowaniu bez id) | **changed** (zawężone) | `assertDrawable` w `generateTask` dla ikon, rzędu, dzbanków, pieniędzy, linii liczbowej; `coinLayout`, `columnSteps`/`columnMarks`, `faceDraw` nadal przy rysowaniu (N-4). |
| C-3 (`numberChoices` poza `try`) | **fixed** | Kafelki w tym samym `try` co generator. |
| I-3 (nazwa błędu generatora tracona) | **fixed** | `skillFailure` ustawia `name` przyczyny. |
| H-2 (`cut` liczy dźwięki i czcionkę) | still open (rozszerzone) | `UIScene.openSettings` nadal przekazuje `bootLoad.cut.length`; nowy wariant „w tle” dziedziczy błąd. |
| H-6 (szum `loaderror` przy odcięciu) | still open | FU-BHT „H-6”. |
| C-5 (rozgrzewka bez powtórzeń przy brakujących obrazkach) | still open | `buildWarmup` zmienił tylko wybór umiejętności (`pickVariedFromStage`); `distinctTasks` z gołym `generateTask`, bez pętli `artRetries`. |
| H-3, H-4, H-5, H-7..H-11 | still open | Pliki (`artHealth.ts` poza linią `cut`, `BootScene.withCauses`, `check-deploy.ts`, `sound.ts`, `errorSignal.ts`, `soundPrefs.ts`) bez zmian w tych symbolach. |
| Z-1..Z-7, Z-9..Z-12 | still open | `autosave.ts` zmieniony tylko w gałęzi `NEWER_SAVE` w `replace`; `saveHealth.ts`, `saveChannel.ts`, `writerId.ts`, `saveFile.ts`, `UIScene.openExport` bez zmian. FU-BHT „S12-11”: nieudany `replace` nadal liczy się jako awaria autozapisu. |
| C-4, C-6..C-10 | still open | `buildAdaptiveRound` zmienił tylko wybór umiejętności (`variedRound`); pętla `artRetries` bez sygnału. |
| I-2, I-4, I-7, I-8, I-9, I-11 | still open | `errorBoundary.ts`, `idb.ts`, `e2eHookGuard.mjs`, `deploy.yml`, `narrator.ts` (`safely`) bez zmian. |

## 8. Metoda i ograniczenia

- **Sposób:** jeden czytelnik całego diffu runu (ten agent), bez subagentów. Diff ma 458 dodanych linii w 26 plikach `src/`, czyli około pięć razy mniej niż run 2026-10-16, przy którym poprzedni raport wybrał czterech audytorów. Najpierw diff w całości, potem wywołania (`errorBoundary.ts`, `autosave.ts` `replace`, `unique.ts`, `retry.ts`, widżety z `assertPool`, `narrator.ts`), plan i follow-upy obu zmian.
- **Sprawdzone ręcznie:**
  - `Autosaver.replace` pisze `write(state, 'replace')`, które pomija kontrolę innego piszącego, więc `NewerSave` to jedyna odmowa przy zastąpieniu (Z-8 zamknięte w całości, nie tylko dla jednej nazwy);
  - `src/scenes/TaskScene.ts` nie ma żadnego `catch`, więc `skillFailure` dociera do granicy z `skillId`;
  - `UIScene.openSettings` nadal przekazuje `bootLoad.cut.length`, a `background` z `hiddenMs > 0` (H-2, N-1);
  - `coinLayout`, `columnSteps`/`columnMarks` i `faceDraw` rzucają bez `skillId` i nie są w `assertDrawable` (N-4);
  - dostępność polskiego głosu jest badana przy tworzeniu lektora (`voiceschanged`), niezależnie od `autoReadStages` `[]`;
  - przegląd repozytorium: liczniki `catch`, `console.error`, `console.warn` identyczne jak na `d235d0d`;
  - run nie dodał parametrów `?e2e…` ani nie zmienił `vite/e2eHookGuard.mjs`.
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond, przeglądarki ani e2e; zielone e2e runu (143 passed na `1a9f661`, CI i Deploy zielone według `run-log.md`) cytowane, nie powtarzane.
  - H-1: zatrzymanie kolejki loadera Phasera przy ukrytej karcie i zachowanie plików w locie na iPadzie i Androidzie wynikają z kodu, nie z pomiaru; e2e fałszuje `document.hidden`. Wiersz [human] 2.6 planu (FU-BHT) czeka.
  - N-6: zdarzenie `error` bez obiektu błędu na iPadOS nieweryfikowane.
  - Czy „Wróć” po `flush('now')` zawsze zdąży zapisać `learner: null` przed przeładowaniem: e2e korzysta z bariery `writesDone` (FU-PF „F2”); inne specy z przeładowaniem nadal czekają na `dirty false`, co może przeciąć zapis w locie.
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (trzy), bez pytania. Odrzucone: wybór z dokumentów bazowych i rotacja na nieaudytowane przepływy. Zmieniłoby to polecenie opiekuna, by audytować inne przepływy.
- **`--runtime`:** nieuruchomiony, bo krok jest wyraźnie statyczny. Zmieniłoby to przekazanie `--runtime` albo nowe HIGH/CRITICAL wymagające dowodu.
- **Subagenci:** jeden czytelnik zamiast domyślnych równoległych audytorów. Powód: diff runu ma około 460 linii (poprzedni raport wybrał subagentów przy około 2430 liniach i zapisał, że run „rzędu kilkuset linii” zmieniłby tę decyzję). Zmieniłby to diff powyżej około 1500 linii albo zmiany w `deploy/` i `scripts/`.
- **Poprzedni raport:** 2026-10-17 10:21 (najnowszy na `main`), wskazany w poleceniu kroku.
- **Ważność N-1:** LOW, nie MEDIUM. Za LOW: konsola ma prawdziwy czas ukrycia, a plan przyjął ryzyko (A-3). Za MEDIUM: zdanie wskazuje złą przyczynę i usuwa radę o łączu. Zmieniłoby to zgłoszenie rodzica, który restartował w kółko po linii „w tle”.
- **Ważność N-4:** MEDIUM, bo to jedyna pozostała droga, przy której karta „Ups!” z rundy nie wskaże zadania (rubryka „widoczne, ale niediagnozowalne” w ważnym przepływie, złagodzone przez to, że walidator treści zwykle łapie te dane wcześniej). Zmieniłby to test pokazujący, że `validateTask` już wyklucza wszystkie trzy rzuty.
- **Pytania skilla do użytkownika** (dostosowanie obszarów, sondy, usunięcie harnessu): nie zadane, zgodnie z kontraktem runu. Wybrano domyślne.
