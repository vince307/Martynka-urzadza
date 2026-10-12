---
date: 2026-10-12T13:30:00+02:00
researcher: Claude (orkiestrator, sesja 2026-10-12)
git_commit: 72cbeb6
branch: main
repository: Martynka-urzadza
topic: "F-03 generator-test-harness: vitest 5 na Vite 6.4, uruchamianie skryptu sample w TypeScript, seedowany rng, odmiana liczebników i model zadania z ZADANIA.md §7"
tags: [research, vitest, tsx, rng, curriculum, generators, M1]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (orkiestrator)
---

# Research: F-03 generator-test-harness

**Date**: 2026-10-12T13:30:00+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-12)
**Git Commit**: 72cbeb6
**Branch**: main
**Repository**: Martynka-urzadza

## Research Question

Roadmapa F-03 (etap M1, fundament): vitest działa na `src/core/`, generatory dostają seedowany rng, skrypt `npm run sample -- E3` wypisuje po 3 zadania z każdego kroku etapu i raportuje naruszenia (zakres, ujemne, odmiana) (PRD FR-005; plan sekcja 11 M1). Pytania: (1) jaka konfiguracja vitest na Vite 6.4 nie wciąga konfiguracji PWA; (2) czym uruchomić skrypt TypeScript z importami bez rozszerzeń; (3) jaki rng i jaka odmiana liczebników; (4) jaki minimalny generator i dane etapu, żeby harness miał co próbkować; (5) co w repo i hookach wiąże ten wycinek.

## Summary

- `vitest` 5.0.4 (npm `latest` 2026-10-12) ma peer `vite ^6.4.0 || ^7 || ^8` i `engines.node ^22.12 || ^24 || >=26`; zainstalowany Vite 6.4.4 i Node 22.22 pasują. Vitest szuka konfiguracji tylko w `root` (`vitest.config.*`, potem `vite.config.*`); repo ma je wyłącznie w `vite/config.*.mjs`, więc samodzielny `vitest.config.mts` z `test.include: ['tests/**/*.test.ts']` nie załaduje pluginu PWA ani `define` (`__BUILD_ID__` w testach niezdefiniowane; `src/core/` nie może go używać). Domyślnie `globals: false`, `environment: 'node'`, `passWithNoTests: false` (pusty zestaw = exit 1; hook końca tury woła `npx vitest run`, więc ustawić `passWithNoTests: true` albo mieć testy od pierwszego commitu).
- `vitest related <file> --run` (hook `.claude/hooks/related-tests.sh:20`) istnieje w 5.x i sam ustawia `passWithNoTests`. Zmiany 4→5 bez wpływu na proste testy jednostkowe (`clearMocks: true`, brak szukania konfiguracji w katalogach nadrzędnych).
- TypeScript: wystarczy dodać `tests` (i `scripts`) do `include` w `tsconfig.json`; testy importują `describe/it/expect` z `'vitest'` (bez `types`). Skrypt z `process.argv` wymaga `@types/node` (brak w repo; vitest 5 ma go jako opcjonalny peer).
- Skrypt `sample.ts`: `node --experimental-strip-types` (domyślnie włączone od Node 22.18) odrzuca importy bez rozszerzeń (`ERR_MODULE_NOT_FOUND`, sprawdzone lokalnie), a `src/` używa takich importów. `tsx` 4.23.15 je rozwiązuje (sprawdzone przez `node --import tsx`); sam binarny `tsx` w sandboxie agenta pada na gnieździe IPC, więc skrypt npm ma postać `node --import tsx scripts/sample.ts`. `vite-node` nie jest już częścią vitest 5, a samodzielny `vite-node@6` wymaga Vite 8.
- Rng: `sfc32` (128 bitów stanu, PractRand/BigCrush, licznik gwarantuje okres ≥ 2^32) seedowany z liczby przez kilka wyjść `mulberry32`/splitmix; pomocniki `int(min, max)` (domknięte), `pick`, `shuffle`. Plan sekcja 5 trzyma `rngSeed: number` w zapisie, więc API przyjmuje liczbę.
- Model zadania z `docs/ZADANIA.md` §7: `Task { skillId, prompt, speak?, visual?, answer, choices?, hint[], check? }`, `TaskParams` dla ADD_SUB `{ max, ops, bridge, shape? }`, generator = czysta funkcja `(params, rng) => Task`; `SkillDef` już istnieje w `src/core/types.ts:9-16`. Kroki E3 z ADD_SUB: 2 (do 20 z przekroczeniem), 6 (do 30 bez przekroczenia), 8 (do 30 z przekroczeniem, 14 + 13) (`docs/ZADANIA.md:104-115`); zakresy etapów w §2.
- Odmiana liczebników (plan sekcja 14, FR-004): reguła polska 1 → mianownik l.poj.; 2–4 (poza 12–14) → l.mn. mianownik; reszta → dopełniacz l.mn.; dotyczy końcówki liczby (22, 23, 24 jak 2–4; 112–114 jak 12–14). To czysta funkcja do `core/` z testem; raport „zła odmiana” w `sample` może sprawdzać tylko rzeczowniki z własnego słownika (szablony WORD przyjdą w S-02), więc w F-03 walidator dostaje słownik i wykrywa `<liczba> <forma>` niezgodne z regułą.
- Hooki (`.claude/hooks/end-of-turn.sh:38-48`): `tsc --noEmit` zawsze, `npx vitest run` gdy `node_modules/.bin/vitest` istnieje; ESLint nadal brak (osobno, `/10x-configure-hook`). Workflow `deploy.yml:33-35` uruchamia `npm ci`, `typecheck`, `build`; brak kroku testów.

