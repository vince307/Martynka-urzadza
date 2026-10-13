# Darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi i „poprawki” w salonie — Implementation Plan

## Overview

Roadmapa S-10 (`variant-change-room-done`, M4 — zamyka etap „cały pokój od zaniedbanego do urządzonego”; PRD FR-018,
FR-019, US-02 AC „Przytrzymanie … otwiera ten sam panel; zmiana wariantu jest darmowa”, „Po ostatnim zadaniu pokazuje się
»Pokój gotowy!«”). Dziecko **przytrzymuje urządzony element** salonu (≈ 0,6 s) i otwiera **ten sam panel 3 wariantów**
w trybie zmiany: podgląd w slocie, „Wybieram” zapisuje nowy wariant **bez odejmowania gwiazdek**, „Zamknij” cofa podgląd.
Zwykłe stuknięcie pokoju nic nie otwiera. Po **10. zakupie** pokazuje się karta **„Pokój gotowy!”** z **listą pokoi**
(miniatura salonu „Salon” + zapowiedź „Wkrótce”), a odblokowanie zapowiedzi wynika z **danych** (`ROOM_ORDER`). Po
zamknięciu karty w miejscu przycisku zadania stoi **„Zmień wygląd”** (tryb „poprawek”): stuknięcie urządzonego elementu
otwiera panel zmiany, „Gotowe” kończy tryb. Rundy zadań działają jak dotąd.

Pod spodem: tryb zmiany jako **gałąź istniejącego reduktora** `stepPanel` (jedna ścieżka wydawania gwiazdek — gałąź zmiany
nigdy nie zwraca `bought`), czyste trafianie slotu pod palcem (`core/roomHit.ts`), czysty widok listy pokoi, osobny próg
przytrzymania dziecka w `balance.ts`, szew `?e2eStars=N` wyłącznie w buildzie haka (dojście do ukończonego pokoju w e2e i
na bramce wizualnej). Bez nowego stanu zapisu: gotowość i odblokowanie są pochodne `RoomState` (S-11 zapisze bez migracji).

## Current State Analysis

Z `context/changes/variant-change-room-done/research.md` (commit `a8deb20`) i odczytu kodu w tym kroku
(`feat/variant-change-room-done` @ `ab2f4ee`):

- `src/core/variantPanel.ts` `stepPanel`: `PanelState = closed | open(taskId, preview)`; `open` tylko dla opłacalnego
  `currentTask`; `confirm` → `purchase`; panel nieaktualny (inny `taskId`) → `closed`. `PanelStep.bought` to jedyny
  sygnał, przy którym `RoomScene.dispatch` pisze `REGISTRY_KEYS.stars` i `rooms`.
- `src/core/rooms.ts`: `currentTask` = `null` po 10. zadaniu → `taskButtonView` = `null` → `RoomTaskButton.show(null)`
  chowa przycisk; nic więcej się nie dzieje (follow-up S-09 `Trigger: S-10`).
- `src/core/longPress.ts` `longPress(state, event, rules)` — czysty, reguły jako argument; jedyny wywołujący `UIScene.feed`
  z `balance.parentSettings` (2000 ms / 30 px, próg *odstraszający* dziecko).
- `src/ui/widgets/RoomView.ts`: rysuje tło i sloty grafiką, **bez wejścia**; prostokąt slotu liczony inline w `render`
  (`slot.x ± width/2`), podpis w środku slotu (kolizje V1: podłoga/dywan, ściany/obraz); `slotCenter` dla animacji.
- `src/scenes/RoomScene.ts`: `dispatch`, `redraw` (podgląd zawsze dla slotu `currentTask`), `celebrate(bought)`,
  `snapshot` (F5: powtarza `ROOMS[...] ?? ROOMS[FIRST_ROOM]` zamiast `this.room()`), rzutowania
  `(pl.room.tasks as Record<string,string>)` w `redraw`, `RoomTaskButton.show`, `RoomView.render` (F5).
- `src/data/rooms.ts`: `SALON` (10 slotów, 10 zadań, koszty 5…15 = 96), `SALON_PLACEHOLDERS` (rozmiary, wygląd), `ROOMS`,
  `FIRST_ROOM`. `RoomDef` (plan §5) bez pola odblokowania; `pl.room.name` „Salon” martwy (F4).
- `src/data/layout.ts`: `ROOM_LAYOUT` (`area` 180–1740 × 204–860, `tray` od y 780, `taskButton` 900,892 720×128,
  `resume` 240,892 480×116), `ROOM_TOUCH_TARGETS`, `UNLOCK_LAYOUT` (karta 388,284 1144×660, przycisk 735,793 450×108),
  `ANIMATION.purchasePopMs`.
- `src/testing/e2eHook.ts`: `e2eMonth`/`e2eFail` (czyste parsery), `installE2EHook` (snapshot `room`, targets pokoju);
  `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS = ['__martynkaE2E','e2eMonth','e2eFail','e2e-forced-failure']`,
  `E2E_REQUIRED_MARKERS` = te same; `tests/e2eHookGuard.test.ts`, `tests/e2eMonth.test.ts`.
- `src/main.ts` `preBoot`: `stars` = 0, `rooms`, `currentRoom`; pod `__E2E_HOOK__` tylko `forcedFailure`.
- `tests/e2e/support/hook.ts` `holdTouch(page, point, ms, drift)` (CDP touch); `support/welcome.ts` `passWelcome` z
  `query` dla przełączników buildu e2e. `playwright.config.ts` `ROUND_SPEC` wybiera specy projektu `chromium-hook`.
- `docs/design-gaps.md` kończy się na wierszu 36.
- `context/foundation/lessons.md` nie istnieje — brak lekcji do zastosowania.

## Desired End State

- Urządzony slot przytrzymany ≥ `balance.roomHold.holdMs` bez zsuwania palca > `moveTolerance` → w trakcie trzymania gruby
  obrys slotu (statyczny), po progu panel 3 wariantów w trybie zmiany dla **tego** slotu; podgląd w pokoju; „Wybieram”
  (po wybraniu miniatury) zapisuje `chosen[slot]`, odtwarza „pop” (bez ruchu przy „ogranicz ruch”), saldo i `tasksDone`
  bez zmian; „Zamknij” cofa podgląd. Krótkie stuknięcie, przytrzymanie pustego slotu, pustego miejsca albo z dryfem → nic.
- Najwyżej leżący urządzony slot pod palcem wygrywa (`depth`, potem późniejszy w `room.slots`); dywan osiągalny po bokach kanapy.
- Po 10. zakupie, po „popie” (`ANIMATION.purchasePopMs`, 0 przy „ogranicz ruch”): karta „Pokój gotowy!” (tytuł, kafelek
  „Salon” z miniaturą bieżącego wyglądu i znakiem ukończenia, kafelek zapowiedzi „Wkrótce”, przycisk „Dalej”). Głośnik HUD
  czyta „Pokój gotowy!”; przy auto-czytaniu karta czyta się sama (gest = „Wybieram”). „Wróć do notesu”, przytrzymanie i
  przycisk trybu wyłączone, dopóki karta jest otwarta.
- Gotowy pokój: w miejscu przycisku zadania „Zmień wygląd” → tryb zmiany (napis przycisku „Gotowe”, głośnik czyta
  wskazówkę); w trybie stuknięcie urządzonego slotu otwiera panel zmiany. Wyjście z pokoju kończy tryb. Przytrzymanie
  działa zawsze (przed i po ukończeniu, w trybie i poza nim).
- Podpisy slotów nie nachodzą na siebie (V1); `RoomScene` bez powtórzonych rzutowań i z `this.room()` w `snapshot` (F5).
- Weryfikacja: unit (reduktor + własność ryzyka #16 dla zmiany, trafianie, lista pokoi, dane, układ, parser `e2eStars`,
  strażnik haka), e2e w buildzie haka (przytrzymanie, darmowa zmiana, karta, tryb), zrzuty 1440×900 i 1024×768, teacher read.

### Key Discoveries:

- `src/core` nie importuje `src/data` — trafianie dostaje rozmiary slotów (`SALON_PLACEHOLDERS`) jako argument.
- Żaden `switch` w `src/` nie jest wyczerpujący na `PanelState.kind` (tylko `kind === 'open'`), a oba warianty `open`
  mają `preview` — rozszerzenie typu kompiluje się bez zmiany sceny (faza 1 zostaje zielona sama).
