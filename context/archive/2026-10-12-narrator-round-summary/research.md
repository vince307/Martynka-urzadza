---
date: 2026-10-12T23:25:38+02:00
researcher: Claude (autonomous run 2026-10-12-s04-s08, krok research)
git_commit: ad5535b
branch: feat/narrator-round-summary
repository: Martynka-urzadza
topic: "S-05 narrator-round-summary: lektor Web Speech API, tekst mówiony, podsumowanie rundy, scena pokoju, hak e2e"
tags: [research, narrator, web-speech, round-summary, room-scene, e2e-hook, phaser-scenes]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (autonomous run)
---

# Research: lektor poleceń i podsumowanie rundy (S-05)

**Date**: 2026-10-12T23:25:38+02:00
**Researcher**: Claude (autonomous run 2026-10-12-s04-s08)
**Git Commit**: ad5535b
**Branch**: feat/narrator-round-summary
**Repository**: Martynka-urzadza

Lessons: plik `lessons.md` w `context/foundation/` nie istnieje (sprawdzone `ls context/foundation/`), żadna lekcja nie
została zastosowana.

## Research Question

Z `change.md` (Open questions for /10x-research) i polecenia kroku:
1. Web Speech API w Phaser/PWA na iPadzie (Safari, PWA) i Androidzie (Chrome): ładowanie listy głosów
   (`voiceschanged`), `lang` pl-PL, wymóg gestu na iOS, głosy offline.
2. Jak zamienić działania z `−`, `·`, `:`, `□` i liczby z twardą spacją na polski tekst mówiony; które istniejące
   wzorce `Task.speak` naśladować; gramatyka liczebników.
3. Stan podsumowania w modelu rundy (`core`), zmiana paska końca rundy i „Dalej” z S-04.
4. Pusta scena pokoju i droga powrotu wznawiająca tę samą rundę.
5. Jak zmienić spec e2e ryzyka #11 i migawkę haka (tylko odczyt, nieobecny w produkcji).
6. Co da się przetestować bez głosów w headless Chromium.

## Summary

- **Lektor = moduł w `src/ui/` nad wstrzykiwanym `speechSynthesis`, reguły w `src/core/`.** ESLint dopuszcza globale
  przeglądarki tylko w `src/scenes/**`, `src/pwa/**`, `src/ui/**`, `src/testing/**`, `src/main.ts`
  (`eslint.config.mjs`, blok `globals.browser`), a `src/core/**` ma `no-restricted-globals` (`window`, `document`,
  `navigator`, `localStorage`). `tsconfig.json` ma `lib: DOM`, więc typy `SpeechSynthesis*` są dostępne w testach
  vitest (środowisko node, `vitest.config.mts` bez `environment`), jeśli moduł UI dostaje syntezator jako argument.
- **Głosy:** `getVoices()` bywa puste do `voiceschanged` (Chromium ładuje leniwie); wzorzec: odczyt od razu +
  zdarzenie + odpytywanie co ~250 ms, poddanie się po ~3 s ⇒ „brak głosu” ⇒ przycisk ukryty (FR-009). `voice.lang`
  normalizować (`_`→`-`, małe litery, prefiks `pl`); zawsze ustawiać `utterance.voice` na głos polski, bo bez niego
  Android potrafi czytać polski tekst głosem angielskim. Preferować `localService === true` (głosy „Google …” w Chrome
  desktop są sieciowe). Źródła w sekcji 1.
- **Gest:** iOS wymaga gestu dla `speak()` (WebKit bug 223473); Chrome 71+ wymaga aktywacji użytkownika (błąd
  `not-allowed`). Według HTML spec aktywację dają `touchend`, `pointerup` (nie-mysz), `pointerdown` tylko dla myszy —
  **`touchstart` i dotykowy `pointerdown` jej nie dają.** Phaser 4.2.1 wywołuje `pointerdown` obiektów synchronicznie
  wewnątrz DOM `touchstart` (`InputManager.onTouchStart` → `updateInputPlugins`), a `ActionButton` reaguje na
  `pointerdown`. Wniosek: przycisk głośnika musi mówić w `pointerup`, a pierwsze „odblokowanie” mowy powinno siedzieć
  w nasłuchu DOM `touchend`/`pointerup`. Auto-czytanie pierwszego zadania przed jakimkolwiek dotknięciem jest na iOS
  niemożliwe; dalsze auto-czytanie polega na „sticky activation” (Chrome: pewne; iOS: niepotwierdzone pierwotnym
  źródłem ⇒ wiersz `[human]` na iPadzie).
