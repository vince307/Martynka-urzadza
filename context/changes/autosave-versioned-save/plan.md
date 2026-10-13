# Autozapis w IndexedDB i wersjonowany zapis z migracjami — Implementation Plan

## Overview

Roadmapa S-11 (`autosave-versioned-save`, M5 — pierwszy slice zapisu; PRD FR-020, FR-021, FR-003, US-04 i jego AC,
guardrail „Postęp nigdy nie ginie”). Po zamknięciu gry, rozładowaniu tabletu albo cichej aktualizacji **gwiazdki, salon,
uczeń (etap, rozgrzewka, opanowanie, odblokowane kroki, historia) i ustawienia rodzica są identyczne**. Zapis dzieje się
sam: po każdej zmianie stanu z opóźnieniem (`balance.save.debounceMs` = 500), przy ukryciu karty (`visibilitychange` →
`hidden`, `pagehide`) i **natychmiast** po zapłacie za mebel i końcu rundy. Format jest wersjonowany (`version: 1`),
`src/core/save.ts` ma łańcuch migracji (v1 = pierwszy format, pusty łańcuch), walidację i fikstury per wersja. Zapis
nieczytelny (uszkodzony albo z nowszej wersji gry, np. po wycofaniu deployu) **nigdy nie jest nadpisywany**: gra pokazuje
kartę dla rodzica z eksportem surowej kopii (za bramką dla dorosłego) i „Graj dalej” bez zapisu. Jedyny moduł
przeglądarkowego magazynu to `src/storage/idb.ts` na `idb-keyval`. Nic nie opuszcza urządzenia bez ruchu dorosłego.

To drzwi jednokierunkowe: format v1 trafia na tablety dzieci i każdy następny build musi go wczytać. Dlatego cała logika
formatu, migracji, wczytania i harmonogramu zapisu jest czysta (`src/core`, testy najpierw), a wpięcie w sceny przychodzi
dopiero po niej.

## Current State Analysis

Z `context/changes/autosave-versioned-save/research.md` (commit `5b49883`), `change.md` i odczytu kodu w tym kroku
(`feat/autosave-versioned-save` @ `101bcca`):

- Stan pętli żyje w rejestrze Phasera (`src/data/layout.ts` `REGISTRY_KEYS`): `stars`, `rooms`, `currentRoom`,
  `learner`, `settings` — wartości startowe ustawia `src/main.ts` `createGame` → `callbacks.preBoot` (komentarz: „S-11
  replaces these values with the saved ones”); `learner` nie istnieje przed powitaniem (`needsPlacement(null)`).
- Piszą je: `TaskScene.syncStars`, `TaskScene.finishRound`, `TaskScene.finishWarmup`, `TaskScene.closeUnlock`,
  `RoomScene.dispatch` (gałęzie `changed` i `bought`), callback ustawień w `UIScene`, `WelcomeScene.start`.
- `src/core/types.ts` `SaveState` (plan §5: `learner: LearnerState`, `rngSeed`) nie ma żadnego czytelnika ani pisarza.
  `SessionLearner` (`src/core/placement.ts`) = `PlacedLearner` (z `warmupPending`) & `Adaptation` & `pendingUnlock:
  number | null`. `rngSeed` nie ma odbiorcy (sceny losują ziarno z zegara/`Math.random`); wspomina go tylko komentarz w
  `src/core/rng.ts`.
- `src/storage/` pusty; `idb-keyval` nie jest zależnością (`package.json`); `eslint.config.mjs` nie obejmuje
  `src/storage/**` blokiem globali przeglądarki i nie ogranicza importu `idb-keyval`.
- `src/core/errorSignal.ts` `isFatalSignal`: odrzucenie spoza `QUIET_REJECTIONS` (`AbortError`, `NotAllowedError`)
  podnosi kartę błędu — moduł zapisu musi łapać każde odrzucenie sam.
- `src/main.ts` tworzy grę synchronicznie po `installErrorBoundary`; ma słuchacza `visibilitychange` (tylko
  `narrator.cancel()`); `startStars` z `?e2eStars` (build haka) zawsze nadpisuje saldo startowe.
- `src/scenes/BootScene.ts` `create` przekazuje sterowanie (`needsPlacement`) wewnątrz łańcucha obietnicy czcionki
  Phasera (follow-up obserwowalności: jego `.catch` połyka wyjątek startu).
- `vite/config.shared.mjs` `manualChunks` wydziela tylko `phaser`; `idb-keyval` trafi do chunku wejściowego, który `sw.js`
  precache'uje (`workbox.globPatterns` z `js`). Cel builda Vite 6 domyślny (bez top-level `await`).
