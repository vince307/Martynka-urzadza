# Dźwięki gry z paczki salon-v2 (S-16b `final-sound`) — Implementation Plan

## Overview

Slice roadmapy **S-16b** (decyzje autora 2026-10-15). Dziecko słyszy 12 efektów P1 z `designs/martynka-salon-v2`
(`answer-right`, `answer-retry`, `star`, `round-bonus`, `tap`, `panel-open`, `variant-pick`, `purchase`, `room-done`,
`skill-unlock`, `coin`, `minigame-done`) po pierwszym dotknięciu; opcjonalna `music-loop` gra tylko, gdy rodzic ją włączy.
Efekty **domyślnie włączone**, muzyka **domyślnie wyłączona**; rodzic przełącza oba w panelu ustawień. Ustawienie dźwięku
żyje **poza zapisem gry** (własny klucz `localStorage`), format zapisu zostaje **v3**, fixtury bajt w bajt. Gra jest w
pełni grywalna bez dźwięku, uszkodzony lub brakujący plik dźwięku nigdy nie pokazuje karty błędu, efekty nie przerywają
narratora. Zamyka follow-up `audio.noAudio` (archiwum `2026-10-13-observability-c1-c2`) i lukę projektu 35 (dźwięk zakupu).

## Current State Analysis

(Za `research.md`, symbole potwierdzone w tym kroku na `887849a`.)

- Żaden dźwięk nie jest ładowany ani grany. `createGame` (`src/main.ts`) nie ustawia `audio`, więc Phaser 4.2.1 tworzy
  `WebAudioSoundManager`, który sam odblokowuje kontekst na pierwszym `touchstart/mousedown/keydown` na `document.body`
  (`unlock()`); `src/ui/dom/overlay.ts` nie zatrzymuje propagacji (brak `stopPropagation` w `src/`).
- `this.load.audio(key, [urlA, urlB])` wybiera JEDEN URL w chwili kolejkowania (pierwszy, którego `game.device.audio[typ]`
  jest prawdziwy) i **nigdy** nie wraca do drugiego po błędzie pobrania albo dekodowania (`AudioFile.getAudioURL`).
  Dekodowanie (`AudioFile.onProcess`) idzie przez `decodeAudioData` na callbackach; zwrócona obietnica jest porzucana,
  więc uszkodzony plik daje dziś nieobsłużone odrzucenie `EncodingError` → `isFatalSignal` (`src/core/errorSignal.ts`,
  `QUIET_REJECTIONS = {AbortError, NotAllowedError}`) → karta błędu. `sound.add(key)` dla brakującego klucza rzuca.
- `src/scenes/loaderCut.ts` `cutLoad` podmienia `onProcessComplete` plików z `queue`, ale nie `onProcessError`: późny błąd
  dekodowania uciętego pliku audio woła `fileProcessComplete` → drugi `loadComplete`.
- `src/scenes/BootScene.ts` `preload` kolejkuje font, `TASK_ART`, `ROOM_ART`; handler `loaderror` zna tylko font i obrazki;
  `create()` liczy `artHealth`/`roomArtHealth` z `textures.exists`. `balance.loader` (`timeoutMs` 12000, `totalMs` 45000)
  ma komentarz „S-16b adds about 13 sounds”.
- Paczka: 13 ścieżek w `audio-manifest.json` (`duration` w s, `logicalFrames`, mono 44,1 kHz); efekty M4A 132 243 B,
  OGG 81 144 B; `music-loop` 48 s: M4A 746 014 B, OGG 107 707 B. `audio-player.js` (wzorzec, nie do kopiowania): przycina
  zdekodowany bufor do `round(duration × sampleRate)` ramek od początku, gra efekty z gain 0,65 i muzykę 0,14 pod masterem
  0,55, muzyka z nakładką 40 ms.
- iOS Ogg Vorbis (caniuse, research): Safari iOS ≤ 17.3 brak, 17.4–18.3 częściowe, 18.4+ pełne.
- Precache: `vite/config.shared.mjs` `globPatterns` obejmuje już `ogg` i `m4a`.
- Ustawienia: `Settings = { autoRead }` (w zapisie); `src/ui/dom/settingsPanel.ts` ma grupę Wł./Wył. czytania
  (`pl.settings.autoReadOn/Off` = „Włączone”/„Wyłączone”); `UIScene.applySettings(stage, autoRead)` stosuje wynik.
  ESLint zabrania `localStorage` tylko w `src/core` (`no-restricted-globals`); w `src/` nikt go jeszcze nie używa.
- Miejsca zdarzeń (research, tabela): `TaskScene.submit`, `advance`, `startNextRound` (obok `autoReadUnlock`), `syncStars`,
  `feedDrag`; `RoomScene.dispatch`, `showCard` (guard `cardDrawn`), pusty `playPurchaseSound` (luka 35); `UIScene` jest
  uruchamiana przez `TaskScene` (`scene.launch`) i trwa przez pokój.
- Narrator (`src/ui/narrator.ts`) nie ma stanu „mówi”; nic nie anuluje mowy na stuknięciu.
- `context/foundation/lessons.md` nie istnieje. Ostatni wiersz `docs/design-gaps.md`: 113.

## Desired End State

- `public/assets/sounds/{m4a,ogg}/<id>.{m4a,ogg}` (26 plików z paczki, bajt w bajt) z `npm run sounds`
  (`scripts/copy-sounds.mjs`); tabela `SOUNDS` w `src/data/sounds.ts` (id, klucz `sounds/<id>`, URL-e w kolejności
  `[m4a, ogg]`, `durationS`, `boot` = efekt) równa plikom na dysku (test); `balance.sound`.
- `src/core/sound.ts` (czyste): `SoundPrefs`, `DEFAULT_SOUND_PREFS = { effects: true, music: false }`,
  `parseSoundPrefs`, `soundOutcome`, `trimFrameCount`, `cueDelayMs`, oraz reguły cue `roundCues`, `panelCue`, `dragCue`.
- `BootScene` ładuje 12 efektów (muzyki NIE), przycina bufory do manifestu, zapisuje `REGISTRY_KEYS.soundHealth`;
  `cutLoad` neutralizuje też `onProcessError`; `QUIET_REJECTIONS` zna `EncodingError` i `NotSupportedError`.
- `src/ui/sound.ts` `SoundService` w `REGISTRY_KEYS.sound`: `play(id)` z wynikiem `played | off | locked | missing`
  i ograniczonym logiem; muzyka ładowana leniwie przez loader `UIScene`, zapętlona, tylko gdy `prefs.music`.