- **Tekst mówiony:** kit czyta działanie słowami: `'Oblicz. ' + read`, np. „Trzydzieści osiem plus dwadzieścia
  siedem.” (`preview.js`, `numberTasks[].read`, funkcja `speak`). W repo jedyny `Task.speak` ustawia
  `generateMissing` (`src/core/tasks/generators/missing.ts`) i zawiera surowe symbole („Jaka liczba pasuje w okienku?
  17 − 8 = □”), więc konwersja symboli musi działać także na `speak`. `□` ma w danych trzy znaczenia (liczba w
  okienku, znak porównania, znak działania) — jednej zamiany słownej nie wystarczy; COMPARE_NUM, COMPARE_EXPR,
  MISSING_OP potrzebują własnego `speak` w generatorze (teacher read). ROMAN (odczyt) i CALENDAR (`romanMonth`)
  wymagają literowania cyfr rzymskich, inaczej syntezator może zdradzić wynik.
- **Podsumowanie:** `RoundState.finished` już jest stanem „po rundzie” (`next` w `src/core/round.ts` dolicza
  bonus i ustawia `finished`); brakuje czystego widoku podsumowania (zarobione gwiazdki, rząd 5 gwiazdek z `outcomes`,
  bonus, wyróżnienie „Do pokoju”). `roundView` przestaje zwracać `bar.kind === 'roundEnd'`; `FeedbackBar` traci
  gałąź `roundEnd` i `pl.round.bonus` (DESIGN-GAP wiersz 5); `TaskScene.advance` traci gałąź `finished`
  (nowa runda przechodzi na „Kolejna runda”).
- **Pokój i powrót:** Phaser `ScenePlugin.switch` usypia bieżącą scenę i startuje/budzi docelową (kolejka, wykonywane
  w następnym `update`); uśpiona scena zachowuje pola i nie dostaje wejścia, `create` nie jest wołane przy
  `wake` — więc `TaskScene` z rundą i `sessionStars` przeżywa wizytę w pokoju bez zapisu. `UIScene` działa
  równolegle i musi zostać nad pokojem (kolejność listy scen w `src/main.ts`).
- **E2E:** migawka haka rozszerzana o ekran (`task|summary|room`), rysowany tekst licznika (`StarCounter.value`,
  follow-up S-04), widok podsumowania i widoczność głośnika; `targets` o przyciski podsumowania, pokoju, głośnika.
  Mowa w e2e zawsze przez atrapę `speechSynthesis` w `page.addInitScript` (należy do testu, nie do buildu):
  **zmierzone w tej sesji: headless Chromium 156 na Macu maintainera zwraca 180 głosów, w tym „Zosia” `pl-PL`
  `localService: true`**, więc bez atrapy test zależałby od hosta i mówiłby na głos.

## Detailed Findings

### 1. Web Speech API na docelowych przeglądarkach

Źródła zebrane przez pomocnika badawczego (web, bez urządzeń); „przeczytane bezpośrednio” = W3C/WHATWG/WebKit 223473/
Readium; pozostałe z podsumowań wyszukiwarki.

