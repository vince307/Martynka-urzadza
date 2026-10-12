# Instalowalna gra offline na tablecie (PWA) — Implementation Plan

## Overview

Roadmapa S-01 (`installable-offline-pwa`, etap M0, zamyka M0). Gra dostaje manifest i service worker z `vite-plugin-pwa` 2.0.0 (precache całego buildu, cicha aktualizacja przy następnym uruchomieniu, FR-003), nakładkę DOM „Obróć tablet” w pionie (FR-002) oraz instrukcję „Dodaj do ekranu początkowego” pokazywaną przy każdym starcie z karty przeglądarki na iPadzie i Androidzie do czasu instalacji (FR-001, decyzja z planowania). Przy okazji realizuje follow-up przeglądu F-02: hashowane bundle Vite trafiają do `_app/`, a matcher `immutable` w Caddy na `/_app/*`; ponowny bootstrap VPS wykonuje agent przez `martynka-ops`.

## Current State Analysis

Z `context/changes/installable-offline-pwa/research.md`:

- `vite/config.dev.mjs` i `vite/config.prod.mjs` powielają `base: './'`, `manualChunks` i port; brak pluginów, brak `build.assetsDir` (domyślnie `assets/`). `index.html` ma `lang="pl"`, viewport bez zoomu, `theme-color #FFF5DF`, 16-pikselowy `favicon.png`. `public/` to tylko `favicon.png` i `style.css`. `src/main.ts` woła `createGame('game-container')`; `src/data/pl.ts` ma dwa teksty. `tsconfig.json` obejmuje tylko `src`.
- `vite-plugin-pwa` 2.0.0 (peer Vite ^6, workbox ^7.4.1, `@vite-pwa/assets-generator` opcjonalny) domyślnie generuje `sw.js` i `manifest.webmanifest`; `registerType: 'autoUpdate'` bez modułu wirtualnego daje aktualizację bez przeładowania bieżącej strony, a `skipWaiting`/`clientsClaim` plugin ustawia sam dla `injectRegister: 'auto'` i `null` (w konfiguracji zostają jawnie dla czytelności). Z `assetsDir: '_app'` plugin sam ustawia `dontCacheBustURLsMatching`.
- Phaser 4.2.1: `lockOrientation()` nie działa w nowoczesnych przeglądarkach, `isPortrait` pomija orientacje `-secondary`; audio odblokowuje się samo na pierwszym dotknięciu `document.body`. Nakładka orientacji musi być w DOM i nie może zatrzymywać propagacji dotknięcia.
- iPad: instalacja tylko przez Udostępnij → Do ekranu początkowego, `orientation` z manifestu ignorowane, potrzebna `apple-touch-icon` 180. Android Chrome: `beforeinstallprompt` bramkowane zaangażowaniem, instrukcja tekstowa jako fallback; WebAPK honoruje `fullscreen` i `landscape`.
- Ikony aplikacji nie ma w paczce graficznej; w sandboxie działa tylko Node, więc placeholder ikon generuje skrypt bez zależności.
- `deploy/Caddyfile:13-19`: `@immutable path /assets/*`, `@nocache path / /index.html /sw.js /manifest.webmanifest`. Health check workflow sprawdza tylko `/` (`.github/workflows/deploy.yml:106`). Agent ma `ssh martynka-ops sync` i `bootstrap`.

## Desired End State

Po merge i bootstrapie: `https://martynka-urzadza.pl/manifest.webmanifest` zwraca manifest z `name "Martynka urządza"`, `display fullscreen`, `orientation landscape`, ikonami 192/512 i `Cache-Control: no-cache`; `/sw.js` jest `no-cache`, `/_app/<hash>.js` jest `immutable`, `/assets/` nie istnieje. Na iPadzie i Androidzie otwarcie adresu w przeglądarce pokazuje instrukcję instalacji z przyciskiem „Zagraj w przeglądarce”; po dodaniu do ekranu gra startuje z ikony na pełnym ekranie bez instrukcji, także w trybie samolotowym; w pionie widać „Obróć tablet”, w poziomie znika. Na komputerze instrukcji nie ma. Na ekranie startowym w rogu widać identyfikator builda (krótki SHA), więc po kolejnym wdrożeniu drugie uruchomienie z ikony pokazuje nowy SHA bez pytania o aktualizację.