- `src/storage/soundPrefs.ts`: odczyt/zapis klucza `martynka:sound` w `localStorage` (try/catch, domyślne przy błędzie).
- Sceny grają cue w miejscach z tabeli; czytanie „Nowa umiejętność!” i „Pokój gotowy!” rusza po zagranym cue.
- Panel ustawień: sekcja „Dźwięki” (efekty, muzyka; Wł./Wył.; linia o brakujących dźwiękach), luka 114; luka 35 zamknięta.
- Hak e2e (tylko build haka) czyta `sound: { prefs, locked, log, missing, music }`.
- Spec `tests/e2e/final-sound.spec.ts` (#11, #14, #16) i `tests/e2e/final-sound-failure.spec.ts` (#15) + seed (#8) zielone.
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty; `deploy/`, `designs/`, `.gitignore`, `.claude/` nietknięte.

### Key Discoveries:

- Brak powrotu do drugiego URL-a w Phaserze → kolejność `[m4a, ogg]`: AAC dekoduje Safari (każdy iPadOS), Chrome i
  Android; OGG zostaje dla przeglądarek bez AAC (np. Firefox/Chromium bez kodeków własnościowych).
- `game.sound.play(key, config)` dodaje dźwięk i niszczy go po końcu (`BaseSoundManager.play`) — bez wycieku przy
  każdym cue; zawsze za strażnikiem `cache.audio.exists(key)` (brakujący klucz rzuca).
- WebAudio nie ma kolejki „graj po odblokowaniu”: `play()` przy zablokowanym kontekście zagrałby z opóźnieniem po
  odblokowaniu, więc efekt przy `sound.locked` jest pomijany (wynik `locked`).
- Wpis cache audio to zwykły `AudioBuffer`: przycięcie = podmiana wpisu kopią `createBuffer` + `copyToChannel` przed
  pierwszym `play` (publiczne `cache.audio`), jak `audio-player.js` (wyrównanie AAC do długości z manifestu).
- `LoaderPlugin.start()` działa poza `preload`, więc muzykę ładuje loader `UIScene` dopiero po włączeniu; Phaser daje
  każdemu plikowi `timeout` 0, więc limit trzeba skopiować na plik (jak `BootScene`).
- **Lekcja dwóch poprzednich runów**: mechanizm na wnętrzu Phasera (loader, dekodowanie audio, odblokowanie) ma tu
  nazwany dowód w przeglądarce (faza 9: efekty dekodują się i są żądane w zdarzeniach, muzyka ładuje się leniwie; faza 10:
  uszkodzony/wiszący plik dźwięku nie zatrzymuje gry, seed: pliki z service workera). Testy jednostkowe liczb
  (`balance.sound`, `trimFrameCount`) **nie są** tym dowodem.

## What We're NOT Doing

- Zmiana formatu zapisu, `Settings`, eksportu/importu; reset i import nie ruszają ustawienia dźwięku.
- Precache jednego formatu na platformę (statyczny manifest nie może się różnić per urządzenie) i ponowne kodowanie
  `music-loop` (bajty autorki; muzyka poza kolejką startu) — follow-up z triggerem.
- Nakładka 40 ms na pętli muzyki (Phaser zapętla przez kolejne źródło), ściszanie muzyki pod mową (narrator nie ma stanu
  „mówi”) — follow-upy.
- Przycisk wyciszenia dla dziecka w HUD (kit go nie ma; rodzic decyduje w panelu), wykrywanie przełącznika ciszy iPada /
  `navigator.audioSession`.
- `tap` na kafelkach odpowiedzi, klawiszach klawiatury, kafelkach `select`, „OK” planszy (mają własne cue odpowiedzi).
- Szew e2e dla dźwięku (`?e2eSound`): spec psuje pliki przez `page.route`, nowy marker nie jest potrzebny.
- Luka VO3 (obrys przytrzymania) — przeniesiona do follow-upów z nowym triggerem.
- Nic w `deploy/`, `designs/`, `.gitignore`, `.claude/`; `package.json` bez nowych zależności (tylko skrypt `sounds`).

## Implementation Approach

Najpierw czysta logika test-first: preferencje, wynik odtworzenia, przycięcie i opóźnienie (faza 1), reguły cue dla
zdarzeń rundy, panelu i przeciągania (faza 2), cicha granica błędów i cięcie dekodującego audio (faza 3). Potem pliki i
tabela (faza 4), ładowanie efektów, usługa dźwięku, magazyn preferencji i odczyt w haku (faza 5), podpięcie cue w
scenach (faza 6), sekcja panelu i muzyka (faza 7), dokumentacja (faza 8). Na końcu dwa e2e: zdarzenia i przełączniki
(faza 9, ryzyka #11, #14, #16) oraz awarie i offline (faza 10, ryzyka #15, #8). Każda faza zostawia pełną bramkę zieloną
i istniejące e2e bez zmian liczby porażek.

## Critical Implementation Details

- **Kolejność w `BootScene.create`**: przycięcie buforów i `soundHealth` PRZED oddaniem sceny (`delayedCall(0)`), żeby
  żaden `play` nie trafił na nieprzycięty bufor. Przycięcie każdego klucza w osobnym `try` (błąd → klucz liczony jako
  brakujący, `console.warn`, bez przerwania startu).
- **`cutLoad` a audio**: dla każdego pliku z `queue` podmienić `onProcessError` na no-op RAZEM z `onProcessComplete`,
  przed `fileProcessComplete` (późny callback `decodeAudioData` woła jedno z dwóch). Plik audio w `inflight` jest cięty jak
  każdy XHR (bez zmian).
- **Odblokowanie**: efekt przy `manager.locked` → wynik `locked`, nic nie gra. Muzyka włączona przy zablokowanym
  kontekście czeka na zdarzenie `unlocked` menedżera (jedno `once`), potem rusza.
- **Mowa po cue**: `skill-unlock` (1,4 s) i `room-done` (2,3 s) — czytanie (`autoReadUnlock`, mowa w `RoomScene.showCard`)
  rusza po `cueDelayMs(outcome, durationS)`: czas cue + `balance.sound.speechGapMs`, gdy cue zagrało; 0 w każdym innym
  wypadku. Timer na zegarze sceny, usuwany przy wyjściu ze sceny. Efekty nigdy nie wołają `narrator.cancel()`.
- **Gwiazdka po odpowiedzi**: dobra odpowiedź z gwiazdką daje dwa cue — `answer-right` od razu, `star` po
  `balance.sound.starDelayMs`; `roundCues` zwraca listę `{ id, delayMs }`, scena tylko planuje.

## Phase 1: Preferencje, wynik odtworzenia, przycięcie i opóźnienie (czysta logika)

Driver: tdd
Driver why: domyślne i parsowanie preferencji, decyzja `played/off/locked/missing`, liczba ramek przycięcia i opóźnienie mowy to czysta logika `core` bez implementacji — failing testy na granicach ją prowadzą.

### Overview

Rdzeń bez widocznych zmian: reguły, dane i liczby, które użyją fazy 5–7.

### Changes Required:

#### 1. Reguły

**File**: `src/core/sound.ts` (nowy); `tests/sound.test.ts` (nowy)

**Intent**: Wszystkie decyzje o dźwięku poza Phaserem, żeby usługa i sceny tylko wykonywały.

**Contract**: `export type SoundId = 'answer-right' | … | 'minigame-done' | 'music-loop'` (13 id z manifestu);
`export interface SoundPrefs { effects: boolean; music: boolean }`; `DEFAULT_SOUND_PREFS = { effects: true, music: false }`;
`parseSoundPrefs(raw: unknown): SoundPrefs` — przyjmuje string JSON albo obiekt; każde pole nie-boolean → domyślne tego
pola; śmieci/`null`/wyjątek parsowania → `DEFAULT_SOUND_PREFS`; `export type SoundOutcome = 'played' | 'off' | 'locked' |
'missing'`; `soundOutcome(kind: 'effect' | 'music', prefs, { locked, exists }): SoundOutcome` — kolejność: wyłączone →
`off`, brak w cache → `missing`, zablokowany → `locked`, inaczej `played`; `trimFrameCount(durationS, sampleRate,
available): number` = `min(round(durationS × sampleRate), available)`, `available` gdy `durationS` nieskończone/≤ 0;
`cueDelayMs(outcome, durationS, gapMs): number` = `round(durationS × 1000) + gapMs` tylko dla `played`, inaczej 0.
Testy: każda gałąź `soundOutcome` (w tym `off` wygrywa z `missing`), granice `trimFrameCount` (krótszy bufor, 48 kHz
kontekstu), `parseSoundPrefs` na `'{"effects":false}'`, `'{'`, `42`, `{ music: 'yes' }`.

#### 2. Dane i liczby

**File**: `src/data/sounds.ts` (nowy); `src/data/balance.ts` (`sound`); `tests/sound.test.ts`

**Intent**: Tabela 13 dźwięków jako jedno źródło (id, klucz, URL-e, długość, czy w kolejce startu) i liczby głośności z
`audio-player.js` paczki.

**Contract**: `export interface SoundDef { id: SoundId; key: string; urls: readonly [string, string]; durationS: number;
boot: boolean }`; `SOUNDS` — `key = 'sounds/<id>'`, `urls = ['assets/sounds/m4a/<id>.m4a', 'assets/sounds/ogg/<id>.ogg']`,
`durationS` z manifestu, `boot` = `id !== 'music-loop'`; `balance.sound = { masterVolume: 0.55, effectVolume: 0.65,
musicVolume: 0.14, starDelayMs: 250, speechGapMs: 150, musicLoadTimeoutMs: 30000, logSize: 50 }` z komentarzem (746 KB
M4A przy 50 KB/s ≈ 15 s). Testy: 13 wpisów, unikalne id, 12 `boot`, kolejność URL-i `[m4a, ogg]`, `durationS > 0`,
`musicLoadTimeoutMs > 746014 / 50000 × 1000`.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: w `soundOutcome` sprawdzenie `locked` przed `off` → test „off wins over locked” czerwony; `boot` dla `music-loop` → test „12 boot sounds” czerwony; przywrócone; meta-check: testy chronią reguły i dane, NIE dowodzą, że Phaser dekoduje albo gra (faza 9)
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] `src/core/sound.ts` bez Phasera i globali przeglądarki; `src/data/sounds.ts` importuje z `core` tylko typy; liczby tylko w `balance.ts`

---

## Phase 2: Reguły cue dla rundy, panelu i przeciągania (czysta logika)

Driver: tdd
Driver why: które zdarzenie daje który dźwięk to czysta funkcja przejścia stanu (`RoundState`, `PanelState`, stan przeciągania) — failing testy na przejściach ją prowadzą, zanim sceny ją wywołają.

### Overview

Klasyfikacja zdarzeń z tabeli research w `core`, żeby sceny tylko wołały `sound.play`.

### Changes Required:

#### 1. Runda

**File**: `src/core/sound.ts` (`roundCues`); `tests/soundCues.test.ts` (nowy)

**Intent**: Jedno przejście stanu rundy → uporządkowana lista cue z opóźnieniami.

**Contract**: `roundCues(before: RoundState, after: RoundState, kind: RoundKind, starDelayMs: number): readonly
{ id: SoundId; delayMs: number }[]`. Reguły: faza `first|second|retype` → `done` → `answer-right` (0); gdy
w TYM przejściu (wejście w `done`) `after.starsEarned > before.starsEarned` dodatkowo `star` (`starDelayMs`) — wzrost
`starsEarned` o premię przy `next` kończącym rundę NIE daje `star`; `first` → `second` → `answer-retry`;
`second` → `solution` → nic; `!before.finished && after.finished` → `round-bonus` gdy `kind === 'round'` i
`after.bonusEarned > 0` (pole `RoundState.bonusEarned`, `src/core/round.ts` `next`; warianty mają `cleanRoundBonus` 0),
`minigame-done` gdy `kind !== 'round'`; brak zmiany → `[]`. Testy budują stany przez publiczne `startRound`/`answer`/
`nextSolutionStep`/`next` z `src/core/round.ts` (w `round.ts` nie ma `advance`; bez ręcznych literałów faz tam, gdzie
się da), w tym test „the bonus at the round end plays round-bonus, not star”: pierwsza dobra, druga dobra, retype (bez gwiazdki → tylko `answer-right`), dwa błędy, koniec rundy z premią i
bez, koniec wariantu.

#### 2. Panel i przeciąganie

**File**: `src/core/sound.ts` (`panelCue`, `dragCue`); `tests/soundCues.test.ts`

**Intent**: Pokój i plansze bez decyzji w scenach.

**Contract**: `panelCue(before: PanelState, step: { panel: PanelState; bought: … | null; changed: … | null },
event: PanelEvent): SoundId | null` (typy z `src/core/variantPanel.ts` `stepPanel`): `closed` → `open` → `panel-open`;
zdarzenie `pick` (podgląd wariantu) → `variant-pick`; zakup (`bought`) albo zmiana (`changed`) → `purchase` (FR-017:
każde „Wybieram” ma dźwięk); zamknięcie → nic. `dragCue(before: { carrying: unknown | null }, after: { carrying: unknown |
null }, mode: 'blocks' | 'coins' | 'clock'): SoundId | null` → `coin` gdy `carrying` przeszło z obiektu w `null` ORAZ
suma `mat` wzrosła (odłożenie na planszę; anulowanie albo powrót do tacy też zeruje `carrying` — `idle` w
`src/core/trayDrag.ts` — i nie gra nic), a `mode` to `blocks` albo `coins`; zegar → nic. Kontrakt więc:
`dragCue(before: { carrying; mat }, after: { carrying; mat }, mode)` (kształt `TrayDragState`). Testy na wszystkich gałęziach, w tym zmiana w trybie `change` bez kosztu.

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: `roundCues` zwraca `answer-retry` także dla `second` → `solution` → test „no cue for the solution” czerwony; `panelCue` bez gałęzi `changed` → test „free change plays purchase” czerwony; przywrócone; meta-check: testy budują stan przez publiczne reduktory, więc chronią zgodność z prawdziwymi przejściami, nie z literałami
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Każdy z 12 efektów ma w `core` regułę albo nazwane miejsce w fazie 6 (`tap`, `skill-unlock`, `room-done`); brak `music-loop` w regułach cue

---

## Phase 3: Dźwięk nie zatrzymuje gry — cicha granica błędów i cięcie dekodującego audio

Driver: tdd
Driver why: `isFatalSignal` to czysta reguła, a no-op `onProcessError` w `cutLoad` da się poprowadzić failing testem na atrapie loadera (`vi.mock('phaser')`) — oba bez przeglądarki; dowód w przeglądarce w fazie 10.

### Overview

Zamyka follow-up `audio.noAudio`: odrzucenie dekodowania nie jest fatalne, a późny callback dekodowania uciętego pliku
nie kończy loadera drugi raz.

### Changes Required:

#### 1. Granica błędów

**File**: `src/core/errorSignal.ts` (`QUIET_REJECTIONS`); `src/ui/dom/errorBoundary.ts` (`signalOfRejection`);
`tests/errorSignal.test.ts`

**Intent**: Nieobsłużone `EncodingError` (porzucona obietnica `decodeAudioData`) i `NotSupportedError` są szumem, nie
awarią gry; nazwa `DOMException` jest czytana także tam, gdzie `DOMException` nie dziedziczy po `Error` (stary WebKit).

**Contract**: `QUIET_REJECTIONS = {AbortError, NotAllowedError, EncodingError, NotSupportedError}` z komentarzem (decode
audio w Phaserze, follow-up `audio.noAudio`); `signalOfRejection`: `name` z `reason.name`, gdy `reason instanceof Error`
albo `reason instanceof DOMException` (bez zmiany `hasError` dla innych obiektów). Testy: odrzucenie z nazwą
`EncodingError`/`NotSupportedError` → nie fatalne; `TypeError` nadal fatalny; zdarzenie `error` (nie odrzucenie) z
`EncodingError` nadal fatalne (zakres tylko odrzuceń).

#### 2. `cutLoad` i dekodowanie audio

**File**: `src/scenes/loaderCut.ts` (`cutLoad`); `tests/loaderCut.test.ts` (nowy); `tests/phaserLoaderPin.test.ts`

**Intent**: Plik w `queue` (dekodowanie audio, obrazek, font) dostaje no-op zarówno `onProcessComplete`, jak i
`onProcessError` przed `fileProcessComplete`; tripwire tekstu źródła Phasera dla ścieżki, na której to polega.

**Contract**: test jednostkowy z `vi.mock('phaser', () => ({ Loader: { FILE_ERRORED: 16 } }))` (wartość z
`node_modules/phaser/src/loader/const.js`; `loaderCut.ts` importuje z Phasera tylko `Loader`, więc fabryka wystarcza —
prawdziwy Phaser nie jest ładowany w node) oraz `vi.stubGlobal('HTMLImageElement', class {})` (vitest działa w
środowisku `node`; bez tego `file.data instanceof HTMLImageElement` w pętli `queue` rzuca `ReferenceError` i test
byłby czerwony błędem, nie asercją), i atrapą
loadera (`isLoading`, `list`, `inflight`, `queue` jako `Set`, `fileProcessComplete`, `nextFile` jako szpiedzy): po
`cutLoad` wywołanie `file.onProcessError()` i `file.onProcessComplete()` pliku z `queue` nie woła `fileProcessComplete`
ponownie (licznik = 1); klucze zwrócone. Pin w `tests/phaserLoaderPin.test.ts`: tekst
`node_modules/phaser/src/loader/filetypes/AudioFile.js` zawiera `decodeAudioData` oraz wywołania `onProcessComplete` i
`onProcessError` w `onProcess`; `loader/File.js` `onProcessError` woła `fileProcessComplete` (komunikat: „re-verify
`cutLoad` for audio, then update the pin”).

### Success Criteria:

#### Automated Verification:

- Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- Deliberate break: usunięcie `EncodingError` z `QUIET_REJECTIONS` → test czerwony; `cutLoad` bez podmiany `onProcessError` → test „late decode error does not finish the load twice” czerwony; przywrócone; meta-check: atrapa dowodzi tylko, że `cutLoad` odcina oba callbacki — że Phaser naprawdę woła je z `decodeAudioData`, pilnuje pin tekstu źródła, a brak karty w przeglądarce dowodzi faza 10
- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual Verification:

- [reviewer] Lista cichych nazw rozszerzona tylko o dwie nazwy audio; zdarzenia `error` bez zmian; `loaderCut.ts` nadal jedynym miejscem dotykającym wnętrza loadera

---

## Phase 4: Pliki dźwięku w `public/assets/sounds` i tabela równa plikom

Driver: impl
Driver why: kopiowanie plików paczki skryptem i test równości tabeli z dyskiem — brak logiki do poprowadzenia testem.

### Overview

26 plików (OGG + M4A) w repozytorium (zgoda autorki 2026-10-13), skrypt powtarzalny, precache obejmuje je przez
istniejące globy.

### Changes Required:

#### 1. Skrypt i pliki

**File**: `scripts/copy-sounds.mjs` (nowy); `package.json` (`"sounds": "node scripts/copy-sounds.mjs"`);
`public/assets/sounds/m4a/*.m4a`, `public/assets/sounds/ogg/*.ogg` (nowe)

**Intent**: Kopia bajt w bajt `designs/martynka-salon-v2/audio/{m4a,ogg}` dla id z manifestu (bez `wav`, bez `qa`);
skrypt kończy się kodem 1, gdy paczki brak albo id manifestu nie ma pliku; nic z `designs/` nie trafia do commita.

**Contract**: wynik `npm run sounds` deterministyczny (drugi przebieg bez różnic w `git status`).

#### 2. Test tabela ⇔ pliki i komentarz loadera

**File**: `tests/soundFiles.test.ts` (nowy); `src/data/balance.ts` (komentarz `loader`)

**Intent**: Każdy URL z `SOUNDS` istnieje w `public/`, każdy plik w `public/assets/sounds` ma wpis; komentarz
`balance.loader` z rzeczywistymi bajtami startu (12 efektów: M4A 132 243 B, OGG 81 144 B; muzyka poza kolejką).

**Contract**: test czyta katalog i porównuje zbiory (wzór: test tabeli `TASK_ART`).

### Success Criteria:

#### Automated Verification:

- `npm run sounds` dwa razy z rzędu → `git status --porcelain public/assets/sounds` po drugim przebiegu bez zmian; 26 plików
- Deliberate break: usunięcie jednego `.ogg` → `tests/soundFiles.test.ts` czerwony; przywrócone; meta-check: test porównuje tabelę z dyskiem, nie dowodzi, że plik jest poprawnym audio (faza 9: `missing` puste)
- Pełna bramka lokalna zielona; po `npm run build` `dist/sw.js` wymienia `assets/sounds/m4a/star.m4a` i `assets/sounds/ogg/star.ogg` (`grep -c`)

#### Manual Verification:

- [reviewer] Żaden plik z `designs/` ani `audio/wav` w commicie; rozmiary plików równe paczce

---

## Phase 5: Ładowanie efektów, usługa dźwięku, magazyn preferencji i odczyt w haku

Driver: impl
Driver why: kolejka loadera, przycięcie buforów w cache Phasera i usługa nad `game.sound` to kod na wnętrzu silnika bez czystej logiki (ta jest w fazie 1); dowód zachowania w przeglądarce w fazach 9–10.

### Overview

Efekty wczytują się na starcie i da się je zagrać; żadne zdarzenie jeszcze ich nie woła (faza 6). Muzyka jeszcze nie
istnieje (faza 7).

### Changes Required:

#### 1. `BootScene`

**File**: `src/scenes/BootScene.ts` (`preload`, `create`); `src/data/layout.ts` (`REGISTRY_KEYS.soundHealth`, `sound`,
`soundPrefs` — „runtime only, not in SAVE_KEYS”)

**Intent**: W `preload` `this.load.audio(def.key, [...def.urls])` dla `SOUNDS` z `boot` (limit na plik i limit łączny
obejmują je same, ta sama kolejka); `loaderror` loguje `Sound failed to load: <key>` dla typu `audio`. W `create` (przed
oddaniem sceny) przycięcie każdego wczytanego bufora do `trimFrameCount(def.durationS, buffer.sampleRate, buffer.length)`
przez kopię w `cache.audio` (każdy kanał), potem `soundHealth = artHealth(...)` z `cache.audio.exists` i jedno
`console.warn` z brakującymi.

**Contract**: `REGISTRY_KEYS.soundHealth: ArtHealth` (ten sam kształt co `artHealth`); przy `NoAudioSoundManager`
(brak Web Audio) wszystkie efekty są `missing`, start bez błędu.

#### 2. Usługa dźwięku

**File**: `src/ui/sound.ts` (nowy)

**Intent**: Jedno miejsce grania: `play(id)` liczy `soundOutcome('effect', prefs, { locked: manager.locked, exists:
cache.audio.exists(key) })`, przy `played` woła `manager.play(key, { volume: masterVolume × effectVolume })` w `try`
(wyjątek → wynik `missing`, `console.warn`), dopisuje `{ id, outcome }` do logu o długości `balance.sound.logSize`;
`setPrefs(prefs)`; `status()` dla haka.

**Contract**: `export interface SoundService { play(id: SoundId): SoundOutcome; setPrefs(p: SoundPrefs): void; prefs():
SoundPrefs; status(): SoundStatus }`; `SoundStatus = { prefs; locked: boolean; log: readonly { id; outcome }[]; missing:
readonly string[]; music: 'off' | 'loading' | 'playing' | 'missing' }` (`music` stale `'off'` do fazy 7);
`createSoundService(game: Game, prefs: SoundPrefs)`. Bez wołania `narrator.cancel()`.

#### 3. Magazyn preferencji i `main.ts`

**File**: `src/storage/soundPrefs.ts` (nowy); `tests/soundPrefsStore.test.ts` (nowy); `src/main.ts` (`start`)

**Intent**: Preferencja urządzenia poza zapisem: odczyt synchroniczny przed `createGame`, zapis po decyzji rodzica;
każdy błąd `localStorage` (prywatne okno, quota, brak) → domyślne / ciche `console.warn`, gra startuje.

**Contract**: `SOUND_PREFS_KEY = 'martynka:sound'`; `createSoundPrefStore(storage: Pick<Storage, 'getItem' | 'setItem'> |
undefined): { read(): SoundPrefs; write(p: SoundPrefs): boolean }` (`read` przez `parseSoundPrefs`); w `main.ts` po
`createGame`: `registry.set(REGISTRY_KEYS.soundPrefs, prefs)` i `registry.set(REGISTRY_KEYS.sound,
createSoundService(game, prefs))`. Testy na atrapie `Storage`: brak klucza → domyślne; `getItem` rzuca → domyślne;
`setItem` rzuca → `false`; zapis + odczyt → te same wartości.

#### 4. Hak e2e

**File**: `src/testing/e2eHook.ts` (migawka: `sound`); `tests/e2e/support/hook.ts` (typ `Snapshot.sound`)

**Intent**: Spec czyta stan dźwięku tylko do odczytu, także na ekranie powitania.

**Contract**: `snapshot.sound = registry SoundService?.status() ?? null`.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N` (magazyn preferencji); `npm run build` drukuje `e2e hook: absent (`
- Deliberate break: `read` bez `try` wokół `getItem` → test „getItem throws → defaults” czerwony; przywrócone; meta-check: chroni tylko magazyn — że efekty dekodują się w Phaserze, dowodzi `snapshot.sound.missing === []` w fazie 9
- e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0` (12 nowych plików w kolejce startu nie psuje istniejących specy, w tym `salon-load-health` i `load-and-tab-guard`)
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty

#### Manual Verification:

- [reviewer] `cache.audio.exists` przed każdym `play`; przycięcie przed `delayedCall(0)`; `localStorage` tylko w `src/storage/soundPrefs.ts`; nowe klucze rejestru poza `SAVE_KEYS`

---

## Phase 6: Cue w zdarzeniach gry i mowa po cue

Driver: impl
Driver why: wywołania `sound.play` z reguł fazy 2 w istniejących metodach scen — brak nowej logiki; dowód „żądane we właściwym zdarzeniu” to log haka w e2e fazy 9.

### Overview

Dziecko słyszy efekty P1 w zdarzeniach z tabeli; czytanie kart nie nakłada się na ich dźwięk.

### Changes Required:

#### 1. Zadania

**File**: `src/scenes/TaskScene.ts` (`submit`, `advance`, `feedDrag`, `startNextRound`, `autoReadUnlock`)

**Intent**: Po każdym przejściu stanu rundy `roundCues(before, after, kind, starDelayMs)` → `play` (z `delayMs` na
zegarze sceny); `feedDrag` → `dragCue` dla bieżącego trybu (`dragMode`); `skill-unlock` przy pokazaniu „Nowa
umiejętność!” w `startNextRound` (nie w `render`, który biegnie też przy powrocie), a `autoReadUnlock` rusza po
`cueDelayMs(outcome, durationS, speechGapMs)`. Cue z `syncStars`/`flyStar` nie powstają (gwiazdka idzie z `roundCues`,
niezależnie od `prefersReducedMotion`).

**Contract**: sceny nie zawierają id ani liczb poza odczytem `SOUNDS`/`balance.sound`; usługa z
`REGISTRY_KEYS.sound` (brak usługi → nic, bez wyjątku).

#### 2. Pokój

**File**: `src/scenes/RoomScene.ts` (`dispatch`, `showCard`, `playPurchaseSound` usunięta/zastąpiona)

**Intent**: `dispatch` po `stepPanel` → `panelCue`; `showCard` (raz, `cardDrawn`) → `room-done`, a mowa karty po
`cueDelayMs`. Luka 35 zamknięta (komentarz DESIGN-GAP usunięty, wiersz w `docs/design-gaps.md` oznaczony jako zamknięty
przez S-16b).

**Contract**: `purchase` dla kupna i dla darmowej zmiany (FR-017); nic przy zamknięciu panelu.

#### 3. `tap`

**File**: `src/scenes/TaskScene.ts`, `src/scenes/RoomScene.ts`, `src/scenes/UIScene.ts` (handlery przycisków
nawigacji)

**Intent**: `tap` tylko w handlerach przycisków nawigacji/akcji (`ActionButton`/`PageButton`: „Dalej”, „Kolejna runda”,
„Do pokoju”, „Zamknij”, „Zmień wygląd”/„Gotowe”, „Wybieram” NIE — ma `purchase`); widgety nie znają usługi.

**Contract**: lista handlerów z `tap` w komentarzu nad `SoundService.play` albo w opisie commita; żadnego `tap` na
kafelkach, klawiszach, `select`, „OK”, głośniku, kole zębatym.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- Deliberate break: patch `e2e-break-p9a.patch` (bez `play` w `TaskScene.submit`) przygotowany w katalogu zmiany dla fazy 9; meta-check w handoffie: ta faza nie ma własnego czerwonego testu, dowód w e2e fazy 9

#### Manual Verification:

- [reviewer] Każde wywołanie `play` w scenie pochodzi z reguły `core` albo z nazwanego miejsca (`tap`, `skill-unlock`, `room-done`); żadne nie woła `narrator.cancel()`; luka 35 zamknięta w `docs/design-gaps.md`

---

## Phase 7: Sekcja „Dźwięki” w panelu rodzica i muzyka

Driver: impl
Driver why: sekcja DOM wg istniejącego wzorca Wł./Wył. i leniwe ładowanie muzyki przez loader `UIScene` (wnętrze Phasera) — dowód w przeglądarce w fazie 9.

### Overview

Rodzic włącza/wyłącza efekty i muzykę („Zatwierdź” stosuje, „Anuluj” odrzuca); wybór przetrwa ponowne uruchomienie;
muzyka ładuje się dopiero po włączeniu.

### Changes Required:

#### 1. Teksty i luka

**File**: `src/data/pl.ts` (`settings.soundHeading`, `effectsHeading`, `musicHeading`, `soundMissing(n)`); `docs/design-gaps.md`
(wiersz 114)

**Intent**: Nagłówek „Dźwięki”, dwie grupy „Efekty dźwiękowe” i „Muzyka” z istniejącymi etykietami
`pl.settings.autoReadOn/Off` („Włączone”/„Wyłączone”), wyciszona linia „Nie wczytało się N dźwięków …” z odmianą
liczebnika (`src/core/text/plural.ts`), widoczna tylko przy brakach.

**Contract**: `pl.settings.soundMissing(n: number): string` (1 dźwięk / 2 dźwięki / 5 dźwięków); wiersz 114: „The kit has
no sound settings” → „A ‘Dźwięki’ section after reading aloud: two On/Off groups in the reading pattern, a muted line when
sounds failed to load; applied by ‘Zatwierdź’”.

#### 2. Panel i zastosowanie

**File**: `src/ui/dom/settingsPanel.ts` (`SettingsPanelOptions.sound`, `onConfirm` z `sound`); `src/scenes/UIScene.ts`
(`openSettings`, `applySettings`); `tests/dialogSessions.test.ts` (jeśli `DIALOG_CALLBACKS` wymaga)

**Intent**: Grupy budowane jak czytanie (`aria-pressed`, `role=group`); `applySettings` zapisuje
`REGISTRY_KEYS.soundPrefs`, woła `SoundService.setPrefs` i `createSoundPrefStore(window.localStorage).write` (błąd zapisu
tylko `console.warn`; ustawienie działa w sesji).

**Contract**: `sound: { prefs: SoundPrefs; missing: number }` w opcjach; `onConfirm(result: { stage; autoRead; sound:
SoundPrefs })`; ta sama sesja wejścia (`openInputSession`) co dziś.

#### 3. Muzyka

**File**: `src/ui/sound.ts` (`attachLoader`, muzyka w `setPrefs`); `src/scenes/UIScene.ts` (`create`: `attachLoader(this.load)`)

**Intent**: Gdy `prefs.music` i jest loader: jeśli brak w cache — `load.audio(music.key, urls)` z
`xhrSettings.timeout = musicLoadTimeoutMs` i `load.start()` (`music: 'loading'`); po wczytaniu przycięcie (jak w fazie 5),
potem — jeśli nadal włączona — `manager.add(key, { loop: true, volume: masterVolume × musicVolume })` i `play` po
odblokowaniu (`once('unlocked')` gdy `locked`); błąd ładowania → `music: 'missing'`, log. Wynik rozstrzyga
zdarzenie `complete` loadera + `cache.audio.exists(key)`, NIE `loaderror`: błąd dekodowania (`File.onProcessError` →
`fileProcessComplete`) nie emituje `FILE_LOAD_ERROR` w Phaserze 4.2.1 (emituje go tylko `nextFile` przy błędzie
pobrania). To samo w `BootScene`: braki efektów liczy `soundHealth` z cache, `loaderror` loguje tylko pobranie.
`attachLoader` sam rusza ładowanie, gdy `prefs.music` jest już `true` (odczyt z `localStorage` po ponownym
uruchomieniu); `UIScene` uruchamia `TaskScene.create` raz (`scene.launch`), `scene.switch` do pokoju usypia tylko
`TaskScene`, więc loader `UIScene` żyje przez całą sesję (na ekranie powitania muzyki nie ma — rusza z ekranem zadań). Wyłączenie → `stop` + `destroy`
dźwięku (bufor zostaje w cache). Grając muzyka trwa przez wszystkie sceny (usługa w rejestrze gry).

**Contract**: `SoundService.attachLoader(load: Loader.LoaderPlugin): void`; `status().music` zgodnie z opisem; drugi
`setPrefs` z `music: true` w trakcie ładowania nie kolejkuje drugiego pliku.

### Success Criteria:

#### Automated Verification:

- Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0` (w tym `parent-settings.spec.ts` z nową sekcją)
- Deliberate break: patche `e2e-break-p9b.patch` (`applySettings` bez `setPrefs`) i `e2e-break-p9c.patch` (muzyka w kolejce `BootScene`) przygotowane dla fazy 9; meta-check w handoffie
- `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty

#### Manual Verification:

- [visual] Panel ustawień 1440 i 1024: sekcja „Dźwięki” czytelna, wzór grup jak czytanie, przyciski ≥ 96 px w scenie, linia braków ukryta przy zdrowym starcie
- [reviewer] Teksty tylko w `pl.ts`; DESIGN-GAP 114 w `pl.ts`, `design-gaps.md` i komentarzu panelu; `localStorage` tylko przez `src/storage/soundPrefs.ts`

---

## Phase 8: Dokumentacja i follow-upy

Driver: impl
Driver why: zmiany tylko w tekstach (`CLAUDE.md`, follow-upy, lista kontrolna) — brak logiki do testu.

### Overview

Zdanie w `CLAUDE.md`, follow-upy z triggerami, wpisy listy kontrolnej człowieka.

### Changes Required:

#### 1. `CLAUDE.md`

**File**: `CLAUDE.md` („Current state”; także poprawka „v2 since S-15” → v3, zauważona w `change.md`)

**Intent**: Jedno zdanie: `src/data/sounds.ts` + `npm run sounds` (`public/assets/sounds/{m4a,ogg}`, kolejność
`[m4a, ogg]`), `src/core/sound.ts` (prefs, `soundOutcome`, cue), `src/ui/sound.ts` `SoundService` (`REGISTRY_KEYS.sound`,
`soundHealth`, `soundPrefs`), `src/storage/soundPrefs.ts` (`localStorage` `martynka:sound`, poza zapisem), efekty przy
starcie / muzyka leniwie, `QUIET_REJECTIONS` z nazwami audio, `cutLoad` z `onProcessError`, luka 114, 35 zamknięta.

#### 2. Follow-upy i lista kontrolna

**File**: `context/changes/final-sound/follow-ups/review-fixes.md` (nowy); `docs/human-checklist.md`

**Intent**: Wpisy z `Trigger:`: VO3 (trigger „designer brief delivers a hold view, or S-17 polish”); nakładka pętli
muzyki (trigger „a click heard at the loop point on the tablet”); ściszanie muzyki pod mową (trigger „a parent report that
music covers the reading”); precache jednego formatu / ponowne kodowanie muzyki (trigger „precache weight becomes a
problem on the tablet, or S-17”); `tap` na kafelkach odpowiedzi (trigger „S-17 playtest”); przełącznik ciszy iPada
(trigger „the maintainer wants sound to follow or ignore the silent switch”); WebKit w Playwright dla dźwięku (trigger „a
WebKit project in playwright.config.ts”). Lista kontrolna: wiersze `[human]` z tego planu.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; deliberate break: ścieżka w `CLAUDE.md` na nieistniejący plik → FAIL; przywrócone
- Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:` (`grep -c` wpisów = `grep -c 'Trigger:'`); pełna bramka lokalna zielona

#### Manual Verification:

- [reviewer] Seam sweep: nazwy w `CLAUDE.md` istnieją w kodzie; brak zmian w `vite/config.shared.mjs`, `deploy/`

---

## Phase 9: Cue we właściwych zdarzeniach, przełączniki rodzica i leniwa muzyka — e2e (#11, #14, #16)

Driver: e2e
Driver why: ryzyka #11 (runda dotykiem: dobra odpowiedź, druga próba, premia), #16 (zakup „Wybieram”) i #14 (ustawienia rodzica działają od razu) dla dźwięku istnieją tylko w przeglądarce, a dekodowanie i leniwy loader to wnętrze Phasera; zbudowane w fazach 5–7.

### Overview

Nowy spec `tests/e2e/final-sound.spec.ts` w projekcie `chromium-hook` (`final-sound` dopisane do `ROUND_SPEC` w
`playwright.config.ts`). To jest **dowód przeglądarkowy** fazy 5 (12 efektów dekoduje się w Chromium: `missing` puste),
fazy 6 (cue żądane w zdarzeniach) i fazy 7 (przełączniki, trwałość, leniwa muzyka). Nie dowodzi słyszalności (lista
`[human]`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/final-sound.spec.ts` (nowy); `playwright.config.ts` (`ROUND_SPEC`); `tests/e2e/support/hook.ts`

**Intent**:
(a) „#11 S-16b a round by touch requests answer-right, star, answer-retry and round-bonus”: `?e2eVariant=off` +
`?e2eSkills=` (umiejętność z kafelkami, jak `task-round.spec.ts`), `passWelcome`; po starcie `sound.missing` = `[]`;
dobra odpowiedź → w logu `answer-right` i `star` z wynikiem `played` (pierwsze stuknięcie odblokowało kontekst; dopuszczalne
`locked` tylko dla cue sprzed pierwszego dotyku); zła → `answer-retry`; czysta runda → `round-bonus`; żaden wpis `music-loop`.
(b) „#16 S-16b opening the variant panel, a preview and Wybieram request panel-open, variant-pick and purchase”:
`?e2eStars=` (jak `room-purchase.spec.ts`), pokój, kolejność wpisów `panel-open`, `variant-pick`, `purchase`; „Pokój
gotowy!” nie jest tu wymagany.
(c) „#14 S-16b the parent turns effects off and music on; the choice survives a reload”: brama rodzica jak w
`parent-settings.spec.ts`, „Efekty dźwiękowe” → „Wyłączone”, „Muzyka” → „Włączone”, „Zatwierdź”; następna odpowiedź
loguje `off`; żądanie sieciowe `assets/sounds/*/music-loop.*` pojawia się dopiero po „Zatwierdź” (zero przed), potem
`sound.music` = `'playing'`; przeładowanie w TYM SAMYM kontekście → `sound.prefs` = `{ effects: false, music: true }` i żądanie `music-loop`
pojawia się bez otwierania panelu (`attachLoader` przy `prefs.music`);
nowy kontekst → domyślne. **Liczenie żądań**: `test.use({ serviceWorkers: 'block' })` w tym specu (build haka to build
produkcyjny, więc instalacja service workera pobrałaby `music-loop.*` z listy precache przed „Zatwierdź”, a `page.route`
nie widzi żądań obsłużonych przez SW) i nasłuch `page.on('request')` (poziom strony, nie kontekstu).

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; teksty po kluczach `pl` (dokładne napisy, także
„Wyłączone”/„Włączone” w obrębie grupy po `aria-labelledby`); stan z haka tylko do odczytu; nigdy IDB ani `localStorage`
z testu. **Chromium niedostępny w sesji agenta**: protokół request-file — `e2e-request-p9.md`, patche (kod produkcyjny):
`e2e-break-p9a.patch` (bez `play` w `TaskScene.submit` → (a) czerwony na `answer-right`), `e2e-break-p9b.patch`
(`applySettings` bez `setPrefs`/`write` → (c) czerwony na `off` albo po przeładowaniu), `e2e-break-p9c.patch` (muzyka w
kolejce `BootScene` → (c) czerwony na „zero żądań przed”), `e2e-break-p9d.patch` (`RoomScene.dispatch` bez `panelCue` →
(b) czerwony); `STATUS: BLOCKED — e2e needs orchestrator run (request file written)`; agent kończący commituje spec po
wyniku orkiestratora. Każdy oczekiwany czerwony test osobno (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/final-sound.spec.ts` zielone; pełne `npx playwright test --workers=4`: `<baseline gałęzi e2e> + N` (N = liczba testów specu)
- Deliberate break p9a (bez cue w `submit`) → (a) czerwony; przywrócone; meta-check: log haka zapisuje usługa przy każdym `play`, więc czerwony dowodzi braku żądania w zdarzeniu, nie braku dźwięku
- Deliberate break p9b (panel bez `setPrefs`/zapisu) → (c) czerwony
- Deliberate break p9c (muzyka w kolejce startu) → (c) czerwony na „zero żądań przed”; meta-check: dowodzi leniwości, nie słyszalności
- Deliberate break p9d (pokój bez `panelCue`) → (b) czerwony
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual Verification:

- [human] iPad, odsłuch (lista kontrolna): kontekst odblokowuje się na pierwszym dotyku (pierwsze cue po dotyku słychać), efekty i czytanie poleceń grają razem bez ucinania mowy, głośność efektów i muzyki rozsądna, pętla muzyki bez trzasku w miejscu zapętlenia, przełącznik ciszy — zanotować, co robi; decyzje produktowe do
odsłuchu autorki: `purchase` także przy darmowej zmianie wariantu (FR-018, decyzja 7), `answer-retry` tylko raz na
zadanie (decyzja 6), `tap` i `round-bonus` razem na ostatnim „Dalej”

---

## Phase 10: Uszkodzony albo wiszący dźwięk nie zatrzymuje gry, dźwięki offline — e2e (#15, #8)

Driver: e2e
Driver why: ryzyko #15 (karta błędu przez nieobsłużone odrzucenie dekodowania, start zablokowany wiszącym plikiem) i #8 (start offline z service workera) istnieją tylko w przeglądarce; zbudowane w fazach 3–5.

### Overview

Nowy spec `tests/e2e/final-sound-failure.spec.ts` (`chromium-hook`) i rozszerzenie seeda `tests/e2e/seed.spec.ts`
(projekt `chromium`, build produkcyjny).

### Changes Required:

#### 1. Spec awarii

**File**: `tests/e2e/final-sound-failure.spec.ts` (nowy); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) „#15 S-16b a sound file that is not audio is skipped without the restart card”: `test.use({ serviceWorkers: 'block' })`;
`page.route('**/assets/sounds/**/star.*', r => r.fulfill({ status: 200, body: 'not audio' }))`; `passWelcome`, jedna
dobra odpowiedź → `sound.missing` zawiera klucz `star`, log `star` = `missing`, `answer-right` = `played`; karta błędu
niewidoczna przez ~1 s po starcie i po odpowiedzi; gra dalej odpowiada.
(b) „#15 S-16b hanging sound downloads end at the total boot limit”: `serviceWorkers: 'block'` jak (a) i jak
`load-and-tab-guard.spec.ts` (inaczej `page.route` nie przechwyci żądań idących przez SW), `?e2eArt=stallall`, `page.route` trzyma wszystkie
`**/assets/sounds/**` bez odpowiedzi; powitanie w limicie testu; `bootLoad.cut` zawiera klucze `sounds/…`;
`sound.missing` = 12; brak karty błędu; `bootLoad.creates === 1`.

#### 2. Seed

**File**: `tests/e2e/seed.spec.ts`

**Intent**: Po przeładowaniu offline każdy plik dźwięku, który strona zażądała, przyszedł z service workera
(`response.fromServiceWorker()`); przy starcie strona (`page.on('request')`, nie kontekst — instalacja SW pobiera z
precache oba formaty i `music-loop`, a Playwright zgłasza te żądania tylko na kontekście) zażądała dokładnie 12 plików
`assets/sounds/` (jeden format na efekt), żadnego `music-loop`.

**Contract**: jak dotąd po `TASK_ART`: `expect.poll` na liście URL-i dźwięków spoza SW = `[]`; liczba żądanych = 12.
Patche: `e2e-break-p10a.patch` (`EncodingError` usunięte z `QUIET_REJECTIONS` → (a) czerwony: karta),
`e2e-break-p10b.patch` (`cutLoad` bez cięcia → (b) czerwony), `e2e-break-p10c.patch` (globy precache bez `m4a,ogg` w
`vite/config.shared.mjs` → seed czerwony); protokół request-file jak w fazie 9 (`e2e-request-p10.md`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/final-sound-failure.spec.ts tests/e2e/seed.spec.ts` zielone; pełne `--workers=4`: `<baseline gałęzi e2e> + N`
- Deliberate break p10a (bez `EncodingError` w cichych nazwach) → (a) czerwony na karcie błędu; przywrócone; meta-check: dowodzi, że w Chromium dekodowanie śmieci daje nieobsłużone odrzucenie `EncodingError` (inaczej break byłby zielony — wtedy zapisać w handoffie i zatrzymać się)
- Deliberate break p10b (`cutLoad` bez cięcia) → (b) czerwony; meta-check: pliki dźwięku naprawdę wiszą, tylko limit łączny kończy ładowanie
- Deliberate break p10c (precache bez audio) → seed czerwony
- `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual Verification:

- [human] iPad offline (tryb samolotowy po pierwszym uruchomieniu): dźwięki grają z cache (lista kontrolna)

---

## Testing Strategy

### Unit Tests:

- `soundOutcome`, `parseSoundPrefs`, `trimFrameCount`, `cueDelayMs`; dane `SOUNDS` i `balance.sound`.
- `roundCues` na stanach z prawdziwych reduktorów rundy, `panelCue`, `dragCue`.
- `isFatalSignal` z nazwami audio; `cutLoad` na atrapie loadera; pin tekstu `AudioFile.js`/`File.js`.
- Tabela ⇔ pliki; magazyn preferencji na atrapie `Storage`.

### Integration Tests:

- `npm run build` (precache zawiera dźwięki, strażnik haka); e2e faz 9–10 (sześć scenariuszy, siedem patchy łamiących);
  istniejące `salon-load-health`, `load-and-tab-guard`, `parent-settings`, `room-purchase` zielone w każdej fazie.

### Manual Testing Steps:

1. [visual] Sekcja „Dźwięki” w panelu (faza 7).
2. [human] iPad: odblokowanie na pierwszym dotyku, efekty z mową, głośność, pętla muzyki, przełącznik ciszy (faza 9).
3. [human] iPad offline: dźwięki z cache (faza 10).

## Performance Considerations

Start ładuje 12 efektów (M4A 132 KB albo OGG 81 KB) — mniej niż jeden duży WebP; muzyka (746 KB M4A) dopiero po włączeniu
przez rodzica, z własnym limitem 30 s. Precache rośnie o ~1,07 MB (oba formaty). Przycięcie buforów to jednorazowa kopia
kilkudziesięciu tysięcy próbek na efekt w `create`. Log usługi ograniczony do 50 wpisów.

## Migration Notes

Brak zmiany formatu (v3). Nowy klucz `localStorage` `martynka:sound`; jego brak = domyślne (efekty wł., muzyka wył.).

## Known risks

- **Chromium Playwrighta bez AAC**: wtedy Phaser wybierze OGG w e2e, a M4A sprawdzi tylko iPad — `[human]` w fazie 9.
- **iPadOS 17.4–18.3 i Vorbis „częściowy”**: omijane kolejnością `[m4a, ogg]`.
- **Stary WebKit: `DOMException` bez `Error`**: obsłużone w `signalOfRejection`; niesprawdzone na urządzeniu.
- **Pierwsze cue przed pierwszym dotykiem przepada** (`locked`) — świadomie (FR-026: dźwięk po pierwszym dotknięciu).
- **Pętla muzyki bez nakładki** — możliwy trzask; `[human]` + follow-up.
- **Wnętrze Phasera**: `cutLoad`, przycięcie przez `cache.audio`, `unlock`; tripwire wersji + piny tekstu + e2e.
- **Fallback HTML5 Audio** (urządzenie bez Web Audio): wpisy `cache.audio` to nie `AudioBuffer`; przycięcie pomija
  wpis, który nie jest `AudioBuffer` (sprawdzenie `instanceof`), zamiast liczyć go jako brak. Docelowe tablety mają Web
  Audio; nieprzetestowane (plan-review F7).
- **`locked` schodzi klatkę po `resume()`**: Phaser czyści `locked` w `BaseSoundManager.update` po rozwiązaniu
  `context.resume()`, więc cue w tym samym stuknięciu, które odblokowuje, może dać `locked` (dopuszczone w 9(a)).
- **Zamknięcie `UIScene`** (dziś nieosiągalne: uruchamiana raz) porzuciłoby ładowanie muzyki w stanie `loading`;
  `attachLoader` przy `shutdown` sceny odłącza loader i wraca do `off` (plan-review F6).
- **Instalacja SW pobiera oba formaty i `music-loop` (~1,07 MB) równolegle z ładowaniem startu** przy pierwszym
  uruchomieniu — konkuruje o łącze z kolejką startu (już dziś tak jest z grafiką); limit łączny `balance.loader.totalMs`
  to obejmuje.

## References

- Research: `context/changes/final-sound/research.md`; change: `context/changes/final-sound/change.md`
- Roadmapa `context/foundation/roadmap.md` `### S-16b`; PRD FR-017, FR-026, NFR dostępność; `Martynka-urzadza.md` (dźwięk po pierwszym dotknięciu, OGG + M4A)
- Kontrakt runu `context/runs/2026-10-15-fix-s16bcd/agent-contract.md` § S-16b; profil `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test-plan `context/foundation/test-plan.md` ryzyka #8, #11, #14, #15, #16; `context/foundation/test-stack.md` § E2E
- Wzorzec planu i e2e: `context/archive/2026-10-15-load-and-tab-guard/plan.md` (`cutLoad`, `stallall`, request-file, patche)
- Paczka (tylko do odczytu, nie w commitach): `designs/martynka-salon-v2/audio-manifest.json`, `audio-player.js`, `README.md`
- Phaser 4.2.1: `loader/filetypes/AudioFile.js` (`getAudioURL`, `onProcess`), `sound/webaudio/WebAudioSoundManager.js` (`unlock`, `locked`), `sound/BaseSoundManager.js` (`play`), `loader/LoaderPlugin.js` (`start`, `fileProcessComplete`)

## Autonomous decisions

1. **Kolejność formatów `[m4a, ogg]`**, bez własnego powrotu po błędzie dekodowania. Odrzucone: `[ogg, m4a]` + własne
   ponowne kolejkowanie (więcej kodu na wnętrzu loadera dla ~50 KB oszczędności na Androidzie). Dlaczego: Phaser nie wraca do
   drugiego URL-a, a AAC dekoduje każdy iPad (Vorbis dopiero od 18.4). Co zmieniłoby: urządzenie docelowe bez AAC albo
   e2e/iPad pokazujący błąd dekodowania M4A.
2. **Oba formaty w precache, bajty paczki bez ponownego kodowania.** Odrzucone: jeden format per platforma (statyczny
   manifest), ponowne kodowanie muzyki (narzędzia poza CI, mastering autorki). Co zmieniłoby: waga precache zgłoszona jako
   problem na tablecie (follow-up).
3. **Muzyka poza kolejką startu, ładowana leniwie loaderem `UIScene` z limitem 30 s.** Odrzucone: muzyka w `BootScene`
   (746 KB dominuje 45 s limitu dla funkcji domyślnie wyłączonej). Co zmieniłoby: muzyka domyślnie włączona.
4. **Preferencja w `localStorage` (`martynka:sound`) przez `src/storage/soundPrefs.ts`**, nie drugi klucz IndexedDB.
   Dlaczego: odczyt synchroniczny przed `createGame` bez limitu czasu i bez drugiego kontraktu magazynu; świeży kontekst e2e
   = świeże urządzenie; reset/import zapisu jej nie ruszają; ESLint dopuszcza `localStorage` poza `src/core`. Co zmieniłoby:
   dowód, że iPad (PWA z ekranu głównego) traci `localStorage` inaczej niż IndexedDB.
5. **Efekt przy zablokowanym kontekście jest pomijany (`locked`)**, nie kolejkowany. Dlaczego: WebAudio zagrałby go z
   opóźnieniem po odblokowaniu, w złym momencie. Co zmieniłoby: odsłuch pokazujący, że pierwsze cue po dotyku przepada.
6. **`answer-retry` tylko przy pierwszym błędzie; drugi błąd (→ rozwiązanie) bez dźwięku.** Dlaczego: „hmm” dwa razy z
   rzędu podwaja sygnał porażki (PRD: bez ostrej informacji zwrotnej), rozwiązanie to chwila nauki. Co zmieniłoby: odsłuch
   autorki / playtest S-17.
7. **`purchase` dla każdego „Wybieram” (kupno i darmowa zmiana), `variant-pick` dla podglądu.** Dlaczego: FR-017 mówi o
   dźwięku przy każdym zatwierdzeniu, a `celebrate` już biegnie dla obu. Co zmieniłoby: autorka słyszy w `purchase` „płacenie”.
8. **`coin` dla odłożenia monety i klocka, nie wskazówki zegara.** Co zmieniłoby: playtest prosi o dźwięk wskazówki.
9. **`tap` tylko na przyciskach nawigacji/akcji**, nie na wejściach odpowiedzi. Dlaczego: kafelki i klawisze mają cue
   odpowiedzi; dwa dźwięki na jedno stuknięcie. Co zmieniłoby: playtest S-17 (follow-up).
10. **`star` z `roundCues` z opóźnieniem 250 ms, niezależnie od animacji lotu.** Dlaczego: przy „ogranicz ruch” lotu nie
    ma, a dźwięk ma zostać. Co zmieniłoby: odsłuch — nakładanie z `answer-right`.
11. **Mowa kart „Nowa umiejętność!” i „Pokój gotowy!” po cue (`cueDelayMs`)**, bez ściszania i bez `cancel`. Dlaczego:
    narrator nie ma stanu „mówi”; efekty nigdy nie przerywają mowy. Co zmieniłoby: rozszerzenie narratora o stan mowy.
12. **Muzyka gra wszędzie po włączeniu** (usługa w rejestrze gry), pętla Phasera bez nakładki 40 ms. Co zmieniłoby:
    trzask w pętli na tablecie (follow-up) albo prośba o muzykę tylko w pokoju.
13. **`EncodingError` i `NotSupportedError` ciche**, `DOMException` czytany po nazwie. Odrzucone: łatanie
    `AudioFile.onProcess` Phasera. Co zmieniłoby: inny kod gry rzucający te nazwy jako prawdziwą awarię.
14. **Bez szwu `?e2eSound`**: spec psuje pliki przez `page.route`. Co zmieniłoby: przypadek, którego `route` nie odtworzy.
15. **Głośności z `audio-player.js` paczki** (master 0,55, efekty 0,65, muzyka 0,14). Co zmieniłoby: odsłuch na tablecie.
16. **Fazy 1–3 `tdd`; 4–8 `impl`; 9–10 `e2e`.** Dlaczego: kontrakt (czysta logika test-first, e2e po zbudowaniu; ryzyka
    #8, #11, #14, #15, #16). Mechanizmy na wnętrzu Phasera (dekodowanie, leniwy loader, cięcie audio) mają nazwany dowód w
    przeglądarce (fazy 9–10), nie tylko testy liczb.
17. **[human] Decyzje sprzeczne z PRD: brak.** Każda decyzja mieści się w FR-017, FR-026 i NFR dostępności. Co zmieniłoby:
    autorka chcąca przycisku wyciszenia dla dziecka albo dźwięku przed pierwszym dotknięciem.
18. **[human] Odsłuch na iPadzie** (wiersze 9.7 i 10.6): odblokowanie na pierwszym dotyku, mowa z efektami, pętla muzyki,
    głośność, przełącznik ciszy, offline. Automaty tego nie dowodzą (Chromium, log żądań, nie dźwięk).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Preferencje, wynik odtworzenia, przycięcie i opóźnienie (czysta logika)

#### Automated

- [x] 1.1 Nowe testy czerwone przed implementacją (asercja, nie błąd importu), zielone po; unit `<baseline gałęzi> + N` — a85eb75
- [x] 1.2 Deliberate break: `locked` przed `off` / `boot` dla `music-loop` → czerwone; przywrócone; meta-check (reguły, nie dowód Phasera) — a85eb75
- [x] 1.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (` — a85eb75

#### Manual

- [ ] 1.4 [reviewer] `src/core/sound.ts` bez Phasera i globali; `src/data/sounds.ts` tylko typy z `core`; liczby tylko w `balance.ts`

### Phase 2: Reguły cue dla rundy, panelu i przeciągania (czysta logika)

#### Automated

- [ ] 2.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 2.2 Deliberate break: retry przy `second` → `solution` / `panelCue` bez `changed` → czerwone; przywrócone; meta-check (stany z reduktorów)
- [ ] 2.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 2.4 [reviewer] Każdy z 12 efektów ma regułę albo nazwane miejsce; brak `music-loop` w regułach cue

### Phase 3: Dźwięk nie zatrzymuje gry — cicha granica błędów i cięcie dekodującego audio

#### Automated

- [ ] 3.1 Nowe testy czerwone przed implementacją (asercja), zielone po; unit `<baseline gałęzi> + N`
- [ ] 3.2 Deliberate break: bez `EncodingError` / `cutLoad` bez `onProcessError` → czerwone; przywrócone; meta-check (atrapa vs pin vs faza 10)
- [ ] 3.3 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`

#### Manual

- [ ] 3.4 [reviewer] Tylko dwie nazwy audio dodane; zdarzenia `error` bez zmian; wnętrze loadera tylko w `loaderCut.ts`

### Phase 4: Pliki dźwięku w `public/assets/sounds` i tabela równa plikom

#### Automated

- [ ] 4.1 `npm run sounds` dwa razy → bez zmian po drugim przebiegu; 26 plików
- [ ] 4.2 Deliberate break: usunięty `.ogg` → `tests/soundFiles.test.ts` czerwony; przywrócone; meta-check (tabela, nie poprawność audio)
- [ ] 4.3 Pełna bramka lokalna zielona; `dist/sw.js` wymienia `star.m4a` i `star.ogg`

#### Manual

- [ ] 4.4 [reviewer] Nic z `designs/` ani `audio/wav` w commicie; rozmiary równe paczce

### Phase 5: Ładowanie efektów, usługa dźwięku, magazyn preferencji i odczyt w haku

#### Automated

- [ ] 5.1 Pełna bramka lokalna zielona; unit `<baseline gałęzi> + N`; `npm run build` drukuje `e2e hook: absent (`
- [ ] 5.2 Deliberate break: `read` bez `try` → test magazynu czerwony; przywrócone; meta-check (dekodowanie dowodzi faza 9)
- [ ] 5.3 e2e (orkiestrator, `--workers=4`) `<baseline gałęzi e2e> + 0`
- [ ] 5.4 `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty

#### Manual

- [ ] 5.5 [reviewer] `cache.audio.exists` przed `play`; przycięcie przed `delayedCall(0)`; `localStorage` tylko w `soundPrefs.ts`; klucze poza `SAVE_KEYS`

### Phase 6: Cue w zdarzeniach gry i mowa po cue

#### Automated

- [ ] 6.1 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- [ ] 6.2 Deliberate break: patch `e2e-break-p9a.patch` przygotowany; meta-check w handoffie (dowód w fazie 9)

#### Manual

- [ ] 6.3 [reviewer] Każde `play` z reguły `core` albo nazwanego miejsca; brak `narrator.cancel()`; luka 35 zamknięta

### Phase 7: Sekcja „Dźwięki” w panelu rodzica i muzyka

#### Automated

- [ ] 7.1 Pełna bramka lokalna zielona; `npm run build` drukuje `e2e hook: absent (`; e2e (orkiestrator) `<baseline gałęzi e2e> + 0`
- [ ] 7.2 Deliberate break: patche `e2e-break-p9b.patch` i `e2e-break-p9c.patch` przygotowane; meta-check w handoffie
- [ ] 7.3 `SAVE_VERSION` 3; `git diff --stat main -- tests/fixtures` pusty

#### Manual

- [ ] 7.4 [visual] Panel 1440 i 1024: sekcja „Dźwięki” czytelna, wzór jak czytanie, linia braków ukryta przy zdrowym starcie
- [ ] 7.5 [reviewer] Teksty tylko w `pl.ts`; DESIGN-GAP 114 w trzech miejscach; `localStorage` tylko przez `soundPrefs.ts`

### Phase 8: Dokumentacja i follow-upy

#### Automated

- [ ] 8.1 `validate-rule-files.sh` PASS; deliberate break w `CLAUDE.md` → FAIL; przywrócone
- [ ] 8.2 Każdy wpis w `follow-ups/review-fixes.md` ma `Trigger:`; pełna bramka lokalna zielona

#### Manual

- [ ] 8.3 [reviewer] Seam sweep: nazwy w `CLAUDE.md` istnieją; brak zmian w `vite/config.shared.mjs` i `deploy/`

### Phase 9: Cue we właściwych zdarzeniach, przełączniki rodzica i leniwa muzyka — e2e (#11, #14, #16)

#### Automated

- [ ] 9.1 `npx playwright test tests/e2e/final-sound.spec.ts` zielone; pełne `--workers=4`: `<baseline gałęzi e2e> + N`
- [ ] 9.2 Deliberate break p9a (bez cue w `submit`) → (a) czerwony; przywrócone; meta-check
- [ ] 9.3 Deliberate break p9b (panel bez `setPrefs`/zapisu) → (c) czerwony
- [ ] 9.4 Deliberate break p9c (muzyka w kolejce startu) → (c) czerwony; meta-check
- [ ] 9.5 Deliberate break p9d (pokój bez `panelCue`) → (b) czerwony
- [ ] 9.6 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual

- [ ] 9.7 [human] iPad, odsłuch: odblokowanie na pierwszym dotyku, efekty z mową bez ucinania, głośność, pętla muzyki bez trzasku, przełącznik ciszy; decyzje: `purchase` przy darmowej zmianie, jedno `answer-retry`, `tap` + `round-bonus`

### Phase 10: Uszkodzony albo wiszący dźwięk nie zatrzymuje gry, dźwięki offline — e2e (#15, #8)

#### Automated

- [ ] 10.1 `npx playwright test tests/e2e/final-sound-failure.spec.ts tests/e2e/seed.spec.ts` zielone; pełne `--workers=4`: `<baseline gałęzi e2e> + N`
- [ ] 10.2 Deliberate break p10a (bez `EncodingError`) → (a) czerwony na karcie; przywrócone; meta-check
- [ ] 10.3 Deliberate break p10b (`cutLoad` bez cięcia) → (b) czerwony; meta-check
- [ ] 10.4 Deliberate break p10c (precache bez audio) → seed czerwony
- [ ] 10.5 `npm run build` drukuje `e2e hook: absent (`; pełna bramka lokalna zielona; serwery 4397/4398 zabite

#### Manual

- [ ] 10.6 [human] iPad offline: dźwięki grają z cache
