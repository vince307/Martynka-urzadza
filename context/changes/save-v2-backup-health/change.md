---
change_id: save-v2-backup-health
title: Nieudana kopia backup-v1 nie wyłącza zapisu, limity czasu zapisu i uczciwy panel „Zapis gry”
status: planned
created: 2026-10-15
updated: 2026-10-15
archived_at: null
---

## Notes

Zmiana spoza roadmapy (autonomiczny run `2026-10-15-fix-s14c-s14d`, pierwszy slice, gałąź
`feat/save-v2-backup-health` cięta z `main` @ `16848c6`). Brak wiersza w roadmapie — statusów w
`context/foundation/roadmap.md` nie edytujemy.

**Źródło:** observability audit 2026-10-15_0253, PR #52: SV2-01, SV2-02, SV2-03, SRR-02 (zakres uzgodniony z
opiekunem 2026-10-15, „fix po audycie”, CRITICAL/HIGH; kontrakt runu, „Slice-specific rules”). Findings medium/low →
follow-upy z `Trigger:`.

Wzorce: `context/archive/2026-10-14-save-reason-and-recovery/` (poprzednia poprawka zapisu: `replaceGate`,
`deviceSaveView`, `offState` z kodem, szwy `?e2eSave`, DESIGN-GAP 69–71) i
`context/archive/2026-10-14-art-stand-in-and-load-signal/` (stan runtime poza zapisem + linia w panelu rodzica).
Projekt kopii `backup-v1` i jego otwarte ryzyka: `context/archive/2026-10-14-minigame-daily-puzzle/` (plan faza 2
„Kopia przed pierwszym zapisem”, plan-review F5 i F7). Plik `lessons.md` w `context/foundation/` nie istnieje.

### Zakres

| Id | Co ma się zmienić (cel, nie rozwiązanie) |
|---|---|
| SV2-01 (CRITICAL, na produkcji od #50) | Urządzenie, na którym zapis kopii `profile:default:backup-v1` się nie udaje, **nie traci postępu po cichu przy każdym uruchomieniu**, a zapis v1 nie jest niszczony bez świadomej decyzji polityki. Porażka kopii jest osobnym, nazwanym stanem (nie „write failed”), widocznym rodzicowi z kodem. |
| SV2-02 (= SRR-03, S12-02) | Kopia, zapis i `replace` mają limit czasu (wzorzec `loadSave` `limit`); zawieszenie jest nazwaną porażką (`timeout`), nie stanem `notYet`; `replace` nie czeka bez końca na martwe `inflight`; dialogi importu i resetu odzyskują „Zamknij”. |
| SV2-03 (+ SV2-09, SRR-06) | Panel „Zapis gry” mówi o skutku, nie o zamiarze: linia „przeniesiono z wersji 1” dopiero po udanym zapisie v2 i z informacją, czy kopia v1 istnieje; stan `failing` niesie kod (i etap: kopia / zapis / kodowanie). |
| SRR-02 | Odczyt, który przy każdym starcie przekracza `balance.save.loadTimeoutMs`, nie zostawia rodzica w pętli „Uruchom grę ponownie”: po N kolejnych startach z `timeout` jest wyjście (rada „usuń dane strony” i/lub wymuszenie ze świadomym ostrzeżeniem). |

**Format zapisu: zostaje v2** (kontrakt runu: zmiana wymagająca v3 kończy się na otwartym PR). Wszystko nowe (stan
kopii, etap porażki, licznik startów z `timeout`) to stan runtime w `AutosaveStatus` albo wygoda poza zapisem (np.
`localStorage` z try/catch) — nigdy w `SaveState`, `SAVE_KEYS` ani w fixture'ach `tests/fixtures/` (zostają bajt w
bajt). Klucz kopii `profile:<id>:backup-v<from>` i układ magazynu bez zmian, chyba że plan wybierze opcję C niżej
(wtedy plan musi uzasadnić, że to nie jest zmiana formatu, i zachować odczyt dzisiejszego układu).

### Weryfikacja twierdzeń audytu (repo @ `16848c6`)

