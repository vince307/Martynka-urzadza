---
type: observability-audit
date: 2026-10-16 14:19
mode: audit
commit: 1a3edb4
branch: docs/observability-audit-2026-10-16-fix-stale-tab-health
dirty_tree: false
areas: [stale-tab-save-v4-guardedput-othertab-refusal-card, offline-readiness-sw-status-parent-section, ui-art-health-obrazki, music-status-unsaved-sound-pref-dzwieki]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-16_0915-start-dzwieki-grafika-salon.md  # PR #73, not merged to main
findings: { critical: 0, high: 0, medium: 7, low: 8 }
---

# Audyt obserwowalności: stara karta, gra bez internetu, obrazki ekranów i stan muzyki (2026-10-16)

Ten raport zamyka run `2026-10-16-fix-stale-tab-health`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #75 | fix `stale-tab-and-health` (B-1, G-1, S-1, P-1 i poboczne z audytu 2026-10-16 09:15) | `1a3edb4` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Stara karta:** stara karta albo stare okno PWA nie nadpisuje nowszego postępu (zapis v4, `guardedPut`, `otherTab`, karta odmowy dla dziecka).
- **Gra bez internetu:** stan rejestracji i instalacji service workera, sekcja „Gra bez internetu” w panelu rodzica.
- **Obrazki ekranów:** zdrowie `UI_ART` w sekcji „Obrazki”.
- **Dźwięki:** stan muzyki i niezapisane ustawienie dźwięku w sekcji „Dźwięki”.

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po czterech kanałach:

1. co widzi dziecko;
2. karty DOM;
3. panel rodzica za bramką (czytany raz, przy otwarciu);
4. konsola tabletu (bez map źródeł).

Lokalizacje w tabelach są podane jako plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 7 MEDIUM, 8 LOW.** Wszystkie cztery HIGH z audytu 09:15 (B-1, G-1, S-1, P-1) mają teraz sygnał w co najmniej jednym kanale człowieka. B-1, B-2, G-1, S-1, S-3, S-6, S-8, S-11 i B-7 są zamknięte. P-1 i B-8 są zamknięte częściowo.
- **Przyczyna 1: ochrona działa tylko od buildu v4 w górę.** `writeVerdict` (`src/core/save.ts`) odróżnia karty tego samego formatu po `generation` i `writer`. Okno z buildu sprzed #69 (bez `guardedPut`) dalej zapisuje surowe v3 na v4, a okno z #69–#72 dostaje odmowę `NewerSave` bez karty. Strona v4 mogłaby to wykryć (zapisana wersja niższa niż ta, którą sama zapisała), ale nie wykrywa (T-1).
- **Przyczyna 2: odmowa przychodzi przy pierwszym zapisie, nie przy otwarciu.** Nieaktualne okno dowiaduje się o tym dopiero przy zapisie, więc runda zagrana w tym oknie przepada, a karta przychodzi po niej (T-2, znany follow-up Web Locks/`BroadcastChannel`).
- **Przyczyna 3: sygnał bez przyczyny.** „Gra bez internetu” mówi, że instalacja się nie udała, ale kod to zawsze stała `InstallFailed`. Prawdziwa przyczyna (404 wpisu precache, brak miejsca) zostaje w konsoli service workera, a smoke deployu dalej nie sprawdza, czy pliki z precache są serwowane (O-1). Po nieudanej aktualizacji za aktywnym workerem linia mówi „gotowa” z kodem i nie mówi, że urządzenie zostaje na starym buildzie (O-2).
- **Przyczyna 4: zapasy dalej bez śladu.** „Obrazki” liczą brakujące obrazki ekranów, ale wybrany zapas (G-2), miniatura salonu (G-3) i powód „odcięte limitem” (B-4) nadal docierają tylko do hooka e2e. „Dźwięki” pokazują stan muzyki, ale zablokowany kontekst audio przy efektach dalej jest cichy (S-4 → M-1).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-16 09:15)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i sieci. Granica błędów `installErrorBoundary` i `QUIET_REJECTIONS` bez zmian (S-2 otwarte).
- **Zapis (format v4):**
  - `SAVE_VERSION` 4, `MIGRATIONS[3]` dodaje `generation: 0` i `writer: ''`; kopia surowego v3 idzie do `profile:default:backup-v3` według tej samej polityki co wcześniejsze kopie.
  - `createIdbSaveStore` (`src/storage/idb.ts`) ma jednego `writer` na załadowanie strony (`randomWriter`) i `base`, czyli ostatnią generację widzianą przy odczycie albo zapisie.
  - `guardedPut` w jednej transakcji `readwrite` pyta czystą regułę `writeVerdict`: nowszy format → `NewerSave`; inny `writer` z generacją wyższą niż `base` → `OtherWriterSave` (tylko tryb `normal`; `replace` z importu i resetu go pomija); w pozostałych przypadkach zapis z generacją `max(stored, base) + 1`. `os.put` jest w `try/catch` (B-7).
  - Autosaver ustawia `blockedBy` na `newer` albo `otherTab`, kasuje timer i raz woła `onBlocked`. `src/main.ts` montuje wtedy `mountSaveRefusedCard` („Zacznijmy grę jeszcze raz”, przycisk przeładowuje stronę, karta trzyma przełącznik wejścia). Rodzic widzi przyczynę w „Zapis gry” (`offState`), a `replaceGate` odmawia importu i resetu.
