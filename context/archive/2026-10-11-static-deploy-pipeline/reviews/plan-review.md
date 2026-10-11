<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Statyczny deploy dist/ z GitHub Actions na VPS za Caddy

- **Plan**: context/changes/static-deploy-pipeline/plan.md
- **Mode**: Deep (bez subagenta: ryzykowne twierdzenia zweryfikowane w research.md i źródłach CoiledSpring)
- **Date**: 2026-10-11
- **Verdict**: SOUND (po poprawkach; przed: REVISE, 2 ostrzeżenia niskiego wpływu)
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
Paths: `package.json` (build/typecheck), `dist/` (po F-01), `/Users/kamilp/Dev/CoiledSpring/.github/workflows/deploy.yml:117-144` (pin akcji Tailscale, sekrety), `CoiledSpring/deploy/README.md:36-45,377` (ACL, `restrict,from=`), `ops/install-ops.sh:120-133` (`Match User` + `ForceCommand`) ✓. brief↔plan ✓ (3 fazy, te same decyzje). Progress↔Phase: 4/4/7 = 4/4/7, jeden `## Progress`. Spójność wewnętrzna: „Not doing” nie wraca w fazach; każda obietnica końcowa (cert na IP, rollback, nagłówki, runbook, docs) ma fazę.

## Findings

### F1 — Health check może nie doczekać pierwszego certyfikatu

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — Workflow, health check
- **Detail**: Przy pierwszym wydaniu Caddy wystawia certyfikat LE dopiero przy pierwszym żądaniu/po starcie; 6 prób co 5 s mogło nie wystarczyć, a `curl --retry` bez `--retry-all-errors` nie ponawia przy błędach TLS/połączenia.
- **Fix**: `--retry 12 --retry-delay 10 --retry-all-errors`.
- **Decision**: FIXED (2026-10-11)

### F2 — `needs: build` blokuje job deploy przy rollbacku

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Workflow, job deploy
- **Detail**: Gdy `build` jest pomijany (`action=rollback`), job z `needs: build` też zostaje pominięty, więc rollback nigdy by się nie wykonał.
- **Fix**: `if: ${{ !cancelled() && (needs.build.result == 'success' || inputs.action == 'rollback') }}`.
- **Decision**: FIXED (2026-10-11)

### F3 — `--mkpath` i rrsync

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — rsync do `/$RELEASE/`
- **Detail**: `--mkpath` wymaga rsync ≥ 3.2.3 po obu stronach (ubuntu-latest i Ubuntu 24.04 mają 3.2.7) i jest na liście dozwolonych w rrsync (research §3). Nie dało się tego sprawdzić lokalnie (macOS bez rrsync).
- **Fix**: Brak zmiany; w razie odrzucenia przez rrsync w fazie 3 dyspozytor może tworzyć katalog wydania w podkomendzie `prepare <id>`.
- **Decision**: ACCEPTED

### F4 — Faza 3 zależy od działań właściciela

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 3
- **Detail**: Kryteria automatyczne 3.1–3.2 wykonuje agent z zewnątrz, ale dopiero po bootstrapie, sekretach i pushu po stronie właściciela; faza może pozostać otwarta między sesjami.
- **Fix**: Brak zmiany planu; faza 3 jest celowo wydzielona, a runbook minimalizuje liczbę kroków właściciela.
- **Decision**: ACCEPTED
