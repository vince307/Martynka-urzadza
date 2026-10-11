# Szkielet gry na Phaser 4.2 w scenie 1920×1080 — Implementation Plan

## Overview

Roadmapa F-01 (`game-shell-scaling`, etap M0). Zamieniamy nietknięty szablon `phaserjs/template-vite-ts` w szkielet gry „Martynka urządza”: Phaser 4.2.1, scena bazowa 1920×1080 dopasowana do ekranu (`Phaser.Scale.FIT` + `CENTER_BOTH`), pusta scena startowa z placeholderem rysowanym w kodzie, docelowy układ katalogów (`src/core/` bez importów silnika, `src/data/`, `src/scenes/`, `src/ui/widgets/`, `src/storage/`, `tests/`), strona bez zoomu, przewijania i zaznaczania, zero telemetrii szablonu. Odblokowuje S-01 (PWA), F-03 (harness testów) i każdą scenę.

## Current State Analysis

Z `context/changes/game-shell-scaling/research.md`:

- Szablon 1.4.0: `phaser` 4.0.0 (pin), Vite 6.3.2, TypeScript 5.7.3 (`package.json:17-30`). Konfiguracja gry 1024×768 bez bloku `scale` (`src/game/main.ts:10-23`), pięć scen demo (`src/game/scenes/*.ts`) ładujących `public/assets/bg.png` i `logo.png`.
- Telemetria: `log.js:11-15` (GET do gryzor.co) uruchamiany przez skrypty `dev` i `build` (`package.json:17-18`); plugin `phasermsg` w `vite/config.prod.mjs:3-17,44-46` drukuje baner (bez sieci). Skrypty `-nolog` są czyste.
- `index.html:6,8,12-13`: viewport bez `user-scalable=no`, tytuł szablonu, kontener `#app > #game-container`. `public/style.css` nie ma `touch-action`, `user-select` ani `overscroll`.
- `tsconfig.json:19-28`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `include: ["src"]`.
- Phaser 4.2.1 jest `latest` (2026-07-09). `FIT` i `CENTER_BOTH` istnieją w v4 (`node_modules/phaser/types/phaser.d.ts:123827`, `:123775`); API `Scene`, `Graphics`, `Text` bez zmian; domyślne `roundPixels` to teraz `false`. ESM ma eksporty nazwane (szablon używa `import { AUTO, Game } from 'phaser'`).
- vitest 5 (F-03) wymaga Vite ≥ 6.4.0; Vite 6.x latest to 6.4.4 (Node ^18 ‖ ^20 ‖ ≥22; lokalnie Node 22.22.3).
- `LICENSE:3`: Copyright Phaser Studio Inc. Brak `tests/`, `.github/`, eslint, vitest.
- Hooki agenta (`.claude/hooks`, gitignorowane) uruchamiają `npx tsc --noEmit` na koniec tury; eslint i vitest pomijane, dopóki nie są zainstalowane.

## Desired End State

Po `npm install` i `npm run build` w `dist/` jest build bez żadnego odwołania do gryzor.co; `npx tsc --noEmit` przechodzi; `npm run dev` otwiera stronę `Martynka urządza`, na której canvas 1920×1080 skaluje się do okna z letterboxem i jest wyśrodkowany, nie da się przewinąć, zaznaczyć tekstu ani powiększyć strony; scena startowa rysuje w kodzie kolorowy placeholder z tytułem z `src/data/pl.ts`. Katalogi `src/core`, `src/data`, `src/scenes`, `src/ui/widgets`, `src/storage`, `tests` istnieją, `src/core/types.ts` zawiera typy z planu (sekcja 5) i nie importuje Phasera. README, CLAUDE.md i AGENTS.md opisują nowy stan. Weryfikacja: polecenia w Success Criteria każdej fazy.

### Key Discoveries:

- `src/game/main.ts:10-23` to jedyne miejsce z GameConfig; brak `scale` oznacza, że nic z szablonu nie trzeba „naprawiać”, tylko zastąpić.
- `vite/config.dev.mjs` i `vite/config.prod.mjs` dzielą `manualChunks: { phaser: ['phaser'] }` (jedyna oficjalna wskazówka Phasera dla Vite); zostaje w obu.
- `index.html` odwołuje się do `/favicon.png` i `/style.css` ścieżkami absolutnymi przy `base: './'`; Vite przepisuje je przy buildzie, więc zostawiamy ten wzorzec (sprawdzi go S-01 na tablecie).
- Sandbox agenta nie pozwala zapisywać do `.claude/skills`, więc instalację skilli Phasera wykonuje użytkownik ręcznie (kryterium ręczne).

