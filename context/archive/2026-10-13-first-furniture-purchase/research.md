---
date: 2026-10-13T10:19:22+02:00
researcher: Claude (autonomous run 2026-10-13-s09-s11, krok research)
git_commit: 77c94d4
branch: feat/first-furniture-purchase
repository: Martynka-urzadza
topic: "S-09 first-furniture-purchase: jedno saldo gwiazdek zamiast TaskScene.sessionStars, wejście HUD nad panelem wariantów, odczyt pokoju w haku e2e (ryzyko #16), geometria salonu 1920×1080, animacja zatwierdzenia i „ogranicz ruch” w Phaser 4, kopia i luki kitu"
tags: [research, room, stars, wallet, purchase, variant-panel, hud, e2e-hook, reduced-motion, phaser4-particles, design-gaps]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: pierwszy mebel za gwiazdki (S-09)

**Date**: 2026-10-13T10:19:22+02:00
**Researcher**: Claude (autonomous run 2026-10-13-s09-s11)
**Git Commit**: 77c94d4
**Branch**: feat/first-furniture-purchase
**Repository**: Martynka-urzadza

Lessons: `lessons.md` w `context/foundation/` nie istnieje — nic nie zastosowano. Kotwice: plik + symbol, bez numerów
linii (kontrakt runu). Zakres jest mały (5 scen, ~3000 linii w `src/scenes`, `src/ui/widgets`, `src/data/layout.ts`),
więc wszystko przeczytano w głównym kontekście, bez pracowników. Nie uruchamiano buildów ani testów (krok docs-only).

## Research Question

Niewiadome z `change.md` / `handoff.md` §5: (1) jak `TaskScene` przestaje być właścicielem salda (`sessionStars`,
zerowanie `REGISTRY_KEYS.stars` w `TaskScene.create`, lot gwiazdki); (2) wejście HUD (`UIScene`: „Do pokoju”,
`SettingsIcon`) przy otwartym panelu wariantów; (3) odczyt pokoju w haku e2e pod ryzyko #16; (4) geometria
placeholderów 10 slotów w 1920×1080; (5) czasy `ANIMATION` i wykrywanie „ogranicz ruch” w Phaser; plus follow-upy z
`Trigger: S-09`, wiązanie kitu i kopia.

## Summary

1. **Saldo.** Dziś saldo = `TaskScene.sessionStars + state.starsEarned`, publikowane do `REGISTRY_KEYS.stars` przez
   `TaskScene.syncStars`; jedyni czytelnicy rejestru to `UIScene` (licznik) i nikt więcej (`grep REGISTRY_KEYS.stars`
   w `src/` i `tests/`). `TaskScene.create` uruchamia się raz na sesję (jedyne `scene.start(task)` to `BootScene.create`
   i `WelcomeScene`; `TaskScene` nigdy nie jest restartowany — `applyParentStage` mówi „No scene restart”), więc zerowanie
   w `create` to de facto „zimny start = 0”. Rekomendacja: saldo żyje w rejestrze jako jedyne źródło, inicjowane w
   `main.ts` (`preBoot`, obok `settings`), `TaskScene` dopisuje **różnicę** `state.starsEarned - before` (czysta funkcja
   `earn` w core), `RoomScene` odejmuje tylko przez czysty zakup. Pole `sessionStars` znika.
2. **HUD nad panelem.** W pokoju z HUD aktywne są tylko licznik (bez wejścia) i zębatka; „Do pokoju” jest ukryte
   (`roomSwitch=false` ustawiane w `toRoom`), głośnik ukryty (`narration=null`). Zębatka otwiera dialog DOM przez
   `openInputSession`, który wyłącza całe wejście gry — panel w canvasie jest wtedy bezpieczny bez dodatkowego kodu.
   Wystarczy, że panel nie zachodzi na prostokąt zębatki (`HUD_LAYOUT.settings`: 1782–1878 × 952–1048).
3. **Hak e2e.** Wzorzec gotowy: `RoomScene.resumeTarget()` + `inRoom()` w `installE2EHook`. Dodać `RoomScene.snapshot()`
   / `targets()` (pokój, bieżące zadanie, stan panelu, cele przycisku zadania, 3 miniatur, „Wybieram”, „Zamknij”) i
   `null` poza pokojem; `starsTotal` w snapshocie zadania ma czytać saldo z rejestru.
