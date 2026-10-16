---
type: observability-audit
date: 2026-10-16 09:15
mode: audit
commit: 9a64fd6
branch: docs/observability-audit-2026-10-15-fix-s16bcd
dirty_tree: false
areas: [boot-total-limit-loadercut-slow-line-loading-art-newer-guard, sounds-effects-music-prefs-unlock, art-p2-icons-wallet-notebook-miniature, salon-11-slots-12-tasks-check-deploy]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-15_2217-zapis-v3-ladowanie-grafiki.md  # PR #66, not merged to main
findings: { critical: 0, high: 4, medium: 18, low: 15 }
---

# Audyt obserwowalności: start gry, dźwięki, grafika P2 i salon 11 miejsc (2026-10-16)

Ten raport zamyka run `2026-10-15-fix-s16bcd`. Run wydał cztery slice'y:

| PR | Slice | Merge |
|---|---|---|
| #69 | fix `load-and-tab-guard` (A-1, A-2, P-5 z audytu 2026-10-15 22:17) | `a1625be` |
| #70 | S-16b `final-sound` | `c16734d` |
| #71 | S-16c `final-art-p2` | `a06795b` |
| #72 | S-16d `salon-extra-slots` | `9a64fd6` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Start gry:**
  - łączny limit ładowania 50 s z odcięciem plików (`cutLoad`);
  - linia „Jeszcze chwilka”;
  - grafika ekranu ładowania z rysowanym zapasem;
  - strażnik nowszego zapisu (`guardedPut`, `NewerSave`, blokada `newer`).
- **Dźwięki:**
  - 12 efektów ładowanych przy starcie (`[m4a, ogg]`) i muzyka ładowana na żądanie;
  - preferencje w `localStorage` poza zapisem;
  - zepsuty albo zawieszony plik dźwięku;
  - odblokowanie dźwięku po dotyku.
- **Grafika P2:**
  - ikony aplikacji;
  - portfel na 6 monet;
  - zeszyt na karcie nowej umiejętności;
  - miniatura salonu z zapasem;
  - ikony talerz, pudełko i naklejka.
- **Salon:**
  - 11 miejsc i 12 czynności;
  - wygląd przed zakupem;
  - zasłony ponad sceną;
  - ukończone salony wracają do remontu;
  - kontrola grafik w `check:deploy`.

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po czterech kanałach:

1. co widzi dziecko;
2. karty DOM;
3. panel rodzica za bramką (czytany raz, przy otwarciu);
4. konsola tabletu (bez map źródeł).

Lokalizacje w tabelach są podane jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 4 HIGH.**
  - A-1 i A-2 z audytu 22:17 są zamknięte. Jest jeden łączny limit (`cutLoad`, `bootLoadPhase`, `balance.loader.totalMs`) dla grafiki, czcionki i dźwięków, a po ok. 8 s pojawia się linia „Jeszcze chwilka”.
  - P-5 jest zamknięte **częściowo**: nowszy *format* jest chroniony od tego buildu.
- **Przyczyna 1: rekordy runtime trafiają do hooka e2e, a nie do rodzica.**
  - Każdy nowy podsystem ma staranny stan runtime, który czyta tylko `src/testing/e2eHook.ts`:
    - `bootLoad.cut` (lista odciętych plików);
    - `SoundStatus.music` i `locked`;
    - dziennik dźwięków;
    - tryb miniatury w `RoomDoneCard`.
  - Panel rodzica dostaje co najwyżej jeden licznik z chwili startu.
  - `UI_ART` nie ma rekordu wcale (G-1). Brakujący portfel, zeszyt albo miniatura daje rysowany zapas, a „Obrazki” mówią „wszystkie wczytane”.
- **Przyczyna 2: tożsamość zapisu to sam numer formatu.**
  - `storedVersionNewer` porównuje tylko `version`. Stara karta albo instancja PWA tego samego formatu v3 (np. S-16c bez nowych zadań salonu) nadpisuje nowszy postęp: zakupy i gwiazdki się cofają, a żaden kanał nic nie pokazuje (B-1, HIGH).
  - Gdy strażnik już zadziała (`newer`), dziecko gra dalej bez zapisu. Mówi o tym tylko linia za bramką (B-2).
- **Przyczyna 3: zapasy bez sygnału.**
  - Cztery nowe zapasy grafiki (G-2), przepisanie zakończonego salonu na 7/12 (R-2) i przycięcie postępu przy migracji v2 → v3 (R-3) działają poprawnie, ale nie zostawiają śladu w żadnym kanale.
  - Preferencje dźwięku nieudane do zapisania cicho wracają do domyślnych przy następnym starcie (S-6).
- **Przyczyna 4: globalne wyciszanie po nazwie i smoke porównujący ze źródłem.**
  - `QUIET_REJECTIONS` ukrywa każdy `EncodingError` i `NotSupportedError` w całej grze, a ostrzeżenie gubi nazwę i stack (S-2).
  - `check:deploy` bierze `ROOM_ART` z kodu na HEAD. Rollback przez S-16d kończy się więc fałszywym FAIL (P-2). Sprawdzana jest tylko lista precache grafiki pokoju, a nie to, czy pliki są serwowane (P-3).
  - Nieudana instalacja SW (precache ok. 5,9 MB po dźwiękach i grafice) cicho odbiera grę offline (P-1, HIGH).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-15 22:17)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i sieci.
