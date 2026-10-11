---
date: 2026-10-11T22:21:22+02:00
researcher: Claude (orkiestrator, sesja 2026-10-11)
git_commit: f2d8bd5
branch: m0/installable-offline-pwa
repository: Martynka-urzadza
topic: "S-01 installable-offline-pwa: vite-plugin-pwa 2.0 na Vite 6.4 (precache, cicha aktualizacja), nakładka „Obróć tablet” i instrukcja instalacji na iPadzie/Androidzie, przeniesienie bundli do _app i matcher Caddy"
tags: [research, pwa, vite-plugin-pwa, workbox, phaser4, orientation, ios, android, caddy, M0]
status: complete
last_updated: 2026-10-11
last_updated_by: Claude (orkiestrator)
---

# Research: S-01 installable-offline-pwa

**Date**: 2026-10-11T22:21:22+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-11)
**Git Commit**: f2d8bd5
**Branch**: m0/installable-offline-pwa
**Repository**: Martynka-urzadza

## Research Question

Roadmapa S-01 (`context/foundation/roadmap.md`, etap M0, zamyka M0): dziecko otwiera grę z adresu URL na tablecie, dodaje ją do ekranu początkowego (z instrukcją przy pierwszym uruchomieniu w przeglądarce, FR-001), uruchamia offline, w pionie widzi „Obróć tablet” (FR-002), a nowa wersja instaluje się sama przy następnym starcie (FR-003). Pytania: (1) jak skonfigurować `vite-plugin-pwa` 2.0.0 na Vite 6.4 z `base: './'`, żeby precache objął cały build (w tym chunk Phasera) i aktualizacja była cicha; (2) jak wykryć orientację i instalację na iPadzie (Safari) i Androidzie (Chrome) i co z tego umie Phaser 4.2.1; (3) jakie ikony i meta są potrzebne, skąd je wziąć; (4) co w `deploy/` zmienia przeniesienie bundli do `_app` (przegląd F-02) i jak to wdrożyć przez `martynka-ops`.

## Summary

