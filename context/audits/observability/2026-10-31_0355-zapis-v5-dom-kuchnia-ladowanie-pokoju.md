---
type: observability-audit
date: 2026-10-31 03:55
mode: audit
commit: 6c4f414
branch: docs/observability-audit-2026-10-30-rooms-kitchen
dirty_tree: false
areas: [save-v5-house-migration-backup-v4-house-merge-renovation-rule, kitchen-dalej-move-runtime-room-art-loader-roomload-obrazki-visit-button]
area_source: arguments
runtime_proof: not-run
error_tracker: none (by design — PRD forbids telemetry/network during play)
previous_report: context/audits/observability/2026-10-25_2020-straznik-planszy-renderer-canvas.md
findings: { critical: 0, high: 0, medium: 0, low: 3 }
---

# Audyt obserwowalności: zapis v5 z domem, kuchnia i ładowanie grafiki pokoju w trakcie gry (2026-10-31)

Ten raport zamyka run `2026-10-30-rooms-kitchen`. Run wydał dwa slice'y:

| PR | Slice | Merge |
|---|---|---|
| #117 | F-04 `rooms-as-data` (zapis v4 → v5, dom jako dane) | `942e237` |
| #118 | S-22 `kitchen-room` (kuchnia, ładowanie pokoju w trakcie gry, przycisk odwiedzin) | `6c4f414` |

Audyt jest statyczny, bez `--runtime`. Obszary pochodzą z argumentów kroku:

- **Zapis v5 z domem:** `MIGRATIONS[4]` (`LIFT_V4_HOUSE`, `src/core/migrations/house.ts`), kopia `backup-v4`, łączenie domu z danymi w `start` (`src/main.ts`: `mergeHouse`, `houseLayout`, `nextRoom`, `houseEqual`), reguła pokoju w remoncie (`roomInRenovation`, `src/core/house.ts`).
- **Kuchnia:** „Dalej” na karcie „Pokój gotowy!” (`RoomScene.moveAfterDone`), ładowanie grafiki w trakcie gry (`createRoomArtLoader` w `src/ui/roomArtLoader.ts`, `REGISTRY_KEYS.roomLoad`, `roomsToLoad` w `src/core/roomLoad.ts`, rekord `REGISTRY_KEYS.roomArtHealth` i linia „Obrazki”), przycisk odwiedzin (`RoomScene.visit`, `visitTarget` w `src/core/roomVisit.ts`).

Zakres: diff runu `9d28753..6c4f414` w `src/`, `scripts/`, `vite/`, `deploy/` (28 plików, +717/−129; `.github/` bez zmian). Follow-upy runu cytuję jako „FU-R n” (`context/archive/2026-10-30-rooms-as-data/follow-ups/review-fixes.md`) i „FU-K n” (`context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md`) i nie powielam ich jako nowych ustaleń. Lokalizacje: plik i SYMBOL.

## 1. TL;DR

- **0 CRITICAL, 0 HIGH, 0 MEDIUM, 3 LOW (nowe).** Oba obszary dziedziczą istniejące kanały (karta DOM z `Kod:`, „Zapis gry”, „Obrazki”, konsola) i nie dodają cichej ścieżki błędu w zapisie.
- **Migracja v4 → v5 nie ma nowego mechanizmu awarii:** `LIFT_V4_HOUSE` nie rzuca, zły dom w zapisie v5 kończy się `saveProblem` → `'house'` → karta z `Kod: corrupt/house`; kopia `backup-v4` idzie tą samą ścieżką co v1–v3 (`${key}:backup-v${from}` w `src/storage/idb.ts`, `readBackups` liczy do `SAVE_VERSION-1`), a `migrationOf` (`src/core/saveHealth.ts`) jest ogólne po `from`, więc „Zapis gry” mówi o wersji 4 bez zmian w kodzie.
- **Ładowanie pokoju w trakcie gry ma własny sygnał:** każdy nieudany plik → `console.warn(loadErrorLine('room', …))` z kluczem, URL i statusem; pokój w remoncie po rozliczeniu → `writeHealth` → „Obrazki” z przyczynami (`artCauses`); plik nieudany w tej sesji nie jest ponawiany (naprawiona w review pętla CRIT).
- **Najważniejsza luka (L-1, LOW):** w oknie ładowania po „Dalej” „Obrazki” nadal pokazuje rekord poprzedniego pokoju (salonu), a kuchnia na ekranie stoi na pudełkach zastępczych nieodróżnialnych od „brak grafiki”; przy pliku, który wisi do limitu XHR (2 × 12 s), rodzic i dziecko widzą sprzeczne stany.
- **Dom nieznany buildowi albo pokoje spoza danych (L-2, LOW)** zostają tylko w konsoli — w odróżnieniu od `salonCarried` i `roomProblems` nie ma rekordu runtime ani linii w „Zapis gry”.

