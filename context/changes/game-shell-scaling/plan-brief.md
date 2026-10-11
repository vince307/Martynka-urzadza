# Szkielet gry na Phaser 4.2 w scenie 1920×1080 — Plan Brief

> Full plan: `context/changes/game-shell-scaling/plan.md`
> Research: `context/changes/game-shell-scaling/research.md`

## What & Why

Roadmapa F-01 (etap M0): zamieniamy nietknięty szablon Phaser Vite TS w szkielet gry „Martynka urządza” na Phaser 4.2.1, ze sceną bazową 1920×1080 dopasowaną do ekranu, pustą sceną startową i docelowym układem katalogów. Bez tego nie da się zacząć żadnej sceny ani testów logiki; F-01 jest fundamentem o największym fan-oucie w roadmapie.

## Starting Point

Repo to szablon `phaserjs/template-vite-ts` 1.4.0: Phaser 4.0.0, Vite 6.3.2, TS 5.7, pięć scen demo z logo, konfiguracja 1024×768 bez bloku `scale`, telemetria `log.js` w skryptach `dev`/`build` i baner w configu prod, licencja Phaser Studio. Brak testów, lintera, PWA, deployu.

## Desired End State

`npm run dev` otwiera stronę „Martynka urządza” z canvasem 1920×1080 skalowanym z letterboxem i wyśrodkowanym, bez zoomu, przewijania i zaznaczania; scena startowa rysuje w kodzie placeholder z tytułem z `data/pl.ts`. `src/core/types.ts` istnieje bez importów silnika, katalogi `data/`, `scenes/`, `ui/widgets/`, `storage/`, `tests/` są na miejscu, build nie wysyła nic do sieci, README/CLAUDE.md/AGENTS.md opisują nowy stan.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Wersje | Phaser 4.2.1, Vite 6.4.4, TS 5.7 bez zmian | vitest 5 (F-03) wymaga Vite ≥ 6.4; Vite 8 i TS 7 to ryzyko nieproporcjonalne do F-01 | Plan |
| CSS dotykowy | W F-01 (index.html + style.css) | Test skalowania jest miarodajny tylko na stronie bez zoomu i przewijania | Plan |
| Licencja | MIT z copyrightem użytkownika + nota o szablonie | Publiczne repo nie może wskazywać Phaser Studio jako właściciela | Plan |
| Skills Phasera | 5 wybranych, instalacja ręczna przez użytkownika | Plan sekcja 3 o to prosi; sandbox agenta nie zapisuje do `.claude/skills` | Research / Plan |
| Telemetria | `log.js` i plugin `phasermsg` usunięte, skrypty `-nolog` znikają | NFR prywatności: zero żądań sieciowych poza pobraniem gry | Research |
| Teksty i liczby | Tylko w `src/data/` (`pl.ts`, `layout.ts`) | Zasada planu (sekcja 14) od pierwszego commitu | Plan |
| Favicon | Zostaje favicon szablonu | Ikony PWA i favicon wchodzą w S-01 | Research |

## Scope

**In scope:** zależności i metadane `package.json`; usunięcie telemetrii, demo, screenshotu; LICENSE; `src/main.ts` z GameConfig FIT + CENTER_BOTH; `src/scenes/BootScene.ts` z placeholderem w kodzie; `src/data/layout.ts`, `src/data/pl.ts`, `src/core/types.ts`; `.gitkeep` dla `ui/widgets`, `storage`, `tests`; `index.html` i `style.css` dotykowe; README, CLAUDE.md, AGENTS.md; komenda instalacji skilli.

**Out of scope:** PWA (manifest, SW, nakładka „Obróć tablet”, ikony) → S-01; deploy → F-02; vitest, rng, `sample`, eslint → F-03; font i grafika → M7; Vite 8 / TS 7; jakakolwiek logika gry.

## Architecture / Approach

Trzy fazy, każda z osobnym commitem: (1) czysty szablon z właściwymi wersjami i buildem, (2) szkielet gry: `main.ts` → `Game` z `scale: FIT + CENTER_BOTH` → `BootScene` rysująca placeholder ze stałych w `data/`, (3) dokumentacja i skills. Zasada „core bez Phasera” jest egzekwowana grepem w kryteriach fazy 2.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Zależności i czyszczenie | Phaser 4.2.1, Vite 6.4, bez telemetrii i demo, własna licencja | Build musi przejść bez scen demo (tymczasowe minimalne `main.ts`) |
| 2. Szkielet i skalowanie | Scena 1920×1080 FIT + CENTER_BOTH, placeholder, układ katalogów, CSS dotykowy | Zoom na iOS Safari wymaga `touch-action: none`, nie tylko viewport |
| 3. Dokumentacja i narzędzia | README, CLAUDE.md, AGENTS.md, skills Phasera | Instalacja skilli ręczna (sandbox) |

**Prerequisites:** Node 22 lokalnie (jest: 22.22.3), dostęp do registry.npmjs.org, research F-01.
**Estimated effort:** jedna sesja agenta na fazy 1–2, krótka na fazę 3; weryfikacja ręczna w przeglądarce po fazie 2.

## Open Risks & Assumptions

- Vite 6.4.4 z konfiguracjami `.mjs` szablonu działa bez zmian (różnica 6.3 → 6.4 jest minor).
- Hook end-of-turn uruchamia `tsc`; po usunięciu `src/game/` w fazie 1 `src/main.ts` musi już nie importować usuniętych modułów.
- Pinch-zoom na iPadzie weryfikuje dopiero S-01 na urządzeniu; w F-01 sprawdzamy Chrome desktop.
- Copyright w LICENSE: login `vince307`, chyba że użytkownik poda pełną nazwę.

## Success Criteria (Summary)

- `npm install`, `npm run build`, `npx tsc --noEmit` przechodzą; w repo nie ma `log.js`, scen demo ani odwołań do gryzor.co.
- Strona pokazuje wyśrodkowany canvas 16:9 z letterboxem, bez zoomu i przewijania, z placeholderem i tytułem.
- `src/core` i `src/data` nie importują Phasera; sceny nie zawierają liczb ani tekstów; dokumentacja opisuje nowy stan.
