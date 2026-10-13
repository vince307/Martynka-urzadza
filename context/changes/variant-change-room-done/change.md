---
change_id: variant-change-room-done
title: Darmowa zmiana wariantu, „Pokój gotowy!”, lista pokoi i „poprawki” w salonie
status: implementing
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

S-10 z roadmapy (etap M4, zamyka M4 „cały pokój od zaniedbanego do urządzonego”): dziecko **przytrzymuje urządzony
element** salonu (albo wchodzi w **tryb „zmień”**) i otwiera **ten sam panel 3 wariantów**, a zmiana jest **darmowa**;
zwykłe stuknięcie panelu nie otwiera. Po **ostatnim (10.) zadaniu remontowym** widzi **„Pokój gotowy!”** z **listą pokoi**
(miniatura salonu + zapowiedź kolejnego), a mechanika odblokowania kolejnego pokoju istnieje **w danych**. Po ukończeniu
salonu gra oferuje **„poprawki”** (zmiana wariantów) i dalsze rundy. Zapis to S-11 (do tego czasu stan pokoju żyje w
sesji); docelowa grafika i dźwięki to S-16.
Logika (stan panelu w trybie zmiany, wybór slotu pod palcem, ukończenie pokoju, lista pokoi z odblokowaniem) to czysty
TypeScript w `src/core/` z testami najpierw; pokoje, kolejność odblokowania i zapowiedź to dane w `src/data/`; scena tylko
rysuje i przekazuje gesty (przytrzymanie przez `src/core/longPress.ts`, jak koło zębate rodzica w `UIScene`).