## 2. Model przechwytywania (zmiany względem 2026-10-25)

- **Platforma, tracker, granica błędów:** bez zmian. Klient-only offline PWA (`src/main.ts`), bez trackera i bez sieci w grze. Kanały człowieka: ekran dziecka, karty DOM z `Kod:` (`installErrorBoundary`, `saveFailedCard`, `saveRefusedCard`), panel rodzica za bramką („Obrazki”, „Zapis gry”, „Dźwięki”, „Gra bez internetu”), konsola tabletu, CI i smoke deployu (`roomArtCheck` pokrywa teraz oba pokoje: 58/58 obrazów w deployu 41161789323).
- **Nowe źródła sygnału (F-04):** w `start` (`src/main.ts`) trzy linie konsoli: `console.warn` przy pokojach domu spoza danych i przy nieznanym id domu, `console.info` przy przeniesieniu remontu (`nextRoom`); każda zmiana domu lub pokoju ustawia `roomRepaired` → `saver.markDirty()`, więc migrowany zapis jest od razu zapisany (i dopiero wtedy kopiowany do `backup-v4`).
- **Nowe źródła sygnału (S-22):** `createRoomArtLoader` (`src/ui/roomArtLoader.ts`, w rejestrze `REGISTRY_KEYS.roomArtLoader`, podpięty do całosesyjnego loadera `UIScene`): rekord runtime `REGISTRY_KEYS.roomLoad` (`pending`, `settled`, czytany przez `RoomScene`, `TaskScene` i hook e2e), `console.warn` per nieudany plik, `console.warn('Room art could not be queued', error)` w `catch` kolejkowania, rekord `roomArtHealth` nadpisywany wyłącznie dla pokoju w remoncie (`refreshHealth`, no-op dopóki pokój się ładuje). Boot ładuje i ocenia tylko bieżący pokój (`bootRoomArt`).
- **Przegląd repozytorium** (`src/` bez `src/testing`, `git grep -F`):

  | | 7770ae8 | 6c4f414 |
  |---|---|---|
  | linie z `catch` | 69 | 70 (`createRoomArtLoader.ensure`) |
  | puste `catch {}` | 0 | 0 |
  | `.catch(() =>` | 1 | 1 (`installHint`) |
  | `console.error` | 9 | 9 |
  | `console.warn` | 55 | 60 (dom ×2, `writeHealth`, `onFail`, kolejkowanie) |
  | `console.info` | 4 | 5 (przeniesienie remontu) |

## 3. Co dociera do obserwatora (statycznie)

