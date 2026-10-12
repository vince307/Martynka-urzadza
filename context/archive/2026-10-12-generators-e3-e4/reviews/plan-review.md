<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Generatory zadań grupy 1 dla E3–E4

- **Plan**: context/changes/generators-e3-e4/plan.md
- **Mode**: Quick
- **Date**: 2026-10-12
- **Verdict**: SOUND
- **Findings**: 0 critical, 1 warnings, 1 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | PASS |

## Grounding
Grounding: istniejące ścieżki (addSub.ts, registry.ts, validate.ts, E3.ts, index.ts, nouns.ts, pl.ts, sample.ts, CLAUDE.md, AGENTS.md) ✓, nowe oznaczone ✓, symbole `Task`/`Generator`/`validateTask`/`countNoun` ✓, brief↔plan ✓, Progress↔Phase 15/15 ✓; parametry kroków zweryfikowane z `docs/ZADANIA.md:104-126`.

## Findings

### F1 — `data/` importuje `core/text/plural` (kierunek zależności)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Phase 3 — `data/wordTemplates.ts` używa `countNoun` z `core/text/plural`
- **Detail**: Plan sekcja 4 opisuje `data/` jako „treść jako dane”; szablony jako funkcje potrzebują odmiany z `core/`. Cykl nie powstaje (core/text nie importuje data), ale granica „data = dane” mięknie.
- **Fix**: Dopuścić w `data/` import wyłącznie z `core/text/*` (czyste pomocniki tekstowe) i typów; zapisać regułę w AGENTS.md (faza 4).
  - Strength: Szablony pozostają w `data/`, bez duplikowania odmiany.
  - Tradeoff: Reguła do pilnowania ręcznie do czasu ESLint (`/10x-configure-hook`).
  - Confidence: HIGH — `core/text` nie ma zależności.
  - Blind spot: Brak lint-reguły importów.
- **Decision**: ACCEPTED (regułę dopisać w fazie 4)

### F2 — Czas testów przy 14 typach

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Testing Strategy
- **Detail**: Szacunek < 2 s; jeśli test szablonów przekroczy kilka sekund, ograniczyć n do próbek (0–30 + progi 12–14, 22–24, 100).
- **Fix**: — (sprawdzić czas w fazie 3).
- **Decision**: ACCEPTED