| Twierdzenie audytu | Repo teraz | Korekta |
|---|---|---|
| SV2-01: `attempt` robi `store.backup` przed `store.write` w tym samym `try`; porażka kopii zostawia `backedUp = false`, każda próba ponawia kopię i znowu zawodzi | Potwierdzone: `src/core/autosave.ts` `createAutosaver` `attempt` (`if (!backedUp && options.migrated) { await store.backup(...); backedUp = true; }` przed `await store.write`); brak licznika ani polityki porażek kopii | brak |
| SV2-01: log mówi `autosave: write failed`, bez słowa o kopii | Potwierdzone: jeden `catch` w `attempt` → `log('autosave: write failed', e)` | brak |
| SV2-01: główny klucz zostaje v1, więc każdy start znowu migruje | Potwierdzone: `src/main.ts` `start` przekazuje `migrated` z `outcome.migratedFrom`; `src/storage/idb.ts` `backup` pisze pod `${key}:backup-v${from}` przez to samo `run` (jedno ponowienie przy `InvalidStateError`/`UnknownError`) | brak |
| SV2-02: kopia, zapis i `replace` bez limitu czasu; zawieszenie → `notYet` | Potwierdzone: `attempt` i `replace` (`await inflight; await store.write(state)`) bez wyścigu z zegarem; `src/core/saveHealth.ts` `stateOf` → `notYet` przy `writes === 0` i `consecutiveFailures === 0`; `save` zwraca to samo `inflight` przy każdym `flush` | brak |
| SV2-02: import/reset czekają na martwe `inflight`, przyciski wyłączone, wyjście tylko Escape | Potwierdzone: `src/ui/dom/saveImportDialog.ts` `stepTwo` i `saveResetDialog.ts` wyłączają `load`/`confirm` i `cancel` do rozstrzygnięcia `apply` (= `saver.replace`, `src/scenes/UIScene.ts` `openImport`/`openReset`) | brak |
| SV2-03: `migratedFrom` z wyniku odczytu, nie z udanej kopii; `failing` bez kodu | Potwierdzone: `status()` → `migratedFrom: options.migrated?.from ?? null`; `src/ui/dom/saveHealthView.ts` rysuje `pl.settings.saveMigrated` niezależnie od stanu; `failing` = samo `pl.settings.saveFailing`; komentarz w `pl.ts` przy `saveMigrated` obiecuje „the old copy is kept” | brak |
| SRR-02: `timeout` nigdy nie jest wymuszalny; „Uruchom grę ponownie” w pętli | Potwierdzone: `replaceGate` (`unavailable` + `isTimeoutError` → `Blocked`), `deviceSaveView` → `cause: 'timeout'`, `forceable: false`; teksty `pl.saveTransfer.deviceTimeout`, `pl.settings.saveOff.timeout`; licznik startów nie istnieje (brak `localStorage` w `src/`) | brak |
| SRR-02: `siteDataAdvice` pojawia się „tylko po nieudanym wymuszonym zapisie” | Częściowo: `src/ui/dom/saveSummaryView.ts` `failureText` pokazuje `siteDataAdvice` po **każdej** porażce `replace` z błędem magazynu (nie tylko wymuszonej); przy `timeout` `replace` jest `Blocked`, więc rada i tak nigdy się nie pojawia | sens twierdzenia bez zmian; precyzja dla planu |

Żadne twierdzenie nie okazało się nieaktualne. Uwaga: licznik startów `unavailable` z decyzji 4 poprzedniej poprawki
(save-reason-and-recovery) nie powstał — jest otwartym follow-upem (tabela niżej), więc SRR-02 buduje go od zera.

### SV2-01 — decyzja produktowa (plan wybiera)

Dwa cele naraz: (1) zapis v1 nie ginie bez kopii lub świadomej decyzji, (2) postęp dziecka nie znika po cichu przy
każdym starcie. Fakt, który waży: migracja v1→v2 (`MIGRATIONS[1]`) to rozszerzenie rekordu, a wynik przechodzi
`validateSave` zanim sesja wystartuje — v2 zawiera całe v1. Kopia chroni tylko przed błędem migracji, którego dziś nie
widać (fixtures v1 ładują się), i nie chroni przed eksmisją (ta sama baza, SV2-15).