- `vite-plugin-pwa` 2.0.0 (2026-10-03) wymaga Node ≥ 20.19 i deklaruje peer `vite ^3.1…^8` oraz `workbox-build`/`workbox-window` `^7.4.1` (npm view 2026-10-11); jedyna zmiana 2.x względem 1.x w notatkach wydań to peer `@vite-pwa/assets-generator ^2`. Domyślne nazwy to `sw.js` i `manifest.webmanifest`, czyli dokładnie te, które Caddyfile z F-02 już oznacza `no-cache`.
- Cicha aktualizacja przy następnym starcie wychodzi z `registerType: 'autoUpdate'` **bez** modułu `virtual:pwa-register`: nowy SW instaluje się przy starcie N, `skipWaiting` + `clientsClaim` aktywują go od razu, strona nie jest przeładowywana, start N+1 dostaje nowy build. Moduł wirtualny w tym trybie robi `window.location.reload()` zaraz po aktywacji (chyba że poda się `onNeedReload`), czego nie chcemy w trakcie rundy. Plugin ustawia `skipWaiting`/`clientsClaim` sam tylko dla `injectRegister: 'auto'` lub `null`; przy własnej rejestracji trzeba je podać w `workbox` jawnie.
- Z `base: './'` plugin generuje względne `start_url`, `scope` i `href` manifestu; po rozwiązaniu względem `/index.html` dają `/`, ale sprawdzenia instalowalności Chrome porównują wartości bezwzględne, więc bezpieczniej podać `buildBase: '/'`, `scope: '/'`, `manifest.start_url: '/'`, `manifest.scope: '/'`. `build.assetsDir: '_app'` nie koliduje: plugin wyprowadza z `assetsDir` wzorzec `dontCacheBustURLsMatching`, `manualChunks` nie wpływa na globbing. Domyślny limit `maximumFileSizeToCacheInBytes` to 2 097 152 B; chunk Phasera (ok. 1,4 MB w buildzie F-01) mieści się.
- Phaser 4.2.1: `ORIENTATION_CHANGE` niesie surowy `screen.orientation.type` (także `landscape-secondary`), `isPortrait`/`isLandscape` porównują tylko z `-primary`, a `lockOrientation()` woła usunięte `screen.lockOrientation` i zwraca `false` w nowoczesnych przeglądarkach (`node_modules/phaser/src/scale/ScaleManager.js`, `src/dom/GetScreenOrientation.js`). Wniosek: nakładka „Obróć tablet” jako element DOM nad canvasem sterowany `@media (orientation: portrait)`, nie przez API Phasera; blokada orientacji przez manifest (`orientation: landscape`) działa na Androidzie (WebAPK), na iOS manifest `orientation` nie jest honorowany.
- Wykrycie instalacji: `matchMedia('(display-mode: standalone)')` lub `'(display-mode: fullscreen)'` plus `navigator.standalone === true` (iOS). iPad w Safari podaje UA Maca: `navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1`. Android: `/Android/.test(ua)`. `beforeinstallprompt` jest tylko w Chromium i jest bramkowane heurystyką zaangażowania (co najmniej jedno stuknięcie i ok. 30 s na stronie wg web.dev), więc instrukcja tekstowa musi zostać jako fallback. iOS 16.4+ instaluje z `display: standalone|fullscreen` w manifeście (`fullscreen` zachowuje się jak standalone), potrzebuje `<link rel="apple-touch-icon" sizes="180x180">`.
- Audio: Phaser 4 sam rejestruje odblokowanie Web Audio na `document.body` (touchstart/touchend/mousedown/mouseup/keydown); nakładki DOM nie mogą zatrzymywać propagacji pierwszego dotknięcia. Nic do konfigurowania w S-01.
- Ikony: paczka `designs/martynka-maths-A-v1/` ma 12 ikon liczmanów, ale nie ma ikony aplikacji; `qlmanage` i ImageMagick nie działają w sandboxie. Placeholder ikon (192, 512, 180 dla iOS, osobny wpis `purpose: 'maskable'`) wygeneruje skrypt Node bez zależności (PNG przez `zlib`), w stylu paczki (turkus `#54BEB4`, masło `#F1CE6B`, kość słoniowa `#FFF5DF`).
- `deploy/`: Caddyfile ma `@immutable path /assets/*` i `@nocache path / /index.html /sw.js /manifest.webmanifest` (`deploy/Caddyfile:13-19`); po zmianie na `/_app/*` ponowny bootstrap wykonuje agent: `ssh martynka-ops sync`, potem `ssh martynka-ops bootstrap` (`deploy/ops/martynka-ops-root:67-90`). Health check workflow sprawdza tylko `/` (`.github/workflows/deploy.yml:106`); warto dodać `manifest.webmanifest` i `sw.js`.

## Detailed Findings

### 1. vite-plugin-pwa 2.0.0 na Vite 6.4

Źródła: `vite-pwa-org.netlify.app/guide/{auto-update,register-service-worker,static-assets,pwa-minimal-requirements,faq,development}.html`, repo `vite-pwa/vite-plugin-pwa` (`src/options.ts`, `src/utils.ts`, `src/html.ts`, `src/client/build/register.ts`, releases), `npm view vite-plugin-pwa` (2026-10-11).

