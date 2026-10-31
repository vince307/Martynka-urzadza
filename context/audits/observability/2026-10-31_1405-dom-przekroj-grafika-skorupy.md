---
type: observability-audit
date: 2026-10-31 14:05
mode: audit
commit: dfaf345
branch: docs/observability-audit-2026-10-31-house-cross-section
dirty_tree: false
areas: [house-cross-section-dom-button-house-scene-cells-capture-canvas-webgl-restore-wake-visit, house-art-runtime-load-missing-corrupt-shell-stand-in-artfallbacks-house-precache-deploy-smoke]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-31_0355-zapis-v5-dom-kuchnia-ladowanie-pokoju.md
findings: { critical: 0, high: 0, medium: 0, low: 3 }
---

# Audyt obserwowalności: przekrój domu i ładowanie grafiki domu w trakcie gry (2026-10-31)

Ten raport zamyka run `2026-10-31-house-cross-section`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #121 | S-23 `house-cross-section` (przycisk „Dom”, scena domu, wizyta przez dane wybudzenia) | `dfaf345` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Przekrój domu:** przycisk „Dom” w `RoomScene` (`houseButton`), `HouseScene` (`render`, `tapCell`, `onRestore`), `HouseView.render` z miniaturami przechwyconymi przez `captureRoomMiniature` (`src/ui/widgets/roomCapture.ts`), Canvas, utrata i odzyskanie kontekstu WebGL (`Renderer.Events.RESTORE_WEBGL`), wizyta przez dane wybudzenia (`cellTap`, `houseWakeVisit` w `src/core/houseCells.ts`, `refresh` w `RoomScene`), powrót do pokoju w remoncie.
- **Grafika domu w trakcie gry:** `HouseScene.loadArt` (loader sceny, limit `balance.loader.timeoutMs` per plik, `loaderror` → `loadErrorLine('house', …)`), zastępcza skorupa `HouseView.standInShell`, rekord `artFallbacks.house` (`settle` → `recordFallback`), tabela `HOUSE_ART` (`src/data/houseArt.ts`), precache i smoke deployu (`precacheCovers('house pictures', …)` w `scripts/check-deploy.ts`).

Zakres: diff runu `112f158..dfaf345` w `src/`, `scripts/` (18 plików, +535/−71; `vite/`, `deploy/`, `.github/` bez zmian). Poprzedni raport (`2026-10-31_0355-…`) leży w otwartym PR #119, nie na `main`; cytuję go jako „PR #119”. Follow-upy runu cytuję jako „FU-H n” (`context/archive/2026-10-31-house-cross-section/follow-ups/review-fixes.md`) i nie powielam ich jako nowych ustaleń. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 3 LOW (nowe).** Scena domu tylko czyta rejestr (strzeżone przez `tests/houseSceneWiring.test.ts`), więc nie dodaje ścieżki, na której błąd mógłby zepsuć zapis; wyjątek w `render`/`tapCell` idzie do istniejącej granicy błędów (`installErrorBoundary`, karta z `Kod:`).
- **Brak pliku skorupy (404, sieć, limit) jest widoczny w konsoli** z kluczem, URL i statusem (`HouseScene.loadArt` `onFail`), a dziecko dostaje skorupę rysowaną w kodzie. **Uszkodzony plik (200, nie da się zdekodować) nie ma linii projektu** — Phaser nie emituje wtedy `loaderror`, zostaje tylko jego ogólne `console.error('Failed to process file: image "house/…"')` bez URL (L-1).
- **`artFallbacks.house` ma jednego czytelnika: hook e2e.** Rodzic w „Obrazki” nie widzi nic (świadoma decyzja, FU-H 5); w połączeniu z L-1 uszkodzona skorupa na produkcji jest widoczna tylko oku i w ogólnej linii Phasera.
- **Utrata kontekstu WebGL nie zostawia żadnego śladu w grze** (nikt nie słucha `LOSE_WEBGL`), a nieudane ponowne przechwycenie komórki (`captureRoomMiniature` → `false`) daje pustą komórkę, którą `HouseView.render` dalej raportuje jako `live`/`drawn` (L-2).
- **Odrzucona wizyta jest cicha** (`houseWakeVisit` → `null` bez logu, L-3): dziś nieosiągalne, bo obie sceny liczą komórki z tego samego rejestru.