- **Service worker:** `registerServiceWorker` (`src/pwa/registerServiceWorker.ts`) tłumaczy zdarzenia cyklu życia (`controllerchange`, `updatefound`, `statechange`, wynik `register`) na czysty reduktor `stepSw` (`src/core/swStatus.ts`). `main.ts` trzyma ostatni stan i wpisuje go do `REGISTRY_KEYS.swStatus`, gdy gra powstanie. `UIScene.openSettings` czyta `offlineView` raz przy otwarciu panelu, a `createOfflineView` (`src/ui/dom/offlineView.ts`) rysuje sekcję „Gra bez internetu”: jedna linia na fazę, `Kod:` z nazwą błędu i buildem, linia „Nowsza wersja gry jest gotowa” po przejęciu. Nieudana rejestracja loguje `Service worker registration failed (<name>)`. Kodem nieudanej instalacji jest zawsze stała `INSTALL_FAILED`.
- **Obrazki:** `BootScene.create` liczy trzeci rekord `artHealth` dla `UI_ART` (`REGISTRY_KEYS.uiArtHealth`, tylko runtime) i loguje `UI art missing: n of m: …`. „Obrazki” mają trzecią linię (`pl.settings.uiArtOk` / `uiArtMissing`), a stan sekcji liczy `sectionState` ze wszystkich trzech linii.
- **Dźwięki:** `MusicState` ma osobny stan `waiting-unlock` (S-3). Czysta reguła `musicLine` daje jedną wyciszoną linię pod muzyką: wczytuje się, ruszy po dotknięciu, nie wczytała się. `UIScene.applySettings` wpisuje wynik `SoundPrefStore.write` do `REGISTRY_KEYS.soundPrefsKept`, a panel pokazuje wtedy „Ustawienie dźwięku obowiązuje tylko do zamknięcia gry”. Awaria konfiguracji dźwięku w `BootScene.create` oznacza wszystkie efekty jako brakujące (`allEffectKeys`).
- **Przegląd repozytorium** (`src/` bez `src/testing`, `grep`):

  | | Audyt 09:15 | Teraz |
  |---|---|---|
  | linie z `catch` | 35 | 42 |
  | `console.error/warn` | 32 | 36 |
  | `.catch(() => undefined)` | 2 | 1 (`installHint` `prompt()`; rejestracja SW już nie) |

  Nowe bloki `catch` mają nazwę albo linię w konsoli, z jednym wyjątkiem: `emit` w `registerServiceWorker` połyka błąd słuchacza bez śladu (O-5). Liczby z 09:15 mogły być liczone innym wzorcem, więc porównanie jest przybliżone.