### Key Discoveries:

- `registerType: 'autoUpdate'` + własna rejestracja (`navigator.serviceWorker.register('/sw.js')`) = nowy SW aktywny od razu, strona bez przeładowania, nowy build przy następnym starcie (research §1).
- `base: './'` daje względne `start_url`/`scope`; gra jest pod rootem domeny, więc `base: '/'` upraszcza manifest, SW i `index.html` (research §1).
- `@media (orientation: portrait)` steruje nakładką bez API Phasera; na iPadzie Split View może pokazać ją w poziomie (akceptowane, research §2).
- Wykrycie iPada: `platform === 'MacIntel' && maxTouchPoints > 1`; instalacji: `display-mode: standalone|fullscreen` lub `navigator.standalone` (research §3).
- Plugin precache'uje ikony manifestu i wszystko z `globPatterns` w `dist/`, więc `public/icons/` i przyszłe `public/assets/` nie wymagają `includeAssets` (research §1).

## What We're NOT Doing

- Docelowa ikona i grafika (M7): ikony są placeholderem w kolorach paczki, podmienianym bez zmian w kodzie.
- `navigator.storage.persist()`, zapis stanu, migracje (S-11); blokada orientacji przez `screen.orientation.lock()` (manifest wystarcza na Androidzie, iOS nie wspiera).
- Czcionka lokalna z polskimi znakami (wchodzi ze scenami zadań, S-04); dźwięk; lektor.
- Ekran „gotowe offline”, powiadomienie o aktualizacji, okresowe sprawdzanie aktualizacji (FR-003 wyklucza pytanie; przeglądarka sprawdza `sw.js` przy każdym starcie).
- `devOptions.enabled` (SW w trybie dev) i `dev-dist/`; vitest (F-03): sprawdzenia czystych funkcji idą przez `node --experimental-strip-types`.
- Układ pionowy, telefon, inne przeglądarki (PRD Non-Goals).
- Zmiany w `deploy/bootstrap.sh`, `martynka-deploy`, `martynka-ops*`, workflow poza health checkiem.

## Implementation Approach

Trzy fazy. Faza 1 robi z buildu poprawną PWA (wspólna konfiguracja Vite z pluginem, `_app`, manifest, rejestracja SW, ikony, identyfikator builda) i jest sprawdzana lokalnie na `dist/` oraz w Chrome na `npm run preview`. Faza 2 dodaje nakładki DOM z tekstami z `data/pl.ts` i wykrywaniem platformy jako czystą funkcją. Faza 3 zmienia Caddyfile i health check, aktualizuje dokumentację, przechodzi przez PR → merge → deploy → `martynka-ops sync` + `bootstrap`, weryfikuje nagłówki z sesji agenta, a właściciel testuje instalację na obu tabletach. Konwencje z F-01: żadnych tekstów ani liczb w scenach, placeholdery rysowane w kodzie, identyfikatory po angielsku.

## Critical Implementation Details

**Rejestracja SW a tryb dev.** `vite dev` nie generuje `sw.js` (devOptions wyłączone), więc rejestracja musi być pominięta przy `import.meta.env.DEV`; w przeciwnym razie dev server zwróci `index.html` jako `sw.js` i zarejestruje śmieciowy worker w przeglądarce dewelopera. Na `npm run preview` SW działa (localhost jest bezpiecznym originem).

**Nakładki a pierwsze dotknięcie.** Phaser odblokowuje audio na handlerach `document.body`; przyciski nakładek nie mogą wołać `stopPropagation()`. Nakładka „Obróć tablet” leży nad instrukcją instalacji (`z-index`), bo w pionie instrukcja i tak nie jest czytelna.

