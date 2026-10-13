---
change_id: save-observability-c1-c2
title: Zdrowie zapisu widoczne dla rodzica, przyczyna nieudanego odczytu i naprawa nieznanego pokoju
status: planned
created: 2026-10-13
updated: 2026-10-13
archived_at: null
---

## Notes

Fix from the 2026-10-13 15:14 observability audit (PR #34): C-1 `loadSave` swallows the read error (`unavailable`, no name, no log, no signal, the whole session saves nothing); C-2 persistent write failures leave only `console.error` (`AutosaveStatus` is read only by the e2e hook); H-R3 an unknown `currentRoom` draws the salon from another room's state and the first purchase overwrites `rooms.salon`. Same fix: M-R6 (purchase "saved now" only if the write succeeds), M-S5 (`block(reason)` ignored → `blockedBy`). If small: M-S4 (a hanging read → timeout → `unavailable`).

Zmiana spoza roadmapy (autonomiczny run `2026-10-13-fix-save-observability`, gałąź `feat/save-observability-c1-c2`
cięta z `main` @ `4698110`). Brak bloku roadmapy — nie edytujemy statusów w `context/foundation/roadmap.md`.
Źródła:

- audyt `context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md` (scalony w PR #34; § 5 tabele,
  § 6 kolejność poprawek: 1 = C-1 + C-2 + M-R6 + M-S5, 2 = M-S4, 3 = H-R3 + M-R4 + M-R5 + L-R10);
- kontrakt runu `context/runs/2026-10-13-fix-save-observability/agent-contract.md` („Slice-specific rules”: nic nie
  opuszcza urządzenia, format zapisu v1 jest drzwiami jednokierunkowymi, status w runtime autosavera, nie w zapisie,
  naprawa `currentRoom` bez dotykania innych pokojów i bez zapisu przed udanym odczytem, szwy e2e tylko w buildzie hook);
- PRD `context/foundation/prd.md`: guardrail „Postęp nigdy nie ginie”, FR-020 (autozapis, natychmiast po zakupie i końcu
  rundy), FR-021 (nieudane przeniesienie zostawia stary zapis i pokazuje rodzicowi eksport), Ograniczenia „brak
  telemetrii”;
- `docs/design-gaps.md` wiersz 43 (S-11: „Nothing is shown: no save indicator, no line in the parent's settings”) — ta
  zmiana go rewiduje; wiersz 42 (karta nieczytelnego zapisu) jako wzór;
- test-plan `context/foundation/test-plan.md` ryzyka #2 (postęp znika po aktualizacji/restarcie), #10 (aktualizacja
  a stan po S-11), #16 (zakup — „when the save is written (FR-020)”);
- wzorce: `context/archive/2026-10-13-observability-c1-c2/` (ten sam typ: audyt → poprawka) oraz
  `context/archive/2026-10-13-autosave-versioned-save/` (kod pod poprawką; `follow-ups/review-fixes.md`).

Plik `lessons.md` w `context/foundation/` nie istnieje.

## Audit claims vs repo now

Stan sprawdzony na `feat/save-observability-c1-c2` @ `4698110` (audyt pisany na `6617da3`; między nimi PR #34 i #35 —
same dokumenty).

| Audit claim | Repo now | Correction |
|---|---|---|
| C-1: `src/core/autosave.ts` `loadSave` ma `catch {}` bez wiązania → `{ kind: 'unavailable' }` | Potwierdzone: `try { raw = await store.read(); } catch { return { kind: 'unavailable' }; }`; typ `LoadOutcome` wariant `{ kind: 'unavailable' }` bez pól. Test `tests/autosave.test.ts` „reads once and reports fresh / loaded / unreadable / unavailable…” asertuje `toEqual({ kind: 'unavailable' })` — zmieni się razem z typem. | Bez korekty. `unavailable` dostaje nazwę błędu (np. `name: string`, `'timeout'` dla M-S4). |
| C-1: `src/main.ts` `start` loguje tylko `unreadable`; `unavailable` → saver zablokowany, brak karty | Potwierdzone: `console.warn(\`Save unreadable (…)\`)` tylko w gałęzi `outcome.kind === 'unreadable'`; `createAutosaver({ … blocked: outcome.kind === 'unreadable' \|\| outcome.kind === 'unavailable' })`; karta `mountSaveFailedCard` tylko dla `unreadable`. Dziecko dostaje `freshSession(0)` → ekran powitalny. | Bez korekty. Uwaga: przy `unavailable` panel ustawień jest osiągalny dopiero po powitaniu (zębatka w `UIScene`), więc sam wiersz w panelu nie daje sygnału „od razu” — patrz decyzja 2. |
| C-2: `createAutosaver` → `attempt`: `failures++`, `dirty = true`, `log('autosave: write failed', e)`; `main.ts` `log: console.error` | Potwierdzone. Ponowna próba tylko przy kolejnym `markDirty`/`flush` (pętla w `save` przerywa się po `ok === false`). Komunikat `autosave: encoded state does not validate` nie mówi, które pole. | Bez korekty. Ścieżka pierwszego złego pola z `validateSave` — poza zakresem (decyzja 4), chyba że research pokaże, że jest tania. |
| C-2: `AutosaveStatus` czyta tylko hook e2e | Potwierdzone: jedyne `.status()` w `src/` to `src/testing/e2eHook.ts` (`save` → `deepFreeze({ ...saver.status() })`). `AutosaveStatus` = `load, blocked, dirty, writes, failures, skipped, lastReason` — brak `blockedBy`, nazwy ostatniego błędu, czasu ostatniego udanego zapisu, porażek z rzędu. | Bez korekty. Pola dochodzą do runtime statusu (nie do `SaveState`). Czas: `createAutosaver` nie ma zegara — wstrzyknąć `now()` (core bez globali). |
| M-S5: `block(reason)` ignoruje argument | Potwierdzone: `block: () => { blocked = true; cancelTimer(); }`. Wołania: `main.ts` `onFatal` → `booted.saver?.block('fatal')`; blokada startowa przez opcję `blocked`, nie przez `block`. | Bez korekty; `blockedBy: 'fatal' \| 'unreadable' \| 'unavailable' \| null` (typ zamknięty zamiast `string`). |
| M-R6: `RoomScene.dispatch` → `flush('now')` bez sprawdzenia wyniku | Potwierdzone: `void (this.registry.get(REGISTRY_KEYS.saver) as Pick<Autosaver, 'flush'> \| undefined)?.flush('now')`; tak samo `TaskScene.finishRound`. `flush` zwraca `Promise<void>` i nie mówi o porażce. | Bez korekty. Zamyka go sygnał zdrowia zapisu (C-2); scena nie musi reagować na wynik (decyzja 3). |
| M-S4: `await loadSave(store)` bez limitu czasu | Potwierdzone w `main.ts` `start`. `src/storage/idb.ts` `createIdbSaveStore` ponawia raz przy `InvalidStateError`/`UnknownError`, ale nie ma limitu czasu. | W zakresie (decyzja 5): limit w `loadSave` z wstrzykniętymi timerami, wynik `unavailable` z nazwą `timeout`; spóźnione rozwiązanie odczytu ignorowane (saver już zablokowany, nic nie pisze). |
| H-R3: `RoomScene.room` = `ROOMS[id] ?? ROOMS[FIRST_ROOM]` vs `RoomScene.roomState` = `rooms[this.roomId()]` | Potwierdzone: `room()` spada na salon, `roomState()` czyta `rooms?.[this.roomId()] ?? emptyRoomState()`; `dispatch` pisze `{ ...rooms, [room.id]: step.state }` — `room.id` = `salon`, stan liczony z obcego pokoju → nadpisanie `rooms.salon`. `TaskScene.nextRoomTaskCost`: `ROOMS[roomId]` undefined → cicho `null`. `ROOMS` ma dziś tylko `salon` (`src/data/rooms.ts`), więc latentne. | Bez korekty. Dwa kroki: (a) naprawa przy wczytaniu w `start` (nieznany `currentRoom` → `console.warn` + `FIRST_ROOM`, inne pokoje nietknięte, brak `rooms[FIRST_ROOM]` → `emptyRoomState()`), (b) `RoomScene` bierze pokój i stan z jednego id. |
| H-R3: `validateSave` sprawdza `currentRoom ∈ rooms`, nie `ROOMS` | Potwierdzone: `src/core/save.ts` `validateSave` → `Object.prototype.hasOwnProperty.call(value.rooms, value.currentRoom)`. `core` nie zna `ROOMS` (dane). | Korekta kierunku: **nie** zaostrzać `validateSave` o `ROOMS` — zapis z nieznanym pokojem stałby się `corrupt` (karta przy każdym starcie, gra bez zapisu) zamiast naprawialny; to też jest zmiana jednokierunkowa. Naprawa to osobny czysty krok z listą znanych id jako parametrem (decyzja 6). |
| Audyt: 18 `catch` i 8 `console.*` w `src/` (bez `src/testing`) | Nie przeliczane w tym kroku (stan kodu = `6617da3` + same dokumenty). | — |

Wszystkie ustalenia w zakresie potwierdzone; jedyna korekta to kierunek H-R3 (naprawa przy wczytaniu, nie ostrzejsza
walidacja).

## Design binding

Źródło prawdy (profil § 6): `Martynka-urzadza.md`, `docs/ZADANIA.md`, `designs/martynka-maths-A-v1/style-guide.md`,
`screenshots/`, `preview.html`; teksty w `src/data/pl.ts`; wspólne komponenty `src/ui/dom/` (`openDialog`,
`createButton`, `createText`, `mountSaveFailedCard`, `openSettingsPanel`) i `src/ui/widgets/`.

- **Widoki kitu wiązane przez tę zmianę: brak.** Kit nie ma ekranu ustawień (DESIGN-GAP 26), stanu zapisu (DESIGN-GAP 43)
  ani karty „zapis niedostępny” (najbliższy wzór: DESIGN-GAP 42, karta nieczytelnego zapisu).
- **DESIGN-GAP 43 do aktualizacji** (decyzja opiekuna z S-11 „nic nie pokazujemy” jest tu rewidowana zgodnie z
  kontraktem): nowa treść wiersza opisze wiersz zdrowia zapisu w panelu rodzica i sygnał dla `unavailable`.
  Ewentualny nowy wiersz (po 44), jeśli karta `unavailable` różni się od wiersza 42.
- **Klucze tekstów (`src/data/pl.ts`, każdy nowy z teacher read):** linia(e) zdrowia zapisu w `pl.settings` (stan „zapis
  działa” / „postęp nie jest zapisywany od …” bez technicznych nazw dla rodzica); dla karty `unavailable` — nowa grupa
  albo wariant `pl.saveFailed`. Spokojnie, nigdy do dziecka, bez stosu. Brzmienie decyduje plan.

## Migration

**Brak migracji.** `SAVE_VERSION` zostaje 1 (`src/core/save.ts`); nowe pola (`blockedBy`, nazwa ostatniego błędu, czas
ostatniego udanego zapisu, porażki z rzędu) żyją w `AutosaveStatus` (runtime), nie w `SaveState`. Naprawa nieznanego
`currentRoom` działa na zdekodowanej sesji w pamięci i trafia na dysk dopiero zwykłym autozapisem po udanym odczycie
(profil § 4: brak bazy; reguła FR-021).

## Triggered follow-ups

Przeszukane `context/archive/*/follow-ups/review-fixes.md` pod kątem: ten audyt, „S-11 save observability”, „save
health”/zdrowie zapisu, `start()` w `main.ts`, `e2eSaveStore`, `vite/e2eHookGuard.mjs`, `errorBoundary`, `RoomScene`.
Żaden wpis nie ma `Trigger:` nazywającego ten audyt ani „save health” wprost; trafiają poniższe.

| Follow-up | Źródło | Moje zdanie o zakresie |
|---|---|---|
| F3: `?e2eSave=unavailable` (magazyn, którego `read` odrzuca) + spec „nic nie jest zapisane po nieudanym odczycie”. `Trigger: next change to start() in src/main.ts or to src/testing/e2eHook.ts e2eSaveStore` | `2026-10-13-autosave-versioned-save` (impl-review) | **W zakresie** — to dokładnie dowód e2e dla C-1, który kontrakt wymaga. |
| F4: dwa jawne przypadki `e2eSave` w `tests/e2eHookGuard.test.ts`. `Trigger: next change to vite/e2eHookGuard.mjs` | jw. | **Warunkowo w zakresie** — jeśli nowy szew wymaga nowego markera w `vite/e2eHookGuard.mjs`; jeśli `unavailable` jest tylko nową wartością `e2eSave` (marker `e2eSave` już jest), guard się nie zmienia i F4 zostaje (tani, plan może go wziąć). |
| Eksport, import i reset w panelu rodzica, „show the save state to the parent (decision 8 and DESIGN-GAP 43)”. `Trigger: S-12` | jw. | **Częściowo** — „pokazać stan zapisu rodzicowi” robi ta zmiana (wiersz zdrowia); eksport/import/reset zostają w S-12. Plan dopisze, że część „save state” jest zamknięta. |
| Noise list (`AbortError`, `NotAllowedError`) w `src/core/errorSignal.ts` `QUIET_REJECTIONS`: realna porażka IDB jako `AbortError` byłaby tylko `console.warn`. `Trigger: S-11 or the first promise the app itself awaits` | `2026-10-13-observability-c1-c2` | **Poza zakresem jako zmiana listy** — błędy zapisu i odczytu łapie sam moduł zapisu (S-11 decyzja 12), nie granica; po tej zmianie trafiają do statusu i sygnału rodzica, więc `AbortError` z IDB przestaje być niewidoczny bez ruszania listy. Research potwierdza, że żadna obietnica IDB nie dochodzi do granicy. |
| F3 obs: `installErrorBoundary` `signalOfRejection` — `String(reason)` poza `try`. `Trigger: next change to src/ui/dom/errorBoundary.ts` | `2026-10-13-observability-c1-c2` / przeniesione w S-11 | **Poza zakresem**, o ile plan nie dotknie `errorBoundary.ts` (sygnał zapisu idzie przez `main.ts`/panel); jeśli dotknie — wchodzi (jednolinijkowe). |
| F4 obs: `WelcomeScene.openParent` guard `this.session` vs `active()`. `Trigger: S-11 (a non-final error path) or the next change to WelcomeScene` | jw. | **Poza zakresem**, chyba że karta `unavailable` zostanie zrobiona w `WelcomeScene` (decyzja 2 wybiera DOM przed grą, więc nie). |
| Dwie instancje jednego originu (ostatni zapis wygrywa). `Trigger: first save-format change (v2), or a parent reporting lost progress` | `2026-10-13-autosave-versioned-save` | **Poza zakresem** (brak v2, brak zgłoszenia). Uwaga dla planu: wiersz zdrowia zapisu ułatwi przyszłą diagnozę takiego zgłoszenia. |
| e2e hook: `targets.nextRound`/`toRoom` w pokoju. `Trigger: the next change to src/testing/e2eHook.ts` | `2026-10-12-narrator-round-summary` | **Już zamknięte** (obs-c1-c2 follow-ups: „Closed: … S-05 hook targets in the room”). |

Ustalenia audytu poza zakresem → follow-upy z `Trigger:` w `follow-ups/review-fixes.md` tej zmiany (pisze je plan/ship):
M-S1 (zasada rollbacku w `deploy/README.md` — `deploy/` zakazane w runie), M-S2 (wynik `persist()`; tani, research
oceni, czy wchodzi do wiersza zdrowia), M-S3 + L-S1 (powód i build na karcie/eksporcie), M-R4 (zamrożona kolejność
zadań), M-R5 + L-R10 (testy danych po wszystkich `ROOMS`; tani — research oceni sąsiedztwo z H-R3), L-S2, L-S3, L-R8,
L-R9, L-R11.

## Autonomous decisions

1. **Zakres: C-1, C-2, H-R3, M-R6, M-S5 (obowiązkowe) + M-S4 (mały: limit w `loadSave` z wstrzykniętymi timerami) +
   follow-up F3 (szew `?e2eSave=unavailable` i spec).** Reszta → follow-upy. Odrzucone: dołożenie M-R5/L-R10 i M-S2 już
   teraz — nie są „trywialnie sąsiednie” bez researchu. Co zmieniłoby odpowiedź: research pokaże, że test danych po
   `ROOMS` to kilka linii w `tests/roomsData.test.ts` (M-R5) albo że wynik `persist()` mieści się w tym samym wierszu
   zdrowia (M-S2) — wtedy wchodzą.
2. **Sygnał: dwa miejsca, oba lokalne.** (a) Wiersz „Zapis” w panelu ustawień (za bramką dorosłego) z `saver.status()`:
   działa / nie działa od chwili + liczba porażek z rzędu; (b) dla `unavailable` (i `timeout`) dodatkowo karta DOM przed
   grą w stylu `mountSaveFailedCard` z „Graj dalej” (bez eksportu — nie ma czego eksportować), bo panel jest osiągalny
   dopiero po powitaniu, a dziecko widzi „pierwsze uruchomienie”. `console.warn` z nazwą błędu w obu ścieżkach. Odrzucone:
   delikatny sygnał w HUD dla dziecka po N porażkach — kontrakt: „never a scary message to the child”; tylko konsola —
   to dokładnie luka C-2. Co zmieniłoby odpowiedź: research pokaże, że karta przy `unavailable` pojawiałaby się
   regularnie w normalnym trybie (np. Safari prywatne zawsze rzuca) — wtedy tylko wiersz w panelu + `console.warn`,
   a karta raz na sesję lub wcale.
3. **M-R6 bez reakcji sceny:** `RoomScene.dispatch`/`TaskScene.finishRound` dalej wołają `flush('now')` bez czekania;
   porażka widoczna w wierszu zdrowia. Odrzucone: cofanie zakupu przy porażce zapisu — zabiera dziecku mebel
   (guardrail „nigdy utrata”). Co zmieniłoby: decyzja opiekuna, że zakup bez zapisu ma być blokowany.
4. **Status w runtime, nie w zapisie:** `AutosaveStatus` rośnie o `blockedBy`, `lastError` (nazwa), `lastWriteAt`,
   `consecutiveFailures`; `createAutosaver` dostaje wstrzyknięty zegar. Ścieżka złego pola z `validateSave` — poza
   zakresem (zmienia sygnaturę predykatu używanego jako walidator importu S-12). Co zmieniłoby: research pokaże tani
   wariant obok predykatu.
5. **M-S4 w zakresie:** limit z `balance.save` (nowa liczba w danych), wynik `unavailable` z nazwą `timeout`; spóźniony
   odczyt nigdy nie odblokowuje savera. Co zmieniłoby: research pokaże, że `createIdbSaveStore` może zawisnąć tylko w
   `open`, gdzie limit trzeba postawić w `src/storage` — wtedy limit tam, wynik ten sam.
6. **H-R3: naprawa przy wczytaniu, nie ostrzejsza walidacja.** Czysta funkcja (w `core`, lista znanych id jako
   parametr, bo `core` nie importuje `data/rooms`) zamienia nieznany `currentRoom` na `FIRST_ROOM` i dokłada
   `emptyRoomState()` tylko gdy `rooms[FIRST_ROOM]` brak; inne pokoje nietknięte; `console.warn` w `main.ts`. Dodatkowo
   `RoomScene` liczy pokój i stan z jednego id (obrona w głębi). Odrzucone: `validateSave` z `ROOMS` — nieznany pokój
   stałby się `corrupt` (karta przy każdym starcie). Co zmieniłoby: drugi pokój w danych przed tą zmianą (nie ma).
7. **E2E:** `?e2eSave=unavailable` (i ew. `hang` dla M-S4) jako nowa wartość istniejącego szwu `e2eSave` w
   `src/testing/e2eHook.ts`, dowód na prawdziwym bundlu, marker w `vite/e2eHookGuard.mjs` już obejmuje `e2eSave`.
   Nowy kontekst przeglądarki = świeże urządzenie; nigdy nie czyścimy IDB z testu.
8. **Następny krok `/10x-research`** (narzucony przez run): do ustalenia forma i miejsce karty `unavailable`, zegar w
   `createAutosaver`, gdzie wpiąć naprawę pokoju (`start` vs `decodeSave` → `toSession`), oraz czy M-R5/M-S2 są tanie.