| Opcja | Co robi | v1 bezpieczne? | Postęp? | Koszt / ryzyko |
|---|---|---|---|---|
| A. Ponowienie z limitem, potem zapis v2 mimo braku kopii | kopia ponawiana przy kolejnych próbach w tej sesji; po N porażkach (np. 3, `balance.save`) autosaver zapisuje v2 bez kopii; status `backup: 'failed'` + kod, linia w panelu, osobny log `autosave: backup failed` | w treści tak (v2 ⊇ v1, zwalidowane); surowe v1 znika z głównego klucza | tak, od N-tej próby | najmniejsza zmiana; traci siatkę na błąd migracji tylko na urządzeniach, gdzie kopia i tak nie działa |
| B. Jak A, ale przed rezygnacją z kopii surowe v1 w pamięci do eksportu | A + w „Zapis gry” „Zachowaj kopię v1” za bramką dorosłego (`exportFileText` kind `raw`, częściowo SV2-04) dopóki sesja trzyma `migrated.raw` | jak A + ręczna ścieżka ratunku | tak | dodatkowy przycisk i tekst (DESIGN-GAP); eksport i tak wymaga działającego udostępniania |
| C. Zapis v2 pod osobnym kluczem, główny klucz v1 nietknięty | po porażce kopii v2 idzie pod nowy klucz, odczyt preferuje go | tak, w całości | tak, jeśli nowy klucz się zapisze | zmienia układ magazynu i ścieżkę odczytu; przy `QuotaExceededError` nowy klucz najpewniej też padnie; ryzyko dla „format zostaje v2” |
| D. Blokada z nazwaną przyczyną `backup` | zapis stoi jak dziś, ale panel i karta mówią dlaczego, z kodem | tak | **nie** (cicha strata zamieniona na widoczną) | nie spełnia celu (2) dla dziecka |

Rekomendacja na wejście do researchu: **A** (z B, jeśli research pokaże, że eksport surowej wartości z `UIScene` jest
tani). Plan ustala N, gdzie liczy porażki (w sesji wystarczy: autozapis próbuje wiele razy na sesję) i czy porażki
`timeout` kopii liczą się tak samo.

### Źródło prawdy projektu (profil § 6) i klucze tekstów

- Kit (`Martynka-urzadza.md`, `designs/martynka-maths-A-v1/`) **nie ma widoków** dla sekcji „Zapis gry”, karty
  startowej zapisu ani dialogów importu/resetu — to istniejące DESIGN-GAP-y: 43 (wskaźnik zapisu → panel rodzica),
  45 (karta `unavailable`), 46–51 (eksport/import/reset), 50 (`saveNotYet`, wcześniejsze porażki, `persist`),
  69 (powód wyłączonego zapisu i kod), 70 (`deviceFuture`/`deviceTimeout`), 71 (wyjście z `unavailable`, `force`,
  `siteDataAdvice`). Każdy nowy tekst (stan kopii, kod w `failing`, „przeniesiono” po skutku, rada po N `timeout`)
  dostaje wiersz w `docs/design-gaps.md` — **następny wolny numer: 94**.
- Klucze, które ta zmiana wiąże (`src/data/pl.ts`): `pl.settings.saveFailing`, `pl.settings.saveMigrated` (i jego
  komentarz „the old copy is kept”), `pl.settings.saveNotYet`, `pl.settings.saveEarlier`, `pl.settings.saveOff.timeout`,
  `pl.saveFailed.detail`, `pl.saveUnavailable`, `pl.saveTransfer.deviceTimeout`, `pl.saveTransfer.siteDataAdvice`,
  `pl.saveTransfer.applyFailed`, `pl.saveTransfer.resetFailed`, `pl.saveTransfer.close`. Liczby (N prób, limit zapisu,
  N startów) w `src/data/balance.ts` `save`.
- Wspólne komponenty: `src/ui/dom/` (`saveHealthView.ts`, `saveFailedCard.ts`, `saveImportDialog.ts`,
  `saveResetDialog.ts`, `saveSummaryView.ts`); logika czysto w `src/core/` (`autosave.ts`, `saveHealth.ts`,
  `saveFile.ts`); `src/storage/idb.ts` jedynym importerem `idb-keyval`. Żadnych nowych widoków.
- E2E: nowe szwy (`?e2eSave=backupfail|backuphang`, ew. `writehang`) tylko w buildzie z hookiem, z markerem
  `e2eSave` już w `vite/e2eHookGuard.mjs` (SV2-14).

