---
type: observability-audit
date: 2026-10-23 07:42
mode: audit
commit: 1962312
branch: docs/observability-audit-2026-10-22-notebook-polish
dirty_tree: false
areas: [task-screen-salon-backdrop-notebook, answer-motion-star-landing-beads-entrance-summary, task-font-martynka-next-boot-health-precache-smoke]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-21_1719-naglowek-zadania-obrazki-kod-umiejetnosci.md
findings: { critical: 0, high: 0, medium: 1, low: 3 }
---

# Audyt obserwowalności: tło z salonem, animacje odpowiedzi, czcionka Martynka Next (2026-10-23)

Ten raport zamyka run `2026-10-22-notebook-polish`. Run wydał jeden slice:

| PR | Slice | Merge |
|---|---|---|
| #99 | fix `notebook-polish` (zeszyt z paczki maths-A, rozmyty salon dziecka za zeszytem, podskok/kołysanie, lot gwiazdki z `starLanded`, koraliki, wjazd kafelków, podsumowanie z gwiazdkami i wybuchem, czcionka Martynka Next z zerem bez kreski) | `243ce53` (main `1962312`) |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Ekran zadania:** tło z rozmytym salonem dziecka (`SalonBackdrop`, `DynamicTexture`, blur tylko na WebGL, ponowne uchwycenie po zakupie) i zeszyt (`drawNotebook`, `notebookGeometry`).
- **Odpowiedź i animacje:** `TaskScene.bounce`/`wobble`, lot gwiazdki i `GAME_EVENTS.starLanded` → `StarCounter.pop`, `ProgressDots` (`newlyDone`), wjazd kafelków (`ChunkyFace.enter`, `staggerDelays`), `SummaryPanel` (`summaryPopDelays`, `starBurst`), wszystko za `prefersReducedMotion()`.
- **Czcionka Martynka Next:** `scripts/make-font.py`, `FONT_KEY`/`FONT_URL` w `src/data/layout.ts`, ładowanie w `BootScene`, `fontHealth`, precache i `check-deploy` (`precacheCovers('task font')`).