- **Granica błędów:** `installErrorBoundary` (`src/ui/dom/errorBoundary.ts`) działa w `src/main.ts` przed `start()`, ale po wykonaniu wszystkich importów.
  - `isFatalSignal` (`src/core/errorSignal.ts`) uznaje za ciche odrzucenia o nazwach z `QUIET_REJECTIONS`. Są to `AbortError` i `NotAllowedError`, a od tego runu także **nowe** `EncodingError` i `NotSupportedError` (zgubiona obietnica `decodeAudioData` Phasera).
  - Przy cichym odrzuceniu zostaje `console.warn('Ignored browser noise:', message)`, bez nazwy i bez stacku.
- **Start (`BootScene.preload`):**
  - Limit na plik zostaje (`balance.loader.timeoutMs`, 1 ponowienie).
  - **Nowy** łączny limit `cutTimer` = `this.time.delayedCall(limits.totalMs)`, 50 s. Po nim `cutLoad` (`src/scenes/loaderCut.ts`) kończy pliki ścieżkami loadera i dziecko dostaje zastępniki.
  - **Nowa** linia „Jeszcze chwilka” (`armSlow`, ok. 8 s).
  - Oba timery chodzą na zegarze gry Phasera (delta wygładzona i obcięta), a nie na czasie ściennym (B-3).
  - Grafika ekranu ładowania (`UI_ART`) jest w kolejce pierwsza, a nasłuchuje na nią `fileKeyCompleteEvent` (`src/core/loaderEvent.ts`). Rysowany zapas jest bez sygnału.
  - `publish` wpisuje `REGISTRY_KEYS.bootLoad` (`cut`, `creates`). Czyta go tylko hook e2e. W konsoli zostaje jedna linia `Boot load cut after … ms`.
- **`BootScene.create`:** `artHealth` powstaje dla `TASK_ART` i `ROOM_ART` oraz osobny rekord dźwięków. **Brak rekordu dla `UI_ART`** (G-1). Konfiguracja dźwięku jest w `try/warn`.
- **Zapis:**
  - **Nowy** `guardedPut` (`src/storage/idb.ts`) w jednej transakcji `readwrite` czyta wersję i odmawia z `NewerSave` (`NEWER_SAVE` w `src/core/save.ts`), gdy zapisana wersja jest wyższa.
  - Autosaver ustawia wtedy `blockedBy = 'newer'`. Rodzic widzi linię w „Zapis gry” (`offState`), a `replaceGate` odmawia importu i resetu.
  - Równe wersje przechodzą bez kontroli (B-1). Format zostaje v3.
- **Dźwięki:**
  - `SoundService` (`src/ui/sound.ts`) z czystą logiką w `src/core/sound.ts`.
  - Tabela `src/data/sounds.ts`: 12 efektów ładowanych przy starcie, muzyka ładowana na żądanie przez `UIScene`.
  - Preferencje w `martynka:sound` (`src/storage/soundPrefs.ts`).
  - Panel rodzica, sekcja „Dźwięki”, dostaje `{ prefs, missing: status().missing.length }`, czyli liczbę policzoną raz przy starcie.
- **Deploy smoke:**
  - **Nowe** `roomArtCheck` (`scripts/deploy-check/parse.ts`) sprawdza, że URL-e `ROOM_ART` są na liście precache w `sw.js`.
  - Jeden GET i kontrola typu dla `architecture-after.webp`.
  - `deploy.yml` uruchamia smoke po `switch`, także przy rollbacku (bez SHA).
- **Przegląd repozytorium** (`src/` bez `src/testing`):

  | | Audyt 22:17 | Teraz |
  |---|---|---|
  | bloki `catch` | 23 | 35 |
  | `console.error/warn` | 18 | 32 |
  | `.catch(() => undefined)` | 2 | 2 (te same) |

  Nowe ciche domyślne to `parseSoundPrefs` i `deviceStorage`.
