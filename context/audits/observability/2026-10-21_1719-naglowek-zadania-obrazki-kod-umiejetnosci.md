---
type: observability-audit
date: 2026-10-21 17:19
mode: audit
commit: 81115ee
branch: docs/observability-audit-2026-10-21-post-run-polish
dirty_tree: false
areas: [child-round-heading-sign-fill-calculate-narrator-variety-cap-repair, parent-obrazki-picture-only-cut-no-background-line, task-build-failures-skill-id-wallet-written-column]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-20_2151-start-runda-zebatka-ukryta-karta.md
findings: { critical: 0, high: 0, medium: 0, low: 2 }
---

# Audyt obserwowalności: nagłówek zadania, „Obrazki” bez dźwięków, kod umiejętności przy budowie zadania (2026-10-21)

Ten raport zamyka run `2026-10-21-post-run-polish`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #94 | fix `post-run-polish` (nagłówki „Wstaw znak”/„Uzupełnij”/„Oblicz”, naprawa limitu 2 na typ (F3), N-1, H-2, N-4 z audytu 2026-10-20) | `81115ee` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Runda dziecka:** nagłówek zadania na ekranie i u lektora (`headingOf`), losowanie z naprawą limitu 2 na typ (`repairCap`).
- **Panel rodzica, „Obrazki”:** liczba odciętych plików liczy tylko obrazki (`pictureCutCount`), zdanie „bo gra była w tle” usunięte.
- **Awarie przy budowie zadania:** `assertDrawable` sprawdza portfel (`pay.tray`) i słupek (`columnMarks`), więc `Kod:` na „Ups!” niesie id umiejętności.

Zakres: diff runu `ba3a7c4..81115ee` w `src/` i `scripts/` (11 plików, +100/−30; `vite/`, `deploy/` i `.github/` bez zmian). Follow-upy runu cytuję jako „FU-PRP” (`context/archive/2026-10-21-post-run-polish/follow-ups/review-fixes.md`), nie powielam. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 2 LOW (nowe).** Run zamknął jedyne MEDIUM poprzedniego audytu (N-4) oraz H-2 i N-1. Nie dodał żadnego `catch`, `console.*` ani cichego fallbacku: liczniki przeglądu repozytorium są identyczne jak na `1a9f661`.
- **N-4 naprawione:** `assertDrawable` (`src/core/tasks/visual.ts`) rzuca `RangeError` dla portfela z więcej niż `TASK_LAYOUT.coinDrag.maxKinds` rodzajami monet (to samo źródło co `coinLayout`) i woła `columnMarks(v, 'all')`, które przechodzi przez `columnSteps`. Oba rzuty są wewnątrz `try` w `generateTask`, więc `skillFailure` dokłada `skillId`. Rzut w `faceDraw` to tylko gałąź `never`, a `parseFace` zwraca `null` zamiast rzucać.
- **H-2 naprawione:** `UIScene.openSettings` podaje `pictureCutCount(bootLoad.cutByTable)` (task + room + ui). Odcięte dźwięki trafiają do `soundHealth` („Dźwięki”), czcionka do `fontHealth`.
- **N-1 naprawione:** wariant `background` i `pl.settings.artCutBackground` zniknęły; odcięcie ma zawsze linię `artCut` z radą o łączu. Konsola nadal podaje `(hidden N ms)`, gap 153 zamknięty w `docs/design-gaps.md`.
- **Nowe LOW:** w Zakrywance lektor mówi „Oblicz.”, a ekran nie rysuje nagłówka i hook e2e ma `heading: null` (N-7, zachowanie sprzed runu, ale teraz sprzeczne z deklaracją „ekran i lektor dzielą `headingOf`”); `repairCap` zmienia losowanie bez żadnego śladu i w przypadku wymuszonym po cichu zostawia 3 zadania jednego typu (N-8, zawęża N-3).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-20 21:51)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA, bez trackera i sieci w czasie gry. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`errorCode` w `src/core/save.ts`), panel rodzica za bramką, konsola tabletu, log CI smoke'u deployu.
- **Budowa zadania:** `generateTask` (`src/core/tasks/generateTask.ts`) ma jeden `try` dla generatora, `assertDrawable` i kafelków; błąd wychodzi jako `skillFailure` (nazwa przyczyny, `Skill <id>: …`, `cause`, `skillId`). `assertDrawable` obejmuje teraz także `money.pay` (`maxKinds`) i `column` (`columnMarks` → `columnSteps`), dla `visual` i `hintVisual`. W scenie zostały: `coinLayout` (ten sam limit, więc niedostępny), `coinLayout` przy miejscu w portfelu (czas gestu, pilnowany przez `balance.coinDrag.maxTotal`) i `faceDraw` (gałąź `never`).
- **Nagłówek:** `headingOf` (`src/core/round/heading.ts`) jest jedyną regułą: brak wyrażenia → brak; odpowiedź tekstowa → `sign`; okienko poza końcowym `= □` → `fill`; inaczej `calculate`. `TaskScene.drawPrompt` rysuje `pl.round.heading[kind]` i zapisuje `drawnHeading` (hook e2e: `heading`); `spokenTask` czyta ten sam nagłówek, chyba że `headings` jest `null` (tylko runda `word`). `scripts/sample.ts` drukuje linię `czyta:` z nagłówkiem, więc czytanie nauczycielskie go widzi.
- **Losowanie:** `pickVariedSkills` zapamiętuje pulę każdego losowania i oddaje wynik `repairCap` (bez rng; backtracking po typach z puli każdego losowania, zmieniony slot dostaje pierwszą umiejętność nowego typu). Pule są już po `withoutArtBlocked` i `withPictures` (`buildAdaptiveRound` w `src/core/curriculum.ts`), więc naprawa nie wprowadza brakujących obrazków. Brak przydziału → wynik zachłanny bez zmian i bez sygnału.
- **„Obrazki”:** `artHealthLines` dostaje `cut` = `pictureCutCount(cutByTable)`; `ArtHealthLine` `cut` nie ma już pola `background`. `bootLoad.hiddenMs` zostaje w rekordzie i w konsoli.
- **Seamy e2e:** run nie dodał parametrów `?e2e…` ani nie zmienił `vite/e2eHookGuard.mjs`; hook dostał tylko pole odczytu `heading`.
- **Przegląd repozytorium** (`src/` bez `src/testing`, ten sam wzorzec co poprzednio):

  | | 1a9f661 | 81115ee |
  |---|---|---|
  | linie z `catch` | 68 | 68 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 53 | 53 |