| Kształt awarii | Dziecko | Rodzic | Konsola / CI | Werdykt |
|---|---|---|---|---|
| Zapis v5 z uszkodzonym `house` | karta „nie da się odczytać” | `Kod: corrupt/house` | `Save unreadable (…)` | widoczne |
| Kopia `backup-v4` nieudana / przekroczony czas | nic | „Zapis gry”: kopia `lost`/`uncertain` z kodem | `lastFailure` w statusie | widoczne (mechanizm v1–v3) |
| Zapis z nieznanym id domu | gra na pierwszym domu | nic | `Save names an unknown house (…)` | **tylko konsola** (L-2) |
| Dom w zapisie z pokojami spoza danych | pokój jako teaser / ukryty | nic (`unknown-room` niewidoczny dla rodzica) | `Save house lists rooms …` + `Save rooms do not match …` | **tylko konsola** (L-2) |
| Remont przeniesiony przy starcie | otwiera się kuchnia | nic (zamierzone) | `Renovation moved from … to …` | widoczne w konsoli |
| Plik kuchni 404 / błąd sieci po „Dalej” | pudełko zastępcze | „Obrazki”: brak N z M + przyczyna | `loadErrorLine('room', key, url, status)` | widoczne |
| Plik kuchni wisi (do 2 × `timeoutMs`) | pudełka jak przy braku | „Obrazki” pokazuje rekord salonu | nic do czasu limitu | **sprzeczne stany w oknie ładowania** (L-1) |
| Plik złego rozmiaru w trakcie gry | rozciągnięty obraz | nic | nic | znane (FU-K 3) |
| Brak grafiki w odwiedzanym salonie | pudełko zastępcze | nic | `loadErrorLine` | znane (FU-K 2) |
| Rzut przy kolejkowaniu pokoju B, gdy A czeka | A zostaje na pudełkach | nic | `Room art could not be queued` | znane (FU-K 14) |
| Loader nieprzypięty (`ensure` bez loadera) | pudełka | „Obrazki” po `refreshHealth`: brak bez przyczyny | nic | **ciche** (L-3) |

## 4. Systemowe przyczyny źródłowe

1. **Rekord zdrowia jednego pokoju na raz.** `roomArtHealth` opisuje „pokój w remoncie” i jest przepisywany dopiero po rozliczeniu ładowania; do tego czasu rekord i ekran mówią o różnych pokojach, a pokoje odwiedzane nie mają rekordu. Rozsądne lokalnie (plan review F2: oceniamy tylko bieżący pokój), ale okno ładowania nie ma własnego stanu. Wyjaśnia L-1 i znane FU-K 2.
2. **Naprawy „zgłoś, nie naprawiaj” bez rekordu runtime.** Wzorzec projektu dla rozjazdu zapisu z grą to rekord w rejestrze + linia w „Zapis gry” (`roomProblems`, `salonCarried`); nowe przypadki domu (F-04) zatrzymały się na `console.warn`. Wyjaśnia L-2.
3. **Wczesny powrót bez sygnału w opcjonalnej zależności.** `ensure` traktuje brak loadera tak samo jak wyłączenie szwem e2e. Wyjaśnia L-3.

## 5. Ustalenia według obszarów

### Obszar 1: zapis v5 z domem

| # | Lokalizacja | Kategoria | Ważność | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-2 | `src/main.ts` `start` (gałąź `HOUSES.some(...)` / `else`), `src/core/house.ts` `mergeHouse` | logged-not-captured | LOW | Zapis z domem, którego build nie zna (np. powrót do starszego buildu v5 po dodaniu domu), albo z pokojami spoza danych: gra rysuje pierwszy dom z danych, zapis zachowuje swój dom, dziecko widzi teaser zamiast pokoju. Rodzic w „Zapis gry” nie widzi nic; jedyny ślad to `console.warn` na tablecie. | Zapisać `{ unknownHouse, extraRooms }` w rekordzie runtime (jak `salonCarried`) i pokazać jedną linię w „Zapis gry” z id; nic nie naprawiać. |

Zweryfikowane bez ustaleń: `LIFT_V4_HOUSE` nie mutuje wejścia i nie rzuca; `validHouse` w `saveProblem` daje nazwane pole `house` dla `Kod:`; `freshSession(FIRST_HOUSE)` w resecie (`UIScene.openReset`) i przy braku zapisu; `backup-v4` przez ogólne `putBackupOnce` (write-once); `migrationOf` nie zależy od numeru wersji; `houseEqual` (nie referencja) decyduje o `markDirty`; marker `v4-salon` dopisany do `E2E_HOOK_MARKERS` (`vite/e2eHookGuard.mjs`), więc szew nie trafi do `dist/`.

