---
change_id: first-furniture-purchase
title: Pierwszy mebel za gwiazdki — salon, zadanie remontowe i wybór 1 z 3 wariantów
status: impl_reviewed
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-09 z roadmapy (etap M4, otwiera M4): dziecko w **salonie** (placeholdery rysowane w kodzie) widzi **bieżące zadanie
remontowe z kosztem z danych pokoju**; przy braku gwiazdek przycisk jest wyszarzony, pokazuje **„masz X/Y”** i
stuknięcie prowadzi do zadań, a przy wystarczającej liczbie otwiera **panel 3 wariantów z podglądem w pokoju** i
zatwierdza **„Wybieram”** — gwiazdki schodzą dopiero wtedy — z krótką animacją (i dźwiękiem, zob. decyzja 5). Zmiana
wariantu po przytrzymaniu, „Pokój gotowy!” i „poprawki” to S-10; zapis to S-11 (do tego czasu stan pokoju żyje w sesji).
Logika (zakup, bieżące zadanie, portfel gwiazdek, stan panelu) to czysty TypeScript w `src/core/` z testami najpierw;
pokój, sloty, zadania, koszty i warianty to dane w `src/data/`; scena tylko rysuje i przekazuje stuknięcia.

Źródła: `context/foundation/roadmap.md` (`## At a glance`, `### S-09`), `context/foundation/prd.md` (FR-016, FR-017,
US-02 z AC, Success Criteria krok 5 i „pierwszy pokój”, Business Logic „gwiazdki opłacają kolejne zadania remontowe
pokoju w kolejności z danych pokoju”), `Martynka-urzadza.md` (§2 pętla 4–5, §5 `SlotDef`/`RoomTaskDef`/`RoomDef`/
`RoomState`/`SaveState`, §6 wartości startowe „koszt zadania remontowego 5–15 gwiazdek”, §7 Pokój i meblowanie, §8 zapis
natychmiast po zapłacie (S-11), §9 „ogranicz ruch”, cele ≥ 96 px, „żadna informacja wyłącznie dźwiękiem”, §10 Assety
„30 elementów (10 slotów × 3 warianty)”, „do M5 placeholdery”, §11 M4), `context/foundation/test-plan.md` (ryzyko #16,
faza 7), archiwa `context/archive/2026-10-13-parent-settings-progress/` i `2026-10-13-observability-c1-c2/` (wzorzec),
`2026-10-12-narrator-round-summary/` i `2026-10-12-task-round-stars/` (follow-upy), kod: `src/scenes/{RoomScene,TaskScene,
UIScene}.ts`, `src/core/types.ts`, `src/core/round/summary.ts` (`summaryView`, `nextRoomTaskCost`), `src/core/{longPress,
inputSuspend}.ts`, `src/data/{layout,pl,balance}.ts`, `src/testing/e2eHook.ts`, kit `designs/martynka-maths-A-v1/`
(`preview.js` ekran `room`, `screen.css` `.room-view`/`.return-note`/`.resume`, `style-guide.md`, `assets/room.png`).
Plik `lessons.md` w `context/foundation/` nie istnieje (nie ma czego zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/first-furniture-purchase` @ `bb969f7` (= `main`, po S-08 #24, fixie audytu #27 i PR #28–#30).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-08 | `done`. HUD (`UIScene`) ma licznik gwiazdek, głośnik, „Do pokoju” (`RoomSwitchButton`) i ikonę ustawień (`SettingsIcon`), które działają też nad pokojem; `openInputSession` (`src/core/inputSuspend.ts`) dla nakładek. | Bez korekty. |
| „dziecko widzi salon (placeholdery)” | `RoomScene` to placeholder S-05: turkusowy panel (`ROOM_LAYOUT.panel`), napis `pl.room.caption` „Tu powstanie pokój”, przycisk „Wróć do notesu” (`PageButton`), DESIGN-GAP wiersz 12. Nie ma `src/data/rooms.ts` ani `src/core/rooms.ts`; typy `SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState`, `SaveState.rooms/currentRoom` są tylko w `src/core/types.ts`, nieużywane. | Nowe: dane salonu w `src/data/rooms.ts`, czysta logika w `src/core/rooms.ts` (nazwa z planu §4), `RoomScene` przepisana: tło + sloty wg `depth` + przycisk zadania. Napis „Tu powstanie pokój” znika, wiersz 12 `docs/design-gaps.md` aktualizowany. |
| „bieżące zadanie remontowe i koszt z danych pokoju” | Brak danych pokoju. Plan §6: koszt 5–15, §10: 10 slotów × 3 warianty; nazw slotów i etykiet poza przykładami („Napraw podłogę”, „Wstaw kanapę”) **nie ma nigdzie** w specyfikacji. | Salon (10 slotów, 10 zadań, koszty 5–15) jako dane autorskie w `src/data/rooms.ts`; etykiety to nowe polskie napisy → teacher read (decyzja 2). |
| „przy braku gwiazdek przycisk pokazuje »masz X/Y« i prowadzi do zadań” | Pokój otwiera `TaskScene` przez `scene.switch(SCENE_KEYS.room)` (`GAME_EVENTS.toRoom`); powrót to `scene.switch(SCENE_KEYS.task)` przycisku „Wróć do notesu”. | „Prowadzi do zadań” = ten sam powrót co „Wróć do notesu” (runda czeka uśpiona). Bez korekty mechaniki. |
| „wydaje gwiazdki … gwiazdki odejmowane dopiero przy »Wybieram«” | **Gwiazdki należą do `TaskScene`**: pole `sessionStars` + `REGISTRY_KEYS.stars` jako kopia do HUD; `TaskScene.create` ustawia `stars` na 0; nikt poza `TaskScene` nie pisze salda. Pokój nie ma jak odjąć gwiazdek bez rozjechania `sessionStars` i rejestru. | Jedno źródło salda (decyzja 1): portfel w `core`, zapisywany w rejestrze, `TaskScene` dopisuje zarobek, `RoomScene` odejmuje przy zakupie. Ryzyko #16 test-planu (podwójne odjęcie, odjęcie przed „Wybieram”, saldo < 0). |
| „otwiera panel 3 wariantów z podglądem i zatwierdza »Wybieram«” | Brak panelu, miniatur, podglądu; kit nie ma tego widoku. `longPress.ts` istnieje, ale przytrzymanie to S-10. | Nowe widżety w `src/ui/widgets/` + maszyna stanów panelu w `core`; wszystko DESIGN-GAP (sekcja niżej). |
| „z animacją i dźwiękiem” | **W repo nie ma żadnego dźwięku** (ani plików, ani `this.sound`); kit „Recorded … audio is not included”; dźwięki przynosi S-16 (FR-026). Animacji ruchu „ogranicz ruch” pilnuje dziś tylko `src/style.css` (`prefers-reduced-motion`, lot gwiazdki). | Animacja (tween skali + cząsteczki rysowane w kodzie, wyłączane przy „ogranicz ruch”) w zakresie; dźwięk — punkt zaczepienia bez dźwięku + DESIGN-GAP + wiersz `[human]` (decyzja 5). |
| Unknowns: — | Faktycznie są: lista slotów i etykiet, koszt poszczególnych zadań, zamknięcie panelu bez wyboru, co po ostatnim zadaniu przed S-10, technologia panelu (canvas czy DOM), dźwięk. | Rozstrzygnięte niżej (decyzje 2–6); szczegóły dla research. |
| Success Criteria „pierwszy pokój” | Pełne przejście z „Pokój gotowy!” wymaga S-10. | S-09 pozwala kupić wszystkie 10 zadań po kolei; po ostatnim przycisk zadania znika (bez ekranu ukończenia — S-10, decyzja 4). |
| (pośrednio) FR-010: „Do pokoju” wyróżnione, gdy stać na mebel | `summaryView` dostaje `nextRoomTaskCost: null` na sztywno w `TaskScene` → `roomHighlighted` zawsze `false` (DESIGN-GAP wiersz 10: „not reachable before S-09”). | W zakresie: koszt bieżącego zadania z `core/rooms.ts` trafia do `summaryView` (follow-up S-05). |
| (pośrednio) e2e | Hook (`src/testing/e2eHook.ts`) zgłasza `screen: 'room'` i tylko cel `resume`. | Hook (tylko build e2e) dostaje odczyt pokoju: saldo, bieżące zadanie, stan panelu, cele przycisku zadania / miniatur / „Wybieram” — pod spec ryzyka #16. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §7 (pokój i meblowanie), §9 (cele ≥ 96 px, „ogranicz ruch”, nic
wyłącznie dźwiękiem lub kolorem), §10 (placeholdery do M5), PRD FR-016/FR-017/US-02, kit `designs/martynka-maths-A-v1/`.

- **Widok kitu wiązany przez ten slice:** ekran `room` z `preview.js`/`screen.css`: `.room-view` (tło pokoju na całą
  scenę), `.return-note` (licznik gwiazdek w pokoju — dziś pominięty, bo licznik HUD zostaje nad pokojem, wiersz 14) i
  `.resume` „Wróć do notesu” (bez zmian, `ROOM_LAYOUT.resume`). Tło kitu `assets/room.png` (1920×1080) to **urządzony**
  salon z poprzedniej paczki — nie nadaje się na stan „zaniedbany” i jest grafiką docelową (S-16); tło zostaje rysowane
  w kodzie z `PLACEHOLDER_COLORS` (decyzja 3).
- **Brak w kicie → DESIGN-GAP** (wiersze `docs/design-gaps.md` od 31): (a) przycisk bieżącego zadania remontowego z
  kosztem i stanem wyszarzonym „masz X/Y”; (b) placeholdery slotów (pusty slot / 3 warianty) w salonie; (c) panel 3
  miniatur wariantów, podgląd w pokoju, „Wybieram” i zamknięcie panelu bez wyboru; (d) animacja zatwierdzenia; (e) dźwięk
  zatwierdzenia (brak plików). Kolory tylko z `src/data/layout.ts` i palety paczki.
- **Kopia (klucze do `src/data/pl.ts`):** ze specyfikacji — „Wybieram” (plan §7, PRD FR-017), „masz X/Y” (plan §7, FR-016;
  same cyfry, bez rzeczownika, więc bez odmiany — research sprawdza, czy z ikoną gwiazdki czytelnie), etykiety zadań w
  stylu „Napraw podłogę”, „Wstaw kanapę” (plan §2, §5); istniejące `pl.room.resume`. Nowe, bez źródła w kicie (DESIGN-GAP
  + teacher read): etykiety pozostałych zadań salonu, nazwa pokoju („Salon”), zamknięcie panelu (np. „Zamknij”), etykieta
  kosztu na przycisku, tekst lektora dla przycisku/panelu, jeśli research uzna, że HUD-owy głośnik ma go czytać.
- **Nie w tym slice:** przytrzymanie urządzonego slotu i darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi,
  „poprawki” (S-10); zapis i natychmiastowy zapis po zapłacie (S-11); docelowa grafika i dźwięki (S-16).

## Migration

Nie przewiduję migracji. Profil §4: brak bazy; format zapisu i `core/save.ts` wchodzą z S-11. Stan pokoju trzymam w
kształcie `RoomState` (`tasksDone`, `chosen`) z `src/core/types.ts`, a saldo jako `stars` — tak jak `SaveState`, więc S-11
zapisze je w wersji 1 formatu bez migracji.

## Triggered follow-ups (Trigger: S-09)

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| `summaryView` dostaje koszt bieżącego zadania remontowego (`nextRoomTaskCost` dziś `null`), żeby „Do pokoju” było wyróżnione, gdy dziecko stać (FR-010, wiersz 10). `Trigger: S-09` | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` | **W zakresie** — tani, a bez niego FR-010 jest martwy. Po ostatnim zadaniu koszt `null` (nic do kupienia). |
| `SpeakerButton` i `RoomSwitchButton` powtarzają ramkę, widoczność, cel i obsługę stuknięcia; wydzielić wspólny przycisk HUD. `Trigger: S-09 or the next change to a HUD button` | jw. | **Raczej poza zakresem** — S-09 nie musi zmieniać przycisków HUD (licznik dostaje nowe saldo przez istniejący `changedata-stars`). Jeśli plan jednak zmieni któryś przycisk HUD, wydzielenie wchodzi jako osobna, mała faza refaktoru przed nim. Research potwierdza. |
| Gwiazdka w locie przy stuknięciu „Do pokoju” zatrzymuje się na czas snu `TaskScene` i kończy lot po powrocie. `Trigger: S-09 or the next change to the star flight in TaskScene` | jw. (z bramki wizualnej 2026-10-13) | **W zakresie, tanio** — w S-09 saldo w pokoju spada, więc dolatująca po powrocie gwiazdka przy już odjętym liczniku byłaby myląca. Dokończyć albo usunąć lot przy `sleep` w `TaskScene`. |
| Przełącznik „zadania/pokój” między zadaniami (FR-011) — `roundView.switchVisible` gotowe, nic nie rysuje. `Trigger: S-05 or S-09, whichever draws the first room entry` | `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` | **Już zamknięte** przez S-05 (`RoomSwitchButton`, wiersz 4). Nic do zrobienia. |
| Hook e2e: przy otwartym pokoju `targets.nextRound`/`toRoom` zgłaszają przyciski uśpionego podsumowania. `Trigger: the next change to src/testing/e2eHook.ts` | `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` | **Już zrobione** (`inRoom() ? null : …` w `installE2EHook`). S-09 zmienia hook — sprawdzić, że nowe cele pokoju też zgłaszają `null` poza pokojem. |

Sąsiednie, świadomie poza zakresem: „wcześniejszy zapis ucznia przed codzienną grą” (`Trigger: before S-11, or any deploy
used for daily play`) — S-09 go **wzmacnia** (teraz ginie też urządzony pokój), decyzja 6; F4 `WelcomeScene.openParent`
vs `UIScene.openSettings` (`Trigger: S-11 … or the next change to WelcomeScene`) — S-09 nie zmienia `WelcomeScene`;
„pojedynczy holder `suspend()` przy drugiej nakładce nad HUD” (`Trigger: any new overlay that calls suspend() while the
HUD exists`) — **wchodzi tylko wtedy**, gdy panel wariantów będzie nakładką DOM; przy panelu w canvasie (decyzja 3) nie.

## Autonomous decisions

1. **Jedno saldo gwiazdek w `core`, w rejestrze; `TaskScene` dopisuje, `RoomScene` odejmuje tylko przez zakup.**
   - Czysta funkcja zakupu w `src/core/rooms.ts` (nazwy do planu): `(roomState, roomDef, stars, variant) →` nowy stan +
     nowe saldo albo odmowa (za mało, brak bieżącego zadania, zły wariant); saldo nigdy < 0, koszt dokładnie raz. Stan
     panelu (otwarty / podgląd wariantu / zatwierdzony) też jako czysty reduktor, żeby powtórne stuknięcie „Wybieram”
     nie kupiło dwa razy (ryzyko #16, testy jednostkowe/własnościowe najpierw). `TaskScene.sessionStars` przestaje być
     właścicielem: zarobek dopisuje się do salda z rejestru (research: jak, bez zerowania w `TaskScene.create`).
   - Odrzucone: `RoomScene` zmienia `TaskScene.sessionStars` przez referencję do sceny (logika w scenie, dwa źródła);
     osobny licznik „wydanych” (dwa liczniki do zgrania w S-11).
   - Co zmieniłoby odpowiedź: research znajdzie powód, dla którego `TaskScene` musi trzymać saldo lokalnie (np. lot
     gwiazdki liczy na pole) — wtedy saldo nadal w `core`, a scena tylko je czyta.
2. **Salon: 10 slotów i 10 zadań remontowych jako dane autorskie w `src/data/rooms.ts`, koszty 5–15 rosnąco.**
   - Plan §10 mówi 10 slotów × 3 warianty, §6 koszt 5–15; nazw slotów nie ma nigdzie, więc układam je jako treść (np.
     podłoga, ściany, okno, kanapa, stolik, dywan, lampa, regał, roślina, obraz) z etykietami w trybie rozkazującym jak
     w przykładach planu („Napraw podłogę”, „Wstaw kanapę”), z poprawnym biernikiem. Koszty w danych pokoju (FR-016:
     „koszty i kolejność to dane pokoju”), nie w `balance.ts`. Teacher read wszystkich etykiet; wiersz `[human]` w planie:
     autor zatwierdza listę slotów i krzywą kosztów (M8 i tak je stroi).
   - Odrzucone: mniej slotów na start (Success Criteria liczy cały pokój); koszty w `balance.ts` (sprzeczne z FR-016).
   - Co zmieniłoby odpowiedź: autor poda własną listę mebli/slotów albo grafika (S-16) narzuci inne sloty.
3. **Placeholdery i panel rysowane w canvasie (`RoomScene` + widżety w `src/ui/widgets/`), nie DOM; tło kodem, nie
   `room.png`.**
   - Panel wariantów jest kontrolką dziecka i podgląd dzieje się w pokoju (canvas); dialogi DOM są w grze dla dorosłego
     (bramka, ustawienia). Slot = kolorowy kształt z podpisem (CLAUDE.md), wariant = ten sam kształt w jednym z 3
     kolorów/wzorów z `PLACEHOLDER_COLORS`. Miniatury i „Wybieram” ≥ 96 px. Panel w scenie nie potrzebuje
     `openInputSession`; stuknięcia poza panelem nie robią nic, póki panel otwarty (research: jak z HUD — „Do pokoju”
     i ustawienia nad otwartym panelem).
   - Odrzucone: panel jako nakładka DOM (inny wygląd niż reszta ekranów dziecka, podgląd i tak w canvasie);
     `room.png` z kitu jako tło (urządzony pokój = zła informacja dla dziecka, grafika docelowa należy do S-16).
   - Co zmieniłoby odpowiedź: kit dostanie widok pokoju z panelem — wtedy jego układ.
4. **Zamknięcie panelu bez wyboru i stan po ostatnim zadaniu.** Panel ma wyraźne „Zamknij” (cofa podgląd, nic nie
   odejmuje — FR-017, ryzyko #16). Po zakupie ostatniego zadania przycisk zadania znika (nic do kupienia), bez ekranu
   ukończenia — „Pokój gotowy!” jest w S-10 (FR-019). Odrzucone: zamknięcie stuknięciem poza panelem (przypadkowe
   dotknięcia dziecka gubiłyby podgląd; plan §7 chroni pokój przed przypadkowymi stuknięciami). Co zmieniłoby
   odpowiedź: kit/autor pokaże inny wzorzec zamykania.
5. **Animacja tak, dźwięk jako punkt zaczepienia bez dźwięku (DESIGN-GAP + wiersz `[human]`).** Zatwierdzenie: tween
   skali slotu + cząsteczki rysowane w kodzie (plan §7), czas w `layout.ts` `ANIMATION`; przy „ogranicz ruch” bez tweenu
   i cząsteczek (plan §9). Dźwięku nie ma czym zagrać (żadnych plików, kit ich nie dostarcza, S-16 je przynosi), a gra ma
   być w pełni grywalna bez dźwięku. To odstępstwo od dosłownego FR-017 („z … dźwiękiem”) → wiersz `[human]` w planie.
   Odrzucone: ton syntetyzowany Web Audio (wymyślony dźwięk bez źródła w kicie, odkładany i tak w S-16). Co zmieniłoby
   odpowiedź: autor dostarczy plik dźwięku albo zgodzi się na prosty ton.
6. **Stan pokoju tylko w sesji do S-11.** Zimny start = pusty salon i 0 gwiazdek, jak dziś etap i opanowanie. Wiersz
   `[human]` w planie (pogłębia follow-up „zapis przed codzienną grą”). Odrzucone: wcześniejszy, tymczasowy zapis pokoju
   (S-11 projektuje format jako drzwi jednokierunkowe; drugi format = migracja więcej). Co zmieniłoby odpowiedź: autor
   zechce codziennej gry przed S-11.
7. **Krok następny: `/10x-research`, nie `/10x-plan`** (skill domyślnie proponuje plan) — krok prompt runu ustala
   research; poza tym są realne niewiadome (własność salda w `TaskScene`, wejście HUD nad panelem, hook e2e).
