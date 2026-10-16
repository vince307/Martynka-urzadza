# Dźwięki gry z paczki salon-v2 (S-16b `final-sound`) — Plan Brief

> Full plan: `context/changes/final-sound/plan.md`
> Research: `context/changes/final-sound/research.md`

## What & Why

Dziecko słyszy 12 efektów P1 (dobra odpowiedź, ciepłe „hmm”, gwiazdka, premia, stuknięcie, panel, podgląd, zakup,
„Pokój gotowy!”, „Nowa umiejętność!”, moneta/klocek, koniec minigry) po pierwszym dotknięciu; muzyka gra tylko, gdy rodzic
ją włączy. PRD FR-017 (dźwięk przy „Wybieram”), FR-026 (dźwięki po pierwszym dotknięciu), NFR: gra w pełni grywalna bez
dźwięku. Pierwszy dźwięk otwiera też ryzyko z follow-upu `audio.noAudio`: uszkodzony plik dziś pokazałby kartę błędu.

## Starting Point

Gra nie ma żadnego dźwięku. Phaser 4.2.1 tworzy `WebAudioSoundManager` i sam odblokowuje kontekst na pierwszym dotyku,
ale `load.audio` wybiera jeden URL bez powrotu po błędzie, porzucona obietnica `decodeAudioData` daje fatalne
`EncodingError`, a `cutLoad` nie odcina `onProcessError`. Panel rodzica ma tylko czytanie na głos; `RoomScene.playPurchaseSound`
jest pusty (luka 35).

## Desired End State

12 efektów wczytuje się na starcie (`[m4a, ogg]`), muzyka dopiero po włączeniu; sceny grają cue w zdarzeniach przez
`SoundService` z logiem `played | off | locked | missing`; rodzic ma sekcję „Dźwięki” (efekty wł., muzyka wył. domyślnie),
wybór trwa w `localStorage` poza zapisem (v3 bez zmian). Zły albo wiszący plik dźwięku tylko wypada z gry, bez karty.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Format | `[m4a, ogg]`, bez własnego powrotu | Phaser nie wraca do drugiego URL-a, AAC dekoduje każdy iPad | Research / Plan |
| Precache | oba formaty, bajty paczki | statyczny manifest nie różni się per urządzenie | Research |
| Muzyka | poza startem, leniwie loaderem `UIScene`, limit 30 s | 746 KB dla funkcji domyślnie wyłączonej | Research / Plan |
| Preferencja | `localStorage` `martynka:sound` (`src/storage/soundPrefs.ts`) | synchronicznie przed `createGame`, poza zapisem, reset jej nie rusza | Plan |
| Zablokowany kontekst | efekt pomijany (`locked`) | WebAudio zagrałby go za późno | Research |
| Błędy | `EncodingError`, `NotSupportedError` ciche; `cutLoad` odcina `onProcessError` | dźwięk nigdy nie zatrzymuje gry | Research |
| Cue | `answer-retry` tylko przy 1. błędzie; `purchase` dla każdego „Wybieram”; `tap` tylko na nawigacji | łagodność (PRD), FR-017, bez podwójnych dźwięków | Plan |
| Mowa | czytanie kart po cue (`cueDelayMs`), bez `cancel` | efekty nie przerywają narratora | Research / Plan |
| e2e | log haka + `page.route`, bez szwu `?e2eSound` | mniej kodu tylko-e2e | Plan |
| Decyzje sprzeczne z PRD | brak (`[human]` tylko odsłuch na iPadzie) | wszystko mieści się w FR-017/FR-026/NFR | Plan |

## Scope

**In scope:** 26 plików w `public/assets/sounds`, `npm run sounds`; reguły w `src/core/sound.ts`; ładowanie i przycięcie
buforów; `SoundService`; cue w `TaskScene`/`RoomScene`/`UIScene`; sekcja „Dźwięki” (luka 114); luka 35 zamknięta; granica
błędów i `cutLoad`; dwa specy e2e + seed.

**Out of scope:** zmiana zapisu; jeden format per platforma; ponowne kodowanie muzyki; nakładka pętli 40 ms; ściszanie pod
mową; przycisk wyciszenia dla dziecka; przełącznik ciszy iPada; `tap` na wejściach odpowiedzi; VO3.

## Architecture / Approach

`src/data/sounds.ts` (tabela) + `balance.sound` → `src/core/sound.ts` (prefs, `soundOutcome`, `trimFrameCount`,
`cueDelayMs`, `roundCues`/`panelCue`/`dragCue`) → `BootScene` (kolejka efektów, przycięcie w `cache.audio`, `soundHealth`)
→ `src/ui/sound.ts` `SoundService` w rejestrze (gra przez `game.sound.play` za `cache.audio.exists`, muzyka przez loader
`UIScene`) ← sceny wołają `play(id)`; `src/storage/soundPrefs.ts` czyta/zapisuje preferencję; hak e2e czyta `status()`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Preferencje i reguły (tdd) | `soundOutcome`, parsowanie, przycięcie, opóźnienie; `SOUNDS`, `balance.sound` | — |
| 2. Reguły cue (tdd) | `roundCues`, `panelCue`, `dragCue` na prawdziwych reduktorach | nazwa pola premii w `RoundState` |
| 3. Dźwięk nie zatrzymuje gry (tdd) | ciche nazwy audio, `cutLoad` z `onProcessError`, piny Phasera | atrapa ≠ Phaser (dowód faza 10) |
| 4. Pliki (impl) | 26 plików, `npm run sounds`, test tabela ⇔ dysk | nic z `designs/` w commicie |
| 5. Ładowanie i usługa (impl) | efekty na starcie, przycięcie, `SoundService`, `localStorage`, hak | wnętrze cache/loadera Phasera |
| 6. Cue w scenach (impl) | dźwięki w zdarzeniach, mowa po cue, luka 35 | podwójne cue, `render` przy powrocie |
| 7. Panel i muzyka (impl) | sekcja „Dźwięki”, leniwa pętla muzyki, luka 114 | leniwy loader poza `preload` |
| 8. Dokumentacja (impl) | `CLAUDE.md`, follow-upy, lista kontrolna | — |
| 9. e2e cue i przełączniki (#11, #14, #16) | log żądań, trwałość wyboru, muzyka po włączeniu | Chromium Playwrighta bez AAC |
| 10. e2e awarie i offline (#15, #8) | zły/wiszący plik bez karty, dźwięki z SW | czy Chromium rzuca `EncodingError` |

**Prerequisites:** S-16a i `load-and-tab-guard` na `main` (spełnione, `a1625be`); paczka `designs/martynka-salon-v2` lokalnie.
**Estimated effort:** 10 małych faz, każda dla jednego świeżego agenta; e2e przez protokół request-file orkiestratora.

## Open Risks & Assumptions

- Chromium Playwrighta może nie mieć AAC → e2e sprawdzi OGG, M4A tylko iPad (`[human]`).
- Słyszalność, odblokowanie na iPadzie, mowa z efektami i trzask pętli — tylko odsłuch na tablecie (9.7, 10.6).
- Stary WebKit może podawać `DOMException` spoza `Error` — obsłużone, niesprawdzone na urządzeniu.

## Success Criteria (Summary)

- Runda, pokój i karty żądają właściwych cue (log haka), a rodzic wyłącza efekty / włącza muzykę i wybór przetrwa restart.
- Uszkodzony albo wiszący plik dźwięku nigdy nie pokazuje karty błędu ani nie blokuje startu; dźwięki działają offline.
- Format zapisu v3 i fixtury bez zmian; pełna bramka i e2e zielone.
