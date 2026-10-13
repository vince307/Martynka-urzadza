# Pierwszy mebel za gwiazdki: salon, zadanie remontowe i wybór 1 z 3 wariantów — Implementation Plan

## Overview

Roadmapa S-09 (`first-furniture-purchase`, M4, gwiazda przewodnia; PRD FR-016, FR-017, US-02, Success Criteria
„pierwszy pokój”). Pusty pokój z S-05 staje się **salonem** rysowanym w kodzie: tło (ściany, podłoga) i 10 slotów
(placeholdery: kształt, wzór, podpis). Na dole stoi **przycisk bieżącego zadania remontowego** z danych pokoju
(„Napraw podłogę” + gwiazdka + koszt). Gdy gwiazdek brakuje, przycisk jest wyszarzony, pokazuje „masz X/Y” i stuknięcie
prowadzi do zadań (ta sama droga co „Wróć do notesu”). Gdy gwiazdek wystarcza, otwiera się **panel 3 wariantów**
(miniatury, „Wybieram”, „Zamknij”); stuknięcie miniatury pokazuje wariant w slocie pokoju (podgląd), a **dopiero
„Wybieram” odejmuje koszt** — dokładnie raz — i zatwierdza wybór krótką animacją (skala + cząsteczki, wyłączone przy
„ogranicz ruch”). Po ostatnim, dziesiątym zadaniu przycisk znika („Pokój gotowy!” to S-10).

Pod spodem: **jedno saldo gwiazdek** w rejestrze gry (dziś `TaskScene.sessionStars` jest prywatnym właścicielem), stan
pokoju w rejestrze w kształcie `SaveState.rooms`/`currentRoom` (S-11 zapisze go bez migracji), czysta logika zakupu i
panelu w `src/core/` z testami własnościowymi ryzyka #16, dane salonu w `src/data/rooms.ts`. Do S-11 wszystko żyje w sesji.

## Current State Analysis

Z `context/changes/first-furniture-purchase/research.md` (commit `1acc0b2`) i odczytu kodu w tym kroku
(`feat/first-furniture-purchase` @ `1acc0b2`):

- `src/scenes/RoomScene.ts` `RoomScene`: turkusowy panel (`ROOM_LAYOUT.panel`), napis `pl.room.caption` „Tu powstanie
  pokój” (`ROOM_LAYOUT.caption`), „Wróć do notesu” (`PageButton`, `ROOM_LAYOUT.resume`, re-arm na `wake`),
  `resumeTarget()` dla haka. DESIGN-GAP wiersz 12.
- `src/scenes/TaskScene.ts`: `sessionStars` + `state.starsEarned` = saldo; zapis do `REGISTRY_KEYS.stars` w `create` (0),
  `syncStars`, `applyParentStage`; `beginRound` przenosi `starsEarned` do `sessionStars`. `currentSummary` podaje
  `nextRoomTaskCost: null` (FR-010 martwe, wiersz 10). `flyStar` bez referencji do gwiazdy i bez „ogranicz ruch”.
  Handler `toRoom` w `create` → `scene.switch(room)`; `onWake` → `render()`.
- `src/core/round.ts`: `starsEarned` rośnie tylko przy zapłaconej odpowiedzi i bonusie końca rundy; obie ścieżki w scenie
  idą przez `syncStars(before, …)`.
- `src/core/types.ts`: `SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState`, `SaveState` istnieją, nieużywane. Brak
  `src/core/rooms.ts`, `src/data/rooms.ts`.
- `src/scenes/UIScene.ts`: licznik słucha `changedata-stars` (spadek przy zakupie działa bez zmian); w pokoju widoczna
  tylko zębatka (`roomSwitch=false`, `narration=null`); głośnik pokazuje się przy niepustym `REGISTRY_KEYS.narration`.
  Dialog ustawień trzyma `openInputSession` — wyłącza całe wejście gry, więc panel w canvasie jest pod nim bezpieczny.
- `src/testing/e2eHook.ts` `installE2EHook`: `inRoom()`, `targets.resume`, cele podsumowania `null` w pokoju;
  `snapshot.starsTotal` z `TaskScene.snapshot()`. `tests/e2e/task-round.spec.ts` i `parent-settings.spec.ts` czytają
  `starsTotal`.
- `src/data/layout.ts`: `PLACEHOLDER_COLORS` bez oak/terracotta/pale leaf; `ANIMATION` tylko potrząśnięcie i lot gwiazdki;
  `HUD_LAYOUT.settings` 1782–1878 × 952–1048; `TASK_TOUCH_TARGETS.resume`.
- Brak dźwięku w repo (żadnych plików, `this.sound`); kit „audio is not included”.
- `context/foundation/lessons.md` nie istnieje — brak lekcji do zastosowania.

## Desired End State

- Zimny start → 0 gwiazdek, pusty salon. Runda zadań dodaje gwiazdki do jednego salda w rejestrze; licznik HUD, podsumowanie
  i hak czytają to samo saldo. „Do pokoju” w podsumowaniu jest wyróżnione, gdy saldo ≥ koszt bieżącego zadania.
- W pokoju: tło + 10 slotów (pusty slot = obrys przerywany z podpisem; urządzony = kształt z kolorem, wzorem i podpisem),
  „Wróć do notesu”, przycisk bieżącego zadania. Za mało gwiazdek → wyszarzony z „masz X/Y”, stuknięcie wraca do zadań.
  Dość → panel: 3 miniatury (różne kolorem **i** wzorem), „Wybieram” nieaktywne do pierwszego wyboru miniatury, „Zamknij”.
  Podgląd w slocie zmienia się z każdą miniaturą; „Zamknij” cofa podgląd i nic nie odejmuje; „Wybieram” odejmuje koszt
  raz, zapisuje wariant, zamyka panel, odpala animację (bez ruchu przy `prefers-reduced-motion: reduce`), pokazuje
  następne zadanie. Po 10. zadaniu przycisku nie ma. Głośnik HUD czyta etykietę bieżącego zadania.
- Weryfikacja: unit (logika zakupu, panelu, salda, dane salonu, układ), e2e `#16` przez dotyk w buildzie haka, zrzuty
  1440×900 i 1024×768, teacher read nowych napisów.

### Key Discoveries:

- `TaskScene` nigdy nie jest restartowany (`BootScene.create`, `WelcomeScene` → `scene.start(task)` raz) — przeniesienie
  inicjalizacji salda do `main.ts` `preBoot` nie zmienia zachowania (`research.md` § 1).
- Model „dopisz deltę `starsEarned - before`” w `syncStars` daje tę samą sumę co dziś; `beginRound` i
  `applyParentStage` przestają cokolwiek przenosić (saldo już zawiera zarobek rundy).
- `SummaryContext.starsTotal` już mówi „the caller decides which total it passes” (`src/core/round/summary.ts`).
- Phaser 4.2.1: `this.add.particles(x, y, texture, config)`, `ParticleEmitter.explode`, `Graphics.generateTexture`; brak API
  reduced-motion — `matchMedia` na krawędzi UI, wzorzec wstrzykiwania z `src/pwa/platform.ts`.
- Granice ESLint: `src/core` bez Phasera i `window`; `src/data/rooms.ts` importuje z `core` tylko typy, a paletę z
  `src/data/layout.ts`.

## What We're NOT Doing