### Obszar 2: kuchnia, „Dalej”, ładowanie w trakcie gry, odwiedziny

| # | Lokalizacja | Kategoria | Ważność | Co dzieje się na produkcji | Kierunek poprawki |
|---|---|---|---|---|---|
| L-1 | `src/ui/roomArtLoader.ts` `refreshHealth` (no-op przy `pending.has(room)`), `src/scenes/RoomScene.ts` `moveAfterDone` | missing-context | LOW | Po „Dalej” kuchnia rysuje się od razu z pudełkami zastępczymi (te same co przy braku pliku), a „Obrazki” do rozliczenia ładowania pokazuje rekord salonu („w porządku”). Przy wolnym łączu lub wiszącym pliku (do 2 × `balance.loader.timeoutMs` = 24 s) rodzic otwierający panel widzi „w porządku”, dziecko pudełka; po czasie rekord się poprawia, ale opis „co widziałem” z tej chwili jest mylący. | Na czas `pending` pokazać w „Obrazki” stan „wczytuje się” dla pokoju w remoncie (z `roomLoad`), zamiast rekordu poprzedniego pokoju. |
| L-3 | `src/ui/roomArtLoader.ts` `ensure` (`if (opts.disabled \|\| !loader) return;`) | swallowed | LOW | Gdyby `UIScene` nie przypięła loadera (zmiana kolejności scen, wyjątek w `UIScene.create` przed `attachLoader`), żaden pokój poza bootowym nigdy się nie wczyta; pudełka zastępcze, a „Obrazki” po `refreshHealth` liczy braki bez przyczyny (`artCauses` bez `failed`/`loaded`). Brak linii w konsoli, która mówi, że loadera nie było. Dziś nieosiągalne (UIScene startuje z bootem). | Raz na sesję `console.warn('Room art loader not attached')` w gałęzi `!loader` (nie w `disabled`), albo przyczyna `notQueued` w rekordzie. |

Zweryfikowane bez ustaleń: `onFail` loguje klucz, URL i status (`loadErrorLine`); `attempted` (tekstura, `failed`, `loaded`) zatrzymuje ponowne kolejkowanie nieudanych plików — `redraw` woła `ensure` przy każdym rysowaniu, a pętla nie wraca; `roomArt` rzuca przy pokoju bez plików sceny już przy imporcie modułu (`ROOM_ART`), więc nie w trakcie gry; `moveAfterDone` zapisuje przez `flush('now')` po obu wpisach rejestru, a błąd zapisu idzie do statusu autosave („Zapis gry”, karta odmowy); `visitTarget` nigdy nie wskazuje teasera; deploy smoke sprawdza obrazy obu pokojów w precache (`roomArtCheck`).

Znane, nie raportowane ponownie: FU-K 2 (odwiedzany pokój bez „Obrazki”), FU-K 3 (brak `wrongSizes` w trakcie gry: `wrongSize: wrongSizes(entries, () => undefined)` jest zawsze puste), FU-K 14 (`detach` w `catch` zdejmuje słuchaczy wcześniejszego pokoju), FU-K 15 (wielokrotne `once('complete')`), FU-K 16 (karta zdjęta przez `onSleep` bez `moveAfterDone`), FU-K 17/19 (tło zadania), FU-R 1 (linia `roomMismatch` jest teraz ogólna — „Stan pokoju” — ale nie nazywa pokoju).

### Platforma / infrastruktura

Bez zmian w `.github/`, `deploy/` (jedna linia w `deploy/README.md`), `src/pwa/`. `balance.loader.totalMs` zostaje 50 s, bo boot ładuje jeden pokój (`bootRoomArt`), a `tests/bootBudget.test.ts` liczy najgorszy pokój. Brak nowych ustaleń.