- Wersja `latest` = 2.0.0; peer: `vite ^3.1.0 || ^4 || ^5 || ^6 || ^7 || ^8`, `workbox-build ^7.4.1`, `workbox-window ^7.4.1`, `@vite-pwa/assets-generator ^1 || ^2`; `dependencies.workbox-build ^7.4.1`. Node ≥ 20.19 (repo ma `engines.node >= 22`, `package.json:11-13`).
- `registerType: 'autoUpdate'` ustawia `workbox.skipWaiting = clientsClaim = true` tylko dla `injectRegister: 'auto'` (domyślne) lub `null` (`src/options.ts`). `'auto'` = wstrzyknięcie `<script src="registerSW.js">`, chyba że kod importuje moduł wirtualny. `'inline'` wstrzykuje rejestrację do `index.html`. `null` = rejestracja własna.
- Domyślne: `filename: 'sw.js'`, `manifestFilename: 'manifest.webmanifest'`, `globDirectory = outDir`, `globPatterns = ['**/*.{js,css,html}']`, `devOptions.enabled = false`. Ikony manifestu z `public/` są precache'owane automatycznie; `includeAssets` jest potrzebne tylko dla plików z `public/` spoza `globPatterns` i manifestu. Rozszerzenie `globPatterns` do `**/*.{js,css,html,png,webp,ogg,m4a,woff2}` obejmuje przyszłą grafikę i dźwięk z `public/assets/` (precache z rewizją = hash treści, więc podmiana nienazwanego hashem pliku jest wykrywana).
- `maximumFileSizeToCacheInBytes` domyślnie 2 097 152 B; od v0.20.2 przekroczenie przerywa build. `inlineWorkboxRuntime: true` (opcja `generateSW` workbox-build) wkleja runtime Workbox do `sw.js` zamiast osobnego `workbox-<hash>.js`.
- Semantyka aktualizacji (`src/client/build/register.ts`, workbox-window): bez modułu wirtualnego nowy SW aktywuje się od razu (skipWaiting + clientsClaim), ale otwarta strona nie jest przeładowywana; następne uruchomienie dostaje nowy build. Z `registerSW()` w trybie `autoUpdate` zdarzenie `activated` z `isUpdate || isExternal` → `onNeedReload()` (od v1.3.0) albo `window.location.reload()`. Przeglądarka sprawdza `sw.js` przy każdej nawigacji; nagłówek `no-cache` z F-02 utrzymuje to świeże. Wbudowanego okresowego sprawdzania nie ma.
- `base: './'`: `resolveBasePath('./')` zwraca `'./'`, więc `start_url`, `scope`, `href` manifestu i `register('./sw.js', { scope: './' })` są względne; względem `/index.html` rozwiązują się do `/`. Dla jednoznaczności: `buildBase: '/'`, `scope: '/'`, `manifest: { start_url: '/', scope: '/' }`.
- `build.assetsDir: '_app'`: plugin ustawia `dontCacheBustURLsMatching = /^_app\//` (hashowane bundle bez dodatkowej rewizji). Nazewnictwo `manualChunks` nie ma znaczenia dla globów.

### 2. Phaser 4.2.1: orientacja, audio

Źródła: `node_modules/phaser/src/scale/ScaleManager.js`, `src/dom/GetScreenOrientation.js`, `src/sound/webaudio/WebAudioSoundManager.js` (4.2.1), docs.phaser.io (Scale/Sound events), MDN (`ScreenOrientation.lock`, `@media (orientation)`, `display-mode`, `beforeinstallprompt`, `StorageManager.persist`).

- `ORIENTATION_CHANGE` (`'orientationchange'`) emitowane z `updateOrientation()` z jednym argumentem: surowy `screen.orientation.type` gdy API istnieje, czyli `landscape-primary | landscape-secondary | portrait-primary | portrait-secondary`. `Phaser.Scale.LANDSCAPE === 'landscape-primary'`, więc porównanie `=== LANDSCAPE` pomija `landscape-secondary`; `isPortrait`/`isLandscape` mają tę samą wadę. `isGamePortrait`/`isGameLandscape` porównują wymiary gry (1920×1080), więc zawsze „landscape”. Phaser nasłuchuje `screen.orientation 'change'` (fallback `window.orientationchange`), nie `resize`.
- `lockOrientation()` woła `screen.lockOrientation`/`mozLockOrientation`/`msLockOrientation` (usunięte z przeglądarek), nigdy `screen.orientation.lock()`; w tej sprawdzonej ścieżce zwraca `false`. `screen.orientation.lock('landscape')` działa na Androidzie w Chrome tylko w pełnym ekranie lub zainstalowanej PWA; iOS Safari nie obsługuje `lock` (odrzuca `NotSupportedError`).
- `@media (orientation: portrait)` liczy się z viewportu (wysokość ≥ szerokość), nie z urządzenia: iPad w Split View/Slide Over może zgłosić „portrait” w poziomie. Gra nie ma pól tekstowych (klawiatura ekranowa nie zmieni viewportu). W PWA `display: fullscreen` nic się nie zmienia.
- Audio: `WebAudioSoundManager` ustawia `locked = context.state === 'suspended'` i przy BOOT rejestruje na `document.body` handlery touchstart/touchend/mousedown/mouseup/keydown, które wołają `context.resume()`; następna klatka emituje `Phaser.Sound.Events.UNLOCKED`. Konfiguracja `audio: { noAudio, disableWebAudio }` tylko przełącza menedżer. Nakładki DOM nie mogą wołać `stopPropagation()` na pierwszym dotknięciu.

### 3. iPad i Android: instalacja, wykrywanie, ikony

Źródła: webkit.org blog 13878, bugs.webkit.org 264220 i 280181, web.dev `install-criteria` (aktualizacja 2024-09), `maskable-icon`, developer.chrome.com `update-install-criteria`, MDN `Making PWAs installable`, forum Apple 649097.

