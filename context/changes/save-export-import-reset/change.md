---
change_id: save-export-import-reset
title: Eksport, import i reset zapisu w panelu rodzica oraz domknięcie ustaleń audytu zapisu
status: new
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

Slice roadmapy **S-12** (etap M5, zamyka M5), autonomiczny run `2026-10-13-s12-s14`, gałąź
`feat/save-export-import-reset` cięta z `main` @ `f3088d4`.

- **Outcome (roadmapa):** rodzic w ustawieniach eksportuje zapis do pliku, importuje go po walidacji i podsumowaniu
  (gwiazdki, etap, postęp pokoju) i resetuje grę z potwierdzeniem.
- **PRD:** FR-022 (eksport do pliku JSON, import walidowany z podsumowaniem przed nadpisaniem, reset z potwierdzeniem;
  Socrates: „import złego lub obcego pliku bez potwierdzenia nadpisuje tygodnie postępu”), US-03 AC („Reset gry wymaga
  potwierdzenia; eksport i import zapisu działają bez sieci”; „Dziecko nie trafia do ustawień przypadkowym stuknięciem”).
  Guardrail PRD „Postęp nigdy nie ginie”, FR-021 (nieudany odczyt zostawia stary zapis, rodzic widzi eksport).
- **Plan (`Martynka-urzadza.md`):** § 8 (ustawienia rodzica: „eksport zapisu do pliku JSON, import (plik walidowany, przed
  nadpisaniem podsumowanie: gwiazdki, etap, postęp pokoju), reset gry z potwierdzeniem”), § 11 M5.
- **Test-plan (`context/foundation/test-plan.md`):** ryzyko **#7** („Importing a malformed, oversized, or wrong-version file
  is rejected with a clear message and the current save is unchanged”; unit walidacji + integracja przepływu importu;
  anty-wzorzec „JSON.parse succeeding means the file is valid”), rollout phase 4 (import validation czeka na S-12),
  ryzyka #2/#10 (stan identyczny po restarcie), #15 (callback dialogu w sesji wejścia).
- **Kontrakt runu** `context/runs/2026-10-13-s12-s14/agent-contract.md` § Slice-specific rules / S-12: rozszerzenie zakresu
  o M-S3, L-S2, N-8, M-S2; N-7 poza zakresem; format v1 to drzwi jednokierunkowe; nic nie opuszcza urządzenia.
- **Wzorce:** `context/archive/2026-10-13-autosave-versioned-save/` (format v1, `decodeSave`, karta nieczytelnego zapisu,
  eksport surowego zapisu), `context/archive/2026-10-13-save-observability-c1-c2/` (status autosavera, sekcja „Zapis gry”).
- Plik `lessons.md` w `context/foundation/` nie istnieje (sprawdzone).

## Roadmap claims vs repo now

Stan sprawdzony na `feat/save-export-import-reset` @ `f3088d4` (roadmapa pisana przed S-08…S-11 i poprawką zdrowia zapisu).