| Pytanie | Ustalenie | Źródło | Pewność |
|---|---|---|---|
| Lista głosów | Spec: `getVoices()` zwraca pustą listę, dopóki głosy nie są znane; `voiceschanged` przy zmianie listy, bez terminu. Chromium/Firefox ładują leniwie (pierwsze wywołanie często puste). Safari: zdarzenie wspierane (MDN „Baseline” od 2022); błędy historyczne: Safari 15.4 pusta lista (naprawione w 15.5), iOS 14 puste nazwy (naprawione w 14.2) | https://webaudio.github.io/web-speech-api/ ; https://blog.monotonous.org/2021/speechsynthesis-getvoices/ ; https://issues.fluidproject.org/browse/FLUID-6736/ ; https://bugs.webkit.org/show_bug.cgi?id=216684 | wysoka / średnia (Safari) |
| Format `lang` | Spec: BCP 47 (`pl-PL`). Android Chrome / Samsung Internet raportują podkreślnik (`en_us`, więc prawdopodobnie `pl_PL`); normalizacja `replace('_','-').toLowerCase().startsWith('pl')` | https://readium.org/speech/docs/WebSpeech.html | średnio-wysoka |
| Bez ustawionego `voice` | Spec: domyślny głos „should support” język — to nie gwarancja; Android bez pobranego pakietu PL czyta głosem angielskim; Safari: głosy pobrane przez użytkownika mogą nie być na liście | Readium (j.w.) | średnia |
| Gest iOS | „iOS always requires a gesture for SpeechSynthesis to speak”; od r274678 powiązane z `audioPlaybackRequiresUserGesture` (włączone w Safari i PWA); bez gestu `speak()` milczy | https://bugs.webkit.org/show_bug.cgi?id=223473 | wysoka |
| Gest Chrome | Od Chrome 71 `speak()` bez aktywacji dokumentu kończy się błędem `not-allowed`; liczy się „sticky activation” (raz aktywowany dokument może mówić z `setTimeout`) | https://developer.chrome.com/blog/chrome-71-deps-rems/ ; https://html.spec.whatwg.org/multipage/interaction.html#sticky-activation | wysoka |
| Które zdarzenia aktywują | `keydown` (nie Esc), `mousedown`, `pointerdown` tylko dla `pointerType == "mouse"`, `pointerup` dla innych niż mysz, `touchend` | https://html.spec.whatwg.org/multipage/interaction.html#activation-triggering-input-event | wysoka |
| iOS: czy jeden gest odblokowuje sesję | Brak pierwotnego źródła; raporty społeczności: po pierwszej wypowiedzi w geście kolejne `speak()` zwykle działają | — | średnio-niska ⇒ `[human]` |
| Offline | `localService` = głos lokalny (spec). iOS: głosy systemowe, lokalne. Chrome desktop „Google polski”: sieciowy (`localService: false`) i z błędem ucinania ~14 s. Android: silnik systemowy (Google Speech Services), offline po pobraniu pakietu PL | spec; Readium; https://crbug.com/679437 | wysoka / średnia (Android) |
| Znane błędy | Chrome: długie wypowiedzi urywają się po ~14–15 s (głosy Google). Safari: wypowiedź tuż po `cancel()` często bez `onstart`/`onend`; po `cancel` gra tylko ostatnia — obejście: `cancel()`, odczekać ~50–100 ms, `speak()`, plus watchdog na brak `onend`. Trzymać referencję bieżącej `SpeechSynthesisUtterance` do `end`/`error`. iOS PWA: dźwięk przerywa się po zejściu z pierwszego planu ⇒ `cancel()` na `visibilitychange` | https://bugs.webkit.org/show_bug.cgi?id=238189 ; https://bugs.webkit.org/show_bug.cgi?id=191745 ; https://bugs.webkit.org/show_bug.cgi?id=198277 ; https://codereview.chromium.org/228133002 | średnia |
| Symbole | Brak pierwotnych danych, jak polskie głosy czytają `−` (U+2212), `·`, `:`, `□`, `10 000` z NBSP; ogólnie silniki pomijają lub czytają nazwę Unicode, `:` jako pauzę/„dwukropek” | — | niska ⇒ zamieniać na słowa w `core` |

Wnioski dla tego repo:
- **Phaser i aktywacja (zaobserwowane w kodzie):** `node_modules/phaser/src/input/touch/TouchManager.js` rejestruje
  `touchstart`/`touchend` na canvasie; `InputManager.onTouchStart` woła `updateInputPlugins(CONST.TOUCH_START, …)`
  synchronicznie, więc handler `pointerdown` obiektu gry biegnie w DOM `touchstart` (Phaser 4.2.1,
  `node_modules/phaser/package.json`). `src/ui/widgets/ActionButton.ts` (`ActionButton` konstruktor,
  `zone.on('pointerdown', …)`) — wszystkie przyciski S-04 reagują na `pointerdown`. Na dotyku to nie jest zdarzenie
  aktywujące wg HTML spec; czy WebKit traktuje `touchstart` jako gest dla mowy — nieustalone. Bezpieczne: głośnik
  mówi w `pointerup` (Phaser emituje je w DOM `touchend`).
- **Auto-czytanie:** pierwsze zadanie po starcie gry (przed jakimkolwiek dotknięciem) nie może zostać przeczytane na
  iOS ani w Chrome. Pierwsze dotknięcie (np. kafelek albo „Dalej”) daje aktywację przy `touchend`; kolejne zadania
  pojawiają się po „Dalej” (`pointerdown`) — w Chrome działa sticky activation, na iOS wymaga sprawdzenia. To pasuje do
  decyzji 1 w `change.md` („co zmieniłoby odpowiedź”). Rekomendacja: jednorazowy nasłuch DOM `touchend`/`pointerup`
  na kontenerze gry, który przy pierwszym geście woła `speak` krótkiej/pustej wypowiedzi (odblokowanie), i zapis
  ograniczenia „pierwsze polecenie po starcie nie jest czytane automatycznie” jako znane.
- **Tempo:** kit `rate .85` (`preview.js` `speak`) — liczba do `src/data/balance.ts` (np. `narrator.rate`), razem z
  progiem odpytywania i limitem czasu.

### 2. Tekst mówiony: symbole, liczby, gramatyka

**Co pokazują dane (zmierzone):** `npm run sample -- E1..E6 --count 4` dało 336 wierszy poleceń; znaki inne niż
litery/cyfry/spacja: `?` 120, `.` 75, `−` (U+2212) 71, `+` 61, `□` 56, `:` 50, `,` 47, `=` 44, `·` (U+00B7) 34,
NBSP 8, `„”` po 3 (ta próbka, nie pełny zbiór). Glify z `src/core/tasks/symbols.ts`: `MINUS`, `TIMES`, `DIVIDE`,
`BOX`; liczby ≥ 10 000 grupowane NBSP przez `formatNumber` (`src/core/text/formatNumber.ts`), `parseNumber` usuwa NBSP.
Uwaga: `:` występuje też w zwykłych zdaniach („Uzupełnij ciąg:”, „Sprawdź:”, `compareFirstDiffHint`), więc zamiana
`:` → „podzielić przez” tylko między liczbami.

