---
date: 2026-10-11T13:09:28+02:00
researcher: Claude (orkiestrator, sesja 2026-10-11)
git_commit: f7c9198
branch: main
repository: Martynka-urzadza
topic: "F-01 game-shell-scaling: co z szablonu Phaser Vite TS zostaje, co wylatuje, i jak skonfigurować Phaser 4.2 na scenę 1920×1080 FIT + CENTER_BOTH"
tags: [research, codebase, phaser4, vite, scale-manager, template, M0]
status: complete
last_updated: 2026-10-11
last_updated_by: Claude (orkiestrator)
---

# Research: F-01 game-shell-scaling

**Date**: 2026-10-11T13:09:28+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-11)
**Git Commit**: f7c9198
**Branch**: main
**Repository**: Martynka-urzadza

## Research Question

Roadmapa F-01 (`context/foundation/roadmap.md`, etap M0): gra ma startować na Phaser 4.2.x w scenie 1920×1080 dopasowanej do ekranu (`Phaser.Scale.FIT` + `CENTER_BOTH`), z pustą sceną, docelowym układem katalogów (`core/` bez importów silnika, `data/`, `scenes/`, `storage/`, `tests/`) i bez telemetrii szablonu; `npx tsc --noEmit` przechodzi. Pytania: (1) które pliki szablonu zostają, które wylatują; (2) jaka jest poprawna konfiguracja Phaser 4 dla skalowania i czy v4 zmienia coś w minimalnym szkielecie; (3) które wersje zależności są aktualne i zgodne ze sobą; (4) co z `context/` i CLAUDE.md wiąże ten wycinek.

## Summary

- Repo to nietknięty szablon `phaserjs/template-vite-ts` 1.4.0 z `phaser` 4.0.0, Vite 6.3.2 i TypeScript 5.7.3 (`package.json:17-30`, `node_modules/*/package.json`). Aktualny Phaser to 4.2.1 (npm `latest`, 2026-07-09); 4.0.0 jest trzy wydania za nim. Wydanie 4.1.0 naprawiło brak domyślnego eksportu w buildzie ESM, więc `import Phaser from 'phaser'` działa dopiero od 4.1; szablon używa importów nazwanych (`src/game/main.ts:5`), które działają w obu.
- Konfiguracja skalowania `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 1920, height: 1080 }` jest poprawna dla v4: `FIT` i `CENTER_BOTH` istnieją w zainstalowanych typach (`node_modules/phaser/types/phaser.d.ts:123827`, `:123775`), a ten sam kształt pokazuje oficjalna dokumentacja Scale Managera i oficjalny skill `scale-and-responsive`. Szablon nie ma bloku `scale` wcale (`src/game/main.ts:10-23`: `width: 1024, height: 768`).
- Orientacja: Scale Manager v4 udostępnia `scale.orientation`, `isPortrait/isLandscape`, `lockOrientation(orientation)` (best-effort, Screen Orientation API) i zdarzenie `Phaser.Scale.Events.ORIENTATION_CHANGE` (`phaser.d.ts:123171`, `:123460`). Nakładka „Obróć tablet” (FR-002) należy do S-01, ale szkielet F-01 może już wystawić te sygnały.
- Zmiany v3→v4 istotne dla minimalnego szkieletu w tej sprawdzonej ścieżce: domyślne `roundPixels` zmieniło się na `false`; usunięto `render.pipeline` (cały system Pipeline), BitmapMask (zastąpiony filtrem Mask), `phaser-ie9.js` i `Create.GenerateTexture`. `type: Phaser.AUTO` nadal oznacza WebGL z fallbackiem Canvas; Canvas jest w v4 oznaczony jako deprecated. `Phaser.Scene` z `preload/create/update`, `scene.start()`, `Graphics` (`fillStyle`, `fillRect`, `fillRoundedRect`, `fillCircle`) i `Text` są bez zmian; to wystarcza na placeholdery rysowane w kodzie.
- Telemetria szablonu to dwa miejsca: `log.js:11-15` (GET do gryzor.co, uruchamiany przez skrypty `dev` i `build`, `package.json:17-18`) oraz plugin `phasermsg` w `vite/config.prod.mjs:3-17,44-46`, który tylko drukuje baner (bez sieci). Skrypty `dev-nolog`/`build-nolog` (`package.json:19-20`) są czyste.
- Zgodność wersji: `vite-plugin-pwa` 2.0.0 deklaruje peer `vite ^3.1 … ^8.0` i `workbox-* ^7.4.1`; `vitest` 5.0.3 wymaga `vite ^6.4.0 || ^7 || ^8`, czyli zainstalowany Vite 6.3.2 jest za niski dla vitest 5 (potrzebny co najmniej 6.4.0). Najnowsze w rejestrze: Vite 8.3.4, TypeScript 7.0.2, vitest 5.0.3, idb-keyval 6.3.0. F-01 potrzebuje tylko podbicia Phasera; decyzja o Vite/TS/vitest należy do planu (F-03 wprowadza vitest, więc wtedy Vite musi być ≥ 6.4).
- Oficjalne pliki skills Phasera istnieją: folder `skills/` w `phaserjs/phaser` (28 skilli, m.in. `game-setup-and-config`, `scale-and-responsive`, `scenes`, `graphics-and-shapes`, `v3-to-v4-migration`), instalowane przez `npx skills add phaserjs/phaser`. Plan (sekcja 3) prosi o ich instalację; `.claude/` jest gitignorowane (`.gitignore:27`), więc instalacja jest lokalna.