- **Seamy e2e:** nowe przypadki używają istniejących parametrów (`e2eArt=stallall`, `e2eSave=newer|legacy-salon`), objętych markerami w `vite/e2eHookGuard.mjs`. `E2E_BOOT_LIMITS` nie ma własnego markera (P-6).

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola | Werdykt |
|---|---|---|---|---|
| Serwer milczy, wiele plików wisi | pasek, po ok. 8 s „Jeszcze chwilka”, po 50 s (czas gry) start z zastępnikami | „Obrazki”: liczniki, bez „odcięte limitem” | `Boot load cut after … ms` + linie `loaderror` | **caught** (e2e `load-and-tab-guard`); powód niewidoczny dla rodzica (B-4), czas gry (B-3) |
| Brak pliku `UI_ART` (portfel, zeszyt, miniatura, tło ładowania) | rysowany zapas | „wszystkie obrazki wczytane” | `Task art failed to load` (zła etykieta) | **missed** dla rodzica (G-1, G-2) |
| Brak ikony talerz/pudełko/naklejka | pudełko z napisem w zadaniu obrazkowym E1 | licznik w „Obrazki” | linia `loaderror` | caught; zadanie nie jest losowane ponownie (G-4) |
| Zapis v3 z nowszym formatem w magazynie (stara karta tego buildu) | gra dalej, nic się nie zapisuje | „Zapis gry”: wyłączony, `Kod: NewerSave` | `autosave: write failed NewerSave` | caught tylko za bramką (B-2) |
| Stara karta/PWA **tego samego formatu** pisze po nowej | zakupy i gwiazdki z nowej karty znikają | nic | nic | **missed** (B-1) |
| Zakończony salon z S-16a–c po aktualizacji | 7/12, „Pokój gotowy!” znika i wraca później | nic | nic | missed (R-2, zamierzone, ale bez śladu) |
| Muzyka nie wczyta się albo czeka na odblokowanie | cisza | „Muzyka: Włączone” | `Music missing` / nic | **missed** dla rodzica (S-1, S-3) |
| Kontekst audio nigdy nieodblokowany (iOS) | całkowita cisza | „Dźwięki” bez braków | nic | missed (S-4) |
| Zapis preferencji dźwięku nieudany | wybór działa do zamknięcia | nic; po restarcie wartości domyślne | warn | missed dla rodzica (S-6) |
| Nieudana instalacja SW (404/quota w precache) | gra działa online, offline nie | nic | nic (`.catch(() => undefined)`) | **missed** (P-1) |
| Rollback przez S-16d | — | — | job czerwony: `FAIL precache covers room pictures` | **fałszywy alarm** (P-2) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord runtime bez widoku dla rodzica.**
   - Mechanizm: każdy slice tego runu zbudował poprawny stan runtime i przypiął go testem e2e przez hook. Tylko zapis i grafika zadań/pokoju miały wcześniej widok w panelu, więc nowe podsystemy kończą na konsoli.
   - Rozsądne lokalnie (e2e potrzebuje stanu), ale na tablecie konsoli nikt nie czyta.
   - Wyjaśnia: B-4, G-1, G-2, S-1, S-3, S-4, S-8, S-9.
2. **Tożsamość zapisu = numer formatu.**
   - Mechanizm: `tasksDone` to pozycja na liście, która rośnie między buildami, a rekord nie mówi, względem której listy był liczony. Strażnik działa tylko przy podniesieniu formatu, a większość wdrożeń (jak S-16d) formatu nie zmienia.
   - Wyjaśnia: B-1, B-2, B-8, R-2, R-4.
3. **Zapasy i reinterpretacje bez śladu.**
   - Mechanizm: ciche zapasy są dobre dla dziecka. Każdy z nich zostawia jednak rodzica z fałszywym obrazem („wszystko wczytane”, „Włączone”, „7/12 bez powodu”) zamiast uczciwego „nieznane” albo „tylko do zamknięcia gry”.
   - Wyjaśnia: G-2, G-3, R-2, R-3, R-5, S-6, S-7.
4. **Globalny filtr zamiast lokalnej własności błędu.**
   - Mechanizm: wyciek obietnicy w Phaserze naprawiono poszerzeniem `QUIET_REJECTIONS`, a nie przechwyceniem u źródła. Ostrzeżenie gubi nazwę i stack.
   - Wyjaśnia: S-2, S-11.
5. **Smoke porównuje ze źródłem, nie z artefaktem.**
   - Mechanizm: `check:deploy` importuje tabele z HEAD i ocenia obecność z listy `sw.js`, a nie z odpowiedzi serwera. Sprawdza tylko najnowszą tabelę (grafika pokoju), a skrypty grafiki mają własne kopie tabel.
   - Wyjaśnia: P-1, P-2, P-3, P-4, G-5.

## 5. Ustalenia według obszaru

### 5.1 Start gry: łączny limit, „Jeszcze chwilka”, grafika ładowania, strażnik nowszego zapisu