**Znaczenia `□` (z generatorów):**
- liczba ukryta: MISSING (`17 − 8 = □`, `src/core/tasks/generators/missing.ts`), BONDS (`5 = □ + 3` w drugiej
  linii polecenia, `bonds.ts`), FACT_FAMILY („… Sprawdź: 9 + 4 = □”), SEQUENCE („Uzupełnij ciąg: □, 80, 90”);
- znak porównania: COMPARE_NUM (`3 □ 5`, `compareNum.ts`), COMPARE_EXPR (`10 − 7 □ 6 − 3`, `compareExpr.ts`),
  kafelki `<`, `>`, `=`;
- znak działania: MISSING_OP (`10 □ 3 = 7`, `missingOp.ts`), kafelki `+`/`−`.
Wniosek: „okienko” pasuje do pierwszej grupy („siedemnaście minus osiem równa się okienko”), dla dwóch pozostałych
syntezator przeczytałby bełkot („trzy okienko pięć”). Te trzy generatory potrzebują własnego `speak` z pytaniem
o znak (słowa w `pl.ts`, teacher read). Spostrzeżenie poboczne: `isExpression` (`src/core/round/prompt.ts`) uznaje
`3 □ 5` i `10 □ 3 = 7` za działanie, więc `TaskScene.drawPrompt` rysuje nad nimi „Oblicz” — dla porównania to
niezręczne (istniejące zachowanie S-04, poza zakresem; kandydat na follow-up).

**Cyfry rzymskie:** ROMAN (odczyt: `pl.tasks.romanContexts`, np. „Winda zatrzymała się na IV piętrze”) i CALENDAR
(`pl.tasks.romanMonth`, „Data 12 IV.”) — syntezator może przeczytać „IV” jako „czwarte”/„kwiecień”, czyli wynik.
Rekomendacja: `speak` w tych generatorach literuje cyfry („i, fau”) albo mówi „cyfry rzymskie I V”; słowa i forma
do teacher read. Kierunek „Jak zapisać liczbę 4 cyframi rzymskimi?” jest bezpieczny.

**Liczby słownie:** kit czyta działania słowami (`numberTasks[].read`). `numberToWords`
(`src/core/text/numberWords.ts`) obsługuje 0..1000 (mianownik; `MAX_NUMBER_WORD`) i komentarz pliku już mówi „used by
NUMBER_WORDS tasks and the narrator”. W działaniach liczby stoją w mianowniku, więc `numberToWords` daje poprawną
formę; dla > 1000 (E4–E6) dwie opcje: (a) cyfry bez NBSP dla syntezatora, (b) rozszerzenie `numberToWords` do
milionów (czysta funkcja w `core/text`, z testem). Rekomendacja: (a) w S-05, (b) jako follow-up, jeśli odsłuch na
tablecie pokaże złe czytanie.

**Zdania z liczbami (WORD, COMPARE_DIFF, …):** zgoda liczebnika z rzeczownikiem w rodzaju („2 książki” → „dwie
książki”) wymagałaby wiedzy o rodzaju rzeczownika w miejscu liczby; `src/data/nouns.ts` ma formy liczby mnogiej,
nie liczebniki. Polskie syntezatory zwykle robią to same z kontekstu, ale nie ma na to dowodu. Rekomendacja: w
zdaniach zostawić cyfry (tylko zamiana symboli i NBSP), dopisać wiersz `[human]` odsłuchu (PRD Open Question 7).

**Proponowany kształt (do planu):** czysta funkcja w `src/core/` (np. `src/core/round/speech.ts`):
`spokenText(task, words)` → `task.speak ?? (isExpression(prompt) ? `${calculate}. ${expr}` : prompt)`, potem
zamiana tokenów: liczba ≤ 1000 w działaniu → `numberToWords`, `+` „plus”, `−` „minus”, `·` „razy”, `:` między
liczbami „podzielić przez”, `=` „równa się”, `□` „okienko”, NBSP usunięte, `\n` → „. ”. Słowa jako klucze w
`src/data/pl.ts` (scena ani `core` nie mają literałów; `core` dostaje słowa argumentem, jak `roundView` dostaje
`answerLine`). Wzorzec do naśladowania: `generateMissing` (`speak` = pytanie słowne + działanie) dla generatorów z
`□`-znakiem. `validateTask` (`src/core/tasks/validate.ts`, `texts`) sprawdza `speak` tak jak `prompt`, więc nowe
`speak` przechodzą przez walidator liczebników; `scripts/sample.ts` drukuje dziś tylko `prompt` — dla teacher read
`speak` warto dodać do wydruku.
Co czyta głośnik w trakcie podpowiedzi: kit czyta „Spróbuj jeszcze raz. ” + podpowiedź w stanie hint (`preview.js`
`speak`), styl `style-guide.md`: „The speaker reads the task or hint”. Linie z `roundView.bar` (`hint.line`,
`solution.lines`, `retype.line`) zawierają te same symbole — ta sama konwersja.

