# Łączny limit ładowania, linia „jeszcze chwilka” i strażnik zapisu przed starszą kartą — Plan Brief

> Full plan: `context/changes/load-and-tab-guard/plan.md`
> Research: `context/changes/load-and-tab-guard/research.md`

## What & Why

Audyt 2026-10-15_2217 (PR #66): limit ładowania działa tylko na plik (A-1), więc na Androidzie (6 pobrań naraz) milczący
serwer zamraża pasek na minuty; ekran ładowania nie mówi, że jest wolno (A-2); starsza karta albo instancja PWA może po
cichu nadpisać nowszy zapis (P-5). Font nie ma żadnego limitu. Postęp i spokojny start to zasady PRD („Postęp nigdy nie
ginie”, „Zero frustracji”).

## Starting Point

`BootScene.preload` kolejkuje font, 64 WebP; per-file `xhr.timeout` 12 s × 2 próby; `create()` tylko na `COMPLETE`.
`LoadingScreen` ma tytuł i pasek. `createIdbSaveStore.write` to ślepe `set`; autosaver nigdy nie czyta przed zapisem.
SW ma `skipWaiting` + `clientsClaim`.

## Desired End State

Po 8 s ładowania pod paskiem „Jeszcze chwilka, wczytuję obrazki.”; po 45 s gra startuje z tym, co się wczytało, reszta to
zastępstwa i licznik „Obrazki” — `create()` dokładnie raz, bez karty błędu, także gdy font wisi. Zapis z niższą wersją niż
leżąca w IndexedDB jest odrzucany w tej samej transakcji; autosaver blokuje się (`'newer'`), rodzic czyta przyczynę w
„Zapis gry”. Format v3, fixtury bez zmian.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Jak skończyć ładowanie | Wymuszone niepowodzenie przez `nextFile`/`fileProcessComplete` | Jedyna droga z jednym `create()` i liczeniem zastępstw | Research |
| Zegar | Pętla gry (`this.time`) | W ukrytej karcie nic nowego się nie pobiera | Research / Plan |
| Liczby | `slowAfterMs` 8 000, `totalMs` 45 000 | Zimny start ≈ 40 s przy 50 KB/s; > 24 s najgorszego pliku | Plan |
| Dowód cięcia | e2e #15 + tripwire wersji Phasera | Lekcja: konfiguracja loadera była no-opem, wykazało to tylko e2e | Plan |
| Strażnik zapisu | idb-keyval `update` (atomowy) + `storedVersionNewer` | Brak okna między odczytem a zapisem | Research |
| Powód blokady | Nowy runtime `'newer'` (nie `'future'`) | `future` to powód odczytu ze startową kartą | Research |
| Karta dla dziecka przy `'newer'` | Nie — tylko linia rodzica + log | Rzadkie; nowy UI bez kitu przerwałby rundę | Plan |
| Service worker | Bez zmian | FR-003 (cicha aktualizacja); dane chroni strażnik | Research |
| `loaderror` dla kolejki | Nie; jedna linia logu z kluczami | Nie fałszować przyczyn A-7 | Plan |

## Scope

**In scope:** A-1 (łączny limit, także font i przyszłe dźwięki), A-2 (linia), P-5 (strażnik wersji), szwy e2e
`stallall`/`newer`, odczyt `loading` w haku, luki 112-113, follow-upy.

**Out of scope:** karta dziecka przy `'newer'`, zmiana SW, kolejność kart tej samej wersji (v4), ochrona przed buildami
sprzed zmiany, A-3..A-11, V-*, P-1..P-4, P-6..P-8, grafika ładowania (S-16c), dźwięki (S-16b).

## Architecture / Approach

`src/core/bootLoad.ts` decyduje fazę (`loading`/`slow`/`over`); `BootScene` ustawia dwa timery pętli i renderuje;
`src/scenes/loaderCut.ts` to jedyne miejsce dotykające wnętrza `LoaderPlugin`. Po stronie zapisu `storedVersionNewer` (core)
używane przez `createIdbSaveStore.write` (`update`) i szew w pamięci; `NewerSave` → `blockedBy 'newer'` → `offState`,
`deviceSaveView`, `replaceGate`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Reguła i liczby (tdd) | `bootLoadPhase`, `balance.loader` | Testy liczb mylone z dowodem |
| 2. Cięcie w `BootScene` (impl) | `cutLoad`, `bootLoad`, szew `stallall`, hak `loading`, tripwire | Wnętrze Phasera |
| 3. Linia „jeszcze chwilka” (impl) | `LoadingScreen.slow`, `pl.loading.slow`, luka 112 | Rysowanie po `destroy` |
| 4. Powód `'newer'` (tdd) | autosaver, `replaceGate`, widoki, luka 113 | Wyczerpujące `Record` |
| 5. Strażnik IndexedDB (tdd) | `update` + szew `newer` | Utrata połączenia iOS |
| 6. Dokumentacja (impl) | `CLAUDE.md`, follow-upy | — |
| 7. e2e #15, #2 | Dowód przeglądarkowy, 4 patche łamiące | Chromium tylko u orkiestratora |

**Prerequisites:** gałąź `feat/load-and-tab-guard`; fake-indexeddb już w devDependencies.
**Estimated effort:** 7 krótkich faz, każda osobny agent; faza 7 w protokole request-file.

## Open Risks & Assumptions

- `package.json` ma `^4.2.1` — upgrade Phasera może zmienić wnętrze loadera (tripwire + e2e).
- Strażnik działa od tego buildu; starsze buildy nadal mogą nadpisać.
- WebKit/iPad i Android tylko jako ręczne `[human]`.

## Success Criteria (Summary)

- Zawieszone obrazki i font: linia po 0,5 s i start po 3 s pod szwem e2e, jeden `create`, brak karty błędu.
- Nowszy zapis zostaje nietknięty; „Zapis gry” pokazuje `saveOff.newer`.
- Pełna bramka i e2e zielone; v3 i fixtury bez zmian.