- Przytrzymanie urządzonego slotu i darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi, „poprawki” (S-10).
- Zapis na urządzeniu, natychmiastowy zapis po zapłacie (S-11). Stan pokoju i saldo giną przy zimnym starcie.
- Dźwięk zatwierdzenia (brak plików; S-16) — punkt zaczepienia w kodzie, DESIGN-GAP, wiersz `[human]`.
- Docelowa grafika salonu (`room.png` z kitu to urządzony pokój; S-16), licznik `.return-note` z kitu (licznik HUD zostaje, wiersz 14).
- Wspólny przycisk HUD (follow-up `Trigger: S-09 or the next change to a HUD button`): żaden przycisk HUD się nie zmienia.
- Zamknięcie panelu stuknięciem poza panelem; wstępne zaznaczenie wariantu.
- Strojenie kosztów pod tempo gry (M8).

## Implementation Approach

Najpierw czysta logika i dane (fazy 1–3, test-first), potem jeden szew salda w istniejących scenach bez nowego UI
(faza 4, zachowanie niezmienione — dowodzą istniejące specy), potem UI w dwóch krokach po ≤ 2 nowe komponenty (faza 5:
widok salonu + przycisk zadania; faza 6: panel wariantów + animacja), seam sweep z lukami projektu (faza 7) i na końcu
e2e ryzyka #16 (faza 8). Każda faza zostawia grę grywalną: do fazy 5 pokój to stary placeholder, a saldo już jest wspólne.

## Critical Implementation Details