## 3. Co dociera do obserwatora (statycznie; e2e runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Generator daje portfel z 5 rodzajami monet | „Ups!” zanim zadanie się narysuje | `Kod: RangeError/<skillId> · build` | stack `Skill <id>: 5 coin kinds…` z `cause` | **diagnozowalne** (N-4) |
| Słupek przenosi poza ostatnią kolumnę / pożycza poza górną | „Ups!” przy budowie | `Kod: RangeError/<skillId>` | `Skill <id>: columnMarks…` / `columnSteps…` | **diagnozowalne** (N-4) |
| Start odcina tylko dźwięki | cisza efektów | „Dźwięki”: brakujące efekty; „Obrazki” bez linii odcięcia | `Boot load cut … (hidden N ms)` | **zgodne** (H-2) |
| Wolne łącze, krótkie ukrycie, odcięcie obrazków | zapasy | `artCut`: „Przy lepszym internecie uruchom grę ponownie.” | `(hidden 2000 ms)` | **zgodne** (N-1) |
| Zadanie z okienkiem w środku („□ + 3 = 8”) | „Uzupełnij” | — | hook `heading: 'Uzupełnij'`, `sample` `czyta: Uzupełnij. …` | widoczne |
| Zakrywanka: lektor na rzucie | brak nagłówka na ekranie, lektor „Oblicz. 3 plus 4” | — | hook `heading: null`, `narration` z „Oblicz.” | rozjazd (N-7) |
| Pule wymuszają 3 zadania jednego typu | 3 zadania jednego typu | nic | nic | bez śladu (N-8) |
| `repairCap` podmienia umiejętność | inna umiejętność niż wylosowana | nic | nic | bez śladu, zgodnie z planem (N-8) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord ma szczegół, linia go zwija** (z poprzednich raportów). Run naprawił najostrzejszy przypadek (H-2: `cutByTable` zamiast `cut.length`). Nadal otwarte: H-3, H-4, Z-1 (linie przyczyn i zapisu). Bez zmian w tym runie.
2. **Id umiejętności tylko na granicy generowania.** Teraz pokrywa wszystkie rzuty zależne od danych zadania: `assertDrawable` ma ikony, rząd, dzbanki, pieniądze, portfel, słupek i linię liczbową. Przyczyna praktycznie zamknięta; pozostaje N-6 (zdarzenie `error` bez obiektu błędu).
3. **Reguły losowania bez rekordu runtime.** `repairCap` i rozluźnienie reguły różnorodności działają, ale nie zostawiają licznika ani pola w hooku. Wyjaśnia N-8 (wcześniej N-3), N-2, C-5.
4. **„Jedna reguła” z wyjątkami po stronie wywołującego.** `headingOf` jest jedna, ale o tym, czy nagłówek w ogóle jest, decydują osobno `TaskScene.drawPrompt` (wczesny powrót dla `dice`, `wordRound`) i `TaskScene.currentNarration` (tylko `word`). Wyjaśnia N-7.