### Otwarte follow-upy, których `Trigger:` wskazuje ten obszar

| Follow-up (plik w `context/archive/`) | Trigger | Moje zdanie o zakresie |
|---|---|---|
| „A permanently failing backup write blocks every save…” (plan-review F5; `2026-10-14-minigame-daily-puzzle`) | parent report of progress not saved after an update | Trigger formalnie niespełniony, ale to dokładnie SV2-01 — **zamykamy tutaj**. |
| „`profile:default:backup-v1` has no way to be read back…” (F5, = SV2-04; tamże) | parent report of lost progress after an update / v3 | Niespełniony. Poza zakresem, chyba że plan wybierze opcję B (wtedy częściowo). |
| „`migration-failed` can be overwritten like `corrupt`” (F7, = SRR-09/SRR-01; tamże) | a migration step that can throw (v3) | Niespełniony; medium → poza zakresem, follow-up zostaje. |
| „`Autosaver.replace` never takes the v1 backup” (= SRR-04; tamże) | a replace path that runs before the first normal write after a migration | **Spełniony w treści** (import/reset w zmigrowanej sesji przed pierwszym zapisem istnieje dziś) i SV2-02 i tak zmienia `replace`. Kandydat do włączenia: `replace` wykonuje zaległą kopię pod tą samą polityką co SV2-01. Plan decyduje. |
| S12-07, S12-08, S12-12, S12-13 (tamże) | next change to saveImportDialog.ts, saveResetDialog.ts or autosave.ts `replace` | Spełniony (SV2-02 zmienia `replace` i oba dialogi). Treść w liście S-12 (audyt 2026-10-13_1751 i run 2026-10-14); research ustala, które są tanie; reszta z nowym triggerem. |
| S12-02 `replace` bez limitu (`2026-10-14-save-reason-and-recovery`, `2026-10-14-art-stand-in-and-load-signal`) | parent report of a stuck dialog / next change to save panel or `replace` | Spełniony — **zamykamy** przez SV2-02. |
| S12-03 `stateOf` nie czyta `status.replace` (tamże) | a replace path that does not reload right after apply | Niespełniony; tani kandydat, jeśli SV2-02 dodaje stan `replace` z porażką `timeout`. Plan decyduje. |
| S12-11 porażki `replace` w `failures` przy `off` (tamże) | parent report of „failing” after a failed import | Niespełniony; poza zakresem. |
| „A counter of `unavailable` starts” (decyzja 2/4 poprzedniego planu; `2026-10-14-save-reason-and-recovery`) | a report that the second confirmation was not enough, or N-7 showing permanent timeouts | **Spełniony w treści**: SRR-02 to właśnie scenariusz trwałego `timeout`. Licznik powstaje tutaj; czy obejmuje też `unavailable` (SRR-08: wymuszenie dopiero od drugiego startu) — plan decyduje (zmienia oczekiwania istniejącej specyfikacji e2e wymuszenia). |
| Osobna karta dla `timeout` + pomiar N-7 zimnego otwarcia IDB na iPadzie (tamże; N-7 w `2026-10-13-save-export-import-reset`) | [human] iPad measurement | Pomiar zostaje `[human]`. Osobna treść karty `timeout` (= SRR-12, low) to tani kandydat, jeśli SRR-02 i tak zmienia tekst `timeout`. |
| Escape zamyka dialog w trakcie `replace` (impl-review O2; tamże) | next change to saveImportDialog.ts / saveResetDialog.ts | Spełniony (SV2-02 odblokowuje „Zamknij”). W zakresie w naturalny sposób: plan ustala, co znaczy zamknięcie przy trwającym/zawieszonym `replace`. |
| L-S3 `visibilitychange`: wyjątek w `narrator.cancel()` pomija `flush('hidden')` (`2026-10-13-save-observability-c1-c2`) | next change to the visibilitychange handler | Spełniony tylko, jeśli SV2-02 dotknie handlera w `main.ts`; wtedy tanio. |
| F3 szew `?e2eSave=unavailable` (`2026-10-13-autosave-versioned-save`) | next change to `e2eSaveStore` | Już zrealizowany (szew istnieje); dopisanie `backupfail`/`backuphang` spełnia trigger — zamknąć formalnie w follow-upach tej zmiany. |

