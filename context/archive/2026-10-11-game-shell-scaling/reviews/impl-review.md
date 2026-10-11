<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Szkielet gry na Phaser 4.2 w scenie 1920×1080

- **Plan**: context/changes/game-shell-scaling/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-11
- **Verdict**: APPROVED (po poprawkach z triage; przed: NEEDS ATTENTION z 2 ostrzeżeniami)
- **Findings**: 0 critical, 2 warnings, 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

Zakres git: 4 commity na `m0/game-shell-scaling` (cceac34, b734829, 9a2cc05, aeb38fa) względem `main`. Pliki w diffie, a nie w planie: tylko `package-lock.json` (nieunikniony) i artefakty 10x (`context/changes/game-shell-scaling/*`, `context/foundation/roadmap.md`). Wszystkie planowane pliki: MATCH; usunięcia potwierdzone. Kryteria automatyczne 1.1–1.4, 2.1–2.5, 3.1–3.3 ponownie uruchomione w przeglądzie: wszystkie przechodzą. Ręczne: 1.5, 2.6–2.8, 3.5 odhaczone z dowodami (zrzut i pomiary w Chrome w rozmowie); 3.4 (skills Phasera) oczekuje na ręczną instalację przez użytkownika (sandbox agenta: EPERM na `.claude/skills`).

## Findings

### F1 — `touch-action: none` nie obejmuje kontenera ani canvasa

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: public/style.css:10
- **Detail**: `touch-action` nie jest dziedziczone; `#game-container` i `canvas` miały `auto`. Phaser 4 nie ustawia `touch-action` na canvasie (sprawdzono w `dist/phaser.esm.js`), więc pinch/double-tap zoom na iOS Safari blokowałoby tylko `preventDefault` Phasera.
- **Fix**: Dodać `#game-container, canvas { touch-action: none }` oraz `-webkit-tap-highlight-color: transparent`; fallback `body { position: fixed; inset: 0 }` dla iOS bez `overscroll-behavior` (F6 scalone tutaj).
- **Decision**: FIXED (2026-10-11)

### F2 — Rozmiary fontów i ramki zakodowane w scenie

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/BootScene.ts:22-23,50,55,58 (przed poprawką)
- **Detail**: Kontrakt fazy 2 mówił „wyłącznie stałe z layout.ts”; scena miała `frameWidth = 8`, `'112px'`, `+ 112`, `'48px'`. Kryterium 2.4 przechodziło, ale `112` był sprzężonym magic number (rozmiar i offset).
- **Fix**: `FONT_SIZES` i `PLACEHOLDER_FRAME` w `src/data/layout.ts`; scena importuje je, a konwersję hex→CSS robi lokalny helper `toCssColor`.
- **Decision**: FIXED (2026-10-11)

### F3 — Kolor ivory zduplikowany w czterech miejscach

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts:20 (`PAGE_BACKGROUND`), public/style.css:9, index.html:6 (`theme-color`)
- **Detail**: Ten sam `#FFF5DF` w palecie numerycznej, stałej CSS, arkuszu i meta. CSS i HTML nie mogą importować z TS bez narzędzi, więc pełna deduplikacja wymaga generowania.
- **Fix**: Zostawić; przy S-01 (manifest PWA ma `theme_color`/`background_color`) rozważyć jedno źródło przez vite-plugin-pwa lub zmienną CSS.
- **Decision**: ACCEPTED (odłożone do S-01)

### F4 — Zbędny `DOMContentLoaded` w module ESM

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/main.ts:21 (przed poprawką)
- **Detail**: Skrypt `type="module"` wykonuje się po sparsowaniu dokumentu, więc nasłuch był martwy.
- **Fix**: Wywołać `createGame('game-container')` bezpośrednio.
- **Decision**: FIXED (2026-10-11)

### F5 — Martwa konfiguracja `build` w configu dev

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: vite/config.dev.mjs:5-13
- **Detail**: `build.rollupOptions.manualChunks` w configu dev nie ma efektu (dev nie bundluje). Pozostałość szablonu, plan kazał zostawić config dev bez zmian.
- **Fix**: Przy S-01 (vite-plugin-pwa dochodzi do obu configów) wydzielić wspólną bazę i usunąć martwy blok.
- **Decision**: SKIPPED (poza zakresem F-01)

### F6 — `tsconfig`: `strictPropertyInitialization: false` i `include` bez `tests/`

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: tsconfig.json:19,27
- **Detail**: Flaga z szablonu osłabia `strict`; `tests/` i `vite/` nie są typowane. Plan F-01 wprost zostawił `tsconfig` na F-03.
- **Fix**: W F-03 włączyć `strictPropertyInitialization` (sceny Phasera zwykle inicjalizują pola w `create`, więc może wymagać `!` lub inicjalizacji) i dodać `tests` do `include`.
- **Decision**: ACCEPTED (do F-03; zapisane w roadmapie jako Unknown F-03)

### F7 — Brak `repository` w package.json

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: package.json
- **Detail**: Repo jest publiczne na GitHubie; plan kazał usunąć pola szablonu, nie dodał własnych.
- **Fix**: Dodać `repository` wskazujące na github.com/vince307/Martynka-urzadza.
- **Decision**: FIXED (2026-10-11)

### F8 — Mieszane słownictwo „M1” / „F-03” w docs

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: AGENTS.md:26 vs CLAUDE.md
- **Detail**: AGENTS.md mówił „vitest lands in M1”, CLAUDE.md „roadmap F-03”; F-03 jest w M1, więc treść spójna, słownictwo nie.
- **Fix**: AGENTS.md: „F-03 (M1)”.
- **Decision**: FIXED (2026-10-11)

### F9 — Definicja „M0” w planie szersza niż F-01

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: Martynka-urzadza.md:221 vs CLAUDE.md:15
- **Detail**: Plan definiuje M0 jako szkielet + PWA + deploy; F-01 to tylko szkielet, a PWA i deploy to S-01 i F-02.
- **Fix**: Brak; roadmapa ma kolumnę „Etap” i przypisuje do M0 dokładnie F-01, F-02, S-01, więc „M0 ukończone” jest jednoznaczne po tych trzech.
- **Decision**: DISMISSED (roadmapa już to rozstrzyga)