| # | Location | Category | Severity | What happens in production | Fix direction |
|---|---|---|---|---|---|
| B-1 | `src/core/save.ts` `storedVersionNewer`; `src/storage/idb.ts` `guardedPut` | coverage-gap | **high** | Stara karta albo instancja PWA z S-16c (v3, salon 7 zadań) albo druga karta tego samego buildu zapisuje po nowej karcie. Zakupy (zasłony, półka) i saldo gwiazdek się cofają, a import albo reset z drugiej karty jest odwracany. Żaden kanał nic nie pokazuje. Ryzyko jest znane (plan-review S-16d F4, follow-up „dwie karty”). Nie jest CRITICAL, bo wymaga dwóch jednocześnie żywych kontekstów. | Licznik zapisów albo build id w rekordzie i odmowa w `guardedPut` jak przy `NewerSave` (wymaga v4) albo `BroadcastChannel` z przejęciem; do tego czasu sygnał z B-8. |
| B-2 | `src/core/autosave.ts` `createAutosaver` (`blockedBy ??= 'newer'`); `src/core/saveHealth.ts` `offState` | coverage-gap | medium | Po pierwszej odmowie cała sesja (gwiazdki, zakupy, opanowanie) przepada. Dziecko nic nie widzi, rodzic widzi to tylko w panelu za bramką, a konsola ma jedną linię. Follow-up „karta dla dziecka przy `newer`” jest otwarty. | Przy pierwszym `newer` spokojna karta DOM „Uruchom grę ponownie”. |
| B-3 | `src/scenes/BootScene.ts` `preload` (`cutTimer`, `armSlow`: `this.time.delayedCall`) | config | medium | Timery Phasera liczą się z wygładzonej delty (ok. 200 ms na klatkę przy `minFps` 5, 16,7 ms przez pierwsze 120 klatek i bez fokusu). Na wolnym, obciążonym starcie limit 50 s i linia 8 s przychodzą później niż w czasie ściennym. `armSlow` poprawia tylko zbyt wczesne odpalenie, `cutTimer` nie sprawdza nic. | Termin z `performance.now()` przez `setTimeout` albo sprawdzanie `time.now - startedAt` przy każdym `progress`. |
| B-4 | `src/scenes/BootScene.ts` `publish` (`REGISTRY_KEYS.bootLoad`); `src/ui/dom/artHealthView.ts` | logged-not-captured | medium | Lista odciętych plików trafia tylko do hooka e2e. Rodzic widzi liczniki braków bez powodu „odcięte limitem czasu” i nie odróżni wolnego pierwszego startu od zgubionych plików (poszerza A-5). | `cut.length` i powód w „Obrazki”. |
| B-5 | `src/scenes/BootScene.ts` `preload` (listener `loaderror`); `src/scenes/loaderCut.ts` `cutLoad` | missing-context | low | Każdy plik, także `ui/*`, `rooms/*`, dźwięki i pliki odcięte, loguje „Task art failed to load: key” bez URL-a, statusu i informacji o odcięciu. Plik w trakcie dekodowania (czcionka, obraz, audio) odcięty limitem nie ma linii wcale. Poszerza A-3. | Etykieta według prefiksu klucza, `file.url`, status, zbiór `cut` sprawdzany w listenerze. |
| B-6 | `src/data/balance.ts` `loader.totalMs` (50 000) | config | medium | Udokumentowany zimny start przy 50 KB/s trwa 46,6 s, czyli 93 % budżetu, a przy pierwszym uruchomieniu SW ściąga równolegle te same pliki. Odcięcie staje się normalną ścieżką, a grafika salonu jest w kolejce na końcu i odcinana pierwsza. | Zmierzyć z instalującym się SW; salon wcześniej w kolejce albo większy budżet. |
| B-7 | `src/storage/idb.ts` `guardedPut` (`put` wołane z `read.onsuccess`/`onerror`) | flattened-response | low | Synchroniczny wyjątek `os.put` (np. `DataCloneError`) w handlerze IDB staje się globalnym błędem i kartą „Ups!” zamiast nazwanej porażki zapisu. Mało prawdopodobne dzięki `validateSave`. | `try/catch` wokół `os.put` i `reject`. |
| B-8 | `src/pwa/registerServiceWorker.ts` (brak `controllerchange`) | coverage-gap | low | `skipWaiting`/`clientsClaim` zostały, ale build nie zauważa, że stał się nieaktualny. B-1 i B-2 wychodzą na jaw dopiero przy odmowie zapisu albo nigdy. | Na `controllerchange` oznaczyć sesję jako nieaktualną w „Zapis gry” albo kartą. |

### 5.2 Dźwięki

| # | Location | Category | Severity | What happens in production | Fix direction |
|---|---|---|---|---|---|
| S-1 | `src/scenes/UIScene.ts` `openSettings`; `src/ui/dom/settingsPanel.ts` (sekcja „Dźwięki”) | coverage-gap | **high** | Panel dostaje tylko `prefs` i liczbę brakujących efektów. Muzyka może po 30 s nie dojść, nie zdekodować się albo czekać na odblokowanie bez końca. Rodzic widzi wtedy „Muzyka: Włączone” i nic nie słyszy, a jedynym śladem jest `console.warn('Music missing: …')`. | Przekazać `status().music` i `locked` do panelu i dodać wyciszoną linię „nie wczytała się” albo „czeka na dotknięcie”. |
| S-2 | `src/core/errorSignal.ts` `QUIET_REJECTIONS`; `src/ui/dom/errorBoundary.ts` `installErrorBoundary` (`handle`) | swallowed | medium | Reguła dopasowuje samą nazwę, w całej grze. Dziś żadne odrzucenie z kodu gry tych nazw nie nosi (sprawdzone). Przyszły `EncodingError` albo `NotSupportedError` z kodu gry zniknie, a ostrzeżenie „Ignored browser noise” nie ma nazwy ani stacku. | Logować `signal.name` i oryginał; zawęzić wyjątek audio (wiadomość dekodowania albo okno ładowania) albo łapać u źródła w `SoundService`. |
| S-3 | `src/ui/sound.ts` `playMusic`/`startMusic` (`musicState`) | missing-context | medium | `'loading'` oznacza zarówno pobieranie, jak i czekanie na `unlocked`. Gdy iOS nie odblokuje kontekstu, stan zostaje `'loading'` na zawsze, bez żadnej linii. | Osobny stan `waiting-unlock`, pokazany przez S-1. |
| S-4 | `src/ui/sound.ts` `play` (`soundOutcome` `'locked'`/`'off'`) | coverage-gap | medium | Zablokowany kontekst, dźwięk wyłączony i plik brakujący po starcie są nie do odróżnienia. Każdy taki przypadek trafia tylko do pierścienia `log` (50 wpisów), który czyta hook e2e. Dziecko z włączonym dźwiękiem ma ciszę, rodzic nie wie dlaczego. | Linia w panelu, gdy po N próbach `locked` dalej jest `true`. |
| S-5 | `src/ui/sound.ts` `startMusic` (loader `UIScene`) | missing-context | medium | Brak listenera `loaderror`. Timeout, 404, brak wpisu w SW i błąd dekodowania kończą się tą samą linią. Dekodowanie daje jeszcze osobne „Ignored browser noise” bez klucza. | `loader.on('loaderror')` z kluczem, URL-em i przyczyną. |
| S-6 | `src/scenes/UIScene.ts` `applySettings` (wynik `createSoundPrefStore(...).write` odrzucony); `src/storage/soundPrefs.ts` `deviceStorage` | swallowed | medium | Przy zablokowanym albo pełnym `localStorage` wybór rodzica działa tylko w tej sesji. Po restarcie cicho wracają wartości domyślne (muzyka wyłączona). | Linia w panelu „Ustawienie obowiązuje do zamknięcia gry”. |
| S-7 | `src/core/sound.ts` `parseSoundPrefs` | swallowed | low | Uszkodzony JSON albo zły typ pola daje wartości domyślne bez ostrzeżenia. | Jedno ostrzeżenie, gdy wartość istnieje, ale jest niepoprawna. |
| S-8 | `src/scenes/BootScene.ts` `create` (`try/catch` konfiguracji dźwięku) | swallowed | low | Gdy `trimEffects` albo rekord zdrowia rzuci, `soundHealth` nie powstaje, a `missing` zostaje `[]`. Panel twierdzi, że wszystkie efekty są w porządku. | W `catch` ustawić wszystkie efekty jako brakujące albo stan „nieznany”. |
| S-9 | `src/ui/sound.ts` `play` (`catch`); `src/data/pl.ts` `soundMissing` | coverage-gap | low | Liczba jest ustalana raz przy starcie i obejmuje tylko 12 efektów. Porażki przy odtwarzaniu jej nie zwiększają. Urządzenie bez Web Audio pokazuje „Nie wczytało się 12 dźwięków”, choć nic nie próbowano wczytać. Odmiana liczebników jest poprawna. | Liczyć porażki odtwarzania; osobna linia „brak dźwięku na tym urządzeniu”. |
| S-10 | `src/ui/sound.ts` `play` (`catch`) | noise | low | Gdy `game.sound.play` rzuca zawsze (zamknięty kontekst), każde dotknięcie loguje pełne ostrzeżenie. Ciche wyniki nie logują nic. | Ostrzeżenie raz na id i zmianę wyniku. |
| S-11 | `src/ui/sound.ts` `playMusic` (domknięcie `start` po `unlocked`) | coverage-gap | low | `sound.play()` bez osłony. Wyjątek muzyki po odblokowaniu daje kartę „Ups!” i zatrzymanie gry zamiast ciszy. | `try` i `musicState = 'missing'`. |