**`beforeinstallprompt` przychodzi późno albo wcale.** Nasłuch musi być zarejestrowany przed pokazaniem instrukcji (na starcie modułu), a przycisk „Zainstaluj” dodawany do już widocznej nakładki w momencie zdarzenia; bez zdarzenia zostaje sama instrukcja tekstowa.

**Wszystko ładowane na starcie.** Nowy SW przejmuje otwartą stronę (`clientsClaim`) i usuwa stary precache (`cleanupOutdatedCaches`); dopóki tak jest, build nie może mieć lazy chunków ani zasobów dociąganych w trakcie gry, bo stara strona offline dostałaby błąd. Przy wprowadzeniu lazy-loadingu (M6/M7) rozważyć `clientsClaim: false`.

**Identyfikator builda.** `vite/config.shared.mjs` definiuje `__BUILD_ID__` z `GITHUB_SHA` (CI) albo `git rev-parse --short HEAD` (lokalnie), z fallbackiem `dev`; deklaracja typu w `src/vite-env.d.ts`. To jedyny sposób, by właściciel sprawdził na tablecie, że cicha aktualizacja zaszła.

## Phase 1: PWA w buildzie (manifest, service worker, ikony, `_app`)

### Overview

Po `npm run build` `dist/` jest instalowalną PWA z pełnym precache; konfiguracja Vite jest wspólna dla dev i prod.

### Changes Required:

#### 1. Zależność

**File**: `package.json`, `package-lock.json`

**Intent**: Dodać `vite-plugin-pwa` 2.0.0 i skrypt generowania ikon.

**Contract**: `devDependencies.vite-plugin-pwa: "^2.0.0"` (npm dociąga `workbox-build`/`workbox-window` jako peer; `@vite-pwa/assets-generator` jest opcjonalny i NIE jest instalowany). Nowy skrypt `"icons": "node scripts/make-icons.mjs"`. Instalacja z `npm_config_cache="$TMPDIR/npm-cache"` (sandbox).

#### 2. Wspólna konfiguracja Vite

**File**: `vite/config.shared.mjs` (nowy), `vite/config.dev.mjs`, `vite/config.prod.mjs`

**Intent**: Jedno źródło dla `base`, `assetsDir`, `manualChunks`, `define` i pluginu PWA; dev i prod różnią się tylko `logLevel` i terserem.

**Contract**: `config.shared.mjs` eksportuje `sharedConfig` (obiekt: `base: '/'`, `build: { assetsDir: '_app', rollupOptions.output.manualChunks: { phaser: ['phaser'] } }`, `define: { __BUILD_ID__: JSON.stringify(buildId()) }`, `server.port: 8080`, `plugins: [VitePWA(pwaOptions)]`) oraz stałą `THEME_COLOR = '#FFF5DF'` z komentarzem, że musi równać się `PAGE_BACKGROUND` w `src/data/layout.ts`. `pwaOptions`: `registerType: 'autoUpdate'`, `injectRegister: null`, `manifest: { name: 'Martynka urządza', short_name: 'Martynka', lang: 'pl', start_url: '/', scope: '/', display: 'fullscreen', orientation: 'landscape', background_color: THEME_COLOR, theme_color: THEME_COLOR, icons: [192 any, 512 any, 512 maskable] z `public/icons/` }`, `workbox: { globPatterns: ['**/*.{js,css,html,png,webp,ogg,m4a,woff2}'], skipWaiting: true, clientsClaim: true, cleanupOutdatedCaches: true, inlineWorkboxRuntime: true }`. `buildId()`: `process.env.GITHUB_SHA?.slice(0, 7)` → `git rev-parse --short HEAD` (try/catch) → `'dev'`. Oba configi: `defineConfig({ ...sharedConfig, ...własne })` z głębokim scaleniem `build` (`mergeConfig` z Vite).

#### 3. Ikony placeholder

