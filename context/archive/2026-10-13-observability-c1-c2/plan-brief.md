# Granica błędów, zwalnianie wejścia, stan lektora i opanowanie bez kary — Plan Brief

> Full plan: `context/changes/observability-c1-c2/plan.md`
> Research: `context/changes/observability-c1-c2/research.md`

## What & Why

Szybka poprawka przed S-09 z audytu observability (PR #25). Dziś nieprzechwycony wyjątek zamraża grę bez słowa (C-1),
wyjątek w callbacku okna rodzica zostawia martwy dotyk (C-2, L-8), panel ustawień twierdzi „Włączone” bez polskiego
głosu (H-6), a błąd w pierwszej próbie odejmuje punkt opanowania, przez co dziecko z 60–79 % trafności praktycznie nie
odblokowuje kroków (H-7 — opiekun zdecydował 2026-10-13: błąd tylko zeruje serię).

## Starting Point

Phaser 4.2.1 nie łapie wyjątków nigdzie; `main.ts` nie ma handlera okna. Trzech właścicieli przełącznika wejścia zwalnia
go tylko na ścieżce sukcesu, a `createInputSuspender` nie ma `finally`. `Narrator.onAvailability` istnieje, panel go nie
używa. `recordRound` odejmuje `balance.mastery.loss = 1`. Baseline: unit 948, e2e 18.

## Desired End State

Każda awaria pokazuje spokojną kartę „Ups! Gra się zatrzymała.” z przyciskiem „Zacznij od nowa” (bez stosu, bez
telemetrii, bez obietnicy postępów); szum przeglądarki jej nie pokazuje. Wyjątek w oknie rodzica zawsze oddaje wejście
i trafia do karty. Panel mówi, gdy brak polskiego głosu. Opanowanie nigdy nie maleje; PRD FR-013 i ZADANIA § 1 to mówią.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Granica | `window` `error` + `unhandledrejection` w `src/ui/dom/errorBoundary.ts`, wpięte przed `createGame` | start gry biegnie w obietnicy czcionki Phasera | Research |
| Co pokazuje kartę | czysty `isFatalSignal` w `core`; szum: ResizeObserver, „Script error.”, obce pliki, `AbortError`/`NotAllowedError` | testowalne bez DOM; odrzucenia autoplay dałyby pętlę kart | Research / Plan |
| Reakcja | karta (z 18) → wstrzymanie wejścia na zawsze → `game.loop.sleep()`; restart `location.reload()` | stan po wyjątku jest niepewny; karta końcowa | Change / Plan |
| C-2 | helper `openInputSession` (`run` zwalnia przy wyjątku i rzuca dalej) + `finally` w liczniku | jedno miejsce testowalne w vitest; wyjątek widzi granica | Research (opcja b) / Plan |
| H-6 | opcja `watchVoice` (subskrypcja), przełącznik aktywny, linia pod nim | głos może dojść przy otwartym panelu | Research / Plan |
| H-7 | błąd → seria 0, opanowanie bez zmian; `loss` usunięte | decyzja opiekuna, nie agenta | Maintainer |
| Test-only wyzwalacz | `?e2eFail=` (step, boot, settings) pod `__E2E_HOOK__`, klucz rejestru `forcedFailure`, strażnik z listą 4 znaczników (wymóg obecności w buildzie e2e od fazy 4) | kontrakt: dowód strażnikiem i grepem | Research / Plan |
| `audio.noAudio` | nie | dźwięk należy do S-16 | Plan |

## Scope

**In scope:** C-1, C-2 (+ L-8, F6), H-6, H-7 z dokumentami, strażnik buildu z listą znaczników, DESIGN-GAP 29–30, follow-upy.

**Out of scope:** telemetria i bufor błędów, wznawianie pętli, M-1/M-2/M-13, ślad lektora, widoki rodzica (H-8/H-10),
wdrożenie/mapy źródeł, kalibracja S-17, `src/pwa/`, happy-dom, e2e w CI.

## Architecture / Approach

`core` decyduje (klasyfikator, sesja wejścia, reguła opanowania), krawędź reaguje: `errorBoundary.ts` mapuje zdarzenia
okna na `ErrorSignal`, `main.ts` montuje `errorCard.ts`, usypia pętlę i trzyma wejście. Sceny owijają callbacki okien
w `session.run`. E2E wymusza awarie flagą czytaną tylko w buildzie e2e (DCE + strażnik).

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Zwolnienie wejścia (tdd) | `finally` w liczniku, `openInputSession` | zachować reset wskaźników S-08 F1 |
| 2. Opanowanie bez kary (tdd) | reguła H-7, testy, FR-013, ZADANIA § 1 | test rozgrzewki potrzebuje nowego obserwowalnego skutku |
| 3. Klasyfikator i strażnik (tdd) | `isFatalSignal`, `e2eFail`, lista znaczników | komunikat strażnika musi zostać dosłownie |
| 4. Granica z kartą (impl) | `errorBoundary`, `errorCard`, sceny na sesji, miejsca wyzwolenia | handler awarii nie może sam rzucić |
| 5. Linia „brak głosu” + seam sweep (impl) | `watchVoice`, DESIGN-GAP 29–30, follow-upy, `CLAUDE.md` | odpięcie subskrypcji na każdej ścieżce zamknięcia |
| 6. E2E granicy (#15 proposed) | 4 testy granicy (+4) | Chromium w sesji agenta → plik żądania |
| 7. E2E H-6 (#14 proposed) | 1 test linii „brak głosu” (+1) | atrapa polskiego głosu |

**Prerequisites:** gałąź `feat/observability-c1-c2`, research zatwierdzone; brak nowych zależności.
**Estimated effort:** 7 sesji agenta (po jednej na fazę), fazy 6–7 zależne od orkiestratora dla Chromium.

## Open Risks & Assumptions

- Nośnik `unhandledrejection` przy starcie wnioskowany z kodu — granica słucha obu; faza 6 to rozstrzyga.
- Do S-11 restart z karty kończy sesję (wiersz `[human]` 4.8).
- H-7 przyspiesza odblokowanie dla słabszych dzieci — kalibracja w S-17 (`[human]` 2.6).

## Success Criteria (Summary)

- Wymuszona awaria (klatka, start, callback rodzica) daje kartę, nie zamrożony ekran; szum nie daje karty.
- Rzucający callback zawsze oddaje wejście (vitest); panel bez polskiego głosu pokazuje linię (e2e).
- Unit `948 + N`, e2e `18 + 5`; `e2e hook: absent` i brak znaczników e2e w `dist/`.
