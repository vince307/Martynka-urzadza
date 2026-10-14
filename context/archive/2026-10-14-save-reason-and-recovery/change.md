---
change_id: save-reason-and-recovery
title: Powód nieudanego odczytu zapisu do końca ścieżki, wyjście z trwałego „unavailable” i uczciwa kopia
status: archived
created: 2026-10-14
updated: 2026-10-14
archived_at: 2026-10-14T13:27:54Z
---

## Notes

Zmiana spoza roadmapy (autonomiczny run `2026-10-14-save-s13b-s15-s14b`, pierwszy slice, gałąź
`feat/save-reason-and-recovery` cięta z `main` @ `16a0abd`). Brak wiersza w roadmapie — statusów w
`context/foundation/roadmap.md` nie edytujemy.

**Źródło:** observability audit 2026-10-14_1110, PR #45: SIR-01, SIR-02, SIR-03, SIR-04, ASL-01 (zakres uzgodniony z
opiekunem w kroku 0 runu, 2026-10-14; kontrakt runu, „Slice-specific rules”).

Wzorce: `context/archive/2026-10-14-art-stand-in-and-load-signal/` (poprzednia poprawka po audycie: `deviceSaveView`,
`tests/deviceSaveWiring.test.ts`, szwy `?e2eSave`, DESIGN-GAP 68) i
`context/archive/2026-10-13-save-observability-c1-c2/` (`saveHealthView` jako czysty widok + linia DOM).
Plik `lessons.md` w `context/foundation/` nie istnieje.

### Zakres

| Id | Co ma się zmienić (cel, nie rozwiązanie) |
|---|---|
| SIR-01 | Zapis `future` (nowszy format) jest zdrowy: powód odczytu (`corrupt` / `future` / `unknown-version`) dociera do statusu autosavera i do `deviceSaveView`; import i reset go nie niszczą (odmowa jak przy `unavailable` albo jawny tekst „zapis z nowszej wersji gry”). Projekt musi działać tak samo, gdy build v2 (S-15) czyta zapis v3: warunek oparty na `reason === 'future'`, nie na numerze wersji. |
| SIR-02 | Trwałe `unavailable` (każdy start) nie zostawia rodzica bez wyjścia: ścieżka w aplikacji (np. po drugim kolejnym starcie `unavailable` albo po wyraźnym drugim potwierdzeniu) albo przynajmniej nazwanie „wyczyść dane strony”. |
| SIR-03 (= N-7, S12-10) | Sekcja „Zapis gry” pokazuje `lastError` przy `off`; `timeout` ma osobny tekst (nie obwinia przeglądarki); karta `unavailable` dostaje `detail` (kod + build) jak karta `unreadable`. |
| SIR-04 (= S12-04) | „Zapisz kopię” przy `unreadable`/`unavailable` nie udaje kopii postępów dziecka: ostrzeżenie w dialogu eksportu albo oznaczenie koperty. |
| ASL-01 | Test, który pada, gdy `TaskScene.freshRound` przestaje przekazywać `missingIds` do `buildAdaptiveRound` lub `blocked` do `buildWarmup`. |

**Format zapisu: zostaje v1** (kontrakt runu; S-15 przeniesie go na v2). Wszystko nowe (powód odczytu, licznik startów
`unavailable`) jest stanem runtime albo wygodą poza zapisem — nigdy w `SaveState`, `SAVE_KEYS` ani fixture'ach v1.

### Weryfikacja twierdzeń audytu (repo @ `16a0abd`)