**File**: `scripts/make-icons.mjs` (nowy), `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `public/icons/apple-touch-icon-180.png`, `public/favicon.png` (podmiana na 48×48)

**Intent**: Deterministyczne ikony w stylu paczki (tło turkus `#54BEB4`, pięcioramienna gwiazda `#F1CE6B` w strefie bezpiecznej maskable), bez zależności binarnych.

**Contract**: Skrypt pisze PNG (RGBA, `zlib.deflateSync`, CRC32 w kodzie) dla listy `[name, size, maskable]`; gwiazda wpisana w okrąg o promieniu 0,3 boku (mieści się w strefie 40 %); dla wariantów `any` tło z zaokrąglonymi rogami (promień 0,2 boku) na przezroczystym, dla `maskable` tło pełne. Uruchomienie dwa razy daje identyczne bajty (brak czasu w nagłówkach PNG). Pliki PNG są commitowane.

#### 4. `index.html`

**File**: `index.html`

**Intent**: Meta i ikony dla iOS; ścieżki bez zmian (plugin dopisuje `<link rel="manifest">`).

**Contract**: Dodać `<link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon-180.png">`, `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-title" content="Martynka">`. `theme-color` zostaje (`#FFF5DF`).

#### 5. Rejestracja service workera i identyfikator builda

**File**: `src/pwa/registerServiceWorker.ts` (nowy), `src/vite-env.d.ts`, `src/main.ts`, `src/data/layout.ts`, `src/scenes/BootScene.ts`

**Intent**: Rejestracja `sw.js` w produkcji bez przeładowań; SHA builda widoczny w rogu ekranu startowego.

**Contract**: `registerServiceWorker(): void` — jeśli `import.meta.env.DEV` lub brak `navigator.serviceWorker`, nic; inaczej na `window` `load` `navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)` (błąd rejestracji nie może zepsuć gry). `src/vite-env.d.ts`: `declare const __BUILD_ID__: string;`. `src/main.ts` woła `registerServiceWorker()` po `createGame`. `FONT_SIZES.caption: 32` w `layout.ts`; `BootScene` rysuje `__BUILD_ID__` tekstem w lewym dolnym rogu (margines `PLACEHOLDER_FRAME.margin`) — to identyfikator techniczny, nie tekst dla gracza, więc nie trafia do `pl.ts`.

### Success Criteria:

#### Automated Verification:

- `npm run typecheck` przechodzi
- `npm run build` przechodzi; `test -f dist/sw.js && test -f dist/manifest.webmanifest && ls dist/_app/*.js && ! test -d dist/assets && ! ls dist/workbox-*.js 2>/dev/null`
- `node -e` czyta `dist/manifest.webmanifest` i potwierdza `name === 'Martynka urządza'`, `short_name === 'Martynka'`, `display === 'fullscreen'`, `orientation === 'landscape'`, `start_url === '/'`, `scope === '/'`, ikony z rozmiarami `192x192` i `512x512` oraz wpis `purpose: 'maskable'`
- `grep -c '_app/phaser' dist/sw.js` ≥ 1, `grep -c 'icons/icon-512.png' dist/sw.js` ≥ 1, `grep -c 'skipWaiting' dist/sw.js` ≥ 1
- `node scripts/make-icons.mjs && git status --porcelain public/icons public/favicon.png` jest puste (deterministyczne), a `file public/icons/*.png` pokazuje 192, 512, 512 i 180 px
- `grep -c 'FFF5DF' vite/config.shared.mjs src/data/layout.ts` daje po ≥ 1 w każdym pliku; `grep -c "__BUILD_ID__" dist/_app/index-*.js` wynosi 0 (stała podmieniona)

#### Manual Verification:

- W Chrome na `npm run preview` (agent przez Claude in Chrome): po przeładowaniu `navigator.serviceWorker.controller` nie jest `null`, `caches.keys()` zawiera cache workbox z wpisami `_app/`, manifest i `sw.js` odpowiadają 200, w rogu ekranu widać SHA builda

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Nakładki „Obróć tablet” i instrukcja instalacji