### 5.3 Grafika P2

| # | Location | Category | Severity | What happens in production | Fix direction |
|---|---|---|---|---|---|
| G-1 | `src/scenes/BootScene.ts` `create` (`artHealth` tylko z `TASK_ART` i `ROOM_ART`); `src/data/uiArt.ts` `UI_ART` | coverage-gap | **high** | Brak portfela, zeszytu, miniatury salonu albo grafiki ekranu ładowania nie trafia do żadnego rekordu. Dziecko dostaje rysowany zapas, rodzic czyta „Wszystkie obrazki zadań są wczytane”, a jedynym śladem jest źle opisana linia `loaderror`. | Trzeci rekord `artHealth` dla `UI_ART` i linia w „Obrazki”. |
| G-2 | `src/ui/widgets/CoinWallet.ts` `walletArtLoaded`; `src/ui/widgets/UnlockCard.ts` (`firstLoaded`); `LoadingScreen` `showArt`; `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile` | swallowed | medium | Cztery zapasy z S-16c nie piszą ani do konsoli, ani do rejestru. Tryb miniatury trafia tylko do hooka e2e. | Zapisać wybrany zapas w rekordzie z G-1. |
| G-3 | `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile` (`thumbnailKey` = `UI_ART_KEYS.salonAfter`); `src/core/artPick.ts` `miniatureMode` | missing-context | medium | Gdy brakuje dowolnego elementu pokoju, kafelek pokazuje domyślny salon z paczki, a nie warianty wybrane przez dziecko. Klucz jest wpisany na sztywno dla każdego `RoomDef`, więc drugi pokój pokazałby salon (ryzyko uśpione). | Miniatura na pokój; raczej rysować wybór dziecka z zastępnikami niż obcą miniaturę. |
| G-4 | `src/core/round/artFilter.ts` `artBlocked` (tylko MONEY_*, MASS, CAPACITY); generatory COUNT, COMPARE_QTY, ORDINAL, MULT_GROUPS, CHOOSE_OP (`rng.pick(ICONS)`) | coverage-gap | medium | Brakująca ikona (w tym nowe talerz, pudełko, naklejka) jest rysowana jako pudełko z rzeczownikiem. W trybie obrazkowym E1 (sześciolatki, które nie czytają) zadanie staje się tekstowe. `artHealth.missingIds` już zna te ikony. | Losować zadanie ponownie, gdy `visual` wskazuje brakującą ikonę (bez blokowania całej umiejętności). |
| G-5 | `scripts/make-task-art.mjs` (`UI_JOBS`, `V2_ICONS`), `scripts/make-icons.mjs` (`ICONS`); CLAUDE.md (`npm run icons`) | config | low | Skrypty mają własne kopie tabel. Brak źródła kończy się głośno (`process.exit(1)`), ale plik bez wpisu w tabeli (sierota) trafia do precache i nikt go nie ładuje. CLAUDE.md nadal opisuje ikony jako zastępcze, „bez natywnych zależności”. | Import tabel przez tsx albo test „katalog = tabela”; poprawić CLAUDE.md. |
| G-6 | `src/core/trayDrag.ts` `stepTrayDrag` (`walletFull`) | coverage-gap | low | Pełny portfel cicho odrzuca monetę, widać tylko przyciemnioną tacę. Dziecko z sześcioma monetami po 1 zł przy 7 zł utknie bez podpowiedzi. | Krótki ruch albo linia podpowiedzi przy odrzuceniu. |
| G-7 | `vite/e2eHookGuard.mjs`, `?e2eArt` (brak wartości dla `UI_ART`) | coverage-gap | low | Rysowany portfel, zapas zeszyt → książka i tryb `drawn` miniatury nie są sprawdzane w przeglądarce. `CoinWalletTargets.walletArt` nie ma asercji. | `?e2eArt=ui` z markerem. |