### 3. Podsumowanie w modelu rundy

- `src/core/round.ts`: `next` po piątym zadaniu ustawia `finished: true`, `bonusEarned`, dolicza bonus do
  `starsEarned`; `answer`, `nextSolutionStep`, `next` są no-op przy `finished`. Stan podsumowania już istnieje —
  nie trzeba nowej fazy reduktora.
- `src/core/round/view.ts` `barOf`: przy `finished` zwraca `{ kind: 'roundEnd', bonus }`; `roundView.switchVisible`
  zawsze `false`. Proponowane: osobny czysty `summaryView(state, { nextRoomTaskCost, starsTotal })` →
  `{ earned: starsEarned, bonus: bonusEarned, stars: outcomes.map(o => o !== 'retype'), roomHighlighted: cost !== null
  && starsTotal >= cost }`; `barOf` przy `finished` → `{ kind: 'none' }` (albo usunąć wariant `roundEnd` z unii);
  `switchVisible` = `phase === 'done' && !finished` (między zadaniami, FR-011) — pod decyzją 3 z `change.md`.
- `src/ui/widgets/FeedbackBar.ts` `update`/`textOf`: gałąź `roundEnd` (zielony pasek, „Dalej” startujące nową
  rundę) do usunięcia; `pl.round.bonus` zostaje tylko, jeśli plan pokaże bonus osobną linią (DESIGN-GAP b).
- `src/scenes/TaskScene.ts` `advance`: gałąź `if (this.state.finished)` (dolicza `sessionStars`, `freshRound`) staje
  się akcją „Kolejna runda”. `snapshot.starsTotal = sessionStars + starsEarned` pozostaje poprawne na podsumowaniu.
- Kit (`summary.png`, `preview.js` `render` gałąź `summary`, `maths.css`): tytuł „Brawo!” (`.page-title` top 290,
  86 px), rząd 5 gwiazdek 98 px (`.summary-star-row` left 656, top 420, gap 26), „★ +N” 124 px (`.earned` left 660,
  top 578, width 600), przyciski `.page-buttons` left 454, top 816, gap 36; `.page-button` min 450×128, 46 px, ramka 5,
  promień 32, turkus `#a6ddd2→#70c7b7`/`#397f73`; `.secondary` kremowy `#fffbee→#fff0ca`/`#c0a363`. Kit pokazuje
  zawsze 5 pełnych gwiazdek i `earned=5` (`window.mathsPreview.set` dla `page='summary'`) — znaczenie rzędu
  (DESIGN-GAP c) i wariant wyróżniony (DESIGN-GAP a) nie są w kicie.
- **Licznik na podsumowaniu:** kit `summary` nie ma HUD (`render` buduje tylko `notebook` + treść), a FR-011
  wymaga licznika zawsze. `UIScene` i tak rysuje licznik nad `TaskScene` ⇒ licznik zostaje; DESIGN-GAP (nowy).
- Głośnik na podsumowaniu: kit nie ma HUD ⇒ brak głośnika; FR-009 dotyczy poleceń ⇒ ukryty poza zadaniem.

### 4. Scena pokoju i powrót

- Dziś: `SCENE_KEYS = { boot, task, ui }` (`src/data/layout.ts`); `src/main.ts` `scene: [BootScene, TaskScene,
  UIScene]`; `TaskScene.create` woła `this.scene.launch(SCENE_KEYS.ui)`; `UIScene.create` ustawia
  `this.input.enabled = false` i słucha `changedata-stars` w rejestrze.
- Phaser 4.2.1 `ScenePlugin.switch` (`node_modules/phaser/src/scene/ScenePlugin.js`): „Makes this Scene sleep then
  starts the Scene given… at the next Scene Manager update”; `sleep` = „no update, no render) but doesn't shutdown”;
  przy `wake` `init`/`create` nie są wołane (komentarz przy `transition`). Uśpiona scena nie przetwarza wejścia
  (`InputManager.updateInputPlugins` iteruje wszystkie sceny od góry, `getScenes(false, true)`, ale
  `InputPlugin.update` zwraca `false`, gdy `!this.isActive()`). Zatem `TaskScene`
  zachowuje `state`, `sessionStars`, `rng`; powrót = `scene.switch(SCENE_KEYS.task)` z `RoomScene`.