## 2. Model przechwytywania (zmiany względem PR #119)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA (`src/main.ts`, `type: AUTO`), bez trackera i sieci w grze. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`installErrorBoundary`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, CI i smoke deployu.
- **Nowa scena:** `HouseScene` w liście scen przed `UIScene` (`src/main.ts` `createGame`). Nie pisze `currentRoom`, `rooms`, `stars`, `house` (guard źródłowy). Jej loader to loader sceny, nie loader HUD (`roomArtLoader`), więc sygnały ładowania są własne: `console.warn(loadErrorLine('house', key, src, status))` przy `loaderror`, `recordFallback(this, 'house', 'drawn')` w `settle`, gdy po `complete` brakuje któregoś z trzech plików. `HOUSE_ART` nie jest w tabelach „Obrazki” (`DrawnFallbackWhere` wyklucza `house`, `artHealthLines` je pomija).
- **Przechwycenie miniatur:** każda `render` usuwa tekstury `house-cell-*` i tworzy je od nowa (`HouseView.clear` + `captureRoomMiniature`), także na `RESTORE_WEBGL` (nasłuch w `HouseScene.create`, zdejmowany na `shutdown`). Na Canvas ta sama ścieżka; postarzenie mebli zapisuje `worn: 'ungraded'` przez `applyWornGrade` (bez zmian).
- **Wdrożenie:** pliki `public/assets/house/*.webp` wpadają w glob precache (`webp`); smoke z SHA sprawdza `precacheCovers('house pictures')`, a `precacheServed` robi HEAD każdego wpisu precache (więc także plików domu). Wymiary sprawdza `tests/houseArt.test.ts` na nagłówkach plików; w runtime brak `wrongSize` (jak FU-H 6 dla pokoi). `registerServiceWorker` dostał `console.warn` przy workerze `redundant`.
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | 112f158 | dfaf345 |
  |---|---|---|
  | linie z `catch` | 70 | 70 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 60 | 62 (`HouseScene.loadArt` `onFail`, worker `redundant`) |
  | `console.info` | 5 | 5 |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Plik skorupy 404 / brak sieci / limit | skorupa rysowana w kodzie, ramka konturem | nic („Obrazki” bez linii domu, FU-H 5) | `House file failed to load: house/… <url> (HTTP 404 \| timeout or network)` | widoczne w konsoli |
| Plik skorupy uszkodzony (200, błąd dekodowania) | skorupa rysowana | nic | tylko `Failed to process file: image "house/…"` Phasera, bez URL i bez tabeli | **słabe** (L-1) |
| Plik nie trafił do precache / nie serwowany | offline: skorupa rysowana | nic | smoke deployu: `precacheCovers` / `precacheServed` czerwone | widoczne w CI |
| Pierwsza próba nieudana, potem sieć wraca | skorupa rysowana do końca sesji (`artQueued` nie ponawia) | nic | jedna linia z pierwszej próby | znane, część L-1 |
| Utrata i odzyskanie kontekstu WebGL | komórki przechwycone od nowa | nic | nic (ani utrata, ani liczba przerysowań) | **ślepe** (L-2) |
| `captureRoomMiniature` zwraca `false` | pusta komórka (tylko tło) | nic | nic; hook e2e mówi `live`/`drawn` | **ślepe** (L-2) |
| Komórka pokoju, którego grafika brakuje | pudełka zastępcze w miniaturze | dla pokoju w remoncie „Obrazki” (rekord `roomArtHealth`); dla pokoju skończonego nic (FU-H 8, 17) | `Room file failed to load …` z `roomArtLoader` | znane |
| Wizyta odrzucona przez `houseWakeVisit` | pokój w remoncie zamiast dotkniętego | nic | nic | ciche, dziś nieosiągalne (L-3) |
| Wyjątek w `HouseScene.render` / `tapCell` | karta błędu | `Kod:` na karcie | stos w konsoli | widoczne |
| Brak `roomArtLoader` w rejestrze | komórki z pudełkami | nic | nic (`loader?.ensure`) | rozszerza L-3 z PR #119 |

## 4. Systemowe przyczyny źródłowe