| Roadmap claim | Repo now | Correction |
|---|---|---|
| Prerequisite S-11 (autozapis, wersjonowany zapis) | Done: `src/core/save.ts` (`SAVE_VERSION = 1`, `encodeSave`, `decodeSave`, `validateSave`, `MIGRATIONS` puste, `rawExportText`), `src/core/autosave.ts` (`loadSave`, `createAutosaver`), `src/storage/idb.ts` (`createIdbSaveStore`, klucz `profile:default`), fixtures `tests/fixtures/save-v1*.json`. Dodatkowo po S-11: `save-observability-c1-c2` (status `blockedBy`/`lastError`/`lastWriteAt`/`consecutiveFailures`, `src/core/saveHealth.ts` `saveHealthView`, sekcja „Zapis gry” `src/ui/dom/saveHealthView.ts`). | Bez korekty; slice buduje na tych symbolach, nie na nowych. |
| „rodzic w ustawieniach …” | `src/ui/dom/settingsPanel.ts` `openSettingsPanel` (etap, czytanie, „Zapis gry”, podgląd postępów, „Zatwierdź”/„Anuluj”), otwierany z `src/scenes/UIScene.ts` `openSettings` po przytrzymaniu zębatki i `openParentGate`. Brak jakichkolwiek przycisków eksportu, importu, resetu. Panel dostępny dopiero gdy istnieje learner (`openSettings` wraca bez `learner`), czyli po ekranie powitalnym. | Akcje dochodzą do istniejącego panelu (bez nowej bramki: panel już jest za bramką). Uwaga: przy `unreadable`/`unavailable` saver jest zablokowany, a dziecko gra świeżą sesję — import z panelu jest wtedy jedyną drogą odzyskania (patrz decyzja 5). |
| „eksportuje zapis do pliku” (FR-022: „plik JSON”) | Istnieje tylko eksport SUROWEGO nieczytelnego zapisu z karty startowej: `src/ui/dom/saveExport.ts` `exportRawSave` (share sheet → fallback `a.download`, plik `pl.saveFailed.fileName` = `martynka-zapis.txt`, `text/plain`, DESIGN-GAP 44), wołany z `src/main.ts` `start` za `openParentGate`. Brak eksportu bieżącego stanu. | Eksport bieżącego stanu = `encodeSave(snapshot)` (ten sam kształt co zapis v1) przez ten sam mechanizm pliku; nazwa/typ pliku do ustalenia w planie (FR-022 mówi JSON, gap 44 wybrał `.txt` z powodu iPada). L-S2: pobranie dopiero po wyraźnym potwierdzeniu. M-S3: plik niesie build i powód. |
| „importuje go po walidacji” | `decodeSave` (migracje → `validateSave` → `toSession`, nigdy nie rzuca) istnieje; `validateSave` zwraca tylko `boolean` (brak ścieżki pola). Brak: wyboru pliku (`<input type=file>`), limitu rozmiaru, `JSON.parse` z obsługą błędu, rozpoznania „to nie jest plik tej gry”. Brak jakiegokolwiek `input type="file"` w `src/`. | Import = plik lokalny → limit rozmiaru → `JSON.parse` → `decodeSave` (ten sam łańcuch migracji, ryzyko #7). Nowy kod: czysty parser w `core` + picker w `ui/dom`. Follow-up F3 (ścieżka pierwszego złego pola) — patrz Triggered follow-ups. |
| „… i podsumowaniu (gwiazdki, etap, postęp pokoju)” | Brak funkcji podsumowania. Są klocki: `src/core/rooms.ts` `roomDone`, `roomsListView`; `src/data/rooms.ts` `ROOMS`, `ROOM_ORDER`, `FIRST_ROOM` (jeden pokój: salon, 10 slotów); etap w `learner.stage`; gwiazdki w `stars`. | Nowa czysta funkcja podsumowania (`core`, dane pokoi jako parametr — `core` nie importuje `data/rooms`), tekst z odmianą liczebników w `src/data/pl.ts` (`plural` z `core/text`). Podsumowanie pokazuje stan z pliku obok bieżącego (decyzja 3). |
| „resetuje grę z potwierdzeniem” | Nic nie istnieje. `freshSession` jest lokalną funkcją w `src/main.ts`; brak ścieżki, która podmienia stan działającej gry (registry jest wypełniany raz w `preBoot`). Autozapis zapisuje `snapshot()` z registry, więc bezpośredni zapis do magazynu zostałby nadpisany przy następnym `markDirty`. | Reset i import potrzebują nowej ścieżki „zastąp zapis i uruchom od nowa” (kandydat: zablokować saver, zapisać nowy stan przez `store.write`, przeładować stronę — `start` wczyta go jak zwykły zapis). Do rozstrzygnięcia w research. |
| Risk: „zamyka etap M5 (test: zamknij i otwórz, stan identyczny)” | e2e już istnieje: `tests/e2e/save-restart.spec.ts` „#2 #10 a reload comes back to the saved learner, stars and room” (+ 6 innych testów zapisu). | Bez korekty; slice dokłada e2e importu/eksportu/resetu na buildzie hooka i nie dubluje testu restartu. |
| Risk: „import to jedyne miejsce, gdzie da się nadpisać tygodnie postępu” | Prawda; dodatkowo reset. Bieżący zapis jest jedynym kluczem `profile:default`, brak kopii poprzedniej wersji. | Podsumowanie + potwierdzenie przed importem i resetem; plik, który nie przejdzie, nigdy nie dotyka bieżącego zapisu; eksport bieżącego stanu proponowany przed nadpisaniem (decyzja 4). |
| PRD refs: roadmapa podaje FR-022, US-03 | Zgodne. | Bez korekty. |
| Plan § 6 (`storage/idb.ts` „zapis/odczyt IndexedDB, eksport/import pliku”) | Eksport pliku żyje w `src/ui/dom/saveExport.ts` (DOM: `File`, `navigator.share`, `a.download`); `idb.ts` jest jedynym importerem `idb-keyval` i trzyma tylko magazyn. | Operacje na pliku zostają w `src/ui/dom/` (API przeglądarki), logika w `src/core/`, `idb.ts` bez zmian poza M-S2. CLAUDE.md nie wymaga zmiany. |

## Design source and copy (profile § 6)

- Kit: `Martynka-urzadza.md` § 8 (tylko lista funkcji, bez widoków i tekstów), `designs/martynka-maths-A-v1/style-guide.md`
  i `screenshots/` (welcome, task, summary, unlock — **brak widoku ustawień, eksportu, importu, resetu**).
- Widoki, które slice wiąże: panel ustawień rodzica (sam już jest DESIGN-GAP 26, `src/ui/dom/settingsPanel.ts`),
  sekcja „Zapis gry” (gap 43), karta nieczytelnego zapisu (gap 42), plik kopii (gap 44), karta braku magazynu (gap 45).
- **DESIGN-GAP (nowe wiersze w `docs/design-gaps.md`, od 46):** akcje eksport/import/reset w panelu; potwierdzenie
  eksportu (L-S2); podsumowanie importu (bieżący vs z pliku) i komunikat odrzuconego pliku; potwierdzenie resetu;
  stany „jeszcze nie zapisano” / „wcześniej N nieudanych prób (<nazwa>)” i wynik `persist()` w „Zapis gry”; powód i
  build na karcie `unreadable` (rewizja gapów 42/44). Nic nie jest wymyślane poza tym, co kit + plan dają: układ z
  istniejących części (`openDialog`, `createButton`, `createText`, `overlay-muted`), teksty po polsku w `src/data/pl.ts`.
- **Klucze tekstów, które slice dotyka/dodaje w `src/data/pl.ts`:** istniejące `settings.saveHeading`, `settings.saveOk`,
  `settings.saveLast`, `settings.saveFailing`, `settings.saveOff.*`, `saveFailed.*` (w tym `fileName`), `parent.confirm`,
  `parent.cancel`; nowe (nazwy w planie) dla: eksportu, potwierdzenia eksportu, importu, podsumowania (gwiazdki z
  odmianą: „1 gwiazdka / 2 gwiazdki / 5 gwiazdek”), odrzuconego pliku, resetu, „jeszcze nie zapisano”, wcześniejszych
  porażek, trwałości (`persist()`), powodu i buildu na karcie. Teacher read nie dotyczy generatorów, ale każdy tekst z
  liczbą przechodzi kontrolę odmiany.

## Migration expected?

**Nie.** Format zapisu zostaje v1 (`SAVE_VERSION = 1`, `MIGRATIONS` puste, fixtures `tests/fixtures/save-v1*.json`
nietknięte). Import przechodzi przez `decodeSave` (łańcuch migracji + `validateSave`), więc przyszły v2 przyjmie plik v1.
Pola runtime (wynik `persist()`, historia porażek) idą do `AutosaveStatus`, nigdy do `SaveState`. Ewentualna „koperta”
pliku eksportu (build, powód, data) jest formatem PLIKU, nie zapisu — import rozpakowuje ją przed `decodeSave` i
przyjmuje też gołą wartość v1. Profil § 4: brak bazy danych, brak migracji SQL. Co zmieniłoby odpowiedź: potrzeba
zapisania w stanie czegoś nowego (np. znacznika „zaimportowano”) — odrzucone z góry.

## Scope

### Roadmap outcome (FR-022, US-03)

1. **Eksport** bieżącego zapisu z panelu ustawień (za bramką), lokalny plik, bez sieci; pobranie po wyraźnym potwierdzeniu (L-S2).
2. **Import**: wybór pliku lokalnego → limit rozmiaru → parse → `decodeSave` → podsumowanie (gwiazdki, etap, postęp
   pokoju) → potwierdzenie → nadpisanie. Plik zły / za duży / z przyszłej wersji / obcy → jasny komunikat, bieżący zapis
   nietknięty (ryzyko #7).
3. **Reset** z potwierdzeniem (podsumowanie tego, co zniknie) → świeża sesja (ekran powitalny).

### Audit extension (contract § Slice-specific rules; audit `context/audits/observability/2026-10-13_1751-zdrowie-zapisu-po-poprawce.md` § 5)

| Id | File + SYMBOL | What S-12 does |
|---|---|---|
| **M-S3** | `src/main.ts` `start` (`console.warn(\`Save unreadable (${outcome.reason})…\`)`, `copy: pl.saveFailed`) + `src/ui/dom/saveFailedCard.ts` `mountSaveFailedCard` (+ `SaveCardCopy.note`) + `src/ui/dom/saveExport.ts` `exportRawSave` / `src/core/save.ts` `rawExportText` | Karta `unreadable` pokazuje krótki kod powodu (`corrupt`/`future`/`unknown-version`) i `__BUILD_ID__` (wzór: `pl.errorCard.build`); plik eksportu (surowy i bieżący) niesie build i powód. |
| **L-S2** | `src/ui/dom/saveExport.ts` `exportRawSave` (`a.download` bez śladu) | Pobranie/udostępnienie dopiero po wyraźnym potwierdzeniu rodzica (krok „Zapisz plik” w dialogu), z krótką informacją po akcji, co się stało (udostępniono / pobrano / anulowano). |
| **N-8** | `src/core/saveHealth.ts` `saveHealthView` (`ok` gdy `writes === 0`) + `src/ui/dom/saveHealthView.ts` `createSaveHealthView` (bez `lastError`, bez `failures`) | Stan „jeszcze nie zapisano” przy `writes === 0`; notka „wcześniej N nieudanych prób (<nazwa>)” przy `failures > 0` po sukcesie. |
| **M-S2** | `src/storage/idb.ts` `requestPersistence` (`persist()` → `.catch(() => undefined)`, wynik odrzucony) + `src/core/autosave.ts` `AutosaveStatus` / `createAutosaver` (`onFirstWrite`) | Wynik `persist()` (`granted` / `denied` / `unsupported` / `error`) trafia do statusu autosavera (runtime) i jedno zdanie w „Zapis gry”. |
| N-7 | `src/core/autosave.ts` `loadSave` timeout | **Poza zakresem** (kontrakt: czeka na pomiar na iPadzie). |

## Triggered follow-ups (archive `follow-ups/review-fixes.md`)

| Follow-up | Source | Take |
|---|---|---|
| „Export, import and reset in the parent panel use `rawExportText` / `exportRawSave` (accepts `.txt` and `.json`), `validateSave` as the import validator (risk #7), and show the save state to the parent … Also F7: `pl.settings.empty`.” `Trigger: S-12` | `2026-10-13-autosave-versioned-save` | **W zakresie** (rdzeń slice'a). Import przyjmuje `.txt` i `.json`. „Show the save state” już zamknięte przez save-observability (Closed). F7 — patrz wiersz F7 niżej. |
| Eksport niesie przykłady błędów dziecka — notka prywatności przy eksporcie i przy imporcie cudzego pliku (plan-review F6). `Trigger: S-12` | `2026-10-13-parent-settings-progress` | **W zakresie**: jedno zdanie `overlay-muted` w dialogu eksportu i importu (tekst w `pl.ts`). |
| M-S2 `persist()`. `Trigger: S-12 …` | `2026-10-13-save-observability-c1-c2` | **W zakresie** (rozszerzenie kontraktu). |
| M-S3 + L-S1 — powód i build na karcie `unreadable`. `Trigger: S-12 or the next change to saveFailedCard.ts` | `2026-10-13-save-observability-c1-c2` | M-S3 **w zakresie**. L-S1 (`decodeSave` `catch` → `corrupt`, osobny `migration-failed`): **poza zakresem** — `MIGRATIONS` puste, ścieżka nieosiągalna, zmiana typu `DecodeResult.reason` bez wartości; follow-up z triggerem „first migration step (v2)”. |
| L-S2 `exportRawSave`. `Trigger: S-12` | `2026-10-13-save-observability-c1-c2` | **W zakresie** (rozszerzenie kontraktu). |
| Plan review F3 (audit C-2): `validateSave` zwraca ścieżkę pierwszego złego pola do logu. `Trigger: S-12 import validator …` | `2026-10-13-save-observability-c1-c2` | **W zakresie, tanio i czysto w `core`**: nowa funkcja zwracająca ścieżkę (np. `saveProblem(value): string \| null`), `validateSave` zostaje predykatem o tej samej sygnaturze (używa jej `createAutosaver.attempt`); ścieżka idzie do `console.warn` przy odrzuconym imporcie i do logu `InvalidSave`. Rodzic dostaje prosty komunikat, nie ścieżkę. Co zmieniłoby: research pokaże, że to wymaga przepisania walidatora — wtedy follow-up. |
| (F7) `pl.settings.empty` także dla dziecka bez błędów. `Trigger: S-11, or a parent's feedback on the preview` | `2026-10-13-parent-settings-progress` (przeniesione przez S-11 do S-12) | **Poza zakresem**: to podgląd postępów, nie zapis; trigger S-11 minął bez zmiany, a feedbacku rodzica brak. Przenieść z triggerem „parent's feedback on the preview or S-17”. |
| (F5) `UIScene` long-press reset przy drugim overlayu nad HUD. `Trigger: any new overlay that calls suspend() while the HUD exists` | `2026-10-13-parent-settings-progress` | **Warunkowo**: jeśli import/reset/eksport otwierają dialogi poza sesją panelu (osobne `suspend()`), wchodzi; jeśli są krokami wewnątrz tej samej sesji `openInputSession` z `openSettings` — nie odpala. Research rozstrzygnie. |
| (F6) `WelcomeScene.openParent` guard. `Trigger: the next change to WelcomeScene or UIScene` | `2026-10-13-parent-settings-progress` | **Wchodzi tylko, jeśli zmieniamy `UIScene`** (prawdopodobne: `openSettings` dostaje handlery akcji zapisu) — wtedy jednolinijkowe wyrównanie do `active()`/guard `undefined`. |
| F2 `tests/dialogSessions.test.ts` `DIALOG_CALLBACKS`. `Trigger: any new dialog callback in src/scenes/` | `2026-10-13-observability-c1-c2` | **W zakresie, jeśli** nowe callbacki (`onExport`, `onImport`, `onReset`) przechodzą przez `UIScene` — każdy w `session.run`, test rozszerzony. |
| L-S3 `visibilitychange` (flush przed `narrator.cancel()`). `Trigger: the next change to the visibilitychange handler in main.ts` | `2026-10-13-save-observability-c1-c2` | **Tylko jeśli** slice dotknie tego handlera (np. ścieżka przeładowania po imporcie musi go wyłączyć) — wtedy wchodzi (kilka linii). |
| F3 S-11 `?e2eSave=unavailable` seam. `Trigger: next change to start() / e2eSaveStore` | `2026-10-13-autosave-versioned-save` | **Już zamknięte** (save-observability dodało `?e2eSave=unavailable|hang|writefail` i spec „#2 C-1”). |
| F4 S-11 explicit `?e2eSave=` cases. `Trigger: next change to vite/e2eHookGuard.mjs` | `2026-10-13-autosave-versioned-save` | **Już zamknięte** (save-observability Closed). Nowy szew e2e (jeśli powstanie) dostaje swój przypadek w `tests/e2eHookGuard.test.ts`. |
| Dwie instancje jednego originu. `Trigger: first save-format change (v2), or a parent reporting lost progress` | `2026-10-13-autosave-versioned-save` | **Poza zakresem** (brak v2). Uwaga dla planu: import/reset z przeładowaniem w jednej karcie nie ostrzega drugiej — zostaje ryzykiem. |
| M-S1 (deploy rule), M-R4, L-R8/L-R9/L-R11, F3 M-R5r | `2026-10-13-save-observability-c1-c2` | **Poza zakresem** (inne triggery; `deploy/` zakazane w runie). |

## Autonomous decisions

1. **Zakres = outcome roadmapy + M-S3, L-S2, N-8, M-S2 + follow-upy oznaczone „W zakresie” powyżej (notka prywatności,
   ścieżka złego pola obok `validateSave`).** Odrzucone: L-S1 i F7 (brak osiągalnej ścieżki / inny obszar), N-7
   (kontrakt). Dlaczego: kontrakt wprost rozszerza zakres o cztery ustalenia; reszta z triggerem S-12 jest tania i siedzi
   w tych samych plikach. Co zmieniłoby odpowiedź: research pokaże, że slice przekracza ~6 faz — wtedy N-8/M-S2 (sekcja
   „Zapis gry”) idą jako osobna faza na końcu, a ścieżka pola jako follow-up.
2. **Format zapisu zostaje v1, bez migracji.** Odrzucone: dopisanie metadanych (build, data eksportu) do `SaveState`.
   Dlaczego: kontrakt „one-way door”; metadane należą do pliku, nie do stanu. Co zmieniłoby: konieczność rozpoznania
   pliku z innego profilu (`profileId` już jest w v1 — wystarczy).
3. **Podsumowanie importu pokazuje „z pliku” obok „teraz” (gwiazdki, etap, postęp pokoju: zrobione zadania / wszystkie)**
   i wymaga drugiego, wyraźnego stuknięcia „Wczytaj” (tekst w planie). Odrzucone: samo podsumowanie pliku. Dlaczego:
   rodzic nadpisuje „teraz” — musi widzieć, co traci (Socrates FR-022). Co zmieniłoby: kit z widokiem podsumowania.
4. **Przed importem i resetem: krok z eksportem bieżącego stanu jako opcja, nie przymus.** Odrzucone: automatyczna kopia w
   IndexedDB pod drugim kluczem (zmienia zakres magazynu; `idb.ts` trzyma jeden klucz celowo). Co zmieniłoby: zgłoszenie
   rodzica o utracie postępu po imporcie.
5. **Zastosowanie importu/resetu = zablokować autozapis, zapisać nowy stan przez magazyn, przeładować stronę** (kierunek
   do potwierdzenia w research). Odrzucone: podmiana stanu w działającej grze (registry + restart scen — wiele scen trzyma
   własny stan, ryzyko pół-stanów). Dlaczego: `start` już umie wczytać zapis od zera i jest przetestowany e2e. Przy
   zablokowanym saverze (`unreadable`/`unavailable`) import jest dozwolony, bo to droga odzyskania; zapis nadpisuje
   nieczytelny zapis dopiero po potwierdzeniu (przy `unreadable` podsumowanie mówi, że bieżący zapis jest nieczytelny i
   proponuje najpierw „Zachowaj kopię”). Nieudany zapis → komunikat, bez przeładowania, stan nietknięty. Co zmieniłoby:
   research pokaże, że przeładowanie w aplikacji z ekranu iPada gubi coś istotnego (np. odblokowanie mowy — to tylko gest,
   wraca po stuknięciu) albo że `reload` w PWA trafia na stary SW — wtedy podmiana stanu bez przeładowania.
6. **Plik eksportu:** JSON (FR-022), ale nazwa/rozszerzenie i MIME zostają do planu (gap 44 wybrał `.txt` dla iPada);
   import przyjmuje `.json` i `.txt` (follow-up S-11). Limit rozmiaru z `src/data/balance.ts` (nowa liczba w danych, nie
   w scenie). Co zmieniłoby: pomiar na iPadzie, że `.json` przez share sheet działa — wtedy `.json` także dla kopii surowej.
7. **E2E na buildzie hooka** (ryzyko #7, #2): import złego pliku nie zmienia zapisu, import dobrego pliku po potwierdzeniu
   daje stan z pliku po restarcie, reset wraca do powitania; plik wybierany przez Playwright `setInputFiles` (bez nowego
   szwu w produkcji). Ewentualny szew tylko w buildzie hooka z markerem w `vite/e2eHookGuard.mjs`. Subagent nie uruchamia
   Chromium sam — protokół request-file (kontrakt).
8. **Następny krok `/10x-research save-export-import-reset`** (narzucony przez run; skill domyślnie proponuje `/10x-plan`).
   Do ustalenia: mechanizm zastosowania (decyzja 5), miejsce akcji w panelu i sesja wejścia (F5/F2), koperta pliku vs goła
   wartość, zachowanie `<input type=file>` i share sheet na iPadzie, gdzie trzymać wynik `persist()`.