4. **Geometria.** Wolny obszar pokoju to `ROOM_LAYOUT.panel` (180–1740 × 204–1044) minus pas dolny przycisków
   (`ROOM_LAYOUT.resume` 720–1200 × 892–1008) i róg zębatki; propozycja układu niżej.
5. **Animacja.** Phaser 4.2.1 ma `this.add.particles(x, y, texture, config)` i `ParticleEmitter.explode`, tekstura z
   `Graphics.generateTexture`; Phaser nie ma API „ogranicz ruch” (brak trafień w `node_modules/phaser/types/phaser.d.ts`)
   — wykrywać `window.matchMedia('(prefers-reduced-motion: reduce)')` na krawędzi UI (core nie może czytać `window`).
   Uwaga: dzisiejszy lot gwiazdki (`TaskScene.flyStar`) też ignoruje „ogranicz ruch”, wbrew planowi §9 i kitowi.

## Detailed Findings

### 1. Kto dziś trzyma gwiazdki i jak przenieść saldo (decyzja 1 z change.md)

- `src/scenes/TaskScene.ts` `TaskScene`: pole `sessionStars` („stars of finished rounds; the open round adds
  state.starsEarned”). Zapisy salda do rejestru: `create` (`registry.set(stars, 0)`), `syncStars`
  (`sessionStars + state.starsEarned`), `applyParentStage` (`sessionStars += state.starsEarned` i set). `beginRound`
  przenosi `state.starsEarned` do `sessionStars` bez zapisu (suma się nie zmienia). Odczyty sumy: `currentSummary`
  (`starsTotal` dla `summaryView`) i `snapshot().starsTotal`.
- `src/core/round.ts`: `starsEarned` rośnie w dokładnie dwóch miejscach — przy zapłaconej odpowiedzi (`phase: 'done'`,
  `starsEarned + paid`) i przy zakończeniu rundy (bonus, `starsEarned + bonus`). Obie ścieżki w scenie przechodzą przez
  `syncStars(before, …)` (`submit` po `answer`, `advance` po `next`); `nextSolutionStep` nie zmienia `starsEarned`.
  Zatem model „dopisz deltę `after - before` przy każdej z tych dwóch ścieżek” daje tę samą sumę co dziś i nie liczy
  niczego podwójnie (delta jest liczona z tego samego `before`).
- Wywołania startu: `src/scenes/BootScene.ts` `create` → `scene.start(welcome | task)`; `src/scenes/WelcomeScene.ts` →
  `scene.start(SCENE_KEYS.task)`. Innego `start`/`restart` `TaskScene` w `src/` nie ma (grep `scene.start|restart`).
  Wniosek: przeniesienie inicjalizacji salda z `TaskScene.create` do `main.ts` (`preBoot`, gdzie już są `narrator`,
  `month`, `settings`) nie zmienia zachowania, a S-11 podmieni tam wartość z zapisu.
- Konsumenci, których to dotyka: `src/scenes/UIScene.ts` (`create` czyta `stars`, słucha `changedata-stars` — bez
  zmian, spadek wartości przy zakupie działa tak samo); e2e: `tests/e2e/task-round.spec.ts` i
  `tests/e2e/parent-settings.spec.ts` sprawdzają `snapshot.starsTotal` (np. `ROUND_LENGTH + 2`, `1` po zmianie etapu).
  Gdy `starsTotal` = saldo z rejestru, te asercje zostają prawdziwe, dopóki spec nie kupuje (żaden dziś nie kupuje).
- `src/core/round/summary.ts` `SummaryContext.starsTotal` już mówi „the caller decides which total it passes”; po
  zmianie scena podaje saldo z rejestru (już z dopisanym zarobkiem rundy). `tests/summary.test.ts` pokrywa progi
  `roomHighlighted` (9/10 → false, 10/10 → true).
- **Lot gwiazdki nie zależy od pola**: `flyStar(from)` dostaje tylko punkt startu, licznik HUD dostaje wartość od razu
  (`syncStars`). Nic nie zmusza `TaskScene` do lokalnego salda — warunek „co zmieniłoby odpowiedź” z decyzji 1 nie
  zachodzi.