## Detailed Findings

### 1. Inwentaryzacja szablonu (co zostaje, co wylatuje)

Zbadane: `src/`, `public/`, `index.html`, `vite/`, `tsconfig.json`, `package.json`, `README.md`, `LICENSE`, `log.js`, `screenshot.png`, `.gitignore`. Werdykty poniżej dotyczą dokładnie tych plików.

- `src/main.ts:1,5` importuje `./game/main` i woła `StartGame('game-container')`. Do przepisania (nowy punkt wejścia z docelowym układem).
- `src/game/main.ts:10-23`: `type: AUTO`, `width: 1024`, `height: 768`, `parent: 'game-container'` (:14), `backgroundColor: '#028af8'`, pięć scen (:16-22), brak bloku `scale`. Do przepisania i przeniesienia do `src/scenes/`.
- `src/game/scenes/Boot.ts:15` ładuje `assets/bg.png`, `:20` startuje `Preloader`. `Preloader.ts:13,33,35`, `MainMenu.ts:16,18`, `Game.ts:19`, `GameOver.ts:19` używają `bg`/`logo` na 512/384. Wszystkie pięć scen demo do usunięcia; nowy pusty `BootScene` wg planu (sekcja 4).
- `public/assets/bg.png`, `public/assets/logo.png`: do usunięcia. `public/favicon.png` (favicon Phasera, 354 B): do podmiany lub tymczasowego zostawienia. `screenshot.png`: do usunięcia (używany tylko w `README.md:15`).
- `README.md`: treść szablonu (sekcje `:1`, `:15`, `:21-29`, `:43-83`, `:91-95`, `:97-141` „About log.js”, `:156` copyright logo Phasera). Do przepisania na README projektu.
- `log.js:11-15`: żądanie GET do gryzor.co; wywoływane z `package.json:17-18` (`dev`, `build`). Do usunięcia razem z sufiksami `-nolog` (po usunięciu `log.js` skrypty `dev`/`build` stają się czyste).
- `package.json:2-15`: `name: template-vite-ts`, opis „Phaser 3”, URL-e repo phaserjs. Do przepisania. `:27` `phaser: "4.0.0"` (pin bez caret), `:28` `terser` w `dependencies` (powinien być w `devDependencies`, używany tylko przez build).
- `vite/config.dev.mjs`: neutralny (`base: './'`, `manualChunks phaser` :8-10, port 8080 :15). Zostaje.
- `vite/config.prod.mjs:3-17,44-46`: plugin `phasermsg` (baner „Tell us about your game”) do usunięcia; `manualChunks` (:25-27), `minify: 'terser'` (:30) i `terserOptions` (:31-39) zostają.
- `tsconfig.json:26-28`: `include: ["src"]`, więc `tests/` nie jest objęte typowaniem; `strict`, `noUnusedLocals`, `noUnusedParameters` włączone (:19-23). Rozszerzenie `include` o `tests/` to decyzja F-03, nie F-01.
- `src/vite-env.d.ts`: zostaje. `LICENSE:3`: „Copyright (c) 2025 Phaser Studio Inc” (MIT szablonu); wymaga decyzji właściciela (zostawić jako licencję szablonu lub zastąpić własną). `.gitignore` nie dotyka `src/`, `public/`, `tests/`; `dist` ignorowane (:11), `.claude/` (:27), `context/runs/` (:30).
- `index.html`: tytuł „Phaser - Template” (:8), kontener `#app` > `#game-container` (:12-13), viewport `width=device-width, initial-scale=1.0` bez `user-scalable=no`/`maximum-scale` (:6). `public/style.css` nie ma `touch-action`, `user-select` ani `overscroll`; `body` ciemne tło (:1-6), `#app` 100vh, `overflow: hidden`, flex centrowanie (:8-15). Wymagania planu (sekcja 9: `touch-action: none`, brak zaznaczania, przewijania, zoomu) nie są spełnione; to F-01 (szkielet) lub S-01 (PWA), do rozstrzygnięcia w planie.
- Brak `tests/`, `.github/`, konfiguracji vitest i eslint (sprawdzono root repo i `package.json`); `devDependencies` to tylko `typescript` i `vite`.

