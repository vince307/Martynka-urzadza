# Harness testów generatorów (vitest, seedowany rng, skrypt sample) — Implementation Plan

## Overview

Roadmapa F-03 (`generator-test-harness`, etap M1, fundament). Wprowadza vitest 5 na `src/core/`, seedowany generator losowy `core/rng.ts`, model zadania z `docs/ZADANIA.md` §7, rejestr generatorów z pierwszym generatorem ADD_SUB i danymi E3 jako dowodem działania, walidator naruszeń (zakres, liczby ujemne, rozpraszacze, odmiana liczebników) oraz skrypt `npm run sample -- E3`, który wypisuje po 3 zadania z każdego kroku etapu i raportuje naruszenia (PRD FR-005). Odblokowuje S-02 i S-03 (testy 1000 losowań per umiejętność).

## Current State Analysis

Z `context/changes/generator-test-harness/research.md`:

- Brak vitest, `tests/` pusty, `tsconfig.include` = `["src"]`, `strictPropertyInitialization: false`. `src/core/types.ts` ma `StageId` i `SkillDef`; brak `Task`, generatorów, rng, `data/curriculum/`.
- vitest 5.0.4 pasuje do Vite 6.4.4 i Node 22.22; szuka konfiguracji tylko w roocie, więc `vitest.config.mts` nie załaduje pluginu PWA z `vite/`. Bez testów `vitest run` kończy się kodem 1, chyba że `passWithNoTests`.
- Hooki lokalne wołają `npx vitest related <plik> --run` i `npx vitest run`; workflow nie uruchamia testów.
- Node strip-types nie rozwiązuje importów bez rozszerzeń; `tsx` tak, ale w sandboxie tylko jako `node --import tsx`.
- Model zadania i parametry ADD_SUB zdefiniowane w ZADANIA §7; kroki E3 z ADD_SUB: 2 (≤ 20 z przekroczeniem), 6 (≤ 30 bez), 8 (≤ 30 z przekroczeniem, dwie dwucyfrowe).
- Reguła odmiany liczebników: 1 → l.poj.; końcówka 2–4 poza 12–14 → mianownik l.mn.; reszta (w tym 0) → dopełniacz l.mn.

## Desired End State

`npm test` (vitest) przechodzi z testami rng, odmiany, ADD_SUB (1000 losowań) i walidatora; `npm run typecheck` obejmuje `tests/` i `scripts/` przy włączonym `strictPropertyInitialization`; `npm run sample -- E3` wypisuje dla każdego z 11 kroków E3 po 3 zadania (dla kroków z ADD_SUB) albo „brak generatora: <TYPY>” i na końcu raport naruszeń (0 naruszeń → kod 0; naruszenia → lista i kod 1); workflow uruchamia `npm test` przed buildem. Sceny i deploy bez zmian.

### Key Discoveries:

- Samodzielny `vitest.config.mts` trzyma testy z dala od `vite/config.*.mjs` (research §1); `src/core/` nie może używać `__BUILD_ID__` ani DOM.
- `node --import tsx scripts/sample.ts` działa w sandboxie, `tsx` CLI nie (research §2).
- Walidator w `core/` służy zarówno testom (S-02/S-03), jak i `sample` (research, Architecture Insights).
- `SkillDef.params: Record<string, unknown>` zostaje; generator ADD_SUB waliduje i zawęża parametry sam (`parseAddSubParams`), żeby dane etapu pozostały luźno typowane jak w planie §5.

## What We're NOT Doing

- Pozostałe generatory grupy 1 (MISSING, BONDS, …), dane E1–E2 i E4–E6, szablony WORD, polecenia słowne (S-02, S-03).
- ESLint i `/10x-configure-hook`; `/10x-test-plan` (po tym wycinku).
- Pokrycie kodu, testy w przeglądarce, testy scen Phasera.
- Zmiany w `deploy/`, PWA, scenach, `data/pl.ts`.
- Testy dla `src/pwa/platform.ts` (dojdą przy okazji, jeśli zostanie czas; nie są kryterium).

## Implementation Approach

Trzy fazy. Faza 1 stawia harness (vitest, tsconfig, rng, odmiana, skrypty npm, workflow) z testami pisanymi przed kodem. Faza 2 dodaje model zadania, rejestr, generator ADD_SUB z testem 1000 losowań i dane E3. Faza 3 dodaje walidator naruszeń i skrypt `sample` z dokumentacją. Konwencje: czyste funkcje w `core/`, bez Phasera i DOM; identyfikatory po angielsku; liczby parametrów w `data/`.

## Critical Implementation Details

