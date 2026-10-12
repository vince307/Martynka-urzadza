<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Instalowalna gra offline na tablecie (PWA)

- **Plan**: context/changes/installable-offline-pwa/plan.md
- **Mode**: Deep
- **Date**: 2026-10-11
- **Verdict**: SOUND
- **Findings**: 0 critical, 1 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | PASS |

## Grounding
Grounding: 15/15 existing paths ✓ (7 new paths marked „nowy”), 8/8 risky claims verified against vite-plugin-pwa v2.0.0 source, workbox-build, vite 6.4.4 `mergeConfig`, web.dev/Chrome install criteria, WebKit blog 13878 (7 confirmed, 1 uncertain: iOS `fullscreen` behaves as standalone), brief↔plan ✓, Progress↔Phase 19/19 ✓

## Findings

### F1 — Stary cache a otwarta strona przy `clientsClaim`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 — pwaOptions.workbox (`cleanupOutdatedCaches`, `clientsClaim`)
- **Detail**: Nowy SW przejmuje otwartą stronę i usuwa stary precache; jeśli stara strona w trakcie rundy dociągnęłaby zasób (chunk, grafika), offline dostanie błąd. Dziś gra ładuje wszystko na starcie (jeden bundle + Phaser), więc ryzyko jest teoretyczne, ale plan tego nie nazywa.
- **Fix**: Dopisać w „Critical Implementation Details”, że wszystkie zasoby muszą być ładowane przy starcie (brak lazy chunków) dopóki aktualizacja działa z `clientsClaim`; przy wprowadzeniu lazy-loadingu (M6/M7) rozważyć `clientsClaim: false`.
- **Decision**: ACCEPTED (applied to plan 2026-10-11)

### F2 — Opis stanu: `skipWaiting`/`clientsClaim` przy `injectRegister: null`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Current State Analysis, punkt 2
- **Detail**: Plan mówi, że przy `injectRegister: null` trzeba podać flagi jawnie; źródło (`src/options.ts:136-139` v2.0.0) ustawia je automatycznie dla `'auto'` i `null` w trybie `autoUpdate`. Jawne wartości w kontrakcie są poprawne i nieszkodliwe.
- **Fix**: Poprawić zdanie w „Current State Analysis” (plugin ustawia flagi sam; w konfiguracji zostają jawnie dla czytelności).
- **Decision**: ACCEPTED (applied to plan 2026-10-11)

### F3 — iOS traktuje `fullscreen` jak `standalone`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Desired End State („na pełnym ekranie”)
- **Detail**: WebKit otwiera aplikację bez chrome przeglądarki dla `standalone` i `fullscreen`, ale pasek stanu zostaje (bugs.webkit.org 264220/280181). Kryterium ręczne 3.5 mówi „na pełnym ekranie”; na iPadzie oznacza to „bez paska adresu”, nie bez paska stanu.
- **Fix**: Doprecyzować 3.5: „bez paska adresu Safari (pasek stanu iOS może zostać)”. Brief już wymienia to w ryzykach.
- **Decision**: ACCEPTED (applied to plan 2026-10-11)

### F4 — Runbook nie ma dziś sekcji o cache

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Dokumentacja
- **Detail**: Pierwsza wersja planu kazała „zamienić `/assets/*` na `/_app/*`” w `deploy/README.md`, który nagłówków cache nie opisuje (grep bez trafień). Poprawione podczas ugruntowania na „dodać akapit PWA i cache w sekcji 1 oraz zdanie w sekcji 10”.
- **Fix**: — (już zastosowane w planie przed zapisaniem przeglądu).
- **Decision**: ACCEPTED (fixed during grounding)