## What We're NOT Doing

- Manifest PWA, service worker, cicha aktualizacja, instrukcja instalacji, nakładka „Obróć tablet”, ikony 192/512, podmiana favicon (S-01).
- Deploy, GitHub Actions, Caddy (F-02).
- vitest, seedowany rng, skrypt `sample`, rozszerzenie `tsconfig` o `tests/` (F-03).
- ESLint (hooki go pomijają; wejdzie przy F-03 lub `/10x-configure-hook`).
- Font Atkinson Hyperlegible Next, paleta i jakakolwiek grafika z `designs/` (M7); placeholder używa kolorów ze style-guide tylko jako stałych w `data/`.
- Podbicie Vite do 8.x i TypeScript do 7.x (zdecydowano: Vite 6.4.x, TS 5.7).
- Logika gry, generatory, zapis (M1+).

## Implementation Approach

Trzy fazy, każda z osobnym commitem i weryfikacją: najpierw czysty szablon z właściwymi zależnościami (żeby build i install były sprawdzone zanim dotkniemy kodu), potem szkielet gry ze skalowaniem i układem katalogów, na końcu dokumentacja i skills. Kod sceny nie zawiera tekstów ani liczb balansu: tytuł pochodzi z `src/data/pl.ts`, wymiary sceny i kolory placeholdera z `src/data/layout.ts`. `src/core/types.ts` powstaje już teraz, żeby układ „core bez Phasera” był widoczny od pierwszego commitu.

## Critical Implementation Details

**Kolejność w fazie 1.** Najpierw usuń `log.js` i skrypty `-nolog`, dopiero potem uruchom `npm install`/`npm run build`; w przeciwnym razie build szablonu wyśle żądanie do gryzor.co.

**Zoom na iOS.** `user-scalable=no` w viewport nie wystarcza w Safari; pinch-zoom blokuje dopiero `touch-action: none` na `html, body` plus `-webkit-text-size-adjust: 100%`. Oba trzeba ustawić.

## Phase 1: Zależności i czyszczenie szablonu

### Overview

Repo przestaje być szablonem Phaser Studio: właściwe wersje zależności, metadane projektu, zero telemetrii, zero plików demo, własna licencja.

### Changes Required:

#### 1. package.json

**File**: `package.json`

**Intent**: Nadać projektowi własną tożsamość i wersje, usunąć skrypty z telemetrią.

**Contract**: `name: "martynka-urzadza"`, `version: "0.1.0"`, `private: true`, `description` po polsku, `license: "MIT"`, bez pól `repository`/`author`/`bugs`/`homepage` szablonu. Skrypty: `dev` → `vite --config vite/config.dev.mjs`, `build` → `vite build --config vite/config.prod.mjs`, `preview` → `vite preview --config vite/config.prod.mjs`, `typecheck` → `tsc --noEmit`; brak `dev-nolog`/`build-nolog`. `dependencies`: `phaser: "^4.2.1"`. `devDependencies`: `vite: "^6.4.4"`, `typescript: "~5.7.2"`, `terser: "^5.51.2"` (przeniesiony z dependencies). `engines.node: ">=22"`.

#### 2. Usunięcie telemetrii i banera

**File**: `log.js` (usunąć), `vite/config.prod.mjs`

**Intent**: Żadnych żądań sieciowych ani banerów szablonu przy dev/build (NFR prywatności).

**Contract**: `log.js` nie istnieje. `vite/config.prod.mjs` bez funkcji `phasermsg` i bez `plugins: [phasermsg()]`; `base: './'`, `manualChunks`, `minify: 'terser'` i `terserOptions` zostają. `vite/config.dev.mjs` bez zmian.

#### 3. Usunięcie demo

**File**: `src/game/` (cały katalog), `public/assets/bg.png`, `public/assets/logo.png`, `screenshot.png`

**Intent**: Sceny i grafika demo nie mają w grze żadnego zastosowania.

**Contract**: Wymienione ścieżki nie istnieją. `public/favicon.png` zostaje do S-01. Faza 1 zastępuje `src/main.ts` minimalnym plikiem `import { VERSION } from 'phaser'; console.log('Phaser', VERSION);` (bez scen), żeby build nadal bundlował Phasera i sprawdzał import ESM 4.2.1; faza 2 wstawia właściwe wejście. Zweryfikowano w przeglądzie planu: build z wpisem `manualChunks` dla nieimportowanego modułu też przechodzi (pusty chunk), więc import jest potrzebny tylko do weryfikacji wersji, nie do poprawności builda.

#### 4. LICENSE

**File**: `LICENSE`