## 5. Ustalenia według obszaru

### 5.1 Runda dziecka: nagłówek i losowanie

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| N-7 | `src/scenes/TaskScene.ts` `currentNarration` (`headings: this.kind === 'word' ? null : pl.round.heading`) wobec `drawPrompt` (`if (this.kind === 'dice') return`); `src/core/minigames/dice.ts` (`prompt: "a + b"`) | drift (ekran vs lektor) | low | W Zakrywance ekran nie rysuje nagłówka, a głośnik czyta „Oblicz. 3 plus 4”. Hook e2e pokazuje `heading: null` i jednocześnie `narration` z „Oblicz.”, a test „nagłówek narysowany i przeczytany” (p9) obejmuje tylko zwykłą rundę, więc rozjazd nie ma żadnego sygnału. Zachowanie istniało przed runem (stare `spokenTask` dodawało „Oblicz” dla każdego wyrażenia); nowy komentarz w `spokenTask` mówi, że `null` to tylko runda słów. | Jedna decyzja „runda ma nagłówki” (`kind === 'round' \|\| kind === 'puzzle'`) dla obu wywołań albo `headings: null` także dla `dice`; asercja w specu Zakrywanki `heading === null` ⇒ narracja bez nagłówka. |
| N-8 | `src/core/round/variety.ts` `repairCap` (`if (!walk(0)) return [...drawn]`, `pools[i].find(...)`), `pickVariedSkills` | swallowed (rozluźnienie reguły) | low | Gdy pule wylosowanych kubełków nie pozwalają na limit 2, runda ma po cichu 3 zadania jednego typu (dokładnie to, co playtest F-03 zgłosił); jedynym sygnałem jest kolejna notatka rodzica. Gdy naprawa się udaje, slot dostaje zawsze **pierwszą** umiejętność nowego typu w puli, więc przy częstych naprawach ta umiejętność jest nadreprezentowana, a nikt tego nie widzi (brak pola w hooku i logu). Zawęża N-3: pierwotne zachłanne rozluźnienie jest teraz naprawiane, gdy to możliwe. FU-PRP „N-3” ma trigger. | `repairCap` zwraca `{ skills, repaired, forced }`; licznik runtime obok `onFallback` i pole `round.variety` w hooku e2e; w `npm run sample` linia z liczbą rund wymuszonych na 1000 losowań dla każdego kroku. |

### 5.2 Panel rodzica, „Obrazki”

Brak nowych ustaleń. H-2 i N-1 zamknięte (§ 7). Uwaga bez rangi: `pictureCutCount` przyjmuje `Partial<Record<…>>` i czyta rekord przez rzutowanie w `UIScene.openSettings`; rekord bez `cutByTable` (nie istnieje w obecnym `BootScene`, który zawsze go ustawia) dałby 0 zamiast liczby. FU-PRP „E2e for a sounds-only cut” pozostaje otwarte, więc przypadek „tylko dźwięki” jest dowiedziony testem jednostkowym (p6), nie przeglądarką.

### 5.3 Awarie przy budowie zadania

Brak nowych ustaleń. N-4 zamknięte (§ 7). N-6 (zdarzenie `error` bez obiektu błędu daje `Kod: Error`) nadal otwarte, FU-PRP „N-6”.

### 5.4 Platforma i infrastruktura

Run nie zmienił `vite/`, `deploy/` ani `.github/`. I-2, I-4, I-7, I-8, I-9, I-11, H-7, H-8 nadal otwarte (kod bez zmian). Run-log zapisuje deploy `81115ee` jako „pending (GitHub webhook incident)”; audyt nie sprawdzał produkcji.

## 6. Rekomendowana kolejność poprawek

1. **Reszta otwartych MEDIUM z 2026-10-17:** Z-1, Z-3, Z-4, Z-5, Z-6 (zapis), H-3, H-4 (linie przyczyn obrazków), C-4, C-5 (zapasy w losowaniu i rozgrzewce), I-4, I-9 (platforma). To teraz jedyne MEDIUM w projekcie.
2. **Ślady decyzji (N-8, N-2, C-5):** jeden licznik runtime „runda/rozgrzewka/etap” z flagami `repaired`, `forced`, `childBack`, `warmupLowered`, pole w hooku e2e i jedna wyciszona linia w panelu. Format v4 bez zmian.
3. **N-7:** jedna decyzja o nagłówku dla ekranu i lektora plus asercja w specu Zakrywanki. Mała zmiana w `TaskScene`, bez nowych danych.
4. **Niskie:** N-5, N-6 i pozostałe LOW z poprzednich raportów.