- **Seamy e2e:** run nie dodał nowych parametrów. Specy `stale-tab.spec.ts` (dwa okna, reset w jednym) i `health-lines.spec.ts` (#8 P-1 offline, #14 G-1 obrazek ekranu) działają na istniejących seamach.

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola | Werdykt |
|---|---|---|---|---|
| Dwa okna buildu v4, nieaktualne zapisuje po nowszym | karta „Zacznijmy grę jeszcze raz” przy pierwszym zapisie; runda z tego okna przepada | „Zapis gry”: wyłączony, `otherTab`, `Kod: OtherWriterSave` (dopiero po przeładowaniu, bo karta blokuje panel) | `autosave: write failed OtherWriterSave` | **caught** (e2e `stale-tab` #2); późno (T-2) |
| Okno buildu #69–#72 (v3 ze strażnikiem) obok v4 | gra dalej bez zapisu | tylko w tamtym oknie, za bramką | `NewerSave` | missed dla dziecka (T-1, stary kod na urządzeniu) |
| Okno buildu sprzed #69 (bez strażnika) obok v4 | postęp okna v4 nadpisany surowym v3; przy następnym starcie migracja jeszcze raz | nic | `Save migrated from v3` | **missed** (T-1) |
| Pierwsza instalacja SW pada (404 w precache, brak miejsca) | gra działa online, offline nie | „Nie udało się przygotować gry do działania bez internetu”, `Kod: InstallFailed` | brak przyczyny w konsoli strony | caught; przyczyna zgubiona (O-1) |
| Aktualizacja SW pada za aktywnym workerem | stary build online i offline | „Gra jest gotowa…” + `Kod: InstallFailed` | nic | częściowo; nie mówi „zostajesz na starym buildzie” (O-2) |
| Rejestracja SW odrzucona | gra działa online | „Gra nie przygotuje się…” + kod | `Service worker registration failed (<name>)` | **caught** |
| Brak pliku `UI_ART` | rysowany zapas | „n z m obrazków ekranów nie wczytało się” | `UI art missing: …` | **caught** (e2e #14); wybrany zapas i powód nadal niewidoczne (U-1, U-2) |
| Muzyka nie wczytała się / czeka na odblokowanie | cisza | linia pod muzyką | `Music missing: …` | **caught**; przyczyna (404, timeout, dekodowanie) dalej jedna linia (S-5) |
| Kontekst audio nigdy nieodblokowany (iOS) | cisza | „Muzyka ruszy po pierwszym dotknięciu” mimo wielu dotknięć; nic o efektach | nic | missed / mylące (M-1) |
| `localStorage` odmawia zapisu ustawienia | wybór działa do zamknięcia | linia „obowiązuje tylko do zamknięcia gry” w tej sesji; po restarcie brak linii | warn | caught w sesji; po restarcie nie (M-2) |

## 4. Systemowe przyczyny źródłowe

1. **Strażnik jest po stronie piszącego, a stary kod nie ma strażnika.** Ochrona v4 jest poprawna, ale chroni tylko przed oknami, które same ją mają. Okna buildów sprzed #69 i z #69–#72 żyją na urządzeniach (instancja PWA w tle) i piszą albo cicho przegrywają. Strona v4 widzi ślad tego w magazynie (niższy `version`, brak `generation` po własnym zapisie), ale tego nie raportuje. Wyjaśnia T-1.
2. **Wykrycie przy zapisie zamiast przy otwarciu.** Reguła siedzi w transakcji zapisu, więc nieaktualne okno nie wie, że jest nieaktualne, dopóki nie zapisze. Rozsądny wybór (zero nowych API, jedna transakcja), ale koszt ponosi dziecko: runda w nieaktualnym oknie przepada, a karta blokuje panel z przyczyną. Wyjaśnia T-2, T-3, T-5.
3. **Stan bez przyczyny.** Reduktory runtime (`stepSw`, `musicLine`, `artHealth`) mówią *że*, ale nie *dlaczego*: `INSTALL_FAILED` jest stałą, `missing` muzyki nie odróżnia 404 od dekodowania, „Obrazki” nie wiedzą o odcięciu limitem. Przyczyna bywa w konsoli (service workera albo `loaderror` z błędną etykietą), do której rodzic nie ma dostępu. Wyjaśnia O-1, O-2, U-2, U-3, S-5.
4. **Zapasy dalej bez śladu.** Rysowany portfel, zeszyt i miniatura salonu działają, ale wybór zapasu trafia tylko do hooka e2e. Wyjaśnia U-1.

## 5. Ustalenia według obszaru

### 5.1 Stara karta i zapis v4

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| T-1 | `src/core/save.ts` `writeVerdict`; `src/storage/idb.ts` `createIdbSaveStore` (`base`) | coverage-gap | medium | Okno z buildu sprzed #69 zapisuje surowe v3 po zapisie v4 (bez strażnika). Następny zapis okna v4 widzi rekord bez `generation`, traktuje go jak generację 0 i nadpisuje go bez słowa. Następny start migruje v3 → v4 drugi raz (follow-up P-8 o drugiej kopii `backup-v3`). Okno z #69–#72 dostaje `NewerSave` i nie ma karty dla dziecka. Ryzyko maleje z czasem, ale dziś jest niewidoczne w każdym kanale. | W `writeVerdict` rozpoznać „zapisana wersja niższa niż `page.version`, a `base > 0`” jako regresję: zapisać dalej, ale ustawić runtime `olderWriterSeen` z linią w „Zapis gry” i `console.warn`. |
| T-2 | `src/core/autosave.ts` `createAutosaver` (`onBlocked`); `src/main.ts` `onBlocked` | coverage-gap | medium | Nieaktualne okno działa normalnie do pierwszego zapisu (koniec rundy, zakup, ukrycie karty). Postęp z tego czasu przepada, a karta przychodzi po fakcie. Znany follow-up „Earlier stale signal”. | Web Locks albo `BroadcastChannel` z ogłoszeniem generacji po każdym zapisie; karta od razu. |
| T-3 | `src/storage/idb.ts` `guardedPut` (wyścig przy przeładowaniu, plan-review F4) | noise | low | Zapis poprzedniego dokumentu tej samej karty, który dociera po odczycie nowego, daje kartę odmowy po zwykłym przeładowaniu. Nic nie przepada, ale konsola i panel mówią „inne okno”, a innego okna nie ma. | Odróżnić w logu `writer` poprzedniego dokumentu tej samej karty (np. `sessionStorage`) od innego okna. |
| T-4 | `src/core/autosave.ts` `Autosaver.replace` (`write(state, 'replace')`); `src/ui/dom/saveImportDialog.ts` / `saveResetDialog.ts` | missing-context | low | Import albo reset z okna jeszcze nieodrzuconego pomija kontrolę generacji, a podsumowanie urządzenia w dialogu pokazuje zapis wczytany przez to okno, nie nowszy zapis w magazynie (plan-review F6). Rodzic potwierdza nadpisanie postępu, którego nie widzi. | Przed `replace` świeży odczyt i podsumowanie z magazynu, gdy `generation > base`. |
| T-5 | `src/ui/dom/saveRefusedCard.ts` `mountSaveRefusedCard` | coverage-gap | low | Karta trzyma przełącznik wejścia, więc rodzic nie otworzy „Zapis gry”, żeby przeczytać przyczynę (`newer` czy `otherTab`) przed przeładowaniem, a po przeładowaniu stan runtime znika. Przyczyna zostaje tylko w konsoli. Znany follow-up. | Wyciszony `Kod:` (nazwa błędu + build) na samej karcie, jak w karcie nieczytelnego zapisu. |

### 5.2 Gra bez internetu

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| O-1 | `src/core/swStatus.ts` `INSTALL_FAILED`, `stepSw` (`redundant`); `scripts/deploy-check/parse.ts` / `scripts/check-deploy.ts` (P-3 z 09:15) | missing-context | medium | Rodzic czyta „Nie udało się przygotować gry…” z `Kod: InstallFailed` dla każdej przyczyny. Workbox loguje brakujący URL albo `QuotaExceededError` tylko w konsoli service workera. Najbardziej prawdopodobna przyczyna (404 wpisu precache po deployu) dalej przechodzi smoke, bo smoke sprawdza listę w `sw.js`, a nie odpowiedzi serwera. | Smoke: HEAD każdego wpisu precache (status i typ). Opcjonalnie: SW przekazuje nazwę błędu instalacji przez `postMessage` do klientów. |
| O-2 | `src/core/swStatus.ts` `stepSw` (`redundant` przy `active`), `LINES`; `src/ui/dom/offlineView.ts` | missing-context | medium | Aktualizacja pada za aktywnym workerem: faza zostaje `ready`, panel mówi „Gra jest gotowa do działania bez internetu” z `Kod: InstallFailed`. Urządzenie zostaje na starym buildzie (precache serwuje stary `index.html`) do udanej instalacji, a panel tego nie mówi. Build id strony nie zdradza, że jest stary. Częściowo follow-up „Worker build id”. | Osobna linia `updateFailed` („gra działa w starszej wersji”) i build id aktywnego workera. |
| O-3 | `src/pwa/registerServiceWorker.ts` (brak `registration.update()`) | coverage-gap | low | Nowszy build jest wykrywany wtedy, gdy przeglądarka zdecyduje. Bramka wizualna widziała `takenOver` dopiero po ręcznym `update()` (follow-up VG-1). Linia „Nowsza wersja gry jest gotowa” może nigdy nie przyjść. | `update()` przy starcie i przy powrocie z tła. |
| O-4 | `src/core/swStatus.ts` `stepSw`; `registerServiceWorker` (`.then`: tylko `active` i `installing`) | coverage-gap | low | Bez kontrolera, gdy `register()` zwróci rejestrację tylko z workerem `waiting`, żadne zdarzenie nie przychodzi i panel do końca sesji mówi „Gra przygotowuje się… Poczekaj chwilę”. Mało prawdopodobne przy `skipWaiting`. | Obsłużyć `registration.waiting` jak `installed`. |
| O-5 | `src/pwa/registerServiceWorker.ts` `emit` (`catch {}`) | swallowed | low | Błąd słuchacza statusu znika bez linii. Panel pokazuje wtedy ostatni stan sprzed błędu albo nie ma sekcji. Dziś słuchacz to jedno `registry.set`, więc ryzyko jest małe. | `console.warn` z nazwą błędu. |

### 5.3 Obrazki ekranów (`UI_ART`)

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| U-1 | `src/ui/widgets/CoinWallet.ts` `walletArtLoaded`; `src/ui/widgets/UnlockCard.ts` (`firstLoaded`); `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile`; `src/core/artPick.ts` `miniatureMode` | swallowed | medium | Bez zmian od 09:15 (G-2, G-3). „Obrazki” mówią, ile obrazków ekranów brakuje, ale nie, który zapas widzi dziecko. Kafelek „Pokój gotowy!” dalej pokazuje domyślną miniaturę salonu zamiast wyboru dziecka, gdy brakuje dowolnego elementu, a klucz miniatury jest wspólny dla każdego pokoju. | Zapisać wybrany zapas w rekordzie `uiArtHealth`; miniatura na pokój. |
| U-2 | `src/scenes/BootScene.ts` `publish` (`REGISTRY_KEYS.bootLoad`); `src/ui/dom/artHealthView.ts` `createArtHealthView` | logged-not-captured | medium | Bez zmian od 09:15 (B-4). Trzy linie „Obrazki” liczą braki, ale nie odróżniają pliku odciętego limitem 50 s (wolny pierwszy start, pomaga restart) od pliku, którego nie ma na serwerze (restart nie pomoże). Tekst każe zawsze „Uruchom grę ponownie”. | `bootLoad.cut.length` i jedna linia „część obrazków nie zdążyła się wczytać”. |
| U-3 | `src/scenes/BootScene.ts` `preload` (listener `loaderror`) | missing-context | low | Bez zmian od 09:15 (B-5). Brakujący obrazek `ui/*` loguje „Task art failed to load: key”, bez URL-a i statusu. Nowa linia `UI art missing: …` w `create` daje teraz poprawne klucze, więc ślad w konsoli jest, tylko podpisany dwa razy różnie. | Etykieta według prefiksu klucza, `file.url`, status. |

### 5.4 Dźwięki

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| M-1 | `src/ui/sound.ts` `play` (`soundOutcome` `'locked'`), `playMusic` (`waiting-unlock`); `src/core/sound.ts` `musicLine` | coverage-gap | medium | Poszerza S-4. Gdy iOS nie odblokuje kontekstu audio, panel mówi „Muzyka ruszy po pierwszym dotknięciu ekranu”, choć rodzic dotknął ekranu wiele razy (otwarcie panelu też jest dotknięciem). Efekty w tym stanie są `locked` i nie mają żadnej linii, więc przy wyłączonej muzyce panel nie mówi nic. | Licznik dotknięć po `waiting-unlock`/`locked`; po N próbach linia „Urządzenie nie pozwala grać dźwięków” także dla efektów. |
| M-2 | `src/scenes/UIScene.ts` `applySettings` (`soundPrefsKept`); `src/storage/soundPrefs.ts` `createSoundPrefStore` `read` | coverage-gap | low | `prefsKept` powstaje tylko przy zmianie ustawień w tej sesji. Po restarcie na urządzeniu, które odmawia zapisu, panel pokazuje wartości domyślne (muzyka wyłączona) bez linii, aż rodzic zmieni coś drugi raz. Odczyt, który rzuca, zostawia tylko `console.warn`. | Przy starcie próbny zapis albo zapamiętanie, że `deviceStorage()` zwrócił `undefined`, i ta sama linia od razu. |

Bez zmian i nadal otwarte (follow-upy runu): S-2 (`QUIET_REJECTIONS`), S-5 (jedna linia dla 404, timeoutu i dekodowania muzyki), S-7 (`parseSoundPrefs` cicho), S-9 (licznik braków tylko ze startu), S-10 (ostrzeżenie przy każdym dotknięciu).

## 6. Rekomendowana kolejność poprawek

1. **Smoke na serwowanych plikach (O-1, P-3 z 09:15).** HEAD każdego wpisu precache po deployu. To jedyna zmiana, która wychwyci przyczynę nieudanej instalacji, zanim dotrze do urządzeń. Ograniczenie: dotyczy `scripts/`, nie `deploy/`; rollback bez SHA (P-2) trzeba obsłużyć w tej samej zmianie.
2. **Linia „gra działa w starszej wersji” (O-2, O-3).** `updateFailed` w `stepSw`, `update()` przy starcie. Czysty reduktor już istnieje, więc koszt jest mały.
3. **Wykrycie starszego piszącego (T-1).** Jedna gałąź w `writeVerdict`, flaga runtime, linia w „Zapis gry”. Bez zmiany formatu.
4. **Powód w „Obrazki” (U-2, U-1).** `bootLoad.cut` i wybrany zapas w rekordzie runtime.
5. **Wczesny sygnał nieaktualnego okna (T-2, T-5).** Web Locks albo `BroadcastChannel`; `Kod:` na karcie odmowy. Większa zmiana, warto ją połączyć z następną zmianą formatu (follow-up).
6. **Dźwięki (M-1, M-2, S-5, S-2).** Linia „urządzenie nie pozwala grać dźwięków”, stan ustawienia od startu, przyczyna błędu muzyki.
7. **Reszta niskich**: T-3, T-4, O-4, O-5, U-3.

Ograniczenia każdej poprawki:

- nic nie opuszcza urządzenia;
- tekst dla rodzica tylko w `src/data/pl.ts`;
- `src/core` bez przeglądarki;
- zapis zostaje v4, chyba że opiekun zdecyduje o v5.

## 7. Zmiany od ostatniego audytu (2026-10-16 09:15, PR #73)

| Poprzedni id | Status | Dowód |
|---|---|---|
| B-1 (stara karta tego samego formatu nadpisuje postęp) | **fixed** (od buildu v4) | `writeVerdict` (`src/core/save.ts`) z `generation`/`writer`, `guardedPut` w jednej transakcji, `OTHER_WRITER_SAVE`; unit `saveV4.test.ts`, `idbStore.test.ts`; e2e `stale-tab` #2 (dwa okna, reset w jednym). Pozostaje T-1 (okna starszych buildów) i T-2 (wykrycie przy zapisie). |
| B-2 (brak sygnału dla dziecka przy `newer`) | **fixed** | `onBlocked` w `createAutosaver` + `mountSaveRefusedCard` (`src/main.ts`), raz na załadowanie, dla `newer` i `otherTab`. |
| B-7 (`os.put` bez `try`) | **fixed** | `guardedPut` `put`: `try/catch` i `reject`. |
| B-8 (build nie wie, że jest nieaktualny) | **changed (częściowo)** | `controllerchange` → `takenOver` i linia „Nowsza wersja gry jest gotowa” w panelu; nieaktualna sesja jest zatrzymywana przy zapisie (B-1), a nie kartą od razu (T-2). Wykrycie nowszego buildu zależy od przeglądarki (O-3). |
| P-1 (nieudana instalacja SW połknięta) | **changed (częściowo)** | `stepSw` + sekcja „Gra bez internetu”, `console.warn` przy odrzuconej rejestracji; e2e `health-lines` #8. Przyczyna instalacji zgubiona (O-1), aktualizacja za aktywnym workerem wygląda jak „gotowa” (O-2). |
| G-1 (`UI_ART` bez rekordu) | **fixed** | trzeci rekord `artHealth` w `BootScene.create`, `REGISTRY_KEYS.uiArtHealth`, linia w „Obrazki”, `UI art missing` w konsoli; e2e `health-lines` #14. |
| G-2, G-3 (zapasy, miniatura) | still open | U-1. |
| B-4 (powód „odcięte limitem”) | still open | U-2. |
| B-5 (etykieta `loaderror`) | still open | U-3. |
| S-1 (stan muzyki niewidoczny) | **fixed** | `musicLine` + `pl.settings.musicStatus`; `UIScene.openSettings` przekazuje `status().music`. |
| S-3 (`loading` = pobieranie i czekanie) | **fixed** | `MusicState` `waiting-unlock`. |
| S-4 (zablokowany kontekst cichy) | still open, poszerzone | M-1: nowa linia muzyki może mylić przy nieodblokowanym kontekście. |
| S-6 (niezapisane ustawienie dźwięku) | **fixed** w sesji | `soundPrefsKept` + `pl.settings.soundPrefsNotKept`; po restarcie M-2. |
| S-8 (awaria konfiguracji dźwięku = „wszystko w porządku”) | **fixed** | `allEffectKeys` w `catch` w `BootScene.create`. |
| S-11 (`sound.play()` muzyki bez osłony) | **fixed** | `try` w `start` w `playMusic`, `musicState = 'missing'`. |
| S-2, S-5, S-7, S-9, S-10 | still open | Kod bez zmian (`src/core/errorSignal.ts` poza diffem runu; `startMusic` bez `loaderror`; `play` loguje każdą porażkę). Follow-upy runu. |
| P-2..P-6 | not re-checked | Poza obszarami; follow-up runu mówi, że nietknięte. O-1 korzysta z P-3. |
| B-3, B-6, G-4..G-7, R-1..R-6 | not re-checked | Poza obszarami tego runu. |

## 8. Metoda i ograniczenia

- **Sposób:** diff runu (`9a64fd6..1a3edb4`, 25 plików w `src/`, ok. 440 dodanych linii) przeczytany w całości przez audytora prowadzącego, bez rozdzielania na subagentów (decyzja niżej). Odczytane w całości także `src/ui/sound.ts` (`createSoundService`), `src/storage/soundPrefs.ts`, `BootScene.create`, follow-upy zmiany `stale-tab-and-health` i nagłówek `deploy/README.md` (rollback poniżej v4).
- **Sprawdzone ręcznie:**
  - `writeVerdict` odmawia tylko w trybie `normal` i tylko przy innym `writer` z generacją wyższą niż `base`; rekord v3 bez `generation` daje 0 (podstawa T-1);
  - `createIdbSaveStore` ma jedno wywołanie w `src/main.ts`, więc jeden `writer` na stronę;
  - `INSTALL_FAILED` jest jedynym kodem dla `redundant` (O-1), a `redundant` przy `active` daje fazę `ready` (O-2);
  - `.then` w `registerServiceWorker` obsługuje tylko `active` i `installing` (O-4);
  - `soundPrefsKept` jest ustawiane tylko w `UIScene.applySettings` (M-2);
  - `musicLine` pokazuje `waitingUnlock` bez względu na liczbę dotknięć (M-1).
- **Odrzucone po sprawdzeniu:** podejrzenie, że offline `register()` odrzuca obietnicę i panel pokazuje „nie przygotuje się” przy każdym starcie bez sieci. Według algorytmu Register specyfikacji Service Workers istniejąca rejestracja z tym samym URL-em skryptu rozwiązuje się od razu, bez pobierania, więc ta ścieżka nie występuje.
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond ani przeglądarki.
  - T-1 (okno buildu sprzed #69 obok v4) jest przeczytane z kodu; e2e na dwóch prawdziwych buildach nie istnieje (follow-up runu).
  - O-1/O-2: zachowanie Workboxa przy 404 i braku miejsca oraz to, że urządzenie zostaje na starym buildzie, wynikają z konfiguracji (`skipWaiting`, `clientsClaim`, precache), a nie z pomiaru.
  - M-1: WebKit/iPad (nieodblokowany kontekst audio) nie był testowany.
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (cztery), bez pytania. Zmieniłoby to: polecenie opiekuna, by audytować inne przepływy.
- **`--runtime`:** nieuruchomiony (krok wyraźnie statyczny). Zmieniłoby to: przekazanie `--runtime` albo potrzeba dowodu T-1 lub O-1.
- **Poprzedni raport:** 2026-10-16 09:15 z gałęzi PR #73 (niezmergowany, brak go na `main`), bo to źródło slice'u fix tego runu. Odrzucony: ostatni raport na `main` (2026-10-13 17:51). Zmieniłoby to: zamknięcie PR #73 bez merge'a i decyzja, że historia ma iść tylko po `main`.
- **Bez subagentów:** skill zaleca jednego audytora na obszar plus audytora infrastruktury. Diff runu ma ok. 440 linii w 25 plikach, a wszystkie cztery obszary dzielą te same pliki (`UIScene.openSettings`, `settingsPanel.ts`, `main.ts`), więc jeden czytelnik całego diffu był pewniejszy i tańszy niż pięć fragmentów do scalania. Odrzucone: rozdzielenie na pięciu audytorów. Zmieniłoby to: run zmieniający więcej niż kilkaset linii albo obszary w rozłącznych plikach.
- **Ważność T-1:** MEDIUM, nie HIGH. Za HIGH: cicha utrata postępu. Za MEDIUM: dotyczy tylko okien buildów sprzed v4, których z każdym dniem jest mniej, a rollback poniżej v4 jest udokumentowany (`deploy/README.md`). Zmieniłoby to: zgłoszenie z urządzenia o cofniętym postępie po aktualizacji.
- **Pytania skilla do użytkownika** (dostosowanie obszarów, uruchomienie sond, usunięcie harnessu): nie zadane, zgodnie z kontraktem runu. Wybrano domyślne.