### 2. Phaser 4: skalowanie, orientacja, zmiany względem v3

Źródła: zainstalowane `node_modules/phaser/types/phaser.d.ts` (4.0.0), docs.phaser.io (Scale Manager, API `Scale.ScaleManager` oznaczone v4.1.0), `changelog/v4/4.0/MIGRATION-GUIDE.md` i wydania 4.0.0–4.2.1 na GitHubie, folder `skills/` w repo phaserjs/phaser.

- `Phaser.Types.Core.ScaleConfig` ma pola `width, height, zoom, parent, expandParent, mode, min, max, snap, autoRound, autoCenter, resizeInterval, fullscreenTarget`; przykład w d.ts (`:123265`) używa `autoCenter: Phaser.Scale.CENTER_BOTH`. `FIT` (`:123827`) i `CENTER_BOTH` (`:123775`) istnieją.
- Orientacja: `scale.orientation` (string, `Phaser.Scale.LANDSCAPE` / `PORTRAIT` = `'landscape-primary'` / `'portrait-primary'`), `isPortrait`/`isLandscape` (urządzenie) oraz `isGamePortrait`/`isGameLandscape`, `lockOrientation(orientation): boolean` (`:123460`, Screen Orientation API, tylko mobile, best-effort), zdarzenie `ORIENTATION_CHANGE` = `'orientationchange'` (`:123171`). W notatkach wydań 4.0–4.2 nie ma zmian w Scale Managerze poza poprawką „ScaleManager not resizing to parent container” w 4.2.1.
- Renderer: `type: Phaser.AUTO` = WebGL z fallbackiem Canvas; migration guide: Canvas „still available but should be considered deprecated”. Domyślne `roundPixels` zmieniło się z `true` (v3) na `false` (v4). Klucze `RenderConfig` w 4.0.0 d.ts: `antialias, antialiasGL, desynchronized, pixelArt, smoothPixelArt, roundPixels, selfShadow, pathDetailThreshold, transparent, clearBeforeRender, preserveDrawingBuffer, premultipliedAlpha, skipUnreadyShaders, failIfMajorPerformanceCaveat, powerPreference, batchSize, maxLights, maxTextures, mipmapFilter, autoMobileTextures, renderNodes`; 4.1 dodaje `mipmapRegeneration`, 4.2 `alphaStrategy`, `stencil`, `stencilAlphaStrategy`. Usunięte względem v3 (wg migration guide; lista może być niepełna): `render.pipeline` i system Pipeline, BitmapMask (→ filtr Mask), `phaser-ie9.js`, `Create.GenerateTexture`.
- Sceny i rysowanie: `Phaser.Scene` z `preload/create/update(time, delta)` i `ScenePlugin.start<T>(key, data?)` bez zmian; `Graphics` ma `fillStyle, lineStyle, fillRect, strokeRect, fillRoundedRect, strokeRoundedRect, fillCircle, generateTexture` plus nowe `pathDetailThreshold`; `Text` bez zmian w notatkach 4.x.
- ESM: `package.json` Phasera eksportuje `import → dist/phaser.esm.js`, `require → dist/phaser.js`, `types → types/phaser.d.ts`; build ESM ma eksporty nazwane. 4.1.0: „Fix lack of default export in ESM build”, więc domyślny import wymaga ≥ 4.1. Jedyna oficjalna wskazówka o chunkach to `manualChunks: { phaser: ['phaser'] }` jak w szablonie.
- Oficjalne skills: `https://github.com/phaserjs/phaser/tree/master/skills` (28 folderów SKILL.md, m.in. `game-setup-and-config`, `scale-and-responsive`, `scenes`, `graphics-and-shapes`, `text-and-bitmaptext`, `v3-to-v4-migration`, `v4-new-features`); README repo: „Point your AI coding agent at the `skills/` folder”; instalacja `npx skills add phaserjs/phaser` (`--skill <name> --agent claude-code` per skill, wg skills.sh). context7 (`/websites/phaser_io_phaser4`) miał prawie pustą treść; fakty pochodzą z docs.phaser.io, GitHub i d.ts.