**`passWithNoTests` tylko w fazie 1.** Hook końca tury uruchamia `npx vitest run` od chwili instalacji vitest; pierwszy commit fazy 1 zawiera już testy, więc `passWithNoTests` zostaje `false` (puste uruchomienie ma być błędem w CI).

**Determinizm w testach.** Testy 1000 losowań używają stałego seeda (np. 20261012) i dodatkowo pętli po 20 seedach, żeby błąd był odtwarzalny; komunikat asercji zawiera seed i numer losowania.

**`@types/node` bez `types` w tsconfig.** tsc widzi `@types/node` automatycznie (domyślne `typeRoots`); jawne `types: ["node"]` wyłączyłoby to wykrywanie dla innych pakietów, więc go nie dodawać.

## Phase 1: Harness (vitest, tsconfig, rng, odmiana, skrypty)

### Overview

Vitest i tsx zainstalowane, konfiguracja testów, pierwsze czyste moduły `core/` z testami, workflow z krokiem testów.

### Changes Required:

#### 1. Zależności i skrypty

**File**: `package.json`, `package-lock.json`

**Intent**: vitest, tsx i typy Node; skrypty `test` i `sample`.

**Contract**: `devDependencies`: `vitest ^5.0.4`, `tsx ^4.23.15`, `@types/node ^22`. Skrypty: `"test": "vitest run"`, `"test:watch": "vitest"`, `"sample": "node --import tsx scripts/sample.ts"` (skrypt powstaje w fazie 3; sam wpis może być w fazie 1). Instalacja z `npm_config_cache="$TMPDIR/npm-cache"`.

#### 2. Konfiguracja vitest i tsconfig

**File**: `vitest.config.mts` (nowy), `tsconfig.json`

**Intent**: Testy z `tests/` bez konfiguracji Vite aplikacji; typowanie testów i skryptów.

**Contract**: `vitest.config.mts`: `import { defineConfig } from 'vitest/config'; export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } })`. `tsconfig.json`: `include: ["src", "tests", "scripts", "vitest.config.mts"]`, `strictPropertyInitialization: true` (wpis usunięty, bo `strict` go włącza). Nie dodawać `types`.

#### 3. Seedowany rng

**File**: `src/core/rng.ts` (nowy), `tests/rng.test.ts` (nowy)

**Intent**: Deterministyczne losowanie dla generatorów i testów.

**Contract**: `export interface Rng { next(): number; int(min: number, max: number): number; pick<T>(items: readonly T[]): T; shuffle<T>(items: readonly T[]): T[]; chance(p: number): boolean }`; `export const createRng = (seed: number): Rng` — sfc32 seedowany czterema wyjściami mulberry32(seed) z odrzuceniem 8 pierwszych wyjść; `int` domknięty obustronnie, rzuca `RangeError` gdy `min > max` lub nie-całkowite; `pick` rzuca na pustej tablicy; `shuffle` zwraca kopię (Fisher–Yates). Test: ten sam seed → ta sama sekwencja 100 liczb; różne seedy → różne; `int(1, 6)` w 10 000 losowaniach trafia każdą wartość i nigdy poza zakres; `shuffle` zachowuje multizbiór i nie modyfikuje wejścia; `chance(0)` zawsze false, `chance(1)` zawsze true.

#### 4. Odmiana liczebników

**File**: `src/core/text/plural.ts` (nowy), `tests/plural.test.ts` (nowy)

**Intent**: Jedna funkcja odmiany dla wszystkich tekstów z liczbą.

**Contract**: `export type PluralForms = readonly [one: string, few: string, many: string]`; `export const pluralCategory = (n: number): 'one' | 'few' | 'many'` (reguła z research §3; `n` całkowite ≥ 0, inaczej `RangeError`); `export const inflect = (n: number, forms: PluralForms): string` zwraca formę; `export const countNoun = (n: number, forms: PluralForms): string` zwraca `"${n} ${forma}"`. Test: 1 jabłko, 2/3/4 jabłka, 5–21 jabłek, 22–24 jabłka, 12–14 jabłek, 112 jabłek, 0 jabłek, 100 jabłek, 1000 jabłek; błąd dla −1 i 2.5.

#### 5. Workflow

**File**: `.github/workflows/deploy.yml`

**Intent**: Testy bramkują deploy.

**Contract**: W jobie `build` krok `- run: npm test` między `typecheck` a `build`.

### Success Criteria:

#### Automated Verification:

- `npm run typecheck` przechodzi z `tests/` i `scripts/` w `include` i bez `strictPropertyInitialization: false` (`grep -c strictPropertyInitialization tsconfig.json` = 0)
- `npm test` przechodzi z co najmniej 2 plikami testów (`rng`, `plural`); `npx vitest run tests/rng.test.ts` przechodzi
- `grep -c 'npm test' .github/workflows/deploy.yml` = 1 i YAML parsuje (`ruby -ryaml`)
- `grep -rn "from 'phaser'" src/core` zwraca 0 wyników

#### Manual Verification:

- Hooki lokalne: po edycji `src/core/rng.ts` hook `related-tests` uruchamia `tests/rng.test.ts` (widoczne w wyjściu hooka)

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Model zadania, rejestr i generator ADD_SUB z danymi E3

### Overview

Pierwszy generator jako dowód harnessu: model z ZADANIA §7, rejestr `type → generator`, ADD_SUB z testem 1000 losowań, dane etapu E3.

### Changes Required:

#### 1. Model zadania i rejestr

**File**: `src/core/tasks/types.ts` (nowy), `src/core/tasks/registry.ts` (nowy)

**Intent**: Wspólny kontrakt generatorów.

**Contract**: `types.ts`: `export interface Task { skillId: string; prompt: string; speak?: string; visual?: unknown; answer: number | string | number[]; choices?: (number | string)[]; hint: string[]; check?: (input: unknown) => boolean }`; `export type Generator = (skill: SkillDef, rng: Rng) => Task` (generator dostaje cały `SkillDef`, żeby wpisać `skillId` i odczytać `params`). `registry.ts`: `export const generators: Readonly<Record<string, Generator>>` z wpisem `ADD_SUB`; `export const getGenerator = (type: string): Generator | undefined`.

#### 2. Generator ADD_SUB

**File**: `src/core/tasks/generators/addSub.ts` (nowy), `tests/addSub.test.ts` (nowy)

**Intent**: Główny generator z ZADANIA §4 w wersji bez poleceń słownych.

**Contract**: `export interface AddSubParams { max: number; ops: readonly ('+' | '-')[]; bridge: 'none' | 'ten' | 'any'; min?: number }`; `export const parseAddSubParams = (params: Record<string, unknown>): AddSubParams` (rzuca `TypeError` z nazwą pola przy złych danych); `export const generateAddSub: Generator`. Semantyka: wynik i składniki w `[0, max]` (odejmowanie: odjemna ≥ odjemnik, wynik ≥ 0); `bridge: 'none'` → brak przekroczenia dziesiątki (dla +: `a % 10 + b % 10 < 10`; dla −: `a % 10 ≥ b % 10`); `'ten'` → zawsze przekroczenie; `'any'` → bez ograniczenia; `shape` pomijane w F-03 (zostaje w parametrach danych, S-02 go obsłuży). Losowanie przez odrzucanie z limitem 1000 prób, potem `Error` z parametrami. `prompt`: `"7 + 6"` (bez „= ?”, prezentację doda scena); `answer`: liczba; `choices` brak (klawiaturka od E2); `hint`: dla + z przekroczeniem `["7 + 3 = 10", "10 + 3 = 13"]`, dla − z przekroczeniem `["13 − 3 = 10", "10 − 3 = 7"]`, bez przekroczenia jeden krok `["7 + 2 = 9"]`; znak minus w tekstach to `−` (U+2212). Test: dla każdego z 3 zestawów parametrów E3 i 20 seedów po 50 losowań (= 1000 na zestaw): wynik i składniki w zakresie, brak ujemnych, przekroczenie zgodne z `bridge`, `answer` równa się obliczeniu z `prompt`, `hint` niepuste, ten sam seed → identyczne zadanie; `parseAddSubParams` odrzuca `max: '20'`, `ops: []`, `bridge: 'x'`.

#### 3. Dane etapu E3

**File**: `src/data/curriculum/E3.ts` (nowy), `src/data/curriculum/index.ts` (nowy)

**Intent**: Kroki E3 jako dane; tylko umiejętności ADD_SUB mają parametry, pozostałe kroki są wpisane z typami bez generatora.