### Overview

Dwie nakładki DOM nad canvasem, teksty z `data/pl.ts`, wykrywanie platformy jako czysta funkcja.

### Changes Required:

#### 1. Teksty

**File**: `src/data/pl.ts`

**Intent**: Wszystkie napisy nakładek w jednym miejscu.

**Contract**: Dodać grupę `overlay`: `rotate: 'Obróć tablet'`, `rotateHint: 'Gra działa w poziomie.'`; grupę `install`: `title: 'Dodaj grę do ekranu początkowego'`, `ipad: 'Stuknij Udostępnij (kwadrat ze strzałką), potem „Do ekranu początkowego”.'`, `android: 'Stuknij menu ⋮ w prawym górnym rogu, potem „Dodaj do ekranu głównego” albo „Zainstaluj aplikację”.'`, `afterInstall: 'Potem uruchamiaj grę z ikony. Działa też bez internetu.'`, `installButton: 'Zainstaluj'`, `continueButton: 'Zagraj w przeglądarce'`. Krótkie zdania, poprawna polszczyzna, cudzysłowy „”.

#### 2. Wykrywanie platformy i trybu

**File**: `src/pwa/platform.ts` (nowy)

**Intent**: Decyzja „pokazać instrukcję?” jako czysta funkcja, sprawdzalna bez przeglądarki.

**Contract**: `type Platform = 'ipad' | 'iphone' | 'android' | 'other'`; `detectPlatform(nav: { userAgent: string; platform: string; maxTouchPoints: number }): Platform` (iPad: `/iPad/` w UA lub `platform === 'MacIntel' && maxTouchPoints > 1`; iPhone: `/iPhone|iPod/`; Android: `/Android/`); `isStandalone(win: { matchMedia: (q: string) => { matches: boolean }; navigator: { standalone?: boolean } }): boolean` (`display-mode: standalone` lub `fullscreen` lub `navigator.standalone === true`); `shouldShowInstallHint(platform, standalone): boolean` = `(platform === 'ipad' || platform === 'android') && !standalone`. Bez importów DOM-only poza typami, bez Phasera.

#### 3. Nakładki

**File**: `src/ui/dom/overlay.ts` (nowy), `src/ui/dom/rotateOverlay.ts` (nowy), `src/pwa/installHint.ts` (nowy), `public/style.css`, `src/main.ts`

**Intent**: „Obróć tablet” sterowane CSS; instrukcja instalacji pokazywana przy każdym starcie z przeglądarki na iPadzie/Androidzie, z „Zainstaluj” gdy Chrome da `beforeinstallprompt`.

**Contract**: `overlay.ts`: `createOverlay(className: string, children: HTMLElement[]): HTMLDivElement` oraz `createButton(label: string, onTap: () => void): HTMLButtonElement` (bez `stopPropagation`). `rotateOverlay.ts`: `mountRotateOverlay(parent: HTMLElement): void` — element `.overlay.overlay-rotate` z ikoną obróconego prostokąta (CSS) i tekstami `pl.overlay.*`; widoczność tylko przez CSS. `installHint.ts`: `mountInstallHint(parent: HTMLElement, platform: Platform): void` — jeśli `shouldShowInstallHint`, buduje `.overlay.overlay-install` z tytułem, instrukcją dla platformy, `afterInstall` i przyciskiem „Zagraj w przeglądarce” (usuwa nakładkę; bez zapamiętywania); na starcie modułu nasłuch `beforeinstallprompt` (`preventDefault`, zapamiętany event) dodający przycisk „Zainstaluj” (`prompt()` raz) i `appinstalled` usuwający nakładkę. `style.css`: `.overlay { position: fixed; inset: 0; display: none; flex-direction: column; align-items/justify-content: center; gap; background: #FFF5DF; color: #245C59; font-family: sans-serif; font-size: clamp(24px, 4vw, 48px); text-align: center; padding: 24px; z-index: 10 }`, `.overlay-install { display: flex; z-index: 10 }`, `.overlay-rotate { z-index: 20 }`, `@media (orientation: portrait) { .overlay-rotate { display: flex } }`, przyciski `min-height: 64px; min-width: 240px; font-size: inherit; border-radius: 16px; background: #54BEB4; color: #FFF5DF; border: 0`, ikona `.rotate-icon` (prostokąt 120×72 z obramowaniem, animacja obrotu 90° wyłączona przy `prefers-reduced-motion: reduce`). `main.ts`: po `createGame` → `mountRotateOverlay(document.body)`, `mountInstallHint(document.body, detectPlatform(navigator))`, `registerServiceWorker()`.