### Poza zakresem (follow-upy z `Trigger:` w `follow-ups/review-fixes.md` tej zmiany)

SV2-04 (o ile nie opcja B), SV2-05..SV2-15 poza wymienionymi (SV2-08 dotyka `deploy/` — zakaz w runie; SV2-10
kolejność zapisu zagadki dnia; SV2-11..13, SV2-15), SRR-01, SRR-07..SRR-13 (o ile plan nie weźmie SRR-08/SRR-12 tanio),
całe obszary GRD-* i WNA-* z tego audytu.

## Autonomous decisions

1. **Zakres = SV2-01, SV2-02, SV2-03, SRR-02, dokładnie jak w kontrakcie; SRR-04, S12-03, SRR-08, SRR-12 i O2 (Escape)
   jako kandydaci dla planu.** Odrzucone: włączenie całej rekomendowanej kolejności audytu (pkt 3–4: SRR-09, SRR-07).
   Dlaczego: kontrakt fixuje CRITICAL/HIGH; kandydaci dotykają tych samych symboli (`replace`, licznik startów, tekst
   `timeout`). Co zmieniłoby: research pokaże, że polityka kopii SV2-01 i tak wymaga zaległej kopii w `replace` —
   wtedy SRR-04 wchodzi obowiązkowo (inaczej reset rodzica w stanie `failing` niszczy jedyne v1).
2. **SV2-01: rekomendacja A (ponowienie z limitem, potem v2 bez kopii, z nazwanym stanem i kodem), ostateczny wybór w
   planie.** Odrzucone: D (blokada z nazwą — zamienia cichą stratę na jawną, ale postęp dziecka nadal ginie, sprzeczne
   z celem kontraktu), C (osobny klucz v2 — zmienia ścieżkę odczytu i przy przepełnieniu magazynu też zawiedzie).
   Dlaczego: v2 jest zwalidowanym nadzbiorem v1, więc pewna strata postępu przy każdym starcie waży więcej niż utrata
   siatki na hipotetyczny błąd migracji. Co zmieniłoby: research znajdzie pole v1, którego `MIGRATIONS[1]` nie
   przenosi albo które `validateSave` v2 przepuszcza zmienione — wtedy C albo B z blokadą do eksportu.
3. **Format zostaje v2; nowe stany w `AutosaveStatus` (runtime) i licznik startów poza zapisem.** Odrzucone: pole w
   `SaveState`. Dlaczego: kontrakt; stan kopii i licznik opisują urządzenie i start, nie postęp; magazyn, który
   zawodzi, nie może nieść własnego licznika. Co zmieniłoby: research pokaże, że `localStorage` jest niedostępny
   w tych samych warunkach co zawieszone IDB (tryb prywatny iPadOS) — wtedy wyjście SRR-02 bez licznika (rada po
   pierwszym `timeout` + drugie potwierdzenie).
4. **Licznik porażek kopii w sesji (nie między startami).** Odrzucone: licznik w `localStorage`. Dlaczego: autozapis
   próbuje wiele razy na sesję (debounce 500 ms, `flush('now')` po zakupie i rundzie), więc N prób mieści się w pierwszych
   minutach gry; mniej ruchomych części. Co zmieniłoby: research pokaże, że typowa sesja robi < N prób (np. kopia
   zawodzi przy `flush('hidden')` tuż przed zamknięciem).
5. **E2E w zasięgu (E2E=on):** szew `?e2eSave=backupfail` (+ wariant zawieszenia) w `e2eSaveStore`, spec na tekst panelu
   i na to, że postęp przetrwa przeładowanie po polityce SV2-01; protokół plików żądań dla Chromium. Co zmieniłoby:
   research pokaże, że okablowanie panelu pokrywa test jednostkowy wzorem `tests/deviceSaveWiring.test.ts`.
6. **Następny krok `/10x-research`** (narzucony przez run, nie domyślny `/10x-plan` skilla): do ustalenia liczba prób
   zapisu w typowej sesji, dostępność `localStorage` przy zawieszonym IDB, które specyfikacje e2e polegają na wymuszeniu
   przy pierwszym `unavailable` (SRR-08) i na `notYet`, treść S12-07/08/12/13.