Rekomendacja dla planu: `src/core/` (np. `stars.ts` albo w `rooms.ts`) — `earn(balance, delta)` (delta ≥ 0) i zakup z
pkt 2 niżej; `REGISTRY_KEYS.stars` zostaje kluczem salda (komentarz: „the child's star balance, the one source; task
scene adds, room purchase subtracts”); `TaskScene.sessionStars` usunięte, `starsTotal` czytane z rejestru.

### 2. Czysta logika zakupu i panelu (ryzyko #16)

- Typy są gotowe i nieużywane: `src/core/types.ts` `SlotDef` (`id`, `x`, `y`, `depth`, `emptyFrame?`,
  `variants: [string, string, string]`), `RoomTaskDef` (`id`, `slot`, `label`, `cost`), `RoomDef` (`id`, `name`,
  `background`, `slots`, `tasks` „completed in order”), `RoomState` (`tasksDone`, `chosen: Record<string, 0|1|2>`),
  `SaveState` (`stars`, `rooms: Record<string, RoomState>`, `currentRoom`). Brak `src/core/rooms.ts` i
  `src/data/rooms.ts` (sprawdzone `ls`).
- Bieżące zadanie = `room.tasks[state.tasksDone]` albo brak (po ostatnim). Koszt do `summaryView.nextRoomTaskCost` =
  koszt bieżącego albo `null`.
- Test-plan `context/foundation/test-plan.md`, ryzyko #16 (tabela ryzyk i wiersz strategii): „Over every order of taps a
  confirmed choice deducts its cost exactly once; opening, cancelling or a tap while short deducts nothing; the balance
  never goes below zero; a repeated tap on »Wybieram« does not buy twice”; poziom: unit/property na czystej logice +
  jedno lokalne e2e ścieżki dotyku po S-09; anty-wzorzec: sprawdzanie tylko etykiety licznika zamiast salda.
- Rekomendowany kształt (do decyzji planu): reduktor panelu `closed → open(preview: null | 0|1|2) → closed`, zdarzenia
  `openTask`, `pick(i)`, `confirm`, `close`; `confirm` bez podglądu lub przy za małym saldzie = brak zmiany; `confirm`
  zamyka panel w tym samym kroku, więc drugie stuknięcie „Wybieram” trafia w stan `closed` i nic nie robi. Zakup to
  jedna czysta funkcja `(roomDef, roomState, stars, variant) → { roomState, stars } | refusal`. Test własnościowy:
  losowe sekwencje zdarzeń (seeded `src/core/rng.ts`), niezmienniki: saldo ≥ 0; `start - koniec = suma kosztów zadań
  kupionych`; `tasksDone` rośnie o 1 tylko przy `confirm`.

### 3. Wejście HUD przy pokoju i panelu

- Kolejność scen `src/main.ts`: `[BootScene, WelcomeScene, TaskScene, RoomScene, UIScene]` („draw order (UIScene last,
  on top)”). `UIScene` jest uruchamiany przez `TaskScene.create` (`scene.launch(ui)`), więc nad pokojem jest zawsze.
- `UIScene` („Input is on only for the speaker, the switch and the gear: no full-screen or background zone here”):
  `roomSwitch` widoczny tylko przy `registry.roomSwitch === true`, a `TaskScene` (handler `toRoom`) ustawia `false`
  przed `scene.switch(room)`; głośnik widoczny tylko przy niepustym `narration`, a `toRoom` ustawia `null`. Wniosek:
  w pokoju jedyny aktywny przycisk HUD to zębatka (`SettingsIcon`, `HUD_LAYOUT.settings`).
- `UIScene.openSettings`: `openInputSession(suspender)` (`src/core/inputSuspend.ts`) — dialog DOM trzyma jedyny
  przełącznik wejścia gry, więc przy otwartej bramce/ustawieniach panel wariantów w canvasie nie dostaje stuknięć; po
  zamknięciu stan panelu w `RoomScene` zostaje. Zmiana etapu z pokoju czeka na `wake` `TaskScene` (`onParentStage`
  ignoruje uśpioną scenę, `onWake` stosuje). Panel wariantów w canvasie **nie** potrzebuje `openInputSession` ani
  follow-upu „single holder suspend()” (ten dotyczy tylko nakładek wołających `suspend()`).
- Follow-up „wspólny przycisk HUD” (`Trigger: S-09 or the next change to a HUD button`): S-09 nie musi zmieniać
  `SpeakerButton` ani `RoomSwitchButton` (licznik dostaje saldo przez istniejący `changedata-stars`) → poza zakresem,
  o ile plan nie zmieni przycisku HUD.