### 5.4 Salon 11 miejsc i 12 czynności

| # | Location | Category | Severity | What happens in production | Fix direction |
|---|---|---|---|---|---|
| R-1 | (scalone z B-1) | — | — | Nadpisanie v3 przez starą kartę S-16c cofa zakupy nowych miejsc. | Zob. B-1. |
| R-2 | `src/core/rooms.ts` `roomDone`/`roomsListView`; `src/main.ts` (logują tylko `repairCurrentRoom` i `migratedFrom`) | coverage-gap | medium | Zapis z S-16a–c z 7/7 był „gotowy”. Teraz pokazuje 7/12: zapowiedź się blokuje, znika przycisk „Zmień wygląd”, a „Pokój gotowy!” wraca później. To zmiana zamierzona, ale bez linii w konsoli ani w panelu. | `console.info` przy wczytaniu dla pokoju z rozszerzoną listą; jednorazowa linia „nowe zadania w pokoju”. |
| R-3 | `src/core/migrations/legacySalon.ts` `LIFT_V2_SALON`; `src/main.ts` (`Save migrated from v…`) | missing-context | medium | Stary salon 10/10 (96 gwiazdek) jest przycinany do 7 zadań. Warianty `curtains`, `lamp` i `plant` (`OLD_ONLY_KEYS`) przepadają, więc po S-16d dziecko kupuje zasłony drugi raz. Log mówi tylko „migrated from v2”. Poszerza V-8 i znane M-4. | Notatka migracji tylko w runtime (wydane, zachowany prefiks, porzucone klucze) w logu i w „Zapis gry”. |
| R-4 | `src/core/save.ts` `validRoom`/`validateSave` (także przez `parseImport`) | missing-throw | medium | Przechodzą bez uwagi stany sprzeczne z katalogiem: `tasksDone` większe niż liczba zadań (zapis nowszego buildu) jest pokazywane jako ukończone, a `chosen.curtains` przy `tasksDone: 7` pokazuje zasłony jako kupione i każe za nie zapłacić. | Czyste `roomStateProblems` w core; ostrzeżenie przy wczytaniu i imporcie, bez zmiany zapisu. |
| R-5 | `src/ui/widgets/RoomView.ts` `render`; `src/data/rooms.ts` (wygląd przed zakupem: lampa, roślina, pufa) | missing-context | low | Brakująca tekstura wyglądu przed zakupem daje zastępnik podpisany nazwą wariantu, tak samo jak kupiony element. Brak `shadows` nie rysuje nic. Oba braki są liczone w `roomArtHealth`, ale „Obrazki” pokazują tylko liczby. | Wypisać brakujące klucze w „Obrazki”. |
| R-6 | `src/scenes/RoomScene.ts` `slotTargets`; `src/core/roomHit.ts` `holdPoint` | swallowed | low | Miejsce, którego nie da się dotknąć (zasłony przycięte przez scenę, nieprzezroczyste piksele wyżej), znika z celów. E2E pada na `undefined` zamiast powiedzieć „miejsce niedostępne”. Testy sprawdzają prostokąty, a nie prawdziwe maski alfa. | Jawnie raportować niedostępne miejsca; test z prawdziwymi maskami. |

### 5.5 Platforma i deploy

