---
type: observability-audit
date: 2026-10-15 20:10
mode: audit
commit: 7f831c5
branch: docs/observability-audit-2026-10-15-s16a-salon-art
dirty_tree: false
areas: [salon-renovation-final-art, legacy-salon-remap-at-load, salon-art-boot-loading-parent-art-line]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md
findings: { critical: 0, high: 2, medium: 6, low: 9 }
---

# Audyt obserwowalności: salon z docelowej grafiki, remap starego zapisu, ładowanie grafiki (2026-10-15)

Ten raport zamyka run `2026-10-15-s16a-salon-art`: jeden slice S-16a `final-art-salon` (PR #61, merge `75678da`, plus poprawka testów #62, `7f831c5`; wdrożenie 38781791399). Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- remont salonu z docelowej grafiki: etap tła (przed → po jednym stuknięciem), 6 mebli × 3 warianty w panelu, karta „Pokój gotowy!” z miniaturą, animacje z „ogranicz ruch” (`RoomScene`, `RoomView`, `RoomLayer`, `VariantPanel`, `RoomDoneCard`, `src/core/rooms.ts`, `src/ui/motion.ts`);
- przeliczenie starego zapisu 10-slotowego salonu przy wczytaniu (`remapLegacySalon`, `LEGACY_SALON`, `src/main.ts` `start`; format zapisu v2 bez zmian);
- ładowanie grafiki salonu w `BootScene` z ekranem ładowania (`LoadingScreen`) i linia „Obrazki” w panelu rodzica (`roomArtHealth`, `createArtHealthView`).

Model oceny jest ten sam co w poprzednich raportach. Gra nie ma backendu ani trackera i z założenia nic nie wysyła z urządzenia. „Czego nie widzimy” oceniamy po tym, co widzą dziecko, karty DOM, panel rodzica (za bramką) i konsola (bez map źródeł).

## 1. TL;DR

- **0 CRITICAL, 2 HIGH.** Ścieżki „brak obrazka” są dobrze obsłużone: zastępstwa z polskim podpisem, licznik dla rodzica, `console.warn` z kluczami, poszanowanie „ogranicz ruch” wszędzie w przepływie.
- **Przyczyna 1: zmiana znaczenia zapisu poza łańcuchem migracji.** `remapLegacySalon` zmienia znaczenie `tasksDone` (pozycja w liście 10 → 7 zadań) przy `SAVE_VERSION` = 2. Nie ma kopii zapasowej starego salonu, odmowy `future` po rollbacku ani śladu w statusie. Rollback do buildu sprzed S-16a po cichu pokaże złe meble i przy następnej aktualizacji przeliczy postęp drugi raz (H-1). Znacznik „dowolny nieznany klucz” uruchomi remap także na przyszłym zapisie z dopisanym slotem (M-2).
- **Przyczyna 2: etap ładowania nie ma modelu awarii zawieszenia.** Phaser ma `loader.timeout` = 0 (brak limitu), a `createGame` go nie ustawia. Jedno zawieszone żądanie przy pierwszym uruchomieniu online to wieczny pasek ładowania: bez karty, bez zębatki, bez wpisu w konsoli (H-2). Slice dodał 26 żądań (~1,3 MB).
- **Przyczyna 3: diagnoza kończy się na konsoli tabletu.** Remap, brak obrazków pokoju i porażka zapisu po zakupie mają dla rodzica tylko licznik albo nic; `loaderror` nazywa pliki pokoju „Task art”.
- **Przyczyna 4: smoke po wdrożeniu sprawdza kod, nie treść.** `check:deploy` porównuje bundle JS z precache, ale nie grafikę salonu, która jest dziś większością precache.

## 2. Model przechwytywania (zmiany względem raportu 2026-10-13 17:51)

- **Platforma i tracker:** bez zmian. Klient-only offline PWA, bez trackera i bez sieci. Granica `installErrorBoundary` nadal przed `start()` i `createGame` w `src/main.ts`.
- **Start (`src/main.ts` `start`):** `loadSave` (z migracją v1 → v2 i kopią `backup-v1`) → `floorToCalendar` → `repairCurrentRoom` → **nowe** `remapLegacySalon(repaired.session, LEGACY_SALON, SALON)` i `console.warn("Salon save from the old task list (<n> done) carried…")` → `createGame` (`preBoot` ustawia rejestr) → `createAutosaver` → nasłuch `setdata`/`changedata` na `SAVE_KEYS`. Stan przeliczony w `preBoot` powstaje **przed** nasłuchem, więc nie jest oznaczony do zapisu.
- **`BootScene.preload`:** **nowy** `LoadingScreen` (handler `progress` w `try/catch` → `console.warn('Loading bar failed')`), kolejka `TASK_ART` i **nowa** `ROOM_ART` (`src/data/roomArt.ts`, 26 plików WebP z `public/assets/rooms/`). `loaderror` loguje `Task art failed to load: <key>` dla każdego pliku poza czcionką. Błąd dekodowania idzie przez `File.onProcessError` Phasera (własny `console.error`, bez `loaderror`).
- **`BootScene.create`:** `artHealth` dla obrazków zadań → `REGISTRY_KEYS.artHealth` oraz **nowe** `roomArtHealth` → `REGISTRY_KEYS.roomArtHealth` (oba z `textures.exists`, więc błąd pobrania i dekodowania liczą się jednakowo), `console.warn` z listą brakujących kluczy. Oba klucze są runtime, poza `SAVE_KEYS`.
- **Panel rodzica:** sekcja „Obrazki” (`createArtHealthView`) ma drugą linię dla pokoju (`pl.settings.roomArtOk` / `roomArtMissing(count, total)`); atrybut `data-state` sekcji odzwierciedla tylko obrazki zadań.
- **Pokój:** `RoomLayer.show` rysuje zastępstwo z podpisem z `roomText` dla mebli i dekoracji; brak obrazu sceny → kolorowe tło `RoomView.drawBackdrop`; zakup → `void saver.flush('now')` (nigdy nie odrzuca, porażka trafia do `AutosaveStatus`).
- **Seam e2e:** `?e2eArt=room` (tylko build hooka, marker `e2eArt` w `vite/e2eHookGuard.mjs`) nie kolejkuje żadnego obrazka pokoju; `?e2eSave=legacy-salon` podaje stary salon.
- **Przegląd repo (`src/` bez `src/testing`, baza `334ff69` → `7f831c5`):** bloki `catch` 24 → 25, `.catch(` 2 → 2, `console.*` 15 → 18, puste `catch` 0 → 0. Nowe: `catch` paska ładowania, `console.warn` paska, braku obrazków pokoju i remapu salonu. Nowe callbacki to tylko `onComplete` tweenów w pętli Phasera (wyjątek dociera do granicy).

## 3. Co dociera do obserwatora (statycznie; e2e z runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Opiekun / konsola | Werdykt |
|---|---|---|---|---|
| Plik pokoju 404 / brak sieci | zastępstwo z podpisem albo kolorowe tło | „Obrazki”: licznik pokoju | `Task art failed to load: <key>` (zła etykieta) + `Room art missing: n of 26: …` | caught (e2e `salon-art.spec` „stand-ins”, tylko „wszystko brak”) |
| Plik pokoju uszkodzony (dekodowanie) | jak wyżej | licznik | `console.error` Phasera `Failed to process file`, potem `Room art missing` | caught, bez seamu e2e |
| Żądanie zawisa (pierwsze uruchomienie online) | **wieczny pasek ładowania** | brak zębatki | nic | **missed (H-2)** |
| Precache niepełny po wdrożeniu (404 na serwerze) | stary build zostaje (instalacja SW all-or-nothing) | nic | nic; `registerServiceWorker` `.catch(() => undefined)` | **missed (M-6)** |
| Stary 10-slotowy salon | inny układ: zasłony/lampa/roślina jako stała dekoracja, dopisane meble z wariantem 0 | nic | `console.warn` z samą starą liczbą, przy **każdym** starcie do pierwszego zapisu | logged-not-captured (M-1, M-3) |
| Rollback do buildu sprzed S-16a po zapisie przeliczonego salonu | złe meble, potem podwójne przeliczenie | nic | nic | **missed (H-1)** |
| Zakup przy trwałej porażce zapisu | gwiazdki wydane, mebel stoi; po restarcie cofnięte | „Zapis gry”: porażka, tylko po otwarciu panelu | `console.error` | caught dla rodzica, brak e2e (M-5) |
| Wyjątek w `getPixelAlpha` przy dotyku | karta „Ups!” | — | `console.error` | caught, ale za ostro (L-4) |

## 4. Systemowe przyczyny źródłowe

1. **Zmiana znaczenia zapisu jako poprawka przy wczytaniu, nie migracja.** Kontrakt runu zabronił v3 (zapis zostaje v2), więc remap poszedł obok łańcucha `MIGRATIONS`. Skutek: brak kopii, brak odmowy `future`, brak pola w `AutosaveStatus`, heurystyczny znacznik. Wyjaśnia H-1, M-1, M-2, M-3, L-1, L-2.
2. **Etap ładowania zna tylko „brak”, nie „wisi”.** Brak `loader.timeout` i brak strażnika startu; wcześniej pusty canvas, teraz pasek, który nie kończy się. Wyjaśnia H-2, L-6.
3. **Diagnoza zatrzymuje się na konsoli tabletu.** Rodzic dostaje liczniki z ogólną radą („Uruchom grę ponownie”), klucze i powody są tylko w `console.warn`. Wyjaśnia M-4, L-3, L-5 i rozszerza znane H-9 i lukę 67 na grafikę pokoju.
4. **Smoke wdrożenia i seamy e2e pokrywają kod, nie treść.** `check:deploy` nie sprawdza grafiki w precache; seamy `?e2eArt` tylko pomijają pliki (brak przypadku dekodowania, zawieszenia, częściowego braku). Wyjaśnia M-6, L-6, L-7.

## 5. Ustalenia według obszaru

Lokalizacje podane są jako plik + SYMBOL.

### Przeliczenie starego salonu przy wczytaniu

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-1 | `src/core/rooms.ts` `remapLegacySalon` + `src/core/save.ts` `SAVE_VERSION` (2) + `src/main.ts` `start` | identity-lost | high | Po pierwszym zapisie przeliczonego salonu `tasksDone` liczy pozycje w liście 7 zadań. Rollback (`workflow_dispatch` → `rollback`) do buildu sprzed S-16a przyjmuje v2 i czyta np. `tasksDone: 4` jako podłoga, ściany, zasłony, sofa, a `chosen` ma `rug` i `coffee-table`. Dziecko widzi złe meble, zakup tam dopisuje stare klucze, a po ponownej aktualizacji znacznik odpala drugi raz na mieszanym stanie. Rodzic i opiekun: nic. Gorsze niż M-S1, bo `future` tego nie łapie. | v3 z remapem jako `MIGRATIONS[2]` (kopia i odmowa `future` za darmo) — decyzja opiekuna, kontrakt runu wstrzymał v3; do tego czasu reguła w `deploy/README.md`: bez rollbacku poniżej S-16a. |
| M-1 | `src/core/rooms.ts` `remapLegacySalon` (warianty `floor`, `walls`, `curtains`, `lamp`, `plant` porzucane z założenia) + `src/core/autosave.ts` (kopia tylko dla v1) | swallowed | medium | Stary salon jest nadpisany przy pierwszym autozapisie, bez kopii. Jeśli reguła B albo `LEGACY_SALON` okażą się złe w terenie, nie ma czego odtworzyć. | Jednorazowa kopia `profile:default:backup-legacy-salon` przed pierwszym zapisem po remapie (jak `backup-v1`), albo przez łańcuch migracji. |
| M-2 | `src/core/rooms.ts` `remapLegacySalon` (warunek `Object.keys(old.chosen).some((key) => !newSlots.has(key))`) | missing-throw | medium | Znacznikiem jest *dowolny* nieznany klucz, nie znany klucz stary. Zapis z przyszłego buildu z dopisanym 8. slotem (plan: sloty dopisywane na końcu) otwarty po rollbacku albo zaimportowany, albo zmiana nazwy slotu, przepuszcza nowy `tasksDone` przez stare koszty i gubi nieznany klucz. Rozszerza znane M-R4. | Wykrywać `legacyIds.has(k) && !newSlots.has(k)` (klucze z `LEGACY_SALON.tasks`), nieznane nie-stare klucze zachować. |
| M-3 | `src/main.ts` `createGame` `preBoot` (rejestr ustawiany przed nasłuchem `setdata`/`changedata` w `start`) | missing-context | medium | Przeliczony stan nie jest oznaczony do zapisu: remap i `console.warn` powtarzają się przy każdym starcie, aż dziecko coś zmieni. Moment, w którym zapis na urządzeniu stał się nowy, jest niewidoczny (ważne dla H-1). | `saver.markDirty()` gdy `remappedFrom !== null`; `remappedFrom` w statusie runtime. |
| M-4 | `src/main.ts` `start` (`console.warn` tylko ze starą liczbą) + `src/core/saveHealth.ts` `saveHealthView` (brak linii) | missing-context | medium | Dziecko może zobaczyć zniknięte zasłony/lampę/roślinę (teraz stała dekoracja), dopisane meble z wariantem 0, salon gotowy bez karty „Pokój gotowy!” (stare 8–10 → 7). Rodzic: nic w „Zapis gry”. Konsola: bez nowej liczby, bez listy porzuconych i dopisanych. | `console.warn` z `{from, to, dropped, gifted}`; jedno zdanie w „Zapis gry” („Pokój przeniesiony na nowy wygląd”). |
| L-1 | `tests/salonRemap.test.ts` (ręcznie przepisane `tasks`/`legacy`) | coverage-gap | low | Zmiana kosztu w `src/data/rooms.ts` zmienia przeliczenie każdego starego zapisu, a testy zostają zielone; `tests/roomsData.test.ts` zamraża kolejność id, nie koszty. | Test na prawdziwych `LEGACY_SALON`/`SALON` dla starych liczb 0–10 z zamrożoną tabelą wyników. |
| L-2 | `tests/fixtures/save-v1*.json`, `save-v2*.json` (pokój `living`) | coverage-gap | low | „Zamrożone fixture przechodzą bez zmian” przechodzi, bo id pokoju jest inne, nie dlatego, że znacznik był sprawdzony. Prawdziwy kształt starego salonu jest tylko w e2e (`?e2eSave=legacy-salon`), które nie biegnie w CI. | Zamrożony `save-v2-legacy-salon.json` przez decode → floor → repair → remap w vitest. |

Sprawdzone jako dobre: import (`UIScene` podsumowanie) i eksport (`saver.current()`) widzą stan po remapie, więc podgląd i wynik się zgadzają; reguła B mieści każdy przeniesiony mebel w nowym prefiksie, gwiazdki nietknięte, `tasksDone` > 10 przycięte przez `slice`; stary zakup zawsze zapisywał klucz `chosen` (`334ff69` `purchase`), więc realny fałszywy negatyw znacznika nie istnieje; funkcja czysta, idempotentna, inne pokoje zachowane, kolejność po `repairCurrentRoom` poprawna (62 testy `tests/salonRemap.test.ts` zielone).

### Remont salonu z docelowej grafiki

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| M-5 | `src/scenes/RoomScene.ts` `dispatch` (`void saver.flush('now')`) | coverage-gap | medium | Przy trwałej porażce zapisu dziecko widzi wydane gwiazdki i postawiony mebel (albo etap „po”), a po restarcie oba cofają się bez słowa. Rodzic widzi porażkę tylko po otwarciu „Zapis gry”, bez wskazania, że cofnie się zakup. Żaden e2e nie łączy zakupu ani etapu z `?e2eSave=writefail`. | e2e: zakup etapu i mebla pod `writefail`/`writehang` z asercją linii porażki; opcjonalnie „niezapisany zakup” w statusie runtime. |
| L-4 | `src/scenes/RoomScene.ts` `alphaAt` → `textures.getPixelAlpha` (z `pointerdown` przez `slotAt`) | missing-throw | low | Błąd `getImageData` (płótno skażone, gdyby grafika przeszła na inne źródło, utrata kontekstu) ucieka do granicy: karta „Ups!” za test trafienia, który ma bezpieczny fallback (`null` = prostokąt). | `try/catch` → `null` + jednorazowy `console.warn`. |
| L-5r | `src/scenes/RoomScene.ts` `redraw` (otwarty panel bez slotu: `blocked` ukrywa przyciski) | swallowed | low | Doprecyzowanie znanego M-R5r: przy otwartym panelu, gdy bieżące zadanie to etap, panel się nie rysuje, a `blocked` chowa przycisk powrotu i zadania — dziecko bez wyjścia do przeładowania. Dziś nieosiągalne (rejestr nie zmienia się pod otwartym panelem). | Gdy panelu nie da się narysować: zamknąć go i `console.warn`. |
| L-7 | `src/scenes/RoomScene.ts` `snapshot` (`RoomSnapshot` bez stanu warstw), `RoomLayer.showsPicture` nieużywane poza widżetem | coverage-gap | low | Regresja do `__MISSING` albo pustego slotu przeszłaby `salon-art.spec` („stays playable on stand-ins” sprawdza liczniki i zakupy). Brak przypadku częściowego (tylko `after`, jeden wariant). | `picture|standIn|hidden` na warstwę w snapshot hooka; seam jednego pliku. |

Sprawdzone jako dobre: `RoomLayer.show` nigdy nie rysuje `__MISSING` (zastępstwo z polskim podpisem, także miniatury w `VariantPanel`); brak obrazu sceny → `RoomView.drawBackdrop`; `drawRoomMiniature` stosuje te same reguły; „ogranicz ruch” honorowane w `fadeStage`, `celebrate` (pop i cząstki), opóźnieniu karty i nowym strażniku `TaskScene.shake`, a `prefersReducedMotion` ma `try/catch`; `flush('now')` nie odrzuca, więc porażka zapisu po zakupie nigdy nie daje karty „Ups!”; etap kupowany tylko przez `stepPanel` (jedno stuknięcie, wydaje raz); `tests/roomArt.test.ts` trzyma tabelę zgodną z plikami i nagłówkami WebP; `tests/roomsData.test.ts` zamraża kolejność zadań salonu (częściowo zamyka M-R4 dla salonu). Timery animacji na zegarze sceny to znane L-R11, teraz też dla zanikania etapu; nieosiągalne normalnym UI.

### Ładowanie grafiki w BootScene i linia „Obrazki”

| # | Lokalizacja | Kategoria | Waga | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| H-2 | `src/main.ts` `createGame` (brak `loader` w GameConfig; `node_modules/phaser/src/core/Config.js` `loaderTimeout` = 0) + `src/scenes/BootScene.ts` `preload` | coverage-gap | high | Pierwsze uruchomienie online (przed precache), jedno zawieszone żądanie z 26 nowych: `create()` nie rusza, `LoadingScreen` stoi w miejscu na zawsze. Dziecko: zamrożony pasek. Rodzic: brak zębatki i karty. Opiekun: nic (`loaderror` nie pada, granica nie ma wyjątku). Ryzyko istniało wcześniej (pusty canvas), slice poszerzył okno i uczynił je widocznym jako „prawie gotowe”. | `loader: { timeout: ~15000 }` — zawieszony plik staje się `loaderror` → brakująca tekstura → istniejące zastępstwo i licznik; ewentualnie strażnik startu z kartą błędu. |
| M-6 | `scripts/check-deploy.ts` + `scripts/deploy-check/parse.ts` `compareBundles`; `src/pwa/registerServiceWorker.ts` (`.catch(() => undefined)`) | config | medium | Smoke po wdrożeniu nie sprawdza, że `assets/rooms/salon/*.webp` są w manifeście `sw.js` i odpowiadają 200. Brakujący plik na serwerze → instalacja Workbox (wszystko albo nic) odrzucona: tablety po cichu zostają na starym buildzie (widać tylko po id w rogu), nowi goście dostają zastępstwa. Błąd rejestracji połknięty. | `check:deploy`: liczba wpisów pokoju w precache = `ROOM_ART.length` i GET jednego pliku salonu; `console.warn` przy błędzie instalacji SW. |
| L-3 | `src/scenes/BootScene.ts` `preload` (handler `loaderror`) | missing-context | low | Każdy plik pokoju jest logowany jako `Task art failed to load: <key>`, bez URL i statusu. | Etykieta po przynależności do `ROOM_ART`, do tego `file.url`. |
| L-5 | `src/data/pl.ts` `settings.roomArtMissing` + `src/ui/dom/artHealthView.ts` `createArtHealthView` | missing-context | low | Rada „Uruchom grę ponownie” nie pomoże przy pliku brakującym w precache ani uszkodzonym. Brak pełnego obrazu sceny (`salon/after`: pokój z kolorowych bloków) brzmi tak samo jak brak jednej miniatury. Klucze tylko w konsoli. Ta sama klasa co luka 67. | Osobne zdanie, gdy brakuje obrazu sceny; pierwsza brakująca etykieta za bramką. |
| L-6 | `src/ui/dom/artHealthView.ts` `createArtHealthView` (`section.dataset.state` = tylko obrazki zadań) | noise | low | Gdy brakuje tylko grafiki pokoju, sekcja ma `data-state="ok"`, a „missing” jest tylko w wewnętrznej linii; selektory i speki czytające sekcję się mylą. Komentarz pliku nadal mówi tylko o obrazkach zadań. | Stan sekcji = gorszy z dwóch, albo udokumentować. |
| L-8 | `tests/e2e/salon-art.spec.ts` (jedyny test linii pokoju), seam `?e2eArt=room` (tylko pominięcie) | coverage-gap | low | Ścieżka dekodowania grafiki pokoju i dwuliniowy widok nie mają testu w CI (e2e nie biegnie w CI). | Test jednostkowy `createArtHealthView` z dwiema liniami; opcjonalnie `?e2eArt=roomcorrupt`. |

Sprawdzone jako dobre: błąd dekodowania nie dodaje tekstury, więc `textures.exists` = false i klucz trafia do licznika; 404 jest prawdziwym 404 (Caddyfile bez fallbacku SPA); glob precache obejmuje `webp`, największy plik salonu 288 KB przy limicie 10 MiB, razem ~1,3 MB; `artHealth` i `roomArtHealth` ustawiane razem w `create()`, więc filtr `unknown` w `settingsPanel` nie ukryje samego braku grafiki pokoju; `REGISTRY_KEYS.roomArtHealth` poza `SAVE_KEYS`; marker `e2eArt` obejmuje `room`; wszystko ładowane przy starcie (brak leniwego pobierania po `clientsClaim`).

## 6. Zalecana kolejność poprawek

1. **H-2:** `loader.timeout` w `createGame` — jedna linia w konfiguracji, zamienia „wieczny pasek” na istniejącą ścieżkę zastępstw i licznika.
2. **M-3 + M-4:** `markDirty` po remapie i pełna treść `console.warn`, jedno zdanie w „Zapis gry”. Tanio, bez zmiany formatu.
3. **M-2 + M-1:** znacznik po znanych starych kluczach; kopia starego salonu przed pierwszym zapisem. Przed pierwszym dopisanym slotem salonu.
4. **H-1:** decyzja opiekuna o v3 (`MIGRATIONS[2]`); do tego czasu zakaz rollbacku poniżej S-16a w `deploy/README.md` (łączy się z otwartym M-S1).
5. **M-6:** grafika w `check:deploy`; ostrzeżenie przy błędzie instalacji SW.
6. **M-5 + L-1 + L-2:** e2e zakupu pod `writefail`; testy remapu na prawdziwych danych i zamrożony fixture starego salonu.
7. Drobne: L-3, L-4, L-5, L-5r, L-6, L-7, L-8.

## 7. Zmiany od ostatniego audytu

| Poprzednie id | Status | Dowód |
|---|---|---|
| M-R4 | changed (częściowo) | `tests/roomsData.test.ts` zamraża kolejność zadań salonu. Indeksowanie po pozycji zostaje, a M-2 dodaje nową drogę cichego przesunięcia (nieznany klucz). |
| M-R5r | changed | Mechanizm w `redraw` zostaje; doprecyzowany jako L-5r (otwarty panel na etapie blokuje przyciski). Nadal nieosiągalne normalnym UI. |
| L-R11 | still open | Ten sam mechanizm (timery na zegarze sceny + reset w `onSleep`), teraz też `fadeStage`. |
| M-S1 | still open, rozszerzone | H-1 to wariant rollbacku, którego `future` nie łapie. |
| N-7, N-8, M-S2, M-S3, C-2r | not re-checked | Poza obszarem; zmiany `save-v2-backup-health` i `save-reason-and-recovery` dotknęły tych miejsc po raporcie 17:51, wymagają osobnego `--verify`. |
| H-9, gap 67 | still open, rozszerzone | Brak map źródeł; klucze brakującej grafiki pokoju tylko w konsoli (L-3, L-5). |
| L-S1, L-S2, L-S3, L-R8, L-R9, N-1..N-6, H-3, H-4, H-7r, L-12 | not re-checked | Poza obszarem tego runu. |

## 8. Metoda i ograniczenia

- **Wykonawcy:** trzech audytorów tylko do odczytu, równolegle: remap starego salonu, przepływ remontu, ładowanie grafiki z przeglądem infrastruktury (liczniki repo). Model przechwytywania z kroku 1 wklejony do każdego briefu.
- **Sprawdzone ręcznie:** `remapLegacySalon` (znacznik „dowolny nieznany klucz”, reguła B) i `LEGACY_SALON` w `src/data/rooms.ts`; `createGame` `preBoot` ustawia rejestr przed nasłuchem `setdata`/`changedata` w `start` (M-3); brak `loader` w GameConfig i `loaderTimeout` = 0 w `node_modules/phaser/src/core/Config.js` (H-2); etykieta `Task art failed to load` w `BootScene.preload` (L-3); filtr `artHealth.kind !== 'unknown'` w `settingsPanel` (odrzucone twierdzenie jednego audytora, że linia pokoju znika przy `unknown` — oba klucze są ustawiane razem w `create()`, więc to nieosiągalne).
- **Uruchomione przez audytora:** `npx vitest run tests/salonRemap.test.ts` → 62 zielone. E2E, build i pełny zestaw nie były uruchamiane w tym kroku; dowody e2e z logu runu (po shipie: unit 2939, e2e 98).
- **Przegląd repo:** `catch` 24 → 25, `.catch(` 2 → 2, `console.*` 15 → 18, puste `catch` 0.
- **Nieudowodnione w czasie działania:** zachowanie Phasera przy zawieszonym żądaniu na prawdziwym WebKit (H-2 — wniosek z konfiguracji i źródła Phasera, bez sondy); faktyczny rollback do buildu sprzed S-16a na przeliczonym zapisie (H-1 — wniosek z kodu `334ff69`); instalacja SW przy brakującym pliku na serwerze (M-6); wygląd przeliczonego salonu na prawdziwym zapisie z urządzenia; czytelność linii „Obrazki” na tablecie.
- Nie ma harnessu sond. Ponowne sprawdzenie: `/10x-observability-audit --verify <ten raport>`.

## Autonomous decisions

- **Obszary:** z argumentów kroku, bez pytania; `area_source: arguments`.
- **Dowód w czasie działania:** pominięty (krok: statycznie, bez `--runtime`), `runtime_proof: not-run`. Zmieniłoby to: zgoda na `--runtime` (sonda zawieszonego żądania w izolowanym worktree).
- **Fan-out:** domyślny ze skilla (audytorzy równolegle), trzech zamiast czterech: audytor infrastruktury połączony z obszarem ładowania grafiki, bo slice nie zmienił granicy błędów ani logowania poza `BootScene` i `main.ts`.
- **Wagi:**
  - H-1 high, nie critical: wymaga decyzji opiekuna o rollbacku poniżej S-16a (rzadka, ręczna akcja). Wzrosłoby do critical, gdyby rollback stał się automatyczny.
  - H-2 high, nie critical: dziecko widzi, że coś stoi, a ryzyko istniało przed slice'em; zawieszenie wymaga pierwszego uruchomienia online. Wzrosłoby, gdyby pomiar na tablecie pokazał realne zawieszenia.
  - Jeden audytor dał zawieszeniu ładowania medium, drugi high — przyjęto high (pasek, który nigdy się nie kończy, bez żadnego sygnału dla dorosłych).
  - Jeden audytor dał bezkopiowemu remapowi „medium-high” — przyjęto medium (M-1), bo reguła B nie traci zakupionych mebli nowego salonu, a przeniesienie jest celowe i opisane.
  - Ustalenia otwarte z wcześniejszych raportów nie są liczone we frontmatterze; liczone są tylko ustalenia z tego raportu (H-1, H-2, M-1..M-6, L-1..L-8 z L-5r).
- **v3 jako poprawka H-1:** zalecenie oznaczone jako decyzja opiekuna, bo kontrakt runu (2026-10-15) trzyma format v2.
- **Język raportu:** polski (jak poprzednie raporty), identyfikatory po angielsku.
- **Telemetria:** żadnego dostawcy; wszystkie kierunki poprawek zostają na urządzeniu.