**Intent**: Prawidłowy właściciel w publicznym repo z atrybucją szablonu.

**Contract**: MIT, `Copyright (c) 2026 vince307` (login z git config; użytkownik może podać inną nazwę), a po treści licencji akapit: szkielet projektu pochodzi z `phaserjs/template-vite-ts` (MIT, Copyright (c) 2025 Phaser Studio Inc).

### Success Criteria:

#### Automated Verification:

- `npm install` kończy się bez błędów, a `node -e "console.log(require('phaser/package.json').version)"` wypisuje `4.2.1` i `node -e "console.log(require('vite/package.json').version)"` wypisuje wersję `6.4.x`
- `npm run build` kończy się kodem 0, tworzy `dist/index.html`, a chunk `dist/assets/phaser-*.js` ma rozmiar > 100 kB (Phaser 4.2.1 jest bundlowany)
- `grep -rn "gryzor\|phasermsg\|log.js" package.json vite/ src/ index.html` nie zwraca nic, a `test ! -e log.js && test ! -d src/game && test ! -e screenshot.png && test ! -e public/assets/logo.png` przechodzi
- `npx tsc --noEmit` przechodzi

#### Manual Verification:

- `LICENSE` ma Twoją nazwę w copyright i akapit o szablonie Phaser Studio

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Szkielet gry, skalowanie i układ katalogów

### Overview

Gra startuje w scenie 1920×1080 dopasowanej do ekranu, z pustą sceną startową rysującą placeholder w kodzie; powstaje docelowy układ katalogów i pierwsze pliki `core/` oraz `data/`.

### Changes Required:

#### 1. Stałe układu i teksty

**File**: `src/data/layout.ts`, `src/data/pl.ts`

**Intent**: Sceny nie zawierają liczb ani tekstów; wymiary sceny, kolory placeholdera i tytuł żyją w `data/`.

**Contract**: `layout.ts` eksportuje `GAME_WIDTH = 1920`, `GAME_HEIGHT = 1080`, `MIN_TOUCH_TARGET = 96` oraz obiekt `PLACEHOLDER_COLORS` z kolorami ze style-guide paczki A (`ivory: 0xFFF5DF`, `turquoise: 0x54BEB4`, `deepTeal: 0x245C59`, `butter: 0xF1CE6B`). `pl.ts` eksportuje obiekt `pl` z kluczem `title: 'Martynka urządza'` i `bootPlaceholder: 'Szkielet gry'`. Oba pliki bez importów Phasera.

#### 2. Typy domeny

**File**: `src/core/types.ts`

**Intent**: Zakotwiczyć zasadę „core bez Phasera” pierwszym plikiem z typami z planu, z których skorzystają M1–M5.

**Contract**: Eksportuje dokładnie typy z `Martynka-urzadza.md` sekcja 5: `StageId`, `SkillDef`, `SlotDef`, `RoomTaskDef`, `RoomDef`, `LearnerState`, `RoomState`, `Settings`, `SaveState`. Zero importów. Komentarze po angielsku.

#### 3. Scena startowa

**File**: `src/scenes/BootScene.ts`

**Intent**: Pusta scena, która dowodzi skalowania: tło w kolorze ivory, ramka na krawędzi sceny (widać letterbox i centrowanie), kwadrat 96×96 w rogu jako wzorzec minimalnego celu dotykowego, tytuł z `pl.title` na środku.

**Contract**: `export class BootScene extends Phaser.Scene` z kluczem `'Boot'`; `create()` rysuje przez `this.add.graphics()` (`fillStyle`, `fillRect`, `lineStyle`, `strokeRect`) i `this.add.text(...)` z `setOrigin(0.5)`; używa wyłącznie stałych z `src/data/layout.ts` i tekstów z `src/data/pl.ts`. Bez `preload` (nic do ładowania). Import: `import { Scene } from 'phaser'` lub `import Phaser from 'phaser'` (oba działają od 4.1).

#### 4. Wejście i konfiguracja gry

**File**: `src/main.ts`

**Intent**: Jedno miejsce z GameConfig; skalowanie FIT + CENTER_BOTH do kontenera.

**Contract**: `new Game({ type: AUTO, parent: 'game-container', backgroundColor: <ivory z layout.ts>, scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH, width: GAME_WIDTH, height: GAME_HEIGHT }, scene: [BootScene] })` po `DOMContentLoaded`. Importy nazwane z `'phaser'`. Żadnych liczb poza importowanymi z `data/`.

#### 5. Strona i CSS dotykowy

**File**: `index.html`, `public/style.css`

