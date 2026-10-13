---
date: 2026-10-13T01:28:16+02:00
researcher: Claude (autonomous run 2026-10-12-s04-s08, krok research)
git_commit: fb871b2
branch: feat/first-launch-placement
repository: Martynka-urzadza
topic: "S-06 first-launch-placement: wiek + miesiąc → etap, rozgrzewka, bramka dla dorosłego, przepływ Boot → Welcome → Task, e2e, powitanie przy każdym starcie do S-11"
tags: [research, placement, welcome-scene, parent-gate, warm-up, dom-overlay, e2e-hook, phaser-input]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run)
---

# Research: pierwsze uruchomienie i dobór etapu (S-06)

**Date**: 2026-10-13T01:28:16+02:00
**Researcher**: Claude (autonomous run 2026-10-12-s04-s08)
**Git Commit**: fb871b2
**Branch**: feat/first-launch-placement
**Repository**: Martynka-urzadza

Lessons: plik `lessons.md` w `context/foundation/` nie istnieje (sprawdzone `ls context/foundation/`), żadna lekcja
nie została zastosowana. Kotwice to plik + symbol, bez numerów linii (kontrakt runu).

## Research Question

Z `change.md` (§ Open questions for /10x-research, Autonomous decisions 1–4) i polecenia kroku:

1. Dokładna reguła wiek + miesiąc → etap (rok szkolny wrzesień–czerwiec, półrocza, wiek 6–10, lipiec/sierpień,
   6 lat przed szkołą, „tryb z obrazkami”).
2. Rozgrzewka: 6 zadań z których kroków, jaki wynik obniża etap o jeden, nigdy poniżej E1, nigdy w górę.
3. Bramka dla dorosłego: nakładka DOM nad canvasem, wprowadzanie liczby na tablecie, zła odpowiedź = nowe działanie,
   bez blokady; dostępność.
4. Przepływ BootScene → Welcome → Task z uczniem w rejestrze gry.
5. Jak oba istniejące specy e2e przechodzą powitanie (wspólny helper, hak tylko do odczytu, nieobecny w produkcji)
   i jakie nowe ryzyko e2e dopisać do test-planu.
6. Wpływ „powitanie przy każdym starcie do S-11” na codzienne używanie produkcji i najmniejsza uczciwa mitygacja
   w tym slice.

## Summary

- **Reguła etapu** to dosłownie tabela `docs/ZADANIA.md` §1 „Wybór poziomu na starcie”: trzy pasma miesięcy
  (wrzesień–styczeń, luty–czerwiec, lipiec–sierpień) × wiek 6, 7, 8, 9, 10+. Kolumna lipiec–sierpień jest w tabeli
  identyczna z luty–czerwiec dla każdego wieku (E1, E2, E4, E6, E6). Wiek 6 → E1 w każdym miesiącu; „tryb z
  obrazkami” (tylko 6 lat, wrzesień–styczeń) nie istnieje w kodzie i jest poza zakresem. **Ważne:** dla persony z PRD
  (7 lat, klasa 2 w 2026/27, etap E3) tabela w październiku proponuje **E1** — dwa etapy za nisko; dlatego zmiana
  etapu przez rodzica jest główną ścieżką, nie wyjątkiem (PRD FR-012 Socrates: „rodzic ustawia etap przy pierwszym
  uruchomieniu, wiek tylko jako podpowiedź”).
- **Rozgrzewka:** dokumenty mówią tylko „6 zadań z bieżącego i poprzedniego etapu… dużo błędów → etap niżej,
  komplet → zostajemy” (`docs/ZADANIA.md` §1). Środek skali i skład nie są nigdzie zapisane — rekomendacja:
  3 zadania z całego poprzedniego etapu + 3 z pierwszych grywalnych kroków bieżącego etapu (pełne `pickSkills` na
  bieżącym etapie losuje też kroki jeszcze nieprzerabiane we wrześniu), liczona **tylko pierwsza próba**, etap −1 gdy
  poprawnych za pierwszym razem < 4 z 6 (próg i liczby w `balance.ts`); E1 bez rozgrzewki (nie ma etapu niżej).
- **Bramka:** wzorzec nakładek DOM już jest (`src/ui/dom/overlay.ts`), ale **Phaser przetwarza dotyk na nakładce
  DOM jak dotyk w canvasie**: przy domyślnym `input.windowEvents` `TouchManager.onTouchStartWindow` przekazuje
  `touchstart` z celem ≠ canvas do `InputManager.onTouchStart`, a `InputPlugin.update` robi hit-test i emituje
  `GAMEOBJECT_DOWN` dla obiektów pod palcem. Scena pod bramką musi mieć wyłączone wejście, inaczej stuknięcie w
  bramkę wciśnie przycisk wieku pod spodem. Do wpisywania odpowiedzi rekomendacja: przyciski cyfr w DOM zamiast
  klawiatury systemowej (body ma `-webkit-user-select: none` i `position: fixed`; klawiatura iPada w poziomie zasłania
  dolną połowę ekranu).