### Success Criteria:

#### Automated Verification:

- `npm run typecheck` i `npm run build` przechodzą
- `node --experimental-strip-types -e` importuje `src/pwa/platform.ts` i potwierdza: iPad (`MacIntel`, 5 punktów dotyku) → `ipad`; UA z `Android` → `android`; Mac bez dotyku → `other`; `shouldShowInstallHint('ipad', false) === true`, `('ipad', true) === false`, `('other', false) === false`
- `grep -c 'stopPropagation' src/ui/dom/*.ts src/pwa/*.ts` wynosi 0 w każdym pliku; `grep -cE "'[^']*[ąćęłńóśźż][^']*'" src/scenes/*.ts` wynosi 0 (żadnych polskich tekstów w scenach poza `pl.ts`)
- `grep -c 'orientation: portrait' public/style.css` ≥ 1, `grep -c 'prefers-reduced-motion' public/style.css` ≥ 1

#### Manual Verification:

- W Chrome na `npm run preview` (agent): okno zwężone do proporcji pionowych pokazuje „Obróć tablet” nad grą, poszerzone chowa ją; na komputerze instrukcja instalacji się nie pojawia; dotknięcie w nakładce nie blokuje gry pod spodem po jej zamknięciu

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Caddy, health check, dokumentacja i test na tabletach

### Overview

Serwer i workflow znają nowe ścieżki, dokumentacja opisuje stan faktyczny, zmiana jest zmergowana, VPS po bootstrapie, a właściciel potwierdza instalację i offline na iPadzie i Androidzie.

### Changes Required:

#### 1. Caddyfile

**File**: `deploy/Caddyfile`

**Intent**: `immutable` tylko dla hashowanych bundli.

**Contract**: `@immutable path /_app/*` (zamiast `/assets/*`), komentarz zaktualizowany; `@nocache` bez zmian (`/ /index.html /sw.js /manifest.webmanifest`).

#### 2. Health check

**File**: `.github/workflows/deploy.yml`

**Intent**: Deploy jest zielony tylko, gdy pliki PWA są serwowane.

**Contract**: Po istniejącym `curl … "$SITE_URL/" | grep -q "Martynka urządza"` dodać `curl -fsS "$SITE_URL/manifest.webmanifest" | grep -q '"Martynka urządza"'` oraz `curl -fsS -o /dev/null "$SITE_URL/sw.js"`.

#### 3. Dokumentacja

**File**: `deploy/README.md`, `CLAUDE.md`, `AGENTS.md`

**Intent**: Runbook i instrukcje agenta opisują PWA i `_app`.

**Contract**: `deploy/README.md`: runbook nie opisuje dziś nagłówków cache; w sekcji 1 (architektura) dodać akapit „PWA i cache” (`/_app/*` `immutable`, `/`, `index.html`, `sw.js`, `manifest.webmanifest` `no-cache`, aktualizacja gry przy następnym starcie z ikony) i w sekcji 10 zdanie, że po merge zmian w `deploy/` agent wykonuje `ssh martynka-ops sync`, potem `bootstrap`. `CLAUDE.md`: „Current state” (PWA obecna: manifest, SW, nakładki, `_app`, identyfikator builda), „Commands” (`npm run icons`, uwaga o `base: '/'` i `_app`, SW tylko w `preview`/produkcji). `AGENTS.md`: jedno zdanie o teksty nakładek w `pl.ts` i `_app`, limit 400 słów zachowany.