- iOS 16.4+: manifest z `display: standalone|fullscreen` wystarcza do „Do ekranu początkowego”; `apple-mobile-web-app-capable` ma znaczenie tylko dla starszych iOS. `fullscreen` zachowuje się jak standalone (pasek stanu zostaje; błędy WebKit 264220, 280181). `orientation` z manifestu nie jest honorowane na iOS. `<link rel="apple-touch-icon" sizes="180x180">` ma pierwszeństwo przed ikonami manifestu (od 15.4). `<meta name="theme-color">` już jest w `index.html:6`.
- Android Chrome: `beforeinstallprompt` (tylko Chromium) po spełnieniu kryteriów (HTTPS, manifest z `name|short_name`, `start_url`, `display`, ikony 192 i 512 PNG) i zaangażowaniu (co najmniej jedno stuknięcie i ok. 30 s wg web.dev; dokładne progi mogą się zmieniać). Wywołanie `prompt()` z handlera dotknięcia, raz na zdarzenie; `appinstalled` istnieje. Instalacja daje WebAPK, który honoruje `fullscreen` i `orientation: landscape`. Z menu Chrome instalacja działa też bez zdarzenia.
- Wykrywanie zainstalowania: `matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true`. Uwaga: `fullscreen` pasuje też przy aktywnym Fullscreen API. iPad: `navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1`; iPhone/iPod: `/iPhone|iPod/.test(ua)`; Android: `/Android/.test(ua)`. Heurystyki, nie gwarancje.
- `maskable`: nie jest wymagane do instalacji; jeśli dodane, jako osobny wpis `purpose: 'maskable'` (strefa bezpieczna = okrąg o promieniu 40 % boku), nie `'any maskable'`.
- `navigator.storage.persist()`: Chrome przyznaje po cichu wg zaangażowania/instalacji; WebKit przyznaje m.in. aplikacjom z ekranu początkowego i mówi, że trwałe originy „mogą być wyłączone” z usuwania; limit 7 dni ITP dotyczy Safari, aplikacje z ekranu początkowego mają własny licznik resetowany użyciem (stare zgłoszenia 232302, 237350 o utracie danych). Wniosek dla roadmapy („czy iPad utrzymuje dane PWA bez dodania do ekranu”): bez dodania do ekranu dane w Safari podlegają 7-dniowemu limitowi; po dodaniu w praktyce nie. Wywołanie `persist()` i eksport JSON (S-11/S-12) to zabezpieczenia.

### 4. Stan repo i `deploy/` (sprawdzone pliki)

- `vite/config.dev.mjs` i `vite/config.prod.mjs`: oba `base: './'`, `manualChunks: { phaser: ['phaser'] }`, port 8080; prod dodatkowo `minify: 'terser'`. Brak pluginów. Brak `build.assetsDir` (domyślnie `assets`).
- `index.html:1-17`: `lang="pl"`, viewport bez zoomu z `viewport-fit=cover`, `theme-color #FFF5DF`, `favicon.png` (16×16), `style.css`, skrypt `/src/main.ts`. `public/`: tylko `favicon.png` i `style.css`; `public/assets/` nie istnieje.
- `public/style.css`: `touch-action: none`, brak zaznaczania, `body` `position: fixed`, `#game-container` 100 %; brak reguł dla nakładek i orientacji.
- `src/main.ts`: `createGame('game-container')`; `src/data/pl.ts`: `title`, `bootPlaceholder`; `src/data/layout.ts`: `PAGE_BACKGROUND '#FFF5DF'`, paleta placeholderów. `tsconfig.json`: `include: ["src"]`, `strict`, `lib` z `DOM`.
- `deploy/Caddyfile:12-19`: `@immutable path /assets/*` (immutable), `@nocache path / /index.html /sw.js /manifest.webmanifest`. `deploy/bootstrap.sh:183-237`: Caddyfile z szablonu przez `sed`/`awk`, `caddy fmt`, `cmp` z `/etc/caddy/Caddyfile`, `.bak`, `caddy validate`. `deploy/ops/martynka-ops-root:67-90`: `sync` = `git fetch origin main && merge --ff-only`, `bootstrap` = `bootstrap.sh` z `/etc/martynka/ops.conf`.
- `.github/workflows/deploy.yml:94,106`: rsync `dist/` do wydania; health check `curl … "$SITE_URL/" | grep -q "Martynka urządza"`.
- Przegląd F-02 (`context/archive/2026-10-11-static-deploy-pipeline/reviews/impl-review.md` F1, ACCEPTED): przenieść hashowane bundle do `build.assetsDir: '_app'` i matcher Caddy na `/_app/*`, żeby przyszła grafika z `public/assets/` nie dostała `immutable`.
- Narzędzia do ikon w sandboxie: `qlmanage` kończy się „sandbox initialization failed: Operation not permitted”, `magick`/`convert`/`rsvg-convert` brak; Node 22 dostępny. Paczka `designs/martynka-maths-A-v1/` nie ma ikony aplikacji (sprawdzono `assets/icons/`, `source-art/`, `style-guide.md`, `README.md`).