Źródła: `context/foundation/roadmap.md` (`## At a glance`, `### S-10`), `context/foundation/prd.md` (FR-018, FR-019, US-02
AC „Przytrzymanie … otwiera ten sam panel; zmiana wariantu jest darmowa”, „Po ostatnim zadaniu pokazuje się »Pokój
gotowy!«”, Open Question 5 „motywacja po salonie”), `Martynka-urzadza.md` (§2 pętla pkt 6–7, §4 `rooms.ts` „zadania
remontowe, warianty, odblokowywanie”, §5 `RoomDef`/`RoomState`/`SaveState`, §7 Pokój i meblowanie — przytrzymanie, „Pokój
gotowy!”, lista pokoi, „poprawki”, §9 cele ≥ 96 px i „ogranicz ruch”, §11 M4), `context/foundation/test-plan.md` (ryzyko
#16), archiwa `context/archive/2026-10-13-first-furniture-purchase/` (wzorzec + follow-upy) i
`2026-10-13-adaptive-curriculum/`, kod: `src/core/{rooms,variantPanel,longPress,inputSuspend}.ts`, `src/data/{rooms,pl,
layout,balance}.ts`, `src/scenes/{RoomScene,UIScene,TaskScene}.ts`, `src/ui/widgets/{RoomView,VariantPanel,
RoomTaskButton,UnlockCard}.ts`, `src/testing/e2eHook.ts`, kit `designs/martynka-maths-A-v1/` (`preview.js` ekrany
`welcome`/`task`/`summary`/`unlock`/`room`, `screenshots/`, `style-guide.md`). Plik `lessons.md` w `context/foundation/`
nie istnieje (nie ma czego zastosować).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/variant-change-room-done` @ `36ead3c` (= `main` po S-09, PR #31).

| Roadmap claim (plan-time) | Repo now | Correction |
|---|---|---|
| Prerequisites: S-09 | `done` (#31). Jest `src/core/rooms.ts` (`emptyRoomState`, `currentTask`, `nextTaskCost`, `taskButtonView`, `purchase`), `src/core/variantPanel.ts` (`stepPanel`, reduktor tylko dla **zakupu bieżącego zadania**), `src/data/rooms.ts` (`SALON`: 10 slotów, 10 zadań, koszty 5–15; `SALON_PLACEHOLDERS`; `ROOMS`, `FIRST_ROOM`), `RoomScene` (tło + sloty + `RoomTaskButton` + `VariantPanel` + `celebrate`), saldo i `rooms`/`currentRoom` w rejestrze. | Bez korekty. |
| „zmienia wariant urządzonego elementu za darmo po przytrzymaniu (lub w trybie »zmień«)” | `stepPanel` otwiera panel tylko dla `currentTask` i przy `confirm` woła `purchase` (koszt, `tasksDone + 1`). Nie ma panelu dla **urządzonego slotu**, nie ma trafiania slotu pod palcem (`RoomView` rysuje grafiką bez obszarów dotyku; jest tylko `slotCenter`). `longPress` istnieje (czysty reduktor), używa go tylko `UIScene` z `balance.parentSettings.holdMs` = 2000 ms (próg dla dorosłego). Podłoga (1560×340) i ściany (1560×316) zachodzą na prawie cały pokój. | Nowe: tryb zmiany w reduktorze panelu (panel związany ze slotem, `confirm` zapisuje tylko `chosen[slot]`, saldo i `tasksDone` bez zmian), czysty wybór slotu pod palcem (najwyższy `depth` spośród **urządzonych** slotów), osobny, krótszy próg przytrzymania dziecka w `balance.ts` (decyzja 2). Ryzyko #16 rozszerza się o „zmiana nic nie odejmuje”. |
| „po ostatnim zadaniu widzi »Pokój gotowy!«” | Po 10. zakupie przycisk zadania **po prostu znika** (`taskButtonView` → `null`), bez ekranu (follow-up S-09 `Trigger: S-10`). Kit nie ma tego widoku; najbliższy wzorzec to karta `UnlockCard` (kit `unlock.png`, „Nowa umiejętność!”) w `TaskScene`. | Nowa karta „Pokój gotowy!” w `RoomScene` po animacji 10. zakupu; DESIGN-GAP (kopia i układ nasze, wzorowane na karcie odblokowania). |
| „listę pokoi z jedną pozycją i zapowiedzią” | Brak. `RoomDef` (`src/core/types.ts`, plan §5) **nie ma pola odblokowania**; `ROOMS` ma jeden wpis; `pl.room.name` („Salon”) nie jest nigdzie rysowany (F4). Kit nie ma listy pokoi. | Kolejność pokoi i warunek odblokowania jako dane (decyzja 4), czysta funkcja widoku listy w `core/rooms.ts`; zapowiedź bez wymyślonej nazwy pokoju. DESIGN-GAP. |
| „mechanika odblokowania kolejnego pokoju istnieje w danych” (PRD FR-019) | Nie istnieje ani w typach, ani w danych. | Nowe pole/wpis w danych + test, że salon ukończony odblokowuje wpis zapowiedzi (który nadal nie prowadzi do pokoju, bo pokoju v1.1 nie ma). |
| „może dalej robić »poprawki« i rundy” | Rundy działają (`TaskScene`; po ukończeniu `nextRoomTaskCost` = `null`, więc „Do pokoju” nie jest wyróżnione — poprawnie). Brak wejścia w „poprawki”. | „Poprawki” = tryb zmiany dostępny przyciskiem w miejscu przycisku zadania, gdy pokój gotowy (decyzja 3); przytrzymanie działa zawsze. |
| Unknowns: — | Faktycznie są: próg przytrzymania dziecka, trafianie w nakładające się sloty (podłoga/ściany pod meblami), wygląd i miejsce „trybu zmień”, kiedy karta „Pokój gotowy!” się pokazuje (raz? po powrocie?), kształt danych odblokowania, czy lista pokoi ma własny widok poza kartą, czytanie karty przez lektora, kolizja podpisów (V1). | Rozstrzygnięte kierunkowo niżej (decyzje 1–7); szczegóły dla research. |
| Risk: motywacja po salonie mierzy S-17 | Bez zmian (PRD Open Question 5). | Bez korekty. |

## Design binding

Źródło prawdy (profil §6): `Martynka-urzadza.md` §7 (przytrzymanie, „Pokój gotowy!”, lista pokoi, „poprawki”), §9 (cele
≥ 96 px, „ogranicz ruch”, nic wyłącznie kolorem/dźwiękiem), PRD FR-018/FR-019/US-02, kit `designs/martynka-maths-A-v1/`.

- **Widoki kitu wiązane przez ten slice:** ekran `room` (`.room-view`, `.resume` „Wróć do notesu” — bez zmian,
  `ROOM_LAYOUT.resume`); karta `unlock` (`unlock.png`, w kodzie `UnlockCard`) jako **wzorzec** wyglądu karty „Pokój
  gotowy!” (ramka, tytuł, jeden główny przycisk) — nie jako jej źródło kopii. Panel wariantów (`VariantPanel`) i przycisk
  zadania (`RoomTaskButton`) z S-09 są już DESIGN-GAP (wiersze 31, 33) i zostają tym samym wzorcem.
- **Brak w kicie → DESIGN-GAP** (nowe wiersze `docs/design-gaps.md` od 37): (a) przytrzymanie urządzonego elementu — brak
  sygnału postępu przytrzymania (por. wiersz 28 dla koła zębatego); (b) tryb „zmień”/„Poprawki” — przycisk i stan trybu;
  (c) karta „Pokój gotowy!”; (d) lista pokoi z miniaturą i zapowiedzią (stan zablokowany/„wkrótce”); (e) czytanie karty
  przez lektora. Kolory tylko z `src/data/layout.ts` (`PLACEHOLDER_COLORS`) i palety paczki.
- **Kopia (klucze do `src/data/pl.ts`):** ze specyfikacji — „Pokój gotowy!” (plan §7, PRD FR-019, US-02 AC), „Wybieram”,
  „Zamknij”, „Wróć do notesu” (istnieją), „Salon” (`pl.room.name`, dziś martwy — F4). Słowo „poprawki” pochodzi z planu
  §7/FR-019 jako nazwa czynności; etykieta przycisku (np. „Poprawki” albo „Zmień”), zapowiedź (np. „Wkrótce”), linia
  lektora karty i ewentualna wskazówka „przytrzymaj mebel” są **nowe, bez źródła w kicie** → DESIGN-GAP + teacher read.
- **Nie w tym slice:** zapis i natychmiastowy zapis po zmianie/zakupie (S-11); docelowa grafika, miniatura salonu z
  grafiki i dźwięki (S-16); drugi pokój (v1.1).

## Migration

Nie przewiduję migracji. Profil §4: brak bazy; format zapisu i `core/save.ts` wchodzą dopiero z S-11, więc dziś nie ma
czego migrować. Zmiana wariantu pisze tylko `RoomState.chosen` (kształt już w `src/core/types.ts`); „pokój gotowy” wynika
z `tasksDone === room.tasks.length`, a odblokowanie z danych + stanów pokoi — **bez nowych pól stanu**. Nowe pole
odblokowania trafia do `RoomDef`/danych (definicja, nie zapis). Jeśli research uzna, że potrzebna jest flaga stanu (np.
„karta już widziana”), ma to być pole w kształcie `SaveState` gotowe na wersję 1 formatu S-11, nie migracja.

## Triggered follow-ups (Trigger: S-10)

Z `context/archive/2026-10-13-first-furniture-purchase/follow-ups/review-fixes.md` (inne archiwa nie mają wpisów z
`Trigger:` S-10):

| Follow-up | Moje zdanie o zakresie |
|---|---|
| Przytrzymanie urządzonego slotu (`RoomView.slotCenter`, `core/longPress`) do zmiany wariantu; „Pokój gotowy!” zamiast znikającego przycisku po 10. zadaniu. `Trigger: S-10` | **Rdzeń slice'a** — w zakresie. |
| F4: `pl.room.name` („Salon”) nierysowany. `Trigger: S-10` | **W zakresie** — podpis pozycji salonu na liście pokoi. |
| F5: powtarzane rzutowania `(pl.room.tasks as Record<…>)[label]` / `(pl.room.slots as …)[id]` i `ROOMS[...] ?? ROOMS[FIRST_ROOM]` w `RoomScene.snapshot` zamiast `this.room()`. `Trigger: the next change to RoomScene or the room widgets (S-10)` | **W zakresie, tanio** — jeden typowany helper; S-10 i tak zmienia `RoomScene` i `RoomView`. Mała faza refaktoru na początku albo w seam-sweep. |
| V1: podpisy slotów nachodzą na siebie („podłoga”/„dywan”, „ściany”/„obraz”). `Trigger: S-16 or the next change to RoomView (S-10), whichever comes first` | **W zakresie** — S-10 zmienia `RoomView` (trafianie slotów, podgląd zmiany); kotwica podpisu dla szerokich slotów w `src/data/rooms.ts` (`SALON_PLACEHOLDERS`), test układu „podpisy się nie nakładają”. Przy przytrzymaniu podpis mówi dziecku, co trzyma — kolizja szkodzi bardziej niż w S-09. |
| V2: „pop” dywanu nad kanapą nieuchwycony na bramce wizualnej. `Trigger: S-10 visual gate (the variant change re-runs the purchase animation)` | **W zakresie bramki wizualnej** — zmiana wariantu odtwarza animację; zrzut zmiany dywanu (do wejścia przez produkt potrzeba 5 zakupów = 35 gwiazdek; research ustala ścieżkę przez hook e2e/spec `*.local`). |
| F1 (nachodzenie „Wybieram” na przycisk zadania) | **Już rozwiązane** w S-09 (9096a52, `tests/layout.test.ts`). S-10 dokłada przycisk „Poprawki” w miejscu przycisku zadania — ten sam test musi go objąć. |
| Wspólny komponent przycisku HUD. `Trigger: unchanged (S-09 or the next change to a HUD button)` | **Poza zakresem**, o ile plan nie zmienia przycisku HUD; S-10 zmienia tylko scenę pokoju. |
| Zapis `stars`/`rooms`/`currentRoom` i „wcześniejszy zapis przed codzienną grą”. `Trigger: S-11` / `before S-11` | **Poza zakresem** (S-11); S-10 dokłada tylko stan, który S-11 zapisze bez migracji (decyzja 6). |

## Autonomous decisions

1. **Tryb zmiany jako rozszerzenie reduktora panelu w `core`, nie osobna ścieżka w scenie.**
   - `PanelState` dostaje wariant „zmiana” związany ze slotem (np. `{ kind: 'open'; mode: 'change'; slot; preview }`),
     otwierany zdarzeniem z identyfikatorem slotu tylko dla **urządzonego** slotu; `confirm` w tym trybie zapisuje
     `chosen[slot]` i **nie dotyka salda ani `tasksDone`**; `close` cofa podgląd. Testy najpierw, w tym własnościowe z
     ryzyka #16 rozszerzone o „żadna sekwencja w trybie zmiany nie zmienia salda”. Jeden reduktor = jedna ścieżka wydawania
     gwiazdek. Nazwy do planu.
   - Odrzucone: osobny reduktor/scena dla zmiany (dwie maszyny do zgrania, łatwiej o pomyłkowe `purchase`).
   - Co zmieniłoby odpowiedź: research pokaże, że rozszerzenie typu łamie wyczerpujące dopasowania w `RoomScene`/hooku
     bardziej niż osobny typ — wtedy osobny reduktor, ale nadal w `core` i bez dostępu do salda.
2. **Przytrzymanie dziecka: ten sam `longPress`, osobne reguły w `balance.ts` (krótszy próg niż 2 s rodzica).**
   - Plan §7 i FR-018 mówią „krótkie przytrzymanie”; próg rodzica 2000 ms służy do *odstraszenia* dziecka. Nowy wpis
     (np. `balance.roomHold`) z progiem rzędu 0,5–0,8 s i tolerancją ruchu jak u rodzica; wartość dobiera research
     (zwykłe stuknięcie dziecka musi zostać stuknięciem). Wybór slotu pod palcem jako czysta funkcja w `core`: spośród
     urządzonych slotów zawierających punkt — najwyższy `depth`; nieurządzony slot i puste miejsce nie robią nic.
   - Odrzucone: ten sam próg 2 s (za długo dla dziecka, kłóci się z „krótkim”); stuknięcie (FR-018 wprost zabrania).
   - Co zmieniłoby odpowiedź: test na urządzeniu (wiersz `[human]`) pokaże, że dziecko przypadkiem otwiera panel albo nie
     potrafi go otworzyć — próg w danych, więc korekta bez kodu.
3. **„Tryb zmień” = przycisk „poprawki” po ukończeniu pokoju, w miejscu przycisku zadania; przytrzymanie działa zawsze.**
   - FR-018 daje „przytrzymanie **albo** tryb »zmień«”, FR-019 każe *oferować* „poprawki” po ukończeniu. Przed ukończeniem
     dolny pasek ma już przycisk zadania i „Wróć do notesu” — trzeci przycisk zagęszcza ekran dziecka. Po ukończeniu
     przycisk zadania znika, więc jego miejsce zajmuje przycisk trybu zmiany: w trybie stuknięcie urządzonego elementu
     otwiera panel, przycisk wyjścia kończy tryb. Kopia przycisku i wyjścia → DESIGN-GAP + teacher read.
   - Odrzucone: przycisk „zmień” stale widoczny (zagęszczenie, panel na wyciągnięcie palca przesłania nagrodę — plan §7);
     tylko przytrzymanie bez trybu (dziecko nie odkryje gestu; „poprawki” z FR-019 byłyby niewidoczne).
   - Co zmieniłoby odpowiedź: autor zechce trybu „zmień” także przed ukończeniem albo podpowiedzi o przytrzymaniu.
4. **Odblokowanie pokoi jako dane: uporządkowana lista pokoi z warunkiem „po ukończeniu pokoju X”; zapowiedź bez nazwy.**
   - Np. lista w `src/data/rooms.ts` z wpisem salonu i wpisem zapowiedzi (`unlockAfter: 'salon'`, bez `RoomDef`, bo pokoju
     v1.1 nie ma), czysta funkcja widoku listy w `core/rooms.ts` (stany: urządzany / gotowy / zablokowany / zapowiedź).
     Zapowiedź nie nazywa konkretnego pokoju (nie obiecujemy treści, której nie ma) — kopia typu „Wkrótce” → DESIGN-GAP.
     Pole w `RoomDef` (plan §5 go nie ma) tylko jeśli research uzna listę za gorszą; zmiana typu z plan §5 zapisana jako
     odstępstwo.
   - Odrzucone: brak mechaniki („istnieje w danych” to wymóg FR-019); wymyślenie drugiego pokoju z nazwą i grafiką.
   - Co zmieniłoby odpowiedź: autor nazwie pokój v1.1 albo kit dostanie widok listy.
5. **„Pokój gotowy!” jako karta w `RoomScene` po animacji 10. zakupu, z listą pokoi; bez osobnej sceny.**
   - Karta wzorowana na `UnlockCard` (canvas, nie DOM — kontrolka dziecka), pokazuje tytuł, listę pokoi (miniatura salonu
     narysowana z bieżących wariantów + zapowiedź) i przyciski „poprawki” oraz powrót do zadań/„Wróć do notesu”.
     Pokazywana przy zdarzeniu ukończenia (zakup ostatniego zadania), więc nie potrzebuje flagi stanu; po ponownym wejściu
     do gotowego pokoju dziecko widzi pokój z przyciskiem trybu zmiany (decyzja 3). Czy listę pokoi da się otworzyć
     później osobno — research (FR-019 tego nie wymaga). Lektor czyta tytuł karty przez istniejący klucz
     `REGISTRY_KEYS.narration` (DESIGN-GAP, jak wiersz 23).
   - Odrzucone: nowa scena „lista pokoi” (więcej przejść scen i stanu bez potrzeby w v1 z jednym pokojem); karta DOM.
   - Co zmieniłoby odpowiedź: research znajdzie, że karta musi wrócić po zimnym starcie (to S-11 i flaga w zapisie).
6. **Bez nowego stanu zapisu; stan pokoju nadal tylko w sesji do S-11.** Zmiana pisze `chosen`, gotowość i odblokowanie
   są pochodne. Wiersz `[human]` w planie nie jest potrzebny ponad istniejący follow-up „zapis przed codzienną grą”
   (S-11). Co zmieniłoby odpowiedź: decyzja 5 dostanie flagę „karta widziana” albo autor zechce grać codziennie przed S-11.
7. **Krok następny: `/10x-research`, nie `/10x-plan`** (skill domyślnie proponuje plan) — prompt kroku runu ustala
   research; są realne niewiadome (próg przytrzymania, trafianie nakładających się slotów, układ karty i przycisku trybu,
   kształt danych odblokowania, ścieżka do zrzutu V2).
