<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Szkielet gry na Phaser 4.2 w scenie 1920×1080

- **Plan**: context/changes/game-shell-scaling/plan.md
- **Mode**: Deep
- **Date**: 2026-10-11
- **Verdict**: SOUND (po poprawkach; przed: REVISE z 2 ostrzeżeniami niskiego wpływu)
- **Findings**: 0 critical, 2 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding
12/12 paths ✓ (package.json, log.js, vite/config.{dev,prod}.mjs, index.html, public/style.css, LICENSE, README.md, CLAUDE.md, AGENTS.md, src/main.ts, src/game/main.ts), 3/3 symbols ✓ (`phasermsg`, `manualChunks` w obu configach, `dev-nolog` w package.json/CLAUDE.md/AGENTS.md), brief↔plan ✓ (te same 3 fazy, decyzje i zakres). Progress↔Phase: 5/8/5 kryteriów = 5/8/5 wierszy, jeden `## Progress` na końcu, brak checkboxów poza nim.

Weryfikacja ryzykownego twierdzenia (zamiast subagenta, eksperyment w katalogu tymczasowym z node_modules repo): `vite build` z `manualChunks: { phaser: ['phaser'] }` i wejściem bez importu Phasera kończy się sukcesem i tworzy pusty chunk `phaser-*.js` (0.00 kB). Faza 1 nie wywali builda, ale bez importu nie sprawdzi Phasera 4.2.1 (F1).

## Findings

### F1 — Faza 1 nie ćwiczy importu Phasera 4.2.1

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 — pkt 3 (Usunięcie demo), kryterium 1.2
- **Detail**: Tymczasowy `src/main.ts` „bez Phasera” daje build, który bundluje pusty chunk phaser; podbicie do 4.2.1 byłoby sprawdzone dopiero w fazie 2.
- **Fix**: Tymczasowy `main.ts` importuje `VERSION` z `phaser` i loguje ją; kryterium 1.2 wymaga chunka phaser > 100 kB.
- **Decision**: FIXED (zastosowano w planie 2026-10-11)

### F2 — Kryterium ≤ 400 słów AGENTS.md jest dziś niespełnione

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — pkt 2 (CLAUDE.md i AGENTS.md), kryterium 3.2
- **Detail**: `tail -n +2 AGENTS.md | wc -w` zwraca 402 przed edycją; implementujący musiałby odkryć, że samo przepisanie sekcji nie wystarczy.
- **Fix**: Kontrakt fazy 3 mówi wprost, że plik ma 402 słowa i trzeba go skrócić o kilka słów.
- **Decision**: FIXED (zastosowano w planie 2026-10-11)

### F3 — Krok ręczny z tabletem zakłada `--host`, którego skrypt nie ma

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Testing Strategy — Manual Testing Steps, krok 4
- **Detail**: Skrypt `dev` nie przekazuje `--host`; krok opisuje efekt, nie komendę.
- **Fix**: Krok 4 podaje `npm run dev -- --host`.
- **Decision**: FIXED (zastosowano w planie 2026-10-11)

### F4 — `height: 100%` kontra pasek Safari na iPadzie

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 2 — pkt 5 (Strona i CSS dotykowy)
- **Detail**: Kontener 100% × 100% działa w Chrome desktop; na iPadzie w Safari (poza PWA) dynamiczny pasek adresu może zostawić obszar poza canvasem. W trybie zainstalowanej PWA (`display: fullscreen`, S-01) problem znika.
- **Fix**: Brak zmian w F-01; S-01 weryfikuje na urządzeniu i w razie potrzeby przechodzi na `100dvh`.
- **Decision**: ACCEPTED (ryzyko przeniesione do S-01)