**Contract**: `E3.ts`: `export const E3: StageDef` gdzie `StageDef { id: StageId; steps: StepDef[] }`, `StepDef { step: number; title: string; skills: SkillDef[] }` (typy `StageDef`/`StepDef` dodane do `src/core/types.ts`). 11 kroków z `docs/ZADANIA.md:104-115` z tytułami po polsku (tytuł to nazwa kroku dla autora/podglądu rodzica, nie tekst dla dziecka); umiejętności: krok 2 `E3.2.add_sub_20_bridge` (`max: 20, ops: ['+','-'], bridge: 'ten'`), krok 6 `E3.6.add_sub_30_nobridge` (`max: 30, ops: ['+','-'], bridge: 'none'`), krok 8 `E3.8.add_sub_30_bridge` (`max: 30, ops: ['+','-'], bridge: 'any'`, bo krok łączy 19 + 8 z 14 + 13); pozostałe kroki mają `skills: []` plus pole `types: string[]` z typami z ZADANIA (do raportu „brak generatora”). `index.ts`: `export const stages: Readonly<Record<StageId, StageDef | undefined>>` z `E3`; `export const getStage = (id: string): StageDef | undefined`.

### Success Criteria:

#### Automated Verification:

- `npm test` przechodzi, w tym `npx vitest run tests/addSub.test.ts` (3 zestawy × 1000 losowań)
- `npm run typecheck` przechodzi; `grep -rn "from 'phaser'" src/core src/data/curriculum` = 0
- `node --import tsx -e "import('./src/data/curriculum/E3.ts').then(m => console.log(m.E3.steps.length))"` wypisuje `11`

#### Manual Verification:

- Przegląd `E3.ts`: kroki i typy zgodne z `docs/ZADANIA.md` §3 E3, parametry ADD_SUB zgodne z §2/§3

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Walidator naruszeń i skrypt sample

### Overview

`npm run sample -- E3` wypisuje przykłady i raport; walidator wielokrotnego użytku w `core/`.

### Changes Required:

#### 1. Walidator

**File**: `src/core/tasks/validate.ts` (nowy), `tests/validate.test.ts` (nowy)

**Intent**: Jedna lista naruszeń dla testów i `sample`.

**Contract**: `export interface Violation { skillId: string; rule: 'range' | 'negative' | 'choices' | 'inflection' | 'hint'; detail: string }`; `export interface ValidationContext { max?: number; nouns?: Readonly<Record<string, PluralForms>> }`; `export const validateTask = (task: Task, ctx: ValidationContext): Violation[]`. Reguły: `range` — liczbowa `answer` poza `[0, ctx.max]` gdy `max` podane; `negative` — jakakolwiek liczba ze znakiem minus (`-` lub `−` bezpośrednio przed cyfrą) w `prompt`, `hint[]` lub `choices` albo `answer < 0`; `choices` — `choices` zawiera duplikaty albo nie zawiera `answer`; `hint` — puste `hint`; `inflection` — w `prompt`, `speak` i `hint[]` każde wystąpienie `<liczba> <słowo>`, gdzie `słowo` jest jedną z form w `ctx.nouns`, musi być formą zgodną z `inflect(liczba, formy)`. Test: zadanie poprawne → `[]`; `answer: 31` przy `max: 30` → `range`; prompt `"5 − 7"` → `negative`; `choices: [3, 3, 4]` → `choices`; prompt „2 jabłek” ze słownikiem → `inflection`, „2 jabłka” → brak.

#### 2. Słownik rzeczowników dla walidatora

**File**: `src/data/nouns.ts` (nowy)

**Intent**: Formy używane przez przyszłe szablony WORD (S-02) i przez walidator; tu tylko kilka wpisów na start.

**Contract**: `export const nouns: Readonly<Record<string, PluralForms>>` z co najmniej: jabłko, gruszka, rogalik, książka, kredka, filiżanka, klocek, gwiazdka (formy one/few/many).

#### 3. Skrypt sample

**File**: `scripts/sample.ts` (nowy)

**Intent**: FR-005: 3 zadania na krok etapu i raport naruszeń.

**Contract**: `node --import tsx scripts/sample.ts <StageId> [--seed N] [--count N]`; bez argumentu lub z nieznanym etapem wypisuje użycie i listę etapów z danymi i kończy kodem 2. Dla każdego kroku: nagłówek `E3.2 <title>`; dla każdej umiejętności `count` (domyślnie 3) zadań z `createRng(seed + i)`: `  <prompt>  → <answer>   podpowiedź: <hint.join(' · ')>`; dla kroku bez umiejętności: `  (brak generatora: WORD, COMPARE_DIFF)`; dla umiejętności z typem bez generatora w rejestrze: `  (brak generatora: <TYPE>)`. Każde zadanie przechodzi `validateTask` z `max` z `params.max` (gdy liczba) i słownikiem `nouns`. Na końcu `Naruszenia: 0` (kod 0) albo lista `skillId rule detail` i kod 1. Wyjątek generatora → osobny wiersz `BŁĄD <skillId>: <message>` i kod 1. Import tylko z `src/core` i `src/data` (żadnego DOM).

#### 4. Dokumentacja