Ograniczenia: nic nie opuszcza urządzenia; tekst tylko w `src/data/pl.ts`; `src/core` bez przeglądarki; zapis zostaje v4.

## 7. Zmiany od ostatniego audytu (2026-10-20 21:51)

| Poprzedni id | Status | Dowód |
|---|---|---|
| N-1 (zdanie „bo gra była w tle” przy każdym ukryciu, LOW) | **fixed** | `ArtHealthLine` `cut` bez `background`; `ArtHealthLinesInput.background` usunięte; `pl.settings.artCutBackground` usunięte (brak odwołań w `src/` i `tests/`); `artHealthView` `textOf` zwraca zawsze `artCut`; gap 153 „Closed by post-run-polish”. Konsola `Boot load cut … (hidden N ms)` bez zmian. |
| N-4 (`coinLayout`, `columnSteps`/`columnMarks`, `faceDraw` rzucają bez id, MEDIUM) | **fixed** | `assertDrawable`: `money.pay.tray.length > TASK_LAYOUT.coinDrag.maxKinds` → `RangeError`; `column` → `columnMarks(v, 'all')` (woła `columnSteps`, więc oba rzuty); wywołanie wewnątrz `try` w `generateTask` → `skillFailure` z `skillId`. `faceDraw`: jedyny `throw` w gałęzi `never`; `parseFace` zwraca `null`. Test p7 („drawing limits fail at generation with the skill id”). |
| H-2 (`cut` liczy dźwięki i czcionkę) | **fixed** | `UIScene.openSettings` → `pictureCutCount(bootLoad.cutByTable)` (task + room + ui); `BootScene` zawsze zapisuje `cutByTable`; dźwięki w `soundHealth`, czcionka w `fontHealth`. Test p6; e2e dla samych dźwięków nadal brak (FU-PRP). |
| N-3 (reguła różnorodności rozluźnia się po cichu) | **changed** (zawężone) → N-8 | `repairCap` naprawia cap, gdy pule pozwalają (F3 zamknięte, test p4); przypadek wymuszony i sama podmiana nadal bez sygnału. |
| N-2 („Wróć” bez śladu zmiany etapu) | still open | `TaskScene.backToAge`, `ageBackOffered` bez zmian; FU-PRP „N-2”. |
| N-5 (podpowiedź zębatki raz na ładowanie) | still open | `UIScene.showHintOnce` bez zmian; FU-PRP „N-5”. |
| N-6 (`Kod: Error` bez obiektu błędu) | still open | `installErrorBoundary`, `errorCode` bez zmian; FU-PRP „N-6”. |
| C-2 (asercje przy rysowaniu bez id) | **fixed** | Reszta C-2 to była N-4. |
| H-3, H-4, H-5, H-6, H-7..H-11 | still open | `artHealth.ts` zmieniony tylko w linii `cut` i `pictureCutCount`; `BootScene`, `sound.ts`, `errorSignal.ts`, `soundPrefs.ts`, `check-deploy.ts` bez zmian. |
| Z-1..Z-7, Z-9..Z-12 | not re-checked | `src/core/autosave.ts`, `saveHealth.ts`, `saveFile.ts`, `src/storage/` bez zmian w diffie runu. |
| C-4, C-5, C-6..C-10 | still open | `buildAdaptiveRound` bez zmian poza `variedRound` (już wcześniej); `buildWarmup` bez zmian. |
| I-2, I-4, I-7, I-8, I-9, I-11 | not re-checked | `errorBoundary.ts`, `idb.ts`, `e2eHookGuard.mjs`, `deploy.yml`, `narrator.ts` bez zmian w diffie runu. |

## 8. Metoda i ograniczenia

