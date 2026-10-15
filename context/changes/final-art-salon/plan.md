# S-16a `final-art-salon` — plan implementacji

## Overview

Salon przechodzi z placeholderów rysowanych kodem (10 slotów, `SALON_PLACEHOLDERS`) na docelową grafikę z paczki
`designs/martynka-expansion-v1`: pierwsza czynność „Odnów ściany i podłogę” to **etap tła** (przed → po, jedno
stuknięcie, bez panelu wariantów), potem **6 mebli × 3 warianty** (sofa, dywan, stolik, komoda, fotel, obrazki);
lampa, dwie rośliny i pufa to stała dekoracja. Do tego: przeliczenie żywych zapisów ze starym salonem przy wczytaniu
(format **zostaje v2**), konwersja grafiki do WebP przez `npm run art`, rysowanie pokoju z obrazów z zastępnikiem przy
braku tekstury, animacje za `prefersReducedMotion()`, ekran ładowania w `BootScene` oraz tanie follow-upy z
`Trigger: S-16` dotyczące salonu i karty odblokowania.

## Current State Analysis

- Model pokoju (`src/core/types.ts` `SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState`): każda czynność ma wymagany
  `slot`; `purchase` (`src/core/rooms.ts`) zapisuje `chosen[task.slot]` i odrzuca wariant spoza 0–2; `stepPanel`
  (`src/core/variantPanel.ts`) otwiera panel na każde `open`. Etap bez wariantu nie istnieje.
- `RoomState` = `{ tasksDone, chosen }`; `validRoom` (`src/core/save.ts`) sprawdza tylko liczbę ≥ 0 i wartości 0–2
  przy dowolnych kluczach — nowy salon mieści się w v2 bez zmian, jeśli etap nie ma wpisu w `chosen`.
- „Zrobione” czyta się z `tasksDone` wszędzie (`currentTask`, `roomDone`, `roomsListView`, `saveSummary`,
  `TaskScene`); `chosen` czytają tylko rysowanie i trafianie (`slotAt`, `holdPoint`, `stepPanel` change,
  `RoomView.render`, `RoomScene.slotTargets/snapshot`).
- Geometria: `SlotDef` ma środek i `depth`; rozmiar z `SALON_PLACEHOLDERS`; `roomHit.ts` `Box {left,top,right,bottom}`,
  `RoomView.ts` drugi `Box {left,top,width,height}` (follow-up F4).
- Naprawy przy wczytaniu: `repairCurrentRoom` w `src/main.ts` `start` po `loadSave`; podgląd importu idzie przez
  `UIScene.openImport` → `summarize: (s) => saveSummary(s, ROOMS)` na surowym, nienaprawionym zapisie.
- Grafika zadań: `scripts/make-task-art.mjs` (`KIT`, `OUT`, `JOBS`, `cwebp -q 85 -alpha_q 100 -m 6`), tabela
  `TASK_ART` (`src/data/taskArt.ts`) z testem `tests/taskArt.test.ts`, ładowanie w `BootScene.preload`,
  `artHealth` → `REGISTRY_KEYS.artHealth` → sekcja „Obrazki” (`src/ui/dom/artHealthView.ts`).
- `BootScene` nic nie rysuje; Phaser 4.2.1 renderuje scenę w trakcie jej `preload` (research, pkt 9).
- Animacje: `RoomScene.celebrate` (pop osobnej `Graphics` nad wszystkim — follow-up V2 — i cząsteczki), za
  `prefersReducedMotion()`; `TaskScene.shake` **nie** jest za tym warunkiem.
- `MINIGAME_WORDS` (`src/data/minigames.ts`) to podpisy starych slotów; `tests/wordRound.test.ts` wymaga, by każde
  słowo było podpisem z `pl.room.slots` i by jedno miało Ó/Ł.
- Pliku lekcji w `context/foundation/` nie ma (sprawdzone 2026-10-15) — żadna lekcja nie obowiązuje faz.

## Desired End State

Na świeżym urządzeniu dziecko widzi ekran ładowania z paskiem postępu, potem grę; w salonie zniszczone tło z
zniszczonymi meblami. Pierwsze stuknięcie w „Odnów ściany i podłogę” (5 gwiazdek) przenika tło do odnowionego
(z dekoracją: lampa, rośliny, pufa); kolejne czynności otwierają panel z trzema miniaturami mebla i nazwą wariantu,
„Wybieram” stawia mebel na jego głębokości z popem i gwiazdkami. Po 7 czynnościach (suma 71) „Pokój gotowy!” z
miniaturą salonu złożoną z obrazów; przytrzymanie mebla zmienia wariant za darmo. Zapis z 10-slotowym salonem po
aktualizacji pokazuje co najmniej tyle postępu, ile dziecko zapłaciło, z zachowanymi wariantami sofy, dywanu,
stolika, komody (półki) i obrazków; gwiazdki bez zmian. Brak tekstury pokoju daje zastępnik, a sekcja „Obrazki”
liczy też salon. Weryfikacja: bramka lokalna zielona, nowe testy jednostkowe i spec e2e `salon-art.spec.ts`,
zrzuty stanów z listy w fazie 5–8.

### Key Discoveries:

- `src/core/rooms.ts` `purchase` / `src/core/variantPanel.ts` `stepPanel` — jedyna droga wydawania gwiazdek (ryzyko #16).
- `src/main.ts` `start` — miejsce napraw po `loadSave`; `src/scenes/UIScene.ts` `openImport` (`summarize`) — jedno
  miejsce podglądu importu.
- Manifest paczki: sloty sofa (838,257 835×566 z30), wall-frames (1055,15 634×425 z5), rug (432,441 1111×640 z10),
  cabinet (293,226 512×363 z20), armchair (248,554 399×361 z40), coffee-table (763,535 537×397 z50); warstwy
  lamp-table z25, plant-left z26, plant-right z35, pouf z60; każdy z `anchor` i `visibleRect` (16 px marginesu).
- `furnishings-before` i `shadows` to jedne warstwy całego pokoju — nie da się ich pociąć per slot (research pkt 8).
- `textures.getPixelAlpha(x, y, key)` (Phaser 4) daje alfę piksela; `src/core` zostaje czysty przez wstrzyknięty predykat.
- Waga: 26 plików WebP q85 w pełnej rozdzielczości ≈ 1 233 242 B; GPU ≈ 59 MB (research pkt 6–7).

## What We're NOT Doing

- Zmiana formatu zapisu (zostaje v2; gdyby faza odkryła potrzebę v3 — STOP na otwartym PR, kontrakt).
- Dźwięki (zakup, zmiana, `audio.noAudio`) → S-16b; tylko istniejący pusty seam `playPurchaseSound`.
- Atlas tekstur → re-trigger `precache over budget or a second room`.
- Ekran zadań: termometr E3–E5 (design-gaps 64), podświetlenie rysunku przy podpowiedzi, O3 kafelki obok termometru,
  ` = ?` po wyrażeniu, jednostki/„minus” czytane przez lektora — re-trigger w `follow-ups/review-fixes.md` (faza 9).
- SPATIAL, grafika portfela (design-gaps 104), przekreślone zero w foncie — triggery bez zmian.
- Zniszczone meble per slot, cienie per slot, tła pośrednie, grafika ekranu ładowania i miniatury salonu — braki
  paczki: wiersze DESIGN-GAP z odsyłaczem do `docs/designer-brief-s16.md` (P2.2, P2.3, P3.6); nic nie jest wymyślane.
- Przestawianie panelu wariantów (`ROOM_LAYOUT.tray`) — zatwierdzony układ S-09 zostaje; zakrycie mebla ocenia gate wizualny.
- Drugi pokój, nowe sloty P3 (model tylko na nie pozwala: dopisywanie na końcu listy).
- Strojenie kosztów (S-17).

## Implementation Approach

Najpierw czysta logika (`tdd`): etap w modelu, przeliczenie starego salonu, nowa geometria i trafianie. Dane nowego
salonu wchodzą razem z rysowaniem **zastępników** (pudełka z podpisem w `visibleRect`), które zostają potem jako
fallback dla brakującej tekstury — dzięki temu każda faza jest zielona, zanim pojawi się grafika. Potem rura grafiki
(WebP + tabela + ładowanie + zdrowie), rysowanie pokoju z obrazów, panel i karta, animacje, ekran ładowania,
dokumentacja i na końcu e2e prawdziwym dotykiem. Każda faza UI dotyka najwyżej dwóch komponentów.

## Critical Implementation Details

- **State sequencing (przeliczenie).** `remapLegacySalon` musi działać **po** `repairCurrentRoom` i **przed**
  `createGame` w `src/main.ts` `start`, oraz w `summarize` podglądu importu; `saver.replace` dalej zapisuje surowy
  import (ścieżka wczytania go przeliczy). Funkcja jest idempotentna (drugie wywołanie zwraca ten sam obiekt, `toBe`).
  Znacznik starego układu: klucz `chosen.salon` spoza nowych identyfikatorów slotów. Nowe id nie mogą pokrywać się ze
  starymi o innym znaczeniu: `sofa`, `rug` wspólne i zgodne; `coffee-table`, `cabinet`, `wall-frames`, `armchair` nowe.
- **Double tap na etapie (ryzyko #16).** Zakup etapu następuje na stuknięcie przycisku czynności; zaraz potem w tym
  samym miejscu stoi przycisk następnej czynności (sofa), więc drugie stuknięcie otwiera panel sofy, który niczego nie
  wydaje (wydaje tylko „Wybieram” z podglądem). To zachowanie jest kryterium e2e.
- **Trafianie.** Prostokąt `visibleRect` w przestrzeni sceny, najwyższy `z` wygrywa, a gdy predykat alfy jest dostępny,
  przezroczysty piksel przepuszcza dotyk do niższego slotu (dywan 1111×640 nie może zjadać fotela ani stolika).
  `getPixelAlpha` wołane tylko na `down`, nigdy na `move`.
- **Pop na głębokości obiektu** (V2): pop animuje obraz slotu (`setDepth(z)`, origin w `anchor`), nie osobną grafikę.

## Phase 1: Etap tła w modelu pokoju

Driver: tdd
Driver why: rodzaj czynności `stage`, ścieżka zakupu bez wariantu i gałąź etapu w `stepPanel` nie istnieją — failing testy (etap kupiony jednym `open` wydaje koszt raz, nie dotyka `chosen`, za mało gwiazdek nic nie robi, drugi `open` otwiera panel następnej czynności bez wydawania) prowadzą implementację.

### Overview

Czynność pokoju staje się unią `stage | slot`; zakup etapu tylko podnosi `tasksDone` i odejmuje koszt. Stare dane
salonu dostają `kind: 'slot'` bez zmiany zachowania.

### Changes Required:

#### 1. Typy

**File**: `src/core/types.ts`

**Intent**: Rozróżnić czynność etapu (zmienia tło, bez wariantów) od czynności meblowej.

**Contract**: `RoomTaskDef = { kind: 'stage'; id; label; cost } | { kind: 'slot'; id; slot; label; cost }`. `RoomState` bez zmian.

#### 2. Zakup i reduktor panelu

**File**: `src/core/rooms.ts`, `src/core/variantPanel.ts`

**Intent**: `purchase` dla etapu ignoruje wariant i nie pisze `chosen`; `stepPanel` przy zamkniętym panelu i `open`
na bieżącym etapie (stać dziecko) kupuje od razu i zwraca `panel: closed` z `bought`. Funkcja pomocnicza mówi, ile
etapów jest zrobionych (do wyboru tła).

**Contract**: `bought` = `{ kind: 'stage'; taskId } | { kind: 'slot'; taskId; slot; variant }`; `purchase(room, state, stars, variant: number | null)`
— `bad-variant` tylko dla czynności `slot`; nowa `stagesDone(room, state): number` (ile czynności `stage` w prefiksie `tasksDone`).

#### 3. Dane i scena (zgodność)

**File**: `src/data/rooms.ts`, `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`

**Intent**: Stare czynności salonu dostają `kind: 'slot'`; miejsca czytające `task.slot` / `bought.slot` zawężają
typ (etap: przenikanie tła przyjdzie w fazie 7, tu tylko `redraw`). Hak e2e dodaje `taskKind` do snapshotu pokoju.

**Contract**: `RoomSnapshot.taskKind: 'stage' | 'slot' | null`.

#### 4. Testy

**File**: `tests/rooms.test.ts`, `tests/variantPanel.test.ts`

**Intent**: Testy na inline'owym pokoju z etapem: koszt raz, `chosen` bez zmian, `short`, drugi `open` → panel
`buy` następnej czynności bez wydatku, `stagesDone`.

### Success Criteria:

#### Automated Verification:

- Nowe testy etapu w `tests/rooms.test.ts` i `tests/variantPanel.test.ts` czerwone przed implementacją, zielone po
- Bramka lokalna zielona: `npm run lint`, `npm run typecheck`, unit (baseline + Δ nowych testów, bez spadków), `npm run build`, e2e (baseline, bez spadków)
- Celowe złamanie: `stepPanel` dla etapu nie sprawdza `stars >= cost` → test „za mało gwiazdek” czerwony; przywrócone; meta-check: test dowodzi warunku w reduktorze, nie w `purchase` (sprawdzone przez złamanie tylko reduktora)

---

## Phase 2: Przeliczenie starego salonu przy wczytaniu

Driver: tdd
Driver why: `remapLegacySalon` nie istnieje, a reguła (zaokrąglenie w górę, warianty przeniesione, gwiazdki nietknięte, idempotencja) jest czystą funkcją, którą failing testy dla każdego starego `tasksDone` 0–10 prowadzą.

### Overview

Czysta, idempotentna funkcja przelicza zapis ze starą 10-pozycyjną listą na nową listę (reguła B — decyzja 1),
wołana przy wczytaniu i w podglądzie importu. Na starych danych salonu (faza 1) jest no-op, bo znacznik nie działa.

### Changes Required:

#### 1. Funkcja przeliczenia

**File**: `src/core/rooms.ts`

**Intent**: Rozpoznać stary układ, policzyć wydane gwiazdki starego prefiksu, wybrać najkrótszy nowy prefiks o koszcie
≥ wydanym (max długość listy), przenieść warianty mebli według mapy nazw, usunąć stare klucze. Gwiazdek nie dotyka.

**Contract**: `remapLegacySalon(session: SessionSave, legacy: LegacyRoomLayout, room: RoomDef): { session: SessionSave; remappedFrom: number | null }`;
`LegacyRoomLayout = { roomId; tasks: { slot: string; cost: number }[]; renames: Record<string, string> }`. Zwraca ten
sam obiekt sesji (`toBe`), gdy nie ma czego przeliczać; zachowuje inne pokoje i pola sesji.

#### 2. Dane starego układu

**File**: `src/data/rooms.ts`

**Intent**: Zamrożona kopia starej listy (sloty i koszty 5…15) i mapa `table→coffee-table`, `shelf→cabinet`,
`picture→wall-frames` (`sofa`, `rug` bez zmian) jako `LEGACY_SALON`.

**Contract**: `export const LEGACY_SALON: LegacyRoomLayout`.

#### 3. Wywołania

**File**: `src/main.ts`, `src/scenes/UIScene.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`

**Intent**: `start` woła przeliczenie po `repairCurrentRoom`; `openImport` `summarize` liczy podsumowanie z
przeliczonego zapisu. W buildzie e2e nowy seam `?e2eSave=legacy-salon` (pamięć z zapisem v2: stary salon,
`tasksDone` 4, `chosen` floor/walls/curtains/sofa=2) — wartość nowego `E2ESaveSeam` pod istniejącym markerem `e2eSave`.

**Contract**: `E2ESaveSeam` += `'legacy-salon'`; build produkcyjny nadal drukuje `e2e hook: absent`.

#### 4. Testy

**File**: `tests/salonRemap.test.ts` (nowy)

**Intent**: Pokój nowego kształtu inline (etap + 6 slotów, koszty 5, 7, 9, 10, 12, 13, 15): dla każdego starego
`tasksDone` 0–10 nowy koszt prefiksu ≥ starego i prefiks krótszy o jeden byłby < (zaokrąglenie w górę, dar ≤ 1
czynność); każdy stary mebel w prefiksie ma swój nowy slot w nowym prefiksie z tym samym wariantem; `stars`
identyczne; drugie wywołanie `toBe`; `tasksDone` 0 i nowy układ → `toBe`; obcy pokój bez zmian; fixture'y z
`tests/fixtures/` przechodzą bez zmian (`toBe`) i są bajt w bajt.

### Success Criteria:

#### Automated Verification:

- `tests/salonRemap.test.ts` czerwony przed implementacją, zielony po (wszystkie stare `tasksDone` 0–10, idempotencja, fixture'y)
- `git diff --exit-code tests/fixtures/` czysty (fixture'y bajt w bajt)
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build z `e2e hook: absent`, e2e (baseline, bez spadków)
- Celowe złamanie: zaokrąglenie w dół (najdłuższy prefiks ≤ wydanym) → test „prefiks ≥ wydanego” czerwony; przywrócone; meta-check: złamanie usunięcia starych kluczy osobno czerwieni test idempotencji

#### Manual Verification:

- [human] Reguła przeliczenia B (zaokrąglenie w górę, bez zwrotu gwiazdek) zamiast reguły A z `change.md` (zwrot gwiazdek) — maintainer akceptuje albo zleca A (decyzja 1)

---

## Phase 3: Nowy salon w danych, geometria z manifestu i trafianie

Driver: tdd
Driver why: geometria slotu z manifestu (lewy górny róg, `visibleRect`, `anchor`, `z`) i trafianie po `z` z wstrzykniętą alfą nie istnieją — failing testy (dotyk w przezroczysty róg dywanu nad fotelem trafia fotel, sofa nad obrazkami, `holdPoint` w każdym meblu) prowadzą implementację; dane i zastępniki w scenie idą za nimi.

### Overview

`SALON` = etap + 6 slotów z manifestu + 4 warstwy dekoracji; jeden typ `Box` w `core`; scena rysuje meble jako
zastępniki (pudełko z podpisem w `visibleRect`), które w fazie 5 zostaną fallbackiem braku tekstury. Testy danych,
trafiania, słów i trzy spec'e e2e salonu przepisane na nową listę.

### Changes Required:

#### 1. Model geometrii

**File**: `src/core/types.ts`, `src/core/roomHit.ts`

**Intent**: Slot i warstwa niosą prostokąt z manifestu; trafianie po `visibleRect` w scenie, najwyższy `z`, opcjonalny
predykat alfy; jeden `Box` (F4).

**Contract**: `SlotDef = { id; x; y; width; height; z; anchor: [number, number]; visibleRect: [l, t, w, h]; variants: [string, string, string] }`
(x/y = lewy górny róg w 1920×1080, `variants` = klucze tekstur); `LayerDef` analogicznie bez wariantów (`key`);
`RoomDef = { id; name; scene: { before; after; furnishingsBefore; shadows }; decor: LayerDef[]; slots; tasks }`;
`slotBox(slot): Box` (scena), `slotAt(room, chosen, point, alphaAt?)`, `holdPoint(room, chosen, slotId, step?, alphaAt?)`,
`AlphaAt = (slotId, localX, localY) => number | null` (null = brak tekstury → sam prostokąt).

#### 2. Dane salonu

**File**: `src/data/rooms.ts`, `src/data/layout.ts`

**Intent**: Czynności w kolejności: `renovate` (stage, 5), `add-sofa` 7, `lay-rug` 9, `place-coffee-table` 10,
`place-cabinet` 12, `place-armchair` 13, `hang-frames` 15 (suma 71 ≈ 10 czystych rund — decyzja 6); geometria
przepisana z manifestu; dekoracja lamp-table, plant-left, plant-right, pouf. `SALON_PLACEHOLDERS`, `Look`,
`captionAnchor` usunięte; wygląd zastępnika (kolory z `PLACEHOLDER_COLORS`) w `ROOM_LAYOUT.standIn`.

**Contract**: komentarz w `SALON.tasks`: nowe czynności tylko na końcu listy (P3 briefu); `ROOM_LAYOUT.slot` traci
pola wzorów (`stripe*`, `dot*`, `patternAlpha`).

#### 3. Copy i słowa

**File**: `src/data/pl.ts`, `src/data/minigames.ts`

**Intent**: `pl.room.tasks`: `renovate` „Odnów ściany i podłogę” (decyzja autora), „Postaw sofę”, „Połóż dywan”,
„Postaw stolik”, „Postaw komodę”, „Postaw fotel”, „Powieś obrazki” (biernik, styl istniejących); `pl.room.slots`:
„sofa”, „dywan”, „stolik”, „komoda”, „fotel”, „obrazki” (manifest `label`, małą literą jak dziś);
`pl.room.variants[slot]`: 18 nazw z manifestu (Morska, Słoneczna, Listkowa, …). `MINIGAME_WORDS` = SOFA, DYWAN,
STOLIK, KOMODA, FOTEL, OBRAZKI.

**Contract**: test słów wymaga: każde słowo jest podpisem; asercja „jedno słowo z Ó/Ł” zastąpiona pokryciem polskich
liter przez istniejący test `revealed('PÓŁKA')` (decyzja 7).

#### 4. Scena na zastępnikach

**File**: `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts`, `src/ui/widgets/VariantPanel.ts`, `src/ui/widgets/RoomDoneCard.ts`, `src/testing/e2eHook.ts`

**Intent**: `RoomView` rysuje tło kodem (ściana/podłoga jak dziś; jaśniejsze po etapie) i każdy umeblowany slot jako
pudełko z podpisem w `visibleRect` na głębokości `z`; panel i miniatura używają tego samego zastępnika; `RoomScene`
woła trafianie bez `SALON_PLACEHOLDERS`. Hak: `stageDone`, cele slotów z nowego `holdPoint`.

**Contract**: `RoomSnapshot.stageDone: boolean`; `targets.slots` po id nowych slotów.

#### 5. Testy i e2e

**File**: `tests/roomsData.test.ts`, `tests/roomHit.test.ts`, `tests/wordRound.test.ts`, `tests/e2e/room-purchase.spec.ts`, `tests/e2e/room-change.spec.ts`, `tests/e2e/save-restart.spec.ts`

**Intent**: Dane: 7 czynności, pierwsza `stage`, koszty 5–15 rosnące, suma 71, każdy slot ma dokładnie jedną
czynność, geometria w 1920×1080, `visibleRect` w płótnie, id unikalne i rozłączne ze starymi (`LEGACY_SALON`
renames). Trafianie: punkty z manifestu (róg dywanu z alfą 0 → fotel/stolik/nic; sofa nad obrazkami). Spec'e e2e:
pierwszy zakup = etap jednym stuknięciem, panel i zmiana wariantu na sofie, `chosen.sofa` po restarcie (protokół
pliku-żądania z kontraktu, jeśli agent nie uruchomi Chromium).

### Success Criteria:

#### Automated Verification:

- Nowe testy trafiania w `tests/roomHit.test.ts` czerwone przed implementacją, zielone po
- `tests/roomsData.test.ts`, `tests/wordRound.test.ts` przepisane i zielone
- `rg -n "SALON_PLACEHOLDERS|captionAnchor|drawLook" src tests` pusty
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e z przepisanymi `room-purchase`, `room-change`, `save-restart` (baseline, bez spadków)
- Celowe złamanie: `slotAt` ignoruje predykat alfy → test „róg dywanu nad fotelem” czerwony; przywrócone; meta-check: z predykatem stale zwracającym 255 test też czerwony (dowodzi alfy, nie kolejności `z`)

---

## Phase 4: Grafika salonu w WebP, ładowanie i zdrowie obrazków

Driver: impl
Driver why: konwersja skryptem, pliki w `public/`, tabela danych i wpięcie w `BootScene` to rura zasobów — dowód w teście tabeli vs pliki, wadze precache i sekcji „Obrazki”, nie w failing teście logiki.

### Overview

`npm run art` dokłada 26 plików salonu w pełnej rozdzielczości (decyzja 4); tabela `ROOM_ART` jak `TASK_ART`;
wszystko ładowane w `BootScene`; zdrowie grafiki salonu osobno w rejestrze i jako druga linia w „Obrazki”.

### Changes Required:

#### 1. Skrypt

**File**: `scripts/make-task-art.mjs`

**Intent**: Drugi korzeń paczki `designs/martynka-expansion-v1` i wyjście `public/assets/rooms/salon/`; zadania bez
`-resize` (rozmiar źródła); deterministyczne, exit 1 na brak źródła. `designs/` tylko czytany, nigdy stage'owany.

**Contract**: wyjście `rooms/salon/{architecture-before,architecture-after,furnishings-before,shadows,<slot>-<variant>,lamp-table,plant-left,plant-right,pouf}.webp`.

#### 2. Tabela i ładowanie

**File**: `src/data/roomArt.ts` (nowy), `src/scenes/BootScene.ts`, `src/data/layout.ts`

**Intent**: `ROOM_ART` (id, key, url, width, height, label z `pl.ts`) dla 26 plików; klucze zgodne z `SALON`;
`BootScene.preload` ładuje je obok `TASK_ART`; `create` liczy `artHealth(ROOM_ART, …)` do nowego klucza rejestru.
Seam e2e: `?e2eArt=room` pomija kolejkowanie `ROOM_ART` (istniejący marker `e2eArt`).

**Contract**: `REGISTRY_KEYS.roomArtHealth` (runtime, poza `SAVE_KEYS`); `E2EArtSeam` += `'room'`.

#### 3. Sekcja „Obrazki”

**File**: `src/data/pl.ts`, `src/ui/dom/artHealthView.ts`, `src/scenes/UIScene.ts`, `src/testing/e2eHook.ts`

**Intent**: Druga linia o salonie (`pl.settings.roomArtOk` / `roomArtMissing(count, total)` cyframi), bez zmiany linii
zadań; hak e2e wystawia `roomArtHealth`.

#### 4. Testy

**File**: `tests/roomArt.test.ts` (nowy)

**Intent**: Jak `tests/taskArt.test.ts`: każdy wpis ma plik na dysku z nagłówkiem WebP i wymiarami z tabeli; każdy klucz
z `SALON` (sceny, warianty, dekoracja) jest w `ROOM_ART` i odwrotnie.

### Success Criteria:

#### Automated Verification:

- `tests/roomArt.test.ts` zielony (26 wpisów = 26 plików, klucze = klucze `SALON`)
- `npm run art` drugi raz → `git status --porcelain public/assets` pusty (determinizm)
- `du -cb public/assets/rooms/salon/*.webp` ≤ 1 400 000 B; po `npm run build` `dist/sw.js` wymienia wszystkie 26 plików `rooms/salon/`
- `git status --porcelain designs/` pusty i nic spod `designs/` nie jest w indeksie
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build z `e2e hook: absent`, e2e (baseline, bez spadków)
- Celowe złamanie: usunięty jeden plik `rooms/salon/sofa-morska.webp` → `tests/roomArt.test.ts` czerwony; przywrócony; meta-check: zmiana `width` w tabeli bez zmiany pliku też czerwieni (test czyta nagłówek, nie tylko istnienie)

#### Manual Verification:

- [visual] Sekcja „Obrazki” w panelu rodzica (1440 i 1024): obie linie przy pełnej grafice i przy `?e2eArt=room` w buildzie haka

---

## Phase 5: Pokój rysowany z grafiki

Driver: impl
Driver why: warstwy obrazów, głębokości i fallback braku tekstury żyją tylko na płótnie; logika trafiania z fazy 3 — dowód w zrzutach i e2e fazy 10.

### Overview

`RoomView` składa scenę z obrazów: przed etapem `architecture-before` + `furnishings-before`; po etapie
`architecture-after` + dekoracja + kupione meble (każdy osobny `Image` na `setDepth(z)`, origin w `anchor`);
`shadows` dopiero po ukończeniu pokoju (decyzja 2). Brak tekstury → zastępnik z fazy 3. Scena wstrzykuje `alphaAt`
z `textures.getPixelAlpha`. Bez podpisów nad meblami (V1/V3 zamknięte).

### Changes Required:

#### 1. Widok pokoju

**File**: `src/ui/widgets/RoomView.ts`, nowy `src/ui/widgets/RoomLayer.ts`

**Intent**: `RoomLayer` = jeden obraz warstwy/slotu z fallbackiem (pudełko z podpisem z `ROOM_ART.label`) jak
`ArtImage`; `RoomView` trzyma po jednym `RoomLayer` na warstwę i slot, `render(state, preview)` przełącza teksturę
wariantu i widoczność; obrys przytrzymania i trybu zmiany z `slotBox` (`visibleRect`).

**Contract**: `RoomLayer.show(key, box, depth, anchor)` / `hide()`; `RoomView.objectOf(slotId)` dla animacji fazy 7.

#### 2. Scena

**File**: `src/scenes/RoomScene.ts`

**Intent**: Pełnoekranowa scena 1920×1080 pod kontrolkami (decyzja 3); `alphaAt` przez `this.textures.getPixelAlpha`
na teksturze wybranego wariantu (null przy braku); `ROOM_LAYOUT.area`/`wallBottom` tylko dla zastępnika tła.

### Success Criteria:

#### Automated Verification:

- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline + spec'e salonu z fazy 3, bez spadków)
- Celowe złamanie: `RoomView` ignoruje `stageDone` (zawsze `architecture-before`) → e2e `room-purchase` sprawdzające `snapshot.stageDone` i trafienie sofy po etapie nadal przechodzi, więc złamanie widać tylko w zrzucie — meta-check zapisany w handoffie: ten stan dowodzi wyłącznie gate wizualny ([visual] 5.3)

#### Manual Verification:

- [visual] Zrzuty 1440 i 1024 (płótno 1920×1080 w FIT): salon przed etapem; po etapie bez mebli; każdy z 6 slotów pusty i umeblowany (wariant 0); pokój pełny z cieniami; obrys przytrzymania na sofie i dywanie; `?e2eArt=room` (zastępniki)
- [visual] Brak podpisów i placeholderów na pełnej grafice; dywan pod fotelem i stolikiem, sofa przed obrazkami (kolejność `z`)

---

## Phase 6: Panel wariantów i karta „Pokój gotowy!” z grafiki

Driver: impl
Driver why: miniatury z przeskalowanych obrazów, nazwy wariantów i miniatura salonu na karcie to tylko rendering dwóch istniejących widżetów — dowód w zrzutach i e2e.

### Overview

`VariantPanel` pokazuje trzy przeskalowane obrazy wariantu (dopasowane do `thumbs.size`, bez `minAspect`) z nazwą
wariantu pod spodem (NFR „nic tylko kolorem”, kit); `RoomDoneCard` składa miniaturę salonu ze skalowanych warstw
(`thumbScale`); liczby inline karty (ptaszek, kłódka) do `ROOM_DONE_LAYOUT.tiles` (F6).

### Changes Required:

#### 1. Panel

**File**: `src/ui/widgets/VariantPanel.ts`, `src/data/layout.ts`

**Intent**: Miniatura = obraz wariantu (`RoomLayer` w skali) albo zastępnik; podpis z `pl.room.variants[slot][i]`.

**Contract**: `ROOM_LAYOUT.thumbs` zyskuje `labelY`, traci `minAspect`; cele `thumbTargets` bez zmian.

#### 2. Karta

**File**: `src/ui/widgets/RoomDoneCard.ts`, `src/ui/widgets/RoomView.ts` (`drawRoomMiniature` → złożenie obrazów)

**Intent**: Miniatura z tych samych warstw co pokój w skali; brak tekstury → zastępnik; DESIGN-GAP P2.3.

### Success Criteria:

#### Automated Verification:

- `rg -n "minAspect" src` pusty; liczby ptaszka/kłódki tylko w `src/data/layout.ts`
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków)
- Celowe złamanie: `thumbTargets` liczone ze starej geometrii (przesunięte o `labelY`) → e2e `room-change` czerwony; przywrócone; meta-check: e2e dowodzi trafiania miniatur, wygląd potwierdza [visual]

#### Manual Verification:

- [visual] Zrzuty 1440 i 1024: panel wariantów dla każdego z 6 slotów z podglądem wariantu 1 (nazwy wariantów czytelne, mebel z podglądu widoczny ponad tacką albo zakrycie odnotowane), panel w trybie zmiany, karta „Pokój gotowy!” z miniaturą i kafelkiem „Wkrótce”

---

## Phase 7: Animacje salonu i „ogranicz ruch”

Driver: impl
Driver why: przenikanie tła, pop obiektu na jego głębokości i cząsteczki to tweeny Phasera — dowód w zrzutach/nagraniu i e2e z czasami zależnymi od `prefersReducedMotion`.

### Overview

Zakup etapu: przenikanie `before` → `after` (`ANIMATION.stageFadeMs`) i wejście dekoracji; zakup mebla: pop obrazu
slotu wokół `anchor` na jego `z` (V2) i cząsteczki ze środka `visibleRect`; wszystko pominięte przy
`prefersReducedMotion()`. `TaskScene.shake` też za tym warunkiem.

### Changes Required:

#### 1. Pokój

**File**: `src/scenes/RoomScene.ts`, `src/data/layout.ts`

**Intent**: `celebrate` dostaje gałąź etapu; pop przez `RoomView.objectOf(slot)`; opóźnienie karty liczone z dłuższej
z animacji. Seam dźwięku bez zmian (S-16b).

**Contract**: `ANIMATION.stageFadeMs`; DESIGN-GAP P3.6 (brak teł pośrednich).

#### 2. Ekran zadań

**File**: `src/scenes/TaskScene.ts`

**Intent**: `shake` nie rusza kamery przy `prefersReducedMotion()` (NFR).

### Success Criteria:

#### Automated Verification:

- `rg -n "shake" src/scenes/TaskScene.ts` pokazuje strażnika `prefersReducedMotion`
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków; Playwright emuluje `reducedMotion` tak jak dziś)
- Celowe złamanie: karta „Pokój gotowy!” pokazywana przed końcem popu przy pełnym ruchu (opóźnienie 0) → e2e `room-change` (podwójne stuknięcie w ostatnie „Wybieram” nie zamyka karty) czerwony albo zielony — wynik zapisany; meta-check: jeśli zielony, ochronę daje układ `ROOM_DONE_LAYOUT.button`, nie opóźnienie

#### Manual Verification:

- [visual] Klatki 1440: przenikanie tła w połowie, pop sofy (dywan pod sofą nie skacze), cząsteczki; ten sam zakup z „ogranicz ruch” bez animacji

---

## Phase 8: Ekran ładowania i książka na karcie odblokowania

Driver: impl
Driver why: ekran rysowany kodem w `BootScene.preload` z paskiem z `load.on('progress')` i ikona na karcie to rendering — dowód w zrzucie i seedzie e2e (gra startuje), nie w failing teście.

### Overview

Nowy widżet `LoadingScreen` (tło `PAGE_BACKGROUND`, tytuł „Martynka urządza”, pasek postępu) rysowany w
`BootScene.preload` po kolejkowaniu fontu; znika w `create`. `UnlockCard.drawBook` zastąpiony ikoną `tasks/icons/book`
przez `ArtImage` (DESIGN-GAP 22 zawężony; P2.6 briefu zostaje).

### Changes Required:

#### 1. Ekran ładowania

**File**: `src/ui/widgets/LoadingScreen.ts` (nowy), `src/scenes/BootScene.ts`, `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: Pasek 0–1 z `progress`; tekst z `pl.loading.title` (marka) w foncie zastępczym, dopóki font się nie wczyta;
DESIGN-GAP → brief P2.2.

**Contract**: `LOADING_LAYOUT` w `layout.ts`; `pl.loading = { title }`.

#### 2. Karta odblokowania

**File**: `src/ui/widgets/UnlockCard.ts`

**Intent**: Książka z istniejącej ikony (`ArtImage`), zastępnik przy braku.

### Success Criteria:

#### Automated Verification:

- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (seed #8 i wszystkie spec'e, baseline, bez spadków)
- Celowe złamanie: `LoadingScreen` niszczony w `preload` zamiast w `create` z wyjątkiem w callbacku `progress` → seed/first-launch czerwone (granica błędów); przywrócone; meta-check: dowodzi, że ekran nie może zablokować startu, nie jego wyglądu

#### Manual Verification:

- [visual] Ekran ładowania 1440 i 1024 (throttling sieci w DevTools albo zrzut w trakcie `preload`), karta „Nowa umiejętność!” z książką

---

## Phase 9: Dokumentacja, luki projektu, follow-upy

Driver: impl
Driver why: ostatnia faza `impl` — seam sweep zmiany, wiersze design-gaps, triggery follow-upów i zdanie w `CLAUDE.md`; nic do prowadzenia failing testem.

### Overview

Seam sweep (żadnych liczb ani tekstów w scenach, markery e2e w strażniku), `docs/design-gaps.md` wiersze 105+ i
zamknięcia, `follow-ups/review-fixes.md` z triggerami dla wszystkiego poza zakresem, `CLAUDE.md` „Current state”,
`docs/art-inventory.md` (zmierzona waga).

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: Nowe wiersze: ekran ładowania (P2.2), pusty slot i warstwy przed/cienie (całe, nie per slot), miniatura
salonu (P2.3), przejście przed → po bez teł pośrednich (P3.6), nazwy czynności meblowych (nasze), zastępnik grafiki
salonu; zamknięcie/zawężenie 22, 32, 33, 34, 35 (35 → S-16b).

#### 2. Follow-upy i dokumenty

**File**: `context/changes/final-art-salon/follow-ups/review-fixes.md` (nowy), `CLAUDE.md`, `docs/art-inventory.md`

**Intent**: Każdy follow-up `Trigger: S-16` spoza zakresu z nowym `Trigger:` (atlas, termometr, podświetlenie,
lektor/„minus”, O3, ` = ?`, SPATIAL, portfel, zero, `audio.noAudio` → S-16b) i ryzyko rollbacku deployu po przeliczeniu.

### Success Criteria:

#### Automated Verification:

- `rg -n "Trigger:" context/changes/final-art-salon/follow-ups/review-fixes.md` ≥ 10 wierszy; każdy follow-up z listy wiersza S-16a w roadmapie ma wpis
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków)
- Celowe złamanie: tekst gracza wpisany literałem w `RoomScene` → `npm run lint` czerwony (reguła granic); przywrócone; meta-check: reguła łapie literał w scenie, nie w `data/`

---

## Phase 10: Remont salonu dotykiem — e2e (#16, #2)

Driver: e2e
Driver why: ryzyko #16 (zakup wydaje raz, dopiero po „Wybieram”, nigdy poniżej zera) dla nowego etapu jednym stuknięciem i ryzyko #2/#10 (postęp po aktualizacji) dla przeliczenia starego salonu istnieją tylko w przeglądarce; zbudowane w fazach 1–8, `E2E=on`.

### Overview

Nowy spec `tests/e2e/salon-art.spec.ts` (protokół pliku-żądania: spec + łatki `git apply` złamań w katalogu zmiany;
orkiestrator uruchamia), wzorzec `tests/e2e/room-purchase.spec.ts`; gwiazdki przez `?e2eStars`, rundy nie są grane.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-art.spec.ts`, `context/changes/final-art-salon/e2e/*.patch`

**Intent**: (a) #16: etap kupiony jednym stuknięciem wydaje 5 raz; podwójne stuknięcie otwiera panel sofy bez wydatku;
sofa kosztuje dopiero po „Wybieram”; z 4 gwiazdkami etap nie kupuje. (b) #2: `?e2eSave=legacy-salon` → pokój
`tasksDone` 4 (etap, sofa, dywan, stolik), `chosen.sofa` 2, gwiazdki bez zmian; po przeładowaniu to samo (zapisane).
(c) `?e2eArt=room`: etap i sofa do kupienia, panel otwiera się, `roomArtHealth` missing 26.

**Contract**: tytuły z id ryzyka (`#16`, `#2`); stringi przycisków z `pl.ts`.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/salon-art.spec.ts --workers=4` zielony (uruchamia orkiestrator)
- Złamania z łatek, każde test osobno (`-g`): (1) `stepPanel` kupuje etap dwa razy na podwójne stuknięcie → test #16 czerwony; (2) `remapLegacySalon` niewołany w `main.ts` → test #2 czerwony; (3) `RoomLayer` rzuca przy braku tekstury → test `?e2eArt=room` czerwony; wszystkie przywrócone
- Pełna bramka lokalna: lint, typecheck, unit (baseline + Δ), build, e2e (baseline + nowe testy speca)

#### Manual Verification:

- [human] Tablet (iPad, instalacja PWA): pełny remont salonu, płynność przy ≈ 59 MB tekstur, ekran ładowania przy pierwszym uruchomieniu offline

---

## Testing Strategy

### Unit Tests:

- Etap: zakup raz, bez `chosen`, `short`, drugi `open` → panel następnej czynności (faza 1).
- Przeliczenie: każde stare `tasksDone` 0–10, idempotencja (`toBe`), fixture'y bez zmian, inne pokoje nietknięte (faza 2).
- Trafianie: `z`, alfa, `holdPoint` w każdym meblu; dane: 7 czynności, koszty, geometria w płótnie; słowa minigry (faza 3).
- Tabela grafiki = pliki na dysku z nagłówkami WebP (faza 4).

### Integration Tests:

- e2e: `room-purchase`, `room-change`, `save-restart` przepisane (faza 3); `salon-art.spec.ts` (faza 10).

### Manual Testing Steps:

1. Świeży kontekst w buildzie haka z `?e2eStars=80`: ekran ładowania, salon zniszczony, etap → przenikanie, 6 mebli z
   panelem, „Pokój gotowy!”, przytrzymanie sofy → zmiana wariantu.
2. To samo z „ogranicz ruch” w systemie: bez animacji, karta od razu.
3. `?e2eSave=legacy-salon`: pokój przeliczony, wariant sofy zachowany.
4. `?e2eArt=room`: zastępniki, wszystko grywalne, „Obrazki” w panelu rodzica.

## Performance Considerations

Precache rośnie o ≈ 1,23 MB (WebP pełna rozdzielczość) do ≈ 3,7 MB; GPU ≈ 59 MB przy wszystkich teksturach
rezydentnych (bez zmian ładowania: wszystko w `BootScene`). `getPixelAlpha` tylko na `down`. Gdyby tablet krztusił się
pamięcią — przycięcie `shadows` do bboxa (−4,4 MB) albo połowa rozdzielczości (re-trigger w follow-upach).

## Migration Notes

Format zapisu zostaje v2. `remapLegacySalon` przy każdym wczytaniu i w podglądzie importu; stan zapisuje się na dysk
przy następnej zmianie. Ryzyko rollbacku: starszy build czytający przeliczony zapis zobaczy `tasksDone ≤ 7` pozycyjnie
w starej liście (np. 2 → podłoga i ściany) i nieznane klucze `chosen` — nic nie ginie, pokój wygląda inaczej; rollback
tylko ręczny (profil § 5), opisany w follow-upach.

## Autonomous decisions

1. **Reguła przeliczenia: B (zaokrąglenie w górę, bez zwrotu).** Wybrane: nowy `tasksDone` = najkrótszy nowy prefiks o
   koszcie ≥ wydanym w starym (max 7), warianty przeniesione po mapie nazw, gwiazdki nietknięte. Odrzucone: A
   z `change.md` (najdłuższy prefiks ≤ wydanym + zwrot reszty gwiazdkami). Dlaczego: reguła maintainera „nic, co
   dziecko kupiło, nie ginie po cichu; gwiazdek nigdy się nie zabiera” — B nie zabiera ani wartości, ani gwiazdek,
   zachowuje niezmiennik `src/core/stars.ts` (saldo rośnie tylko z rund), a przy krzywej 5…15 każdy stary mebel trafia
   do nowego prefiksu (sprawdzone dla k = 0…10: 1→1, 2→2, 3→3, 4→4, 5→5, 6→6, 7→6, 8→7, 9→7, 10→7); dar ≤ 1
   czynność. A wymagałby wyjątku od reguły gwiazdek i komunikatu o zwrocie, którego nie ma w kicie. Wbrew dosłownemu
   `change.md` decyzji 3 → wiersz `[human]` 2.5. Zmieniłoby: maintainer woli dokładną wartość ze zwrotem, albo nowa
   krzywa kosztów, przy której zaokrąglenie w górę dawałoby więcej niż jedną czynność.
2. **Puste sloty i warstwy „przed”.** Wybrane: przed etapem `architecture-before` + `furnishings-before` (cały zniszczony
   pokój); po etapie `architecture-after` + dekoracja + tylko kupione meble; puste sloty niczego nie rysują; `shadows`
   dopiero przy ukończonym pokoju. Odrzucone: zniszczone meble per slot (warstwa nie da się pociąć), cienie od etapu
   (cienie nieistniejących mebli), obrys pustego slotu (placeholder). Zmieniłoby: grafik dostarczy warstwy per slot (brief).
3. **Scena pełnoekranowa jak w kicie**, kontrolki nad nią, tacka panelu bez zmian (S-09). Odrzucone: skalowanie do
   `ROOM_LAYOUT.area` (mniejsze meble, puste pasy). Zmieniłoby: gate wizualny pokaże mebel z podglądu zakryty w > 50 %.
4. **Pełna rozdzielczość WebP q85** (≈ 1,23 MB). Odrzucone: połowa (0,48 MB) — scena rysowana 1:1, iPad retina ≈ 2048 px.
   Zmieniłoby: budżet precache/pamięci od maintainera albo brak różnicy na zrzucie.
5. **Trafianie `visibleRect` + `z` + wstrzyknięta alfa**, prostokąt przy braku tekstury. Odrzucone: sam prostokąt (dywan
   zjada fotel), `input.makePixelPerfect` (logika poza `core`). Zmieniłoby: koszt `getPixelAlpha` na tablecie.
6. **Koszty 5, 7, 9, 10, 12, 13, 15 (suma 71 ≈ 10 czystych rund po 7 gwiazdek; stara suma 96 ≈ 14).** Kolejność mebli jak
   w starej liście (sofa, dywan, stolik, komoda/półka, fotel, obrazki), żeby przeliczenie zachowało każdy stary mebel.
   S-17 stroi. Zmieniłoby: koszty od maintainera (wtedy test przeliczenia sprawdza warunek „każdy stary mebel w prefiksie”).
7. **Słowa minigry = 6 nowych podpisów; asercja Ó/Ł zastąpiona.** Żaden nowy podpis nie ma Ó/Ł; obsługę polskich liter
   dalej dowodzi `revealed('PÓŁKA')`. Odrzucone: podpisy dekoracji tylko dla słów, sztuczny podpis z Ł. Zmieniłoby:
   slot P3 z Ó/Ł (np. „półka”) — wtedy wraca do listy.
8. **Etap kupowany jednym stuknięciem bez potwierdzenia** (FR-016: stuknięcie w przycisk). Drugie stuknięcie otwiera
   tylko panel sofy (nie wydaje). Zmieniłoby: test z dzieckiem pokazujący przypadkowe zakupy etapu.
9. **Nazwy wariantów pod miniaturami** (kit; NFR „nic tylko kolorem”). Zmieniłoby: brak miejsca w gate wizualnym.
10. **Follow-upy w zakresie:** grafika mebli, podpisy V1/V3 (znikają), trafianie/obrys, miniatura salonu, F4, F6, V2,
    książka (22), strażnik `TaskScene.shake`. Poza: atlas, termometr, podświetlenie, lektor/„minus”, O3, ` = ?`, SPATIAL,
    portfel, zero, `audio.noAudio` — re-trigger w fazie 9. Zmieniłoby: wolny budżet po fazie 9.
11. **Fazy:** 10, każda z ≤ 2 komponentami UI (nowe: `RoomLayer` f5, `LoadingScreen` f8). Zastępniki w fazie 3, żeby
    przełączenie danych było zielone bez grafiki.

## References

- Research: `context/changes/final-art-salon/research.md`
- Tożsamość i roszczenia: `context/changes/final-art-salon/change.md`
- Wzór formatu: `context/archive/2026-10-15-e1-shapes-picture-mode/plan.md`
- Naprawa przy wczytaniu: `src/core/rooms.ts` `repairCurrentRoom`; rura grafiki: `scripts/make-task-art.mjs`, `src/data/taskArt.ts`, `tests/taskArt.test.ts`
- Kit: `designs/martynka-expansion-v1/manifest.json` (tylko do odczytu), `docs/designer-brief-s16.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Etap tła w modelu pokoju

#### Automated

- [ ] 1.1 Nowe testy etapu w `tests/rooms.test.ts` i `tests/variantPanel.test.ts` czerwone przed implementacją, zielone po
- [ ] 1.2 Bramka lokalna zielona: `npm run lint`, `npm run typecheck`, unit (baseline + Δ nowych testów, bez spadków), `npm run build`, e2e (baseline, bez spadków)
- [ ] 1.3 Celowe złamanie: `stepPanel` dla etapu nie sprawdza `stars >= cost` → test „za mało gwiazdek” czerwony; przywrócone; meta-check

### Phase 2: Przeliczenie starego salonu przy wczytaniu

#### Automated

- [ ] 2.1 `tests/salonRemap.test.ts` czerwony przed implementacją, zielony po (wszystkie stare `tasksDone` 0–10, idempotencja, fixture'y)
- [ ] 2.2 `git diff --exit-code tests/fixtures/` czysty (fixture'y bajt w bajt)
- [ ] 2.3 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build z `e2e hook: absent`, e2e (baseline, bez spadków)
- [ ] 2.4 Celowe złamanie: zaokrąglenie w dół → test „prefiks ≥ wydanego” czerwony; przywrócone; meta-check idempotencji

#### Manual

- [ ] 2.5 [human] Reguła przeliczenia B (zaokrąglenie w górę, bez zwrotu gwiazdek) zamiast reguły A z `change.md` (zwrot gwiazdek) — maintainer akceptuje albo zleca A (decyzja 1)

### Phase 3: Nowy salon w danych, geometria z manifestu i trafianie

#### Automated

- [ ] 3.1 Nowe testy trafiania w `tests/roomHit.test.ts` czerwone przed implementacją, zielone po
- [ ] 3.2 `tests/roomsData.test.ts`, `tests/wordRound.test.ts` przepisane i zielone
- [ ] 3.3 `rg -n "SALON_PLACEHOLDERS|captionAnchor|drawLook" src tests` pusty
- [ ] 3.4 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e z przepisanymi `room-purchase`, `room-change`, `save-restart` (baseline, bez spadków)
- [ ] 3.5 Celowe złamanie: `slotAt` ignoruje predykat alfy → test „róg dywanu nad fotelem” czerwony; przywrócone; meta-check

### Phase 4: Grafika salonu w WebP, ładowanie i zdrowie obrazków

#### Automated

- [ ] 4.1 `tests/roomArt.test.ts` zielony (26 wpisów = 26 plików, klucze = klucze `SALON`)
- [ ] 4.2 `npm run art` drugi raz → `git status --porcelain public/assets` pusty (determinizm)
- [ ] 4.3 `du -cb public/assets/rooms/salon/*.webp` ≤ 1 400 000 B; po `npm run build` `dist/sw.js` wymienia wszystkie 26 plików `rooms/salon/`
- [ ] 4.4 `git status --porcelain designs/` pusty i nic spod `designs/` nie jest w indeksie
- [ ] 4.5 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build z `e2e hook: absent`, e2e (baseline, bez spadków)
- [ ] 4.6 Celowe złamanie: usunięty `rooms/salon/sofa-morska.webp` → `tests/roomArt.test.ts` czerwony; przywrócony; meta-check

#### Manual

- [ ] 4.7 [visual] Sekcja „Obrazki” w panelu rodzica (1440 i 1024): obie linie przy pełnej grafice i przy `?e2eArt=room` w buildzie haka

### Phase 5: Pokój rysowany z grafiki

#### Automated

- [ ] 5.1 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline + spec'e salonu z fazy 3, bez spadków)
- [ ] 5.2 Celowe złamanie: `RoomView` ignoruje `stageDone` → wynik e2e zapisany; meta-check: stan dowodzi tylko gate wizualny

#### Manual

- [ ] 5.3 [visual] Zrzuty 1440 i 1024 (płótno 1920×1080 w FIT): salon przed etapem; po etapie bez mebli; każdy z 6 slotów pusty i umeblowany (wariant 0); pokój pełny z cieniami; obrys przytrzymania na sofie i dywanie; `?e2eArt=room` (zastępniki)
- [ ] 5.4 [visual] Brak podpisów i placeholderów na pełnej grafice; dywan pod fotelem i stolikiem, sofa przed obrazkami (kolejność `z`)

### Phase 6: Panel wariantów i karta „Pokój gotowy!” z grafiki

#### Automated

- [ ] 6.1 `rg -n "minAspect" src` pusty; liczby ptaszka/kłódki tylko w `src/data/layout.ts`
- [ ] 6.2 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków)
- [ ] 6.3 Celowe złamanie: `thumbTargets` ze starej geometrii → e2e `room-change` czerwony; przywrócone; meta-check

#### Manual

- [ ] 6.4 [visual] Zrzuty 1440 i 1024: panel wariantów dla każdego z 6 slotów z podglądem wariantu 1, panel w trybie zmiany, karta „Pokój gotowy!” z miniaturą i kafelkiem „Wkrótce”

### Phase 7: Animacje salonu i „ogranicz ruch”

#### Automated

- [ ] 7.1 `rg -n "shake" src/scenes/TaskScene.ts` pokazuje strażnika `prefersReducedMotion`
- [ ] 7.2 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków)
- [ ] 7.3 Celowe złamanie: karta „Pokój gotowy!” przed końcem popu → wynik e2e zapisany; meta-check

#### Manual

- [ ] 7.4 [visual] Klatki 1440: przenikanie tła w połowie, pop sofy (dywan pod sofą nie skacze), cząsteczki; ten sam zakup z „ogranicz ruch” bez animacji

### Phase 8: Ekran ładowania i książka na karcie odblokowania

#### Automated

- [ ] 8.1 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (seed #8 i wszystkie spec'e, baseline, bez spadków)
- [ ] 8.2 Celowe złamanie: wyjątek w callbacku `progress` → seed/first-launch czerwone; przywrócone; meta-check

#### Manual

- [ ] 8.3 [visual] Ekran ładowania 1440 i 1024, karta „Nowa umiejętność!” z książką

### Phase 9: Dokumentacja, luki projektu, follow-upy

#### Automated

- [ ] 9.1 `rg -n "Trigger:" context/changes/final-art-salon/follow-ups/review-fixes.md` ≥ 10 wierszy; każdy follow-up z wiersza S-16a w roadmapie ma wpis
- [ ] 9.2 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- [ ] 9.3 Bramka lokalna zielona: lint, typecheck, unit (baseline + Δ), build, e2e (baseline, bez spadków)
- [ ] 9.4 Celowe złamanie: tekst gracza literałem w `RoomScene` → `npm run lint` czerwony; przywrócone; meta-check

### Phase 10: Remont salonu dotykiem — e2e (#16, #2)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/salon-art.spec.ts --workers=4` zielony (uruchamia orkiestrator)
- [ ] 10.2 Złamania z łatek, każdy test osobno (`-g`): podwójny zakup etapu, brak `remapLegacySalon` w `main.ts`, `RoomLayer` rzuca przy braku tekstury → czerwone; przywrócone
- [ ] 10.3 Pełna bramka lokalna: lint, typecheck, unit (baseline + Δ), build, e2e (baseline + nowe testy speca)

#### Manual

- [ ] 10.4 [human] Tablet (iPad, instalacja PWA): pełny remont salonu, płynność przy ≈ 59 MB tekstur, ekran ładowania przy pierwszym uruchomieniu offline