- Kolejność rysowania: sceny rysują się w kolejności listy; `RoomScene` musi stać przed `UIScene` w `src/main.ts`
  (albo `scene.bringToTop(ui)`), żeby licznik był nad pokojem (FR-011).
- Kit pokoju (`preview.js` `render` gałąź `room`, `screen.css`/`maths.css`): tło `assets/room.png` (sztuka — poza
  S-05), `.return-note` „★ N” lewy górny róg (top 58, left 95, 46 px), `.resume` „Wróć do notesu” 480×116 przy
  left 720, bottom 72, 48 px, turkus. Kit wraca do ekranu, z którego wyszedł (`roomReturn = screen` … `screen =
  roomReturn`), czyli z podsumowania wraca na podsumowanie, z zadania na zadanie.
  **Rozbieżność z `change.md` decyzja 3** („z podsumowania powrót startuje nową rundę”): kit wraca na podsumowanie,
  gdzie dziecko wybiera „Kolejna runda”. Rekomendacja: zachowanie kitu — jedna reguła powrotu (`switch` budzi
  `TaskScene` w stanie, w jakim był), bez specjalnej ścieżki; plan rozstrzyga i zapisuje decyzję.
  `.return-note` dubluje licznik z `UIScene`; przy zawsze widocznym liczniku HUD wystarczy ten jeden.
- Przełącznik HUD: kit `hud()` rysuje „Do pokoju” (`.room-button` 316 px, ikona domu, lewa strona HUD) **zawsze,
  także w trakcie zadania**; PRD FR-011 i plan §6 ukrywają go w trakcie rozwiązywania ⇒ PRD wygrywa, DESIGN-GAP
  wiersz 4 do przepisania. Przycisk w `UIScene` wymaga `input.enabled = true`; `UIScene` jest na górze, a
  `InputManager.globalTopOnly` (domyślnie) zatrzymuje propagację tylko przy trafieniu w interaktywny obiekt, więc
  dotyk poza przyciskami HUD dalej trafia do `TaskScene`.
- Wymiana informacji `TaskScene` ↔ `UIScene`: istniejący wzorzec to rejestr (`REGISTRY_KEYS.stars` +
  `changedata-<key>`). Widoczność głośnika/przełącznika i tekst do odczytu mogą iść tą samą drogą (nowe klucze w
  `REGISTRY_KEYS`), a stuknięcie z `UIScene` — przez zdarzenie gry (`this.game.events`) albo rejestr.

### 5. Hak e2e i spec ryzyka #11

- `src/testing/e2eHook.ts` `installE2EHook`: zamrożony obiekt na `window.__martynkaE2E` z getterami `snapshot` i
  `targets`, oba z `TaskScene` (`game.scene.getScene(SCENE_KEYS.task)`). Instalowany tylko w `src/main.ts` pod
  `if (__E2E_HOOK__)`; `__E2E_HOOK__` z `vite/config.shared.mjs` (`define`), a `vite/e2eHookGuard.mjs`
  (`checkE2EHook`) wywraca build produkcyjny, gdy marker `__martynkaE2E` jest w jakimkolwiek chunku (i build e2e,
  gdy go brak); test `tests/e2eHookGuard.test.ts`. Rozszerzenia migawki nie zmieniają tej gwarancji, dopóki moduł
  haka jest importowany tylko w tej gałęzi.
- `TaskScene.snapshot` (`TaskSnapshot`): `counter` czyta rejestr, nie rysowaną liczbę (follow-up S-04).
  Proponowane pola: `screen: 'task' | 'summary' | 'room'` (z aktywnej sceny i `finished`), `counterText` z
  `StarCounter.value` (przez `UIScene`), `summary: { earned, bonus, stars, roomHighlighted } | null`,
  `speaker: { visible }`; `targets`: `nextRound`, `toRoom`, `resume`, `speaker`, `roomSwitch` (null, gdy ukryte).
  Hak czyta wtedy `TaskScene`, `UIScene` i `RoomScene` — wciąż tylko odczyt i zamrożone kopie.
- `tests/e2e/task-round.spec.ts`: trzy testy kończą się asercją `finished === true` i licznikiem; `tapNext` po piątym
  zadaniu kończy rundę (nadal prawda: „Dalej” po piątym zadaniu woła `next` → `finished`). Zmiany: asercja, że widać
  podsumowanie (`screen === 'summary'`, `summary.earned`), rysowany licznik (`counterText`), „Kolejna runda” → nowa
  runda od `index 0` z zachowaną sumą; nowy test: podsumowanie → „Do pokoju” → pokój (licznik widoczny) → „Wróć do
  notesu” → ten sam stan. Projekt `chromium-hook` dopasowuje tylko `/task-round\.spec\.ts/`
  (`playwright.config.ts`, `ROUND_SPEC`) — nowy plik specu z hakiem wymaga poszerzenia tego wzorca.