- **Przepływ:** `BootScene.create` dziś zawsze `scene.start(SCENE_KEYS.task)`; `TaskScene.create` czyta
  `balance.defaultStage` i jako jedyna uruchamia `UIScene`. Powitanie (kit `welcome.png`) nie ma HUD-u, więc
  `WelcomeScene` między nimi, uczeń w nowym kluczu rejestru, `TaskScene` czyta go w `create` i po rozgrzewce.
- **E2E:** hak dziś zakłada istniejącą rundę (`installE2EHook` → `task().snapshot()`), więc po S-06 oba specy rund
  utknęłyby w `beforeEach` (polling `phase === 'first'`). Wspólny helper: wiek **10** (zawsze E6, niezależnie od
  miesiąca) → bramka (odpowiedź liczona z tekstu DOM) → wybór **E3** (≠ propozycja ⇒ bez rozgrzewki) — specy grają dalej
  na E3 jak dziś. Seed (#8) nie zależy od powitania. Nowe ryzyko: **#12** (treść niżej) — wpis do test-planu jako
  follow-up dla `/10x-test-plan refresh`.
- **Powitanie przy każdym starcie:** S-11 jest 5 slice'ów dalej (S-07…S-10 przed nim, `roadmap.md` At a glance).
  Do tego czasu każdy zimny start na produkcji wymaga dorosłego przy tablecie; dziecko samo (persona PRD: „sama, po
  szkole”) **nie uruchomi gry**, choć dziś może. To realna regresja codziennego użycia. Najmniejsza uczciwa mitygacja
  w slice: nie ukrywać jej (wiersz `[human]`), skrócić ścieżkę rodzica do minimum i przygotować jeden szew dla S-11;
  decyzja o wcześniejszym zapisie samego ucznia należy do opiekuna (follow-up), nie do tego slice'u.

## Detailed Findings

### 1. Wiek + miesiąc → etap

Źródło reguły: `docs/ZADANIA.md` §1 „Wybór poziomu na starcie” (tabela) i „Etapy” (E1 = klasa 1, I półrocze …
E6 = klasa 3, II półrocze). PRD FR-012 i `Martynka-urzadza.md` §2 p. 1 tylko odsyłają („gra proponuje etap wg wieku
i miesiąca”), nie podają innej tabeli — brak sprzeczności.

| Wiek | wrzesień–styczeń (`getMonth()` 8–11, 0) | luty–czerwiec (1–5) | lipiec–sierpień (6–7) |
|---|---|---|---|
| 6 | E1 („tryb z obrazkami”) | E1 | E1 |
| 7 | E1 | E2 | E2 |
| 8 | E3 | E4 | E4 |
| 9 | E5 | E6 | E6 |
| 10 (przycisk „10”; tabela: „10+”) | E6 | E6 | E6 |

- **Pasma miesięcy:** I półrocze kończy się z końcem stycznia (tabela tak tnie; ferie zimowe w Polsce zależą od
  województwa, tabela tego nie rozróżnia i nie ma powodu, by gra rozróżniała). JS `Date.getMonth()` liczy od 0, więc
  wrzesień = 8, styczeń = 0 — pasmo „wrzesień–styczeń” przechodzi przez zmianę roku; test na każdy z 12 miesięcy
  jest tani i potrzebny.
- **Lipiec–sierpień** = ten sam etap co luty–czerwiec (dziecko właśnie skończyło półrocze; tabela wybiera powtórkę,
  nie następną klasę). Trzecia kolumna jest więc redundantna w wartościach, ale tabela ją ma — rekomendacja: dane
  w `src/data/` z trzema pasmami (dosłownie jak tabela), żeby korekta autora nie wymagała zmiany kodu.
- **6 lat:** E1 zawsze; nie ma etapu niższego. „Tryb z obrazkami” nie istnieje: E1 to dziś same kafelki
  (`src/data/curriculum/E1.ts`, umiejętności `answer: 'tiles'`), grafika liczenia przychodzi z S-13/S-14, a PRD
  wspomina „tryb z obrazkami” tylko jako złagodzenie po słabych rundach (Business Logic, S-07). Rekomendacja: poza
  zakresem, follow-up `Trigger: S-14` (lub S-07, jeśli złagodzenie go wprowadzi).
- **Miesiąc jako argument:** `eslint.config.mjs` zabrania w `src/core/**` globali `window`, `document`, `navigator`,
  `localStorage`, `speechSynthesis` (nie `Date`), ale funkcja czysta i testowalna dostaje miesiąc z zewnątrz
  (scena: `new Date().getMonth()`); tak samo w e2e da się go ustalić (`page.clock.setFixedTime`, niżej).
- **Persona vs tabela:** PRD „Persona główna” — 7 lat, klasa 2, E3 w 2026/27. Wiek 7 we wrześniu–styczniu → E1.
  Dziecko ma 7 lat w I półroczu klasy 2 tylko, gdy urodziło się we wrześniu–grudniu (dzieci idą do szkoły w roku,
  w którym kończą 7 lat — przypis pod tabelą). Tabela trafia w typowy przypadek, a dla córki autora — nie. To
  potwierdza decyzję 4 z `change.md`: rodzic zmieni etap (E1 → E3), więc rozgrzewki nie będzie; gdyby rozgrzewka
  działała zawsze, i tak nie podniosłaby etapu (nigdy w górę).

### 2. Rozgrzewka

Źródła: `docs/ZADANIA.md` §1 p. 3 („6 zadań z bieżącego i poprzedniego etapu… dużo błędów → etap niżej, komplet →
zostajemy”), PRD FR-012 („rozgrzewka 6 zadań koryguje start w dół”), PRD Open Question 1, `Martynka-urzadza.md`
§13. Nie ma liczby „dużo”, proporcji ani reguły środka skali — to luka dokumentów, nie sprzeczność.

Kod, na którym rozgrzewka stoi:
- `src/core/round.ts` `startRound(tasks, rules)` tnie `tasks.slice(0, rules.length)`; `RoundRules` ma `length`,
  `starPerTask`, `cleanRoundBonus`. Runda 6 zadań = te same reducery z `RoundRules` o `length: 6`.
- `RoundState.outcomes` per zadanie: `'first' | 'second' | 'retype'` — pierwsza próba jest jawna, więc ocena
  rozgrzewki to czysta funkcja na `outcomes`.
- `src/core/round/pick.ts` `pickSkills(stage, rng, count)` losuje **jednostajnie z całego etapu** (wszystkie kroki z
  grywalnymi umiejętnościami), `buildRound` z jednego etapu. Brak `unlockedStep` (S-07).
- Grywalne umiejętności per krok (zmierzone skryptem nad `src/data/curriculum` + `getGenerator`, format
  `krok:grywalne/wszystkie`): E1 `1:0/0 2:1/1 3:4/4 …`, E2 `1:1/1 2:0/0 3:1/1 …`, E3 `1:2/2 2:2/2 3:0/0 …`,
  E4 `1:1/1 2:1/1 3:0/0 …`, E5 `1:1/1 2:2/2 …`, E6 `1:1/1 2:0/0 3:0/0 4:2/2 …`. Pierwszy krok bywa pusty (E1),
  więc „pierwsze kroki” trzeba liczyć po krokach z grywalnymi umiejętnościami.
- `src/ui/widgets/ProgressDots.ts` `update(dots)` centruje dowolną liczbę kropek (`TASK_LAYOUT.dots`), więc 6 kropek
  się mieści; style guide mówi „Five progress dots belong to the round” — szósta kropka to mały DESIGN-GAP.
- `SummaryPanel` rysuje gwiazdkę na zadanie (design-gaps wiersz 11), więc podsumowanie 6 zadań działa bez zmian.

Rekomendacje (dla planu; wartości w `balance.ts`):
- **Skład:** 3 zadania z poprzedniego etapu (cały etap — jest już przerobiony) + 3 z pierwszych N grywalnych kroków
  bieżącego etapu (N = 2). Uzasadnienie: we wrześniu dziecko nie przerobiło jeszcze dalszych kroków bieżącego etapu,
  a `pickSkills` na pełnym etapie by je losował → fałszywe błędy → niesłuszne obniżenie. Kolejność: najpierw
  poprzedni etap (łagodny start). Losowanie przez ten sam `pickSkills` na przyciętym `StageDef` (np.
  `{ ...stage, steps: firstPlayableSteps }`) — bez nowej logiki losowania.
- **Próg:** etap −1, gdy liczba `outcomes === 'first'` < 4 z 6 (czyli 3 lub więcej błędów przy pierwszej próbie);
  4–6 → zostajemy. Liczy się tylko pierwsza próba (`docs/ZADANIA.md` §1 „Adaptacja”: „Liczy się tylko pierwsza
  próba”; druga próba nie liczy się do opanowania). Nigdy w górę, najwyżej o jeden, nigdy poniżej E1.
- **E1:** bez rozgrzewki (nie ma poprzedniego etapu i nie da się obniżyć) — zwykła runda od razu.
- **Gwiazdki i podsumowanie:** rozgrzewka płaci jak zwykła runda (PRD FR-007 nie zna wyjątku; „brak stanów porażki”
  w CLAUDE.md) i kończy się zwykłym podsumowaniem; korekta etapu jest cicha (dziecko nie widzi „spadłaś etap niżej”).
- **Moment korekty:** gdy rozgrzewka się kończy (`next` ustawia `finished`), nie przy „Kolejna runda” — „Do pokoju”
  z podsumowania i powrót nie mogą jej pominąć. Po korekcie `TaskScene` musi przeliczyć `autoRead`
  (`defaultAutoRead(stage.id, balance.narrator.autoReadStages)`), bo E3 → E2 włącza czytanie.
- **Rozgrzewka po decyzji rodzica:** zgodnie z `change.md` decyzja 4 — tylko gdy rodzic potwierdził propozycję;
  przy zmianie etapu (`stageOverriddenByParent = true`) brak rozgrzewki. To odpowiedź na PRD Open Question 1, więc
  plan potrzebuje wiersza `[human]`.

### 3. Bramka dla dorosłego (nakładka DOM)

Wymagania: PRD § Access Control („bramka dla dorosłego (np. proste działanie do rozwiązania)… chroni reset i zmianę
etapu przed celowym wejściem dziecka, nie tylko przed przypadkowym”), `Martynka-urzadza.md` §7, kontrakt runu
(„never a password or account; nothing leaves the device”), CLAUDE.md (brak stanów porażki).

**Istniejący wzorzec DOM:** `src/ui/dom/overlay.ts` (`createOverlay`, `createText`, `createButton` — przycisk na
`click`), `src/ui/dom/rotateOverlay.ts`, `src/pwa/installHint.ts` (`mountInstallHint`, przyciski w
`.overlay-actions`); style w `src/style.css` (`.overlay` = `position: fixed; inset: 0; z-index: 10`, przycisk
`min-height: 64px; min-width: 240px`; `.overlay-rotate` `z-index: 20`). Teksty w `src/data/pl.ts`. Komentarz w
`overlay.ts`: nakładki nie zatrzymują propagacji (Phaser odblokowuje audio pierwszym dotknięciem).

**Dotyk przechodzi pod nakładkę do Phasera (zweryfikowane w źródłach Phaser 4.2.1 w `node_modules/phaser`):**
- `src/input/touch/TouchManager.js` `onTouchStartWindow` / `onTouchEndWindow`: dla `event.target !== canvas` i
  `!event.defaultPrevented` wołają `manager.onTouchStart` / `onTouchEnd`; listenery na `window` są rejestrowane, gdy
  `manager.game.config.inputWindowEvents` (domyślnie `true`, `src/core/Config.js`).
- `src/input/InputManager.js` `onTouchStart` aktywuje wskaźnik bez sprawdzania celu; `Pointer.touchstart` liczy
  pozycję względem canvasu (`transformPointer`).
- `src/input/InputPlugin.js` `update` robi `hitTestPointer` i `processDownEvents` emituje `GAMEOBJECT_DOWN` dla
  trafionych obiektów; `downElement === canvas` decyduje tylko między `POINTER_DOWN` a `POINTER_DOWN_OUTSIDE`.
- Wniosek: pełnoekranowa nakładka DOM nad canvasem nie chroni obiektów Phasera pod spodem. Nasze przyciski
  (`PageButton`: `pointerdown` na strefie + akcja na `pointerup`, gdy wciśnięcie zaczęło się na niej) zadziałają
  przez nakładkę. **Gdy bramka/panel są otwarte, scena pod spodem musi mieć `this.input.enabled = false`** (wzorzec
  `this.input.enabled = true` jest w `UIScene.create`) albo ukryte/rozbrojone przyciski. Alternatywy gorsze:
  `input: { windowEvents: false }` w konfiguracji gry zmienia zachowanie całej gry (zdarzenia „outside”);
  `preventDefault` na `touchstart` nakładki zabija syntetyczny `click` przycisków DOM i odblokowanie audio.
- Ta sama dziura dotyczy dziś `installHint` (nakładka nad rundą; stuknięcie w nią może trafić kafelek pod spodem) —
  poza zakresem, follow-up.

**Wpisywanie odpowiedzi na tablecie:**
- `src/style.css`: `html, body { touch-action: none; user-select: none; -webkit-user-select: none; }` i
  `body { position: fixed; inset: 0; }`. Pole `<input>` dziedziczy `user-select: none`; w WebKit (iPad) pola pod
  `-webkit-user-select: none` bywają nieedytowalne lub nie dostają kursora — znane zachowanie WebKit, **nie
  zweryfikowane tu na urządzeniu**; wymagałoby `user-select: text` na polu i ręcznego testu na iPadzie.
- Klawiatura systemowa iPada w poziomie zajmuje mniej więcej dolną połowę ekranu, a przy `body { position: fixed }`
  Safari przesuwa widok — pole i działanie muszą stać w górnej części nakładki.
- **Rekomendacja:** klawiatura cyfr jako przyciski DOM w samej nakładce (0–9, „⌫”, „OK”) i odczyt jako tekst
  (`<output>` / element z `aria-live`), bez `<input>`: brak klawiatury systemowej, brak problemu `user-select`,
  stały układ w 1024×768, e2e stuka `locator.tap()` jak dorosły palcem. Dodatkowo obsługa klawiszy cyfr z fizycznej
  klawiatury (`keydown`) dla komputera — tanio. Gdyby plan wolał `<input inputmode="numeric">` (decyzja 2 w
  `change.md`), to z `user-select: text` na polu, polem w górnej połowie i wierszem `[human]` na iPadzie.
- **Działanie:** `change.md` decyzja 2 proponuje dwucyfrowa × dwucyfrowa (np. 23 · 14). Zakresy programu: E6 ma
  mnożenie „6 · 12, ·10, 4 · 70, 3 · 200” (`docs/ZADANIA.md` §2), a mnożenie pisemne nie występuje w E1–E6. Dwie
  rozsądne opcje do planu: (a) dwucyfrowa × dwucyfrowa (np. 13–29 × 13–29; trudne w pamięci także dla części
  dorosłych); (b) dwucyfrowa nieokrągła × jednocyfrowa 6–9 poza tabliczką (np. 37 · 8; wynik ≤ 3 cyfry, dorosły
  liczy w pamięci w kilka sekund, poza programem klas 1–3). Dla córki (E3) obie są poza zasięgiem; (b) jest
  „prostsza” w sensie PRD. Zakresy w `balance.ts`, logika czysta w `src/core/` z `rng` (`src/core/rng.ts`).
- **Zła odpowiedź:** nowe działanie i spokojny komunikat dla dorosłego (np. „Spróbuj jeszcze raz”), bez blokady
  czasowej, bez licznika prób. „Anuluj” wraca do wyboru wieku.

**Dostępność nakładki (DOM daje ją za darmo, canvas nie):** `role="dialog"`, `aria-modal="true"`,
`aria-labelledby` na nagłówek; `index.html` ma już `lang="pl"`; prawdziwe `<button>`; fokus na pierwszy element po
otwarciu i widoczny `:focus-visible`; `Escape` = „Anuluj”; komunikat o nowym działaniu w `aria-live="polite"`;
cele dotyku ≥ 64 px CSS (jak `.overlay button`; style guide: ≥ 48 CSS px przy 1024×768); znak mnożenia „·” jak w
generatorach (`src/core/tasks/generators/mult.ts`). Rotacja: `.overlay-rotate` ma `z-index: 20`, więc w pionie
zasłoni też bramkę — nowa nakładka musi mieć `z-index` < 20.

**Panel rodzica (wybór etapu):** też DOM (style guide: „Parent review controls belong outside the game scene”).
Sześć przycisków E1–E6 z opisem „klasa N, I/II półrocze” (`docs/ZADANIA.md` §1 „Etapy”), proponowany zaznaczony,
„Zatwierdź”. Kit nie ma tego widoku → DESIGN-GAP (`docs/design-gaps.md` ma dziś wiersze 1–14; następne 15+).

### 4. Przepływ scen i uczeń w rejestrze

- `src/main.ts` `createGame`: `scene: [BootScene, TaskScene, RoomScene, UIScene]`, `callbacks.preBoot` ustawia
  `REGISTRY_KEYS.narrator`. `src/data/layout.ts` `SCENE_KEYS` = `boot`, `task`, `room`, `ui`; `REGISTRY_KEYS` =
  `stars`, `narration`, `narrator`, `roomSwitch`.
- `src/scenes/BootScene.ts` `preload` ładuje font, `create` → `scene.start(SCENE_KEYS.task)`.
- `src/scenes/TaskScene.ts` `create`: `getStage(balance.defaultStage)` (jedyny czytelnik `defaultStage`),
  `defaultAutoRead(stage.id, …)`, `freshRound()` → `buildRound(this.stage, …)`, `scene.launch(SCENE_KEYS.ui)`;
  `startNextRound` → `freshRound()` z tym samym `this.stage`; `autoReadFirst` czyta tylko po „Dalej”/„Kolejna runda”.
- `src/scenes/UIScene.ts` (licznik, głośnik, „Do pokoju”) startuje tylko z `TaskScene` — kit `welcome.png` nie ma
  HUD-u, więc powitanie bez `UIScene` wychodzi naturalnie.
- **Rekomendowany szew:** `SCENE_KEYS.welcome` + `WelcomeScene` w liście scen; `BootScene.create` pyta czystą
  funkcję (`core`) „czy potrzebny placement” na podstawie ucznia z rejestru (dziś zawsze brak → powitanie; S-11 poda
  wczytany zapis); `WelcomeScene` po bramce i panelu zapisuje ucznia (pola w kształcie `LearnerState`: `age`,
  `stage`, `stageOverriddenByParent` z `src/core/types.ts`, plus flaga „rozgrzewka do zagrania”) w nowym kluczu
  `REGISTRY_KEYS.learner` i robi `scene.start(SCENE_KEYS.task)`. `TaskScene.create` bierze etap i rozgrzewkę z
  ucznia; po rozgrzewce aktualizuje ucznia w rejestrze, `this.stage` i `autoRead`. `balance.defaultStage` znika.
  Rejestr przeżywa restarty scen i wyjścia do pokoju w obrębie jednej strony; nie przeżywa przeładowania.
- Kontrakt: `TaskScene` nie wymaga drugiej sceny zadań; rozgrzewka różni się tylko składem i `RoundRules`.
- **Gest a lektor:** `src/main.ts` `unlockSpeech` słucha `pointerup`/`touchend` na `#game-container`; stuknięcie w
  wiek (canvas) odblokowuje mowę, stuknięcia w nakładkę DOM (dziecko `document.body`, poza kontenerem) — nie. Po
  powitaniu pierwsze zadanie nie jest dziś czytane automatycznie (`autoReadFirst` tylko po „Dalej”); plan może to
  zmienić dla E1/E2 (gest już był), ale to decyzja, nie konieczność.

### 5. E2E: przejście powitania i nowe ryzyko

Stan dziś:
- `playwright.config.ts`: projekt `chromium` (build produkcyjny, port 4398) ignoruje `ROUND_SPEC =
  /(task-round|narrator)\.spec\.ts/`; projekt `chromium-hook` (build `E2E_HOOK=1` w `dist-e2e`, port 4397) gra tylko
  `ROUND_SPEC`. Nowy spec pierwszego uruchomienia potrzebuje dopisania do tego wyrażenia (to stała w configu, nie
  pole zapisane w `test-stack.md`).
- `src/testing/e2eHook.ts` `installE2EHook`: `snapshot` woła `task().snapshot()` i ustala `screen` z
  `room`/`summary`/`task`; `targets` łączy `task().targets()`, `room().resumeTarget()`, `ui()`. Bez rundy
  `TaskScene.snapshot` rzuca → `readHook` w specach zwraca `null` → polling. Strażnik produkcji:
  `vite/e2eHookGuard.mjs` `checkE2EHook` (marker `__martynkaE2E` nieobecny w buildzie produkcyjnym) +
  `tests/e2eHookGuard.test.ts`; hak importuje tylko `src/main.ts` w `if (__E2E_HOOK__)`.
- `tests/e2e/task-round.spec.ts` `test.beforeEach`: `goto('/')`, czeka na `__martynkaE2E`, potem
  `phase === 'first'`. `tests/e2e/narrator.spec.ts` `openGame`: to samo. Oba po S-06 utkną na powitaniu.
- `tests/e2e/seed.spec.ts` (#8, projekt `chromium`): sprawdza build id, widoczny canvas i odpowiedzi z service
  workera — nie zależy od tego, co rysuje scena; powitanie go nie dotyka.
- Oba specy duplikują dziś `readHook`/`fromHook`/`tapScene` — naturalne miejsce na wspólny moduł (np.
  `tests/e2e/support/`; domyślny `testMatch` Playwrighta bierze tylko `*.spec|test.*`, więc helper nie jest testem).

Rekomendacja:
- **Hak (tylko odczyt, tylko build e2e):** `screen: 'welcome' | 'task' | 'summary' | 'room'` liczone najpierw z
  aktywności `SCENE_KEYS.welcome` (bez wołania `task().snapshot()`, gdy `TaskScene` nie działa); `targets.ages`
  (środki przycisków wieku w przestrzeni 1920×1080, z metody `WelcomeScene.targets()` jak w innych scenach);
  w snapshocie etap i flaga rozgrzewki (`stage`, `warmup`). Przy okazji follow-up z archiwum S-05: `nextRound`/`toRoom`
  → `null`, gdy otwarty jest pokój. Odpowiedzi bramki **nie** wystawiać w haku — spec czyta działanie z tekstu DOM
  (to widzi dorosły) i liczy wynik sam; bramka i panel to DOM, więc `getByRole('dialog')`, `getByRole('button', …)`,
  `locator.tap()` (projekt ma `hasTouch: true`).
- **Wspólny helper `passWelcome(page, { age: 10, stage: 'E3' })`:** wiek 10 → zawsze E6 (tabela, każdy miesiąc) →
  bramka → wybór E3 ≠ E6 ⇒ `stageOverriddenByParent` ⇒ bez rozgrzewki ⇒ `TaskScene` na E3, czyli dokładnie stan,
  który oba specy dziś zakładają (narrator: „default stage E3 has automatic reading off”). Niezależny od daty.
  Uwaga: tytuł testu narratora „silent at a cold start” po powitaniu nie mówi już o zimnym starcie gestów (stuknięcie
  w wiek odblokowało mowę), ale asercja „nic nie mówi przy wejściu w rundę E3” zostaje sensowna — do przeformułowania
  w planie.
- **Nowy spec** (pierwsze uruchomienie): (a) wiek → bramka (zła odpowiedź daje nowe działanie, brak blokady) →
  potwierdzenie propozycji → rozgrzewka 6 zadań → etap po rozgrzewce (np. same błędy przy pierwszej próbie → etap −1);
  (b) zmiana etapu → brak rozgrzewki; (c) stuknięcie w bramkę nie wciska niczego w scenie pod spodem. Gdzie wynik
  zależy od miesiąca: `page.clock.setFixedTime(...)` (Playwright 1.64, `test-stack.md`) — podmienia tylko
  `Date`, zegary i `requestAnimationFrame` działają; ziarno `TaskScene` (`createRng(Date.now() >>> 0)`) staje się
  stałe, co nie szkodzi. Reguła miesięcy jest i tak w testach jednostkowych.
- **Propozycja ryzyka do test-planu (`context/foundation/test-plan.md` §2, kolejny numer po #11):**
  `#12 | The first launch cannot be finished by touch or ends on the wrong stage: an age tap misses, a tap on the adult
  gate reaches the game underneath, a wrong gate answer locks the parent out, the parent's choice is not the stage
  played, or the warm-up raises the stage, lowers it by more than one or below E1 | High | Medium | PRD FR-012,
  US-03 AC; roadmap S-06 (first DOM overlay with input over the canvas); Phaser window touch forwarding`.
  Response guidance: dowód = unit (`core`: tabela × 12 miesięcy × 5 wieków, ocena rozgrzewki, bramka) + lokalny e2e
  ścieżki dotyku; „must challenge”: „logika placementu ma testy, więc ekran działa” / „nakładka DOM zasłania canvas,
  więc canvas nie dostaje dotyku”; anty-wzorzec: odpowiedź bramki z haka zamiast z tekstu DOM, asercje zależne od
  bieżącego miesiąca bez ustalonego zegara. Wpis robi `/10x-test-plan refresh` (follow-up), nie ten run; spec cytuje
  `#12` w tytułach.

### 6. „Powitanie przy każdym starcie” do S-11

- Fakty: brak trwałości (`src/storage/` pusty, brak `idb-keyval` w `package.json`, brak `src/core/save.ts`);
  S-11 (`autosave-versioned-save`) ma prerekwizyt S-10, a S-07, S-08, S-09, S-10 są przed nim (`roadmap.md` At a
  glance); ten run kończy się na S-08. Merge = deploy (CLAUDE.md), więc po S-06 produkcja
  `https://martynka-urzadza.pl` pokazuje powitanie i bramkę przy każdym zimnym starcie przez co najmniej 4 kolejne
  slice'y.
- Skutek: dziś córka uruchamia grę sama i gra E3 od razu (`balance.defaultStage`). Po S-06 bez dorosłego nie
  przejdzie bramki, czyli nie zagra wcale. Gwiazdki i tak giną przy restarcie, ale **dostęp do gry** dotąd nie
  zależał od rodzica — to nowa, istotna regresja codziennego użycia. Ciepły powrót do zainstalowanej PWA (aplikacja
  w tle) nie przeładowuje strony, więc rejestr przeżyje; zimny start (wyrzucenie z pamięci, restart, aktualizacja
  przy następnym uruchomieniu) — nie.
- Opcje:
  1. **Akceptacja + jawność (decyzja 1 z `change.md`):** sesyjny uczeń w rejestrze, wiersz `[human]` nazywający
     regresję wprost („dziecko samo nie uruchomi gry po zimnym starcie do S-11”), szew `needsPlacement` dla S-11,
     ścieżka rodzica możliwie krótka (wiek → „Poproś rodzica” → jedno działanie → wybór etapu → start; ok. 5–6
     stuknięć). Koszt: zero kodu ponad slice; cena płacona przez użytkownika.
  2. **Jeden klucz `localStorage` z wersją** (np. tylko `{ version, age, stage, stageOverriddenByParent }`), który S-11
     wczyta jednorazowo do `SaveState` i usunie. Mały kod, usuwa regresję; ale to drugi format obok planowanego
     IndexedDB (`Martynka-urzadza.md` §4/§9: zapis wersjonowany, migracja w `core/save.ts`) i ciche wciągnięcie
     części S-11 — kontrakt kroku zabrania przesuwania S-11.
  3. **Zmiana kolejności roadmapy:** mały plasterek „zapis samego ucznia” (`LearnerState` + `version` w
     `core/save.ts` + `storage/idb.ts`) przed S-09 — decyzja opiekuna o roadmapie, poza tym runem.
  4. Odrzucone: ścieżka „graj bez rodzica” z propozycją z wieku (łamie FR-012 „rodzic potwierdza przed startem”, a
     córka dostałaby E1); parametr URL `?etap=` (PWA ma stały `start_url`, dziecko też by go użyło); zostawienie
     `balance.defaultStage` jako cichego obejścia powitania (S-06 nie dowiózłby FR-012).
- **Rekomendacja:** opcja 1 w tym slice + follow-up dla opiekuna z wyborem między 2 i 3
  (`Trigger: przed kolejnym deployem, który córka ma używać codziennie / roadmap`), bez wciągania S-11.

## Code References

- `src/main.ts` `createGame` (lista scen, `preBoot`), `unlockSpeech`, `if (__E2E_HOOK__) installE2EHook(game)`
- `src/scenes/BootScene.ts` `BootScene.create` — dziś zawsze `scene.start(SCENE_KEYS.task)`
- `src/scenes/TaskScene.ts` `create` (`balance.defaultStage`, `defaultAutoRead`, `scene.launch(SCENE_KEYS.ui)`),
  `freshRound`, `startNextRound`, `autoReadFirst`, `advance`, `snapshot`, `targets`
- `src/scenes/UIScene.ts` `create` (`this.input.enabled = true`), `src/scenes/RoomScene.ts`
- `src/data/layout.ts` `SCENE_KEYS`, `REGISTRY_KEYS`, `TASK_LAYOUT.dots`
- `src/data/balance.ts` `balance.defaultStage`, `balance.round`, `balance.narrator.autoReadStages`
- `src/core/round.ts` `startRound`, `RoundRules`, `RoundState.outcomes`, `next`
- `src/core/round/pick.ts` `pickSkills`, `buildRound`
- `src/core/narration/voice.ts` `defaultAutoRead`
- `src/core/types.ts` `LearnerState` (`age`, `stage`, `stageOverriddenByParent`), `StageDef`, `StepDef`, `SkillDef`
- `src/data/curriculum/index.ts` `getStage`, `availableStages`
- `src/ui/dom/overlay.ts` `createOverlay`, `createButton`; `src/ui/dom/rotateOverlay.ts`; `src/pwa/installHint.ts`
- `src/style.css` `.overlay`, `.overlay button`, `.overlay-rotate`, `html, body` (`user-select`, `position: fixed`)
- `src/ui/widgets/PageButton.ts` (`pointerdown` + `pointerup` z „pressed”), `src/ui/widgets/ProgressDots.ts`
- `src/testing/e2eHook.ts` `installE2EHook`; `vite/e2eHookGuard.mjs` `checkE2EHook`
- `tests/e2e/task-round.spec.ts` `test.beforeEach`; `tests/e2e/narrator.spec.ts` `openGame`;
  `tests/e2e/seed.spec.ts`; `playwright.config.ts` `ROUND_SPEC`, `projects`, `webServer`
- `node_modules/phaser/src/input/touch/TouchManager.js` `onTouchStartWindow`, `onTouchEndWindow`;
  `node_modules/phaser/src/input/InputManager.js` `onTouchStart`; `node_modules/phaser/src/input/InputPlugin.js`
  `update`, `processDownEvents`; `node_modules/phaser/src/core/Config.js` `inputWindowEvents`
- `eslint.config.mjs` `no-restricted-globals` dla `src/core/**`
- `designs/martynka-maths-A-v1/screenshots/welcome.png`, `maths.css` (`.welcome-brand`, `.page-title`,
  `.age-buttons`, `.age-button`, `.welcome-flower`, `.welcome-cushion`), `preview.js` `render` (gałąź
  `screen==='welcome'`), `style-guide.md` (welcome prompt 86 px, cele ≥ 96 px, „Parent review controls belong outside
  the game scene”, „Five progress dots belong to the round”)

## Architecture Insights

- **Projekt i kit:** `welcome.png` = marka „Martynka urządza” (`pl.title`, dotąd nieużywany — zamyka część
  follow-upu z archiwum S-05), notes, „Ile masz lat?” 86 px, 5 przycisków 218×190 (≥ 96 px), kwiat i poduszka (sztuka
  z paczki; `public/assets/` nie istnieje → placeholdery albo pominięcie do S-16). Brak HUD-u. Kopia z kitu:
  `pl.title`, „Ile masz lat?”, cyfry 6–10. DESIGN-GAP (nowe wiersze `docs/design-gaps.md` od 15): ekran „poproś
  rodzica”, bramka, panel etapu, szósta kropka rozgrzewki, „tryb z obrazkami”.
- **Wspólne komponenty:** `src/ui/dom/overlay.ts` dla bramki i panelu (ten sam moduł bramki użyją S-08 i S-12);
  przyciski wieku w canvasie na wzór `PageButton` (akcja na `pointerup` po wciśnięciu na przycisku) z nowym
  rozmiarem w `layout.ts`. Nowe kolory tylko z `PLACEHOLDER_COLORS` / palety kitu (profil § 6).
- **Logika w `core`, liczby w `balance`, teksty w `pl`:** reguła miesięcy/wieku (dane tabeli w `src/data/`),
  ocena rozgrzewki, wyzwanie bramki i sprawdzenie odpowiedzi — czyste funkcje z testami najpierw. `src/data/` może
  importować z `core` tylko `core/text/*` i typy (lint), więc tabela wiek × pasmo to dane z typem `StageId`.
- **Nowe polskie napisy** (poproś rodzica, bramka, „Spróbuj jeszcze raz”, opisy E1–E6, „Zatwierdź”, „Anuluj”) →
  teacher read w planie.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-narrator-round-summary/follow-ups/review-fixes.md` — „`pl.title` and bare animation/
  stroke numbers in widgets… Trigger: S-06 (Welcome screen uses the title)” (wspierane: oba elementy nadal są w kodzie
  — `pl.title` nieużywany, `lineStyle(3/4)` w `Keypad`, `ANIMATION.shakeMs / 6` w `TaskScene.shake`); „Add the narrator
  risk… Trigger: /10x-test-plan refresh” (nadal otwarte; #12 dołącza do tej samej kolejki).
- `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` — wpisy test-planu/test-stack z
  `Trigger: /10x-test-plan refresh` (drugi serwer e2e, spec #9) — nadal otwarte, poza zakresem.
- `context/archive/2026-10-12-narrator-round-summary/` (plan, research) — wzorzec haka tylko do odczytu, odczyt tego,
  co narysowane (`counterText`), i stuknięć przez `page.touchscreen.tap`; ten slice go rozszerza, nie zmienia zasad.

## Related Research

- `context/archive/2026-10-12-narrator-round-summary/research.md` (lektor, hak e2e, scena pokoju)
- `context/archive/2026-10-12-task-round-stars/research.md` (runda, hak e2e, stuknięcia)

## Open Questions

Brak pytań blokujących plan. Wybory produktowe do rozstrzygnięcia w `/10x-plan` (z rekomendacją powyżej):
1. Działanie bramki: dwucyfrowa × dwucyfrowa vs dwucyfrowa × jednocyfrowa poza tabliczką (§3).
2. Klawiatura cyfr DOM vs `<input inputmode="numeric">` (§3; tylko druga wymaga ręcznego testu na iPadzie).
3. Próg i skład rozgrzewki (rekomendacja: 3 + 3, próg < 4 z 6 pierwszych prób, E1 bez rozgrzewki) — luka w
   `docs/ZADANIA.md`, wiersz `[human]` razem z odpowiedzią na PRD Open Question 1.
4. Czy pierwsze zadanie po powitaniu czytać automatycznie dla E1/E2 (gest już był).
5. Mitygacja „powitanie przy każdym starcie” poza opcją 1 — decyzja opiekuna (follow-up), nie planu.
Niezweryfikowane tu (tylko ręcznie na iPadzie): edycja `<input>` pod `-webkit-user-select: none`, położenie
klawiatury systemowej; obie znikają przy klawiaturze cyfr w DOM.
