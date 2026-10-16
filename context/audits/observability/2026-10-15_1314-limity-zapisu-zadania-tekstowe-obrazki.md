---
type: observability-audit
date: 2026-10-15 13:14
mode: audit
commit: eaeec52
branch: docs/observability-audit-2026-10-15-fix-s14c-s14d
dirty_tree: false
areas: [save-v2-backup-health, text-measure-time-types, e1-shapes-picture-mode]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-15_0253-zapis-v2-siatka-minigry-slupek.md  # PR #52, not in main
findings: { critical: 0, high: 0, medium: 14, low: 13 }
---

# Audyt obserwowalności: limity zapisu, zadania tekstowe, zadania z obrazkami (2026-10-15)

Ten raport zamyka run `2026-10-15-fix-s14c-s14d`. Run wydał trzy zmiany:

1. **Zapis: kopia v1 z limitem prób, limity czasu zapisu i odczytu, karta „Poczekaj dłużej”, panel „Zapis gry”** (PR #54, poprawka po audycie z PR #52).
2. **Zadania tekstowe: czas, jednostki, ceny, kolejność działań, nierówności z wieloma dobrymi kafelkami, liczby do miliona, runda powtórkowa E6.11** (PR #55, S-14c).
3. **Zadania z obrazkami dla 6-latków: figury na kafelkach, szlaczki, porównywanie, który z kolei, płacenie monetami przeciąganiem do portfela, tryb z obrazkami** (PR #56, S-14d, scalenie `eaeec52`).

Audyt jest statyczny, bez `--runtime`. Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po tym, co widzą trzy osoby:

- dziecko: kanwa i karty DOM;
- rodzic: panel ustawień za przytrzymaniem i bramką;
- opiekun z konsolą: zminifikowany kod bez map źródeł.

## 1. TL;DR

- **CRITICAL z poprzedniego audytu (SV2-01) jest zamknięty, podobnie jak trzy HIGH (SV2-02 i SV2-03 naprawione, SRR-02 częściowo).** Nowych CRITICAL ani HIGH nie ma. Zostaje 14 MEDIUM i 13 LOW.
- **Zdrowie zapisu dalej żyje tylko w pamięci strony (SVB-01, SVB-06).** „Zapisano v2 bez kopii v1” istnieje tylko w statusie sesji i w jednej linii konsoli. Od następnego startu nic o tym nie wie. Limit „3 próby” na tablecie to w praktyce 1 próba, bo ukrycie strony pomija kopię po pierwszej porażce.
- **„Przekroczono czas” wszędzie znaczy „nie udało się”, choć w IndexedDB zwykle znaczy „jeszcze trwa” (SVB-03, SVB-04).** Na wolnym iPadzie zdrowy zapis wygląda w panelu jak zepsuty. Import albo reset z przekroczonym czasem mówi „Obecne postępy zostały bez zmian”, a w trybie zablokowanym porzucony zapis może jednak wylądować.
- **„Poczekaj dłużej” gubi prawdziwy błąd (SVB-02).** Drugi odczyt odrzucony przez `UnknownError` jest traktowany jak kolejny timeout, bez logu. Rodzic dostaje „Kod: timeout”, a bramka zastąpienia zostaje zamknięta, choć prawdziwy błąd pozwoliłby na wymuszenie.
- **Nowe formy odpowiedzi nie mają cichego fallbacku typu, ale sprowadzają błąd do jednej wartości tak/nie.** Portfel z monetami i zbiory figur nie zostawiają przykładu błędu dla rodzica (PIC-04). „Dobra kwota, za dużo monet” wygląda tak samo jak zła kwota (PIC-05). OK w portfelu działa pod drugim palcem, gdy pierwszy niesie monetę (PIC-02, ta sama klasa co GRD-02).
- **Filtr obrazków i tryb obrazkowy nakładają się po cichu (PIC-01, PIC-03).** Przy brakującej grafice ikon „Który z kolei?” pokazuje skrzynki z napisami. Tryb obrazkowy podsuwa je właśnie dzieciom, które nie czytają. Ten sam tryb liczy próg odblokowania z kroku już przyciętego przez filtr, więc krok E1.11 może się nigdy nie odblokować.
- **Krok powtórkowy jest doklejony do mechaniki kroków (TXT-01, TXT-04).** Przy łagodzeniu E6.11 daje ok. 59% zadań z E5, których rodzic nie widzi w podglądzie postępów. Krok powtórkowy w środku etapu odblokowałby następny po jednej rundzie. Dziś to latentne, bo E6.11 jest ostatni.

## 2. Model przechwytywania (zmiany względem raportu 2026-10-15 02:53)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci. `installErrorBoundary` (`src/ui/dom/errorBoundary.ts`, `isFatalSignal`) pokazuje kartę „Ups!”, zatrzymuje pętlę i wywołuje `saver.block('fatal')`. Run nie zmienił granicy błędów, `vite/` ani `deploy/` (`git diff --stat 16848c6 eaeec52 -- vite deploy src/ui/dom/errorBoundary.ts src/core/errorSignal.ts` jest pusty).
- **Start (`src/main.ts` `start`, nowe):** pierwszy `loadSave` z `loadTimeoutMs`. Gdy kończy się `unavailable`/`timeout`, `slowCard` montuje kartę `pl.saveSlow` z przyciskami „Graj dalej” i „Poczekaj dłużej”. Drugi przycisk ściga ten sam odczyt z `slowLoadTimeoutMs`, ok. 20 s. Flaga `settled` rozstrzyga kartę raz. Spóźniony odczyt po „Graj dalej” trafia tylko do `console.warn('save: late read ignored')`.
- **Autozapis (`src/core/autosave.ts`, nowe):**
  - `withTimeLimit`/`limited` ściga każde wywołanie magazynu z `writeTimeoutMs` (5000 ms).
  - Kopia `backup-v1` ma do `backupAttempts` (3) prób na sesję. Potem `skipBackup` loguje `autosave: writing v2 without the v1 copy` i zapisuje v2.
  - Ukrycie strony po porażce kopii pomija kopię. `replace` próbuje zaległej kopii raz.
  - Status ma pola `backup` (`none|pending|failed|done|skipped`), `backupError` i `lastFailure {stage, error}`.
  - `src/storage/idb.ts` ma strażnika sekwencji zapisów (`writeSeq`/`mayRetry`), a porażkę `persist()` loguje.
- **Panel:** `saveHealthView` (`src/core/saveHealth.ts`) pokazuje w stanie `failing` liczbę prób, etap i kod. Linia migracji („kopia zachowana” albo „utracona”) pojawia się dopiero po udanym zapisie v2 (`migrationOf`).
- **Zadania (nowe):**
  - Kafelki z wieloma dobrymi odpowiedziami: `Task.check` wygrywa w `isCorrect`.
  - Twarze figur na kafelkach: kody `shape:…` w `src/core/tasks/faces.ts`, rysowane przez `faceDraw`.
  - Drugi rodzaj przeciągania: `coins`, ogólny reduktor `src/core/trayDrag.ts` i widżet `CoinWallet`.
  - Tryb obrazkowy: `src/core/pictureMode.ts` i `src/core/round/pictureFilter.ts`.
  - Krok powtórkowy `StepDef.review` (E6.11).
  - Walidator treści (`validateTask`, `canonicalInput`) działa tylko w testach i w `npm run sample`. W czasie gry nie działa.
- **Logowanie:** 26 bloków `catch` w `src/` bez `src/testing` (wcześniej 25) i 15 wywołań `console.*` (wcześniej 13). Doszły dwa: `save: late read ignored` i `save: persist() failed`. Brak trwałego logu i liczników między uruchomieniami.
- **Tożsamość wdrożenia:** bez zmian. `__BUILD_ID__`, bez map źródeł, wydanie nie niesie `SAVE_VERSION` (SV2-08 dalej otwarte).

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Opiekun / konsola | Werdykt |
|---|---|---|---|---|
| Kopia `backup-v1` odrzucana trwale | gra zapisuje się (v2 bez kopii) | „kopia v1 utracona” + kod, tylko w tej sesji i po zapisie | `autosave: backup failed`, `writing v2 without the v1 copy` | **caught w sesji, znika przy następnym starcie (SVB-01)** |
| Kopia przekracza czas na ukryciu strony | jak wyżej | „utracona (Kod: timeout)”, choć kopia mogła wylądować | jak wyżej | misattributed (SVB-01) |
| Zapis przekracza czas, ale ląduje później | nic | „Postępy… mogą nie zostać zachowane” do następnego zapisu | `write failed` z `timeout`; późny sukces porzucony | noise / misattributed (SVB-03) |
| Import/reset przekracza czas przy zablokowanym zapisie | — | „Obecne postępy zostały bez zmian” (może być fałsz) | log porażki | **misattributed (SVB-04)** |
| Odczyt przekracza czas przy każdym starcie | 5 s czekania + karta przy każdym starcie | „Poczekaj dłużej”, po 20 s rada „usuń dane strony” | `timeout` | caught, wyjście tylko poza aplikacją (SRR-02 częściowo) |
| Drugi odczyt (po „Poczekaj dłużej”) odrzucony `UnknownError` | karta „wciąż wolno” | „Kod: timeout”, bramka zamknięta | nic | **missed (SVB-02)** |
| Spóźniony udany odczyt po „Graj dalej” | sesja od 0 gwiazdek, bez zapisu | „uruchom ponownie” (prawda, ale bez „zapis już jest”) | `late read ignored` | logged-only (SVB-06) |
| `check` i kafelki się rozjeżdżają (przyszła treść) | utknięcie w przepisywaniu, wyjście tylko przez przeładowanie | nic | nic | missed, latentne (TXT-03) |
| Pierwsza podpowiedź „zdradza” odpowiedź | tylko „Spróbuj jeszcze raz” | nic | nic | missed (TXT-02; 3,5–5% w trzech starszych umiejętnościach) |
| Brak grafiki ikon w „Który z kolei?” | skrzynki z napisami, dziecko nieczytające zgaduje | słaba umiejętność; „Obrazki” osobno | `Task art missing` przy starcie | misattributed (PIC-01) |
| Tryb obrazkowy + brak grafiki monet/odważników | te same 2 umiejętności w kółko, krok się nie odblokowuje | nic | `Task art missing` | missed (PIC-03) |
| Drugi palec na OK portfela przy niesionej monecie | płatność bez monety / z monetą wyjmowaną, portfel pusty, potrząśnięcie | brak przykładu | nic | missed (PIC-02) |
| Zła płatność / zły zbiór figur | potrząśnięcie, ta sama podpowiedź dla „za dużo monet” i „zła kwota” | umiejętność bez przykładów | nic | missed (PIC-04, PIC-05) |
| Nieznany kod figury lub element szlaczka | surowy tekst `shape:…` albo podwójne „?” | nic | nic | missed, latentne (PIC-08, PIC-09) |
| E6.11 przy łagodzeniu | ok. 59% zadań z E5 | podgląd postępów pomija E5 | nic | missed (TXT-01) |

## 4. Systemowe przyczyny źródłowe

1. **Zdrowie zapisu tylko w pamięci, bez historii między uruchomieniami.** Ta sama przyczyna co w poprzednim raporcie. Run ją zawęził, ale nie usunął. Utrata kopii v1, spóźniony sukces odczytu, wolne starty i spóźnione zapisy giną razem ze stroną. Wyjaśnia SVB-01, SVB-03, SVB-06, a ze starszych SRR-07 i SRR-08.
2. **„Przekroczono czas” zrównane z „odrzucono”.** `withTimeLimit` porzuca wynik, a każda powierzchnia (panel, dialogi, stan kopii) traktuje timeout jak porażkę. W IndexedDB porzucona operacja zwykle się kończy, a zamrożony zegar ukrytej strony przyspiesza wygraną timera. Wyjaśnia SVB-01, SVB-03, SVB-04, SVB-08 i SVB-09.
3. **Gałęzie łagodzące gubią nazwę błędu.** `still-slow`, `persistence: 'error'` i `failureText` dla `timeout` zamieniają konkretny kod na ogólne zdanie właśnie tam, gdzie diagnoza się różni. Wyjaśnia SVB-02, SVB-04 i SVB-07.
4. **Testy są jedynym walidatorem treści.** `validateTask`, `canonicalInput`, `faces-distinct` i reguła przecieku podpowiedzi nie działają w czasie gry. Gdy reguła zawiedzie po wydaniu, widżety po cichu degradują: brak podpowiedzi, utknięcie w przepisywaniu, surowy kod na kafelku, dodatkowe „?”. Wyjaśnia TXT-02, TXT-03, TXT-07, TXT-08, PIC-08 i PIC-09.
5. **Ocena odpowiedzi sprowadzona do jednej wartości tak/nie, przykład tylko dla odpowiedzi skalarnych.** Nowe formy (zbiory figur, portfel) nie mówią dziecku ani rodzicowi, na czym polegał błąd. Wyjaśnia PIC-04, PIC-05 i PIC-06.
6. **Filtry pul nakładane jeden na drugi, każdy z własnym cichym fallbackiem i progiem.** Dotyczy filtra grafiki, trybu obrazkowego i kroku powtórkowego. Ich łączny skutek nie jest widoczny dla żadnego obserwatora: zablokowane odblokowanie, nieczytelne zastępniki podsuwane nieczytającym, waga przesunięta do poprzedniego etapu. Wyjaśnia PIC-01, PIC-03, PIC-10, TXT-01, TXT-04 i TXT-05.

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### Zapis: kopia v1 z limitem prób, limity czasu, „Poczekaj dłużej”, panel (PR #54)

Status poprzednich ustaleń jest w sekcji 7.

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| SVB-01 | `src/core/autosave.ts` `attempt` (gałąź `reason === 'hidden' && backupFails > 0`), `skipBackup`; `src/core/saveHealth.ts` `migrationOf` | identity-lost | medium | Zdarzenie „v2 zapisane bez kopii v1” żyje tylko w statusie sesji i w `console.error`. Następny start czyta już v2, więc `migratedFrom` jest null, a panel nigdy więcej o utracie nie wspomni. Limit 3 prób to na tablecie w praktyce 1, bo dzieci ciągle wychodzą z aplikacji, a ukrycie strony pomija kopię po pierwszej porażce. Kopia, która tylko przekroczyła czas (zegar zamrożony przy ukryciu strony), zostaje uznana za utraconą, choć jej `set` wciąż trwa. Wtedy „kopia utracona, Kod: timeout” jest fałszem. Komentarz nad gałęzią opisuje zachowanie inaczej niż kod. | Mały znacznik „kopia v1: zachowana/utracona/niepewna” pod własnym kluczem, pokazywany w kolejnych startach; timeout kopii ≠ utrata; ukrycie strony nie zużywa limitu; poprawić komentarz. |
| SVB-02 | `src/main.ts` `start` → `slowCard` → `onWait` (`if (late.kind === 'unavailable') return 'still-slow'`) | identity-lost | medium | Drugi odczyt po „Poczekaj dłużej” odrzucony prawdziwym błędem (`UnknownError`, `InvalidStateError`) jest traktowany jak kolejny timeout, bez logu. Karta pokazuje „wciąż wolno” z „Kod: timeout”. „Graj dalej” rozstrzyga pierwszym wynikiem, więc autozapis dostaje `loadError: 'timeout'`, panel mówi „odczyt trwał za długo”, a `replaceGate` zostaje zamknięta. Przy prawdziwym błędzie wymuszone zastąpienie byłoby dostępne. Konsola milczy. | Przy `unavailable` z błędem innym niż timeout rozstrzygnąć `late` (albo przenieść `late.error` do karty i autozapisu) i zalogować; `still-slow` tylko dla drugiego timeoutu. |
| SVB-03 | `src/core/autosave.ts` `attempt` (zewnętrzny `catch`), `withTimeLimit` („a late success is dropped”); `saveHealth.ts` `stateOf`; `pl.settings.saveFailing` | noise | medium | Zapis, który tylko przekroczył czas, zwykle i tak ląduje, ale liczy się jako porażka. Panel pokazuje „Postępy z tej gry mogą nie zostać zachowane” aż do następnego udanego zapisu. Na iPadzie zamrożony timer ukrytej strony po powrocie wygrywa z sukcesem IDB, więc zdrowy zapis na wolnym urządzeniu wygląda jak zepsuty. Zdanie dla „odrzucono” i „przekroczono czas” jest to samo. Spóźniony sukces jest porzucany bez śladu. | Rejestrować spóźnione rozstrzygnięcie (`lateWrites`, `lastWriteAt`); osobne zdanie „przekroczono czas, mogło się zapisać”. |
| SVB-04 | `src/core/autosave.ts` `replace` (`catch`); `src/ui/dom/saveSummaryView.ts` `failureText`; `pl.saveTransfer.applyFailed`/`resetFailed` | flattened-response | medium | Import albo reset z przekroczonym czasem mówi rodzicowi „Nie udało się… Obecne postępy zostały bez zmian.”, bez kodu. Porzucony zapis może jednak wylądować. W zwykłym przypadku nadpisuje go późniejszy zapis gry. W trybie zablokowanym (nieczytelny zapis albo wymuszone zastąpienie przy `unavailable`) nic go nie nadpisze. Następny start może wtedy pokazać zaimportowany albo wyzerowany stan, o którym rodzicowi powiedziano, że się nie stał. | Dla `timeout`: „nie potwierdzono, uruchom grę ponownie, żeby sprawdzić” z kodem; w trybie zablokowanym przeładowanie albo ponowny odczyt. |
| SVB-05 | `autosave.ts` `attempt` (porażki kopii 1–2 przez zewnętrzny `catch`); `saveHealth.ts` `stateOf` `failing` | flattened-response | low | „3 nieudane próby · zapis · Kod: X” może liczyć dwie porażki kopii z innym kodem i jedną porażkę zapisu. „Wcześniej: N” miesza etapy. | Liczniki per etap albo zerowanie przy zmianie etapu. |
| SVB-06 | `src/main.ts` `slowCard` `onWait` (`late read ignored`) | logged-not-captured | low | Spóźniony udany odczyt po „Graj dalej” trafia tylko do `console.warn`. Dziecko gra całą sesję od 0 bez zapisu. Rodzic nie dowie się, że zapis jest już czytelny i że ponowne uruchomienie go przywróci. | Flaga czasu działania `lateReadOk` i cicha linia w panelu „zapis jest już dostępny, uruchom grę ponownie”. |
| SVB-07 | `src/storage/idb.ts` `requestPersistence`; `pl.settings.savePersist.error` | flattened-response | low | Wyjątek z `persist()` jest logowany, ale tekst panelu dla `error` jest taki sam jak dla `denied`/`unsupported`. | Osobne zdanie albo kod. |
| SVB-08 | `autosave.ts` `replace` (`await inflight`, potem `limited` kopia i zapis) | config | low | Limit 5 s działa na jedno wywołanie, nie na akcję rodzica. „Wczytaj” lub „Zacznij od nowa” może czekać ok. 20 s z wyłączonymi przyciskami i bez wskaźnika postępu. Rodzic może zamknąć aplikację w trakcie zapisu. | Jeden limit na całe `replace` albo widoczne „zapisuję…”. |
| SVB-09 | `src/storage/idb.ts` `write` (`writeSeq`/`mayRetry`) | missing-context | low | Komentarz obiecuje, że porzucony zapis nigdy nie wyląduje po nowszym. Strażnik obejmuje tylko ponowienie po ponownym połączeniu, a pierwotny `set` nie jest przerywany. Zgodne z istniejącym follow-upem „Abort of an IDB transaction”. Przesadzony jest tylko komentarz. | Poprawić komentarz albo przerwać transakcję przy timeoucie. |

Sprawdzone jako dobre:

- Flaga `settled` działa: po „Graj dalej” spóźniony wynik nie zmienia rozstrzygnięcia i nie odblokowuje autozapisu, a `playedOnFirst` nie pokazuje drugiej karty.
- `flush('hidden')` nie jest ucinany przez timer w sensie danych.
- `replace` z przekroczonym czasem w trybie niezablokowanym ustawia `dirty` i planuje kolejny zapis.
- `replaceGate` jest wspólna dla `replace` i dialogów.
- `loadSave` nie wysyła drugiego `read()` przy zawieszonym pierwszym.
- `migrationOf` wymaga `writes > 0`.
- Escape jest zablokowany podczas zapisu.

### Zadania tekstowe, nierówności, liczby do miliona, E6.11 (PR #55)

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| TXT-01 | `src/core/curriculum.ts` `skillBuckets` (gałąź review, `earlier: []`); `src/core/progress.ts` `progressView` | coverage-gap | medium | Na E6.11 pula `earlier` jest pusta, więc jej waga przechodzi na `previous` (wszystkie umiejętności E5). Symulacja audytora na 300 rundach: 15% zadań z E5 przy zwykłych wagach, 59% przy łagodzeniu. Dziecko, któremu idzie słabo, przez 2 rundy gra głównie poprzedni semestr. Podgląd postępów rodzica ocenia tylko umiejętności bieżącego etapu, więc te błędy nie trafiają na listę najsłabszych. | Na kroku powtórkowym udział `earlier` przy łagodzeniu do `current` (albo limit `previous`); `progressView` z umiejętnościami poprzedniego etapu granymi w tym etapie. |
| TXT-02 | `src/core/round/hints.ts` `firstHint`/`leaksAnswer`; `tests/contentInvariants.test.ts`, `tests/hints.test.ts` (`if (first === null) continue`) | swallowed | medium | Gdy pierwsza linia podpowiedzi „zdradza” wynik, dziecko dostaje samo „Spróbuj jeszcze raz”. PR #55 poszerzył regułę przecieku o każdą wartość przyjmowaną przez `check`. Żaden test nie sprawdza, że umiejętność z ≥ 2 liniami podpowiedzi rzeczywiście pokazuje pierwszą. Próbka 200 losowań: nowe typy S-14c bez tłumienia; starsze tłumienia to `E2.6.arrow_graph_20` 4,5%, `E2.6.arrow_table_20` 3,5% i `E2.7.sequence_tens_100` 5% (zamierzone `E3.10.half_30` 100%). | Test per umiejętność: `firstHint` nie jest null przy `hint.length >= 2`, z jawną listą wyjątków i limitem udziału. |
| TXT-03 | `src/core/round.ts` `answer` (faza `retype`); `src/core/round/canonicalInput.ts` (`tiles`/`keypad` zwracają `task.answer` bez sprawdzenia) | coverage-gap | medium (latentne) | Rozwiązywalność zadania z wieloma odpowiedziami (`check` przyjmuje odpowiedź, ≥ 2 dobre i ≥ 1 zły kafelek) pilnują tylko testy. Gdy przyszła treść rozjedzie `check` z kafelkami, dziecko utknie w przepisywaniu na zawsze: bez „Dalej”, bez pominięcia, runda niezapisana. Jedyne wyjście to przeładowanie. Nie ma wyjątku, więc nie ma karty „Ups!”. To samo dotyczy zasięgu klawiatury (`maxDigits` 7 kontra sześciocyfrowe odpowiedzi, chronione tylko w `placeValue.test`). | `canonicalInput` dla keypad sprawdza liczbę ≤ `maxDigits`, dla tiles z `check` sprawdza `choices.some(check)`; opcjonalnie wyjątek albo log po N chybieniach w `retype`. |
| TXT-04 | `src/core/curriculum.ts` `unlockReady` | missing-throw | medium (latentne) | Gdy bieżący krok jest powtórkowy, `skills = []` i `unlockThreshold(0) = 0`, więc warunek `0 >= 0` od razu jest spełniony. Następny krok odblokowuje się po pierwszej rundzie. Krok powtórkowy dodany w środku etapu (sama zmiana danych) zostałby po cichu przeskoczony. Dziś bezpieczne, bo E6.11 jest ostatni, ale żaden test tego nie przypina. | `unlockReady` zwraca null (albo własną regułę) dla kroku review; test treści „krok powtórkowy jest ostatni”. |
| TXT-05 | `curriculum.ts` `stepPlayable`; `src/core/round/pick.ts` `pickRoundSkills` | missing-context | low | Krok powtórkowy jest „grywalny”, nawet gdy inne kroki etapu nie mają grywalnych umiejętności. Pierwsza runda rzuca wtedy `RangeError('No playable skills in any bucket')` bez etapu i kroku. | `stepPlayable` dla review wymaga innego grywalnego kroku; etap i krok w wyjątku. |
| TXT-06 | `curriculum.ts` `skillBuckets` (zasięg E6.11) | coverage-gap | low | E6.11 losuje z ok. 30 umiejętności E6 i E5. Ukryta awaria którejkolwiek daje losowe „Ups!” bez id umiejętności (WNA-02). Przeładowanie losuje rundę od nowa, więc błąd wygląda na sporadyczny. E6.11 to ostatni krok bez wyjścia. | Id umiejętności na karcie (WNA-02); testy losowań uruchamiane też przez budowę rundy E6.11. |
| TXT-07 | `src/core/tasks/generators/clockElapsed.ts` `fill` (`values[key] ?? ''`) | swallowed | low | Literówka w symbolu zastępczym szablonu z `src/data/elapsed.ts` cicho daje pusty tekst („zaczyna się o  i trwa”), który lektor też przeczyta. | Wyjątek dla nieznanego klucza albo test szablonów. |
| TXT-08 | `src/core/tasks/generators/placeValue.ts` parser (tysiące: `max >= 1000`), `drawFourDigit` | config | low | Parser przyjmuje `max: 1000`, przy którym generator zawsze rzuca po 1000 prób, czyli dopiero w grze. Łamie to regułę „parsery odrzucają niewykonalne dane”. Dane mają dziś 10000. | `max >= 1001` w parserze. |

Sprawdzone jako dobre:

- `isCorrect` daje pierwszeństwo `check`.
- `validateTask` (reguły `check-*`) i `solvableInMode` obejmują w CI każdą umiejętność.
- Przepisywanie i rozwiązanie INEQUALITY pokazują ten sam kanoniczny kafelek.
- Każda nowa pętla odrzucania ma `MAX_ATTEMPTS` i rzuca z parametrami, więc nie ma nowych zamrożeń.
- Odpowiedzi tekstowe (godziny, jednostki) idą tylko przez kafelki.
- `maxDigits` 7 mieści sześć cyfr.
- Żaden wygenerowany tekst (200 losowań na umiejętność) nie używa znaku spoza czcionki.
- E6.11 nigdy nie jest krokiem startowym ani rozgrzewką.

### Zadania z obrazkami dla 6-latków (PR #56)

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| PIC-01 | `src/core/round/artFilter.ts` `artBlocked` (brak `case 'ORDINAL'`); `src/data/pictureSkills.ts`; `src/core/tasks/generators/ordinal.ts` `generateOrdinal` | coverage-gap | medium | W ORDINAL („Na którym miejscu od lewej jest klucz?”) odpowiedź jest tylko na obrazku. Gdy grafiki ikon brak, `IconRow` rysuje skrzynki podpisane rzeczownikiem. Dziecko nieczytające nie odróżni „klucza” od „kłębka”. `artBlocked` nie zna ORDINAL, a tryb obrazkowy podsuwa to zadanie właśnie nieczytającym. Dziecko zgaduje dwa razy, dostaje rozwiązanie i je przepisuje. Rodzic widzi `ordinal_5` jako słabą umiejętność. Brak grafiki widać tylko w osobnej sekcji „Obrazki”. | `case 'ORDINAL'` w `artBlocked` (wszystkie ikony rzędu); tryb obrazkowy pomija umiejętności z brakującą grafiką. |
| PIC-02 | `src/ui/widgets/CoinWallet.ts` konstruktor, handler `ok` (`ActionButton`) | swallowed | medium | Zegar ignoruje OK pod drugim palcem, gdy wskazówka jest trzymana (`TaskScene.create`, `clockState.carrying`). Portfel nie ma tej osłony. OK pod drugim palcem wysyła `walletCoins(state.mat)`, gdy pierwszy palec niesie monetę: niesiona z tacy nie liczy się, a wyjmowana z portfela liczy się dalej. Przy pomyłce portfel się opróżnia i potrząsa, a dziecko nie wie dlaczego. To ta sama klasa co GRD-02. | `if (this.state?.carrying) return;` w handlerze OK; e2e dwoma palcami. |
| PIC-03 | `src/core/curriculum.ts` `buildAdaptiveRound` (`withPictures(..., unlockThreshold(afterArt.current.length, …))`) | coverage-gap | medium | Tryb obrazkowy liczy minimum z kroku już przyciętego przez filtr grafiki. `withoutArtBlocked` i `unlockReady` liczą je z pełnego kroku. Przykład: E1.11 ma 6 umiejętności, do odblokowania potrzeba 3. Bez grafiki monet i odważników zostają 3, próg trybu spada do 2, a tryb zostawia tylko CLOCK i MONEY_CHANGE. Krok nie odblokuje się, dopóki trwa tryb obrazkowy (6-latek wrzesień–styczeń albo łagodzenie w E1). Nikt tego nie widzi. | `unlockThreshold(buckets.current.length, share)` (pełny krok) w wywołaniu `withPictures`. |
| PIC-04 | `src/core/round.ts` `captureFirstWrong` (tylko liczba/tekst); `src/core/progress.ts` `formatValue` | identity-lost | medium | Odpowiedzi tablicowe nie zostawiają przykładu błędu: zbiory figur SHAPES `all` (nowe) i portfele MONEY_PAY (portfel jest już follow-upem, SHAPES `all` nie). Umiejętność jest wśród najsłabszych bez żadnego przykładu. Gdyby przechwycenie dodać bez zmiany formatowania, rodzic zobaczy grosze („500, 200”) zamiast „5 zł, 2 zł”. | Przechwytywać tablice; figury przez `faceText`, portfel przez `formatMoney` po `visual.pay`. |
| PIC-05 | `src/core/tasks/generators/moneyPay.ts` `walletCheck`; `src/scenes/TaskScene.ts` `submit` | flattened-response | medium | W wariancie „jak najmniej monet” błędy „dobra kwota, za dużo monet” i „zła kwota” wyglądają tak samo: to samo potrząśnięcie, opróżniony portfel i ta sama pierwsza podpowiedź. Dziecko, które zapłaciło 7 zł siedmioma monetami, nie dowie się, co było nie tak. | `check` zwraca powód; linia „Dobrze, ale można mniej monet” i zapis jako przykład. |
| PIC-06 | `src/core/tasks/generators/compareQty.ts` `generateCompareQty` (`rng.shuffle([left, right, same])`) | flattened-response | medium | COMPARE_QTY jest zadaniem trybu obrazkowego dla nieczytających, ale odpowiedzi to kafelki ze słowami („Po lewej”, „Po prawej”, „Tyle samo”), tasowane i nieczytane przez lektora. „Po lewej” może stać po prawej. Dziecko, które dobrze policzyło, chybia. Rodzic widzi to jako słabość w liczeniu, a nie barierę czytania. | Stała kolejność zgodna ze stronami albo strzałka na kafelku (jak twarz figury). |
| PIC-07 | `CoinWallet.ts` handler `ok` (`if (grosze.length > 0)`) | swallowed | low | OK przy pustym portfelu nic nie robi: bez potrząśnięcia i podpowiedzi. `SelectTiles` przyjmuje pusty zbiór jako zwykłą odpowiedź, więc dwa przyciski OK zachowują się różnie. | Delikatne potrząśnięcie albo zdanie lektora. |
| PIC-08 | `src/ui/widgets/PatternRow.ts` `render` | swallowed | low | Element szlaczka, który nie jest poprawnym kodem figury, rysuje się jako dodatkowe „?”. Poprzedni obiekt „?” jest nadpisywany bez `destroy()` i zostaje na ekranie w kolejnych zadaniach. Walidator działa tylko w testach. | Wyjątek z id umiejętności; niszczyć znaczniki. |
| PIC-09 | `src/ui/widgets/AnswerTiles.ts`, `SelectTiles.ts` (`parseFace(value) ? '' : String(value)`) | swallowed | low | Kod figury, którego parser nie zna (nowy kolor w danych), pojawia się na kafelku jako surowy tekst `shape:…`. Wyłapuje to tylko reguła walidatora w CI. | Tekst zaczynający się od `shape:`, którego `parseFace` nie rozpoznaje, rzuca wyjątek z id umiejętności. |
| PIC-10 | `src/core/pictureMode.ts` `pictureMode`; `src/scenes/TaskScene.ts` (wywołanie trybu) | config | low | Tryb obrazkowy jest niewidoczny dla rodzica i opiekuna, tak samo jak jego ciche fallbacki (pusta pula wraca cała; brak miesiąca wyłącza tryb). `learner.age` to wiek z pierwszego uruchomienia i nie rośnie. | „Tryb obrazkowy: tak/nie” w podglądzie postępów; data urodzenia albo umieszczenia zamiast wieku. |

Sprawdzone jako dobre:

- `dragMode` rzuca z id umiejętności, a `coinLayout` rzuca przy zbyt wielu rodzajach monet.
- Przełączniki przeciągania i `drawShape` są wyczerpujące (`never`).
- Parser MONEY_PAY dowodzi przy wczytaniu, że każdą kwotę da się zapłacić z tacy i zmieścić w portfelu.
- `artBlocked` obejmuje MONEY_PAY.
- `withPictures` nigdy nie opróżnia rundy.
- Kody figur nigdy nie docierają do dziecka ani rodzica jako tekst: `faceText`/`faceLabel` są w liniach rozwiązania, w `roundResults` i u lektora, a `faceLabel` rzuca dla złego kodu.
- Przepisywanie po rozwiązaniu działa dla figur (obrys kafelka) i monet (linie podpowiedzi wymieniają monety).
- `stepTrayDrag` obsługuje zgubione `up` tego samego palca.
- Hook e2e wystawia `dragMode`, `wallet` i `walletCarrying`.

### Platforma i infrastruktura

Audytor infrastruktury nie był uruchamiany (patrz decyzje). Granica błędów, konfiguracja PWA, `vite/` i `deploy/` się nie zmieniły. Przegląd repo przeprowadził syntezator: 26 bloków `catch` i 15 wywołań `console.*`. Doszły `save: late read ignored` (SVB-06) i `save: persist() failed` (SVB-07). SV2-08 (wycofanie do buildu sprzed #48) jest nadal otwarte, bo run nie dotykał `deploy/`.

## 6. Zalecana kolejność poprawek

1. **SVB-02 + SVB-04:** prawdziwy błąd drugiego odczytu przechodzi do karty, autozapisu i bramki; dla timeoutu `replace` komunikat „nie potwierdzono” z kodem, a w trybie zablokowanym przeładowanie. Mała zmiana, zamyka dwa miejsca, gdzie rodzic dostaje fałsz.
2. **PIC-02 + PIC-03 + PIC-01:** osłona OK portfela przy niesionej monecie (jedna linia, wzorzec zegara), próg trybu obrazkowego z pełnego kroku, `case 'ORDINAL'` w `artBlocked`. Mały wysiłek, a zamykają ścieżki, na których 6-latek utyka.
3. **SVB-01 + SVB-03 + SVB-06:** trwały znacznik stanu kopii v1 (osobny klucz, poza formatem zapisu, bez v3), timeout ≠ utrata, rejestr spóźnionych rozstrzygnięć. Domyka przyczynę 1 dla ścieżki v2.
4. **TXT-03 + TXT-02 + PIC-08/09:** cienkie asercje czasu działania tam, gdzie dziś są tylko testy (`canonicalInput` keypad/tiles z `check`, nieznany kod figury rzuca z id umiejętności), test „pierwsza podpowiedź nie znika”.
5. **PIC-04 + PIC-05 + PIC-06:** przykłady błędów dla tablic, powód w `walletCheck`, kafelki COMPARE_QTY zgodne ze stronami.
6. **TXT-01 + TXT-04 + TXT-05:** jedna definicja kroku powtórkowego (wagi, odblokowanie, grywalność, podgląd postępów) i test „review jest ostatni”.
7. Drobne: pozostałe LOW.

Ograniczenie wspólne: nic nie opuszcza urządzenia. Wszystkie kierunki zostają w panelu rodzica, na kartach i w konsoli. Znaczniki między uruchomieniami trzymamy poza formatem zapisu (format zostaje v2).

## 7. Zmiany od ostatniego audytu

Porównanie z raportem 2026-10-15 02:53 (PR #52, nie w `main`), w obszarze zapisu ponownie objętym przez ten run.

| Poprzednie id | Status | Dowód |
|---|---|---|
| SV2-01 (critical) | **fixed** | `attempt`: porażka kopii jest rzucana dalej tylko przy `backupFails < backupAttempts`; potem `skipBackup` loguje i zapisuje v2. `replace` próbuje zaległej kopii raz. Resztka: SVB-01 (utrata nie jest pamiętana, limit na tablecie to w praktyce 1). |
| SV2-02 (high) | **fixed** | `withTimeLimit`/`limited` dla kopii, zapisu, `replace` i odczytu; `writeTimeoutMs` 5000. Resztki: SVB-03, SVB-04, SVB-08, SVB-09. |
| SV2-03 (high) | **fixed (w większości)** | `migrationOf` wymaga `writes > 0` i kopii `done`/`skipped`; `failing` ma etap i kod (`pl.settings.saveFailingDetail`). Resztki: SVB-01 (fałszywe „utracona” przy timeoucie), SVB-05. |
| SRR-02 (high) | **changed (częściowo)** | `slowCard` + „Poczekaj dłużej” (`slowLoadTimeoutMs`), rada „usuń dane strony” w `pl.saveSlow.stillSlow` i `saveOff.timeout`. W aplikacji nadal nie ma wyjścia (`replaceGate` blokuje timeout, zgodnie z projektem). Licznik startów nie powstał (follow-up SRR-08). Resztka: SVB-02. |
| SV2-14 (low) | **fixed** | Seamy `?e2eSave=backupfail\|backuphang\|writehang\|slow` w buildzie e2e, specs w fazie 6. |
| SRR-04 (medium) | **changed** | `replace` próbuje zaległej kopii raz, potem `skipBackup`. |
| SRR-07, SRR-08, SV2-04, SV2-08, SV2-10, SV2-15, S12-05 | still open / not re-checked | Poza zakresem poprawki (follow-upy w `context/archive/2026-10-15-save-v2-backup-health/follow-ups/review-fixes.md`). |
| WNA-02 | still open | Wyjątki budowy rundy nadal bez id umiejętności na karcie (TXT-05, TXT-06). |
| GRD-02 | still open, nowa instancja | Klasa „OK pod drugim palcem” powtórzona w portfelu (PIC-02). |
| GRD-05 | fixed dla nowych generatorów | Wszystkie nowe pętle odrzucania mają `MAX_ATTEMPTS` (audytor TXT). Starsze z GRD-05 nie były sprawdzane ponownie. |
| Pozostałe GRD-*, WNA-*, SRR-*, SV2-* | not re-checked | Poza obszarami tego runu. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** trzech audytorów obszarów (subagenci tylko do odczytu, równolegle), po jednym na obszar, plus ten krok jako syntezator. Audytor infrastruktury nie był uruchamiany.
- **Powierzchnia:**
  - `git diff --stat 16848c6 e2f7caa -- src`: 11 plików, +275/−68;
  - `e2f7caa 10d6fe7`: 36 plików, +1500/−60;
  - `10d6fe7 eaeec52`: 51 plików, +1651/−216.
- **Sprawdzone ręcznie:**
  - SVB-02: `onWait` zwraca `'still-slow'` dla każdego `unavailable` bez logu.
  - SVB-01: gałąź `reason === 'hidden' && backupFails > 0` → `skipBackup`, a komentarz opisuje inną regułę.
  - PIC-01: `artBlocked` nie ma `ORDINAL`.
  - PIC-02: `CoinWallet` OK bez osłony `carrying`, a zegar ją ma (`TaskScene.create`).
  - PIC-03: `withPictures` dostaje `unlockThreshold(afterArt.current.length, …)`, a filtr grafiki `buckets.current.length`.
  - TXT-04: `unlockReady` liczy `unlockThreshold(0)` dla kroku powtórkowego.

  Wszystkie potwierdzone.
- **Wagi po weryfikacji:**
  - PIC-01 obniżone z high (propozycja audytora) do medium. Dziecko nie utyka, bo dostaje rozwiązanie i je przepisuje. Brakującą grafikę rodzic widzi w sekcji „Obrazki”, a grafika jest w precache, więc brak jest mało prawdopodobny.
  - Brak HIGH: żadna nowa awaria nie jest jednocześnie realistyczna, trwała i bez wyjścia. Najbliżej są SVB-02 i SVB-04 (fałsz dla rodzica w rzadkiej ścieżce) oraz TXT-03 (utknięcie, ale latentne i chronione testami w CI).
- **Przegląd repo:** 26 bloków `catch` w `src/` (bez `src/testing`) i 15 wywołań `console.*`.
- **Skrypty audytora TXT:** dwa jednorazowe skrypty w `$TMPDIR` (200 losowań na umiejętność, budowa rundy E6.11, skan znaków czcionki). Nie są częścią repo.
- **Nieudowodnione w czasie działania:**
  - czy na prawdziwym iPadzie zamrożony timer ukrytej strony wygrywa z sukcesem IDB (SVB-01, SVB-03);
  - czy porzucony `set` po timeoucie ląduje po nowszym zapisie (SVB-04, SVB-09);
  - czy drugi odczyt bywa odrzucany prawdziwym błędem po pierwszym timeoucie (SVB-02);
  - wielodotyk na portfelu na prawdziwym tablecie (PIC-02);
  - czy 6-latek faktycznie nie odczyta kafelków COMPARE_QTY i skrzynek ORDINAL (PIC-01, PIC-06).
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania; `area_source: arguments`. Rotacja nie miała zastosowania, bo krok zamyka run i audytuje to, co run wydał. Zmieniłaby to wola maintainera, by objąć inne przepływy.
- **Dowód w czasie działania:** pominięty, bo krok jest statyczny, bez `--runtime`; `runtime_proof: not-run`. Zmieniłyby to zgoda na `--runtime` w izolowanym worktree (seamy `?e2eSave=backuphang|slow|writehang` już istnieją w buildzie e2e) albo dostęp do iPada.
- **Fan-out:** trzech audytorów obszarów. Audytor infrastruktury pominięty, bo run nie zmienił granicy błędów, `vite/` ani `deploy/`. Przegląd `catch`/`console.*` zrobił syntezator. Zmieniłaby to zmiana granicy błędów lub konfiguracji PWA w runie.
- **`previous_report`:** wskazuje raport 2026-10-15 02:53 z PR #52 (otwarty, nie w `main`), bo to on był źródłem ustaleń naprawianych w PR #54. Ostatni raport obecny w `main` to `2026-10-13_1751-zdrowie-zapisu-po-poprawce.md`. Zmieniłoby to odrzucenie PR #52.
- **Wagi:** PIC-01 obniżone do medium (uzasadnienie w sekcji 8). Zostawiono 0 HIGH. Podniosłyby to: dowód z urządzenia, że SVB-02 albo SVB-04 występują w praktyce, albo dowód, że brak grafiki ikon zdarza się na produkcji.
- **Liczby we frontmatterze:** tylko nowe ustalenia tego raportu (SVB 4 medium + 5 low, TXT 4 + 4, PIC 6 + 4). Starsze otwarte ustalenia oznaczone w sekcji 7 jako „still open” nie są liczone ponownie.
- **Numeracja:** prefiksy SVB- (zapis po PR #54), TXT- (S-14c), PIC- (S-14d).
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy; wszystkie kierunki poprawek zostają na urządzeniu.