### 3. Wersje w rejestrze npm (stan 2026-10-11)

Sprawdzone `npm view` z tymczasowym cache (sandbox blokuje `~/.npm/_cacache`).

| Pakiet | Zainstalowane | Latest | Uwaga |
|---|---|---|---|
| phaser | 4.0.0 | 4.2.1 (2026-07-09) | 4.x: 4.0.0 (04-10), 4.1.0 (04-30), 4.2.0 (06-19), 4.2.1 |
| vite | 6.3.2 | 8.3.4 | vitest 5 wymaga vite ≥ 6.4.0 |
| typescript | 5.7.3 | 7.0.2 | duży skok; bez potrzeby dla F-01 |
| vitest | — | 5.0.3 | peer: vite ^6.4.0 ‖ ^7 ‖ ^8 (F-03) |
| vite-plugin-pwa | — | 2.0.0 | peer: vite ^3.1…^8.0, workbox-build/window ^7.4.1 (S-01) |
| idb-keyval | — | 6.3.0 | (S-11) |

### 4. Decyzje z `context/` i CLAUDE.md wiążące F-01

- `context/foundation/roadmap.md` F-01: Outcome, Unlocks (S-01, F-03, S-04), Parallel with F-02, Status ready; NFR: cele dotykowe ≥ 96 px w scenie 1920×1080, prywatność (zero żądań sieciowych).
- `context/foundation/tech-stack.md`: Phaser 4.2.x + TS + Vite, npm, deploy self-host; `quality_override: true` (szablon Vite nie narzuca konwencji; kompensacja = układ katalogów z planu).
- `Martynka-urzadza.md` sekcja 4 (układ katalogów), sekcja 9 (`Phaser.Scale.FIT` + `CENTER_BOTH`, 1920×1080, CSS `touch-action: none`, wyłączone zaznaczanie/przewijanie/zoom, nakładka „Obróć tablet”, czcionka lokalna), sekcja 11 M0 (usunięcie `log.js`, cicha aktualizacja i instrukcja instalacji są w S-01), sekcja 14 (logika w `core/` z testami; żadnych liczb balansu ani tekstów w scenach).
- `CLAUDE.md`: `npm run dev-nolog`, `npx tsc --noEmit` (Vite nie typuje), placeholdery rysowane w kodzie do M5, komentarze i identyfikatory po angielsku.
- `AGENTS.md`: `core/` bez importów Phasera, sceny bez balansu i tekstów, nazwy scen PascalCase.