Zakres: diff runu `6e426ed..1962312` w `src/`, `scripts/`, `public/fonts/` (bez zmian w `vite/`, `deploy/`, `.github/`). Follow-upy runu cytuję jako „FU-NP n” (`context/archive/2026-10-22-notebook-polish/follow-ups/review-fixes.md`) i nie powielam. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 1 MEDIUM, 3 LOW.** Run nie dodał żadnego `catch`, `console.*` ani parametru `?e2e…`; liczniki przeglądu repozytorium są identyczne jak na `81115ee`. Wszystkie nowe ścieżki to rysowanie i animacja, więc żadna awaria w nich nie zatrzymuje gry, a rzut w `create`/`wake` nadal trafia do granicy błędów (`installErrorBoundary`).
- **MEDIUM (B-1):** po utracie kontekstu WebGL (iPad przy przejściu w tło, presja pamięci) `DynamicTexture` tła traci zawartość. Phaser 4.2.1 mówi to wprost (`DynamicTexture.js`: „You are responsible for the redrawing logic”), a gra nie ma żadnego słuchacza `restorewebgl`. Dziecko widzi gładkie tło zamiast salonu do następnego zakupu lub przeładowania, hook dalej mówi `backdrop.mode: 'salon'`, a rodzic i konsola nie dostają nic.
- **Przyczyna wspólna:** `SalonBackdrop.mode` i `captures` opisują **zamiar** (czy obraz sceny istnieje i czy wywołano `render`), a nie to, co zostało narysowane. Na tym opiera się e2e (#12, #11 w `tests/e2e/notebook-polish.spec.ts`), więc ani utrata kontekstu, ani pusty rysunek po zmianie semantyki `dt.draw`/`dt.render` w Phaserze, ani brak blura na rendererze Canvas nie dają sygnału (B-1, B-2).
- **Animacje:** degradacja jest łagodna i poprawna (licznik ustawia liczbę od razu, `pop` tylko czeka na lądowanie), ale żaden rekord runtime nie mówi, które animacje się odpaliły; dowód opiera się na testach tekstu źródła (`motionWiring`, `reducedMotionWiring`) i jednym e2e z ograniczonym ruchem (A-1).
- **Czcionka:** ścieżka sygnału jest kompletna: `fontHealth` czyta `document.fonts` po rodzinie `MartynkaNext` (= `FONT_KEY`, ta sama nazwa trafia do `FontFace` przez `load.font`), linia `font` w „Obrazkach”, `console.warn`, pole hooka, `precacheCovers('task font')` w smoke'u z SHA. Jedyne LOW to nieaktualny dokument (C-1). Akceptacja pliku przez Safari na iPadzie zostaje niedowiedziona (FU-NP 11).

## 2. Model przechwytywania (zmiany względem raportu 2026-10-21 17:19)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA, bez trackera i sieci w czasie gry. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`errorCode` w `src/core/save.ts`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, hook e2e (tylko build `E2E_HOOK=1`), log CI smoke'u deployu.
- **Tło salonu:** `SalonBackdrop.render` (`src/ui/widgets/SalonBackdrop.ts`) wybiera tryb przez czyste `backdropMode` (`src/core/backdrop.ts`: `plain`, gdy brak tekstury sceny przed/po etapie), rysuje miniaturę `drawRoomMiniature` do kontenera spoza listy wyświetlania, na WebGL dokłada `enableFilters().filters?.internal.addBlur`, rysuje raz do `DynamicTexture` (`addDynamicTexture`, `dt.draw`, `dt.render`) i pokazuje jeden obraz plus „wash”. Ponowne uchwycenie: `TaskScene` `onWake`, gdy obiekt `REGISTRY_KEYS.rooms` jest inny niż przy poprzednim uchwyceniu (`RoomScene` zawsze podmienia obiekt przy zakupie i zmianie wariantu). Brak obrazka sceny ma już sygnał w „Obrazkach” (`roomArtHealth`), a brak obrazka mebla jest pomijany w tle (bez zastępczego pudełka). Rekord: `backdrop: { mode, captures }` tylko w hooku e2e (ekran zadania i powitania).
- **Zeszyt:** `drawNotebook` rysuje kształty z `notebookGeometry` (`src/core/notebookGeometry.ts`); brak ścieżek błędu, brak tekstur.
- **Animacje:** każde wywołanie tweena czyta `prefersReducedMotion()` (`src/ui/motion.ts`, `catch` → `false`, z komentarzem). `flyStar` emituje `GAME_EVENTS.starLanded` w `onComplete`; `UIScene` słucha i woła `StarCounter.pop`; liczba w liczniku jest ustawiana od razu przez `changedata-stars`. `SummaryPanel.clearStars` i `ProgressDots.clearBeads` zabijają tweeny przed zniszczeniem obiektów; `TaskScene.stopWobble` sprawdza `target.scene` i `isPlaying()`. Rekord: brak (hook podaje tylko `counterText`, `summary`, `index`).
- **Czcionka:** `BootScene` ładuje `load.font(FONT_KEY, FONT_URL, 'truetype', { weight })` w grupie `font` kolejki `bootQueue`; limit całego startu (`balance.loader.totalMs`) obejmuje ją, osobnego limitu na plik brak (FU-NP 5). W `create` `fontHealth(document.fonts, FONT_KEY)` → `REGISTRY_KEYS.fontHealth` → linia `font` w „Obrazkach” (`artHealthView`) + `console.warn('Task font not loaded: MartynkaNext …')`. Precache: glob `ttf` w `vite/config.shared.mjs`; smoke: HEAD każdego wpisu `sw.js` plus `precacheCovers('task font', precache, [FONT_URL])` tylko z SHA. Plik ma test bajtów `tests/fontZero.test.ts` (zero bez kreski, nowa nazwa rodziny) względem oryginału w śledzonym `designs/martynka-maths-A-v1/fonts/`.
- **Przegląd repozytorium** (`src/` bez `src/testing`, ten sam wzorzec co poprzednio):

  | | 81115ee | 1962312 |
  |---|---|---|
  | linie z `catch` | 68 | 68 |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 53 | 53 |

  Dodane linie diffu w `src/` nie zawierają `catch` ani `console.`; jedyna zmiana w `src/testing` to pole `backdrop` w migawce powitania.

## 3. Co dociera do obserwatora (statycznie; e2e runu cytowane, nie powtarzane)

| Kształt awarii | Dziecko | Rodzic | Konsola / hook / CI | Werdykt |
|---|---|---|---|---|
| Brak obrazka sceny salonu (`?e2eArt=room`) | gładkie tło, runda gra | „Obrazki”: brak obrazków pokoju | hook `backdrop.mode: 'plain'`; e2e #11 | **widoczne** |
| Utrata i przywrócenie kontekstu WebGL na iPadzie | salon znika zza zeszytu do zakupu/przeładowania | nic | nic; hook dalej `mode: 'salon'` | **niewidoczne** (B-1) |
| Phaser zmienia semantykę `dt.draw`/`dt.render` lub `filters` (aktualizacja) | puste/ostre tło | nic | e2e #12/#11 zielone (sprawdzają `mode`/`captures`) | **niewidoczne** (B-2) |
| Gra startuje na rendererze Canvas (`type: AUTO`, WebGL niedostępny) | salon bez blura (tylko przeskalowany) | nic | nic (typ renderera nigdzie nie zapisany) | bez śladu (B-2) |
| Klucz `salon-backdrop-N` zajęty | brak tła | nic | `console.error('Texture key already in use')` z Phasera; hook `mode: 'salon'` | tylko konsola (B-2) |
| Wyjątek w `SalonBackdrop.render` (create/wake) | karta „Ups!” | `Kod:` z nazwą błędu | stack w konsoli | **diagnozowalne** |
| Animacja nie odpala (refaktor) | brak ruchu, gra działa | nic | testy tekstu źródła zielone, jeśli wywołanie zostało | bez śladu (A-1) |
| Ograniczony ruch | bez ruchu, te same gwiazdki | nic | e2e #11 (gwiazdki, licznik, `fontHealth`) | **dowiedzione w Chromium** |
| Czcionka nie dociera lub Safari odrzuca plik | tekst w czcionce systemowej (zero może mieć kreskę lub kropkę) | „Obrazki”: `fontFallback` | `Task font not loaded: MartynkaNext`; hook `fontHealth: 'fallback'` | **widoczne** |
| Plik czcionki poza precache w nowym wydaniu | — | — | smoke: `precache covers task font` FAIL z pierwszym brakującym | **widoczne w CI** (z SHA) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord tła to zamiar, nie wynik.** `SalonBackdrop` liczy `mode` z istnienia tekstury sceny i zwiększa `captures` przed rysowaniem; nie zapisuje, czy `addDynamicTexture` zwróciło teksturę, czy filtr powstał, ani czy kontekst GPU przetrwał. Wyjaśnia B-1, B-2. To ta sama rodzina co „rekord ma szczegół, linia go zwija” z poprzednich raportów, tylko odwrócona: tu linia jest, ale mówi więcej, niż wie.
2. **Brak reakcji na cykl życia GPU.** W `src/` nie ma słuchacza `webglcontextlost`/`restorewebgl`; dotąd nie było treści generowanej do `DynamicTexture`, więc nie miało to znaczenia. Tło salonu jest pierwszym takim obiektem (`generateTexture` gwiazdki wybuchu to tekstura canvas i przeżywa). Wyjaśnia B-1.
3. **Animacje dowiedzione kształtem kodu, nie zachowaniem.** Testy `motionWiring.test.ts` i `reducedMotionWiring.test.ts` czytają źródła; e2e sprawdza tylko, że ruch nie blokuje palca i nie opóźnia liczby. Wyjaśnia A-1.

## 5. Ustalenia według obszaru

### 5.1 Ekran zadania: tło z salonem i zeszyt

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| B-1 | `src/ui/widgets/SalonBackdrop.ts` `SalonBackdrop.render` (`addDynamicTexture`, `dt.draw`, `dt.render`); brak słuchacza w `src/scenes/TaskScene.ts` `create` i `WelcomeScene.create`; Phaser 4.2.1 `textures/DynamicTexture.js` (komentarz klasy o utracie zawartości) | coverage-gap | medium | Na iPadzie Safari utrata kontekstu WebGL przy powrocie z tła lub pod presją pamięci jest realna. Według dokumentacji klasy `DynamicTexture` zostaje po niej pusta (tekstur wczytanych z plików audyt nie sprawdzał): za zeszytem zostaje sam „wash” w kolorze strony, aż dziecko kupi coś w pokoju (nowy obiekt `rooms` → `onWake`) albo gra się przeładuje. Hook nadal raportuje `mode: 'salon'`, „Obrazki” nic nie mówią, konsola milczy. Rodzic zgłosi najwyżej „tło czasem znika”, bez żadnego punktu zaczepienia. | Słuchać `this.game.renderer.on('restorewebgl', …)` (lub zdarzenia kontekstu) w scenach z tłem i wołać `refreshBackdrop`; zapisać runtime licznik `contextLost`/`backdropRedraws` w hooku i jedną linię w konsoli; w e2e wymusić `WEBGL_lose_context` i sprawdzić ponowne uchwycenie. |
| B-2 | `src/ui/widgets/SalonBackdrop.ts` `render` (`this.captureCount += 1` przed `if (dt)`, `filters?.internal.addBlur`, gałąź `renderer.type === WEBGL`), `TaskScene.snapshot` `backdrop`, `WelcomeScene.backdropState`; `tests/e2e/notebook-polish.spec.ts` #12, #11 | missing-context | low | `mode`/`captures` opisują wywołanie, nie wynik: pusta tekstura (zajęty klucz, zmiana semantyki kolejki `draw`/`render` przy aktualizacji Phasera, brak `filters`) i renderer Canvas bez blura dają ten sam rekord co sukces. E2e runu pozostałyby zielone przy pustym tle. Zajęty klucz ma tylko `console.error` Phasera. Typ renderera nie jest nigdzie zapisany, więc zgłoszenie „ostre tło” nie da się odróżnić od zmiany w paczce. | Do rekordu dodać `drawn: boolean` (tekstura powstała), `blurred: boolean` (filtr dodany) i `renderer: 'webgl' \| 'canvas'`; w e2e jeden odczyt piksela tekstury tła (`renderer.snapshotPixel` lub `dt.snapshotPixel`) różny od koloru wash; dopisać `dt.draw`/`render` i `enableFilters` do tripwire'a `tests/phaserLoaderPin.test.ts` obok loadera (FU-NP 16 notuje już niesprawdzone zwalnianie kamery filtra). |

Zeszyt (`drawNotebook`, `notebookGeometry`): brak ustaleń; czysta geometria bez tekstur i bez ścieżek błędu. Uwaga bez rangi: przy braku zapisanego `rooms` (`undefined`) `onWake` porównuje `undefined !== null` i chwyta tło przy każdym przebudzeniu; `main.ts` zawsze ustawia `rooms` (`start.rooms`), więc dziś nieosiągalne.

### 5.2 Odpowiedź i animacje

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| A-1 | `src/scenes/TaskScene.ts` `bounce`, `wobble`, `answerFace`; `src/ui/widgets/StarCounter.ts` `pop`; `src/ui/widgets/ProgressDots.ts` `update`; `src/ui/widgets/chunky.ts` `ChunkyFace.enter`; `src/ui/widgets/SummaryPanel.ts` `pop`; `tests/motionWiring.test.ts`, `tests/reducedMotionWiring.test.ts` | missing-context | low | Każda animacja kończy się po cichu, gdy cel jest `null` (`answerFace` dla `digits` i kości, `tiles.faceOf` bez dopasowania) albo ruch jest ograniczony, i nic tego nie zapisuje. Gra działa poprawnie, ale zgłoszenie rodzica „nic nie podskoczyło / licznik nie mrugnął” nie ma punktu zaczepienia, a regresja, która zostawi wywołanie w kodzie (więc przejdzie testy tekstu), ale zgubi cel lub zdarzenie, jest niewidoczna. Lądowanie gwiazdki po `endFlyingStars` nie emituje `starLanded` (zamierzone: liczba jest już ustawiona). | Licznik runtime w hooku e2e (`motion: { bounces, wobbles, pops, beadPops, entrances }`, bez zapisu i bez UI), jedna asercja e2e z ruchem włączonym, że `pops` rośnie po lądowaniu; FU-NP 1 (digits i kości bez ruchu) zostaje. |

Bez dalszych ustaleń: `SummaryPanel.clearStars` i `ProgressDots.clearBeads` zabijają tweeny przed `destroy`, `stopWobble` przywraca obiekt tylko dla trwającego łańcucha, a `prefersReducedMotion` z `catch` → `false` ma uzasadniający komentarz (brak ruchu nie jest awarią). Czasomierz wybuchu w uśpionej scenie (dziecko idzie do pokoju w pierwszej sekundzie podsumowania) odpala po powrocie; to kosmetyka, nie sygnał.

### 5.3 Czcionka Martynka Next

| # | Lokalizacja | Kategoria | Ważność | Co się dzieje na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| C-1 | `docs/art-inventory.md` (wiersz o `AtkinsonHyperlegibleNext.ttf` „w `public/fonts/`”) | config (dokumentacja) | low | Dokument mówi, że w `public/fonts/` leży oryginalny plik; od runu jest tam `MartynkaNext.ttf`. Osoba sprawdzająca linię `fontFallback` albo błąd smoke'u `task font` według inwentarza szuka złego pliku. | Jedna linia w `docs/art-inventory.md`: `public/fonts/MartynkaNext.ttf` = oryginał z zerem bez kreski (`npm run font`, `tests/fontZero.test.ts`). |

Bez dalszych ustaleń: nazwa rodziny w `FontFace` to `FONT_KEY` (`MartynkaNext`), a `fontHealth` porównuje z tym samym kluczem, więc wewnętrzna nazwa „Martynka Next” w tabeli `name` nie wpływa na sygnał. Stary URL zniknął z precache razem z plikiem, nowy ma osobną nazwę, więc stara kopia z cache service workera nie podszyje się pod nowy plik. Limit całego startu obejmuje czcionkę; brak limitu na plik to FU-NP 5.

### 5.4 Platforma i infrastruktura

Run nie zmienił `vite/`, `deploy/` ani `.github/`; jedyna zmiana w narzędziach to `precacheCovers('task font')` w `scripts/check-deploy.ts` i nowy skrypt lokalny `scripts/make-font.py` (przypięty fontTools 4.61.1, poza CI). I-2, I-4, I-7, I-8, I-9, I-11, H-7, H-8 bez zmian w kodzie (not re-checked).

## 6. Rekomendowana kolejność poprawek

1. **B-1 + B-2 razem:** słuchacz przywrócenia kontekstu w scenach z tłem, rekord `drawn`/`blurred`/`renderer`/`redraws` w hooku, jedna linia konsoli przy przerysowaniu po utracie kontekstu, asercja piksela w e2e. Mała zmiana w `SalonBackdrop` i dwóch scenach; usuwa jedyną niewidoczną awarię runu.
2. **Reszta otwartych MEDIUM z wcześniejszych raportów** (Z-1, Z-3..Z-6, H-3, H-4, C-4, C-5, I-4, I-9), bez zmian w tym runie.
3. **A-1:** licznik ruchu w hooku razem z FU-NP 1, gdy ktoś dotknie `answerFace`.
4. **C-1** przy najbliższej zmianie dokumentacji paczek; N-7, N-8 i pozostałe LOW z poprzednich raportów.

Ograniczenia: nic nie opuszcza urządzenia; tekst tylko w `src/data/pl.ts`; `src/core` bez przeglądarki i Phasera; zapis zostaje v4 (żaden rekord z tej listy nie trafia do zapisu).

## 7. Zmiany od ostatniego audytu (2026-10-21 17:19)

| Poprzedni id | Status | Dowód |
|---|---|---|
| N-7 (Zakrywanka: lektor mówi „Oblicz.”, ekran bez nagłówka) | still open | `TaskScene.currentNarration` nadal `headings: this.kind === 'word' ? null : pl.round.heading`; `drawPrompt` nadal wraca wcześnie dla `dice`. |
| N-8 (`repairCap` bez śladu) | still open | `src/core/round/variety.ts` `repairCap` (`if (!walk(0)) return [...drawn]`) bez zmian. |
| N-2, N-5, N-6 | not re-checked | `backToAge`, `showHintOnce`, `installErrorBoundary` poza diffem runu. |
| H-3..H-11 | not re-checked | `artHealth.ts`, `BootScene` (poza nazwą pliku czcionki przez stałe), `sound.ts`, `errorSignal.ts` bez zmian w logice. |
| Z-1..Z-12, C-4..C-10, I-2..I-11 | not re-checked | `autosave.ts`, `saveHealth.ts`, `saveFile.ts`, `src/storage/`, `curriculum.ts`, `vite/`, `deploy/` bez zmian w diffie runu. |
| FU-NP 5, 11, 14, 16 (follow-upy runu) | cytowane, nie powielane | FU-NP 16 notuje niesprawdzone zwalnianie kamery filtra; B-2 rozszerza go o brak rekordu wyniku. FU-NP 14 (koszt ponownego uchwycenia) jest o czymś innym niż B-1. |

## 8. Metoda i ograniczenia

- **Sposób:** jeden czytelnik diffu runu (ten agent), bez subagentów, jak w dwóch poprzednich raportach: około 1100 dodanych linii w `src/` i `scripts/`, z czego większość to rysowanie. Najpierw diff `src/core`, scen, `SalonBackdrop`, `starBurst`, `StarCounter`, `ProgressDots`, `SummaryPanel`, `notebook`, `scripts/`, potem wywołania: `drawRoomMiniature`, `RoomScene` (podmiana `rooms`), `ChunkyFace.enter`, `BootScene` (czcionka, `fontHealth`), `artHealth.ts`, `parse.ts` (`precacheCovers`), `vite/config.shared.mjs` (glob), spec `notebook-polish.spec.ts`, testy ruchu i follow-upy runu.
- **Sprawdzone ręcznie w źródle Phasera 4.2.1 (`node_modules/phaser/src`):**
  - `TextureManager.addDynamicTexture` zwraca `null` przy zajętym kluczu i woła `checkKey`, który loguje `console.error('Texture key already in use')` (więc gałąź `if (dt)` nie jest całkiem cicha);
  - komentarz klasy `DynamicTexture`: po utracie kontekstu WebGL zawartość ginie, przerysowanie po `restorewebgl` należy do gry; `git grep` w `src/` nie znajduje `restorewebgl`, `contextlost` ani `contextrestored`;
  - `RoomScene` zawsze zapisuje nowy obiekt `rooms` (`{ ...rooms, [room.id]: step.state }`), więc porównanie tożsamości w `onWake` działa;
  - `fontHealth` porównuje z `FONT_KEY`, tym samym, który `load.font` daje `FontFace`;
  - `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf` jest śledzony w git, więc `tests/fontZero.test.ts` działa w CI;
  - przegląd repozytorium: liczniki identyczne jak na `81115ee`; brak nowych parametrów `?e2e…`.
- **Czego run nie dowiódł:**
  - Statycznie, bez `--runtime`: nie uruchamiano sond, przeglądarki ani e2e; zielone bramki runu (CI, e2e 144 + nowe, visual gate) cytowane z `run-log.md`, nie powtarzane. Produkcja niesprawdzana.
  - B-1: czy Safari na iPadzie faktycznie traci kontekst w typowej sesji dziecka i jak wygląda pusta `DynamicTexture` po przywróceniu (przezroczysta czy czarna) — wniosek z dokumentacji Phasera, bez urządzenia.
  - B-2: czy obecny Phaser 4.2.1 na Canvas rysuje miniaturę poprawnie (kod zakłada, że tak) i czy `holder.destroy(true)` zwalnia kamerę filtra (FU-NP 16).
  - Czcionka: akceptacja zmodyfikowanego pliku przez Safari (FU-NP 11, wiersz [human] 11.8); `fontHealth: 'loaded'` dowiedzione tylko w Chromium e2e.
  - A-1: czy animacje faktycznie odpalają na tablecie — tylko testy tekstu źródła i visual gate runu.

## Autonomous decisions

- **Obszary:** wzięte dosłownie z argumentów kroku (bez AskUserQuestion); odrzucona rotacja na nieaudytowane przepływy, bo krok zamyka run i ma audytować to, co run wydał. Zmieniłoby to: polecenie opiekuna, by audytować inne przepływy.
- **Dowód w czasie działania:** nie uruchamiany (krok mówi „static”); Chromium i tak nie startuje w sandboksie agenta. Zmieniłoby to: `--runtime` w poleceniu kroku.
- **Subagenci:** nie uruchamiani (domyślnie skill rozdziela audyt na obszary); wybrany jeden czytelnik całego diffu, jak w dwóch poprzednich raportach, bo diff jest w większości rysowaniem i mieści się w jednym przejściu, a model przechwytywania jest stabilny od kilku runów. Zmieniłoby to: diff dotykający zapisu, `vite/`, `deploy/` albo granicy błędów.
- **Ważność B-1:** MEDIUM, nie HIGH: awaria jest niewidoczna, ale kosmetyczna (gra, gwiazdki i zapis działają, tło wraca po zakupie lub przeładowaniu). Zmieniłoby to: zgłoszenie z playtestu, że po powrocie do gry za zeszytem jest czarny prostokąt (wtedy HIGH: widoczna dla dziecka usterka bez sygnału).