#### 4. Wdrożenie i bootstrap (agent) oraz test na tabletach (właściciel)

**File**: brak (GitHub, VPS, tablety)

**Intent**: Pierwsza instalowalna wersja w sieci.

**Contract**: Agent: push gałęzi, PR, merge po „merguj” (lub przez właściciela), oczekiwanie na zielony workflow, `ssh martynka-ops sync`, `ssh martynka-ops bootstrap`, `ssh martynka-ops status`; `curl -sI` z sesji agenta (`allowed_domains: martynka-urzadza.pl`). Właściciel: iPad Safari i Android Chrome wg kroków w „Manual Testing Steps”.

### Success Criteria:

#### Automated Verification:

- `grep -c '/_app/\*' deploy/Caddyfile` = 1 i `grep -c '/assets/' deploy/Caddyfile` = 0; `grep -c 'manifest.webmanifest' .github/workflows/deploy.yml` ≥ 1
- `ruby -ryaml -e 'YAML.load_file(".github/workflows/deploy.yml")'` parsuje; `tail -n +2 AGENTS.md | wc -w` ≤ 400
- Po deployu i bootstrapie, z sesji agenta: `curl -sI https://martynka-urzadza.pl/manifest.webmanifest` ma `cache-control: no-cache` i `content-type: application/manifest+json`; `curl -sI https://martynka-urzadza.pl/sw.js` ma `no-cache`; `curl -sI https://martynka-urzadza.pl/_app/<plik z dist>.js` ma `immutable`; `curl -fsS https://martynka-urzadza.pl/ | grep -c 'rel="manifest"'` ≥ 1

#### Manual Verification:

- Workflow „Deploy” zielony z rozszerzonym health checkiem; `ssh martynka-ops bootstrap` kończy się `[ok]` z „Caddyfile written”, `caddy-validate` przechodzi, CoiledSpring działa (`ssh cs-ops status`)
- iPad (Safari): adres w przeglądarce pokazuje instrukcję, „Zagraj w przeglądarce” ją chowa; po Udostępnij → Do ekranu początkowego ikona z gwiazdą na ekranie; start z ikony bez paska adresu Safari (pasek stanu iOS może zostać) i bez instrukcji; tryb samolotowy → start z ikony działa; pion → „Obróć tablet”, poziom → znika
- Android (Chrome): jak wyżej, dodatkowo „Zainstaluj” (jeśli Chrome dał zdarzenie) albo menu ⋮ → Zainstaluj aplikację; zainstalowana gra trzyma poziom
- Komputer (Chrome): brak instrukcji; SHA builda w rogu zgadza się z `git rev-parse --short origin/main`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Brak vitest (F-03); `src/pwa/platform.ts` sprawdzane przez `node --experimental-strip-types` w kryteriach fazy 2, a po F-03 ten sam moduł dostaje test vitest.

### Integration Tests:

- Build (`dist/` z `sw.js`, manifestem, `_app/`), Chrome na `npm run preview` (SW, cache, nakładki), health check workflow i `curl` nagłówków po deployu.

### Manual Testing Steps:

1. iPad Safari: otworzyć `https://martynka-urzadza.pl`, sprawdzić instrukcję i jej zamknięcie, dodać do ekranu początkowego, uruchomić z ikony, włączyć tryb samolotowy, uruchomić ponownie, obrócić do pionu i z powrotem.
2. Android Chrome: to samo; zwrócić uwagę na przycisk „Zainstaluj” lub menu ⋮.
3. Po kolejnym merge na `main`: uruchomić zainstalowaną grę dwa razy; za drugim razem SHA w rogu jest nowy, bez pytania.

## Performance Considerations