## Code References

- `src/main.ts:1-5` - punkt wejścia szablonu (`StartGame('game-container')`)
- `src/game/main.ts:10-23` - GameConfig 1024×768 bez `scale`, pięć scen demo
- `src/game/scenes/Boot.ts:15,20` - ładowanie `assets/bg.png`, start `Preloader`
- `log.js:11-15` - GET do gryzor.co (telemetria szablonu)
- `package.json:17-20` - skrypty `dev`/`build` z `log.js`, `-nolog` bez; `:27` `phaser: "4.0.0"`; `:28` `terser` w dependencies
- `vite/config.prod.mjs:3-17,44-46` - plugin `phasermsg`; `:25-27` manualChunks; `:30-39` terser
- `vite/config.dev.mjs:8-10,15` - manualChunks, port 8080
- `tsconfig.json:19-23,26-28` - strict + noUnused*, include tylko `src`
- `index.html:6,8,12-13` - viewport, tytuł, kontener
- `public/style.css:1-15` - body i `#app`
- `node_modules/phaser/types/phaser.d.ts:123171,123265,123460,123775,123827` - ORIENTATION_CHANGE, przykład autoCenter, lockOrientation, CENTER_BOTH, FIT
- `designs/martynka-maths-A-v1/fonts/AtkinsonHyperlegibleNext.ttf` - jedyny format fontu (TTF, 114 552 B); `screen.css` deklaruje `@font-face` family `Atkinson`, weight 100–900

## Architecture Insights

- Szablon trzyma konfigurację gry w `src/game/main.ts` i sceny w `src/game/scenes/`; plan przenosi to do `src/scenes/` + `src/main.ts`, a logikę do `src/core/`. Jedyny mechanizm wymuszający „brak Phasera w core/” to konwencja (AGENTS.md); techniczne wymuszenie (np. reguła lint lub test importów) nie istnieje i jest kandydatem do F-03.
- Vite używa `base: './'`, a `index.html` odwołuje się do `/favicon.png` i `/style.css` ścieżkami absolutnymi; Vite przepisuje je przy buildzie, ale PWA (S-01) musi to sprawdzić na tablecie.
- `manualChunks: { phaser: ['phaser'] }` w obu konfiguracjach to jedyna oficjalna wskazówka Phasera dla Vite; zostaje.

## Historical Context (from prior changes)

Brak wcześniejszych zmian w `context/changes/` i `context/archive/` (to pierwsza zmiana w repo). Decyzje nadrzędne: `context/foundation/shape-notes.md` (runda sokratejska FR-001–003), `prd.md`, `tech-stack.md`, `roadmap.md` F-01.

## Related Research

Nie dotyczy (pierwszy dokument badawczy w repo).

## Open Questions

1. Czy F-01 podbija tylko Phasera (do 4.2.1), czy też Vite do ≥ 6.4 (wymóg vitest 5 w F-03) albo od razu do 8.x i TypeScript do 7? Zalecenie do planu: Phaser 4.2.1 teraz, Vite/TS bez zmian w F-01, decyzja o Vite przy F-03.
2. Czy CSS `touch-action: none` / brak zaznaczania / brak zoomu (plan, sekcja 9) wchodzi do F-01 (szkielet) czy S-01 (PWA)? Roadmapa nie rozstrzyga.
3. `LICENSE` szablonu (Phaser Studio Inc, MIT): zostawić, czy zastąpić własną licencją projektu? Decyzja właściciela.
4. Czy instalować oficjalne skills Phasera (`npx skills add phaserjs/phaser`) w gitignorowanym `.claude/` w ramach F-01? Plan sekcja 3 o to prosi; nie wpływa na build.
5. `public/favicon.png` szablonu: podmiana wymaga ikony z paczki A v1 lub placeholdera; ikony PWA 192/512 są w S-01.