## 6. Zalecana kolejność poprawek

1. **L-2** — rekord runtime domu + linia w „Zapis gry”: jedyny przypadek, w którym zapis i gra się rozjeżdżają, a rodzic nic nie widzi. Mały koszt (wzorzec `salonCarried`). Ograniczenie: tylko id domu i pokoi, bez wartości z zapisu.
2. **L-1** — stan „wczytuje się” w „Obrazki” z `roomLoad`. Najlepiej razem z FU-K 2/3 przy następnej zmianie `src/ui/roomArtLoader.ts` (ich trigger).
3. **L-3** — jedna linia konsoli w gałęzi `!loader`; przy tej samej zmianie co FU-K 14/15.

## 7. Zmiany od ostatniego audytu

| Poprzedni id | Status | Dowód |
|---|---|---|
| L-2 (2026-10-25, przedział maski 5–30 % w `scripts/recolour-board.py`) | not re-checked | Inny obszar; `scripts/make-task-art.mjs` zmienił się w tym runie (pętla pokojów dla kuchni), `recolour-board.py` nie. |

## 8. Metoda i ograniczenia

- **Wykonanie:** audyt przeprowadzony bez subagentów (zob. Autonomous decisions): odczyt pełnego diffu `9d28753..6c4f414` w obu obszarach, follow-upów obu slice'ów i `design-gaps.md` (gap 182).
- **Sprawdzone ręcznie:** klucz kopii `backup-v${from}` i zakres `readBackups` (`src/storage/idb.ts`, `src/core/autosave.ts`); ogólność `migrationOf` (`src/core/saveHealth.ts`); `roomArt` rzuca przy imporcie (`src/data/roomArt.ts`); `RoomLayer`/`RoomView` nie znają `roomLoad` (pudełka w oknie ładowania); `roomMismatch` w `pl.settings` jest ogólne; liczniki przeglądu `git grep -F` na `6c4f414`.
- **Nie udowodniono (statyczny audyt, brak `--runtime`):** zachowanie współdzielonego loadera `UIScene` przy równoczesnym wczytywaniu muzyki i pokoju (czy `complete` przychodzi po obu partiach i czy `xhrSettings.timeout` z `addfile` działa na pliku dodanym w trakcie biegu loadera) — opisane z kodu Phaser 4.2.1 i testów jednostkowych runu, nie z przeglądarki; rzeczywista długość okna L-1 na tablecie; migracja v4 → v5 między dwoma prawdziwymi buildami (FU-R 10: dowód tylko na szwie `?e2eSave=v4-salon` i testach jednostkowych); zawartość konsoli tabletu na produkcji (brak telemetrii z założenia).
- **Harness sond:** brak (tryb statyczny).

## Autonomous decisions

- **Obszary:** wzięte z argumentów kroku (`area_source: arguments`); bez pytania użytkownika (kontrakt runu, reguła 1).
- **Dowód w czasie działania:** nie uruchomiony — krok zadał audyt statyczny. Zmieniłoby to: ustalenie CRITICAL/HIGH wymagające dowodu albo `--runtime` w poleceniu.
- **Subagenci:** wybrano audyt w jednym wątku zamiast trzech równoległych audytorów (2 obszary + infrastruktura). Odrzucono fan-out, bo diff runu to 28 plików / ~700 linii, infrastruktura (tracker, granica, deploy) nie zmieniła się od 2026-10-25, a pełny diff mieścił się w jednym odczycie. Zmieniłoby to: diff dotykający `src/pwa/`, `deploy/`, `.github/` lub granicy błędów, albo więcej niż ~2 tys. linii.
- **Ważność L-1:** LOW, nie MEDIUM — stan się samoczynnie poprawia po limicie XHR, a „Obrazki” po rozliczeniu pokazuje przyczynę; zmieniłaby to obserwacja z playtestu, że rodzic diagnozował po złym rekordzie.