- **Sposób:** jeden czytelnik całego diffu runu (ten agent), bez subagentów: 100 dodanych linii w 11 plikach, czyli mniej niż w poprzednim runie (458), przy którym też wybrano jednego czytelnika. Najpierw diff w całości, potem wywołania: `generateTask`, `written.ts` (`columnSteps`, `columnMarks`), `dragLayout.ts` (`coinLayout`), `faces.ts`/`faceDraw.ts`, `BootScene` (zapis `bootLoad`, `soundHealth`, `fontHealth`), `curriculum.ts` (`buildAdaptiveRound`, skąd pochodzą pule), `TaskScene` (`currentNarration`, `drawPrompt`, ścieżka `dice`), `minigames/dice.ts`, follow-upy runu i `docs/design-gaps.md` (153, 154).
- **Sprawdzone ręcznie:**
  - `assertDrawable` jest wewnątrz `try` w `generateTask`, a limit portfela czyta ten sam `TASK_LAYOUT.coinDrag.maxKinds` co `coinLayout` (`src/data/layout.ts`, 4);
  - `columnMarks(…, 'all')` woła `columnSteps`, więc oba rzuty słupka są pokryte; `'first'` tylko filtruje wynik `'all'`;
  - `parseFace` w widżetach zwraca `null` (rzuca tylko helper w `faces.ts`, sprawdzany przez `validateTask`), a `faceDraw` rzuca tylko w gałęzi `never`;
  - `BootScene` zawsze zapisuje `cutByTable` w `REGISTRY_KEYS.bootLoad`; `cutByTable` daje `sound` i `font` osobno;
  - `artCutBackground` nie ma odwołań w `src/` ani `tests/`;
  - pule dla `repairCap` są po filtrze brakujących obrazków i trybie obrazkowym;
  - w Zakrywance `drawPrompt` wraca przed nagłówkiem, a `currentNarration` podaje nagłówki (rozjazd N-7);
  - przegląd repozytorium: liczniki identyczne jak na `1a9f661`; brak nowych parametrów `?e2e…`.
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond, przeglądarki ani e2e; zielone bramki runu (CI, e2e) cytowane z `run-log.md`, nie powtarzane. Deploy `81115ee` był w run-logu „pending”, produkcja niesprawdzana.
  - N-7: czy lektor w Zakrywance faktycznie mówi „Oblicz.” — wniosek z kodu (`narrationOf` z `headings` ≠ `null`, prompt `a + b`), bez nagrania ani e2e.
  - N-8: jak często `repairCap` podmienia lub poddaje się na realnych etapach E1–E6 — nie mierzone (brak licznika; `sample` go nie drukuje).
  - Przypadek „odcięte tylko dźwięki” w przeglądarce (FU-PRP „E2e for a sounds-only cut”).
  - N-6 na iPadOS i zachowanie loadera przy ukrytej karcie na urządzeniu (z poprzedniego raportu) nadal niezmierzone.
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (trzy), bez pytania. Odrzucone: wybór z dokumentów bazowych i rotacja na nieaudytowane przepływy. Zmieniłoby to polecenie opiekuna, by audytować inne przepływy.
- **`--runtime`:** nieuruchomiony, krok jest wyraźnie statyczny. Zmieniłoby to przekazanie `--runtime` albo nowe HIGH/CRITICAL wymagające dowodu.
- **Subagenci:** jeden czytelnik zamiast domyślnych równoległych audytorów. Powód: diff runu ma około 100 linii w 11 plikach; ten sam próg co w poprzednim raporcie (około 1500 linii albo zmiany w `deploy/`/`scripts/` infrastruktury). Zmieniłby to większy diff.
- **Poprzedni raport:** 2026-10-20 21:51, wskazany w poleceniu kroku.
- **Ważność N-7:** LOW. Za LOW: lektor jest domyślnie wyłączony (`autoReadStages` `[]`), dziecko słyszy tylko po stuknięciu głośnika, a treść jest poprawna, brakuje tylko spójności z ekranem. Za MEDIUM: rozjazd ekran/lektor to dokładnie to, co run deklarował zamknąć jedną regułą, a hook e2e go nie wykrywa. Zmieniłaby to notatka z playtestu o mylącym „Oblicz” w Zakrywance.
- **Ważność N-8:** LOW. Za LOW: naprawa zmniejsza przypadki 3 zadań jednego typu, a przypadek wymuszony wynika z małych pul (zgodnie z planem). Za MEDIUM: bias na pierwszą umiejętność typu wpływa na opanowanie bez żadnego śladu. Zmieniłby to pomiar pokazujący, że naprawa zachodzi w większości rund jakiegoś kroku.
- **Z-* i I-*:** oznaczone `not re-checked` zamiast `still open`, bo ich pliki nie były w diffie runu i nie czytano ich ponownie.
- **Pytania skilla do użytkownika** (dostosowanie obszarów, sondy, usunięcie harnessu): nie zadane, zgodnie z kontraktem runu. Wybrano domyślne.