1. **Sygnał ładowania oparty wyłącznie na `loaderror`.** Phaser emituje `FILE_LOAD_ERROR` tylko przy błędzie XHR (`LoaderPlugin.nextFile`); błąd dekodowania obrazu idzie przez `File.onProcessError` → `fileProcessComplete` bez zdarzenia. Boot obchodzi to, licząc braki przez `textures.exists` i `artCauses` (przyczyna `decode`); `HouseScene.loadArt` liczy braki tylko po to, by zapisać `artFallbacks.house`, a linię konsoli pisze wyłącznie z `loaderror`. Wyjaśnia L-1.
2. **Odtwarzanie po utracie kontekstu bez własnego licznika.** Tło notesu ma `BackdropSnapshot.redraws` i `renderer`; dom przechwytuje od nowa, ale nie zapisuje ani że to zrobił, ani czy się udało, a cała gra nie loguje `LOSE_WEBGL`. Rozsądne lokalnie (nic nie ginie na stałe), ale jedyny stan pośredni — komórka bez obrazu — nie ma sygnału. Wyjaśnia L-2.
3. **Strażniki, które cofają do bezpiecznego stanu bez słowa.** `houseWakeVisit` i `loader?.ensure` mają poprawne fallbacki, ale bez linii; ten sam wzorzec co L-3 w PR #119. Wyjaśnia L-3.

## 5. Ustalenia według obszarów

### Grafika domu w trakcie gry

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-1 | `src/scenes/HouseScene.ts` `loadArt` (`onFail` tylko na `loaderror`), `settle` | missing-context / logged-not-captured | LOW | Deploy z uciętym lub zepsutym `house-1-shell.webp` (serwowany 200, precache go ma, smoke HEAD przechodzi): dziecko widzi skorupę rysowaną w kodzie, rodzic w „Obrazki” nic, konsola tylko ogólne `Failed to process file: image "house/house-1-shell"` bez URL i bez słowa „House”. `artFallbacks.house = 'drawn'` czyta tylko hook e2e. Nieudany plik nie jest ponawiany w sesji. | W `complete` dla każdego klucza `HOUSE_ART`, który nadal nie istnieje, a nie przyszedł przez `loaderror`, pisać `console.warn` z `loadErrorLine`-podobną linią i przyczyną `decode` (jak `artCauses` w boocie); linia w „Obrazki” zostaje decyzją FU-H 5. |

### Przekrój domu

| # | Lokalizacja | Kategoria | Waga | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-2 | `src/ui/widgets/HouseView.ts` `render` (`modes[cell.id]` liczone niezależnie od `captured`), `src/ui/widgets/roomCapture.ts` `captureRoomMiniature`, `src/scenes/HouseScene.ts` `onRestore` | silent-fallback / missing-context | LOW | Tablet traci kontekst WebGL (tło, wiele kart): po odzyskaniu dom przechwytuje komórki od nowa; jeśli przechwycenie się nie uda, komórka jest pusta, a hook i każda diagnoza mówią `live`. W żadnej ścieżce nie ma śladu, że kontekst w ogóle zginął, więc zgłoszenie „puste okna w domu” nie ma punktu zaczepienia. | Tryb `blank` (lub `console.warn` z id komórki) gdy `captured === false`; jednorazowy `console.info` na `LOSE_WEBGL`/`RESTORE_WEBGL` w jednym miejscu (np. `BootScene`) i licznik przerysowań w `HouseSnapshot`, jak `BackdropSnapshot.redraws`. |
| L-3 | `src/core/houseCells.ts` `houseWakeVisit` (zwraca `null`), `src/scenes/RoomScene.ts` `refresh`; `src/scenes/HouseScene.ts` `render` (`loader?.ensure`) | swallowed | LOW | Gdyby dom i pokój kiedyś policzyły komórki inaczej (np. przyszły dom z inną geometrią lub zmiana `roomDone`), dotknięcie skończonego pokoju otworzy pokój w remoncie bez żadnej linii; podobnie brak `roomArtLoader` zostawia komórki na pudełkach bez słowa. Dziś nieosiągalne (ten sam rejestr, `UIScene` startuje z bootem). | `console.warn` w `refresh`, gdy `data` ma `visit`, a `houseWakeVisit` je odrzuca (z id i powodem); dla loadera patrz L-3 z PR #119. |

### Platforma / hydraulika

Bez nowych ustaleń. Sprawdzone: `HOUSE_ART` w smoke deployu (`precacheCovers`) i w HEAD każdego wpisu precache (`precacheServed`); `npm run art` kończy się kodem 1 bez paczki `designs/martynka-house-street-v1`; `registerServiceWorker` loguje worker `redundant` (zamyka M-6 z salon-load-health, FU-H „Closed as stale”); pliki domu nie są w kolejce bootu (`bootBudget` bez zmian, guard w `houseSceneWiring.test.ts`).

## 6. Zalecana kolejność poprawek