**Intent**: Strona zachowuje się jak gra na dotyk: bez zoomu, przewijania, zaznaczania i menu kontekstowego; tytuł i język polski.

**Contract**: `index.html`: `<html lang="pl">`, `<title>Martynka urządza</title>`, viewport `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`, `<meta name="theme-color" content="#FFF5DF">`, tylko `<div id="game-container">` (bez `#app`), skrypt `/src/main.ts`. `style.css`: `html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:#FFF5DF; touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none; overscroll-behavior:none; -webkit-text-size-adjust:100% }`, `#game-container { width:100%; height:100%; }`, `canvas { display:block; }`.

#### 6. Układ katalogów

**File**: `src/ui/widgets/.gitkeep`, `src/storage/.gitkeep`, `tests/.gitkeep`

**Intent**: Docelowe katalogi z planu istnieją w repo od razu, żeby kolejne wycinki nie decydowały o układzie.

**Contract**: Trzy puste pliki `.gitkeep`; `src/core/`, `src/data/`, `src/scenes/` mają już realne pliki z punktów 1–4.

### Success Criteria:

#### Automated Verification:

- `npx tsc --noEmit` przechodzi
- `npm run build` kończy się kodem 0, a `dist/assets/` zawiera osobny chunk `phaser-*.js`
- `grep -rln "phaser" src/core src/data` nie zwraca nic (core i data bez importów silnika)
- `grep -n "1920\|1080\|Martynka" src/scenes/*.ts src/main.ts` nie zwraca nic (liczby i teksty tylko w `data/`)
- `test -d src/ui/widgets && test -d src/storage && test -d tests` przechodzi

#### Manual Verification:

