<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Niezmienniki treści

- **Plan**: context/changes/testing-content-invariants/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-12
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Zakres: 3 commity faz. Pozycje planu obecne: rejestr parserów (14 = 14), `shapeFeasible` (enumeracja), minima MULT/DIV/WORD, `bounds.ts` wspólne dla `sample` i testu, `tests/contentInvariants.test.ts` (30 testów, < 1 s), szablon PR, CLAUDE.md, AGENTS.md (400 słów), test-plan §6.2/§6.6. Kryteria 1.1–1.3, 2.1–2.3 (celowe `max: 4` → „only 2 distinct tasks”), 3.1–3.2 spełnione; 236 testów zielonych; `sample` E3/E4 bez naruszeń. Przegląd własny orkiestratora.

## Findings

### F1 — Zmiana generatora DIV w etapie testów

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW
- **Dimension**: Scope Discipline
- **Location**: src/core/tasks/generators/div.ts
- **Detail**: Plan przewidywał rzadki iloraz 1 (research OQ1), ale implementacja zmieniła też losowanie ilorazu na zakres wykonalny dla dzielnika (bez odrzuceń), bo odrzucenia zawyżały udział `n : n` do 17 %. Zmiana treściowa, choć mała, w zmianie „testowej”; odczyt `sample` E3.10 wykonany.
- **Fix**: — (udokumentowane w §6.6 planu testów; zachowanie DIV sprawdzane przez `tests/div.test.ts`).
- **Decision**: ACCEPTED

### F2 — Progi stałe, bez nadpisania per etap

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: tests/contentInvariants.test.ts
- **Detail**: E1 (liczby do 10) może mieć < 12 różnych zadań; test wypisze liczbę, a stałe są w jednym miejscu — do obniżenia z komentarzem przy S-03.
- **Decision**: ACCEPTED

### F3 — Regex arytmetyki nie obejmuje linii rzymskich i kalendarza

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Safety & Quality
- **Location**: tests/contentInvariants.test.ts
- **Detail**: Podpowiedzi ROMAN („IX = 10 − 1 = 9; razem 9”) i CALENDAR są sprawdzane w testach per typ (`roman.test.ts` liczy sumę 1–100), nie generycznie.
- **Decision**: ACCEPTED