- Narracja w pokoju: dziś `null` → głośnik ukryty. Etykiety zadań („Wstaw kanapę”) są tylko tekstem; dziecko E1, które
  nie czyta, nie usłyszy ich. Opcja taniego domknięcia: `RoomScene` ustawia `REGISTRY_KEYS.narration` na etykietę
  bieżącego zadania (głośnik HUD ją czyta; brak auto-czytania w pokoju). Wybór produktowy dla planu (rekomendacja: tak,
  sama etykieta, bez kosztu — bez rzeczownika nie ma odmiany). `TaskScene.onWake` → `render()` i tak nadpisze
  narrację po powrocie.
- `RoomScene.create` re-armuje „Wróć do notesu” na `wake`; ten sam wzorzec potrzebny dla przycisku zadania (saldo mogło
  wzrosnąć między wizytami → przeliczyć stan przycisku na `wake` i na `changedata-stars`).

### 4. Hak e2e (tylko build e2e)

- `src/testing/e2eHook.ts` `installE2EHook`: `inRoom()` = `game.scene.isActive(room)`; `targets.resume` =
  `room().resumeTarget()` w pokoju, `nextRound`/`toRoom`/`unlockNext` = `null` w pokoju (follow-up z
  `2026-10-12-narrator-round-summary` już zrobiony). `RoomScene` jest tworzony przy pierwszym `switch`, więc przed
  pierwszą wizytą jego pola są puste — nowe gettery muszą być wołane tylko pod `inRoom()` (jak `resumeTarget`).
- `tests/e2e/support/hook.ts` `Snapshot`/`Targets` to „union of what the specs read” — dopisać pola pokoju jako
  opcjonalne. Spec ryzyka #16 osiąga stan przez produkt (profil §9): runda(y) dają gwiazdki → „Do pokoju” → przycisk
  zadania → miniatura → „Wybieram” ×2 → saldo spadło raz. Koszt pierwszego zadania (5) wymaga jednej czystej rundy
  (5 + 2 = 7 gwiazdek, `balance.round`), więc ścieżka „za mało” jest dostępna przed rundą lub po jednej z błędami.
- `vite/e2eHookGuard.mjs` pilnuje markerów haka w `dist/`; nowe metody `RoomScene` (np. `snapshot`) nie są markerami —
  zachować wzorzec „scena nie importuje haka”.

### 5. Geometria salonu (propozycja, do planu)

- Dane: scena 1920×1080 (`GAME_WIDTH/HEIGHT`), cel ≥ 96 px (`MIN_TOUCH_TARGET`, testy w `tests/layout.test.ts` dla
  każdej tablicy `*_TOUCH_TARGETS`). Obecne: `ROOM_LAYOUT.panel` 180/204/1560×840, `resume` 720/892/480×116, HUD górny
  pas do y≈148 (`HUD_LAYOUT.speaker`, `TASK_LAYOUT.starCounter`), zębatka 1782/952/96×96.
- Propozycja: pokój (tło + sloty) w 180–1740 × 204–860; pas dolny y 880–1020: „Wróć do notesu” przesunięte w lewo,
  przycisk zadania (etykieta + gwiazdka + koszt, wyszarzony „masz X/Y”) w środku/prawo, poza zębatką. Panel wariantów
  zastępuje pas dolny (taca ~ y 800–1040, x 300–1700): 3 miniatury ≥ 160×160, „Wybieram” i „Zamknij” ≥ 96 px wysokości;
  sloty umieszczone tak, by podgląd nad tacą był widoczny (sloty mebli y < 800, podłoga/ściany jako duże pasy tła).
  Nowa tablica `ROOM_TOUCH_TARGETS` (albo wpisy w istniejącej) dla testu ≥ 96 px. „Wróć do notesu” przy otwartym panelu:
  rekomendacja ukryć (jedna droga wyjścia = „Zamknij”, zgodnie z decyzją 4).