1. **L-1** — kilka linii w `HouseScene.loadArt` (`complete`): linia z przyczyną `decode` dla brakujących kluczy bez `loaderror`. Zamyka jedyną ścieżkę, na której uszkodzony deploy grafiki domu jest prawie niewidoczny. Bez zmian w zapisie i w „Obrazki”.
2. **L-2** — tryb `blank` w `HouseView.render` przy `captured === false` + jedno miejsce logujące utratę/odzyskanie kontekstu. Przy okazji służy też tłu notesu.
3. **L-3** — linia w `RoomScene.refresh` przy odrzuconej wizycie; razem z L-3 z PR #119 (`roomArtLoader.ensure` bez loadera), bo to ten sam wzorzec.

Ograniczenie: nic z tego nie może wysyłać danych poza urządzenie (PRD); wszystkie poprawki to konsola i rekordy runtime.

## 7. Zmiany od ostatniego audytu (PR #119)

| Poprzedni id | Status | Dowód |
|---|---|---|
| L-1 (`roomArtLoader.refreshHealth`, „Obrazki” z rekordem poprzedniego pokoju) | still open | `src/ui/roomArtLoader.ts` bez zmian w runie (FU-H 6, 7); dom dodaje drugie miejsce, w którym pokój „wczytuje się” jest rysowany tak samo jak brak (`HouseView.render` tryb `drawn` przy `pending`). |
| L-2 (nieznany dom / pokoje spoza danych tylko w konsoli) | still open | `src/main.ts` zmienił tylko listę scen; `HouseScene.geometry` dodatkowo cicho wraca do `HOUSE_GEOMETRY[FIRST_HOUSE.id]`. |
| L-3 (`roomArtLoader.ensure` bez loadera cicho) | still open, rozszerzone | `HouseScene.render` woła `loader?.ensure(open)` z tym samym brakiem linii. |

## 8. Metoda i ograniczenia

- Audyt wykonany w jednej sesji, bez subagentów (diff 18 plików; model przechwytywania przeniesiony z PR #119). Ręcznie sprawdzone w źródłach Phasera 4.2.1: `LoaderPlugin.nextFile` emituje `FILE_LOAD_ERROR` tylko przy `success === false` (XHR), `File.onProcessError` pisze `console.error('Failed to process file: %s "%s"')` i woła `fileProcessComplete` bez zdarzenia — podstawa L-1. Sprawdzone też: jedynym czytelnikiem `artFallbacks.house` jest hook e2e (`artHealthLines` wyklucza `house`), w `src/` nikt nie słucha `LOSE_WEBGL`.
- Pokrycie testami w obszarach: `tests/houseSceneWiring.test.ts` (guard tylko-odczyt, brak domu w boocie), `tests/backdropRestoreWiring.test.ts` (piksel tekstury komórki), `tests/e2e/house-cross-section.spec.ts` (piksel komórki 255 alfa, `?e2eArt=house` → `artFallbacks.house = 'drawn'`). Seam `house` pomija pobieranie, więc ani 404, ani dekodowanie nie są ćwiczone w przeglądarce.
- **Nieudowodnione (tylko statycznie):** zachowanie po rzeczywistej utracie kontekstu WebGL na tablecie (nie da się jej wywołać w tym runie; spec nie używa `WEBGL_lose_context`), dekodowanie uszkodzonego WebP w Safari/iPadOS, wiszący plik domu do limitu `timeoutMs` × `maxRetries`, oraz wygląd linii konsoli na urządzeniu.
- Dowód w czasie działania: nie uruchomiony (`runtime_proof: not-run`), zgodnie z decyzją kroku.

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (`area_source: arguments`), bez pytania (kontrakt runu, reguła 1).
- **Dowód w czasie działania:** pominięty — krok zadecydował „static”, bez `--runtime`.
- **Subagenci:** nie uruchomieni; diff runu jest mały (18 plików), a model przechwytywania jest aktualny z PR #119. Zmieniłoby to: diff obejmujący zapis lub granicę błędów.
- **Poprzedni raport:** PR #119 (gałąź `docs/observability-audit-2026-10-30-rooms-kitchen`, niescalona) uznany za poprzednika, bo ma nowszy commit niż ostatni raport na `main` (2026-10-25). Zmieniłoby to: zamknięcie #119 bez scalenia.
- **Waga L-1 jako LOW:** dziecko nie jest zablokowane (skorupa rysowana), a w konsoli jest linia Phasera; MEDIUM byłoby przy braku jakiejkolwiek linii.
