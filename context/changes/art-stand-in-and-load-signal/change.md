---
change_id: art-stand-in-and-load-signal
title: Czytelny polski stand-in obrazka, sygnał nieudanego wczytania dla rodzica i import/reset po nieudanym odczycie
status: planned
created: 2026-10-14
updated: 2026-10-14
archived_at: null
---

## Notes

Zmiana spoza roadmapy (autonomiczny run `2026-10-14-fix-art-stand-in`, gałąź `feat/art-stand-in-and-load-signal` cięta
z `main` @ `1812347`). Brak wiersza w roadmapie — nie edytujemy statusów w `context/foundation/roadmap.md`.

Źródła:

- audyt obserwowalności 2026-10-14_0445 (PR #42, niescalony), ustalenia **S14-01 (CRITICAL)**, **S14-02**, **S14-03**,
  **S14-04**, **S14-11**, **S12-01**; zakres uzgodniony z opiekunem w kroku 0 runu (2026-10-14);
- niestabilny test pełnego zestawu: `tests/spoken.test.ts` „has no operator glyph, blank, no-break space or digit-colon
  left” przekracza domyślne 5 s pod obciążeniem (5,3 s zmierzone w baseline runu; sam przechodzi w ok. 3 s) — ta sama
  klasa co commit `cd42b4a` (który podniósł limit innego testu w tym pliku, „every phase of every task is free of
  operator glyphs”, do `30_000`). Poprawka: limit czasu na teście, bez zmiany zachowania;
- kontrakt runu, „Slice-specific rules”: stand-in po polsku z danych (`src/data/measures.ts`, `formatMoney`, `pl.ts`),
  nigdy id pliku; preferowane niepokazywanie zadania, którego obrazka brak (plan decyduje); format zapisu v1; status
  obrazków tylko w runtime; `src/core` czyste; szwy e2e tylko w buildzie hook z markerem w `vite/e2eHookGuard.mjs`;
- PRD `context/foundation/prd.md`: zasady „bez stanów porażki”, „postęp nigdy nie ginie”, brak telemetrii (sygnał
  zostaje na urządzeniu);
- wzorce: `context/archive/2026-10-13-save-observability-c1-c2/` (audyt → poprawka, ten sam kształt; `saveHealthView` jako
  wzór dla linii obrazków) oraz `context/archive/2026-10-14-art-tasks-all-stages/` (slice, który wprowadził obrazki,
  `ArtImage` i DESIGN-GAP 66).

Plik `lessons.md` w `context/foundation/` nie istnieje.

Poza zakresem (follow-upy z `Trigger:` w `follow-ups/review-fixes.md` tej zmiany, pisze je plan/ship):

| Ustalenie | Powód odłożenia (jedna linia) |
|---|---|
| S14-05 (pomyłki ze stand-inem liczone do opanowania) | Po S14-01 (polska etykieta albo pominięcie umiejętności) zadanie znów jest rozwiązywalne; oznaczanie wyników to zmiana `recordRound`, osobny krok |
| S14-06 (`check:deploy` dla obrazków) | Zmiana w `scripts/` i smoke produkcyjnym; istniejący follow-up S-14 ma ten sam trigger |
| S14-07 (`loader.timeout`) | Inny tryb awarii (zawieszenie, nie brak); wymaga pomiaru na pierwszej wizycie online |
| S14-08 (log z URL/statusem, rozgałęzienie po `file.type`) | Kosmetyka logu; plan może wziąć tanio, jeśli przepisuje handler `loaderror` (patrz decyzja 4) |
| S14-09, S14-10 (`?? 1`, `?? 20`, `?.` w pulach) | Dziś chronione przez parsery i `validateVisual` w CI; zmiana typów danych |
| S14-12 (niehashowane URL-e obrazków) | Audyt uznaje za akceptowalne |
| S12-02 (`replace` bez limitu czasu) | Osobny tryb (zawieszony IDB), wymaga zegara w `replace`; brak pomiaru |
| S12-03, S12-10, S12-11 (stany `replacing`/`replaced`, `lastError` w `failing`, licznik `replace`) | Zmiana `saveHealthView` poza S12-01; tani, ale nie wymagany do zamknięcia nadpisania |
| S12-04 (eksport bez `validateSave`) | Inna ścieżka (eksport), nie nadpisuje zapisu na urządzeniu |
| S12-05..S12-09, S12-12..S12-15 | medium/low, inne pliki i ścieżki; brak związku z nadpisaniem przy `unavailable`/`unreadable` |
| S13-01..S13-14 | Inny obszar (rysowane widżety i `select`/`drag`), osobna zmiana |

## Audit claims vs repo now

Stan sprawdzony na `feat/art-stand-in-and-load-signal` @ `1812347` (= `main`; audyt pisany na tym samym kodzie).

| Audit claim | Repo now | Correction |
|---|---|---|
| S14-01: `ArtImage.show` rysuje pudełko z etykietą `key.split('/').pop()` (angielskie id pliku) | Potwierdzone: `this.label.setText(key.split('/').pop() ?? key)` w gałęzi `!loaded`; `loaded = this.scene.textures.exists(key)`. | Bez korekty. |
| S14-01: kwota i pojemność są tylko na obrazku; `pl.tasks.moneyCountPrompt`/`moneyCountSpeak` nie zawierają kwot | Potwierdzone: „Ile złotych leży na stole?” / „Popatrz na pieniądze. …” bez kwot. | Bez korekty. |
| S14-01 kierunek: `formatMoney(grosze)` → „2 zł”, `JUGS[].label` → „½ l” | `formatMoney` jest w `src/core/text/measure.ts` (dane mogą go importować: `core/text/*`). `MONEY` w `src/data/measures.ts` ma tylko `{ id, grosze }` — **brak `label`**; `JUGS` i `WEIGHTS` mają polskie `label`. `ICONS` mają `noun` (mianownik słownikowy), nie `label`. | Uzupełnienie: etykietę monety/banknotu trzeba wyprowadzić z `grosze` przez `formatMoney` (nie z pola danych). Dla ikon źródło polskiej etykiety to `ICONS[].noun`. Plan wybiera jedno źródło „klucz → polska etykieta” (jedna tabela w `data/`). |
| S14-01 kierunek alternatywny: zbiór wczytanych tekstur przekazany do wyboru rundy | `src/core/round/pick.ts` `playable(skill)` jest statycznym predykatem (tryb odpowiedzi + generator); nie zna tekstur ani typów zależnych od obrazka. | Wykonalne, ale nowe: czysta funkcja w `core` z parametrem „brakujące klucze/rodzaje” (core nie zna Phasera ani `TASK_ART`). Decyduje plan (decyzja 2). |
| S14-02: odważniki w stand-inie jako `weight-10dag` w stałych 24 px (`TEXT_SIZES.artLabel`), etykiety nachodzą | Potwierdzone: `TEXT_SIZES.artLabel: 24` w `src/data/layout.ts`, brak dopasowania w `ArtImage.show`. Nakładanie się na tablecie nie było mierzone (audyt § 8: nieudowodnione w runtime). | Bez korekty; nakładanie do sprawdzenia w bramce wizualnej (szew e2e wymusza brak tekstur). |
| S14-03: jedynym sygnałem jest `console.warn("Task art failed to load: <key>")` w `BootScene.preload` | Potwierdzone: `this.load.on('loaderror', (file) => console.warn(...))`; nic w rejestrze; brak `artHealth` w `src/`. | Bez korekty. |
| S14-04: niedekodowalny plik nie emituje `loaderror` (Phaser `File.onProcessError` loguje i kończy bez `FILE_LOAD_ERROR`) | Nie sprawdzane ponownie w źródle Phasera w tym kroku (audyt sprawdził ręcznie). `BootScene.create` nie czyta ani `this.load.totalFailed`, ani `textures.exists` dla `TASK_ART`. | Bez korekty co do kodu gry; zachowanie Phasera 4.2.1 potwierdzi research (`node_modules/phaser/src/loader/File.js`). Niezależnie od tego sprawdzenie `textures.exists` po wczytaniu łapie oba przypadki. |
| S14-11: wiersz 66 `docs/design-gaps.md` i komentarz `ArtImage` mówią „the task stays playable” | Potwierdzone: wiersz 66 „A rounded box in the palette with the file name; the task stays playable”; nagłówek klasy `ArtImage` „…so a failed load leaves the task playable”. Komentarz w `BootScene.preload` „A missing drawing is not fatal: ArtImage draws a stand-in”. | Bez korekty; poprawiamy oba teksty i dokładamy test etykiety zastępczej dla każdego typu zależnego od obrazka. |
| S14-11 (pośrednio): `?.` w pulach (`this.images[i]?.show`) | Potwierdzone w `MoneyTable`, `Jugs`, `BalanceScale`, `IconGroups`. | Część „`?.`” to S14-10/S13-11 — poza zakresem (patrz tabela wyżej); S14-11 w zakresie = notka + test. |
| S12-01: `replace` odmawia tylko przy `blockedBy === 'fatal'` | Potwierdzone: `if (blockedBy === 'fatal') return { ok: false, error: 'Blocked' };` w `createAutosaver` `replace`. | Bez korekty. |
| S12-01: `UIScene.openImport`/`openReset` budują „Teraz” z `saver.current()` (świeża sesja w pamięci po `unavailable`/`unreadable`) | Potwierdzone: `decodeSave(saver.current())` → `summarize(decoded.session)`; `blockedBy` nie jest czytane; `openSaveImportDialog`/`openSaveResetDialog` dostają tylko `current: SaveSummary`. | Bez korekty. To samo co otwarty follow-up S-12 impl-review F1 (patrz niżej). |
| S12-01: „W konsoli nic” | Potwierdzone dla gałęzi `Busy`/`Blocked`; `replace` loguje tylko `autosave: replace failed` w `catch` zapisu. | Bez korekty. |
| Flaky `tests/spoken.test.ts` | Test `it('has no operator glyph, blank, no-break space or digit-colon left', …)` w `describe` korzysta z `forEachTask` i nie ma trzeciego argumentu (domyślne 5 s); `cd42b4a` dał `30_000` tylko testowi „every phase of every task is free of operator glyphs”. Pozostałe `forEachTask` (Roman, „speech does not give away the answer”) też bez limitu. | Uzupełnienie: plan sprawdzi czasy wszystkich testów `forEachTask` i podniesie limit tym, które są blisko 5 s (nie tylko jednemu). |

Wszystkie ustalenia w zakresie potwierdzone w kodzie; korekty to uzupełnienia (brak `label` w `MONEY`, źródło etykiety
ikon, pozostałe testy `forEachTask`).

## Design binding

Źródło prawdy (profil § 6): `Martynka-urzadza.md`, `docs/ZADANIA.md`, `designs/martynka-maths-A-v1/style-guide.md`,
`screenshots/`, `preview.html`; teksty w `src/data/pl.ts`; kolory z `src/data/layout.ts`; wspólne komponenty
`src/ui/widgets/` (`ArtImage`, `TaskPicture`, `textStyle`) i `src/ui/dom/` (`openSettingsPanel`, `saveHealthView.ts`,
`saveImportDialog.ts`, `saveResetDialog.ts`, `saveSummaryView.ts`).

- **Widoki kitu wiązane przez tę zmianę: brak bezpośrednich.** Kit nie ma stand-inu obrazka (DESIGN-GAP 66), ekranu
  ustawień rodzica (DESIGN-GAP 26), sekcji „Zapis gry” (DESIGN-GAP 43, 50), dialogów importu/resetu (DESIGN-GAP 48/49).
  Wygląd monet, banknotów, dzbanków, wagi i ikon — z paczki (`designs/…/style-guide.md`), nie zmieniany.
- **DESIGN-GAP do rewizji/dodania (nigdy wymyślane bez wiersza):**
  - wiersz **66** — rewizja: stand-in z polską wartością („2 zł”, „½ l”, „10 dag”, polska nazwa ikony), tekst dopasowany
    do pudełka; usunięcie twierdzenia „the task stays playable” albo zawężenie go (decyzja 2);
  - **nowy wiersz** — linia „Obrazki” (stan wczytania obrazków zadań) w panelu rodzica obok „Zapis gry”; kit jej nie ma;
  - **nowy wiersz albo rewizja 48/49** — „Teraz” w imporcie/resecie, gdy zapis na urządzeniu nie został odczytany
    (`unavailable`/`unreadable`): tekst zamiast podsumowania świeżej sesji.
- **Klucze tekstów (`src/data/pl.ts`, każdy nowy z teacher read):** linia zdrowia obrazków w `pl.settings` (np.
  nagłówek i „wszystkie obrazki są wczytane” / „N z M obrazków się nie wczytało” z `countNoun`); w `pl.saveTransfer`
  linia „zapis na urządzeniu nie został odczytany / jest nieczytelny” zamiast podsumowania „Teraz” (i ewentualna
  odmowa). Etykiety stand-inu nie są nowymi kluczami `pl.ts`, jeśli pochodzą z `formatMoney`, `JUGS[].label`,
  `WEIGHTS[].label`, `ICONS[].noun` — plan rozstrzyga, gdzie leży tabela „klucz → etykieta” (`src/data/taskArt.ts`
  albo `measures.ts`). Brzmienie decyduje plan.

## Migration

**Brak migracji.** Nie ma bazy danych (profil § 4). `SAVE_VERSION` zostaje 1 (`src/core/save.ts`); zdrowie obrazków
(nieudane klucze) żyje tylko w runtime (rejestr Phasera, np. `REGISTRY_KEYS.artHealth`) i nigdy nie wchodzi do
`SaveState`; S12-01 zmienia tylko to, co dialog pokazuje i kiedy `replace` odmawia — format i zawartość zapisu bez zmian.

## Triggered follow-ups

Przeszukane `context/archive/*/follow-ups/review-fixes.md` pod kątem: ta poprawka/audyt, stand-in, `ArtImage`,
wczytywanie obrazków (`BootScene`, `loaderror`, `TASK_ART`), S12-01 / import-reset po `unavailable`/`unreadable`.

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| **`BootScene.preload` `loaderror`**: słuchacz dla całego loadera (komunikat „Task art failed” także dla fontu), jedyny sygnał to konsola. `Trigger: a production report of a missing task image` | `2026-10-14-art-tasks-all-stages` | **W zakresie** — to dokładnie S14-03 (+ S14-08 część „także dla fontu”); trigger nie wystrzelił formalnie, ale audyt go zastępuje. Plan zamyka wpis. |
| **Import or reset over an unreadable save (impl-review F1)**: „Teraz” = świeża sesja, potwierdzony import/reset nadpisuje nieczytelny zapis (może `future` po rollbacku). `Trigger: … or the next change to saveImportDialog.ts / saveResetDialog.ts` | `2026-10-13-save-export-import-reset` | **W zakresie** — to S12-01 dla `unreadable`; trigger wystrzeli (zmiana tych dialogów). Plan zamyka wpis. |
| **Import from the welcome screen** (rodzic nie dojdzie do panelu po nieczytelnym zapisie). `Trigger: a parent who cannot reach the panel after an unreadable save` | jw. | **Poza zakresem** — trigger nie wystrzelił; S12-01 dotyczy treści dialogu, nie miejsca. |
| **N-7: timeout versus rejection on a cold IndexedDB open** (`loadSave`). `Trigger: an iPad measurement of a cold IndexedDB open` | jw. | **Poza zakresem** jako pomiar; ale decyzja S12-01 dla `unavailable` (ponowny odczyt vs odmowa) musi być bezpieczna także dla `timeout` przy zdrowym magazynie (decyzja 5). |
| **Wspólny `ArtPool` i `fitRect`** (powtórzone `area`/`bounds`/`setVisible`/`art` w 5 widżetach). `Trigger: S-14b or the next widget built on ArtImage` | `2026-10-14-art-tasks-all-stages` | **Poza zakresem** — nie budujemy nowego widżetu na `ArtImage`, tylko zmieniamy jego stand-in. |
| **`check:deploy` dla assetów**. `Trigger: a production report of a missing task image` | jw. | **Poza zakresem** — = S14-06, odłożone (tabela wyżej). |
| **O1: rysunek w fazie rozwiązania przy klawiaturze ma 190 px** (odważniki nieczytelne). `Trigger: a teacher read or a tablet check finding the scale …` | jw. | **Poza zakresem** — dotyczy prawdziwych obrazków; dopasowanie tekstu stand-inu (S14-02) musi jednak działać także w tym 190-px obszarze (bramka wizualna). |
| **Atlas tekstur**. `Trigger: S-16` | jw. | Poza zakresem. |

## Autonomous decisions

1. **Zakres: S14-01, S14-02, S14-11, S14-03, S14-04, S12-01 + limit czasu testów `forEachTask` w `tests/spoken.test.ts`;
   dwa otwarte follow-upy (BootScene `loaderror`, S-12 impl-review F1) zamykane przy okazji.** Reszta audytu → follow-upy
   (tabela w Notes). Odrzucone: dołożenie S14-05 (wyniki ze stand-inem poza opanowaniem) i S14-08 w całości. Dlaczego:
   kontrakt runu fixuje zakres z kroku 0. Co zmieniłoby odpowiedź: plan wybierze w decyzji 2 rysowanie stand-inu (a nie
   pominięcie umiejętności) i pokaże, że zadanie z etykietą jest nadal trudniejsze niż z obrazkiem — wtedy S14-05 wraca
   jako kandydat; S14-08 wchodzi, jeśli research pokaże, że handler `loaderror` i tak jest przepisywany (kilka linii).
2. **S14-01: obie warstwy — polska etykieta stand-inu ZAWSZE + (preferowane przez kontrakt) pominięcie przy wyborze rundy
   umiejętności, których obrazki-nośniki odpowiedzi nie są wczytane; ostateczny wybór warstwy 2 robi plan.** Odrzucone:
   tylko pominięcie (stand-in nadal byłby angielski dla zadań, które się prześlizgną, np. rozgrzewka/`?e2eSkills`, a
   ikony COUNT/MULT_GROUPS i termometr są rozwiązywalne pudełkami); tylko etykieta (kontrakt woli niepokazywanie).
   Dlaczego: etykieta to tania obrona w głębi i jedyny fix S14-02; pominięcie wymaga czystej funkcji w `core` z
   parametrem brakujących kluczy (core nie zna Phasera) i wpięcia w `buildAdaptiveRound`/`buildWarmup`. Co zmieniłoby:
   research pokaże, że pominięcie może opróżnić krok (np. wszystkie umiejętności bieżącego kroku zależą od pieniędzy) —
   wtedy tylko etykieta + sygnał rodzica, a pominięcie jako follow-up.
3. **Źródło etykiety: dane, nie `pl.ts` i nie id pliku.** Monety/banknoty `formatMoney(grosze)` (z `core/text/measure`),
   dzbanki `JUGS[].label`, odważniki `WEIGHTS[].label`, ikony `ICONS[].noun`, waga i rama termometru — pusta etykieta albo
   krótki tekst z `pl.ts` (plan). Jedna tabela „klucz → etykieta” obok `TASK_ART`, test, że każdy klucz `TASK_ART` ma
   niepustą polską etykietę bez `-` i bez łacińskiego id (S14-11). Odrzucone: pole `label` dopisane ręcznie w `MONEY`
   (duplikuje `formatMoney`). Co zmieniłoby: teacher read uzna „5 gr” na pudełku za mylące bez kształtu monety.
4. **S14-03 + S14-04: jeden rekord zdrowia obrazków w runtime.** Po wczytaniu (`BootScene.create`) lista kluczy `TASK_ART`
   bez tekstury (`textures.exists`) — łapie i `loaderror`, i błąd dekodowania bez zdarzenia; `loaderror` zostaje tylko do
   logu. Rekord w rejestrze, czysty widok (wzór `saveHealthView`) jako linia w panelu rodzica przy „Zapis gry”, czytana
   przy otwarciu panelu; dziecko nie widzi nic. Odrzucone: liczba na karcie błędu (karta jest dla awarii fatalnej, tu
   gra działa); telemetria (PRD). Co zmieniłoby: research pokaże, że Phaser 4.2.1 jednak tworzy teksturę `__MISSING` pod
   kluczem przy błędzie dekodowania (wtedy `textures.exists` kłamie i trzeba `this.load.totalFailed`/zdarzenia
   `FILE_PROCESS_ERROR`-like).
5. **S12-01: nie pokazywać świeżej sesji jako „Teraz” i nie nadpisywać po cichu.** Dialogi importu/resetu dostają
   `blockedBy` (lub gotowy stan „zapis na urządzeniu: nieodczytany/nieczytelny”) i pokazują tekst zamiast podsumowania;
   `replace` przy `unavailable`/`unreadable` wymaga jawnego potwierdzenia rodzica w tym tekście (import kopii przy
   nieczytelnym zapisie jest zamierzoną naprawą — audyt § „Autonomous decisions”) albo odmawia; plan wybiera między
   „pokaż ostrzeżenie + pozwól” a „odmów przy `unavailable`, pozwól przy `unreadable` z ostrzeżeniem i odesłaniem do
   kopii z karty”. Odrzucone: ponowny odczyt magazynu w dialogu (nowe asynchroniczne I/O w dialogu, S12-02 bez limitu
   czasu). Co zmieniłoby: pomiar N-7 pokaże częste `timeout` przy zdrowym IDB — wtedy ponowny odczyt przed „Teraz” staje
   się warty kosztu.
6. **Flaky test: podnieść limit czasu (`30_000`, komentarz jak w `cd42b4a`) na wszystkich testach `forEachTask` w
   `tests/spoken.test.ts` blisko 5 s, bez zmiany asercji.** Odrzucone: globalny `testTimeout` w `vitest.config.mts`
   (ukryłby inne wolne testy); przyspieszenie `forEachTask` (zmiana pokrycia). Co zmieniłoby: plan zmierzy, że tylko
   jeden test jest blisko limitu — wtedy tylko on.
7. **E2E:** szew `?e2eArt=missing` (tylko build hook, marker w `vite/e2eHookGuard.mjs`, dowód nieobecności w `dist/`)
   wymusza brak tekstur; spec: zadanie pieniężne pokazuje polską etykietę albo nie pojawia się, linia „Obrazki” w panelu;
   import/reset przy `?e2eSave=unavailable` nie pokazuje „0 gwiazdek” jako „Teraz”. Subagent nie uruchamia Chromium —
   protokół request-file. Co zmieniłoby: research pokaże, że brak tekstur da się wymusić bez nowego szwu (np. przez
   przechwycenie żądań w Playwright `page.route`) — wtedy bez nowego markera.
8. **Następny krok `/10x-research`** (narzucony przez run, nie domyślny `/10x-plan` skilla): do ustalenia zachowanie
   Phasera 4.2.1 przy błędzie dekodowania, gdzie wpiąć pominięcie umiejętności (`buildAdaptiveRound`, `buildWarmup`,
   `?e2eSkills`), jakie typy zależą od obrazka-nośnika odpowiedzi (MONEY_COUNT, MONEY_CHANGE, CAPACITY, MASS; COUNT,
   MULT_GROUPS, TEMPERATURE — rozwiązywalne pudełkami?), czasy testów `forEachTask`.