Precache ok. 1,5 MB (Phaser + ikony) pobierany raz przy pierwszym otwarciu; start offline czyta z cache SW (cel < 3 s). `inlineWorkboxRuntime` oszczędza jedno żądanie przy starcie. Nakładki to kilka elementów DOM bez wpływu na pętlę gry.

## Migration Notes

Zmiana `assets/` → `_app/`: stare wydania na VPS nadal mają `assets/`, ale Caddy serwuje tylko `current`; po deployu zainstalowana wcześniej PWA (jeśli ktoś dodał grę do ekranu w F-02) dostaje nowy SW i pełny precache przy następnym starcie. `base: './'` → `'/'`: ścieżki w `index.html` już są bezwzględne.

## References

- Related research: `context/changes/installable-offline-pwa/research.md`
- Roadmapa S-01: `context/foundation/roadmap.md`; PRD FR-001–FR-003, NFR
- Przegląd F-02 F1 (`_app`): `context/archive/2026-10-11-static-deploy-pipeline/reviews/impl-review.md`
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/guide/ (auto-update, register-service-worker, static-assets, pwa-minimal-requirements)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: PWA w buildzie (manifest, service worker, ikony, `_app`)

#### Automated

- [x] 1.1 `npm run typecheck` przechodzi — 2892476
- [x] 1.2 Build ma `sw.js`, manifest, `_app/*.js`, bez `assets/` i bez osobnego `workbox-*.js` — 2892476
- [x] 1.3 Manifest: name, short_name, fullscreen, landscape, start_url/scope `/`, ikony 192/512 i maskable — 2892476
- [x] 1.4 `sw.js` precache'uje `_app/phaser` i `icons/icon-512.png`, ma `skipWaiting` — 2892476
- [x] 1.5 Ikony deterministyczne (`git status` puste po regeneracji), rozmiary 192/512/512/180 — 2892476
- [x] 1.6 Kolor `#FFF5DF` w obu plikach; `__BUILD_ID__` podmienione w bundlu — 2892476

#### Manual

- [x] 1.7 Chrome na preview: SW kontroluje stronę, cache workbox z `_app/`, manifest i sw.js 200, SHA builda widoczny — 2892476

### Phase 2: Nakładki „Obróć tablet” i instrukcja instalacji

#### Automated

- [x] 2.1 `npm run typecheck` i `npm run build` przechodzą — fbd850e
- [x] 2.2 `platform.ts`: iPad/Android/other i `shouldShowInstallHint` sprawdzone przez `node --experimental-strip-types` — fbd850e
- [x] 2.3 Brak `stopPropagation` w nakładkach; brak nowych tekstów dla gracza w scenach — fbd850e
- [x] 2.4 `style.css` ma `orientation: portrait` i `prefers-reduced-motion` — fbd850e

#### Manual

- [x] 2.5 Chrome na preview: pion pokazuje „Obróć tablet”, poziom chowa; brak instrukcji na komputerze; gra reaguje po zamknięciu nakładki — fbd850e

### Phase 3: Caddy, health check, dokumentacja i test na tabletach

#### Automated

- [x] 3.1 Caddyfile `/_app/*` bez `/assets/`; workflow sprawdza manifest — e2bd7cc
- [x] 3.2 deploy.yml parsuje się jako YAML; AGENTS.md ≤ 400 słów — e2bd7cc
- [x] 3.3 Nagłówki na martynka-urzadza.pl: manifest i sw.js `no-cache`, `_app` `immutable`, `rel="manifest"` w HTML — ab029e4

#### Manual

- [x] 3.4 Workflow zielony; bootstrap `[ok]` z nowym Caddyfile; CoiledSpring działa — ab029e4
- [ ] 3.5 iPad: instrukcja, instalacja, start z ikony, offline, „Obróć tablet”
- [ ] 3.6 Android: instrukcja lub „Zainstaluj”, instalacja, start z ikony, offline, poziom
- [x] 3.7 Komputer: brak instrukcji; SHA builda zgodny z origin/main — ab029e4