- **State sequencing (saldo).** `syncStars` liczy deltę z `before` przekazanego przez `submit`/`advance` i dopisuje ją
  przez `earn` do salda z rejestru; nic innego w `TaskScene` nie pisze `REGISTRY_KEYS.stars`. Zakup pisze saldo i stan
  pokoju w tej samej synchronicznej obsłudze stuknięcia „Wybieram”, po czym panel jest już `closed` — drugie stuknięcie
  trafia w stan zamknięty i jest no-opem (ryzyko #16). Nigdy nie licz salda w scenie: tylko wynik `core`.
- **Timing & lifecycle (gwiazdka w locie).** Tweeny śpiącej `TaskScene` stoją; gwiazdki w locie są kończone (zniszczone)
  w handlerze `toRoom` przed `scene.switch` — follow-up S-05. Licznik i tak ma już nową wartość.
- **`RoomScene` żyje od pierwszego `switch`** i przechodzi przez sleep/wake: na `wake` i na `changedata-stars` przelicza
  przycisk zadania (saldo mogło wzrosnąć), ustawia narrację i zostawia panel zamknięty (panel nigdy nie przeżywa wyjścia,
  bo przy otwartym panelu „Wróć do notesu” jest ukryte). Gettery haka wołane tylko pod `inRoom()`.
- **Ruch.** Jeden helper `prefersReducedMotion` w `src/ui/` (wstrzykiwany `matchMedia`); czytany w chwili animacji, nie
  raz na sesję.

## Phase 1: Saldo gwiazdek i logika zakupu w core

Driver: tdd
Driver why: `src/core/stars.ts` i `src/core/rooms.ts` nie istnieją; failing testy (delta ≥ 0, koszt bieżącego zadania, odmowa przy braku gwiazdek, saldo nigdy < 0, `tasksDone` +1 tylko przy zakupie) prowadzą implementację.

### Overview

Czyste funkcje salda i pokoju na fikcyjnym pokoju testowym (dane salonu w fazie 2). Bez sceny, bez rejestru.

### Changes Required:

#### 1. Saldo

**File**: `src/core/stars.ts` (nowy)

**Intent**: jedyna reguła wzrostu salda: zarobek z rundy dopisany jako różnica; ujemna lub niecałkowita delta nie zmienia
salda (gwiazdki nigdy nie znikają przez zadania).

**Contract**: `earn(balance: number, delta: number): number`.

#### 2. Pokój

**File**: `src/core/rooms.ts` (nowy)

**Intent**: `emptyRoomState()`; `currentTask(room, state)` = `room.tasks[state.tasksDone]` albo `null`;
`nextTaskCost(room, state)` = koszt bieżącego albo `null` (dla `summaryView`); `taskButtonView(room, state, stars)` =
`null` (brak zadania) albo `{ taskId, label, cost, affordable, have: min(stars, cost), need: cost }`;
`purchase(room, state, stars, variant)` = `{ ok: true, state, stars, bought: { taskId, slot, variant } }` albo
`{ ok: false, reason: 'no-task' | 'short' | 'bad-variant' }`. Zakup nie mutuje wejścia.

**Contract**: `purchase(room: RoomDef, state: RoomState, stars: number, variant: number): PurchaseResult`; wynik
`ok` ma `stars = stars - cost ≥ 0`, `state.tasksDone + 1`, `state.chosen[slot] = variant`. `have` w widoku jest
przycięte do `cost`, więc „masz X/Y” nigdy nie pokazuje X > Y (wyszarzony stan występuje tylko przy X < Y).

#### 3. Testy

**File**: `tests/stars.test.ts` (nowy), `tests/rooms.test.ts` (nowy)

**Intent**: `earn` (0 + 5, delta 0, delta ujemna, NaN); `currentTask`/`nextTaskCost` przed pierwszym, w środku, po ostatnim
(`null`); `taskButtonView` przy saldzie koszt − 1 / koszt / koszt + 1; `purchase` przy koszt − 1 (odmowa, wejście
nietknięte), koszt (saldo 0), wariant −1/3/1.5 (odmowa), po ostatnim (`no-task`), nie mutuje argumentów (zamrożone wejście).

### Success Criteria:

#### Automated Verification:

- `tests/stars.test.ts` i `tests/rooms.test.ts` czerwone przed implementacją (asercja na stubie, nie brak modułu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `purchase` porównuje `stars > cost` zamiast `>=` → test „saldo równe kosztowi kupuje do zera” czerwony; `earn` bez strażnika ujemnej delty → test delty ujemnej czerwony; przywrócone; meta-check: oczekiwania z FR-016/US-02 AC i ryzyka #16, nie z implementacji
- Pełna bramka lokalna zielona

---

## Phase 2: Dane salonu i napisy zadań remontowych

Driver: tdd
Driver why: `src/data/rooms.ts` nie istnieje; failing test niezmienników danych (każde zadanie ma jeden slot, koszty 5–15 niemalejąco, warianty różne wzorem, sloty w obszarze pokoju nad tacą panelu, napisy obecne) prowadzi treść.

### Overview

Salon jako dane autorskie: 10 slotów, 10 zadań w kolejności, koszty 5–15, 3 warianty każdego slotu z wyglądem
placeholdera. Napisy w `src/data/pl.ts`. Geometria pokoju i tacy panelu w `src/data/layout.ts` (potrzebna niezmiennikom).

### Changes Required:

#### 1. Paleta i geometria

**File**: `src/data/layout.ts`

**Intent**: do `PLACEHOLDER_COLORS` dochodzą `oak` `0xc99b66`, `terracotta` `0xc98460`, `paleLeaf` (wartość z
`designs/martynka-maths-A-v1/style-guide.md` „Palette and rendering”; brak w kicie → najbliższy istniejący `dotDone` z
komentarzem). `ROOM_LAYOUT` dostaje `area` (180–1740 × 204–860: tło i sloty), `wallBottom` (granica ściany i podłogi),
`tray` (taca panelu: left 300, top 780, width 1320, height 260 — kończy się na 1040, przed zębatką x 1782),
`taskButton` (left 900, top 880, width 720, height 128) i przesunięte `resume` (left 240, top 892, 480×116).
`caption` zostaje do fazy 5.

**Contract**: wartości to propozycja z `research.md` § 5; faza 5 może je dostroić, testy układu z fazy 5 są wiążące.

#### 2. Salon

**File**: `src/data/rooms.ts` (nowy)

**Intent**: `SALON: RoomDef` (`id: 'salon'`, `name: 'salon'` jako klucz napisu, `background: 'salon-neglected'`),
10 `SlotDef` (`floor`, `walls`, `curtains`, `sofa`, `rug`, `table`, `lamp`, `shelf`, `plant`, `picture`; `variants`
to przyszłe klucze ramek atlasu `'<slot>-a|b|c'` dla S-16), 10 `RoomTaskDef` w kolejności z kosztami
5, 6, 7, 8, 9, 10, 11, 12, 13, 15 (suma 96; jedna czysta runda = 7) i `label` jako klucz `pl.room.tasks`.
`SALON_PLACEHOLDERS: Record<slotId, { width; height; variants: [Look, Look, Look] }>` z `Look = { fill: keyof
PLACEHOLDER_COLORS; pattern: 'plain' | 'stripes' | 'dots' }` — każdy slot ma trzy różne wzory (plan §9: nic wyłącznie
kolorem). `floor` i `walls` to pasy tła (`area` poniżej/powyżej `wallBottom`). `ROOMS: Record<string, RoomDef>` i
`FIRST_ROOM = 'salon'`.

**Contract**: `x`, `y` to środek slotu w 1920×1080; `depth` rośnie od tła (floor 0, walls 1) do drobnych mebli.
Plik importuje z `core` tylko typy (reguła granic).

#### 3. Napisy

**File**: `src/data/pl.ts`

**Intent**: `pl.room.name` „Salon”; `pl.room.tasks` (10 etykiet w trybie rozkazującym z biernikiem: „Napraw podłogę”,
„Pomaluj ściany”, „Powieś zasłony”, „Wstaw kanapę”, „Połóż dywan”, „Postaw stolik”, „Postaw lampę”, „Powieś półkę”,
„Postaw kwiatek”, „Powieś obraz”); `pl.room.slots` (podpisy placeholderów w mianowniku: „podłoga”, „ściany”, „zasłony”,
„kanapa”, „dywan”, „stolik”, „lampa”, „półka”, „kwiatek”, „obraz”); `pl.room.short(have, need)` → `masz ${have}/${need}`
(same cyfry, bez rzeczownika — bez odmiany). DESIGN-GAP komentarz przy kluczach (wiersze w fazie 7).

#### 4. Testy

**File**: `tests/roomsData.test.ts` (nowy)

**Intent**: każdy `task.slot` istnieje, każdy slot ma dokładnie jedno zadanie; `tasks.length === slots.length === 10`;
koszty całkowite w 5–15, niemalejące, pierwszy ≤ jednej czystej rundy (`balance.round`); każdy slot ma wpis w
`SALON_PLACEHOLDERS` z 3 różnymi `pattern`; prostokąt slotu (środek ± pół rozmiaru) mieści się w `ROOM_LAYOUT.area`, a
meble (nie `floor`/`walls`) kończą się nad `ROOM_LAYOUT.tray.top` (podgląd widoczny nad otwartym panelem); każdy klucz
etykiety i podpisu istnieje w `pl.room` i nie jest pusty; `pl.room.short(3, 5) === 'masz 3/5'`.

### Success Criteria:

#### Automated Verification:

- `tests/roomsData.test.ts` czerwony przed danymi (stub `SALON` z jednym slotem → asercja liczności), zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: kanapa z `y` wewnątrz tacy → test „meble nad tacą” czerwony; dwa warianty z tym samym wzorem → test wzorów czerwony; przywrócone; meta-check: granice z `ROOM_LAYOUT`, nie z danych slotu
- `npm run lint` bez naruszeń granic (`src/data/rooms.ts` importuje z `core` tylko typy)
- Pełna bramka lokalna zielona (w tym `npm run sample -- E1..E6` bez zmian)

#### Manual Verification:

- [reviewer] Teacher read: 10 etykiet zadań (tryb rozkazujący, biernik), 10 podpisów slotów, „Salon”, „masz X/Y” — poprawna polszczyzna, krótko, zrozumiałe dla 7-latka

---

## Phase 3: Panel wariantów jako czysty reduktor (ryzyko #16)

Driver: tdd
Driver why: maszyna stanów panelu nie istnieje; failing testy (otwarcie bez gwiazdek nic nie robi, „Wybieram” bez podglądu nic nie robi, drugie „Wybieram” nie kupuje drugi raz) i test własnościowy na losowych sekwencjach prowadzą implementację.

### Overview

Reduktor panelu nad `purchase` z fazy 1: jedyna droga, którą scena wydaje gwiazdki.

### Changes Required:

#### 1. Reduktor

**File**: `src/core/variantPanel.ts` (nowy)

**Intent**: stan `closed` | `open(taskId, preview: 0|1|2|null)`; zdarzenia `open`, `pick(variant)`, `confirm`, `close`.
`open` tylko przy istniejącym i opłacalnym zadaniu (inaczej bez zmian — scena kieruje wtedy do zadań); `pick` tylko w
`open`, nadpisuje podgląd; `confirm` w `open` z podglądem → `purchase`; sukces zamyka panel i zwraca nowy stan pokoju,
saldo i `bought`; brak podglądu lub odmowa zakupu → bez zmian; `confirm` (i `pick`) przy `panel.taskId` różnym od
`currentTask(room, state)?.id` (panel nieaktualny: zadanie już kupione) → `closed` bez zakupu; `close` → `closed`, nic
nie odejmuje. Każde zdarzenie w `closed` poza `open` → bez zmian.

**Contract**: `stepPanel(panel: PanelState, event: PanelEvent, ctx: { room: RoomDef; state: RoomState; stars: number }): { panel: PanelState; state: RoomState; stars: number; bought: Bought | null }` — `state`/`stars` identyczne (`===`) z wejściem, gdy `bought === null`.

#### 2. Testy

**File**: `tests/variantPanel.test.ts` (nowy)

**Intent**: przypadki z Overview; `confirm` ×2 → jeden zakup; `open` przy saldzie koszt − 1 → `closed`, saldo bez zmian;
`pick` w `closed` ignorowany; po ostatnim zadaniu `open` ignorowany; `confirm` na nieaktualnym panelu (`open` z `taskId`
pierwszego zadania po jego zakupie, saldo wystarczające na drugie) → `closed`, saldo i `tasksDone` bez zmian. Własnościowy (seeded `src/core/rng.ts`, 20 ziaren × 200
zdarzeń, saldo startowe 0–120, losowe `earn` między zdarzeniami): saldo ≥ 0 zawsze; `start + zarobki − koniec = suma
kosztów kupionych zadań`; `tasksDone` rośnie o 1 dokładnie przy `bought !== null`; `bought` tylko po `confirm`;
niepowodzenie wypisuje ziarno.

### Success Criteria:

#### Automated Verification:

- `tests/variantPanel.test.ts` czerwony przed implementacją (stub zwracający wejście → asercja zakupu), zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `confirm` nie zamyka panelu → test „drugie Wybieram nie kupuje” i własność sumy kosztów czerwone; `open` bez sprawdzenia opłacalności + `purchase` bez `short` → własność „saldo ≥ 0” czerwona; przywrócone; meta-check: niezmienniki sformułowane wprost z ryzyka #16 (test-plan), nie z kodu
- Pełna bramka lokalna zielona

---

## Phase 4: Jedno saldo w rejestrze, koszt w podsumowaniu, gwiazdka w locie i „ogranicz ruch”

Driver: impl
Driver why: sklejka istniejących scen i `main.ts` wokół `earn`/`nextTaskCost` z faz 1–2, bez nowego komponentu UI; zachowanie dla dziecka bez zmian poza wyróżnieniem „Do pokoju” — dowodzą istniejące specy (`starsTotal`) i unit `summaryView`.

### Overview

`TaskScene` przestaje być właścicielem gwiazdek; stan pokoju w rejestrze; FR-010 ożywa; follow-up gwiazdki w locie;
lot gwiazdki szanuje `prefers-reduced-motion`.

### Changes Required:

#### 1. Rejestr

**File**: `src/data/layout.ts`, `src/main.ts`

**Intent**: komentarz `REGISTRY_KEYS.stars` → „the child's star balance, the one source: the task scene adds, a room
purchase subtracts”; nowe `rooms` (`Record<string, RoomState>`, kształt `SaveState.rooms`) i `currentRoom`. `preBoot`
ustawia `stars: 0`, `rooms: { [FIRST_ROOM]: emptyRoomState() }`, `currentRoom: FIRST_ROOM` (S-11 podmieni wartości z zapisu).

#### 2. TaskScene

**File**: `src/scenes/TaskScene.ts`

**Intent**: pole `sessionStars` znika; `create` nie zeruje `stars`; `syncStars(before, from)` dopisuje
`earn(saldo, state.starsEarned - before)`; `beginRound` i `applyParentStage` nie przenoszą zarobku (komentarz
`applyParentStage` „its stars stay on the counter” zostaje prawdziwy). `currentSummary` i `snapshot().starsTotal` czytają
saldo z rejestru; `nextRoomTaskCost` = `nextTaskCost(ROOMS[currentRoom], rooms[currentRoom])`. `flyStar` trzyma gwiazdy
w locie (lista lub grupa); handler `toRoom` niszczy je i zabija ich tweeny przed `scene.switch`. Przy
`prefersReducedMotion()` gwiazdka nie leci (licznik i tak ma nową wartość — kit `.flying-star` → `display:none`).

**Contract**: jedyny zapis `REGISTRY_KEYS.stars` w `TaskScene` to `syncStars`.

#### 3. Helper ruchu

**File**: `src/ui/motion.ts` (nowy), `tests/motion.test.ts` (nowy)

**Intent**: `prefersReducedMotion(win: Pick<Window, 'matchMedia'> | undefined = globalThis.window)` → `true` przy
`(prefers-reduced-motion: reduce)`, `false` bez `matchMedia` lub przy wyjątku. Test z atrapą `matchMedia`.

#### 4. Hak

**File**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: `snapshot.stars` = saldo z rejestru (obok `starsTotal`, które ma tę samą wartość) — specy fazy 8 czytają saldo, nie etykietę licznika.

### Success Criteria:

#### Automated Verification:

- `grep -n "sessionStars" src/` pusty; `grep -n "REGISTRY_KEYS.stars" src/scenes/TaskScene.ts` tylko w `syncStars` i odczytach
- `tests/summary.test.ts` bez zmian zielony; `tests/motion.test.ts` zielony; unit `<baseline gałęzi> + N`
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (asercje `starsTotal` w `task-round.spec.ts` i `parent-settings.spec.ts` bez zmian — dowód, że saldo w rejestrze = dawna suma)
- Deliberate break: `syncStars` dopisuje `state.starsEarned` zamiast delty → `task-round.spec.ts` czerwony na `starsTotal` (podwójne liczenie); przywrócone; meta-check: unit tego nie łapie (szew sceny), e2e tak — to jest cel break'u; jeśli Chromium niedostępny, break jako patch dla orkiestratora (protokół `prompt-phase.md`)
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzut: podsumowanie czystej rundy z wyróżnionym „Do pokoju” (saldo 7 ≥ 5) i podsumowanie rundy z błędami bez wyróżnienia (saldo < 5) — przy 1440×900 i 1024×768

---

## Phase 5: Salon w pokoju i przycisk bieżącego zadania

Driver: impl
Driver why: dwa nowe komponenty UI (widok salonu ze slotami, przycisk zadania remontowego) na logice faz 1–2; przepływ dotykiem dowodzi e2e fazy 8.

### Overview

`RoomScene` rysuje salon i przycisk zadania; wyszarzony stan „masz X/Y” wraca do zadań; opłacalny stan jeszcze nic nie
otwiera (panel w fazie 6 — do tego czasu stuknięcie opłacalnego przycisku nie robi nic).

### Changes Required:

#### 1. Widok salonu

**File**: `src/ui/widgets/RoomView.ts` (nowy)

**Intent**: rysuje tło (ściana nad `wallBottom`, podłoga pod nią, kolory `ivory`/`tile`), potem sloty wg `depth`: pusty =
obrys przerywany + podpis `pl.room.slots`; urządzony lub w podglądzie = prostokąt zaokrąglony w `fill` z wzorem (`plain`,
`stripes`, `dots` rysowane Graphics) + podpis. `floor`/`walls` urządzone = przemalowany pas tła z wzorem. Bez wejścia.

**Contract**: `render(room: RoomDef, state: RoomState, preview: { slot: string; variant: 0|1|2 } | null)`; `slotCenter(slot)`
dla animacji fazy 6. DESIGN-GAP komentarz (wiersz b).

#### 2. Przycisk zadania

**File**: `src/ui/widgets/RoomTaskButton.ts` (nowy)

**Intent**: na `taskButtonView`: opłacalny = wygląd `page-button` (primary) z etykietą, gwiazdką (`drawStar`) i kosztem;
krótki = wyblakły (`pageButtonSecondary`, alfa), etykieta + gwiazdka + „masz X/Y”. Stuknięcie na `pointerup` (wzorzec
`PageButton`, re-arm na `wake`), `target()` dla haka. Ukryty, gdy widok `null`.

**Contract**: `show(view: TaskButtonView | null)`; callback `onTap(affordable: boolean)`. DESIGN-GAP komentarz (wiersz a).

#### 3. Scena i układ

**File**: `src/scenes/RoomScene.ts`, `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: `RoomScene` czyta `rooms`/`currentRoom`/`stars` z rejestru, rysuje `RoomView` i `RoomTaskButton`, przelicza
na `wake` i `changedata-stars`; krótki tap → `scene.switch(task)` (jak „Wróć do notesu”). Narracja: na `create`/`wake`
`REGISTRY_KEYS.narration` = etykieta bieżącego zadania albo `null` (głośnik HUD ją czyta; `TaskScene.onWake` nadpisuje po
powrocie). Usunąć `pl.room.caption`, `ROOM_LAYOUT.caption`, stary turkusowy panel. `ROOM_TOUCH_TARGETS` (`resume`,
`taskButton`) — `TASK_TOUCH_TARGETS.resume` przenosi się tam. Komentarz klasy opisuje nowy pokój. Usunięcie
`ROOM_LAYOUT.panel` łamie dwa istniejące testy w `tests/layout.test.ts` („keeps the parent settings icon … outside the
notebook and the room panel” i „keeps the room placeholder's way back a touch target inside the room panel”): pierwszy
sprawdza zębatkę względem `ROOM_LAYOUT.area` (prawa krawędź ≤ `settings.left`), drugi zastępuje test `ROOM_TOUCH_TARGETS`
niżej — ochrona „stuknięcie w pokój nigdy nie trafia w zębatkę” zostaje.

#### 4. Hak

**File**: `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: `RoomScene.snapshot()` → `{ roomId, tasksDone, chosen, currentTask: { id, label, cost } | null, affordable,
buttonText }`; `targets.taskButton` (null poza pokojem i przy ukrytym przycisku); `snapshot.room` = `null` poza pokojem.
Typy `Snapshot`/`Targets` dostają pola opcjonalne.

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts`: każdy wpis `ROOM_TOUCH_TARGETS` ≥ `MIN_TOUCH_TARGET`; `resume` i `taskButton` w scenie, bez nakładania się na siebie, na zębatkę (`HUD_LAYOUT.settings`) i na licznik/głośnik; dwa istniejące testy z `ROOM_LAYOUT.panel` przepisane na `ROOM_LAYOUT.area` / `ROOM_TOUCH_TARGETS` (nie usunięte); unit `<baseline gałęzi> + N`
- Deliberate break: `taskButton.left` = 1700 (nachodzi na zębatkę) → test układu czerwony; przywrócone; meta-check: test chroni rozłączność celów dotyku, nie wygląd
- `grep -rn "caption" src/data/pl.ts src/scenes/RoomScene.ts` bez `room.caption`; `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`; `task-round.spec.ts` nadal trafia „Wróć do notesu” przez `targets.resume`)
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty: salon pusty z 0 gwiazdek (przycisk „Napraw podłogę” wyszarzony, „masz 0/5”), salon z 7 gwiazdkami (przycisk aktywny z kosztem 5), głośnik HUD widoczny w pokoju — przy 1440×900 i 1024×768

---

## Phase 6: Panel wariantów, podgląd w pokoju i zatwierdzenie z animacją

Driver: impl
Driver why: jeden nowy komponent UI (panel z miniaturami) i animacja zatwierdzenia w scenie na reduktorze fazy 3; przepływ dotykiem dowodzi e2e fazy 8.

### Overview

Opłacalny tap otwiera panel; miniatury ustawiają podgląd w `RoomView`; „Wybieram” kupuje przez `stepPanel`; „Zamknij”
cofa podgląd.

### Changes Required:

#### 1. Panel

**File**: `src/ui/widgets/VariantPanel.ts` (nowy), `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: taca w `ROOM_LAYOUT.tray` (kolory `unlockCard`/`unlockBorder`): 3 miniatury ≥ 180×180 (kształt slotu w
skali z kolorem i wzorem wariantu, zaznaczona = gruby obrys `deepTeal` + podniesienie, nie sam kolor), „Wybieram”
(`page-button` primary, ≥ 96 px wys., wyblakłe i bez reakcji przy podglądzie `null`), „Zamknij” (secondary). Wejście na
`pointerup`, `targets()` dla haka. `pl.room.choose` „Wybieram” (plan §7, FR-017), `pl.room.close` „Zamknij”.
`ROOM_TOUCH_TARGETS` dostaje `thumb`, `choose`, `close`.

**Contract**: `show(slotLooks: [Look, Look, Look], preview: 0|1|2|null)`, `hide()`; callbacki `onPick(i)`, `onChoose()`,
`onClose()`. DESIGN-GAP komentarz (wiersz c).

#### 2. Scena

**File**: `src/scenes/RoomScene.ts`

**Intent**: pole `panel: PanelState`; każde stuknięcie → `stepPanel` → zapis `stars`/`rooms` do rejestru tylko gdy
`bought` → przerysowanie `RoomView` (podgląd z `panel.preview`), panelu, przycisku zadania. Przy otwartym panelu
przycisk zadania i „Wróć do notesu” ukryte (jedna droga wyjścia = „Zamknij”). `bought` → animacja: tween skali slotu
(`ANIMATION.purchasePopMs`, `purchasePopScale`) + `explode` cząsteczek z tekstury gwiazdki generowanej raz
(`generateTexture`, `ANIMATION.purchaseParticles`); przy `prefersReducedMotion()` bez tweenu i cząsteczek (wariant
pojawia się od razu). Punkt zaczepienia `playPurchaseSound()` bez dźwięku z komentarzem DESIGN-GAP (wiersz e). Po
zakupie narracja = następna etykieta albo `null`. Panel zamykany (`close`) na `sleep`.

**Contract**: scena nie porównuje salda z kosztem — robi to `core`.

#### 3. Hak

**File**: `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: `snapshot.room.panel` (`PanelState`), `targets.thumbs` (3 punkty albo `[]`), `targets.choose`, `targets.close`
(null przy zamkniętym panelu i poza pokojem).

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts`: `thumb`, `choose`, `close` ≥ `MIN_TOUCH_TARGET`, wewnątrz `tray`, rozłączne; `tray` nie nachodzi na zębatkę; unit `<baseline gałęzi> + N`
- Deliberate break: miniatura 80×80 → test celu dotyku czerwony; przywrócone; meta-check: przepływ zakupu (szew sceny) dowodzi e2e fazy 8, ten test chroni rozmiar
- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Teacher read: „Wybieram”, „Zamknij” (i ponownie wszystkie napisy `pl.room` w kontekście pokoju)
- [visual] Zrzuty: panel otwarty bez podglądu („Wybieram” wyblakłe), podgląd wariantu 1, 2 i 3 w slocie podłogi, salon po zakupie (podłoga urządzona, przycisk „Pomaluj ściany” z kosztem 6 / „masz 2/6”), klatka animacji zatwierdzenia — przy 1440×900 i 1024×768
- [visual] Z emulacją `prefers-reduced-motion: reduce`: zakup bez cząsteczek i skali, lot gwiazdki w zadaniach wyłączony

---

## Phase 7: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–6, bez nowej logiki.

### Overview

Luki projektu, follow-upy, `CLAUDE.md`, przegląd szwów, wiersze decyzji `[human]`.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersze 31+: (31) przycisk bieżącego zadania z kosztem i stan „masz X/Y”; (32) placeholdery salonu (tło,
puste sloty, warianty kolor + wzór + podpis; `room.png` z kitu to urządzony pokój — S-16); (33) panel 3 wariantów,
podgląd w pokoju, „Wybieram” nieaktywne bez wyboru, „Zamknij”; (34) animacja zatwierdzenia i „ogranicz ruch”; (35) brak
dźwięku zatwierdzenia; (36) narracja etykiety zadania w pokoju. Aktualizacja: wiersz 10 (wyróżnienie osiągalne od S-09),
wiersz 12 (napis zniknął, „Wróć do notesu” przesunięte w lewo). Każdy wiersz ma komentarz `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/first-furniture-purchase/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — S-11: zapis `stars`, `rooms`, `currentRoom` z rejestru (kształt `SaveState`, bez migracji),
natychmiastowy zapis po zakupie w `RoomScene` (miejsce: gałąź `bought`); S-10: przytrzymanie urządzonego slotu
(`RoomView.slotCenter`, `longPress`), „Pokój gotowy!” zamiast znikającego przycisku; S-16: grafika i dźwięk
(`playPurchaseSound`), ramki `variants`; M8: krzywa kosztów; „wcześniejszy zapis przed codzienną grą” obejmuje teraz pokój;
wspólny przycisk HUD — nadal otwarty (`Trigger:` bez zmian).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, pliki faz 1–6

**Intent**: Current state: S-09 (salon, `core/stars.ts`, `core/rooms.ts`, `core/variantPanel.ts`, `data/rooms.ts`,
`REGISTRY_KEYS.rooms/currentRoom`, saldo w rejestrze, `ui/motion.ts`, widżety `RoomView`/`RoomTaskButton`/`VariantPanel`,
hak pokoju). Seam sweep: nieaktualne komentarze („Placeholder room (the real one comes with S-09)”, `ROOM_LAYOUT` „S-09
brings the real room”, `UIScene` „keeps up to date (stars…)” — teraz pokój też pisze saldo), martwe klucze, duplikaty
rysowania gwiazdki/przycisków.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/room.ts` → walidator FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł
- `grep -rn "comes with S-09\|S-09 brings" src/` pusty
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–6; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [human] Lista 10 slotów salonu, etykiety zadań i krzywa kosztów 5, 6, 7, 8, 9, 10, 11, 12, 13, 15 (96 gwiazdek ≈ 14 czystych rund) to treść autorska bez źródła w planie/kicie — do akceptacji autora (M8 i tak stroi)
- [human] Odstępstwo od dosłownego FR-017 („z animacją i dźwiękiem”): S-09 ma animację, dźwięku nie ma (brak plików; S-16)
- [human] Do S-11 saldo i salon są sesyjne: zimny start (zamknięcie karty, wyrzucenie z pamięci, aktualizacja PWA) = 0 gwiazdek i pusty salon
- [human] Decyzje UX bez źródła w kicie: panel zamyka tylko „Zamknij” (nie stuknięcie obok), żaden wariant nie jest wstępnie zaznaczony, przy otwartym panelu „Wróć do notesu” jest ukryte, po 10. zadaniu przycisk znika bez ekranu ukończenia (S-10), krótki przycisk wraca do zadań bez komunikatu
- [human] Na iPadzie i Androidzie: zakup palcem, podwójne szybkie stuknięcie „Wybieram” kupuje raz, „ogranicz ruch” w systemie wyłącza animację (test-plan faza 7, #16)

---

## Phase 8: Zakup przez dotyk — e2e (#16)

Driver: e2e
Driver why: ryzyko #16 (test-plan): podwójne odjęcie przy powtórnym stuknięciu, odjęcie przed „Wybieram” albo przy samym otwarciu, saldo < 0 — ścieżka dotyku przez scenę pokoju istnieje tylko w renderowanym UI; zbudowane w fazach 4–6, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/room-purchase.spec.ts` w projekcie `chromium-hook` (build haka, port 4397).

### Changes Required:

#### 1. Projekt

**File**: `playwright.config.ts`

**Intent**: `ROUND_SPEC` obejmuje `room-purchase`. Wpis `webServer` aplikacji bez zmian.

#### 2. Spec

**File**: `tests/e2e/room-purchase.spec.ts` (nowy)

**Intent**: test „#16 a confirmed choice deducts its cost exactly once; opening, cancelling or a tap while short deducts
nothing”: `silenceSpeech`, `passWelcome` (rodzic, E1 — bez rozgrzewki). Pierwsze zadanie kończone przepisaniem
rozwiązania (dwie złe odpowiedzi → rozwiązanie → retype płaci 0, `src/core/round.ts`) → faza `done`, `stars === 0`,
`roomSwitch` widoczny → „Do pokoju” → `snapshot.room.affordable === false`, `buttonText` zawiera `masz 0/5` → stuknięcie
`taskButton` → `screen === 'task'`, `stars === 0`. Dokończenie rundy i jedna czysta runda (`playRound` wzorcem
`task-round.spec.ts`; między rundami `screen === 'unlock'` → `unlockNext`, bo karta „Nowa umiejętność!” może wypaść) aż
`S = stars ≥ koszt 1. + koszt 2. zadania` (5 + 6 z `SALON.tasks`, asercja warunku wstępnego wprost — inaczej podwójne
stuknięcie nie miałoby czym kupić drugi raz i test przeszedłby pusto), `summary.roomHighlighted === true` → „Do pokoju” → `taskButton` →
`panel.kind === 'open'`, `stars === S` (otwarcie nic nie odejmuje) → `close` → `stars === S`, `tasksDone === 0` →
`taskButton` → `choose` bez podglądu → `stars === S`, panel otwarty → `thumbs[1]` → `panel.preview === 1`, `stars === S`
→ dwa szybkie stuknięcia `choose` → `stars === S - 5`, `tasksDone === 1`, `chosen.floor === 1`, `panel.kind ===
'closed'`, `currentTask.id` = drugie zadanie; `counterText === String(S - 5)` jako asercja dodatkowa (główna na saldzie —
anty-wzorzec test-planu). Wartości kosztów czytane z `snapshot.room.currentTask.cost`, nie wpisane na sztywno poza
pierwszym „5” z danych salonu.

**Contract**: zasady `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; stan osiągany wyłącznie przez produkt
(profil § 9), bez `waitForTimeout`, polling `expect.poll` na snapshot; `npx playwright test tests/e2e/room-purchase.spec.ts`.
Chromium niedostępny w sesji agenta → plik `context/runs/2026-10-13-s09-s11/e2e-request-p8.md` + patch break'u (protokół `prompt-phase.md`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/room-purchase.spec.ts` zielony (1 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 1` passed
- Deliberate break (patch tylko na kodzie produkcyjnym, REGUŁA): obsługa „Wybieram” w `RoomScene` omija `stepPanel` i woła `purchase(room, state, stars, preview)` wprost przy każdym stuknięciu (panel nie zamyka się przed drugim) → drugie szybkie stuknięcie kupuje drugie zadanie (saldo S ≥ 11 to umożliwia) → test czerwony na `stars === S - 5` / `tasksDone === 1`; przywrócone; meta-check: unit `variantPanel.test.ts` zielony — e2e dowodzi szwu sceny (sam „nieaktualny panel” nie wystarczy jako break: reduktor z fazy 3 odrzuca `confirm` na nieaktualnym panelu)
- Druga przerwa (patch, REGUŁA): `RoomScene` zapisuje saldo przy `pick` (odjęcie przy podglądzie) → test czerwony na `stars === S` po wyborze miniatury; przywrócone; meta-check: unit zielony (szew sceny)
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Testing Strategy

### Unit Tests:

- Saldo: `earn` (`stars.test.ts`); pokój: `currentTask`, `nextTaskCost`, `taskButtonView`, `purchase` (`rooms.test.ts`).
- Dane salonu: liczności, koszty, wzory wariantów, geometria nad tacą, klucze napisów (`roomsData.test.ts`).
- Panel: przypadki i test własnościowy ryzyka #16 (`variantPanel.test.ts`).
- Ruch: `prefersReducedMotion` z atrapą (`motion.test.ts`); układ: `ROOM_TOUCH_TARGETS`, rozłączność, taca vs zębatka (`layout.test.ts`).
- `summary.test.ts` bez zmian (progi `roomHighlighted`).

### Integration Tests:

- `npm run sample -- E1..E6` bez zmian; `npm run build` ze strażnikiem haka; istniejące specy (`starsTotal`) + nowy `#16` w `npx playwright test`.

### Manual Testing Steps:

1. Zrzuty: podsumowanie z wyróżnieniem i bez; salon 0 i 7 gwiazdek; panel bez podglądu i z podglądem 1/2/3; po zakupie; klatka animacji; reduced motion — 1440×900 i 1024×768.
2. Teacher read: `pl.room` (etykiety, podpisy, „Salon”, „masz X/Y”, „Wybieram”, „Zamknij”).
3. iPad i Android: zakup palcem, podwójne stuknięcie „Wybieram”, „ogranicz ruch”, zębatka nad pokojem z otwartym panelem.

## Performance Considerations

`RoomView` przerysowuje ~12 kształtów Graphics przy zmianie podglądu — pomijalne. Tekstura cząsteczek generowana raz na
scenę (`textures.exists` przed `generateTexture`); emiter niszczony po wybuchu.

## Migration Notes

Brak: bez bazy (profil § 4), format zapisu przychodzi z S-11. Saldo (`stars`) i stan pokoju (`rooms`, `currentRoom`) w
rejestrze mają kształt `SaveState` — wersja 1 zapisu przyjmie je bez migracji.

## Known risks

- **Sesyjność do S-11** (wiersz `[human]` 7.8): urządzony salon i saldo giną przy zimnym starcie; pogłębia follow-up
  „wcześniejszy zapis przed codzienną grą”.
- **Brak dźwięku** (wiersz `[human]` 7.7): odstępstwo od dosłownego FR-017; orkiestrator oznaczył je do drugiego spojrzenia.
- **Chromium w sesji agenta** (`MachPortRendezvous`): fazy 4–6 oddają e2e orkiestratorowi, faza 8 pisze `e2e-request-p8.md` z patchami przerw.
- **Saldo w rejestrze vs istniejące specy**: faza 4 nie zmienia asercji `starsTotal`; czerwony spec po fazie 4 = błąd szwu, nie spec do poprawienia.
- **Pas dolny przy 1024×768**: przycisk zadania 720 px z długą etykietą („Postaw kwiatek” + gwiazdka + „masz 12/13”) — tekst skalowany do szerokości (wzorzec `PageButton`), sprawdza bramka wizualna faz 5–6.
- **Pusty test podwójnego stuknięcia (plan-review F1)**: e2e #16 dowodzi „dwa stuknięcia = jeden zakup” tylko przy saldzie
  wystarczającym na dwa zadania; spec gra rundy do `S ≥ koszt1 + koszt2` i asertuje ten warunek, zanim stuknie dwa razy.
- **Nieaktualny panel (plan-review F2)**: reduktor odrzuca `confirm`/`pick` na panelu otwartym dla już kupionego zadania;
  to także chroni S-10 (zmiana wariantu użyje tego samego panelu).
- **Miniatury bez grafiki**: warianty różnią się kolorem i wzorem, nie kształtem mebla; dziecko może nie rozpoznać, co wybiera, zanim przyjdzie grafika (S-16) — podgląd w pokoju to łagodzi.

## References

- Research: `context/changes/first-furniture-purchase/research.md`; change: `context/changes/first-furniture-purchase/change.md`
- PRD: `context/foundation/prd.md` FR-010, FR-016, FR-017, US-02, Success Criteria „pierwszy pokój”
- Plan gry: `Martynka-urzadza.md` §2, §5 (`SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState`, `SaveState`), §6 (koszt 5–15), §7, §9, §10, §11 (M4)
- Test-plan: `context/foundation/test-plan.md` ryzyko #16, faza 7; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/` (`preview.js` ekran `room`, `screen.css` `.room-view`, `.resume`, `.flying-star`, `style-guide.md` paleta) — brak widoku zadania, slotów i panelu (DESIGN-GAP 31–36)
- Follow-upy: `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` (`Trigger: S-09`)
- Format: `context/archive/2026-10-13-parent-settings-progress/plan.md`

## Autonomous decisions

1. **Saldo w rejestrze jako jedyne źródło, `TaskScene` dopisuje deltę, zakup tylko przez `core`** (change.md decyzja 1,
   research § 1). Odrzucone: `RoomScene` zmienia pole `TaskScene` (dwa źródła), osobny licznik „wydanych” (dwa liczniki
   dla S-11), singleton w `core` (rejestr już niesie stan sesji, który S-11 zapisze). Zmieniłoby: S-11 wybierze centralny
   obiekt stanu zamiast rejestru.
2. **Salon: 10 slotów, koszty 5–15 rosnąco (suma 96), etykiety jako klucze `pl.room.tasks`** (change.md decyzja 2).
   `RoomTaskDef.label` traktuję jako klucz napisu (komentarz typu: „text key”), bo cały tekst dziecka mieszka w `pl.ts`.
   → `[human]` 7.6. Zmieniłoby: lista autora lub grafika S-16.
3. **Wygląd placeholderów w `SALON_PLACEHOLDERS` obok `RoomDef`, nie w `SlotDef`**: `SlotDef.variants` zostaje kluczami
   ramek dla S-16 (typ z planu §5 bez zmian), a wygląd zastępczy (rozmiar, kolor, wzór) jest osobną tabelą, którą S-16
   usunie. Odrzucone: pola `width/height/look` w `SlotDef` (zmiana typu planu dla danych tymczasowych). Zmieniłoby: S-16
   potrzebuje rozmiaru slotu do grafiki — wtedy rozmiar wchodzi do `SlotDef`.
4. **Warianty różnią się kolorem i wzorem (gładki/paski/kropki), z paletą style guide** (research § 5, plan §9). Zmieniłoby: grafika.
5. **Panel w canvasie, bez `openInputSession`** (change.md decyzja 3, research § 3): dialogi DOM nad pokojem (ustawienia)
   i tak wyłączają całe wejście gry. Zmieniłoby: panel jako DOM.
6. **Podgląd startuje pusty, „Wybieram” nieaktywne do wyboru miniatury; zamyka tylko „Zamknij”; „Wróć do notesu” ukryte
   przy otwartym panelu** (change.md decyzja 4, research Open Question 3). Odrzucone: wstępne zaznaczenie wariantu 0
   (dziecko mogłoby kupić bez świadomego wyboru — FR-017 „wybiera”), zamknięcie stuknięciem obok (przypadkowe dotknięcia).
   → `[human]` 7.9. Zmieniłoby: playtest pokaże, że dziecko nie rozumie nieaktywnego „Wybieram”.
7. **Krótki przycisk („masz X/Y”) wraca do zadań od razu** (roadmapa „prowadzi do zadań”; ta sama droga co „Wróć do
   notesu”). Odrzucone: komunikat przed powrotem (nowy napis, dodatkowy krok). Zmieniłoby: kit z widokiem braku gwiazdek.
8. **Po 10. zadaniu przycisk znika** (change.md decyzja 4; „Pokój gotowy!” to S-10).
9. **Animacja tak, dźwięk nie — punkt zaczepienia + DESIGN-GAP 35** (change.md decyzja 5). Wbrew dosłownemu FR-017 →
   `[human]` 7.7. Odrzucone: ton Web Audio (dźwięk bez źródła). Zmieniłoby: autor dostarczy plik albo zgodzi się na ton.
10. **„Ogranicz ruch” jednym helperem `src/ui/motion.ts`, podpiętym też do `TaskScene.flyStar`** (research Open
    Question 2; plan §9 i kit `.flying-star`). Luka sprzed S-09 zamknięta tanio w fazie 4. Zmieniłoby: nic w tym slice.
11. **Głośnik HUD czyta etykietę bieżącego zadania w pokoju** (research Open Question 1): dziecko E1, które nie czyta,
    inaczej nie wie, co kupuje; bez auto-czytania (brak gestu wejścia do pokoju jako „Dalej”). DESIGN-GAP 36.
    Zmieniłoby: kit/autor nie chce narracji w pokoju.
12. **Follow-upy `Trigger: S-09`**: `nextRoomTaskCost` (faza 4) i gwiazdka w locie (faza 4) w zakresie; wspólny przycisk
    HUD poza zakresem — żaden przycisk HUD się nie zmienia (`research.md` § 3), follow-up zostaje otwarty z tym samym `Trigger:`.
13. **Fazy: 3 × tdd (core/dane), 1 × impl szew bez UI, 2 × impl UI (po ≤ 2 nowe komponenty: `RoomView` + `RoomTaskButton`;
    `VariantPanel` + animacja), seam sweep, 1 × e2e** (reguła runu dla tego slice'a). Faza 2 to `tdd`, bo test
    niezmienników danych prowadzi treść (wzorzec `tests/contentInvariants.test.ts`). Zmieniłoby: plan-review uzna fazę 2
    za `impl` (treść, nie logika).
14. **Geometria pokoju z `research.md` § 5 jako propozycja w fazie 2, wiążące testy układu w fazach 5–6** — faza 2
    potrzebuje granic do niezmienników danych.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Saldo gwiazdek i logika zakupu w core

#### Automated

- [ ] 1.1 `stars.test.ts` i `rooms.test.ts` czerwone przed implementacją (asercja), zielone po; unit baseline + N
- [ ] 1.2 Deliberate break `>` zamiast `>=` i `earn` bez strażnika → czerwone; przywrócone; meta-check
- [ ] 1.3 Pełna bramka lokalna zielona

### Phase 2: Dane salonu i napisy zadań remontowych

#### Automated

- [ ] 2.1 `roomsData.test.ts` czerwony przed danymi (asercja liczności), zielony po; unit baseline + N
- [ ] 2.2 Deliberate break kanapa w tacy / powtórzony wzór → czerwone; przywrócone; meta-check
- [ ] 2.3 `npm run lint` bez naruszeń granic dla `src/data/rooms.ts`
- [ ] 2.4 Pełna bramka lokalna zielona (sample E1–E6 bez zmian)

#### Manual

- [ ] 2.5 [reviewer] Teacher read: etykiety zadań, podpisy slotów, „Salon”, „masz X/Y”

### Phase 3: Panel wariantów jako czysty reduktor (ryzyko #16)

#### Automated

- [ ] 3.1 `variantPanel.test.ts` czerwony przed implementacją (asercja), zielony po; unit baseline + N
- [ ] 3.2 Deliberate break `confirm` bez zamknięcia / `open` bez opłacalności → czerwone; przywrócone; meta-check
- [ ] 3.3 Pełna bramka lokalna zielona

### Phase 4: Jedno saldo w rejestrze, koszt w podsumowaniu, gwiazdka w locie i „ogranicz ruch”

#### Automated

- [ ] 4.1 `sessionStars` usunięte; `REGISTRY_KEYS.stars` pisane w `TaskScene` tylko w `syncStars`
- [ ] 4.2 `summary.test.ts` bez zmian zielony, `motion.test.ts` zielony; unit baseline + N
- [ ] 4.3 `npx playwright test` zielony, baseline e2e + 0 (asercje `starsTotal` bez zmian)
- [ ] 4.4 Deliberate break `syncStars` bez delty → `task-round.spec.ts` czerwony; przywrócone; meta-check
- [ ] 4.5 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual

- [ ] 4.6 [visual] Podsumowanie z wyróżnionym „Do pokoju” i bez — 1440×900 i 1024×768

### Phase 5: Salon w pokoju i przycisk bieżącego zadania

#### Automated

- [ ] 5.1 `layout.test.ts`: `ROOM_TOUCH_TARGETS` ≥ 96 px, rozłączne, poza zębatką i HUD; testy `ROOM_LAYOUT.panel` przepisane; unit baseline + N
- [ ] 5.2 Deliberate break przycisk zadania na zębatce → czerwony; przywrócone; meta-check
- [ ] 5.3 `room.caption` usunięte; `npx playwright test` zielony, baseline e2e + 0
- [ ] 5.4 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual

- [ ] 5.5 [visual] Salon 0 gwiazdek („masz 0/5”), salon 7 gwiazdek, głośnik w pokoju — 1440×900 i 1024×768

### Phase 6: Panel wariantów, podgląd w pokoju i zatwierdzenie z animacją

#### Automated

- [ ] 6.1 `layout.test.ts`: miniatury, „Wybieram”, „Zamknij” ≥ 96 px, w tacy, rozłączne; taca poza zębatką; unit baseline + N
- [ ] 6.2 Deliberate break miniatura 80×80 → czerwony; przywrócone; meta-check
- [ ] 6.3 `npx playwright test` zielony, baseline e2e + 0; `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual

- [ ] 6.4 [reviewer] Teacher read: „Wybieram”, „Zamknij” i napisy `pl.room` w kontekście pokoju
- [ ] 6.5 [visual] Panel bez podglądu, podgląd 1/2/3, salon po zakupie, klatka animacji — 1440×900 i 1024×768
- [ ] 6.6 [visual] Reduced motion: zakup bez animacji, lot gwiazdki wyłączony

### Phase 7: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [ ] 7.1 `validate-rule-files.sh` PASS
- [ ] 7.2 Deliberate break nieistniejąca ścieżka w `CLAUDE.md` → FAIL; przywrócone; meta-check
- [ ] 7.3 `grep "comes with S-09|S-09 brings" src/` pusty
- [ ] 7.4 Pełna bramka lokalna zielona; unit baseline + 0

#### Manual

- [ ] 7.5 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze, DESIGN-GAP w kodzie i w `docs/design-gaps.md`, follow-upy z `Trigger:`
- [ ] 7.6 [human] Lista slotów, etykiety i krzywa kosztów salonu do akceptacji autora
- [ ] 7.7 [human] Odstępstwo od FR-017: animacja bez dźwięku do S-16
- [ ] 7.8 [human] Saldo i salon sesyjne do S-11
- [ ] 7.9 [human] Decyzje UX panelu i przycisku bez źródła w kicie
- [ ] 7.10 [human] iPad i Android: zakup palcem, podwójne „Wybieram”, „ogranicz ruch”

### Phase 8: Zakup przez dotyk — e2e (#16)

#### Automated

- [ ] 8.1 `room-purchase.spec.ts` zielony; pełne `npx playwright test` baseline e2e + 1
- [ ] 8.2 Deliberate break scena omija `stepPanel` i woła `purchase` przy każdym „Wybieram” → czerwony; przywrócone; meta-check
- [ ] 8.3 Druga przerwa: odjęcie przy wyborze miniatury → czerwony; przywrócone; meta-check
- [ ] 8.4 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery zabite