## Detailed Findings

### 1. vitest 5.0.4

Źródła: `npm view vitest@5.0.4` (peer, engines), vitest.dev `guide/`, `config/`, `guide/migration` (5.x), źródła `packages/vitest/src/node/cli/cac.ts` i `logger.ts` przez context7.

- Konfiguracja: `vitest.config.mts` z `defineConfig` z `'vitest/config'`; `test.include`, `test.passWithNoTests`. Brak `vite.config.*` w roocie repo (sprawdzone `ls`), więc nic z `vite/` nie jest ładowane.
- `vitest run` bez testów: exit 1 bez `passWithNoTests`. `vitest related` ustawia `passWithNoTests ??= true`; `--run` akceptowane.
- Usunięte wejścia `vitest/coverage`, `vitest/reporters` nie są używane; `vitest/config` istnieje.

### 2. Uruchamianie TypeScript poza Vite

- Node 22.22: `--experimental-strip-types` wymaga rozszerzeń w importach (nodejs.org: „file extensions are mandatory”); test lokalny w `$TMPDIR/st` potwierdził `ERR_MODULE_NOT_FOUND`.
- `tsx` 4.23.15 (engines ≥ 18, esbuild ~0.28): rozwiązuje importy bez rozszerzeń z `"type"` nieustawionym; `node --import tsx <plik>` działa w sandboxie, `tsx <plik>` nie (IPC). Skrypt `"sample": "node --import tsx scripts/sample.ts"`.
- `package.json` nie ma `"type": "module"`; `scripts/make-icons.mjs` używa ESM przez rozszerzenie. Pliki `.ts` ładowane przez tsx są traktowane jako ESM (import/export), bez zmiany `type`.

### 3. Rng i odmiana

- `sfc32(a,b,c,d)` i `mulberry32(a)` (bryc/code PRNGs.md): kod podany w raporcie agenta; `sfc32` lepszej jakości, `mulberry32` wystarczy jako mieszacz seeda. Odrzucenie kilku pierwszych wyjść po seedowaniu (niska pewność, tania praktyka).
- `int(min, max) = Math.floor(next() * (max - min + 1)) + min`; `pick(arr) = arr[int(0, arr.length - 1)]`; `shuffle` Fisher–Yates na kopii.
- Reguła odmiany: dla `n ≥ 0` całkowitego: `n % 10 ∈ {2,3,4}` i `n % 100 ∉ {12,13,14}` → forma 2 (paucal); `n === 1` → forma 1; inaczej forma 3 (dopełniacz). Zero → forma 3 („0 jabłek”). Przykłady z CLAUDE.md: 1 jabłko, 2 jabłka, 5 jabłek; dodatkowo 12 jabłek, 22 jabłka, 112 jabłek.