- W przeglądarce (`npm run dev`, http://localhost:8080) canvas jest wyśrodkowany, a przy zmianie rozmiaru okna (16:9, 4:3, bardzo szerokie) zachowuje proporcje z letterboxem i nie pojawia się pasek przewijania
- Pinch/ctrl+scroll nie powiększa strony, długie przytrzymanie nie zaznacza tekstu ani nie otwiera menu, przeciąganie nie przewija (Chrome desktop plus, jeśli dostępny, tablet)
- Placeholder: tło ivory, ramka na krawędzi sceny, kwadrat 96×96 w rogu, tytuł „Martynka urządza” na środku

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Dokumentacja i narzędzia

### Overview

Repo opisuje nowy stan, a agent ma oficjalne wskazówki Phasera 4.

### Changes Required:

#### 1. README

**File**: `README.md`

**Intent**: README projektu zamiast README szablonu.

**Contract**: Po polsku: jedno zdanie o grze, wymagania (Node ≥ 22), komendy (`npm install`, `npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`), układ katalogów (`src/core`, `src/data`, `src/scenes`, `src/ui/widgets`, `src/storage`, `tests`, `public/assets`, `designs/`), odsyłacze do `Martynka-urzadza.md`, `docs/ZADANIA.md`, `context/foundation/`, nota o szablonie Phaser Studio. Bez sekcji „About log.js”.

#### 2. CLAUDE.md i AGENTS.md

**File**: `CLAUDE.md`, `AGENTS.md`

**Intent**: Sekcje o stanie bieżącym i komendach nie mogą opisywać szablonu, którego już nie ma.

**Contract**: `CLAUDE.md`: sekcja „Current state” opisuje szkielet (Phaser 4.2.1, Vite 6.4, scena 1920×1080, układ katalogów, brak PWA/testów/deployu), sekcja „Commands” bez `dev-nolog`/`build-nolog`/`log.js`, z `npm run typecheck`; zdanie o `package.json` pinującym 4.0.0 usunięte. `AGENTS.md`: „Project structure” i „Commands” analogicznie; obecnie plik ma 402 słowa (z nagłówkami), więc przy edycji skrócić go co najmniej o kilka słów, żeby kryterium ≤ 400 przeszło. Reszta bez zmian.

#### 3. Skills Phasera

**File**: `.claude/skills/` (gitignorowane; instalacja ręczna)

**Intent**: Agent sprawdza API v4 w oficjalnych wskazówkach zamiast pamięci o v3 (plan, sekcja 3).

**Contract**: Użytkownik uruchamia w katalogu projektu: `npx skills add phaserjs/phaser --skill game-setup-and-config --skill scale-and-responsive --skill scenes --skill graphics-and-shapes --skill v3-to-v4-migration --agent claude-code`. Po instalacji w `.claude/skills/` jest 5 nowych katalogów z `SKILL.md`. Sandbox agenta nie może zapisać do `.claude/skills`, więc agent tylko podaje komendę i sprawdza wynik.

### Success Criteria:

#### Automated Verification:

- `grep -n "nolog\|log.js\|4\.0\.0" CLAUDE.md AGENTS.md README.md` nie zwraca nic
- `tail -n +2 AGENTS.md | wc -w` zwraca ≤ 400
- `npx tsc --noEmit` i `npm run build` nadal przechodzą

#### Manual Verification:

- `ls .claude/skills` pokazuje `game-setup-and-config`, `scale-and-responsive`, `scenes`, `graphics-and-shapes`, `v3-to-v4-migration` (po ręcznym uruchomieniu komendy)
- README czyta się jak opis projektu, nie szablonu

---

## Testing Strategy

### Unit Tests:

- Brak w F-01 (vitest wchodzi w F-03). `src/core/types.ts` to same typy, sprawdzane przez `tsc`.

### Integration Tests:

- Brak; integracja to build Vite i start gry w przeglądarce (kryteria ręczne fazy 2).

### Manual Testing Steps:

1. `npm run dev`, otwórz http://localhost:8080 w Chrome, zmieniaj rozmiar okna: canvas ma stałe proporcje 16:9, jest wyśrodkowany, bez pasków przewijania.
2. Spróbuj powiększyć stronę (ctrl+scroll / pinch na trackpadzie) i zaznaczyć tekst: nic się nie dzieje.
3. Sprawdź placeholder: tło ivory, ramka sceny, kwadrat 96×96 w rogu, tytuł na środku.
4. Jeśli dostępny tablet w tej samej sieci: uruchom `npm run dev -- --host`, otwórz na tablecie adres z konsoli Vite i powtórz 1–3 dotykiem.

## Performance Considerations

Brak zmian wpływających na wydajność; `manualChunks` wydziela Phasera do osobnego pliku, co S-01 wykorzysta w precache.

## Migration Notes

Nie dotyczy (brak danych użytkownika; szablon nie był wdrożony).

## References

- Related research: `context/changes/game-shell-scaling/research.md`
- Roadmapa F-01: `context/foundation/roadmap.md`
- Plan projektu, sekcje 4, 9, 11 (M0), 14: `Martynka-urzadza.md`
- Konfiguracja skalowania Phaser 4: `node_modules/phaser/types/phaser.d.ts:123265` (przykład `autoCenter`), docs.phaser.io/phaser/concepts/scale-manager
- Kolory placeholdera: `designs/martynka-maths-A-v1/style-guide.md` (paleta)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Zależności i czyszczenie szablonu

#### Automated

- [x] 1.1 `npm install` bez błędów; phaser 4.2.1 i vite 6.4.x zainstalowane — cceac34
- [x] 1.2 `npm run build` kończy się kodem 0 i tworzy `dist/index.html` z chunkiem phaser > 100 kB — cceac34
- [x] 1.3 Brak `gryzor`/`phasermsg`/`log.js` w package.json, vite/, src/, index.html; log.js, src/game, screenshot.png, logo.png usunięte — cceac34
- [x] 1.4 `npx tsc --noEmit` przechodzi — cceac34

#### Manual

- [x] 1.5 LICENSE z właściwym copyright i akapitem o szablonie — cceac34

### Phase 2: Szkielet gry, skalowanie i układ katalogów

#### Automated

- [x] 2.1 `npx tsc --noEmit` przechodzi — b734829
- [x] 2.2 `npm run build` kończy się kodem 0 z osobnym chunkiem phaser — b734829
- [x] 2.3 Brak importów phaser w src/core i src/data — b734829
- [x] 2.4 Brak liczb 1920/1080 i tekstu „Martynka” w src/scenes i src/main.ts — b734829
- [x] 2.5 Katalogi src/ui/widgets, src/storage, tests istnieją — b734829

#### Manual

- [x] 2.6 Canvas wyśrodkowany, letterbox, bez przewijania przy zmianie rozmiaru okna — b734829
- [x] 2.7 Brak zoomu, zaznaczania, menu kontekstowego i przewijania dotykiem — b734829
- [x] 2.8 Placeholder: tło ivory, ramka, kwadrat 96×96, tytuł na środku — b734829

### Phase 3: Dokumentacja i narzędzia

#### Automated

- [x] 3.1 Brak `nolog`/`log.js`/`4.0.0` w CLAUDE.md, AGENTS.md, README.md
- [x] 3.2 AGENTS.md ≤ 400 słów
- [x] 3.3 `npx tsc --noEmit` i `npm run build` przechodzą

#### Manual

- [ ] 3.4 Skills Phasera zainstalowane w .claude/skills (5 katalogów)
- [x] 3.5 README opisuje projekt, nie szablon