- Ryzyko #11 w `context/foundation/test-plan.md` mówi o rundzie przez dotyk (gwiazdki, podpowiedź, bonus); pętla
  podsumowanie/pokój i lektor nie mają numeru ryzyka. Rekomendacja: spec podsumowania/pokoju w ramach #11 (koniec
  rundy), lektor jako follow-up `/10x-test-plan refresh` (nowe ryzyko „brak głosu blokuje przepływ / głośnik nie
  mówi”).

### 6. Co da się przetestować bez prawdziwego głosu

- **vitest (node):** czyste funkcje `core` (tekst mówiony dla każdego typu z próbki 1000 losowań: brak `−·:□`
  i NBSP w wyniku, liczby ≤ 1000 słownie; wybór głosu z listy `{lang, name, localService}` z `pl_PL`/`pl-PL`/brak;
  domyślne `autoRead` dla E1–E6; `summaryView` i reguła wyróżnienia). Moduł `src/ui/narrator.ts` z wstrzykniętą
  atrapą syntezatora (lista głosów pusta → `voiceschanged` → głos; limit czasu → „brak głosu”; `cancel` przed
  nowym `speak`; referencja wypowiedzi) — bez DOM, bo `vitest.config.mts` nie ustawia środowiska przeglądarki.
- **Playwright (`chromium-hook`):** atrapa `window.speechSynthesis` + `SpeechSynthesisUtterance` w
  `page.addInitScript` (kod testu, nie buildu): wariant z polskim głosem → głośnik widoczny w migawce, stuknięcie
  zapisuje tekst w tablicy testu; wariant bez głosów → głośnik ukryty, runda grywalna do podsumowania (PRD NFR „brak
  głosu nie blokuje”). Zmierzone (`chromium.launch()` + `getVoices()`, poza sandboxem): headless Chromium
  156.0.8078.4 na macOS zwraca 180 głosów, w tym `Zosia` `pl-PL` `localService: true` — bez atrapy wynik zależy od
  maszyny i test mówi na głos. Playwright `touchscreen.tap` wysyła `touchstart`+`touchend`, więc aktywacja i
  `pointerup` działają w e2e.
- **Nie da się:** jakość głosu, gest na iOS, offline na Androidzie, iPad PWA — wiersze `[human]` (PRD Open
  Question 7, test-plan „Narrator voice quality”).
- **Auto-czytanie:** na produkcji etap stały E3 (`balance.defaultStage`) ⇒ domyślnie wyłączone; sprawdzalne w vitest;
  w e2e tylko przez wstrzyknięcie (np. etap/ustawienie w buildzie e2e) — rekomendacja: unit + `[human]`, bez nowego
  wejścia w buildzie e2e (decyzja 5 w `change.md` stoi).

### 7. Design — tokeny i kopia

- Głośnik HUD: kit `.speaker` 104 px szer., `.hud` top 40, wysokość przycisku ≥ 104, gap 24, ikona `speakerSVG`
  (trójkąt-głośnik + dwa łuki, kreska 4) w `preview.js`; w scenie licznik `TASK_LAYOUT.starCounter` left 1622, top
  46, 196×100 ⇒ głośnik po lewej od licznika z odstępem 24 (≥ 96 px, `MIN_TOUCH_TARGET`). Ikona rysowana w kodzie.
- Kopia z kitu do `src/data/pl.ts`: „Kolejna runda”, „Do pokoju”, „Wróć do notesu” (dokładnie z `preview.js`),
  „Brawo!” = istniejący `pl.round.correct`. Etykieta „Przeczytaj zadanie” to tylko `aria-label` w kicie — na canvasie
  niewidoczna; nie potrzebna, chyba że plan doda DOM-owy opis dostępności.
- Kit bez polskiego głosu pokazuje „Poproś dorosłego o przeczytanie zadania.” (`preview.js` `speak`) — PRD FR-009
  i plan §6 („bez polskiego głosu przycisk ukryty”) wygrywają; DESIGN-GAP (d).
- Kolory nowe dla `PLACEHOLDER_COLORS`: przycisk główny strony `#a6ddd2`/`#70c7b7`/`#397f73` (już `next`,
  `nextBorder`), drugorzędny `#fffbee`/`#fff0ca`/`#c0a363`, HUD `#fffdf2`/`#fff0cc`/`#d3b77d`.

## Code References