- Warianty: 3 kolory na slot z palety style guide (`designs/martynka-maths-A-v1/style-guide.md` „Palette and
  rendering”: turquoise, butter, oak `#C99B66`, terracotta `#C98460`, pale leaf) — dziś w `PLACEHOLDER_COLORS` nie ma
  oak ani terracotta; dodać je w `src/data/layout.ts`. Wariant musi różnić się też kształtem/wzorem lub podpisem
  (plan §9 „żadna informacja wyłącznie kolorem”); `SlotDef.variants` to „atlas frame keys” — dla placeholderów klucz
  może wskazywać wpis palety/wzoru w danych.

### 6. Animacja, „ogranicz ruch”, dźwięk

- `src/data/layout.ts` `ANIMATION` ma tylko potrząśnięcie i lot gwiazdki; nowe czasy (pop skali, cząsteczki) trafiają
  tam (zasada: brak liczb w scenach).
- Phaser 4.2.1 (`node_modules/phaser/package.json`): `GameObjectFactory.particles(x?, y?, texture?, config?)`,
  `ParticleEmitter.explode(count?, x?, y?)`, `Graphics.generateTexture(key, w?, h?)` w `types/phaser.d.ts`; brak API
  reduced-motion w typach Phaser. Jedyne `matchMedia` w `src/` to `src/pwa/platform.ts` (wstrzykiwany `win`); CSS
  `src/style.css` `@media (prefers-reduced-motion: reduce)` obejmuje tylko `.rotate-icon`.
- `TaskScene.flyStar` nie sprawdza „ogranicz ruch”, choć plan §9 („animacja lotu gwiazdki wyłączona”) i kit
  (`screen.css` `.flying-star` → `display:none` przy reduce; style guide „Reduced-motion settings suppress the travel
  animation”) tego wymagają — luka sprzed S-09. Rekomendacja: jeden helper w `src/ui/` (np. `reducedMotion()` z
  wstrzykiwanym `matchMedia`, jak `platform.ts`), użyty przez animację zatwierdzenia; podpięcie `flyStar` tanie i w
  duchu follow-upu „star flight” (pkt 7) — decyzja planu.
- Dźwięk: brak plików audio w `public/` i brak `this.sound` w `src/` (change.md, handoff §3); `Martynka-urzadza.md` §9:
  „Gra jest w pełni grywalna bez dźwięku”. Decyzja 5 (dźwięk → DESIGN-GAP + `[human]`) bez zmian.

### 7. Follow-up: gwiazdka w locie przy „Do pokoju”

- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`: „A star still in flight when the child
  taps »Do pokoju« stops while `TaskScene` sleeps and finishes its flight after »Wróć do notesu«”. Przyczyna: tweeny
  sceny stoją, gdy scena śpi. `flyStar` nie trzyma referencji do gwiazdy. Rekomendacja: w handlerze `toRoom` w
  `TaskScene.create` zakończyć/zniszczyć gwiazdy w locie (np. lista aktywnych gwiazd albo `tweens.killAll()` na
  obiektach gwiazd) przed `scene.switch`; nie dotyczy kamery (potrząśnięcie ma własny reset).

### 8. Kit i kopia

- Kit (`designs/martynka-maths-A-v1/preview.js` ekran `room`, `screen.css` `.room-view`, `.resume`): pokój = tło
  `assets/room.png` na całą scenę, `.return-note` (gwiazdka + saldo) i „Wróć do notesu” (bottom 72, left 720, 480×116).
  Nic więcej: brak przycisku zadania, slotów, panelu, miniatur, „Wybieram”, animacji, dźwięku → DESIGN-GAP (a)–(e) z
  change.md, wiersze od 31 w `docs/design-gaps.md` (ostatni istniejący: 30). Wiersze do aktualizacji: 10 (podświetlenie
  „Do pokoju” staje się osiągalne), 12 (napis „Tu powstanie pokój” znika; `pl.room.caption` i `ROOM_LAYOUT.caption` do
  usunięcia).
- Kopia ze specyfikacji: „Wybieram” (plan §2/§7, PRD FR-017, US-02), „masz X/Y” (plan §7, FR-016), „Napraw podłogę”,
  „Wstaw kanapę” (plan §2, `types.ts` komentarz `RoomTaskDef.label`), „Wróć do notesu” (`pl.room.resume`). „masz X/Y”
  to same cyfry bez rzeczownika — `src/core/text/plural.ts` niepotrzebny; kontrakt runu wspomina „masz 3/5 gwiazdek”,
  ale to tylko przykład stylu: gdyby plan dodał rzeczownik, odmiana przez `plural.ts`, a „gwiazdka” już jest w
  `src/data/nouns.ts` (`gwiazdka: ['gwiazdka', 'gwiazdki', 'gwiazdek']`). Nowe napisy bez źródła (teacher read): 8 pozostałych etykiet zadań, „Salon”,
  „Zamknij”, ewentualna narracja.
- US-02 AC „Po ostatnim zadaniu pokazuje się »Pokój gotowy!«” i „przytrzymanie … zmiana wariantu jest darmowa” należą do
  S-10 (roadmapa); S-09 kończy się zniknięciem przycisku zadania (decyzja 4).

## Code References

- `src/scenes/TaskScene.ts` — `sessionStars`, `create` (zerowanie `stars`, handler `toRoom`, `onWake`),
  `syncStars`, `flyStar`, `applyParentStage`, `beginRound`, `currentSummary` (`nextRoomTaskCost: null`), `snapshot`.
- `src/core/round.ts` — dwa miejsca wzrostu `starsEarned` (odpowiedź zapłacona, bonus końca rundy).
- `src/core/round/summary.ts` — `SummaryContext`, `summaryView.roomHighlighted`.
- `src/scenes/RoomScene.ts` — `create`, `resumeTarget`, re-arm na `wake`.
- `src/scenes/UIScene.ts` — `create` (licznik, `changedata-stars`, widoczność przełącznika/głośnika), `openSettings`.
- `src/core/inputSuspend.ts` — `openInputSession`.
- `src/main.ts` — lista scen, `preBoot` inicjalizacja rejestru.
- `src/core/types.ts` — `SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState`, `SaveState`.
- `src/data/layout.ts` — `ROOM_LAYOUT`, `HUD_LAYOUT.settings`, `ANIMATION`, `PLACEHOLDER_COLORS`, `*_TOUCH_TARGETS`,
  `REGISTRY_KEYS`.
- `src/data/pl.ts` — `room.caption`, `room.resume`.
- `src/testing/e2eHook.ts` — `installE2EHook`, `inRoom`; `tests/e2e/support/hook.ts` — `Snapshot`, `Targets`.
- `tests/summary.test.ts`, `tests/layout.test.ts`, `tests/e2e/task-round.spec.ts` (#11), `tests/e2e/parent-settings.spec.ts`.
- `src/pwa/platform.ts` — wzorzec wstrzykiwanego `matchMedia`.

## Architecture Insights

- Rejestr gry jest szyną stanu sesji (learner, settings, stars, narration); S-11 zapisze dokładnie te klucze — saldo i
  stan pokoju w rejestrze (np. `REGISTRY_KEYS.rooms: Record<string, RoomState>` i `currentRoom`, kształt `SaveState`)
  ułatwiają S-11 i nie wymagają migracji.
- Sceny przechodzą przez `scene.switch` (sleep/wake), nie restart: stan sceny przeżywa, ale musi się odświeżać na
  `wake` (wzorzec `RoomScene` re-arm, `TaskScene.onWake`).
- Granice ESLint: `src/core` bez Phasera i `window`; `src/data` importuje z core tylko `core/text/*` i typy — dane salonu
  w `src/data/rooms.ts` mogą importować tylko typ `RoomDef`.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` — trzy wpisy `Trigger: S-09`
  (`nextRoomTaskCost`, wspólny przycisk HUD, gwiazdka w locie); wpis o `null` w haku już zrealizowany (kod
  `installE2EHook`).
- `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` — przełącznik FR-011 zamknięty w S-05
  (`RoomSwitchButton`).
- `context/archive/2026-10-13-parent-settings-progress/research.md` — wejście gry pod dialogami DOM (`openInputSession`),
  long press (S-10 go użyje).

## Related Research

- `context/archive/2026-10-13-parent-settings-progress/research.md`

## Open Questions (wybory produktowe dla planu, z rekomendacją)

1. Narracja etykiety zadania w pokoju przez głośnik HUD — rekomendacja: tak (sama etykieta).
2. `TaskScene.flyStar` i „ogranicz ruch” — rekomendacja: podpiąć ten sam helper (mała zmiana, zgodna z planem §9).
3. „Wróć do notesu” przy otwartym panelu — rekomendacja: ukryte.
4. Lista 10 slotów i krzywa kosztów 5–15 — decyzja 2 z change.md, wiersz `[human]`.
