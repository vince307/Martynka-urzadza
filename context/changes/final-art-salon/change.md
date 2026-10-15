---
change_id: final-art-salon
title: Docelowa grafika salonu (tło przed → po, 6 mebli × 3), animacje i ekran ładowania
status: planned
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Slice roadmapy **S-16a** (etap M7), autonomiczny run `2026-10-15-s16a-salon-art`, gałąź `feat/final-art-salon`
cięta z `main` @ `334ff69` (po PR #59 decyzje S-16 i #60 limit testów MONEY_PAY).

- **Outcome (roadmapa):** dziecko remontuje salon z paczki `martynka-expansion-v1`: pierwsza czynność „Odnów ściany i
  podłogę” zmienia tło z zniszczonego na odnowione (jeden etap, bez panelu wariantów), potem 6 mebli z wyborem 3
  wariantów (sofa, dywan, stolik, komoda, fotel, obrazki); lampa, dwie rośliny i pufa to stała dekoracja; animacje
  (tweeny, cząsteczki, z „ogranicz ruch”) i ekran ładowania; na ekranach salonu nie ma placeholderów, braki są w
  `docs/designer-brief-s16.md`.
- **PRD:** FR-016 (koszty i kolejność czynności to dane pokoju, start 5–15), FR-026 (docelowa grafika, animacje, ekran
  ładowania; „zero placeholderów” w salonie; dźwięki → S-16b), NFR dostępność („ogranicz ruch”, grywalne bez dźwięku,
  nic tylko kolorem). Pośrednio FR-017/018/019 (panel wariantów, darmowa zmiana, „Pokój gotowy!”) — zachowanie bez
  zmian, zmienia się tylko wygląd i lista czynności.
- **Kontrakt runu** § S-16a: źródło grafiki to gitignorowana paczka `designs/martynka-expansion-v1` (nigdy nie
  stage'owana), konwersja do WebP w `public/assets/` przez rozszerzony `npm run art` (wyniki commitowane, zgoda autora
  2026-10-13); przyszłe sloty dopisywane **na końcu** listy czynności; przemapowanie żywych zapisów naprawą przy
  wczytaniu, **format zostaje v2**, fixture'y bajt w bajt; brak tekstury pokoju nie psuje pokoju, a sekcja „Obrazki”
  liczy też grafikę pokoju; ekran ładowania rysowany w kodzie (DESIGN-GAP → brief P2); bez dźwięku (S-16b).
- **Wzorce:** `context/archive/2026-10-15-e1-shapes-picture-mode/` (tabela roszczeń, decyzje, grafika z `designs/`
  przez `npm run art`), `context/archive/2026-10-15-text-measure-time-types/` (follow-upy z triggerami),
  `context/archive/2026-10-13-first-furniture-purchase/` i `2026-10-13-variant-change-room-done/` (salon, panel,
  przytrzymanie, karta „Pokój gotowy!”), `repairCurrentRoom` w `src/core/rooms.ts` (naprawa przy wczytaniu bez zmiany
  formatu), art-stand-in-and-load-signal (`ArtImage`, `artHealth`).
- Plik lekcji w `context/foundation/` nie istnieje (sprawdzone 2026-10-15).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/final-art-salon` @ `334ff69`.

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisites S-14, S-15 | Oba done; także S-14b/c/d. Zapis v2 (`SAVE_VERSION` 2, `src/core/save.ts`). | Brak blokad. |
| Salon ma dziś 10 slotów (kontrakt: „live saves under the 10-slot list”) | Prawda: `SALON` w `src/data/rooms.ts` — sloty floor, walls, rug, curtains, picture, shelf, lamp, table, plant, sofa; czynności w kolejności fix-floor 5, paint-walls 6, hang-curtains 7, add-sofa 8, lay-rug 9, place-table 10, place-lamp 11, hang-shelf 12, place-plant 13, hang-picture 15 (suma 96). `RoomState` = `{ tasksDone, chosen: Record<slot, 0\|1\|2> }` (`src/core/types.ts`), `validRoom` w `save.ts` przyjmuje dowolne klucze `chosen`. | Nowa lista: etap tła + 6 mebli = **7 czynności**. Stary `tasksDone` 0…10 i klucze `floor/walls/curtains/lamp/shelf/plant/table/picture` trzeba przeliczyć (decyzja 3). Kształt `RoomState` się nie zmienia → v2 wystarcza. |
| „Etap tła bez panelu wariantów” | Każda czynność ma dziś `slot` i panel 3 wariantów: `purchase(room, state, stars, variant)` wymaga wariantu 0–2 (`src/core/rooms.ts`), `stepPanel` (`src/core/variantPanel.ts`) otwiera panel na stuknięcie przycisku czynności, `RoomScene.dispatch` rozgałęzia tylko na `bought`/`changed`. | Nowy rodzaj czynności w `RoomTaskDef` (`kind: 'stage'` vs `'slot'`; dane w `src/data/rooms.ts`), zakup etapu jednym stuknięciem (z potwierdzeniem albo bez — plan; FR-016 mówi o stuknięciu w przycisk), stan etapu wynika z `tasksDone` (bez wpisu w `chosen`, bo `validRoom` dopuszcza tylko 0–2 i etap nie ma wariantu). |
| Pozycje z manifestu: lewy górny róg + w/h + anchor + z | `SlotDef` (`src/core/types.ts`) ma środek `x/y` i `depth`; `slotBox` (`src/core/roomHit.ts`) liczy prostokąt z `SALON_PLACEHOLDERS[id].width/height`; `RoomView` rysuje `drawLook` (kolor + wzór), `drawRoomMiniature` dla karty „Pokój gotowy!”. Manifest (sprawdzony): sofa 838/257 835×566 z30, wall-frames 1055/15 634×425 z5, rug 432/441 1111×640 z10, cabinet 293/226 512×363 z20, armchair 248/554 399×361 z40, coffee-table 763/535 537×397 z50; warstwy lamp-table z25, plant-left z26, plant-right z35, pouf z60; każdy ma `visibleRect` (16 px marginesu). | Dane slotu przechodzą na prostokąt z manifestu (lewy górny róg + w/h + `visibleRect` dla trafienia), `depth` = `z`; hit-test i obrys przytrzymania (`roomHit.ts`, `RoomView.highlight`) z `visibleRect`, nie z całego płótna (dywan 1111×640 przykrywałby fotel i stolik). Follow-up S-10 F4 (dwa typy `Box`) rozwiązuje się tutaj. `SALON_PLACEHOLDERS`, `Look`, `drawLook`, `captionAnchor` wychodzą albo zostają tylko jako stand-in. |
| Art inventory: „salon ≈ 1,2 MB WebP” | `public/assets` dziś 496 KB (tylko zadania). PNG paczki: tła 2,7 + 3,2 + 2,5 MB + cienie 0,3 MB, meble 6,4 MB. `globPatterns` obejmuje `webp`, `maximumFileSizeToCacheInBytes` 10 MB (`vite/config.shared.mjs`). `cwebp` jest (`/usr/local/bin/cwebp`). | Szacunek do potwierdzenia przy konwersji (research/plan: rozmiar wyjściowy teł 1920×1080 vs połowa, jakość). Budżet precache i ładowanie wszystkiego w `BootScene` (bez leniwych chunków) to kryterium fazy. |
| „Atlas tekstur zamiast luźnych WebP” (follow-up `Trigger: S-16`) | `npm run art` = `scripts/make-task-art.mjs`, tylko `cwebp` per plik, bez natywnych zależności w CI; ładowanie `this.load.image` z `TASK_ART`. | Atlas wymaga pakera (natywny albo nowa zależność) i zmiany `ArtImage`/`artHealth` dla ramek — **poza zakresem** (decyzja 5), re-trigger. |
| `BootScene` „ekran ładowania” | `BootScene` nic nie rysuje („Nothing is drawn here”), ładuje font i `TASK_ART`; `artHealth` z `textures.exists`. | Ekran ładowania rysowany kodem w `BootScene.preload` (pasek z `load.on('progress')`, tytuł z `pl.ts`, kolory z `layout.ts`); grafika z briefu P2.2 brak → DESIGN-GAP. |
| Animacje „z ogranicz ruch” | Jest już pop + cząsteczki gwiazdek przy zakupie (`RoomScene.celebrate`, `ANIMATION.purchase*`), wyłączane `prefersReducedMotion()`; lot gwiazdki w `TaskScene` też. Follow-up S-10 V2: pop rysuje dywan nad sofą, bo animuje wspólną grafikę. | Z obiektem (obrazem) per slot pop dotyczy obiektu slotu na jego głębokości (V2 zamknięty). Nowe: przejście tła przed → po (przenikanie) i ewentualne wejście warstwy `furnishingsBefore`/`shadows`; wszystkie za `prefersReducedMotion()`. |
| „Na ekranach salonu nie ma placeholderów” | Placeholder: `RoomView` (ściana/podłoga kodem, sloty przerywane, podpisy), miniatury w panelu (`VariantPanel`, `drawLook`), miniatura salonu w `RoomDoneCard` (`drawRoomMiniature`). | Wszystkie trzy przechodzą na obrazy (miniatury panelu = obraz wariantu przeskalowany; miniatura salonu = złożenie tła i mebli w skali albo `RenderTexture`, plan). Pusty slot w docelowej grafice: tło „przed” ma meble zniszczone w `furnishingsBefore` — plan decyduje, czy pusty slot to mebel zniszczony z warstwy „przed” (brak per-slot rozbicia tej warstwy!) czy obrys. |
| Dekoracja stała (lampa, rośliny, pufa) | Dziś `lamp` i `plant` to płatne sloty. | Warstwy bez czynności, rysowane zawsze (albo od etapu tła — plan); slot `lamp`/`plant` znika z danych. |
| Naprawa zapisów „like `repairCurrentRoom`” | `repairCurrentRoom` (`src/core/rooms.ts`) wołane w `src/main.ts` po `loadSave`; `saveSummary` (`src/core/saveFile.ts`) liczy `min(tasksDone, tasks.length)` z surowego stanu (podgląd importu). Fixture'y `tests/fixtures/save-v{1,2}.json` mają pokój `living` (`tasksDone` 3, `chosen` floor/sofa/lamp) — nie `salon`, więc naprawa salonu ich nie dotyka; fresh-fixtures mają pusty salon. | Naprawa salonu jako czysta funkcja obok `repairCurrentRoom`, wołana w `main.ts` i w ścieżce podglądu importu (`parseImport`/`saveSummary`), żeby podsumowanie nie pokazało „10/7”. Fixture'y bez zmian; nowe testy budują stany starego salonu w kodzie. |
| e2e salonu | `tests/e2e/room-change.spec.ts` kupuje `floor` za 5 i trzyma `targets.slots.floor`, używa `SALON_PLACEHOLDERS.floor`; `room-purchase.spec.ts` gra pierwszy zakup przez panel. | Oba spec'e do przepisania: pierwsza czynność to etap tła (bez panelu), zmiana wariantu na pierwszym meblu (sofa). Hook (`src/testing/e2eHook.ts` `room().snapshot()`, `targets.slots`) dostaje stan etapu. |

## Design source and copy (profile § 6)

- **Źródło grafiki:** `designs/martynka-expansion-v1/manifest.json` (`scene` 1920×1080: `backgroundBefore`
  `assets/room/architecture-before.png`, `backgroundAfter` `architecture-after.png`, `furnishingsBefore`
  `furnishings-before.png` jedna warstwa alfa, `shadows` `shadows.png`; `slots` sofa, wall-frames, rug, cabinet,
  armchair, coffee-table po 3 warianty z polskim `label`; `layers` lamp-table, plant-left, plant-right, pouf). Paczka
  ma `preview.html`/`screenshots/` z układem pokoju — wzór dla wizualnego gate'u. `style-guide.md` paczki A dla celów
  dotyku i kolorów (`PLACEHOLDER_COLORS` w `src/data/layout.ts`).
- **Widoki, które slice wiąże:** pokój (RoomScene: tło, sloty, przycisk czynności `RoomTaskButton`, panel
  `VariantPanel`), karta „Pokój gotowy!” (`RoomDoneCard`, miniatura salonu), ekran ładowania (`BootScene`, nowy),
  sekcja „Obrazki” w panelu rodzica (`src/ui/dom/artHealthView.ts`).
- **Copy (`src/data/pl.ts`):** `pl.room.tasks` (dziś `fixFloor` … `hangPicture`) → nowe etykiety: „Odnów ściany i
  podłogę” (z roadmapy, decyzja autora) + 6 czynności meblowych (np. „Postaw sofę”, „Połóż dywan” — plan, styl jak
  istniejące); `pl.room.slots` (podpisy) → nazwy z manifestu (`label`: Sofa, Obrazki, Dywan, Komoda, Fotel, Stolik);
  nazwy wariantów z manifestu (Morska, Słoneczna, Listkowa, …) — dziś panel nie pokazuje nazw wariantów, plan decyduje,
  czy wchodzą (dostępność: „nic tylko kolorem” przemawia za podpisem wariantu). Tekst ekranu ładowania: „Martynka
  urządza” (jest jako marka) + ewentualnie „Ładowanie…” — brak w kicie → DESIGN-GAP. Hasło z wyników
  (`src/core/minigames/word.ts`) bierze słowa z podpisów pokoju — zmiana podpisów zmienia pulę słów (sprawdzić).
- **DESIGN-GAP (kandydaci, nowe wiersze w `docs/design-gaps.md` od 105; zamknięcia):**
  1. Ekran ładowania — brak tła i elementu tytułowego (brief P2.2); rysowany kodem.
  2. Wygląd pustego slotu na docelowej grafice (paczka ma tylko wspólną warstwę `furnishingsBefore`, nie per slot).
  3. Miniatura salonu na liście pokoi (brief P2.3) — złożona z warstw przez grę.
  4. Przejście tła przed → po (paczka nie ma teł pośrednich, brief P3.6).
  5. Zamknięcie/zawężenie wierszy 32 (pokój kodem), 33 (miniatury panelu), 34 (animacja), 35 (dźwięk → S-16b);
     wiersz 22 (książka na karcie odblokowania) można zamknąć istniejącą ikoną `public/assets/tasks/icons/book.webp`
     (paczka A) — plan decyduje.

## Migration expected?

**Nie zmiany formatu — naprawa stanu przy wczytaniu.** Zapis zostaje **v2** (kontrakt § S-16a): kształt `RoomState`
(`tasksDone` + `chosen` 0–2) wystarcza dla nowego salonu, jeśli etap tła nie ma wpisu w `chosen`. Przeliczenie
starego salonu (10 czynności) na nowy (7) robi czysta funkcja w `src/core/rooms.ts` (np. `remapLegacySalon`) przy
każdym wczytaniu i podglądzie importu; musi być **idempotentna** i rozpoznawać stary układ bez nowego pola — znacznik:
obecność w `chosen.salon` klucza spoza nowej listy slotów (stary zapis z `tasksDone ≥ 1` zawsze ma `floor`; stan z
`tasksDone` 0 jest taki sam w obu układach). Nowe identyfikatory slotów nie mogą kolidować ze starymi znaczeniami w
sposób, który zmyli znacznik (`sofa`, `rug` wspólne i zgodne; `table`→`coffee-table`, `shelf`→`cabinet`,
`picture`→`wall-frames` jako nowe id). Fixture'y `tests/fixtures/` bez zmian (pokój `living`, a fresh = pusty salon).
Ryzyko: rollback deployu do starego buildu po zapisie w nowym układzie — stary build zobaczy `tasksDone` ≤ 7 z kluczami,
których nie zna (pokój wygląda na częściowo pusty, nic nie ginie); opisać w planie. Gdyby plan potrzebował nowego pola
(np. znacznika „przeliczono”), to v3 → **slice zatrzymuje się na otwartym PR**; rekomendacja: nie potrzeba.

## Triggered follow-ups (archive `follow-ups/review-fixes.md`, `Trigger: S-16`)

| Follow-up | Źródło | Ocena zakresu |
|---|---|---|
| Grafika mebli zamiast ramek, miniatury bardzo szerokich slotów (`thumbs.minAspect`) | `2026-10-13-first-furniture-purchase` | **W zakresie** — rdzeń. Dźwięk zakupu (`playPurchaseSound`) → S-16b. |
| V1 kolidujące podpisy (`captionAnchor`) | `2026-10-13-first-furniture-purchase` | **W zakresie** — znika z grafiką (podpisy przy meblach albo bez podpisów; plan, z uwagą na V3). |
| Hit-test i obrys przytrzymania dla ramek grafiki, miniatura salonu z grafiki, dźwięk zmiany | `2026-10-13-variant-change-room-done` | **W zakresie** poza dźwiękiem (→ S-16b). |
| F4 dwa typy `Box` (`roomHit.ts` vs `RoomView.ts`) | `2026-10-13-variant-change-room-done` | **W zakresie** — slot dostaje prostokąt z manifestu, jeden typ. |
| F6 `RoomDoneCard` liczby inline (ptaszek, kłódka) | `2026-10-13-variant-change-room-done` | **W zakresie (tanie)**, jeśli `RoomDoneCard` jest dotykany (miniatura) — do `ROOM_DONE_LAYOUT.tiles`. |
| V2 pop dywanu nad sofą | `2026-10-13-variant-change-room-done` | **W zakresie** — pop obiektu slotu na jego głębokości. |
| V3 znikające podpisy na pasującym kolorze | `2026-10-13-variant-change-room-done` | **W zakresie** — podpisy na jasnym podkładzie albo ich brak przy grafice. |
| Książka na karcie „Nowa umiejętność!” (DESIGN-GAP 22) | `2026-10-13-adaptive-curriculum` | **W zakresie (tanie)** — `tasks/icons/book` już jest załadowany (paczka A); `UnlockCard` rysuje ikonę z `ArtImage`. |
| ` = ?` po wyrażeniu w poleceniu | `2026-10-13-adaptive-curriculum` | **Poza** — zmiana treści poleceń wszystkich generatorów, nie grafika salonu; re-trigger `S-17 or a teacher read asking for it`. |
| Atlas tekstur | `2026-10-14-art-tasks-all-stages` | **Poza** (decyzja 5) — re-trigger `precache over budget or a second room`. |
| Termometr E3–E5 z ramą 0…+30 (design-gaps 64) | `2026-10-14-art-tasks-all-stages` | **Poza** — paczka nie ma przyciętej ramy; przycięcie w kodzie (crop tekstury) możliwe, ale to ekran zadań, nie salon; re-trigger `the author delivers a 0…+30 frame or a teacher read of E3-E5 thermometer`. |
| Podświetlenie rysunku przy podpowiedzi | `2026-10-14-art-tasks-all-stages` | **Poza** — zachowanie ekranu zadań; `Trigger: a teacher read asking for it`. |
| Jednostki w podpowiedziach czytane surowo (`spokenText`, `spokenCelsius` „minus”) | `2026-10-14-art-tasks-all-stages` | **Poza** — narrator, nie grafika; re-trigger `a narrator check on the tablet or the next change to src/core/narration/`. Uwaga: `spokenCelsius` z literałem „minus” to łamanie reguły „tekst w `pl.ts`” — tanie, plan może dołożyć. |
| O3 kafelki obok termometru stoją nisko | `2026-10-14-art-tasks-all-stages` | **Poza** — kosmetyka ekranu zadań; `Trigger: S-17 polish`. |
| SPATIAL (scena „po lewej/nad/pod”) | `2026-10-15-e1-shapes-picture-mode` | **Poza** — brief wymienia scenę z półkami jako brak („Poza salonem”); salon nie ma półek z przedmiotami; re-trigger `art for a SPATIAL scene`. |
| Grafika portfela (design-gaps 104) | `2026-10-15-e1-shapes-picture-mode` (`Trigger: the author delivers wallet art`, wymieniony w wierszu S-16a) | **Poza** — brak grafiki (brief P2.4); trigger bez zmian. |
| V3 przekreślone zero w foncie | `2026-10-12-task-round-stars` | **Poza** — decyzja maintainera o foncie; trigger `the maintainer asks for a plain 0`. |
| `audio.noAudio` poza granicą błędów | `2026-10-13-observability-c1-c2` | **Poza** → `S-16b` (pierwszy dźwięk). |

Każdy „poza” dostaje przy archiwum nowy `Trigger:` w `follow-ups/review-fixes.md` tej zmiany (nic nie znika po cichu).

## Autonomous decisions

1. **Następny krok: `/10x-research`, nie `/10x-plan`.** Wybrane: research. Odrzucone: plan od razu. Dlaczego: nowy
   rodzaj czynności (etap) przecina `rooms.ts`, `variantPanel.ts`, `RoomScene.dispatch`, `RoomTaskButton`, hook e2e i
   dwa spec'e; geometria z manifestu zmienia `roomHit`/`slotBox`; naprawa zapisów dotyka `main.ts` i podglądu importu;
   ekran ładowania i budżet precache to nowe terytorium. Zmieniłoby: nic (krok narzucony przez orkiestratora).
2. **Etap tła = rodzaj czynności w danych, stan tylko z `tasksDone`.** Wybrane: `RoomTaskDef` z `kind: 'stage'`
   (bez `slot`, bez wariantów), zakup bez panelu wariantów; tło „po” od chwili, gdy indeks etapu < `tasksDone`.
   Odrzucone: etap jako slot z wpisem `chosen[...] = 0` (fałszywy wariant, myli panel i znacznik naprawy); nowe pole
   w `RoomState` (v3). Dlaczego: v2 bez zmian, model gotowy na kolejne etapy i sloty dopisywane na końcu (brief P3).
   Zmieniłoby: research pokaże, że coś czyta `chosen` jako listę zrobionych czynności (np. `saveSummary`, hook).
3. **Przeliczenie starego salonu: zachowanie wartości, wariant tam, gdzie mebel istnieje.** Rekomendacja dla planu
   (plan rozstrzyga i zapisuje dla maintainera): `spent` = suma starych kosztów pierwszych `tasksDone` czynności;
   nowy `tasksDone` = najdłuższy prefiks nowej listy o sumie kosztów ≤ `spent`, a nadwyżka `spent − suma prefiksu`
   wraca jako gwiazdki (nic nie ginie, gwiazdek nigdy nie ubywa); wybrany wariant przechodzi dla `sofa`, `rug`,
   `table→coffee-table`, `shelf→cabinet`, `picture→wall-frames`, jeśli slot jest w prefiksie, inaczej 0; stary pokój
   gotowy (96) → nowy gotowy, gdy suma nowej listy ≤ 96. Odrzucone: przeliczenie „po dowodach” (etap zrobiony, gdy
   floor lub walls; meble po starych id) — daje dziury w prefiksie (np. obrazki kupione, fotel nie), których
   pozycyjny `tasksDone` nie wyrazi bez zwrotu albo darmowego mebla; brak przeliczenia (stary `tasksDone` 3 = etap +
   sofa + dywan za 18 gwiazdek zamiast 7 czynności). Dlaczego: jedna reguła, idempotentna, zgodna z „nothing the child
   bought may be lost silently”. Zmieniłoby: maintainer woli bez zwrotu (wtedy nadwyżka przepada jawnie w notatce) albo
   research pokaże, że karta „Pokój gotowy!” wyskoczy ponownie po przeliczeniu (wtedy flaga widoku, nie zapis).
4. **Koszty 5–15 na 7 czynności, suma i tempo w danych; S-17 stroi.** Wybrane: plan proponuje krzywą rosnącą
   (np. etap 5, potem 7…15) i zapisuje sumę oraz „ile czystych rund” w artefakcie; stara suma 96 ≈ 14 czystych rund.
   Zmieniłoby: maintainer poda koszty.
5. **Atlas tekstur poza zakresem.** Wybrane: luźne WebP przez `npm run art` (jak S-14), osobny folder
   `public/assets/rooms/salon/` i osobna tabela (np. `ROOM_ART`) wpięta w `BootScene` i `artHealth`. Odrzucone: atlas
   (paker = nowa zależność lub natywne narzędzie, zmiana `ArtImage` i `artHealth` na ramki). Dlaczego: kontrakt każe
   rozszerzyć istniejący skrypt; zysk atlasu dla ~25 dużych obrazów jest mały. Zmieniłoby: budżet precache/ładowania
   przekroczony przy pomiarze albo drugi pokój.
6. **Ekran ładowania rysowany kodem w `BootScene`, bez nowej sceny.** Wybrane: tło i pasek postępu z tokenów, tytuł z
   `pl.ts`, DESIGN-GAP → brief P2.2. Odrzucone: osobna scena Preload (więcej przejść, hook e2e i granica błędów dla
   nowej sceny). Zmieniłoby: research pokaże, że `BootScene.create` musi rysować nad czymś, co `preload` blokuje.
7. **Zakres follow-upów** jak w tabeli wyżej: w zakresie wszystkie o salonie, karta odblokowania (książka z istniejącej
   ikony), V2/V3/F4/F6; poza — ekran zadań (termometr, podświetlenie, O3, ` = ?`), narrator, SPATIAL, portfel, font,
   dźwięk. Odrzucone: cała lista `Trigger: S-16` (rozmywa slice na ekran zadań bez nowej grafiki). Zmieniłoby: plan
   wykaże wolny budżet po fazach salonu — wtedy `spokenCelsius` „minus” → `pl.speech.minus` (jedna linia) wchodzi.