### 4. Repo: co istnieje, co dochodzi

- `src/core/types.ts`: `StageId`, `SkillDef` (id, stage, step, type, params, answer). Brak `Task`, generatorów, `rng.ts`, `data/curriculum/`.
- `tsconfig.json`: `include: ["src"]`, `strictPropertyInitialization: false` (przegląd F-01 prosił o włączenie; `BootScene` nie ma pól klasy, więc włączenie nic nie psuje), `moduleResolution: bundler`, `noEmit`, `lib` z `DOM`.
- `tests/` pusty (`.gitkeep`), `scripts/make-icons.mjs` (ESM, bez zależności). `package.json` skrypty: dev, build, preview, typecheck, icons.
- `docs/ZADANIA.md` §7: model `TaskParams`/`Skill`/`Task` (cytowany w Summary), kolejność typów grupy 1; §2 zakresy etapów; §3 kroki E3 (11 kroków, ADD_SUB w krokach 2, 6, 8; MISSING w 2).
- `context/foundation/roadmap.md` F-03: Unknowns — włączyć `strictPropertyInitialization`, `tests/` w `include`; kryterium „gotowe” M1 (OQ3) do rozstrzygnięcia przy S-02; S-02 i S-03 zależą od tego harnessu.

## Code References

- `src/core/types.ts:9-16` - `SkillDef`
- `tsconfig.json:21,26-28` - `strictPropertyInitialization`, `include`
- `.claude/hooks/related-tests.sh:20`, `.claude/hooks/end-of-turn.sh:38-48` - wywołania vitest i tsc (lokalne, gitignored)
- `.github/workflows/deploy.yml:33-35` - kroki builda bez testów
- `docs/ZADANIA.md:61-75` (zakresy), `:104-115` (kroki E3), `:318-350` (§7 model)
- `scripts/make-icons.mjs` - wzorzec skryptu w `scripts/`

## Architecture Insights

- Jeden `vitest.config.mts` w roocie, niezależny od `vite/`, utrzymuje testy czyste od pluginów i `define`; `src/core/` nie wolno zależeć od `__BUILD_ID__` ani DOM.
- Generatory jako czyste funkcje `(params, rng) => Task` plus rejestr `type → generator` pozwalają skryptowi `sample` iterować po `SkillDef[]` etapu i raportować typy bez generatora zamiast przerywać.
- Walidator naruszeń jako funkcja w `core/` (nie w skrypcie) jest wielokrotnego użytku w testach 1000 losowań (S-02/S-03) i w `sample`.

## Historical Context (from prior changes)

- `context/archive/2026-10-11-game-shell-scaling/reviews/impl-review.md`: prośba o `strictPropertyInitialization` i `tests/` w `include` przy wprowadzeniu vitest.
- `context/archive/2026-10-11-installable-offline-pwa/`: `src/pwa/platform.ts` jako pierwsza czysta funkcja sprawdzana `node --experimental-strip-types` (działa, bo nie ma importów); po F-03 dostaje test vitest.

## Related Research

- `context/archive/2026-10-11-game-shell-scaling/research.md` (wersje vitest/Vite, układ `core/`).

## Open Questions

1. Zakres pierwszego generatora w F-03: tylko ADD_SUB (dowód działania harnessu, S-02 dopisuje resztę) czy od razu MISSING? Propozycja: tylko ADD_SUB z krokami E3 2/6/8; `sample` listuje pozostałe kroki jako „brak generatora”.
2. Teksty poleceń: ADD_SUB ma polecenie w postaci działania („7 + 6 = ?”) bez słów; słowne polecenia i szablony WORD wchodzą w S-02 do `data/`. W F-03 prompt pozostaje wyrażeniem.
3. Czy dodać `npm test` do workflow deploy (job build) teraz? Propozycja: tak, przed `build`.