- `src/core/round.ts` — `RoundState.finished`, `next` (bonus, koniec rundy), `startRound`
- `src/core/round/view.ts` — `roundView`, `barOf` (`roundEnd`), `switchVisible`
- `src/core/round/prompt.ts` — `isExpression` (wybór „Oblicz” + działanie)
- `src/core/tasks/types.ts` — `Task.speak`
- `src/core/tasks/generators/missing.ts` — `generateMissing` (jedyny `speak`)
- `src/core/tasks/generators/{compareNum,compareExpr,missingOp,roman,calendar,bonds,sequence,factFamily}.ts` — `□` i cyfry rzymskie w poleceniach
- `src/core/tasks/symbols.ts` — `MINUS`, `TIMES`, `DIVIDE`, `BOX`
- `src/core/text/formatNumber.ts` — `formatNumber` (NBSP), `parseNumber`
- `src/core/text/numberWords.ts` — `numberToWords` (0..1000)
- `src/core/tasks/validate.ts` — `texts` (waliduje `speak`)
- `src/scenes/TaskScene.ts` — `advance`, `freshRound`, `snapshot`, `targets`, `drawPrompt`, `sessionStars`
- `src/scenes/UIScene.ts` — `create` (`input.enabled = false`, rejestr)
- `src/ui/widgets/FeedbackBar.ts` — `update`, `textOf` (`roundEnd`)
- `src/ui/widgets/ActionButton.ts` — tap w `pointerdown`
- `src/ui/widgets/StarCounter.ts` — `value` (nieużywane)
- `src/testing/e2eHook.ts` — `installE2EHook`; `vite/e2eHookGuard.mjs` — `checkE2EHook`
- `src/data/layout.ts` — `SCENE_KEYS`, `REGISTRY_KEYS`, `TASK_LAYOUT.starCounter`, `PLACEHOLDER_COLORS`
- `src/data/pl.ts` — `round.*`, `tasks.romanContexts`, `tasks.romanMonth`
- `src/data/balance.ts` — `balance.defaultStage`
- `src/main.ts` — lista scen, `installE2EHook`
- `eslint.config.mjs` — globale przeglądarki / ograniczenia `src/core/**`
- `tests/e2e/task-round.spec.ts`, `playwright.config.ts` (`ROUND_SPEC`, `chromium-hook`)
- `node_modules/phaser/src/scene/ScenePlugin.js` — `switch`, `sleep`, `wake`
- `node_modules/phaser/src/input/InputManager.js` — `onTouchStart`, `updateInputPlugins`
- `designs/martynka-maths-A-v1/preview.js` — `speak`, `hud`, `render` (summary, room), `numberTasks[].read`

## Architecture Insights

- Wzorzec S-04 „`core` zwraca widok, scena mapuje `kind` na tekst z `pl.ts`” (`roundView` + `answerLine`) rozciąga
  się naturalnie na `spokenText(task, words)` i `summaryView`.
- Komunikacja scen przez rejestr (`REGISTRY_KEYS`) jest jedynym istniejącym kanałem; nowe stany HUD
  (głośnik, przełącznik) wpisują się w niego.
- Granice ESLint wymuszają podział: `core` (czyste reguły), `src/ui/` (mowa, widżety), sceny (sklejka).

## Historical Context (from prior changes)

- `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` — przełącznik zadania/pokój (`Trigger:
  S-05 or S-09`), licznik w specu e2e (`Trigger: S-05`), `pl.title` (`Trigger: S-05` → odsunięty na S-06 w
  `change.md`), kropki kroków (`Trigger: S-05 or next change to SolutionSteps`); stan potwierdzony w kodzie
  (`roundView.switchVisible` stałe `false`, `StarCounter.value` bez wywołań).
- `docs/design-gaps.md` wiersz 4 (HUD „Do pokoju”) i 5 (pasek końca rundy) — oba dotykane przez S-05; wiersz 8
  (rysowane `□`) — dane zachowują `□`, co wymusza konwersję mowy.
- `context/archive/2026-10-12-task-round-stars/research.md` §5 — projekt haka e2e (osobny build, guard); obowiązuje.

## Related Research

- `context/archive/2026-10-12-task-round-stars/research.md`

## Open Questions

- iOS: czy jedno odblokowanie gestem wystarcza na sesję (auto-czytanie po „Dalej” w `pointerdown`) — `[human]` na
  iPadzie; jeśli nie, auto-czytanie musi iść z `pointerup` „Dalej”.
- Jakość polskiego głosu i czytanie liczebników w zdaniach (rodzaj: „dwie książki”) — `[human]` odsłuch (PRD OQ 7).
- Decyzje dla planu: powrót z pokoju na podsumowanie (kit) vs nowa runda (`change.md` decyzja 3); bonus osobną linią
  czy w „+N”; znaczenie rzędu 5 gwiazdek; słowa `speak` dla COMPARE_*/MISSING_OP/ROMAN (teacher read); liczby > 1000
  w mowie (cyfry vs rozszerzenie `numberToWords`).
- Follow-up kandydaci: „Oblicz” nad poleceniami porównania (`isExpression`), nowe ryzyko lektora w test-plan,
  `sample` drukujący `speak`.
