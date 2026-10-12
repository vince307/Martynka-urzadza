# Instalowalna gra offline na tablecie (PWA) — Plan Brief

> Full plan: `context/changes/installable-offline-pwa/plan.md`
> Research: `context/changes/installable-offline-pwa/research.md`

## What & Why

Roadmapa S-01 (etap M0, zamyka M0): dziecko otwiera grę z adresu na tablecie, dodaje ją do ekranu początkowego (instrukcja dopasowana do iPada/Androida), uruchamia offline, w pionie widzi „Obróć tablet”, a nowa wersja instaluje się sama przy następnym starcie. Bez tego żaden kolejny etap nie jest sprawdzany na tablecie tak, jak będzie używany.

## Starting Point

Szkielet F-01 (Phaser 4.2.1, Vite 6.4, `base: './'`, pusta scena) i deploy F-02 (Caddy pod martynka-urzadza.pl z `immutable` dla `/assets/*` i `no-cache` dla `sw.js`/manifestu, których jeszcze nie ma). Brak pluginu PWA, ikon, nakładek. Agent ma `ssh martynka-ops sync`/`bootstrap`.

## Desired End State

Manifest i service worker serwowane z poprawnymi nagłówkami; precache całego buildu w `_app/`; instrukcja instalacji przy każdym starcie z przeglądarki na tablecie, nieobecna po instalacji i na komputerze; „Obróć tablet” w pionie; SHA builda w rogu ekranu pozwala sprawdzić cichą aktualizację. Właściciel potwierdza instalację i start offline na iPadzie i Androidzie.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Aktualizacja | `registerType: 'autoUpdate'`, własna rejestracja `sw.js` bez `workbox-window`, `skipWaiting`+`clientsClaim` | Nowy build przy następnym starcie, bez przeładowań w trakcie gry i bez pytania (FR-003) | Research |
| Ścieżki | `base: '/'`, `build.assetsDir: '_app'`, Caddy `immutable` na `/_app/*` | Gra jest pod rootem domeny; przyszła grafika w `public/assets/` nie dostanie `immutable` (follow-up F-02) | Research / Plan |
| Nakładka orientacji | Element DOM sterowany `@media (orientation: portrait)` | `lockOrientation()` Phasera nie działa, iOS ignoruje `orientation` manifestu | Research |
| Instrukcja instalacji | Przy każdym starcie z przeglądarki na iPadzie/Androidzie, do instalacji; przycisk „Zagraj w przeglądarce”; „Zainstaluj” gdy `beforeinstallprompt` | Rodzic nie przegapi instrukcji; brak flag lokalnych | Plan (decyzja właściciela) |
| Ikony | Placeholder generowany skryptem Node (zlib PNG), 192/512/maskable/180 | Paczka nie ma ikony aplikacji; sandbox bez narzędzi graficznych; podmiana w M7 bez zmian kodu | Research |
| Identyfikator builda | `__BUILD_ID__` z SHA w rogu ekranu startowego | Jedyny sposób, by na tablecie sprawdzić, że cicha aktualizacja zaszła | Plan |
| Wspólna konfiguracja Vite | `vite/config.shared.mjs` z pluginem, `define`, `_app` | Dev i prod nie mogą rozjechać się w opcjach PWA | Research |

## Scope

**In scope:** `vite-plugin-pwa` 2.0.0, wspólna konfiguracja Vite, manifest, `sw.js`, ikony placeholder i skrypt, meta iOS w `index.html`, rejestracja SW, SHA builda, nakładki DOM z tekstami w `pl.ts`, `platform.ts`, CSS nakładek, Caddyfile `/_app/*`, health check manifestu, dokumentacja, PR → merge → bootstrap przez `martynka-ops`, test na tabletach.

**Out of scope:** docelowa ikona i grafika (M7), `storage.persist()` i zapis (S-11), czcionka lokalna (S-04), dźwięk, ekran „gotowe offline”, `devOptions`, vitest (F-03), układ pionowy/telefon, zmiany w bootstrapie i dyspozytorach.

## Architecture / Approach

`vite/config.shared.mjs` (plugin PWA, manifest, workbox, `_app`, `__BUILD_ID__`) → `dist/` z `index.html`, `_app/*.js`, `icons/*.png`, `manifest.webmanifest`, `sw.js` (precache wszystkiego) → Caddy (`no-cache` dla wejść i PWA, `immutable` dla `_app`) → tablet. W runtime `src/main.ts` tworzy grę, montuje `rotateOverlay` (CSS portrait) i `installHint` (`platform.ts` + `display-mode`), rejestruje `sw.js` w produkcji.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. PWA w buildzie | plugin, manifest, SW, ikony, `_app`, SHA builda; sprawdzone na `dist/` i w Chrome | Limit 2 MiB precache dla chunku Phasera; rejestracja w dev musi być pominięta |
| 2. Nakładki | „Obróć tablet”, instrukcja instalacji, teksty w `pl.ts`, `platform.ts` | Heurystyka iPada (UA Maca); `beforeinstallprompt` może nie przyjść |
| 3. Caddy, docs, tablety | `/_app/*`, health check, dokumentacja, merge, bootstrap, test właściciela | Safari bywa kapryślne przy PWA; test zależy od czasu właściciela |

**Prerequisites:** F-01 i F-02 zmergowane (tak), `martynka-ops` działa (tak), dostęp właściciela do iPada i tabletu z Androidem.
**Estimated effort:** jedna sesja agenta na fazy 1–2 i część 3; test na tabletach po stronie właściciela.

## Open Risks & Assumptions

- Chunk Phasera mieści się w domyślnym limicie 2 MiB (ok. 1,4 MB w F-01); build przerwie się, jeśli nie.
- Safari na iPadzie: `fullscreen` zachowuje się jak standalone (pasek stanu zostaje) — akceptowane.
- Split View na iPadzie może pokazać „Obróć tablet” w poziomie — akceptowane (Non-Goals).
- Heurystyki platformy mogą się mylić na nietypowych urządzeniach; wtedy instrukcja nie pojawi się lub pokaże niewłaściwą ścieżkę, ale gra działa.

## Success Criteria (Summary)

- Po merge `https://martynka-urzadza.pl` serwuje manifest i `sw.js` z `no-cache`, `_app` z `immutable`, workflow zielony z rozszerzonym health checkiem.
- Na iPadzie i Androidzie gra instaluje się z instrukcji, startuje z ikony offline na pełnym ekranie, pokazuje „Obróć tablet” w pionie.
- Kolejne wdrożenie pojawia się przy drugim starcie bez pytania (nowy SHA w rogu).