| # | Location | Category | Severity | What happens in production | Fix direction |
|---|---|---|---|---|---|
| P-1 | `src/pwa/registerServiceWorker.ts` (`.catch(() => undefined)`, brak słuchaczy cyklu życia); `vite/config.shared.mjs` (precache ok. 5,9 MB, m4a i ogg) | swallowed | **high** | Gdy jeden wpis precache zwróci 404 albo zabraknie miejsca, instalacja SW pada. Zostaje stary SW albo żaden, gra offline cicho przestaje działać, a żaden kanał tego nie pokazuje. Precache urósł o dźwięki w obu formatach i grafikę P2. Poprzednio P-6 (low), podniesione. | Nazwa błędu rejestracji/instalacji i build aktywnego SW w rekordzie runtime; linia w panelu. |
| P-2 | `scripts/check-deploy.ts` (`ROOM_ART` z HEAD, URL `architecture-after.webp` na sztywno); `.github/workflows/deploy.yml` „Smoke check (rollback)” | config | medium | Rollback przez S-16d serwuje wydanie bez nowych grafik, a smoke porównuje z `main`: `FAIL precache covers room pictures` i czerwony job, choć rollback się udał. Opiekunowie uczą się ignorować czerwony smoke. | Lista oczekiwanych grafik zapisana w `dist/` i czytana z serwowanego wydania; albo pominięcie kontroli grafiki bez SHA. |
| P-3 | `scripts/deploy-check/parse.ts` `roomArtCheck`; `scripts/check-deploy.ts` | coverage-gap | medium | Sprawdzana jest lista `sw.js`, a nie odpowiedzi serwera. Wpis z 404 przechodzi smoke i psuje instalację SW (P-1). Dźwięki, grafika zadań, `UI_ART` i ikony aplikacji nie są sprawdzane wcale. Szczegół wymienia tylko pierwszy brak. Poszerza P-4 z 22:17. | HEAD dla każdego wpisu precache (status i typ); lista wszystkich braków z limitem. |
| P-4 | `scripts/check-deploy.ts` `get` / `main().then(…, error => …)` | identity-lost | medium | Błąd sieci drukuje `FAIL request error — fetch failed` bez ścieżki i bez `error.cause`. `switch` już przełączył `current`, więc działające wydanie zostaje niesprawdzone. | Opakować `get` ścieżką i przyczyną; napisać w logu, że wydanie już działa. |
| P-5 | `src/scenes/BootScene.ts` `preload` (listener `Loader.Events.ADD` bez `try`) | coverage-gap | low | Bez zmian od 22:17 (P-3). Wyjątek w listenerze daje kartę „Ups!” na starcie. | `try/warn`. |
| P-6 | `vite/e2eHookGuard.mjs` (brak markera dla `E2E_BOOT_LIMITS` i gałęzi `stallall` w `main.ts`) | config | low | Seamy zależą od eliminacji martwego kodu przez `__E2E_HOOK__`. Strażnik nie zauważyłby wycieku do `dist/`. | Ciąg-marker w `E2E_BOOT_LIMITS`. |

## 6. Rekomendowana kolejność poprawek

1. **Rekord zdrowia dla `UI_ART` i zapasów (G-1, G-2, G-3, B-4).**
   - Jeden rekord w `BootScene.create` i jedna linia w „Obrazki”.
   - Dołączyć powód „odcięte limitem” z `bootLoad.cut`.
   - Najtańsza poprawka o największym zasięgu, bo mechanizm `artHealth` już istnieje.
2. **Stan muzyki i blokady w „Dźwięki” (S-1, S-3, S-4, S-6, S-8).**
   - Panel czyta `status()` raz, jak „Zapis gry”.
   - Trzy linie: muzyka nie wczytana albo czeka na dotknięcie, dźwięk zablokowany, ustawienie tylko do zamknięcia gry.
   - Bez zmiany formatu zapisu.
3. **Sygnał nieaktualnego buildu i karta `newer` (B-8, B-2), potem ochrona tego samego formatu (B-1).**
   - `controllerchange` i spokojna karta „Uruchom grę ponownie” to poprawki bez zmiany formatu.
   - Licznik zapisów albo build id w rekordzie wymaga v4, czyli decyzji opiekuna (run trzymał v3).
4. **Smoke na artefakcie (P-2, P-3, P-4, P-1).**
   - Lista precache z `dist/`, HEAD każdego wpisu, ścieżka i przyczyna w błędzie.
   - Pominięcie kontroli grafiki przy rollbacku bez SHA.
   - Ograniczenie: zmiana dotyczy `scripts/`, a nie `deploy/`.
5. **Zawężenie `QUIET_REJECTIONS` (S-2, S-11)**: nazwa i oryginał w ostrzeżeniu; wyjątek audio zawężony do dekodowania.
6. **Zegar ścienny dla limitów startu (B-3, B-6)**: `performance.now()` i pomiar z instalującym się SW, zanim kolejne pliki trafią do startu.
7. **Ślady reinterpretacji salonu (R-2, R-3, R-4)**: czyste `roomStateProblems` i notatka migracji, tylko w runtime.
8. **Reszta niskich**: G-4 (ponowne losowanie przy brakującej ikonie), G-5, G-6, G-7, S-7, S-9, S-10, B-5, B-7, R-5, R-6, P-5, P-6.

Ograniczenia każdej poprawki:

- nic nie opuszcza urządzenia;
- tekst dla rodzica tylko w `src/data/pl.ts`;
- `src/core` bez przeglądarki;
- zapis zostaje v3, chyba że opiekun zdecyduje o v4 (B-1).

## 7. Zmiany od ostatniego audytu (2026-10-15 22:17, PR #66)