**File**: `CLAUDE.md`, `AGENTS.md`

**Intent**: Komendy i stan.

**Contract**: CLAUDE.md „Commands”: `npm test`, `npx vitest run tests/<plik>`, `npm run sample -- E3`; „Current state”: vitest, rng, ADD_SUB, E3, sample; usunąć „Once vitest is added”. AGENTS.md: „Commands” z `npm test` i `npm run sample -- E3`; „Testing” aktualne; ≤ 400 słów.

### Success Criteria:

#### Automated Verification:

- `npm test` i `npm run typecheck` przechodzą (co najmniej 4 pliki testów)
- `npm run sample -- E3` kończy się kodem 0, wypisuje `E3.2`, `E3.6`, `E3.8` z 3 zadaniami każdy, `brak generatora` dla pozostałych kroków i `Naruszenia: 0`; `npm run sample -- E9` kończy się kodem 2
- `npm run sample -- E3 --seed 7 | md5` równe przy dwóch uruchomieniach (determinizm)
- `tail -n +2 AGENTS.md | wc -w` ≤ 400; `grep -c 'npm run sample' CLAUDE.md AGENTS.md` ≥ 1 w każdym

#### Manual Verification:

- Wyjście `sample -- E3` przeczytane: działania sensowne dla kroków 2/6/8 (przekroczenia tam, gdzie trzeba), podpowiedzi poprawne arytmetycznie

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- `tests/rng.test.ts`, `tests/plural.test.ts`, `tests/addSub.test.ts` (1000 losowań × 3 zestawy, 20 seedów), `tests/validate.test.ts`.

### Integration Tests:

- `npm run sample -- E3` jako test integracyjny harnessu (rejestr + dane + walidator), uruchamiany ręcznie i w kryteriach fazy 3.

### Manual Testing Steps:

1. `npm run sample -- E3` i przeczytanie 9 zadań.
2. Edycja `src/core/rng.ts` i obserwacja hooka `related-tests`.

## Performance Considerations

Testy 1000 losowań × 3 zestawy trwają ułamki sekundy; losowanie przez odrzucanie z limitem 1000 prób zabezpiecza przed nieskończoną pętlą przy złych parametrach.

## Migration Notes

Brak zmian w zapisie i scenach. Włączenie `strictPropertyInitialization` nie wymaga zmian w istniejącym kodzie (BootScene bez pól).

## References

- Related research: `context/changes/generator-test-harness/research.md`
- `docs/ZADANIA.md` §2, §3 (E3), §4 (ADD_SUB), §7 (model)
- Roadmapa F-03: `context/foundation/roadmap.md`; PRD FR-004, FR-005

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Harness (vitest, tsconfig, rng, odmiana, skrypty)

#### Automated

- [x] 1.1 `npm run typecheck` z `tests/` i `scripts/`, bez `strictPropertyInitialization: false` — 23fbaf5
- [x] 1.2 `npm test` przechodzi z testami rng i plural — 23fbaf5
- [x] 1.3 Workflow ma `npm test`, YAML parsuje — 23fbaf5
- [x] 1.4 Brak importów Phasera w `src/core` — 23fbaf5

#### Manual

- [x] 1.5 Hook `related-tests` uruchamia `tests/rng.test.ts` po edycji `rng.ts` — 23fbaf5

### Phase 2: Model zadania, rejestr i generator ADD_SUB z danymi E3

#### Automated

- [x] 2.1 `npm test` z `addSub.test.ts` (3 × 1000 losowań) — 4dfe6ee
- [x] 2.2 `typecheck` i brak Phasera w `core`/`curriculum` — 4dfe6ee
- [x] 2.3 `E3.steps.length` = 11 przez tsx — 4dfe6ee

#### Manual

- [x] 2.4 Przegląd `E3.ts` względem ZADANIA §3 E3 i §2 — 4dfe6ee

### Phase 3: Walidator naruszeń i skrypt sample

#### Automated

- [x] 3.1 `npm test` i `typecheck` z ≥ 4 plikami testów — ba17fed
- [x] 3.2 `sample -- E3` kod 0, kroki 2/6/8 po 3 zadania, `brak generatora`, `Naruszenia: 0`; `E9` kod 2 — ba17fed
- [x] 3.3 `sample -- E3 --seed 7` deterministyczne — ba17fed
- [x] 3.4 AGENTS.md ≤ 400 słów; `npm run sample` w CLAUDE.md i AGENTS.md — ba17fed

#### Manual

- [x] 3.5 Wyjście `sample -- E3` przeczytane: działania i podpowiedzi poprawne — ba17fed