- `src/testing/e2eHook.ts` `installE2EHook` — snapshot bez stanu zapisu; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS` =
  `__martynkaE2E`, `e2eMonth`, `e2eFail`, `e2e-forced-failure`, `e2eStars`.
- `tests/e2e/error-boundary.spec.ts` test „an exception in a frame …” oczekuje powitania po „Zacznij od nowa” — po S-11
  zależy to od tego, czy zapis zdążył wylądować przed wyjątkiem (patrz Critical Implementation Details).
- `docs/design-gaps.md` kończy się na wierszu 41. `context/foundation/lessons.md` nie istnieje — brak lekcji do
  zastosowania.

## Desired End State

- Zimny start z zapisem v1 w IndexedDB (`createStore('martynka', 'saves')`, klucz `profile:default`): `preBoot` ustawia
  zapisane `stars`, `rooms`, `currentRoom`, `settings` i ucznia (z podłogą kalendarza na `unlockedStep`); `BootScene`
  pomija powitanie; rozgrzewka wraca, jeśli `warmupPending`; karta „Nowa umiejętność!” wraca, jeśli `pendingUnlock`
  dotyczy bieżącego etapu.
- Zapis: każda zmiana pięciu kluczy rejestru → zapis po 500 ms (koalescencja); `hidden`/`pagehide` → zapis od razu, jeśli
  coś czeka; zakup i koniec rundy → zapis od razu. Jeden zapis w locie naraz; zmiana w trakcie zapisu → jeszcze jeden zapis
  po nim. Błąd zapisu: `console.error`, stan zostaje „brudny”, ponowienie przy następnej zmianie albo ukryciu; nigdy
  nieobsłużone odrzucenie, nigdy karta błędu. `navigator.storage.persist()` raz, po pierwszym udanym zapisie.
- Zapis nieczytelny (zły kształt, uszkodzony, `version` > 1 albo nieznana): autozapis zablokowany na całą sesję, karta DOM
  „Nie udało się wczytać zapisu” przed startem gry: „Zachowaj kopię” (bramka dla dorosłego → udostępnienie pliku
  `martynka-zapis.txt` przez `navigator.share`, inaczej pobranie) i „Graj dalej” (gra od powitania, bez zapisu). Karta
  wraca przy każdym starcie, dopóki zapis jest nieczytelny. Stary zapis bajt w bajt bez zmian.
- Odczyt niemożliwy (IndexedDB niedostępne, błąd po ponowieniu): gra bez zapisu na tę sesję, bez karty, autozapis
  zablokowany (nigdy nie piszemy, gdy nie udało się przeczytać — chroni istniejący zapis przed nadpisaniem pustą grą).
- Wyjątek fatalny (karta błędu) blokuje autozapis: stan w chwili wyjątku nie jest pewny.
- Weryfikacja: unit (format, fikstury, migracje, odrzucenia, harmonogram, wczytanie, podłoga, adapter na
  `fake-indexeddb`, granice lint), e2e w buildzie haka (restart zachowuje stan, natychmiastowy zapis po zakupie,
  `?e2eStars` tylko przy świeżym starcie, karta nieczytelnego zapisu z eksportem i blokadą zapisu), teacher read, zrzuty.

### Key Discoveries:

- Rejestr Phasera emituje `changedata-<key>` tylko przy zmianie **istniejącego** klucza; pierwszy `set` klucza emituje
  wyłącznie `setdata` (`node_modules/phaser/src/data/DataManager.js` `setValue`). Słuchacze podpięci po utworzeniu gry nie
  zapisują więc stanu startowego z `preBoot` — ale też **nie zobaczą powitania**: `learner` nie istnieje przed
  `WelcomeScene.start`, więc jego pierwszy `registry.set` to `setdata`, nie `changedata-learner` (plan-review F1).
- `TaskScene.finishRound` rozkłada `Adaptation` z `endRound` na ucznia (follow-up adaptive-curriculum): enkoder musi
  wybierać klucze jawnie, inaczej pole tylko-sesyjne wycieknie do formatu.
- `changeStageByParent` już zeruje `pendingUnlock`; zapis jako `{ stage, step }` i odrzucenie przy niezgodnym etapie
  kosztuje dziś nic, a później byłby migracją.
- iOS nie wysyła `pagehide`/`unload` przy zabiciu aplikacji (WebKit 199854); `visibilitychange` → `hidden` to ostatni
  pewny sygnał; debounce 500 ms ogranicza stratę do ostatnich ~0,5 s, zakup i koniec rundy są natychmiastowe.
- Pobranie bloba przez `<a download>` jest zawodne w aplikacji z ekranu początkowego iPada (WebKit 209407, 231892, 290847,
  275288); `navigator.share({ files })` otwiera arkusz udostępniania z „Zachowaj w Plikach”.
- IndexedDB jest per origin (z portem): e2e na dwóch buildach (#10) wymaga jednego portu na dwa buildy — patrz decyzja 9.

## What We're NOT Doing

- Eksport z panelu rodzica, import z walidacją i podsumowaniem, reset gry (S-12, FR-022). S-11 eksportuje tylko surową
  kopię nieczytelnego zapisu z karty (FR-021 „pokazuje rodzicowi możliwość eksportu”).
- Wiele profili w UI (poza v1); format ma tylko miejsce (`profileId`, klucz `profile:<id>`).
- Zapis rundy w toku: zimny start w trakcie rundy zaczyna nową rundę (gwiazdki za zadania są już na saldzie).
- Flaga „Pokój gotowy! widziana” (karta jest zdarzeniowa, S-10 gap 39); pole `rngSeed` (bez odbiorcy); `savedAt`.
- E2E na dwóch buildach (ryzyko #10 w pełni) — follow-up `Trigger: first save-format change (v2)` (decyzja 9).
- Zmiana `pl.errorCard.body` (obietnica powrotu do zapisu) — decyzja 8.
- Linia o stanie zapisu w panelu ustawień; ostrzeżenie dla rodzica o powtarzających się błędach zapisu.
- Follow-upy F3 (`errorBoundary` `String(reason)`), F4 (`WelcomeScene.openParent` na `active()`), F7 (`pl.settings.empty`)
  — bez zmiany tych plików/ścieżek w S-11; przeniesione z tymi samymi triggerami.

## Implementation Approach

Najpierw czysta logika, test-first (fazy 1–3: format i migracje; harmonogram zapisu, wczytanie i podłoga kalendarza;
adapter IndexedDB z granicą modułu i nowymi zależnościami), potem sklejka (faza 4: start asynchroniczny, słuchacze
rejestru, zapisy natychmiastowe w scenach, cykl życia strony, status w haku), jeden nowy komponent UI (faza 5: karta
nieczytelnego zapisu z eksportem + szew e2e), seam sweep z lukami projektu (faza 6) i e2e na końcu (faza 7). Każda faza
zostawia grę grywalną; do fazy 4 nic nie pisze do IndexedDB.

## Critical Implementation Details

- **Nigdy nie pisz, czego nie przeczytałeś.** Autozapis powstaje dopiero po wyniku `loadSave`; przy `unreadable` i
  `unavailable` jest zablokowany od początku (blokada trwa do końca sesji). Inaczej przejściowy błąd odczytu na iOS
  („Connection to Indexed Database server lost”) skończyłby się nadpisaniem prawdziwego zapisu pustą grą.
- **Nigdy nie pisz, czego nie umiesz przeczytać.** Autozapis waliduje zakodowany stan tą samą funkcją co dekoder
  (`validateSave`) przed `write`; niepoprawny → bez zapisu, `console.error`, status `failed`. Niezmiennik testowany:
  `decodeSave(encodeSave(s))` = `ok` dla każdego stanu sesji.
- **Jeden klucz, jeden `put`.** Cały stan w jednym obiekcie pod `profile:default`: przerwana transakcja zostawia poprzedni
  zapis w całości (nigdy pół gwiazdek, pół pokoju).
- **Zapis natychmiastowy po wszystkich `registry.set` zdarzenia.** W `RoomScene.dispatch` (`bought`) po zapisie `rooms` i
  `stars`; w `TaskScene.finishRound` po ostatnim `registry.set` (uczeń, saldo z premią). Migawka jest brana z rejestru w
  chwili zapisu, nie w chwili `markDirty`.
- **Blokada przy wyjątku fatalnym.** Handler `installErrorBoundary` w `main.ts` dostaje krok `autosaver.block('fatal')`
  (jak `suspend()` i `loop.sleep()`): stan w chwili wyjątku nie jest pewny, a zapisany zły stan dawałby kartę błędu przy
  każdym starcie. Skutek dla `tests/e2e/error-boundary.spec.ts` („Zacznij od nowa” → powitanie): wyjątek `?e2eFail=step`
  pada w pierwszej klatce `TaskScene` po powitaniu, przed upływem 500 ms, więc zapis z uczniem nie zdąży i spec zostaje
  zielony bez zmian; gdyby nie był — faza 4 aktualizuje oczekiwanie i komentarz (restart wraca do ostatniego zapisu).
- **ESLint flat config nadpisuje, nie scala, ustawienia tej samej reguły.** Nowy blok `no-restricted-imports` dla
  `idb-keyval` musi powtórzyć ograniczenia `phaser` w bloku `src/core/**` i wzorzec `core/(?!text/)` w bloku `src/data/**`
  (albo dopisać `idb-keyval` do istniejących bloków), inaczej późniejszy blok wyłączy wcześniejsze granice. Przypadki w
  `tests/lint-boundaries.test.ts` łapią regres.
- **Start asynchroniczny bez top-level `await`.** `main.ts` przenosi tworzenie gry do `async function start()` wołanej po
  `installErrorBoundary` (domyślny cel Vite 6 nie zna top-level `await`); `loadSave` nigdy nie odrzuca, więc odrzucenie
  `start` to prawdziwy błąd startu i słusznie podnosi kartę błędu.
- **Autozapis słucha `changedata` i `setdata`, nie tylko `changedata-<key>`** (plan-review F1). Ogólne zdarzenia
  rejestru `changedata` (`parent, key, value, previous`) i `setdata` (`parent, key, value`) filtrowane po jednej stałej
  `SAVE_KEYS` (`src/data/layout.ts`: `stars`, `rooms`, `currentRoom`, `learner`, `settings`), której używa też migawka.
  Słuchacze podpięte po `new Game`, więc `setdata` z `preBoot` ich nie budzi; powitanie (pierwszy `set` ucznia) — tak.
  Bez tego wybór wieku/etapu ginie przy zabiciu aplikacji przed pierwszą gwiazdką, a e2e test 3 nie widzi blokady.
- **`?e2eStars` tylko przy świeżym starcie** (`load === 'fresh'`): spec przeładowujący ten sam adres musi zobaczyć zapisane
  saldo.

## Phase 1: Format zapisu v1, dekoder z łańcuchem migracji i fikstury

Driver: tdd
Driver why: `src/core/save.ts`, typ v1 i fikstury nie istnieją; failing testy (round-trip stanu sesji, fikstura v1
dekoduje się do oczekiwanego stanu, zapis z przyszłości/uszkodzony → `unreadable`, `pendingUnlock` innego etapu → `null`)
prowadzą implementację (ryzyko #2).

### Overview

Czysty format bez przeglądarki: kodowanie stanu sesji do v1, dekodowanie surowej wartości (migracje → walidacja → stan
sesji), surowy tekst do eksportu.

### Changes Required:

#### 1. Typy formatu

**File**: `src/core/types.ts`

**Intent**: `SaveState` z planu §5 zastąpiony typem v1 opisującym to, co gra naprawdę trzyma (odstępstwo od planu §5,
decyzja 1); `rngSeed` usunięty; `LearnerState`/`Adaptation` bez zmian.

**Contract**: `SaveV1 = { version: 1; profileId: string; stars: number; rooms: Record<string, RoomState>; currentRoom:
string; settings: Settings; learner: SavedLearner | null }`; `SavedLearner = Pick<LearnerState, 'age' | 'stage' |
'stageOverriddenByParent' | 'unlockedStep' | 'mastery' | 'streak' | 'history' | 'weakStreak' | 'easedRounds'> & {
warmupPending: boolean; pendingUnlock: { stage: StageId; step: number } | null }`; `type SaveState = SaveV1` (alias
bieżącej wersji).

#### 2. Moduł formatu

**File**: `src/core/save.ts` (nowy)

**Intent**: `SAVE_VERSION = 1`, `DEFAULT_PROFILE = 'default'`. `encodeSave` buduje v1 z kluczy wybranych **jawnie** (bez
`...spread` obiektów sesji), `pendingUnlock` jako `{ stage: learner.stage, step }`. `decodeSave` przyjmuje `unknown`:
nie-obiekt / brak `version` / `version` nie-całkowita → `unreadable: corrupt`; `version > SAVE_VERSION` →
`unreadable: future`; `version < SAVE_VERSION` → kolejne kroki `MIGRATIONS[v]` (dziś pusty rekord; brak kroku →
`unreadable: unknown-version`), wyjątek w migracji → `unreadable: corrupt`; po migracji `validateSave` (ścisła: typy
wszystkich pól, `stars` całkowite ≥ 0, `stage` z `STAGE_ORDER`, opanowanie, serie i liczniki całkowite ≥ 0 (`core` nie importuje `balance`),
warianty 0|1|2, `tasksDone` całkowite ≥ 0, `currentRoom` jest kluczem `rooms`, `autoRead` boolean|null, wpisy historii z
typami pól; dodatkowe nieznane pola odrzucane z wyniku, nie z walidacji). Wynik `ok` niesie stan sesji (`learner:
SessionLearner | null` z `pendingUnlock: number | null` — `null`, gdy zapisany etap ≠ etap ucznia) i `migratedFrom`.
`rawExportText(raw)` → tekst JSON z wcięciem; gdy `JSON.stringify` rzuca (np. BigInt, cykl) → `String(raw)`; nigdy nie
rzuca. Wejście nigdy nie jest mutowane (dekoder kopiuje).

**Contract**: `interface SessionSave { stars: number; rooms: Record<string, RoomState>; currentRoom: string; settings:
Settings; learner: SessionLearner | null }`; `encodeSave(session: SessionSave, profileId?: string): SaveState`;
`type DecodeResult = { kind: 'ok'; session: SessionSave; migratedFrom: number | null } | { kind: 'unreadable'; reason:
'corrupt' | 'future' | 'unknown-version' }`; `decodeSave(raw: unknown, migrations?: Readonly<Record<number, (raw:
unknown) => unknown>>): DecodeResult` (domyślnie `MIGRATIONS`; parametr dla testu mechanizmu); `validateSave(value:
unknown): value is SaveState`; `rawExportText(raw: unknown): string`. Moduł bez Phasera, bez `src/data`, bez globali.

#### 3. Komentarz `rngSeed`

**File**: `src/core/rng.ts`

**Intent**: komentarz nagłówka nie zapowiada już `rngSeed` w zapisie (ziarno per użycie, decyzja 2).

#### 4. Fikstury i testy

**File**: `tests/fixtures/save-v1.json` (nowy), `tests/fixtures/save-v1-fresh.json` (nowy), `tests/save.test.ts` (nowy)

**Intent**: fikstury to zamrożone zapisy v1 (konwencja: plik `save-v<N>.json` zapisany przez wersję N nigdy nie jest
edytowany; nowa wersja dopisuje własną fiksturę i test, że stare dekodują się do oczekiwanego stanu bieżącego). `save-v1`:
uczeń E3 po kilku rundach (opanowanie, historia z `example`, `pendingUnlock` E3, `warmupPending: false`), salon z 3
zakupami, `autoRead: false`; `save-v1-fresh`: `learner: null`, saldo 0, pusty salon. Testy: fikstury czytane z dysku przez
`JSON.parse` → `decodeSave` → oczekiwany stan sesji (literał w teście, nie wynik enkodera); round-trip
`decodeSave(structuredClone(encodeSave(s)))` dla stanu zbudowanego prawdziwymi funkcjami `core` (`placeByChild`,
`startLearning`, `recordRound`/`endRound` po kilku rundach na seedach, `purchase`) i dla `learner: null`; enkoder pomija
pole tylko-sesyjne dodane do ucznia (`{ ...learner, extra: 1 }`); `pendingUnlock` innego etapu → `null`; odrzucenia:
`null`, `'x'`, `[]`, `{}`, `{ version: '1' }`, `{ version: 2 }` (future), `{ version: 0 }` (unknown-version),
v1 z `stars: -1`, `stars: 1.5`, `stage: 'E9'`, wariant 3, `currentRoom` spoza `rooms`, historia z `ok: 'tak'`; mechanizm
migracji na wstrzykniętym łańcuchu (v0 → v1 dodaje pole; rzucający krok → `corrupt`; brak kroku → `unknown-version`);
dekoder nie mutuje wejścia (`Object.freeze` głęboko na wejściu); `rawExportText` dla obiektu, dla `{ n: 1n }` i cyklu.

### Success Criteria:

#### Automated Verification:

- `tests/save.test.ts` czerwony przed implementacją (stuby `encodeSave`/`decodeSave` zwracają stałą → asercje, nie brak modułu), zielony po; unit `<baseline gałęzi> + N`
- Deliberate break: `encodeSave` kopiuje ucznia spreadem → test „pole tylko-sesyjne nie trafia do zapisu” czerwony; `decodeSave` migruje/akceptuje `version > SAVE_VERSION` → test „zapis z przyszłości → unreadable” czerwony; walidacja bez sprawdzenia `currentRoom ∈ rooms` → test odrzucenia czerwony; przywrócone; meta-check: oczekiwania z FR-021 („nieudane przeniesienie zostawia stary zapis”) i fikstur zapisanych ręcznie, nie z enkodera
- `npm run lint` (granice `src/core`); `npm run typecheck` (usunięty `rngSeed` bez użyć); pełna bramka lokalna zielona

---

## Phase 2: Harmonogram autozapisu, wczytanie i podłoga kalendarza

Driver: tdd
Driver why: `src/core/autosave.ts` (port `SaveStore`, `loadSave`, `createAutosaver`) i `floorToCalendar` nie istnieją;
failing testy na fałszywym magazynie i wstrzykniętych zegarach (debounce, natychmiastowy zapis, koalescencja, blokada po
nieczytelnym wczytaniu, ponowienie po błędzie, brak nieobsłużonych odrzuceń) prowadzą implementację (ryzyka #2, #16).

### Overview

Czysta maszyna zapisu: kiedy pisać, co przy błędzie, kiedy nigdy. Port magazynu jako typ w `core` — adapter przeglądarki
w fazie 3.

### Changes Required:

#### 1. Port, wczytanie, harmonogram

**File**: `src/core/autosave.ts` (nowy)

**Intent**: `loadSave(store)` czyta raz: `undefined` → `fresh`; wartość → `decodeSave` → `loaded` (stan sesji) albo
`unreadable` (z surową wartością do eksportu); odrzucenie odczytu → `unavailable`; **nigdy nie odrzuca**.
`createAutosaver` dostaje magazyn, funkcję migawki (stan sesji z rejestru), zegary, opóźnienie, `blocked` startowe i
callback pierwszego udanego zapisu. `markDirty()` → (gdy nie zablokowany) planuje zapis po `delayMs` (klasyczny debounce: każde
wywołanie przesuwa termin; zwłokę ograniczają zapisy natychmiastowe po zakupie i końcu rundy); `flush(reason)` → jeśli brudny i nie zablokowany: anuluje timer i pisze
teraz; `block(reason)` → anuluje timer, od teraz każdy zapis jest pomijany (licznik `skipped`). Zapis: migawka → `encodeSave`
→ `validateSave` → `store.write`; jeden zapis w locie; zmiana albo `flush` w trakcie → jeden kolejny zapis po nim; błąd
(rzut migawki/enkodera, niepoprawny stan, odrzucenie `write`) → `console.error` (wstrzyknięty `log`), `failures + 1`,
stan zostaje brudny, bez timera ponowienia (następna zmiana albo `flush` ponawia). Żadna metoda nie rzuca i nie zostawia
nieobsłużonej obietnicy (`flush` zwraca obietnicę, która zawsze się spełnia).

**Contract**: `interface SaveStore { read(): Promise<unknown>; write(value: SaveState): Promise<void> }`;
`type LoadOutcome = { kind: 'fresh' } | { kind: 'loaded'; session: SessionSave; migratedFrom: number | null } | { kind:
'unreadable'; reason: ...; raw: unknown } | { kind: 'unavailable' }`; `loadSave(store: SaveStore): Promise<LoadOutcome>`;
`type WriteReason = 'change' | 'now' | 'hidden'`; `interface AutosaveStatus { load: LoadOutcome['kind']; blocked: boolean;
dirty: boolean; writes: number; failures: number; skipped: number; lastReason: WriteReason | null }`;
`createAutosaver(options: { store: SaveStore; snapshot: () => SessionSave; timers: { setTimeout; clearTimeout };
delayMs: number; load: LoadOutcome['kind']; blocked: boolean; log: (...args: unknown[]) => void; onFirstWrite?: () =>
void }): { markDirty(): void; flush(reason: 'now' | 'hidden'): Promise<void>; block(reason: string): void; status():
AutosaveStatus }`.

#### 2. Podłoga kalendarza

**File**: `src/core/curriculum.ts`

**Intent**: obok `startLearning`: na starcie sesji z wczytanym uczniem każdy etap dostaje `max(zapisany, calendarStart)`
(follow-up adaptive-curriculum); brak klucza etapu → `calendarStart`; bez zmian → ten sam obiekt.

**Contract**: `floorToCalendar(learner: SessionLearner, stages, month: number, data: PlacementData, rules:
CurriculumRules): SessionLearner`.

#### 3. Liczba w danych

**File**: `src/data/balance.ts`

**Intent**: `save: { debounceMs: 500 }` z komentarzem (FR-020 „krótkie opóźnienie”; plan §8; strata przy zabiciu ≤ ~0,5 s).

#### 4. Testy

**File**: `tests/autosave.test.ts` (nowy), `tests/curriculumStart.test.ts`

**Intent**: fałszywy magazyn na `Map` z licznikiem zapisów, sterowaną porażką i odroczonym `write` (ręcznie
rozstrzygana obietnica), zegary wstrzyknięte (wzorzec testów narratora). `loadSave`: brak → `fresh`; fikstura v1 →
`loaded`; `{ version: 2 }` → `unreadable` z tą samą surową wartością; rzucający `read` → `unavailable`; magazyn bez
żadnego `write` po każdym z tych wczytań. Harmonogram: 3× `markDirty` w 500 ms → 1 zapis po 500 ms (`lastReason
'change'`); `flush('now')` → zapis od razu, timer anulowany (brak drugiego zapisu po 500 ms); `flush` bez zmian → 0
zapisów; zmiana w trakcie zapisu → dokładnie 1 kolejny zapis po nim, z nowszą migawką; `blocked: true` (wczytanie
`unreadable`/`unavailable`) → 0 zapisów po `markDirty`/`flush`, `skipped` rośnie; `block('fatal')` w trakcie
zaplanowanego zapisu → 0 zapisów; `write` odrzuca → `failures 1`, `dirty true`, brak nieobsłużonego odrzucenia (nasłuch
`unhandledRejection` w teście), następny `markDirty` ponawia i się udaje; migawka rzuca / stan niepoprawny → 0 zapisów,
`failures 1`; `onFirstWrite` dokładnie raz po pierwszym udanym zapisie. Właściwość ryzyka #2: losowa sekwencja
`markDirty`/`flush`/porażek na seedach → ostatni udany zapis równy migawce w chwili tego zapisu i dekoduje się (`ok`).
Podłoga: zapisany krok poniżej kalendarza → podniesiony; powyżej → bez zmian (ten sam obiekt); brak etapu → kalendarz.

### Success Criteria:

#### Automated Verification:

- `tests/autosave.test.ts` i nowe przypadki `curriculumStart.test.ts` czerwone przed implementacją (stub zwraca bez zapisu → asercje), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: autozapis ignoruje `blocked` → test „nieczytelny zapis nigdy nie jest nadpisany” czerwony; `flush` nie anuluje timera → test „brak drugiego zapisu po 500 ms” czerwony; `write` bez `catch` → test „brak nieobsłużonego odrzucenia” czerwony; przywrócone; meta-check: oczekiwania z FR-020/FR-021 i Critical Implementation Details, nie z kodu
- `npm run lint` (granice `src/core`: bez globali, zegary wstrzyknięte); pełna bramka lokalna zielona

---

## Phase 3: Adapter IndexedDB, zależności i granica modułu magazynu

Driver: tdd
Driver why: `src/storage/idb.ts` i reguły lint dla `idb-keyval` nie istnieją; failing test adaptera na `fake-indexeddb`
(prawdziwy structured clone, nie atrapa portu — anti-pattern ryzyka #2) i przypadki `lint-boundaries.test.ts` prowadzą
implementację.

### Overview

Jedyny moduł dotykający IndexedDB; cienki, z jednym ponowieniem po utracie połączenia.

### Changes Required:

#### 1. Zależności

**File**: `package.json`, `package-lock.json`

**Intent**: dokładne polecenia (Bash z `allowed_domains: ["registry.npmjs.org"]`):
`npm_config_cache="$TMPDIR/npm-cache" npm install --save-exact idb-keyval@6.3.0` oraz
`npm_config_cache="$TMPDIR/npm-cache" npm install --save-exact -D fake-indexeddb@6.2.5` (dokładne wersje w
`package.json`, bez `^`: biblioteka formatu jednokierunkowego nie zmienia się przy `npm install` bez przeglądu —
plan-review F2); oba pliki commitowane w tej fazie. Polecenia
bramki się nie zmieniają (`tests/**/*.test.ts` obejmuje nowe testy) — bez wiersza aktualizacji profilu.

#### 2. Adapter

**File**: `src/storage/idb.ts` (nowy)

**Intent**: `createIdbSaveStore` zwraca `SaveStore` (`core/autosave.ts`) nad `createStore('martynka', 'saves')` i kluczem
`profile:<id>`; obiekt zapisywany jako zwykły obiekt (structured clone, nie tekst JSON). `read`/`write` przy odrzuceniu z
nazwą `InvalidStateError` / `UnknownError` (utrata połączenia na iOS, WebKit 197050) tworzą nowy store i ponawiają raz;
inne odrzucenia przechodzą do wołającego (`loadSave`/autozapis je łapią). `requestPersistence()` woła
`navigator.storage?.persist?.()` i połyka wynik oraz odrzucenie (plan §8; `false` jest normalne). Brak `indexedDB` w
środowisku → `read` odrzuca (→ `unavailable`), nie rzuca przy imporcie. Komentarz: jedyny importer `idb-keyval`.

**Contract**: `createIdbSaveStore(options?: { dbName?: string; storeName?: string; profileId?: string }): SaveStore`
(opcje dla testu: świeża baza na test, bo `createStore` cache'uje otwarcie); `requestPersistence(): void`;
`SAVE_KEY_PREFIX = 'profile:'`.

#### 3. Granice lint

**File**: `eslint.config.mjs`, `tests/lint-boundaries.test.ts`

**Intent**: `src/storage/**` w bloku globali przeglądarki; `idb-keyval` (i `idb-keyval/*`) zakazany w `src/**` poza
`src/storage/**` przez `no-restricted-imports`; `indexedDB` dopisany do `no-restricted-globals` w `src/core/**` — **bez
utraty** ograniczeń `phaser` i `core/(?!text/)` (Critical Implementation Details). Testy: import `idb-keyval` w
`src/core/x.ts`, `src/scenes/x.ts`, `src/data/x.ts` → `no-restricted-imports`; w `src/storage/x.ts` → brak; `indexedDB`
w `src/core/x.ts` → `no-restricted-globals`; istniejące przypadki `phaser` i `src/data` nadal czerwone.

#### 4. Test adaptera

**File**: `tests/idbStore.test.ts` (nowy)

**Intent**: `import 'fake-indexeddb/auto'` na górze pliku (środowisko node vitest, bez zmiany `vitest.config.mts`);
świeża baza per test (`dbName` z licznikiem). Przypadki: pusty magazyn → `read()` = `undefined`; `write(fikstura v1)` →
`read()` głęboko równe, a `decodeSave` na wyniku = `ok` (prawdziwy round-trip przez structured clone); drugi `write`
nadpisuje (jeden klucz); dwa profile (`profileId` `a`/`b`) nie widzą się nawzajem; `write` z wartością nieklonowalną
(funkcja w polu) odrzuca (`DataCloneError`) — wołający dostaje odrzucenie; `requestPersistence` bez `navigator.storage`
nie rzuca.

### Success Criteria:

#### Automated Verification:

- `npm ls idb-keyval fake-indexeddb` pokazuje 6.3.0 i 6.2.5 (dev); `package.json` ma `"idb-keyval": "6.3.0"` i `"fake-indexeddb": "6.2.5"` (bez `^`); `package-lock.json` w commicie
- `tests/idbStore.test.ts` i nowe przypadki `lint-boundaries.test.ts` czerwone przed implementacją (stub `read` zwraca `undefined` zawsze → asercja round-trip; brak reguły → asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: blok `idb-keyval` w `eslint.config.mjs` nadpisuje regułę `phaser` w `src/core/**` (wzorzec bez powtórzenia) → przypadek „src/core must not import Phaser” czerwony; adapter zapisuje `JSON.stringify(value)` → test „decodeSave na odczycie = ok” czerwony; przywrócone; meta-check: dowodzi kolejności bloków flat config i prawdziwego round-tripu, nie atrapy portu
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona (adapter jeszcze nieużywany w `main.ts`)

---

## Phase 4: Wpięcie zapisu w grę — wczytanie na starcie, autozapis, zapisy natychmiastowe, cykl życia strony

Driver: impl
Driver why: sklejka (`main.ts` start asynchroniczny, słuchacze `changedata-*`, `flush` w `RoomScene.dispatch` i
`TaskScene.finishRound`, `visibilitychange`/`pagehide`, status w haku) na logice faz 1–3; przepływ w przeglądarce dowodzi
e2e fazy 7.

### Overview

Bez nowych komponentów UI. Od tej fazy gra pamięta stan między uruchomieniami.

### Changes Required:

#### 1. Start

**File**: `src/main.ts`

**Intent**: po `installErrorBoundary`: `async function start()` — `store = createIdbSaveStore()`, `outcome = await
loadSave(store)`; stan startowy: `loaded` → stan sesji z `floorToCalendar` na uczniu (etapy `src/data/curriculum`,
`placementData`, `balance.curriculum`, miesiąc sesji); `fresh` → dzisiejsze wartości (saldo `?e2eStars` tylko tutaj);
`unreadable`/`unavailable` → wartości świeże, autozapis zablokowany (`unreadable` → karta w fazie 5; w tej fazie tylko
`console.warn` i gra od powitania). `createGame` przyjmuje stan startowy (`SessionSave`), `preBoot` ustawia `learner` tylko
gdy nie-`null`. Po utworzeniu gry: `createAutosaver` (zegary `window`, `balance.save.debounceMs`, migawka czyta pięć
kluczy rejestru, `onFirstWrite` → `requestPersistence`), słuchacze `registry.events` `changedata` **i** `setdata`
filtrowane po `SAVE_KEYS` → `markDirty` (Critical Implementation Details; samo `changedata-<key>` przegapia pierwszy
`set` ucznia w powitaniu); autozapis w rejestrze pod nowym kluczem. Słuchacz
`visibilitychange` (`hidden`) dostaje `flush('hidden')` obok `narrator.cancel()`; nowy `pagehide` → `flush('hidden')`.
Handler granicy błędów: krok `autosaver.block('fatal')` (przez `booted`, jak `game`). `start()` wołane jako
`void start()` — jego odrzucenie to błąd startu (karta).

**Contract**: `REGISTRY_KEYS.saver` (`src/data/layout.ts`, komentarz: autozapis gry, `{ flush, status }`, ustawiany przed
scenami); `SAVE_KEYS` (`src/data/layout.ts`, lista pięciu kluczy zapisu — jedyne miejsce, z którego czytają słuchacze i
migawka); kolejność: granica błędów → wczytanie → gra → autozapis → hak e2e → reszta jak dziś.

#### 2. Zapisy natychmiastowe

**File**: `src/scenes/RoomScene.ts`, `src/scenes/TaskScene.ts`

**Intent**: `RoomScene.dispatch` w gałęzi `bought` po zapisie `rooms` i `stars` woła `flush('now')` autozapisu z
rejestru (brak w rejestrze → nic; obietnica ignorowana jawnie `void`, bo nigdy nie odrzuca). `TaskScene.finishRound` — to
samo na samym końcu metody, **po** `finishWarmup()` (rozgrzewka ustawia ucznia drugi raz: etap i `warmupPending: false`). Gałąź `changed` i pozostałe zapisy zostają przy debounce (decyzja 4).
Scena nie zna magazynu ani formatu.

**Contract**: interfejs w rejestrze `{ flush(reason: 'now' | 'hidden'): Promise<void>; status(): AutosaveStatus }` (typ z
`core/autosave.ts`).

#### 3. Przekazanie w `BootScene`

**File**: `src/scenes/BootScene.ts`

**Intent**: follow-up obserwowalności: przekazanie sterowania (`needsPlacement` na wczytanym uczniu → powitanie albo
zadania) poza łańcuchem obietnicy czcionki — w następnym kroku pętli (`this.time.delayedCall(0, …)` albo równoważnie), żeby
wyjątek startu doszedł do granicy błędów sam, a nie jako wtórny `TypeError` po „Font failed to load”. Wymuszona porażka
`boot` (e2e) zostaje w tym samym miejscu przekazania.

#### 4. Hak e2e (tylko odczyt)

**File**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: snapshot (także w gałęzi powitania) dostaje `save: AutosaveStatus` (kopia zamrożona) z rejestru; typ
`Snapshot` w `support/hook.ts`. Hak niczego nie zapisuje i nie otwiera IndexedDB.

#### 5. Spec granicy błędów

**File**: `tests/e2e/error-boundary.spec.ts` (tylko jeśli czerwony)

**Intent**: komentarz przy „Zacznij od nowa” mówi, że restart wraca do ostatniego zapisu sprzed wyjątku (tu: brak — wyjątek
przed debounce); oczekiwanie `welcome` zostaje. Zmiana tylko, gdy pełne e2e pokaże inaczej — wtedy oczekiwanie wynika z
reguły blokady przy wyjątku, nie z czasu.

### Success Criteria:

#### Automated Verification:

- `grep -n "idb-keyval" -r src/` tylko w `src/storage/idb.ts`; `npm run lint` zielony
- `npm run build` drukuje `e2e hook: absent`; `dist/sw.js` precache'uje chunk z adapterem (`grep -c "_app/" dist/sw.js` ≥ liczba plików js w `dist/_app/`); unit `<baseline gałęzi> + 0..N`
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0` (wszystkie dotychczasowe specy, w tym seed offline #8 i `error-boundary.spec.ts`; każdy test ma świeży kontekst, więc świeżą IndexedDB)
- Deliberate break (odroczony, jawnie): szew start → rejestr → zapis widać tylko w przeglądarce; żaden istniejący spec nie przeładowuje strony z zapisem. Agent fazy zapisuje patch `context/runs/2026-10-13-s09-s11/e2e-break-s11-p4.patch` (`createGame` dostaje zawsze stan świeży, ignorując `loaded`) z oczekiwaniem: test 1 fazy 7 czerwony na `screen !== 'welcome'` po przeładowaniu; orkiestrator stosuje go po fazie 7 (wiersz 7.3). Meta-check: break bez speca, który go łapie, nic by nie dowiódł — stąd przeniesienie, nie pominięcie
- Pełna bramka lokalna zielona

#### Manual Verification:

- [human] Na iPadzie (aplikacja z ekranu początkowego) i Androidzie: gwiazdki, salon i etap po zamknięciu aplikacji z przełącznika i ponownym otwarciu; po rozładowaniu/restarcie tabletu; po cichej aktualizacji (deploy, następne uruchomienie) — test-plan faza 7, ryzyka #2, #10

---

## Phase 5: Karta nieczytelnego zapisu z eksportem kopii i szew `?e2eSave`

Driver: impl
Driver why: jeden nowy komponent UI (karta DOM `saveFailedCard`) plus pomocnik eksportu na API przeglądarki i przepływ w
`main.ts` na `loadSave` z fazy 2; parser szwu ma test jednostkowy, przepływ dotykiem dowodzi e2e fazy 7.

### Overview

FR-021: zamiast pustej gry rodzic widzi możliwość eksportu; stary zapis zostaje nietknięty. Karta przed utworzeniem gry
(brak płótna pod spodem, więc bez przełącznika wejścia).

### Changes Required:

#### 1. Karta

**File**: `src/ui/dom/saveFailedCard.ts` (nowy), `src/style.css` (tylko jeśli potrzeba klasy)

**Intent**: wzorem `mountErrorCard` (`createOverlay`, `createText`, `createButton`): tytuł, jedno zdanie, przycisk
„Zachowaj kopię” (wtórny), przycisk „Graj dalej” (główny), mała notka. `role="alertdialog"`, `aria-labelledby`, fokus na
„Graj dalej”. Przyciski ≥ 96 px wysokości jak inne nakładki. Komentarz DESIGN-GAP (wiersz 42).

**Contract**: `mountSaveFailedCard(parent: HTMLElement, handlers: { onExport(): void; onContinue(): void }): { remove():
void }`.

#### 2. Eksport

**File**: `src/ui/dom/saveExport.ts` (nowy)

**Intent**: plik `text/plain` `martynka-zapis.txt` z `rawExportText(raw)`; `navigator.canShare?.({ files })` → `navigator.share`
(anulowanie `AbortError` = cicho); inaczej pobranie bloba przez `<a download>` i `URL.revokeObjectURL` po kliknięciu; każdy
inny błąd → `console.error`, karta zostaje. Nigdy nie rzuca. Nazwa pliku w `src/data/pl.ts` (widzi ją rodzic).

**Contract**: `exportRawSave(raw: unknown, nav?: Navigator, doc?: Document): Promise<void>`.

#### 3. Przepływ

**File**: `src/main.ts`

**Intent**: `unreadable` → karta; „Zachowaj kopię” → `openParentGate` (`src/ui/dom/parentGate.ts`, `rng` z `createRng`
na `Math.random`) → `onPass` → `exportRawSave(outcome.raw)`; karta zostaje (rodzic może jeszcze „Graj dalej”); „Graj
dalej” → karta znika, gra startuje ze stanem świeżym i autozapisem zablokowanym (`load: 'unreadable'`). Bez gry pod kartą
nie ma przełącznika wejścia do trzymania (reguła `openInputSession` dotyczy nakładek nad płótnem). Karta wraca przy
każdym starcie, dopóki zapis jest nieczytelny.

#### 4. Napisy

**File**: `src/data/pl.ts`

**Intent**: `pl.saveFailed = { title: 'Nie udało się wczytać zapisu', body: 'Zapis gry został na tablecie bez zmian.
Rodzic może zachować jego kopię.', export: 'Zachowaj kopię', continue: 'Graj dalej', note: 'Dziś gra nie zapisze
postępów.', fileName: 'martynka-zapis.txt' }` — propozycja do teacher readu (DESIGN-GAP, kit nie ma kopii); bez liczebników.

#### 5. Szew e2e

**File**: `src/testing/e2eHook.ts`, `src/main.ts`, `vite/e2eHookGuard.mjs`, `tests/e2eSave.test.ts` (nowy),
`tests/e2eHookGuard.test.ts`

**Intent**: `e2eSave(search)` → `'unreadable'` z `?e2eSave=unreadable`, inaczej `null` (czysty parser, wzorzec
`e2eMonth`). W `main.ts` tylko pod `__E2E_HOOK__`: przy `'unreadable'` magazyn to `e2eSaveStore()` z `e2eHook.ts` — w
pamięci, `read` zwraca `{ version: 99, profileId: 'default', stars: 7 }`, `write` zapisuje w pamięci (licznik widać w
`status().writes`). Nigdy nie dotyka IndexedDB (profil § 9). `'e2eSave'` w `E2E_HOOK_MARKERS` (a więc w wymaganych).
Testy: `?e2eSave=unreadable` → `'unreadable'`; brak, `x`, `UNREADABLE` → `null`; strażnik: chunk produkcyjny z `e2eSave` →
`ok: false`; build e2e bez `e2eSave` → `ok: false`.

### Success Criteria:

#### Automated Verification:

- `tests/e2eSave.test.ts` i nowy przypadek strażnika czerwone przed implementacją, zielone po; unit `<baseline gałęzi> + N`
- `npm run build` drukuje `e2e hook: absent`; build `E2E_HOOK=1` przechodzi z `e2eSave` w wymaganych markerach
- Deliberate break: wywołanie `e2eSave(...)` w `main.ts` bez warunku `__E2E_HOOK__` → `npm run build` czerwony („e2e hook leaked … (e2eSave …)”); przywrócone; meta-check: dowodzi strażnika na prawdziwym bundlu
- `npx playwright test` zielony: `<baseline gałęzi e2e> + 0`; pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Teacher read `pl.saveFailed` (tytuł, zdanie, „Zachowaj kopię”, „Graj dalej”, notka, nazwa pliku) — poprawnie, krótko; rodzic rozumie, że zapis nie zginął
- [visual] Zrzuty (build haka, `?e2eSave=unreadable`): karta, bramka dla dorosłego nad kartą, gra po „Graj dalej” (powitanie) — przy 1440×900 i 1024×768
- [human] Eksport kopii na iPadzie (aplikacja z ekranu początkowego: arkusz udostępniania, „Zachowaj w Plikach”) i na Androidzie (udostępnianie albo pobranie `martynka-zapis.txt`); plik zawiera surowy zapis
- [human] Szew `?e2eSave=unreadable` (tylko build haka, magazyn w pamięci) jako droga e2e i bramki wizualnej do karty

---

## Phase 6: Seam sweep, luki projektu, follow-upy i dokumentacja

Driver: impl
Driver why: dokumentacja i porządki po fazach 1–5, bez nowej logiki.

### Overview

Luki, follow-upy (zamknięcia i przeniesienia), `CLAUDE.md`, przegląd szwów, wiersze decyzji `[human]`.

### Changes Required:

#### 1. Luki projektu

**File**: `docs/design-gaps.md`

**Intent**: (42) karta „Nie udało się wczytać zapisu” — wygląd karty błędu, dwa przyciski, eksport za bramką, „Graj
dalej” bez bramki, karta przy każdym starcie; (43) zapis jest niewidoczny dla dziecka (bez wskaźnika zapisu, bez linii w
panelu ustawień); (44) eksport jako `martynka-zapis.txt` (`text/plain`, arkusz udostępniania przed pobraniem). Każdy wiersz
ma komentarz `DESIGN-GAP` w kodzie.

#### 2. Follow-upy

**File**: `context/changes/autosave-versioned-save/follow-ups/review-fixes.md` (nowy)

**Intent**: z `Trigger:` — pierwsza zmiana formatu (v2): fikstura `save-v1.json` zostaje, nowa `save-v2.json`, e2e na
dwóch buildach (#10, jeden origin; decyzja 9) i kopia starego zapisu `profile:default:backup-v1` przed pierwszym zapisem
po migracji, a także ochrona przed dwiema instancjami originu (plan-review F5); S-12: eksport/import z panelu rodzica używa `rawExportText`/`exportRawSave`, import przyjmuje `.txt` i `.json`,
`validateSave` jako walidator importu (#7), F7 `pl.settings.empty`; test-plan refresh: §6.5 „Adding a save migration
test” dostaje konwencję fikstur, faza 4 — status (unit + restart e2e dostarczone, dwa buildy czekają na v2); profil
autonomicznego runu: `src/storage/idb.ts` przestaje być ścieżką „planowaną” (§ 10). Przeniesione bez zmian: F3
(`errorBoundary`), F4 (`WelcomeScene.openParent`). Zamknięcia follow-upów `Trigger: S-11` z S-06, S-07, S-08, S-09, S-10 i
obserwowalności z odnośnikami do faz (karta błędu: decyzja 8; lista szumu: moduł zapisu łapie wszystko sam).

#### 3. Dokumentacja i seam sweep

**File**: `CLAUDE.md`, pliki faz 1–5

**Intent**: Current state: S-11 (`core/save.ts`, `core/autosave.ts`, `floorToCalendar`, `storage/idb.ts` jedyny importer
`idb-keyval`, `REGISTRY_KEYS.saver`, karta nieczytelnego zapisu, `?e2eSave` tylko w buildzie haka); zdanie „Not yet
present: … persistence” i „Until S-11 mastery resets on every cold start” / „session only until S-11” poprawione.
Seam sweep: komentarze „S-11 will persist / replaces” w `src/` (`placement.ts`, `main.ts`, `layout.ts`), martwe typy
(`LearnerState` poza `Adaptation`), duplikaty listy pięciu kluczy zapisu (jedna stała w `src/data/layout.ts` albo
`main.ts`).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS
- Deliberate break: `CLAUDE.md` wskazuje nieistniejący `src/core/saves.ts` → walidator FAIL; przywrócone; meta-check: walidator czyta ścieżki z reguł
- `grep -rn "S-11" src/` bez nieaktualnych zapowiedzi („S-11 will”, „until S-11”, „S-11 replaces”)
- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: brak duplikatów, nieaktualnych komentarzy i martwych kluczy z faz 1–5; każdy DESIGN-GAP ma komentarz w kodzie i wiersz w `docs/design-gaps.md`; follow-upy z `Trigger:`
- [human] Format v1 odchodzi od planu §5 (`Martynka-urzadza.md`): bez `rngSeed`, `learner` może być `null`, uczeń z `warmupPending` i `pendingUnlock: { stage, step }`, `profileId` i klucz `profile:default` — jednokierunkowe, akceptacja przed pierwszym deployem
- [human] Karta nieczytelnego zapisu: eksport za bramką dla dorosłego, „Graj dalej” bez bramki (dziecko nie utknie, gra bez zapisu, karta przy każdym starcie) — odchodzi od rekomendacji researchu („Graj dalej” za bramką)
- [human] E2E na dwóch buildach (ryzyko #10, test-plan faza 4) odroczone do pierwszej zmiany formatu (v2); dziś restart e2e pokrywa ścieżkę stanu
- [human] `pl.errorCard.body` bez obietnicy zapisanego postępu (zapis może być niedostępny albo ostatnie ~0,5 s przepada); follow-up obserwowalności zamknięty decyzją

---

## Phase 7: Restart zachowuje stan, zapis po zakupie, nieczytelny zapis nietknięty — e2e (#2, #10, #16)

Driver: e2e
Driver why: ryzyka #2 (zapis przeżywa restart, nieudane wczytanie nie pisze), #10 (część stanu: przeładowanie wraca do
zapisu) i #16 („kiedy zapis jest pisany” po zakupie) żyją tylko w przeglądarce (prawdziwa IndexedDB, rejestr, sceny,
karta DOM); zbudowane w fazach 4–5, kontrakt `E2E=on`.

### Overview

Nowy spec `tests/e2e/save-restart.spec.ts` w projekcie `chromium-hook` (build haka, port 4397). Stan tylko przez produkt
(+ szwy `e2eStars`, `e2eSave`); odczyt przez hak; nigdy `page.evaluate` do IndexedDB (profil § 9 — założyłoby pustą bazę).

### Changes Required:

#### 1. Projekt

**File**: `playwright.config.ts`

**Intent**: `ROUND_SPEC` obejmuje `save-restart`. Wpisy `webServer` bez zmian.

#### 2. Spec

**File**: `tests/e2e/save-restart.spec.ts` (nowy)

**Intent**: opóźnienie z `balance.save.debounceMs` (import danych), nie na sztywno.
Test 1 „#2 #10 a reload comes back to the saved learner, stars and room”: `silenceSpeech`, `passWelcome` (rodzic, E3) →
`playRoundRight(page, 5)` → podsumowanie → `expect.poll` na `save`: `lastReason === 'now'`, `dirty === false`,
`writes ≥ 1`, `load === 'fresh'` → kopia `learner`, `counterText`, `room`-owego `rooms` z migawki → `page.reload()` →
`screen === 'task'` (nie `welcome`), `save.load === 'loaded'`, `learner` głęboko równy kopii (opanowanie, historia,
`unlockedStep`), `counterText` równy.
Test 2 „#16 FR-020 a purchase is saved at once and ?e2eStars seeds only a fresh start”: `passWelcome(page, { e2eStars:
'20' })` → „Do pokoju” → zakup podłogi dotykiem (`taskButton` → miniatura → „Wybieram”; saldo 15) → `expect.poll`
`save.lastReason === 'now'`, `dirty === false` (bez czekania na debounce) → `page.reload()` (adres nadal z `e2eStars=20`)
→ `save.load === 'loaded'`, `counterText === '15'`, po „Do pokoju” `room.tasksDone === 1` i `chosen.floor` jak przed.
Test 3 „#2 FR-021 an unreadable save shows the parent card, exports the raw copy and is never written”: `goto('/?e2eSave=unreadable')`
→ karta (`getByRole('alertdialog', { name: pl.saveFailed.title })`) → „Zachowaj kopię” → bramka (`gateProblem`,
`typeIntoGate` z `support/welcome.ts`) → `page.waitForEvent('download')` (headless Chromium bez `navigator.share`) →
nazwa `pl.saveFailed.fileName`, treść zawiera `"version": 99` i `"stars": 7` → karta nadal widoczna → „Graj dalej” →
karta znika, `screen === 'welcome'`, `save.load === 'unreadable'`, `blocked === true` → stuknięcie wieku (cel z
`targets.ages`; pierwszy `set` ucznia = `setdata`, który autozapis słucha) → `expect.poll` `save.skipped + save.writes ≥ 1`
(próba zapisu nastąpiła — przy blokadzie jako pominięcie, przy break C jako zapis) → `save.writes === 0` i
`save.skipped ≥ 1`. Asercja `skipped ≥ 1` sama nie dowodzi blokady (break C nie podnosi `skipped`, test padłby na
przekroczeniu czasu, nie na `writes`) — stąd suma w poll (plan-review F1).

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; `expect.poll` na snapshot, bez `waitForTimeout`;
`npx playwright test tests/e2e/save-restart.spec.ts`. Chromium niedostępny w sesji agenta → plik
`context/runs/2026-10-13-s09-s11/e2e-request-s11-p7.md` + patche break'ów (protokół `prompt-phase.md`). Unikać celów na
krawędziach (lekcja S-10: punkt na krawędzi wypada poza po skalowaniu strona↔gra) — środki celów z haka.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/save-restart.spec.ts` zielony (3 passed); pełne `npx playwright test`: `<baseline gałęzi e2e> + 3` passed
- Deliberate break A (patch `e2e-break-s11-p7a.patch`, tylko `src/scenes/RoomScene.ts`, REGUŁA): gałąź `bought` bez `flush('now')` → test 2 czerwony na `lastReason === 'now'`; przywrócone; meta-check: `autosave.test.ts` zielony — e2e dowodzi szwu sceny
- Deliberate break B (patch `e2e-break-s11-p4.patch` z fazy 4, tylko `src/main.ts`): start zawsze ze stanem świeżym → test 1 czerwony na `screen !== 'welcome'`; przywrócone; meta-check: unit `loadSave` zielony — e2e dowodzi startu
- Deliberate break C (patch `e2e-break-s11-p7c.patch`, tylko `src/main.ts`, REGUŁA): autozapis po `unreadable` niezablokowany → test 3 czerwony na `writes === 0`; przywrócone; meta-check: unit „blocked → 0 zapisów” zielony — e2e dowodzi przekazania wyniku wczytania
- Deliberate break D (patch `e2e-break-s11-p7d.patch`, tylko `src/main.ts`): `?e2eStars` nadpisuje saldo także przy `loaded` → test 2 czerwony na `counterText === '15'`; przywrócone; meta-check: dowodzi kolejności zapis > szew
- `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery 4397/4398 zabite po przebiegu

---

## Testing Strategy

### Unit Tests:

- Format: round-trip, fikstury v1 (zamrożone), odrzucenia, mechanizm migracji, brak wycieku pól sesji (`save.test.ts`).
- Harmonogram i wczytanie: debounce, natychmiastowy zapis, koalescencja, blokady, błędy bez nieobsłużonych odrzuceń,
  właściwość „ostatni udany zapis dekoduje się” (`autosave.test.ts`); podłoga kalendarza (`curriculumStart.test.ts`).
- Adapter: prawdziwy structured clone na `fake-indexeddb`, profile rozdzielne (`idbStore.test.ts`).
- Granice: `idb-keyval` tylko w `src/storage`, `indexedDB` nie w `core` (`lint-boundaries.test.ts`); szew `e2eSave`
  (`e2eSave.test.ts`, `e2eHookGuard.test.ts`).

### Integration Tests:

- `npm run build` ze strażnikiem haka (`e2eSave` nieobecny w `dist/`), precache obejmuje chunk z adapterem; seed offline
  (#8) zielony z zapisem; `save-restart.spec.ts` (3 testy) + wszystkie dotychczasowe specy bez zmian.

### Manual Testing Steps:

1. Zrzuty karty nieczytelnego zapisu, bramki nad nią i powitania po „Graj dalej” — 1440×900 i 1024×768.
2. Teacher read `pl.saveFailed`.
3. iPad i Android: zamknięcie z przełącznika i ponowne otwarcie, restart tabletu, cicha aktualizacja — stan identyczny;
   eksport kopii przez arkusz udostępniania.

## Performance Considerations

Zapis to jeden `put` obiektu rzędu dziesiątek KB (historia ≤ 200 wpisów) najwyżej co ~500 ms; `structured clone` i
walidacja liniowe w rozmiarze. Wczytanie na starcie: jedno otwarcie bazy i `get` (dziesiątki ms) przed `new Game`;
czcionka ładuje się dalej w `BootScene`. `idb-keyval` ~1 KB gzip w chunku wejściowym.

## Migration Notes

Brak bazy (profil § 4). Format v1 to pierwszy zapis — żaden build nie zapisywał, więc nie ma danych do przeniesienia.
Mechanizm: `decodeSave` zna `MIGRATIONS` (pusty); v2 dopisze krok `1 → 2`, fiksturę `save-v2.json` i test, że
`save-v1.json` dekoduje się do oczekiwanego stanu v2. Wycofanie deployu do builda sprzed S-11: tamten build nie czyta ani
nie pisze IndexedDB, zapis czeka nietknięty. Build v1 widzący zapis v2 (wycofanie po v2): `unreadable: future`, bez
zapisu, karta z eksportem.

## Known risks

- **Przejściowy błąd odczytu na iOS**: sesja bez zapisu (blokada), następne uruchomienie czyta poprawnie; jedno
  ponowienie z nowym store w adapterze. Ciche, wielosesyjne `unavailable` (stary tryb prywatny) = gra bez zapisu bez
  sygnału dla rodzica — decyzja 5, zmieni ją dowód z urządzenia.
- **Debounce 500 ms**: zabicie aplikacji w tym oknie traci ostatnie zmiany (nie zakup, nie koniec rundy).
- **Eviction w Safari**: `persist()` po pierwszym zapisie; prawdziwą kopią zapasową jest eksport S-12.
- **Format jednokierunkowy**: wiersz `[human]` 6.6 przed pierwszym deployem; każda późniejsza zmiana to migracja z fiksturą.
- **Chromium w sesji agenta**: fazy 4–5 oddają e2e orkiestratorowi, faza 7 pisze `e2e-request-s11-p7.md` z patchami A–D.
- **Walidacja v1 nie może się zaostrzyć**: każdy przyszły build musi przyjąć to, co build v1 przyjął i zapisał;
  zaostrzenie `validateSave` bez migracji zamieniłoby dobre zapisy w „nieczytelne” (karta przy każdym starcie).
  Strażnikiem jest zamrożona `tests/fixtures/save-v1.json` — dlatego musi pochodzić z prawdziwego stanu gry (round-trip
  na funkcjach `core`), nie z minimalnego literału (plan-review F4).
- **Dwie instancje tego samego originu** (Android: aplikacja z ekranu początkowego i karta Chrome dzielą IndexedDB):
  ostatni zapis wygrywa, więc stara karta może cofnąć postęp. Poza zakresem v1 (jedno dziecko, jedno okno); rozwiązanie
  (np. `BroadcastChannel`/licznik zapisu) to zmiana formatu → follow-up (plan-review F5).
- **Ścisła walidacja**: błąd w enkoderze dałby kartę przy każdym starcie — niezmiennik `decodeSave(encodeSave(s))` = `ok`
  w testach i walidacja przed każdym zapisem.

## Autonomous decisions

1. **v1 = stan, który gra trzyma, klucze wybrane jawnie; `learner` nullable z `warmupPending` i `pendingUnlock: { stage,
   step }`; `profileId`** (change.md decyzja 1, research §1–2). Wbrew dosłownemu planowi §5 → `[human]` 6.6. Odrzucone:
   `LearnerState` z planu (gubi rozgrzewkę i odblokowanie, wymusza ucznia przed powitaniem), spread obiektu sesji.
   Zmieniłoby: maintainer odrzuci odstępstwo przed deployem.
2. **Bez `rngSeed` i bez `savedAt`** (research §1): pola bez odbiorcy w formacie jednokierunkowym to dług; dodanie później
   to pierwsza migracja z fiksturą. Zmieniłoby: potrzeba odtworzenia losowania albo daty zapisu w podsumowaniu importu S-12.
3. **Klucz `profile:default` w bazie `martynka`/`saves`, obiekt (structured clone)** (research §2). Odrzucone: koperta
   wszystkich profili w jednym kluczu (migracja przy profilach), tekst JSON. Zmieniłoby: profile z danymi wspólnymi.
4. **Natychmiast: zakup i koniec rundy; zmiana wariantu i reszta przez debounce 500 ms; `hidden` + `pagehide` → zapis
   oczekującego** (FR-020, research §7). Zmieniłoby: zmiana wariantu uznana za nieodwracalną.
5. **`unavailable` → sesja bez zapisu, bez karty, autozapis zablokowany** (research §8; blokada dodana w tym planie, by
   przejściowy błąd odczytu nie nadpisał prawdziwego zapisu). Zmieniłoby: dowód z urządzeń na trwałe `unavailable`.
6. **Nieczytelny zapis: karta przed grą, eksport surowej kopii za bramką dla dorosłego, „Graj dalej” bez bramki**
   (FR-021, change.md decyzja 4). Research rekomendował „Graj dalej” za bramką — odrzucone, bo dziecko bez dorosłego
   utknęłoby przed grą („Zero frustracji”, brak stanów porażki), a zapis i tak jest chroniony blokadą; bramka chroni
   ruch wyprowadzający dane. → `[human]` 6.7. Zmieniłoby: maintainer woli, by tylko dorosły decydował.
7. **Eksport `martynka-zapis.txt` (`text/plain`), najpierw `navigator.share`, potem pobranie** (research §9: pobranie
   zawodne w aplikacji z ekranu iPada). → `[human]` 5.7. Zmieniłoby: test na urządzeniach.
8. **`pl.errorCard.body` bez zmian; wyjątek fatalny blokuje autozapis** (research §9): zapis może być niedostępny, a stan
   w chwili wyjątku niepewny (zapisany zły stan = karta przy każdym starcie). Follow-up obserwowalności zamknięty
   decyzją → `[human]` 6.9. Zmieniłoby: S-12 z widocznym stanem zapisu.
9. **E2E na dwóch buildach (#10) odroczone do v2** (research §5): przy jednym formacie to ta sama ścieżka kodu co restart
   e2e (test 1), a jeden origin dla dwóch buildów wymaga nowego serwera albo builda pod ścieżką z zablokowanym SW. Wbrew
   „faza 4 test-planu dostarczona w całości” → `[human]` 6.8; follow-up `Trigger: first save-format change (v2)`.
   Zmieniłoby: pierwsza migracja albo maintainer chce dowodu teraz.
10. **Szew `?e2eSave=unreadable` z magazynem w pamięci, tylko w buildzie haka, marker w strażniku** (reguła runu, profil
    § 9 — nigdy zapis do IndexedDB z testu). → `[human]` 5.8. Zmieniłoby: maintainer zabroni nowych przełączników.
11. **Podłoga kalendarza przy wczytaniu: `max(zapisany, calendarStart)` per etap** (follow-up adaptive-curriculum). Zmieniłoby: S-17 kalibracja.
12. **`BootScene`: przekazanie poza obietnicą czcionki** (follow-up obserwowalności, `Trigger: S-11`). F3, F4, F7 przeniesione
    (S-11 nie zmienia tych ścieżek).
13. **Zależności: `idb-keyval@6.3.0`, `fake-indexeddb@6.2.5` (dev)** — najnowsze w rejestrze, starsze niż 2 tygodnie (research §4).
14. **Fazy: 3 × tdd (format, harmonogram, adapter), 2 × impl (sklejka bez UI; karta + eksport + szew = 1 komponent UI),
    seam sweep, 1 × e2e.** Break'i szwów faz 4–5 przeniesione do e2e fazy 7 (patche B, C).

## References

- Research: `context/changes/autosave-versioned-save/research.md`; change: `context/changes/autosave-versioned-save/change.md`
- PRD: `context/foundation/prd.md` FR-003, FR-020, FR-021, US-04, guardrail „Postęp nigdy nie ginie”
- Plan gry: `Martynka-urzadza.md` §1 (profile), §3 (`idb-keyval`), §4 (`core/save.ts`, `storage/idb.ts`), §5 (`SaveState`), §8, §9, §11 (M5)
- Test-plan: `context/foundation/test-plan.md` ryzyka #2, #10, #16 (i #7 dla S-12), faza 4, §6.5; `context/foundation/test-stack.md` § E2E
- Kod: `src/main.ts` (`createGame`, `preBoot`, `installErrorBoundary`), `src/scenes/RoomScene.ts` (`dispatch`), `src/scenes/TaskScene.ts` (`finishRound`), `src/scenes/BootScene.ts` (`create`), `src/core/placement.ts` (`SessionLearner`), `src/core/curriculum.ts` (`calendarStart`, `startLearning`), `src/core/errorSignal.ts` (`QUIET_REJECTIONS`), `src/ui/dom/errorCard.ts` (`mountErrorCard`), `src/ui/dom/parentGate.ts` (`openParentGate`), `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`
- Follow-upy: `context/archive/2026-10-13-{first-launch-placement,adaptive-curriculum,parent-settings-progress,first-furniture-purchase,variant-change-room-done,observability-c1-c2}/follow-ups/review-fixes.md` (`Trigger: S-11`)
- Format: `context/archive/2026-10-13-variant-change-room-done/plan.md` (+ `reviews/plan-review.md`, `reviews/impl-review.md`)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Format zapisu v1, dekoder z łańcuchem migracji i fikstury

#### Automated

- [x] 1.1 `save.test.ts` czerwony przed implementacją (asercja na stubie), zielony po; unit baseline + N — 7cf32a4
- [x] 1.2 Deliberate break spread ucznia / akceptacja `version > 1` / brak sprawdzenia `currentRoom` → czerwone; przywrócone; meta-check — 7cf32a4
- [x] 1.3 `npm run lint` (granice `core`), `npm run typecheck` bez `rngSeed`; pełna bramka lokalna zielona — 7cf32a4 (e2e: orchestrator run on 7149039, 26 passed)

### Phase 2: Harmonogram autozapisu, wczytanie i podłoga kalendarza

#### Automated

- [x] 2.1 `autosave.test.ts` i nowe przypadki `curriculumStart.test.ts` czerwone przed implementacją, zielone po; unit baseline + N — 76f6df1 (e2e: orchestrator gate)
- [x] 2.2 Deliberate break ignorowane `blocked` / `flush` bez anulowania timera / `write` bez `catch` → czerwone; przywrócone; meta-check — 76f6df1 (e2e: orchestrator gate)
- [x] 2.3 `npm run lint` (granice `core`); pełna bramka lokalna zielona — 76f6df1 (e2e: orchestrator run on 75eaa08, 26 passed)

### Phase 3: Adapter IndexedDB, zależności i granica modułu magazynu

#### Automated

- [x] 3.1 `npm ls` pokazuje `idb-keyval` 6.3.0 i `fake-indexeddb` 6.2.5 (dev), w `package.json` bez `^`; `package-lock.json` w commicie — 43af7ea
- [x] 3.2 `idbStore.test.ts` i nowe przypadki `lint-boundaries.test.ts` czerwone przed implementacją, zielone po; unit baseline + N — 43af7ea
- [x] 3.3 Deliberate break blok `idb-keyval` nadpisuje regułę `phaser` / adapter zapisuje tekst JSON → czerwone; przywrócone; meta-check — 43af7ea
- [x] 3.4 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona — 43af7ea (e2e: orchestrator run on bffbb30, 26 passed)

### Phase 4: Wpięcie zapisu w grę — wczytanie na starcie, autozapis, zapisy natychmiastowe, cykl życia strony

#### Automated

- [x] 4.1 `idb-keyval` importowany tylko w `src/storage/idb.ts`; `npm run lint` zielony — 29da899
- [x] 4.2 `npm run build` drukuje `e2e hook: absent`; precache obejmuje chunk z adapterem; unit baseline + 0..N — 29da899
- [x] 4.3 `npx playwright test` zielony, baseline e2e + 0 (seed offline i `error-boundary.spec.ts` z zapisem) — 29da899 (e2e: orchestrator gate)
- [x] 4.4 Deliberate break odroczony: patch `e2e-break-s11-p4.patch` (start zawsze świeży) zapisany, dowód w fazie 7 (7.3); meta-check w handoff — 29da899
- [x] 4.5 Pełna bramka lokalna zielona — 29da899 (e2e: orchestrator gate)

#### Manual

- [ ] 4.6 [human] iPad i Android: stan po zamknięciu z przełącznika, po restarcie tabletu, po cichej aktualizacji (#2, #10)

### Phase 5: Karta nieczytelnego zapisu z eksportem kopii i szew `?e2eSave`

#### Automated

- [x] 5.1 `e2eSave.test.ts` i przypadek strażnika czerwone przed implementacją, zielone po; unit baseline + N — 00998c0
- [x] 5.2 `npm run build` drukuje `e2e hook: absent`; build `E2E_HOOK=1` przechodzi z `e2eSave` w wymaganych markerach — 00998c0
- [x] 5.3 Deliberate break `e2eSave(...)` bez `__E2E_HOOK__` → `npm run build` czerwony; przywrócone; meta-check — 00998c0
- [x] 5.4 `npx playwright test` zielony, baseline e2e + 0; pełna bramka lokalna zielona — 00998c0 (e2e: orchestrator run on bd71eeb, 26 passed)

#### Manual

- [ ] 5.5 [reviewer] Teacher read `pl.saveFailed` (tytuł, zdanie, przyciski, notka, nazwa pliku)
- [ ] 5.6 [visual] Karta, bramka nad kartą, powitanie po „Graj dalej” — 1440×900 i 1024×768
- [ ] 5.7 [human] Eksport kopii na iPadzie (aplikacja z ekranu początkowego) i Androidzie
- [ ] 5.8 [human] Szew `?e2eSave=unreadable` jako droga e2e i bramki wizualnej do karty

### Phase 6: Seam sweep, luki projektu, follow-upy i dokumentacja

#### Automated

- [x] 6.1 `validate-rule-files.sh` PASS — ae919d0
- [x] 6.2 Deliberate break nieistniejąca ścieżka w `CLAUDE.md` → FAIL; przywrócone; meta-check — ae919d0
- [x] 6.3 `grep "S-11" src/` bez nieaktualnych zapowiedzi — ae919d0
- [x] 6.4 Pełna bramka lokalna zielona; unit baseline + 0 — ae919d0

#### Manual

- [ ] 6.5 [reviewer] Seam sweep: duplikaty, komentarze, martwe klucze, DESIGN-GAP w kodzie i w `docs/design-gaps.md`, follow-upy z `Trigger:`
- [ ] 6.6 [human] Format v1 odchodzi od planu §5 (bez `rngSeed`, `learner` nullable, `warmupPending`, `pendingUnlock: { stage, step }`, `profileId`) — akceptacja przed pierwszym deployem
- [ ] 6.7 [human] Karta nieczytelnego zapisu: eksport za bramką, „Graj dalej” bez bramki (wbrew rekomendacji researchu)
- [ ] 6.8 [human] E2E na dwóch buildach (#10, test-plan faza 4) odroczone do v2
- [ ] 6.9 [human] `pl.errorCard.body` bez obietnicy zapisanego postępu; wyjątek fatalny blokuje autozapis

### Phase 7: Restart zachowuje stan, zapis po zakupie, nieczytelny zapis nietknięty — e2e (#2, #10, #16)

#### Automated

- [x] 7.1 `save-restart.spec.ts` zielony (3 passed); pełne `npx playwright test` baseline e2e + 3 — a403b21 (orchestrator e2e run, round 2, see handoff §3)
- [x] 7.2 Deliberate break A: `bought` bez `flush('now')` → test 2 czerwony; przywrócone; meta-check — a403b21 (orchestrator e2e run, round 2, see handoff §3)
- [x] 7.3 Deliberate break B (patch fazy 4): start zawsze świeży → test 1 czerwony; przywrócone; meta-check — a403b21 (orchestrator e2e run, round 2, see handoff §3)
- [x] 7.4 Deliberate break C: autozapis po `unreadable` niezablokowany → test 3 czerwony; przywrócone; meta-check — a403b21 (orchestrator e2e run, round 2, see handoff §3)
- [x] 7.5 Deliberate break D: `?e2eStars` nadpisuje saldo przy `loaded` → test 2 czerwony; przywrócone; meta-check — a403b21 (orchestrator e2e run, round 2, see handoff §3)
- [x] 7.6 `npm run build` drukuje `e2e hook: absent`; pełna bramka lokalna zielona; serwery zabite — a403b21 (orchestrator e2e run, round 2, see handoff §3)