## Code References

- `vite/config.dev.mjs:1-16`, `vite/config.prod.mjs:1-30` - konfiguracje Vite bez pluginów, `base: './'`, `manualChunks`
- `index.html:1-17` - meta, favicon, skrypt wejścia
- `public/style.css:1-40` - reguły dotyku; brak nakładek
- `src/main.ts:1-22` - konfiguracja gry, `createGame`
- `src/data/pl.ts:1-5` - teksty; `src/data/layout.ts:17-22` - `PAGE_BACKGROUND`, paleta
- `deploy/Caddyfile:12-19` - matchery cache
- `deploy/bootstrap.sh:183-237` - krok Caddyfile
- `deploy/ops/martynka-ops-root:67-90` - `sync`, `bootstrap`
- `.github/workflows/deploy.yml:106` - health check
- `node_modules/phaser/src/scale/ScaleManager.js`, `src/dom/GetScreenOrientation.js`, `src/sound/webaudio/WebAudioSoundManager.js` - orientacja i odblokowanie audio (4.2.1)

## Architecture Insights

- Teksty nakładek („Obróć tablet”, instrukcja instalacji) muszą pochodzić z `src/data/pl.ts`; nakładki DOM tworzone z TypeScriptu (nie wpisane w `index.html`) spełniają regułę „zero tekstów poza `data/`”.
- Wspólna część obu konfiguracji Vite (plugin PWA, `assetsDir`, `manualChunks`) prosi się o jeden moduł bazowy, żeby dev i prod nie rozjechały się w opcjach PWA.
- Rejestracja SW we własnym module TS (`injectRegister: null`, `navigator.serviceWorker.register('/sw.js')`) daje dokładnie „cichą aktualizację przy następnym starcie” bez `workbox-window` i bez przeładowań w trakcie gry; wymaga jawnych `skipWaiting`/`clientsClaim` w `workbox`.
- Generowane ikony to placeholder; docelowa ikona przyjdzie z grafiką (M7) i podmieni pliki bez zmian w kodzie.

## Historical Context (from prior changes)

- `context/archive/2026-10-11-game-shell-scaling/`: CSS dotyku weszło do F-01 (przegląd: `touch-action` na kontenerze i canvasie), nakładka orientacji przesunięta do S-01.
- `context/archive/2026-10-11-static-deploy-pipeline/`: Caddyfile przewiduje `sw.js` i `manifest.webmanifest` jako `no-cache`; follow-up `_app` (F1 przeglądu).
- `context/archive/2026-10-11-agent-ops-access/`: agent wykonuje `sync` + `bootstrap` sam.
- `context/foundation/roadmap.md` Open Question 4: cicha aktualizacja (FR-003) zamiast „prompt” z planu, potwierdzić w S-01.

## Related Research

- `context/archive/2026-10-11-game-shell-scaling/research.md` (wersje, Scale Manager)
- `context/archive/2026-10-11-static-deploy-pipeline/research.md` (Caddy, rrsync, workflow)

## Open Questions

1. Instrukcja instalacji: pokazać raz na przeglądarkę (flaga lokalna) czy przy każdym uruchomieniu w przeglądarce do czasu instalacji? FR-001 mówi „przy pierwszym uruchomieniu”; decyzja produktowa do planu.
2. Czy na komputerze (Chrome/Safari myszką) instrukcja jest pomijana? FR-001 dotyczy iPada/Androida; propozycja: pomijać.
3. `navigator.storage.persist()`: S-01 (przy starcie) czy S-11 (razem z zapisem)? Propozycja: S-11, bo w S-01 nie ma jeszcze danych do ochrony.