| Twierdzenie audytu | Repo teraz | Korekta |
|---|---|---|
| SIR-01: `LoadOutcome.reason` gubiony w `BlockReason` | Potwierdzone: `src/core/autosave.ts` `LoadOutcome` ma `reason: 'corrupt' \| 'future' \| 'unknown-version'`, `BlockReason = 'unreadable' \| 'unavailable' \| 'fatal'`; `main.ts` `start` przekazuje do `createAutosaver` tylko `blockedBy: outcome.kind` (bez `reason`); `AutosaveStatus` ma `load: LoadOutcome['kind']`, bez powodu | brak |
| SIR-01: `deviceSaveView` mapuje każde `unreadable` na jeden widok i pozwala na import/reset | Potwierdzone: `src/core/saveFile.ts` `deviceSaveView` → `{ kind: 'unreadable' }` bez powodu; `replace` odmawia tylko `fatal`/`unavailable`; tekst `pl.saveTransfer.deviceUnreadable` mówi „nie da się odczytać” | brak |
| SIR-01: `decodeSave` zwraca `future` dla wersji > `SAVE_VERSION`; seam e2e (wersja 99) to ten przypadek | Potwierdzone: `src/core/save.ts` `decodeSave`; `src/testing/e2eHook.ts` `{ version: 99, … }` dla `?e2eSave=unreadable` | Uwaga dla planu: istniejące e2e „unreadable” testuje w praktyce `future`; po poprawce potrzebny osobny szew dla `corrupt`, inaczej zmiana zachowania `future` zmieni oczekiwania obecnych specyfikacji |
| SIR-02: `replace` odmawia `Blocked` przy `unavailable`, `blockedStep` w imporcie, rada „Uruchom grę ponownie” | Potwierdzone: `Autosaver.replace` (komentarz „Unavailable: the device save may be healthy…”), `saveImportDialog.ts` `blockedStep`, `pl.saveTransfer.deviceUnavailable` kończy się „Uruchom grę ponownie i spróbuj jeszcze raz.”; reset przy `blocked` daje tylko „Zamknij” | brak |
| SIR-02: nikt nie liczy kolejnych startów `unavailable` | Potwierdzone: brak `localStorage` i licznika w `src/` | brak |
| SIR-03: `lastError` ustawione z `loadError`, ale nie rysowane | Potwierdzone: `createAutosaver` `lastError = options.loadError`; `saveHealth.ts` `stateOf` → `{ kind: 'off', cause }` bez błędu; `saveHealthView.ts` rysuje tylko `pl.settings.saveOff[cause]` | brak |
| SIR-03: `timeout` i odrzucenie dają ten sam tekst | Potwierdzone: `loadSave` rzuca błąd z `name: 'timeout'`, który trafia do `outcome.error`; tekst `saveOff.unavailable` i karta `pl.saveUnavailable` są wspólne | brak |
| SIR-03: karta `unavailable` bez `detail` | Potwierdzone: `main.ts` `start` — `detail` tylko gdy `reason !== null` (czyli tylko `unreadable`) | brak |
| SIR-04: `openExport` eksportuje `saver.current()` bez względu na `blockedBy` | Potwierdzone: `UIScene.openExport` → `exportFileText({ kind: 'save', …, save: saver.current() })`, bez `deviceSaveView` | Częściowo złagodzone tekstem: `pl.saveTransfer.deviceUnreadable` (import/reset) już mówi, że „Zapisz kopię” zapisuje tylko obecną grę; sam dialog eksportu — nic (zgodne z audytem „changed, częściowo, tekstem”) |
| ASL-01: `freshRound` przekazuje `missingIds`/`blocked`, brak testu okablowania; `?e2eSkills` wraca przed `buildAdaptiveRound` | Potwierdzone: `TaskScene.freshRound`; `missingIds` w testach tylko w `tests/artHealth.test.ts` i `tests/artFilter.test.ts`; ścieżka `forcedSkills` wraca przed `buildAdaptiveRound` | brak |

Żadne twierdzenie nie okazało się nieaktualne; jedyna nowa obserwacja: szew `?e2eSave=unreadable` jest przypadkiem
`future`, więc SIR-01 zmieni zachowanie, które dziś sprawdzają specyfikacje e2e.

### Źródło prawdy projektu (profil § 6) i klucze tekstów

- Kit (`Martynka-urzadza.md`, `designs/martynka-maths-A-v1/`) **nie ma widoków** dla: karty nieudanego zapisu, sekcji
  „Zapis gry”, dialogów eksportu/importu/resetu. Wszystko to są istniejące DESIGN-GAP-y: 42 (karta `unreadable`),
  43 (wskaźnik zapisu → panel rodzica), 45 (karta `unavailable`), 46–51 (eksport/import/reset, 51 = kod i build na
  karcie), 68 (zapis na urządzeniu nieodczytany w imporcie/resecie). Nowe teksty dostają wiersz DESIGN-GAP w
  `docs/design-gaps.md` (następny wolny numer: 69) — nigdy wymyślone poza tym trybem.
- Klucze tekstów, które ta zmiana wiąże (`src/data/pl.ts`): `pl.settings.saveOff` (`unreadable`, `unavailable`,
  `fatal`), `pl.settings.saveEarlier`, `pl.saveFailed.detail`, `pl.saveUnavailable` (`title`, `body`, `note`),
  `pl.saveTransfer.deviceUnavailable`, `pl.saveTransfer.deviceUnreadable`, teksty dialogu eksportu w `pl.saveTransfer`.
  Nowe (np. tekst `timeout`, „zapis z nowszej wersji gry”, ostrzeżenie w eksporcie, rada „wyczyść dane strony”) — w
  `pl.ts`, z DESIGN-GAP.
- Wspólne komponenty: `src/ui/dom/` (`saveHealthView.ts`, `saveFailedCard.ts`, `saveExportDialog.ts`,
  `saveImportDialog.ts`, `saveResetDialog.ts`, `saveSummaryView.ts`); żadnych nowych widoków obok.

### Otwarte follow-upy, których `Trigger:` wskazuje tę zmianę