- `VariantPanel`, `PageButton`, `RoomTaskButton` reagują na `pointerup` po `pointerdown` na tej samej strefie — palec
  podniesiony nad miniaturą po odpaleniu przytrzymania niczego nie wybiera. Ukryte widżety wyłączają strefy, więc jedna
  strefa przytrzymania nad `ROOM_LAYOUT.area`, utworzona **przed** przyciskami, nie kradnie im stuknięć.
- `createInputSuspender(…, onRelease)` resetuje wskaźniki po zamknięciu dialogu DOM — trzymany palec nie wyśle `up`, więc
  `RoomScene.update` musi karmić `cancel`, gdy wejście jest zawieszone.
- Karty w canvasie (`UnlockCard`, `VariantPanel`) nie trzymają przełącznika wejścia; robią to tylko dialogi DOM. Karta
  „Pokój gotowy!” jest w canvasie — ta sama reguła (reguła slice'a o `openInputSession` dotyczy nakładek DOM).
- Ukończony salon to 96 gwiazdek ≈ 14 czystych rund; spec `room-purchase.spec.ts` mieści 4 rundy w 120 s → potrzebny szew.

## What We're NOT Doing

- Zapis na urządzeniu i natychmiastowy zapis po zmianie/zakupie (S-11); flaga „karta widziana” (karta pokazuje się tylko
  przy zdarzeniu ukończenia — po zimnym starcie i tak wraca pusty salon do S-11).
- Drugi pokój, jego nazwa i grafika (v1.1); kafelek zapowiedzi nie prowadzi nigdzie.
- Osobny widok listy pokoi poza kartą (FR-019 go nie wymaga; jeden pokój w v1).
- Tryb „zmień” przed ukończeniem pokoju (przed ukończeniem jest przytrzymanie; decyzja 3).
- Wskaźnik postępu przytrzymania (pierścień, animacja) — tylko statyczny obrys.
- Docelowa grafika, miniatura salonu z grafiki, dźwięk zmiany (S-16); wspólny przycisk HUD (żaden przycisk HUD się nie zmienia).
- Zmiana `RoomDef` z planu §5 (odblokowanie w osobnej liście `ROOM_ORDER`).

## Implementation Approach

Najpierw czysta logika i dane (fazy 1–3, test-first: reduktor + trafianie, lista pokoi + dane + napisy, parser szwu e2e),
potem UI w dwóch krokach po ≤ 2 nowe elementy (faza 4: przytrzymanie z obrysem i panel zmiany w scenie + F5/V1 w
`RoomView`; faza 5: karta „Pokój gotowy!” z listą pokoi + przycisk trybu), seam sweep z lukami projektu (faza 6) i e2e
na końcu (faza 7). Każda faza zostawia grę grywalną: do fazy 4 nic w pokoju się nie zmienia dla dziecka.

## Critical Implementation Details

- **Jedna ścieżka wydawania.** Gałąź zmiany `stepPanel` zwraca `bought: null` i `stars === ctx.stars` (ta sama referencja
  liczby), a nowe pole `changed`. `RoomScene.dispatch` pisze `stars` wyłącznie przy `bought`; przy `changed` pisze tylko
  `rooms`. Nigdy nie licz salda w scenie.
- **Sekwencja przytrzymania.** `pointerdown` w strefie pokoju → `slotAt` na punkcie; `null` (pusty slot / brak) → nic nie
  startuje. `holding` → obrys slotu. Odpalenie (`tick`) → `dispatch({ type: 'change', slot })`, `hold = IDLE`. Reset
  `hold` (i zgaszenie obrysu): `sleep`, otwarcie panelu, pokazanie karty, `cancel`/`pointerout`, zawieszone wejście
  (`InputSuspender.suspended()` → `cancel` w `update`). Czas zawsze `this.time.now` (ten sam zegar co `down`, wzorzec `UIScene`).
- **Stuknięcie w trybie zmiany.** `up` przed odpaleniem przytrzymania, w trybie `change`, na slocie z `down` → to samo
  zdarzenie `change`. Poza trybem `up` przed progiem nic nie robi (FR-018: stuknięcie nie otwiera).
- **Reguły gestu w `core`, nie w scenie** (plan-review F1). Odpalenie, stuknięcie w trybie, `up` po odpaleniu (nic),
  `cancel`/`reset` liczy czysty `roomGesture` (`src/core/roomGesture.ts`, faza 1, test-first) na `longPress`; scena tylko
  karmi go zdarzeniami Phasera z `slotAt` przy `down` i wykonuje wynik (`open: slot` → `dispatch({ type: 'change', slot })`,
  `held` → obrys).
- **Karta po ostatnim zakupie.** Stan karty ustawiany synchronicznie w `dispatch` (zakup z `currentTask === null` po nim),
  rysowanie opóźnione o `ANIMATION.purchasePopMs` (0 przy „ogranicz ruch”). Od chwili ustawienia stanu: strefa
  przytrzymania, przycisk trybu i „Wróć do notesu” wyłączone. Karta i tryb zerowane na `sleep`.
- **Szew `e2eStars`.** Parser w `src/testing/e2eHook.ts`, wołany w `main.ts` tylko pod `__E2E_HOOK__` (wzorzec `e2eMonth`),
  ustawia początkowe `REGISTRY_KEYS.stars` w `preBoot`. Nie pisze IndexedDB, zakupy nadal idą dotykiem. Ciąg `e2eStars`
  jest markerem w `vite/e2eHookGuard.mjs` — `npm run build` pada, gdy wycieknie do `dist/`.

## Phase 1: Tryb zmiany w reduktorze panelu i trafianie slotu pod palcem

Driver: tdd
Driver why: gałąź zmiany w `stepPanel`, `core/roomHit.ts`, `core/roomGesture.ts` i `roomDone` nie istnieją; failing testy (zmiana nie rusza salda ani `tasksDone`, pusty slot nie otwiera, najwyższy urządzony slot wygrywa, dywan osiągalny obok kanapy) prowadzą implementację.

### Overview

Czysta logika na fikcyjnym pokoju testowym i na `SALON` (geometria jako argument). Bez sceny.

### Changes Required:

#### 1. Reduktor panelu

**File**: `src/core/variantPanel.ts`

**Intent**: panel otwarty zna tryb. Nowe zdarzenie `change(slot)` otwiera panel zmiany tylko z `closed` i tylko dla slotu
istniejącego w pokoju i urządzonego (`state.chosen[slot] !== undefined`); `pick` jak dotąd; `confirm` z podglądem zapisuje
`chosen[slot] = preview` (nowy obiekt stanu, `tasksDone` bez zmian), zamyka panel i zwraca `changed`; bez podglądu → bez
zmian; `close` → `closed`. `open` (zakup) przy otwartym panelu zmiany i `change` przy otwartym panelu → bez zmian. Gałąź
zakupu bez zmian w zachowaniu (strażnik nieaktualnego panelu zostaje, dotyczy tylko `mode: 'buy'`). Komentarz pliku:
„the only way the scene spends stars; the change branch never spends”.

**Contract**: `PanelState = { kind: 'closed' } | { kind: 'open'; mode: 'buy'; taskId: string; preview: Preview } | { kind:
'open'; mode: 'change'; slot: string; preview: Preview }`; `PanelEvent` += `{ type: 'change'; slot: string }`;
`PanelStep` += `changed: { slot: string; variant: 0 | 1 | 2 } | null`; przy `changed !== null`: `bought === null`,
`stars === ctx.stars`, `state.tasksDone === ctx.state.tasksDone`.

#### 2. Trafianie slotu

**File**: `src/core/roomHit.ts` (nowy)

**Intent**: jeden helper prostokąta slotu (środek ± pół rozmiaru) używany i przez trafianie, i (od fazy 4) przez
`RoomView` — rysunek i dotyk nie mogą się rozjechać. `slotAt`: spośród **urządzonych** slotów zawierających punkt
(krawędzie włącznie) najwyższy `depth`, przy remisie późniejszy w `room.slots`; brak → `null`. `holdPoint`: punkt (siatka
co `step` px wewnątrz prostokąta slotu), w którym `slotAt` zwraca ten slot — dla haka e2e i testu osiągalności; `null`,
gdy slot nieurządzony albo całkiem zasłonięty.

**Contract**: `type SlotSizes = Record<string, { width: number; height: number }>`; `slotBox(slot: SlotDef, size): Box`;
`slotAt(room: RoomDef, sizes: SlotSizes, chosen: Readonly<Record<string, number>>, point: Point): string | null`;
`holdPoint(room, sizes, chosen, slotId, step = 20): Point | null`. `Box`/`Point` jako typy w `core` (bez importu z `ui`).

#### 3. Pokój gotowy

**File**: `src/core/rooms.ts`

**Intent**: `roomDone(room, state)` = `state.tasksDone >= room.tasks.length`.

#### 4. Gest w pokoju (plan-review F1)

**File**: `src/core/roomGesture.ts` (nowy)

**Intent**: czysty reduktor nad `longPress`, żeby reguły gestu dziecka nie żyły w scenie (CLAUDE.md: logika w `core`,
testy najpierw). Stan = `LongPressState` + `slot: string | null` (slot trafiony przy `down`). `down` z `slot === null`
→ nic nie startuje (stan `idle`); `down` z slotem → `holding`, `held = slot`; `tick` po progu → `open = slot`, stan
`fired` (raz na gest); `up` w `holding` (przed progiem) → `open = slot` tylko przy `mode === 'change'`, inaczej `null`;
`up` w `fired` → `open = null` (puszczenie palca po odpaleniu nic nie otwiera ani nie wybiera); `move` > tolerancji,
`cancel`, `reset` → `idle`, `held = null`.

**Contract**: `roomGesture(state: RoomGestureState, event: LongPressEvent, ctx: { mode: 'normal' | 'change'; slot:
string | null; rules: LongPressRules }): { state: RoomGestureState; open: string | null; held: string | null }`
(`ctx.slot` czytane tylko przy `down`); `ROOM_GESTURE_IDLE`.

#### 5. Testy

**File**: `tests/variantPanel.test.ts`, `tests/roomHit.test.ts` (nowy), `tests/rooms.test.ts`, `tests/roomGesture.test.ts` (nowy)

**Intent**: istniejące oczekiwania `{ kind: 'open', taskId, preview }` dostają `mode: 'buy'` (literały `PanelState` z `taskId` — `expected` otwarcia, helper `open(preview)` i stan przy `close`; oczekiwania `bought` z `taskId` zostają bez `mode`, plan-review F5);
nowe przypadki: `change` na urządzonym → `open/change` z `preview: null`; na pustym, nieznanym slocie, przy otwartym
panelu → bez zmian; `confirm` bez podglądu → bez zmian; `confirm` z podglądem → `chosen[slot]` zmieniony, `stars`,
`tasksDone` i `bought` bez zmian, `changed` ustawione, panel `closed`; `confirm` ×2 → jedna zmiana; `open` przy panelu
zmiany ignorowany; zmiana po ukończeniu pokoju działa (saldo 0). Własnościowy ryzyka #16 rozszerzony: losowe sekwencje
z `change(slot losowy)` — dotychczasowe niezmienniki plus „przy każdym kroku z `changed` saldo i `tasksDone` równe
wejściu” i „suma kosztów kupionych = start + zarobki − koniec” nadal (zmiany nic nie kosztują). `roomHit`: na `SALON`
z pełnym `chosen` — środek kanapy → `sofa`, (650, 700) → `rug`, (960, 740) → `rug`, punkt na podłodze poza meblami →
`floor`, ściana → `walls`; nieurządzona kanapa → pod nią `rug`/`floor`; pusty `chosen` → `null` wszędzie; punkt poza
`area` → `null`; `holdPoint` zwraca punkt dla każdego urządzonego slotu `SALON` (każdy osiągalny) i `null` dla
nieurządzonego. `roomDone` przy 9 i 10 zadaniach. `roomGesture`: stuknięcie poza trybem → `open === null`; stuknięcie w
trybie → `open === slot`; przytrzymanie ≥ progu → `open === slot` dokładnie raz (kolejne `tick` → `null`); `up` po
odpaleniu → `null`; dryf > tolerancji, `cancel`, `reset` → `idle`, `held === null`; `down` bez slotu → nic przy `tick`.

### Success Criteria:

#### Automated Verification:

- `tests/roomHit.test.ts`, `tests/roomGesture.test.ts` i nowe przypadki `variantPanel.test.ts`/`rooms.test.ts` czerwone przed implementacją (asercja na stubie, nie brak modułu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: gałąź `confirm` zmiany woła `purchase` zamiast zapisu `chosen` → testy „zmiana nie rusza salda” i własność ryzyka #16 czerwone; `slotAt` bierze najniższy `depth` → test „środek kanapy → sofa” czerwony; `roomGesture` otwiera na `up` także poza trybem → test „stuknięcie poza trybem” czerwony; przywrócone; meta-check: oczekiwania z FR-018 („zmiana darmowa”), US-02 AC i ryzyka #16, nie z kodu
- `npm run lint` bez naruszeń granic (`src/core/roomHit.ts`, `src/core/roomGesture.ts` bez Phasera i `src/data`); pełna bramka lokalna zielona (scena kompiluje się bez zmian)

---

## Phase 2: Lista pokoi z odblokowaniem w danych, próg przytrzymania, kotwice podpisów i napisy

Driver: tdd
Driver why: `RoomListEntry`, `ROOM_ORDER`, `roomsListView`, `balance.roomHold` i kotwice podpisów nie istnieją; failing testy (salon gotowy odblokowuje zapowiedź, zapowiedź nie ma pokoju, podpisy salonu się nie nakładają, próg dziecka krótszy niż rodzica) prowadzą dane i funkcję widoku.

### Overview

Dane i czysta funkcja widoku listy; napisy karty i trybu w `pl.ts`; próg przytrzymania dziecka; kotwice podpisów (V1,
rysowane od fazy 4).

### Changes Required:

#### 1. Lista pokoi

**File**: `src/core/types.ts`, `src/core/rooms.ts`, `src/data/rooms.ts`

**Intent**: `RoomListEntry` — pozycja listy: pokój (`{ room: string }`) albo zapowiedź (`{ teaser: true; unlockAfter:
string }`), z opcjonalnym `unlockAfter` także dla pokoju (przyszły pokój v1.1 wpisze się tak samo). `ROOM_ORDER` w danych:
`[{ room: 'salon' }, { teaser: true, unlockAfter: 'salon' }]`. `roomsListView(order, rooms, states)` → dla każdej pozycji
`{ kind: 'room' | 'teaser'; id: string | null; nameKey: string | null; done: boolean; unlocked: boolean }`;
`unlocked` = brak `unlockAfter` albo `roomDone` wskazanego pokoju; `done` tylko dla pokoju. Plan §5 `RoomDef` bez zmian.

**Contract**: `roomsListView(order: readonly RoomListEntry[], rooms: Readonly<Record<string, RoomDef>>, states:
Readonly<Record<string, RoomState>>): RoomListItem[]`; brak stanu pokoju = `emptyRoomState()`.

#### 2. Próg przytrzymania dziecka

**File**: `src/data/balance.ts`

**Intent**: `roomHold: { holdMs: 600, moveTolerance: 40 }` z komentarzem: krótkie przytrzymanie z FR-018, powyżej
domyślnych progów platform (Android 400–500 ms, iOS 0,5 s), więc wolne stuknięcie zostaje stuknięciem; 40 px gry ≈ 21 px
CSS przy 1024; strojenie na urządzeniu bez kodu.

**Contract**: kształt `LongPressRules` (`src/core/longPress.ts`).

#### 3. Kotwice podpisów (V1)

**File**: `src/data/rooms.ts`, `src/data/layout.ts`

**Intent**: `SlotPlaceholder.caption?: { x: number; y: number }` — punkt podpisu w scenie dla szerokich slotów (podłoga
przy lewym dolnym rogu, ściany przy lewym górnym), pozostałe w środku slotu jak dziś. `ROOM_LAYOUT.slot.captionCharWidth`
(szacunek szerokości znaku przy `fontSizes.caption`, dla testu) — albo stała w teście z komentarzem.

#### 4. Napisy

**File**: `src/data/pl.ts`

**Intent**: `pl.room.done` = `{ title: 'Pokój gotowy!', spoken: 'Pokój gotowy!', teaser: 'Wkrótce' }` (przycisk karty
to istniejące `pl.unlock.next` „Dalej”); `pl.room.change` = `{ enter: 'Zmień wygląd', exit: 'Gotowe', hint: 'Stuknij
mebel, który chcesz zmienić.' }`. Komentarz DESIGN-GAP (wiersze 37–41, w fazie 6). Wszystkie bez liczebników.

#### 5. Testy

**File**: `tests/rooms.test.ts`, `tests/roomsData.test.ts`, `tests/layout.test.ts`

**Intent**: `roomsListView`: salon nieukończony → salon `unlocked, !done`, zapowiedź `!unlocked`; salon ukończony →
zapowiedź `unlocked`; brak stanu → jak pusty; nieznany `unlockAfter` → zablokowana. Dane: każda pozycja `room` istnieje w
`ROOMS`, `FIRST_ROOM` jest pierwszą pozycją, każdy `unlockAfter` wskazuje pokój z listy, `pl.room.name` istnieje dla
każdego pokoju (F4: klucz przestaje być martwy w fazie 5). `balance.roomHold.holdMs < balance.parentSettings.holdMs`,
`holdMs ≥ 500`, `moveTolerance < MIN_TOUCH_TARGET / 2`. Układ: prostokąty podpisów salonu (szacunek: liczba znaków ×
szerokość znaku × wysokość `fontSizes.caption`, wokół kotwicy) parami rozłączne i wewnątrz `area`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed danymi (stub `roomsListView` zwraca `[]` → asercja; podpisy bez kotwic → test rozłączności czerwony na parach podłoga/dywan i ściany/obraz), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `unlocked` zapowiedzi bez sprawdzenia `roomDone` → test „salon nieukończony blokuje zapowiedź” czerwony; `roomHold.holdMs = 2000` → test progu czerwony; przywrócone; meta-check: oczekiwania z FR-019 („mechanika odblokowania w danych”) i FR-018 („krótkie przytrzymanie”), nie z danych
- `npm run lint` (granice `src/data`); `npm run sample -- E1..E6` bez zmian; pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Teacher read: „Pokój gotowy!”, „Wkrótce”, „Zmień wygląd”, „Gotowe”, „Stuknij mebel, który chcesz zmienić.” (biernik „mebel” po „stuknij”), „Salon” — poprawnie, krótko, zrozumiale dla 7-latka

---

## Phase 3: Szew `?e2eStars=N` w buildzie haka

Driver: tdd
Driver why: parser `e2eStars` nie istnieje; failing testy parsera (wzorzec `tests/e2eMonth.test.ts`) i strażnika (`tests/e2eHookGuard.test.ts`: marker w produkcji = błąd builda) prowadzą implementację.

### Overview

Dojście do ukończonego salonu (96 gwiazdek) w e2e i na bramce wizualnej bez 14 rund. Tylko build haka; zakupy nadal dotykiem.

### Changes Required:

#### 1. Parser

**File**: `src/testing/e2eHook.ts`

**Intent**: `e2eStars(search)` → liczba całkowita 0…`E2E_MAX_STARS` (np. 500) z `?e2eStars=N`, inaczej `null` (czyste
parsowanie, jak `e2eMonth`).

#### 2. Start salda

**File**: `src/main.ts`

**Intent**: `preBoot` ustawia `REGISTRY_KEYS.stars` na `(__E2E_HOOK__ ? e2eStars(window.location.search) : null) ?? 0`;
komentarz: szew tylko buildu e2e, nie zapis (profil § 9), produkcja zawsze 0 do S-11.

#### 3. Strażnik

**File**: `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts`

**Intent**: `'e2eStars'` w `E2E_HOOK_MARKERS` (a więc i w `E2E_REQUIRED_MARKERS`); test: kawałek produkcyjny zawierający
`e2eStars` → `ok: false` z nazwą markera; build e2e bez `e2eStars` → `ok: false`.

#### 4. Testy

**File**: `tests/e2eStars.test.ts` (nowy)

**Intent**: `?e2eStars=96` → 96; `0` → 0; brak, `-1`, `1.5`, `abc`, `501` → `null`.

### Success Criteria:

#### Automated Verification:

- `tests/e2eStars.test.ts` i nowy przypadek strażnika czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run build` drukuje `e2e hook: absent`; `E2E_HOOK=1` build (jak w `playwright.config.ts`) przechodzi z `e2eStars` w wymaganych markerach
- Deliberate break: wywołanie `e2eStars(...)` w `main.ts` bez warunku `__E2E_HOOK__` → `npm run build` czerwony („e2e hook leaked … (e2eStars …)”); przywrócone; meta-check: dowodzi strażnika na prawdziwym bundlu, nie tylko testu jednostkowego
- Pełna bramka lokalna zielona

#### Manual Verification:

- [human] Szew `?e2eStars=N` (tylko build haka, nie produkcja) jako droga e2e i bramki wizualnej do ukończonego salonu — nowy przełącznik zapytania obok `e2eMonth`/`e2eFail`

---

## Phase 4: Przytrzymanie w pokoju — darmowa zmiana wariantu urządzonego slotu

Driver: impl
Driver why: sklejka sceny (strefa przytrzymania z `longPress`, obrys trzymanego slotu, panel zmiany, `pop` po zmianie) na logice faz 1–2 plus porządki F5/V1 w `RoomView`; przepływ dotykiem dowodzi e2e fazy 7.

### Overview

Dwa nowe elementy UI: strefa przytrzymania nad pokojem i obrys trzymanego slotu w `RoomView`. Panel zmiany to ten sam
`VariantPanel`.

### Changes Required:

#### 1. Widok salonu

**File**: `src/ui/widgets/RoomView.ts`

**Intent**: prostokąt slotu z `slotBox` (`core/roomHit.ts`); podpis na kotwicy `SlotPlaceholder.caption` albo w środku
(V1); `highlight(slotId | null)` rysuje statyczny gruby obrys (`deepTeal`, grubość z `ROOM_LAYOUT.slot.holdOutline`) nad
slotami — bez ruchu, więc bez gałęzi „ogranicz ruch”. Podgląd (`RoomPreview`) bez zmian w kształcie.

#### 2. Scena

**File**: `src/scenes/RoomScene.ts`

**Intent**: pole `gesture: RoomGestureState` (`core/roomGesture.ts`, faza 1); jedna interaktywna strefa nad
`ROOM_LAYOUT.area` tworzona przed przyciskami, aktywna tylko przy zamkniętym panelu i bez karty; `pointerdown` → `slotAt`
(rozmiary z `SALON_PLACEHOLDERS`) jako `ctx.slot`; `up`/`out`/`pointermove`/`update`-`tick` karmią `roomGesture` z
`balance.roomHold` (zegar `this.time.now`, wzorzec `UIScene.feed`); `open` → `dispatch({ type: 'change', slot })`,
`held` → obrys. Scena nie decyduje sama, kiedy gest otwiera panel. `update` przy zawieszonym wejściu (`REGISTRY_KEYS.inputSuspender`) karmi `cancel`.
`redraw`: podgląd dla `panel.slot` w trybie zmiany, dla `currentTask.slot` w trybie zakupu; `VariantPanel.show` z wyglądem
slotu panelu. `dispatch`: przy `changed` zapis tylko `rooms` + `celebrate(changed)`; `celebrate` przyjmuje `{ slot,
variant }`. Reset `hold` i obrysu na `sleep`, otwarcie panelu, `cancel`. F5: typowany helper tekstu (np. `roomText`
w `src/data/pl.ts` albo prywatny w scenie) zamiast trzech rzutowań; `snapshot` przez `this.room()`.

**Contract**: scena nie porównuje salda z kosztem i nie pisze `REGISTRY_KEYS.stars` poza gałęzią `bought`.

#### 3. Hak

**File**: `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: `RoomSnapshot` += `hold: 'idle' | 'holding'`, `heldSlot: string | null`; `panel` z `mode`/`slot` (kopiowany
jak dziś); `targets.slots: Record<string, Point>` z `holdPoint` dla każdego urządzonego slotu (`{}` poza pokojem); typy
`Snapshot`/`Targets` w `support/hook.ts`.

#### 4. Układ

**File**: `src/data/layout.ts`

**Intent**: `ROOM_LAYOUT.slot.holdOutline`; komentarz DESIGN-GAP przy obrysie (wiersz 37).

### Success Criteria:

#### Automated Verification:

- `grep -n "as Record<string, string>" src/scenes/RoomScene.ts` pusty; `RoomScene.snapshot` woła `this.room()`
- `tests/layout.test.ts` bez zmian zielony (żaden cel dotyku nie zmienił się); unit `<baseline gałęzi> + 0..N`
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (`room-purchase.spec.ts` — zakup bez zmian, `panel.kind`/`preview` nadal w snapshot)
- Deliberate break (odroczony, jawnie): to, co ta faza dodaje, to szew sceny (gest → `dispatch` → rejestr), którego nie widzi żaden unit ani istniejący spec (`room-purchase.spec.ts` nie robi zmian, więc zostałby zielony przy każdym break'u tej fazy). Agent fazy zapisuje w handoff patch `context/runs/2026-10-13-s09-s11/e2e-break-s10-p4.patch` (`RoomScene.dispatch` pisze `REGISTRY_KEYS.stars` = `step.stars - 1` przy `changed`) z oczekiwaniem: czerwony test 1 fazy 7 na `stars === S` po „Wybieram” w panelu zmiany; orkiestrator stosuje go po fazie 7 (wiersz 7.2 obejmuje oba patche). Meta-check: break bez speca, który go łapie, nic by nie dowiódł — stąd przeniesienie, nie pominięcie
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual Verification:

- [visual] Zrzuty (build haka, `?e2eStars=40`, zakupy dotykiem do dywanu): obrys trzymanego slotu (kanapa), panel zmiany dla dywanu bez podglądu i z podglądem, salon po zmianie dywanu, klatka „popu” dywanu nad kanapą (V2), podpisy bez nakładania (V1) — przy 1440×900 i 1024×768
- [visual] Z emulacją `prefers-reduced-motion: reduce`: zmiana bez „popu” i cząsteczek

---

## Phase 5: „Pokój gotowy!” z listą pokoi i tryb „Zmień wygląd”

Driver: impl
Driver why: dwa nowe komponenty UI (karta `RoomDoneCard` z kafelkami listy pokoi, przycisk trybu na istniejącym `PageButton`) na `roomDone`/`roomsListView` z faz 1–2; przepływ dotykiem dowodzi e2e fazy 7.

### Overview

Karta po 10. zakupie, potem przycisk trybu „poprawek” w miejscu przycisku zadania.

### Changes Required:

#### 1. Karta

**File**: `src/ui/widgets/RoomDoneCard.ts` (nowy), `src/data/layout.ts`

**Intent**: wzorem `UnlockCard`: ramka i tytuł `pl.room.done.title`; dwa kafelki z `roomsListView`: salon (miniatura
bieżącego wyglądu — tło + urządzone sloty w skali, przez helper z `RoomView.ts`; podpis `pl.room.name`; znak ukończenia
rysowany kształtem, nie tylko kolorem) i zapowiedź (wyblakła, kłódka/obrys przerywany, `pl.room.done.teaser`); przycisk
`pl.unlock.next` „Dalej”. Kafelki nie są przyciskami. `ROOM_DONE_LAYOUT` (karta jak `UNLOCK_LAYOUT.card`, kafelki ≥ 96 px
choć nieinteraktywne, przycisk ≥ 96 px i **poza** prostokątem `ROOM_LAYOUT.choose` — przycisk `UNLOCK_LAYOUT` (735–1185 ×
793–901) nachodzi na „Wybieram” (1100–1580 × 792–892), więc nie kopiować go 1:1; plan-review F3). `targets` dla haka.

**Contract**: `show(items: RoomListItem[], salonState: RoomState)`, `hide()`, callback `onNext()`, `buttonTarget()`.
DESIGN-GAP komentarz (wiersze 39, 40).

#### 2. Tryb zmiany i przycisk

**File**: `src/scenes/RoomScene.ts`, `src/data/layout.ts`

**Intent**: pola `mode: 'normal' | 'change'` i `card: boolean`. Zakup kończący pokój (`bought` i `roomDone` po nim) →
`card = true`, rysowanie karty po `ANIMATION.purchasePopMs` (0 przy `prefersReducedMotion()`); narracja
`pl.room.done.spoken`; auto-czytanie, gdy `effectiveAutoRead` z ustawień (wzorzec `TaskScene.autoReadUnlock`; gest =
„Wybieram”). „Dalej” → `card = false`, pokój z przyciskiem trybu. Gotowy pokój bez karty i panelu: przycisk (`PageButton`
w `ROOM_LAYOUT.modeButton` = prostokąt `taskButton`) „Zmień wygląd” → `mode = 'change'`, napis „Gotowe”, narracja
`pl.room.change.hint`; „Gotowe” → `normal`, narracja `null`. W trybie `change` stuknięcie (up przed progiem) na urządzonym
slocie → `dispatch({ type: 'change', slot })`. Przy otwartym panelu przycisk trybu i „Wróć do notesu” ukryte (jak przy
zakupie); po zamknięciu panelu tryb trwa. `sleep` → `mode = 'normal'`, `card = false`. `ROOM_TOUCH_TARGETS.modeButton`,
`cardNext`.

#### 3. Hak

**File**: `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: `RoomSnapshot` += `done: boolean`, `mode`, `card: { title: string; items: RoomListItem[] } | null`,
`modeText: string | null`; `targets.modeButton`, `targets.cardNext` (null, gdy ukryte lub poza pokojem).

### Success Criteria:

#### Automated Verification:

- `tests/layout.test.ts`: `modeButton`, `cardNext` ≥ `MIN_TOUCH_TARGET`, w scenie, poza zębatką i HUD; `modeButton` nie nachodzi na „Wróć do notesu”; miniatury i „Wybieram” nie nachodzą na `modeButton` (wzorzec F1 S-09: drugie stuknięcie „Wybieram” nie trafia w przycisk trybu); „Zamknij” dzieli miejsce z `modeButton` z założenia, jak z przyciskiem zadania w S-09 (`ROOM_LAYOUT.close` leży w prostokącie `taskButton`; podwójne stuknięcie „Zamknij” przełącza tryb, nic nie kosztuje) — komentarz w teście (plan-review F2); `cardNext` nie nachodzi na „Wybieram” ani miniatury (podwójne stuknięcie ostatniego „Wybieram” nie zamyka karty, zwłaszcza przy „ogranicz ruch”, gdy karta jest od razu — plan-review F3); karta mieści się w scenie i nie nachodzi na zębatkę; unit `<baseline gałęzi> + N`
- Deliberate break: `modeButton.top = 800` (nachodzi na „Wybieram”) → test układu czerwony; przywrócone; meta-check: test chroni rozłączność celów, nie wygląd
- `grep -n "room.name" src/` pokazuje użycie w `RoomDoneCard` (F4)
- `npx playwright test` zielony (`<baseline gałęzi e2e> + 0`); `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Teacher read napisów w kontekście karty i trybu (tytuł, „Salon”, „Wkrótce”, „Dalej”, „Zmień wygląd”, „Gotowe”, wskazówka lektora)
- [visual] Zrzuty (build haka, `?e2eStars=96`, 10 zakupów dotykiem): karta „Pokój gotowy!” z listą pokoi, gotowy pokój z „Zmień wygląd”, tryb zmiany („Gotowe”), panel zmiany otwarty stuknięciem w trybie — przy 1440×900 i 1024×768
- [visual] Z emulacją `prefers-reduced-motion: reduce`: karta pojawia się od razu po ostatnim „Wybieram”

---

## Phase 6: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–5, bez nowej logiki.

### Overview

Luki projektu, follow-upy, `CLAUDE.md`, przegląd szwów, wiersze decyzji `[human]`.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: wiersze 37+: (37) przytrzymanie urządzonego elementu i statyczny obrys trzymanego slotu (por. 28 — dla
dorosłego bez sygnału, dla dziecka z sygnałem); (38) tryb „Zmień wygląd”/„Gotowe” w miejscu przycisku zadania, stuknięcie w
trybie, wskazówka lektora; (39) karta „Pokój gotowy!” (wzór `unlock.png`, przycisk „Dalej”); (40) lista pokoi: kafelek
salonu z miniaturą bieżącego wyglądu i zapowiedź „Wkrótce” bez nazwy; (41) czytanie karty (głośnik + auto-czytanie jak
wiersz 23). Aktualizacja wiersza 32 (podpisy szerokich slotów przy krawędzi — V1) i 36 (narracja w trybie zmiany i karty).
Każdy wiersz ma komentarz `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/variant-change-room-done/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — S-11: zapis po zmianie wariantu (gałąź `changed` w `RoomScene.dispatch`) i po zakupie; karta
nie wraca po zimnym starcie (bez flagi; zdecydować przy zapisie, czy potrzebna); S-16: trafianie slotów i obrys dla grafiki
(placeholdery znikają), miniatura salonu z grafiki, dźwięk zmiany; v1.1: drugi pokój wpisany do `ROOM_ORDER`; M8/S-17:
strojenie `roomHold`. Zamknięcie follow-upów S-09 z `Trigger: S-10` (hold + karta, F4, F5, V1, V2) z odnośnikami do faz.

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, pliki faz 1–5

**Intent**: Current state: S-10 (`core/roomHit.ts`, gałąź zmiany `stepPanel`, `roomDone`, `roomsListView`, `ROOM_ORDER`,
`balance.roomHold`, `RoomDoneCard`, tryb zmiany, `?e2eStars` tylko w buildzie haka i jego marker). Seam sweep: komentarze
„(„Pokój gotowy!” to S-10)”/„S-10 brings” w `src/`, komentarz klasy `RoomScene` (posiada teraz panel, przytrzymanie, tryb,
kartę), martwe klucze, duplikaty rysowania miniatury.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/roomHits.ts` → walidator FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł
- `grep -rn "S-10" src/` bez nieaktualnych zapowiedzi („comes with S-10”, „is S-10”)
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–5; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [human] Próg przytrzymania dziecka 600 ms / 40 px (`balance.roomHold`) — liczba spoza PRD (FR-018 mówi tylko „krótkie”), do strojenia na urządzeniu
- [human] Decyzje UX bez źródła w kicie: tryb „Zmień wygląd” tylko w gotowym pokoju (przed ukończeniem tylko przytrzymanie), stuknięcie poza trybem nic nie robi, przycisk karty „Dalej” prowadzi do pokoju (nie do zadań), kafelki listy nie są przyciskami, karta tylko przy zdarzeniu ukończenia (bez flagi „widziana”), wyjście z pokoju kończy tryb
- [human] Kopia spoza kitu: „Zmień wygląd” zamiast dosłownego „poprawki” z FR-019/plan §7 (słowo „poprawki” jako nazwa czynności, nie etykieta), „Wkrótce” jako zapowiedź bez nazwy pokoju
- [human] Na iPadzie i Androidzie: przytrzymanie mebla palcem (próg, dryf, zwykłe stuknięcie nie otwiera), stuknięcie w trybie, karta po 10. zakupie, „ogranicz ruch” (test-plan faza 7, #16)

---

## Phase 7: Przytrzymanie, darmowa zmiana i „Pokój gotowy!” przez dotyk — e2e (#16)

Driver: e2e
Driver why: ryzyko #16 (test-plan, rozszerzone o „zmiana nic nie odejmuje”) i FR-018/FR-019 żyją tylko w renderowanym UI (gest przytrzymania przez strefę sceny, szew `dispatch` → rejestr, karta po animacji); zbudowane w fazach 3–5, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/room-change.spec.ts` w projekcie `chromium-hook` (build haka, port 4397).

### Changes Required:

#### 1. Projekt

**File**: `playwright.config.ts`

**Intent**: `ROUND_SPEC` obejmuje `room-change`. Wpis `webServer` bez zmian.

#### 2. Spec

**File**: `tests/e2e/room-change.spec.ts` (nowy)

**Intent**: czasy z `balance.roomHold` (import danych, jak `adaptive.spec.ts`), nie wpisane na sztywno.
Test 1 „#16 a hold changes a furnished slot for free; a tap or a drifting hold opens nothing”: `silenceSpeech`,
`passWelcome` (rodzic, E1) z `query: { e2eStars: '20' }` → „Do pokoju” → kup podłogę dotykiem (5; `S = 15`) → `tap`
na `targets.slots.floor` → `panel.kind === 'closed'`, `hold === 'idle'` → `holdTouch(slots.floor, holdMs / 3)` →
`closed` → `holdTouch(…, holdMs + 400, drift = moveTolerance * 3)` → `closed` → `holdTouch(…, holdMs + 400)` →
`panel.mode === 'change'`, `panel.slot === 'floor'`, `stars === S` → miniatura różna od `chosen.floor` → „Wybieram” →
`chosen.floor` nowy, `stars === S`, `tasksDone === 1`, `panel.kind === 'closed'`, `currentTask.id` nadal drugie zadanie,
`counterText === String(S)` jako dodatkowa → przytrzymanie podłogi w punkcie, który po otwarciu panelu leży na
miniaturze 0 (np. `{ x: thumbs.left + thumbs.size / 2, y: thumbs.top + 16 }` z `ROOM_LAYOUT` — wewnątrz prostokąta
podłogi, poza innymi urządzonymi slotami; spec sprawdza to założenie asercją przed gestem) → `panel.mode === 'change'`,
`panel.slot === 'floor'`, `panel.preview === null` (puszczenie palca po odpaleniu niczego nie wybrało) → „Zamknij” →
przytrzymanie miejsca pustego slotu (np. `holdPoint` niedostępny → środek
`curtains` z `SALON`) → `closed`. Test 2 „FR-019 the last purchase shows »Pokój gotowy!« and the change mode changes for
free”: `query: { e2eStars: '96' }` → 10 zakupów dotykiem (pętla: `taskButton` → `thumbs[0]` → `choose`, czekanie na
`tasksDone`) → `room.card` niepusty, `card.items` = salon `done` + zapowiedź `unlocked`, `stars === 0`, `resume === null`
→ `cardNext` → `card === null`, `modeText === 'Zmień wygląd'` → `modeButton` → `mode === 'change'` → `tap`
`targets.slots.sofa` → panel zmiany `sofa` → miniatura → „Wybieram” → `chosen.sofa` nowy, `stars === 0`, tryb trwa →
`modeButton` („Gotowe”) → `mode === 'normal'`.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; stan wyłącznie przez produkt + szew `e2eStars`
(profil § 9 — bez IndexedDB), bez `waitForTimeout` poza czasem trzymania w `holdTouch`, `expect.poll` na snapshot;
`npx playwright test tests/e2e/room-change.spec.ts`. Chromium niedostępny w sesji agenta → plik
`context/runs/2026-10-13-s09-s11/e2e-request-p7.md` + patche break'ów (protokół `prompt-phase.md`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/room-change.spec.ts` zielony (2 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 2` passed
- Deliberate break A (patch tylko `src/scenes/RoomScene.ts`, REGUŁA): odpalone przytrzymanie wysyła `{ type: 'open' }` zamiast `{ type: 'change', slot }` (otwiera panel zakupu następnego zadania; `S = 15 ≥ 6`) → test 1 czerwony na `panel.mode === 'change'` / `stars === S` po „Wybieram”; drugi patch `e2e-break-s10-p4.patch` z fazy 4 (`dispatch` pisze saldo przy `changed`) → test 1 czerwony na `stars === S`; oba przywrócone; meta-check: `variantPanel.test.ts` zielony — e2e dowodzi szwu sceny
- Deliberate break B (patch tylko `src/scenes/RoomScene.ts`, REGUŁA): scena karmi `roomGesture` z `mode: 'change'` niezależnie od trybu (stuknięcie = zmiana poza trybem) → test 1 czerwony na `panel.kind === 'closed'` po stuknięciu; przywrócone; meta-check: unit `longPress` i `roomGesture` zielone — e2e dowodzi szwu sceny
- Deliberate break C (patch, REGUŁA): `RoomScene.dispatch` nie ustawia karty po zakupie kończącym pokój → test 2 czerwony na `room.card`; przywrócone; meta-check: unit `roomDone` zielony
- Deliberate break D (patch tylko `src/ui/widgets/VariantPanel.ts`, REGUŁA): miniatura odpala na `pointerup` bez `pointerdown` na niej (bez warunku `this.pressed === key`) → test 1 czerwony na `panel.preview === null` po przytrzymaniu nad miniaturą; przywrócone; meta-check: dowodzi, że puszczenie palca po przytrzymaniu nie wybiera wariantu (plan-review F4)
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Testing Strategy

### Unit Tests:

- Reduktor: gałąź zmiany i rozszerzona własność ryzyka #16 (`variantPanel.test.ts`); trafianie i osiągalność slotów (`roomHit.test.ts`).
- `roomDone`, `roomsListView` (`rooms.test.ts`); dane listy, `pl.room.name` (`roomsData.test.ts`); próg i podpisy (`layout.test.ts`, `roomsData.test.ts`).
- Szew: parser `e2eStars` (`e2eStars.test.ts`), marker strażnika (`e2eHookGuard.test.ts`).
- Układ: `modeButton`, `cardNext`, rozłączność z tacą i „Wróć do notesu”.

### Integration Tests:

- `npm run sample -- E1..E6` bez zmian; `npm run build` ze strażnikiem haka (`e2eStars` nieobecny w `dist/`); `room-purchase.spec.ts` bez zmian + nowy `room-change.spec.ts`.

### Manual Testing Steps:

1. Zrzuty: obrys przytrzymania, panel zmiany, po zmianie, „pop” dywanu nad kanapą (V2), podpisy (V1), karta, tryb, reduced motion — 1440×900 i 1024×768.
2. Teacher read: `pl.room.done`, `pl.room.change`, „Salon”, „Dalej”.
3. iPad i Android: próg przytrzymania, dryf, stuknięcie poza trybem i w trybie, karta.

## Performance Considerations

`slotAt` przegląda ≤ 10 slotów na `pointerdown`; `holdPoint` (siatka 20 px) liczony tylko dla haka. Miniatura salonu
rysowana raz przy pokazaniu karty. Pomijalne.

## Migration Notes

Brak: bez bazy (profil § 4), format zapisu przychodzi z S-11. Zmiana pisze tylko `RoomState.chosen`; gotowość i
odblokowanie są pochodne (`roomDone`, `roomsListView`) — wersja 1 zapisu przyjmie stan bez migracji. `ROOM_ORDER` to
definicja (dane), nie zapis.

## Known risks

- **Dywan pod kanapą**: osiągalny tylko na pasach (lewy 110×120 px, dolny 40 px); `holdPoint` + test osiągalności to
  pilnują, a tryb „Zmień wygląd” daje drugą drogę. Grafika S-16 przerobi obszary.
- **Próg 600 ms** to liczba spoza PRD (wiersz `[human]` 6.6); błąd w jedną stronę = przypadkowe panele, w drugą = gest
  nieodkryty. Liczba w danych, strojenie bez kodu.
- **Szew `e2eStars`** (wiersz `[human]` 3.5): nowy przełącznik buildu e2e; strażnik builda i jego break w fazie 3 pilnują, by nie wyciekł.
- **Chromium w sesji agenta**: fazy 4–5 oddają e2e orkiestratorowi, faza 7 pisze `e2e-request-p7.md` z patchami A–C.
- **Typ `PanelState` zmienia kształt** (`mode`): istniejące oczekiwania w `variantPanel.test.ts` aktualizowane w fazie 1;
  `room-purchase.spec.ts` czyta tylko `kind`/`preview` — bez zmian.
- **Długi spec 2** (10 zakupów): bez rund, tylko dotyk w pokoju; budżet `test.setTimeout(120_000)` jak w `room-purchase.spec.ts`.
- **Plan-review (F1–F4) poprawił plan przed fazą 1**: reguły gestu w `core/roomGesture.ts` (faza 1), „Zamknij” dzieli
  miejsce z `modeButton` z założenia, `cardNext` poza „Wybieram”, break D na puszczenie palca nad miniaturą. Raport:
  `reviews/plan-review.md`.
- **Karta tylko przy zdarzeniu**: po S-11 (zimny start z gotowym pokojem) karta nie wróci — zamierzone, follow-up `Trigger: S-11`.

## Autonomous decisions

1. **Tryb zmiany jako gałąź `stepPanel` z `mode: 'buy' | 'change'` i wynikiem `changed`, nigdy `bought`** (change.md
   decyzja 1, research § 4). Odrzucone: osobny reduktor (dwie maszyny, łatwiej o pomyłkowe `purchase`). Zmieniłoby:
   plan-review wykaże wyczerpujące dopasowania łamane przez unię.
2. **Przytrzymanie dziecka: `balance.roomHold = { holdMs: 600, moveTolerance: 40 }`** (research § 1; platformy 400–500 ms,
   0,5 s). Odrzucone: 2000 ms rodzica (odstrasza), ≤ 400 ms (stuknięcia stają się przytrzymaniami). → `[human]` 6.6.
   Zmieniłoby: test na urządzeniu.
3. **Statyczny obrys trzymanego slotu** (research § 1): dziecku sygnał potrzebny (plan §9, odkrywalność), bez ruchu nie
   trzeba gałęzi „ogranicz ruch”. Odrzucone: brak sygnału (wiersz 28 jest dla dorosłego), pierścień postępu (animacja,
   nowy komponent). Zmieniłoby: kit z widokiem przytrzymania.
4. **Trafianie: najwyższy `depth` spośród urządzonych, remis → później w `room.slots`; geometria jako argument; wspólny
   `slotBox` dla rysunku i dotyku** (research § 3). Zmieniłoby: grafika S-16 z maskami trafień.
5. **„Poprawki” = przycisk „Zmień wygląd”/„Gotowe” w prostokącie przycisku zadania, tylko w gotowym pokoju; przytrzymanie
   zawsze** (change.md decyzja 3, research § 5). Etykieta „Zmień wygląd” zamiast dosłownego „Poprawki”: czasownik w trybie
   rozkazującym jak etykiety zadań, jaśniejszy dla 7-latka; precedens „Wygląd” w niewiążącej paczce
   `designs/martynka-evolution-v1`. Wbrew dosłownemu brzmieniu FR-019 → `[human]` 6.8. Zmieniłoby: autor woli „Poprawki”.
6. **Karta „Pokój gotowy!” w canvasie `RoomScene`, pokazywana przy zakupie kończącym pokój, po „popie”; bez flagi zapisu;
   przycisk „Dalej” (istniejące `pl.unlock.next`) prowadzi do pokoju** (change.md decyzja 5, research § 6). Odrzucone:
   nowa scena listy pokoi, przycisk do zadań (dziecko chce obejrzeć efekt), dwa przyciski (zagęszczenie). → `[human]` 6.7.
   Zmieniłoby: S-11 uzna, że karta ma wracać po zimnym starcie.
7. **Lista pokoi tylko na karcie; `ROOM_ORDER` z `RoomListEntry` w `core/types.ts`, `RoomDef` bez zmian; zapowiedź bez
   nazwy („Wkrótce”)** (change.md decyzja 4, research § 6). Zmieniłoby: autor nazwie pokój v1.1 albo kit dostanie widok listy.
8. **Narracja: głośnik czyta „Pokój gotowy!” na karcie i wskazówkę w trybie; auto-czytanie karty przy `effectiveAutoRead`**
   (research § 7, wzorzec `autoReadUnlock`, wiersz 23). Zmieniłoby: autor nie chce czytania w pokoju.
9. **Szew `?e2eStars=N` tylko w buildzie haka, marker w `vite/e2eHookGuard.mjs`** (research § 8, reguła runu). Odrzucone:
   14 rund w specu (wolne, > 120 s), zapis do IndexedDB (profil § 9). → `[human]` 3.5. Zmieniłoby: maintainer zabroni
   nowych przełączników e2e.
10. **Karta w canvasie bez `openInputSession`** (research § 2; wzorzec `UnlockCard`, `VariantPanel`): reguła slice'a o
    przełączniku dotyczy nakładek DOM, a dialog ustawień nad pokojem i tak wyłącza całe wejście. Zmieniłoby: karta jako DOM.
11. **Wyjście z pokoju kończy tryb i zamyka kartę** (prostota; panel już tak działa). Zmieniłoby: playtest.
12. **Follow-upy `Trigger: S-10`**: hold + karta (fazy 4–5), F4 (faza 5), F5 i V1 (faza 4), V2 (bramka wizualna fazy 4)
    w zakresie; wspólny przycisk HUD poza zakresem (żaden przycisk HUD się nie zmienia); zapis — S-11.
13. **Fazy: 3 × tdd (core, dane, parser szwu), 2 × impl UI (po ≤ 2 nowe elementy: strefa przytrzymania + obrys;
    `RoomDoneCard` + przycisk trybu na `PageButton`), seam sweep, 1 × e2e.** Faza 3 (`e2eStars`) jako `tdd`, bo czysty
    parser i strażnik mają failing testy (wzorzec `e2eMonth.test.ts`). Zmieniłoby: plan-review uzna fazę 3 za `impl`.
14. **Break fazy 4 przeniesiony do e2e fazy 7** (break A): szew `dispatch` widać tylko w renderowanym UI; faza 4 dowodzi
    zgodności przez istniejący `room-purchase.spec.ts` (+0).

## References

- Research: `context/changes/variant-change-room-done/research.md`; change: `context/changes/variant-change-room-done/change.md`
- PRD: `context/foundation/prd.md` FR-018, FR-019, US-02, Open Question 5
- Plan gry: `Martynka-urzadza.md` §2 (pkt 6–7), §4, §5 (`RoomDef`, `RoomState`, `SaveState`), §7, §9, §11 (M4)
- Test-plan: `context/foundation/test-plan.md` ryzyko #16, faza 7; `context/foundation/test-stack.md` § E2E
- Kit: `designs/martynka-maths-A-v1/` (`unlock.png`/`UnlockCard` jako wzór karty, ekran `room`) — brak przytrzymania, trybu, karty i listy (DESIGN-GAP 37–41); niewiążący precedens `designs/martynka-evolution-v1/preview.js`
- Follow-upy: `context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md` (`Trigger: S-10`)
- Format: `context/archive/2026-10-13-first-furniture-purchase/plan.md` (+ `reviews/plan-review.md`, `reviews/impl-review.md`)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Tryb zmiany w reduktorze panelu i trafianie slotu pod palcem

#### Automated

- [x] 1.1 `roomHit.test.ts`, `roomGesture.test.ts` i nowe przypadki `variantPanel`/`rooms` czerwone przed implementacją (asercja), zielone po; unit baseline + N — 20808c9
- [x] 1.2 Deliberate break `confirm` zmiany woła `purchase` / `slotAt` z najniższym `depth` / `roomGesture` otwiera na `up` poza trybem → czerwone; przywrócone; meta-check — 20808c9
- [x] 1.3 `npm run lint` bez naruszeń granic; pełna bramka lokalna zielona — 20808c9 (e2e: orchestrator gate)

### Phase 2: Lista pokoi z odblokowaniem w danych, próg przytrzymania, kotwice podpisów i napisy

#### Automated

- [x] 2.1 Nowe testy czerwone przed danymi (stub listy, podpisy bez kotwic), zielone po; unit baseline + N — 9c79ea2
- [x] 2.2 Deliberate break zapowiedź bez `roomDone` / `holdMs = 2000` → czerwone; przywrócone; meta-check — 9c79ea2
- [x] 2.3 `npm run lint`; sample E1–E6 bez zmian; pełna bramka lokalna zielona — 9c79ea2 (e2e: orchestrator run on f028599, 24 passed)

#### Manual

- [ ] 2.4 [reviewer] Teacher read: „Pokój gotowy!”, „Wkrótce”, „Zmień wygląd”, „Gotowe”, wskazówka lektora, „Salon”

### Phase 3: Szew `?e2eStars=N` w buildzie haka

#### Automated

- [x] 3.1 `e2eStars.test.ts` i przypadek strażnika czerwone przed implementacją, zielone po; unit baseline + N — 41c4c7b
- [x] 3.2 `npm run build` drukuje `e2e hook: absent`; build `E2E_HOOK=1` przechodzi z `e2eStars` w wymaganych markerach — 41c4c7b
- [x] 3.3 Deliberate break `e2eStars(...)` bez `__E2E_HOOK__` → `npm run build` czerwony; przywrócone; meta-check — 41c4c7b
- [x] 3.4 Pełna bramka lokalna zielona — 41c4c7b (e2e: not runnable in this session (MachPort), orchestrator gate)

#### Manual

- [ ] 3.5 [human] Szew `?e2eStars=N` jako droga e2e i bramki wizualnej do ukończonego salonu

### Phase 4: Przytrzymanie w pokoju — darmowa zmiana wariantu urządzonego slotu

#### Automated

- [x] 4.1 Rzutowania F5 usunięte z `RoomScene`; `snapshot` przez `this.room()`
- [x] 4.2 `layout.test.ts` bez zmian zielony; unit baseline + 0..N
- [x] 4.3 `npx playwright test` zielony, baseline e2e + 0 (orchestrator gate)  — 8baf606 (e2e: orchestrator run on e100dca, 24 passed)
- [x] 4.4 Deliberate break odroczony: patch `e2e-break-s10-p4.patch` (`dispatch` pisze saldo przy `changed`) zapisany, dowód w fazie 7 (7.2); meta-check w handoff
- [x] 4.5 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona

#### Manual

- [ ] 4.6 [visual] Obrys przytrzymania, panel zmiany bez/z podglądem, po zmianie, „pop” dywanu nad kanapą (V2), podpisy (V1) — 1440×900 i 1024×768
- [ ] 4.7 [visual] Reduced motion: zmiana bez „popu” i cząsteczek

### Phase 5: „Pokój gotowy!” z listą pokoi i tryb „Zmień wygląd”

#### Automated

- [x] 5.1 `layout.test.ts`: `modeButton`, `cardNext` ≥ 96 px; `modeButton` rozłączny z miniaturami, „Wybieram”, „Wróć do notesu”, zębatką i HUD („Zamknij” dzieli miejsce z założenia); `cardNext` rozłączny z „Wybieram” i miniaturami; karta w scenie; unit baseline + N — f5e153a
- [x] 5.2 Deliberate break `modeButton` na „Wybieram” → czerwony; przywrócone; meta-check — f5e153a (meta-check: protects rectangle disjointness from thumbnails/"Wybieram", not looks)
- [x] 5.3 `pl.room.name` używane w `RoomDoneCard` (F4) — f5e153a
- [x] 5.4 `npx playwright test` zielony, baseline e2e + 0; `e2e hook: absent`; pełna bramka lokalna zielona — f5e153a (e2e: orchestrator run on b15b900, 24 passed)

#### Manual

- [ ] 5.5 [reviewer] Teacher read napisów karty i trybu w kontekście
- [ ] 5.6 [visual] Karta „Pokój gotowy!” z listą, gotowy pokój z „Zmień wygląd”, tryb „Gotowe”, panel zmiany ze stuknięcia — 1440×900 i 1024×768
- [ ] 5.7 [visual] Reduced motion: karta od razu po ostatnim „Wybieram”

### Phase 6: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [x] 6.1 `validate-rule-files.sh` PASS
- [x] 6.2 Deliberate break nieistniejąca ścieżka w `CLAUDE.md` → FAIL; przywrócone; meta-check (roomHit.ts→roomHits.ts: missing 1, FAIL; the validator reads paths from rules)
- [x] 6.3 `grep "S-10" src/` bez nieaktualnych zapowiedzi
- [x] 6.4 Pełna bramka lokalna zielona; unit baseline + 0 (e2e: comments and docs only; orchestrator run on b15b900, 24 passed)

#### Manual

- [ ] 6.5 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze, DESIGN-GAP w kodzie i w `docs/design-gaps.md`, follow-upy z `Trigger:`
- [ ] 6.6 [human] Próg przytrzymania dziecka 600 ms / 40 px do strojenia na urządzeniu
- [ ] 6.7 [human] Decyzje UX trybu, karty i listy bez źródła w kicie
- [ ] 6.8 [human] Kopia „Zmień wygląd” zamiast dosłownego „poprawki” (FR-019) i „Wkrótce”
- [ ] 6.9 [human] iPad i Android: przytrzymanie palcem, stuknięcie w trybie, karta, „ogranicz ruch”

### Phase 7: Przytrzymanie, darmowa zmiana i „Pokój gotowy!” przez dotyk — e2e (#16)

#### Automated

- [ ] 7.1 `room-change.spec.ts` zielony (2 passed); pełne `npx playwright test` baseline e2e + 2
- [ ] 7.2 Deliberate break A: przytrzymanie wysyła `open` zamiast `change`, oraz patch fazy 4 (saldo przy `changed`) → czerwone; przywrócone; meta-check
- [ ] 7.3 Deliberate break B: scena karmi `roomGesture` trybem `change` zawsze (stuknięcie poza trybem otwiera panel) → czerwony; przywrócone; meta-check
- [ ] 7.4 Deliberate break C: brak karty po zakupie kończącym pokój → czerwony; przywrócone; meta-check
- [ ] 7.5 Deliberate break D: miniatura odpala na `pointerup` bez `pointerdown` → czerwony na `preview === null` po przytrzymaniu nad miniaturą; przywrócone; meta-check
- [ ] 7.6 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery zabite