| Poprzedni id | Status | Dowód |
|---|---|---|
| A-1 (limit na plik, nie na całość) | **fixed** | `cutLoad` (`src/scenes/loaderCut.ts`), `bootLoadPhase` (`src/core/bootLoad.ts`), `balance.loader.totalMs` 50 s; obejmuje grafikę, czcionkę i dźwięki; e2e `load-and-tab-guard`. Zastrzeżenie: zegar gry (B-3) i mały zapas (B-6). |
| A-2 (brak sygnału „wolno”) | **fixed** | `armSlow` i linia „Jeszcze chwilka” (DESIGN-GAP 112), e2e. Zastrzeżenie: zegar gry (B-3). |
| P-5 (stara karta nadpisuje nowszy zapis) | **changed (częściowo)** | `guardedPut` + `NewerSave` + `blockedBy 'newer'` chronią nowszy *format* od tego buildu. Otwarte: ten sam format (B-1), brak sygnału dla dziecka (B-2), brak wykrycia nieaktualnego buildu (B-8), karty v2 sprzed strażnika (nie do zamknięcia, udokumentowane). |
| A-3 (linia `loaderror` bez URL-a i statusu) | still open, poszerzone | B-5: ta sama linia także dla `ui/*`, `rooms/*`, dźwięków i plików odciętych. |
| A-5 („Obrazki” tylko liczy) | still open, poszerzone | B-4, G-1, R-5. |
| A-7 (martwa gałąź czcionki) | changed | Gałąź żyje dla czcionki odciętej w trakcie pobierania, nadal martwa dla czcionki w trakcie dekodowania (B-5). Limit czcionki zamknięty przez A-1. |
| P-3 (listener `ADD` bez osłony) | still open | P-5 w tym raporcie. |
| P-4 (smoke bez grafiki, rollback poniżej v3) | changed | `roomArtCheck` pokrywa grafikę pokoju z listy precache; reszta otwarta (P-3), nowy fałszywy alarm przy rollbacku (P-2). |
| P-6 (rejestracja SW połknięta) | still open, podniesione do high | P-1: precache urósł do ok. 5,9 MB. |
| V-8 / M-4 (log migracji bez treści) | still open, poszerzone | R-3. |
| A-4, A-6, A-8, A-9, A-10, A-11, P-1, P-2, P-7, P-8, V-1..V-7 | not re-checked | Poza obszarami tego runu. |

## 8. Metoda i ograniczenia

- **Agenci:** cztery audytory obszarów (start i strażnik, dźwięki, grafika P2, salon) i jeden audytor infrastruktury. Wszyscy tylko do odczytu, wszyscy z tym samym modelem przechwytywania.
- **Sprawdzone ręcznie:**
  - `cutTimer`/`armSlow` używają `this.time.delayedCall` (zegar gry);
  - `BootScene.create` liczy `artHealth` tylko dla `TASK_ART` i `ROOM_ART`;
  - `storedVersionNewer` używa ostrego `>` (równe wersje przechodzą);
  - `installErrorBoundary` loguje ciche odrzucenie bez nazwy;
  - `check-deploy.ts` importuje `ROOM_ART` z kodu, a `deploy.yml` uruchamia smoke przy rollbacku;
  - `UIScene.applySettings` odrzuca wynik `write`.
- **Obniżone:**
  - nadpisanie tym samym formatem: dwóch audytorów oceniło je jako CRITICAL, raport daje HIGH (uzasadnienie w *Autonomous decisions*);
  - `QUIET_REJECTIONS`: audytor dźwięków dał HIGH, raport daje MEDIUM, bo dziś nic z kodu gry nie odrzuca tymi nazwami (potwierdził audytor infrastruktury);
  - `roomArtCheck` przy rollbacku: z HIGH do MEDIUM, bo to fałszywy alarm, a nie ukryta awaria.
- **Odrzucone:** C-9 audytora grafiki (`parseMoneyPayParams` przy obniżeniu `maxTotal`) jest pokryty testami generatorów i `contentInvariants`.
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond ani przeglądarki.
  - Zachowanie zegara gry przy obciążonym starcie (B-3) wynika z kodu `TimeStep` Phasera i nie zostało zmierzone.
  - WebKit/iPad dla odcięcia ładowania i odblokowania audio (S-3, S-4) nie był testowany (follow-up WebKit otwarty).
  - Nieudana instalacja SW (P-1) i rozmiar precache są wnioskiem z konfiguracji, a nie z pomiaru na urządzeniu.
  - Scenariusz dwóch kart (B-1) jest przeczytany z kodu, e2e go nie odtwarza.
- **Przegląd repozytorium:** w `src/` bez `src/testing` jest 35 bloków `catch` (było 23), 32 wywołania `console.error/warn` (było 18) i 2 `.catch(() => undefined)` (te same).
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (cztery), bez pytania o wybór. Rekomendowany wybór skilla = argumenty. Zmieniłoby to: polecenie opiekuna, by audytować inne przepływy.
- **`--runtime`:** nie uruchomiony (krok wyraźnie statyczny). Zmieniłoby to: przekazanie `--runtime` albo potrzeba dowodu B-1 lub B-3.
- **Poprzedni raport:** `previous_report` wskazuje raport 2026-10-15 22:17 z PR #66 (niezmergowany, brak go na `main`). To on był źródłem slice'u fix tego runu, więc to z nim jest porównanie. Odrzucony: ostatni raport na `main` (2026-10-13 17:51), który nie zna A-1/A-2/P-5. Zmieniłoby to: zamknięcie PR #66 bez merge'a i decyzja, że historia ma iść tylko po `main`.
- **Ważność B-1:** HIGH zamiast CRITICAL.
  - Za CRITICAL: niewidoczna utrata postępu.
  - Za HIGH: wymaga dwóch jednocześnie żywych kontekstów; ryzyko przyjęte świadomie w plan-review S-16d (F4) i w follow-upie „dwie karty”; spójność z oceną P-5 (medium) w 22:17.
  - Zmieniłoby to: zgłoszenie z urządzenia o cofniętym postępie albo dowód, że stara instancja PWA żyje obok nowej karty na iPadzie częściej niż sporadycznie.
- **Pytania skilla do użytkownika** (dostosowanie obszarów, uruchomienie sond, usunięcie harnessu): nie zadane, zgodnie z kontraktem runu. Wybrano domyślne.