| Follow-up (plik) | Trigger | Moje zdanie o zakresie |
|---|---|---|
| S12-02..S12-15 (`2026-10-14-art-stand-in-and-load-signal/follow-ups/review-fixes.md`) | „the next change to the save panel or autosave.replace” | Spełniony. W zakresie: S12-04 (= SIR-04) i S12-10 (= SIR-03). Kandydaci tani, jeśli plan i tak dotyka tych miejsc: S12-03 (`stateOf` nie czyta `status.replace`), S12-11 (porażki `replace` liczone do `failures`), SIR-05 (log przy odmowie `replace`) i SIR-06 (tekst dla `fatal`) — decyzja w planie. Reszta (S12-02 limit czasu `replace`, S12-05, S12-06, S12-13, S12-07..09/12/14/15) zostaje z **nowym, konkretnym** triggerem (zamyka też SIR-07 dla tej listy). |
| N-7 (`2026-10-13-save-export-import-reset/…`) | „an iPad measurement of a cold IndexedDB open” | Część „osobny tekst dla `timeout` + `detail` na karcie” wchodzi przez SIR-03 (kontrakt). Sam pomiar na iPadzie i ewentualna zmiana `balance.save.loadTimeoutMs` — nie; zostaje `[human]`/follow-up. |
| „Import or reset over an unreadable save (impl-review F1)” (`2026-10-13-save-export-import-reset/…`) | „first save-format change (v2) or first deploy rollback across a save version, or the next change to saveImportDialog.ts / saveResetDialog.ts” | Spełniony (zmienimy oba dialogi). Linia ostrzeżenia już istnieje (`deviceUnreadable`, poprzednia poprawka); brakująca część to dokładnie SIR-01 (`future` nie może być nadpisany) — zamykamy tutaj. |
| „Import from the welcome screen” (`2026-10-13-save-export-import-reset/…`) | „a parent who cannot reach the panel after an unreadable save” | Nie spełniony (brak zgłoszenia). Plan może rozważyć go jako część wyjścia SIR-02, jeśli wyjście ma być na karcie startowej; domyślnie poza zakresem. |
| „Two browser tabs of one origin”, „First save-format change (v2)”, two-build e2e, M-S1, L-S1 | pierwsza zmiana formatu (v2) | Nie spełniony — format zostaje v1. Należą do S-15. |

### Poza zakresem (follow-upy z `Trigger:` pisze plan/ship w `follow-ups/review-fixes.md` tej zmiany)

SIR-05, SIR-06, SIR-07 (o ile plan nie weźmie ich tanio — patrz wyżej), ASL-02..ASL-09.

## Autonomous decisions

1. **Zakres = SIR-01..04 + ASL-01, dokładnie jak w kontrakcie.** Odrzucone: dołożenie ASL-02 (ten sam wzorzec widoku
   co SIR-03) i całej listy S12. Dlaczego: kontrakt fixuje zakres z kroku 0; tanie dodatki (S12-03, S12-11, SIR-05,
   SIR-06) zostawiam planowi jako kandydatów, bo dotykają tych samych symboli. Co zmieniłoby: research pokaże, że
   SIR-03 przepisuje `stateOf` w całości — wtedy S12-03 wchodzi naturalnie.
2. **SIR-01: preferowana odmowa importu/resetu przy `future` (jak `unavailable`), z tekstem „zapis z nowszej wersji
   gry”; ostateczny wybór w planie.** Odrzucone: tylko tekst z dozwolonym nadpisaniem. Dlaczego: zapis `future` jest
   zdrowy i odzyskiwalny po aktualizacji gry, nadpisanie byłoby jedyną nieodwracalną utratą postępu (PRD: postęp nigdy
   nie ginie); kontrakt dopuszcza obie drogi. Co zmieniłoby: research pokaże, że odmowa przy `future` zostawia rodzica
   bez wyjścia (np. rollback na stałe) — wtedy wyjście SIR-02 musi objąć też `future`.
3. **Powód odczytu jako stan runtime (`AutosaveStatus`), format v1 bez zmian.** Odrzucone: nowe pole w `SaveState`.
   Dlaczego: kontrakt; powód opisuje ten start, nie postęp. Co zmieniłoby: nic w tej zmianie.
4. **SIR-02: licznik kolejnych startów `unavailable` poza zapisem (np. `localStorage`, z try/catch) jest kandydatem,
   ale plan decyduje między nim a „drugim potwierdzeniem” w dialogu.** Dlaczego: magazyn, który zawiódł, nie może nieść
   własnego licznika; `src/core` zostaje czysty (licznik wstrzykiwany). Co zmieniłoby: research pokaże, że
   `localStorage` jest niedostępny w tych samych warunkach co IDB (tryb prywatny iPadOS) — wtedy tylko drugie
   potwierdzenie + rada „wyczyść dane strony”.
5. **E2E zostaje w zasięgu (E2E=on):** istniejące szwy `?e2eSave=unreadable|unavailable|hang` pokrywają `future`,
   `unavailable` i `timeout`; nowy szew (np. `corrupt`) tylko z markerem w `vite/e2eHookGuard.mjs`. Co zmieniłoby:
   research pokaże, że testy jednostkowe + test okablowania wystarczą dla eksportu.
6. **Następny krok `/10x-research`** (narzucony przez run, nie domyślny `/10x-plan` skilla): do ustalenia, które
   specyfikacje e2e polegają na `?e2eSave=unreadable` jako „import dozwolony”, dostępność `localStorage` przy
   niedostępnym IDB, kształt testu okablowania `freshRound` (wzór `tests/deviceSaveWiring.test.ts`).
