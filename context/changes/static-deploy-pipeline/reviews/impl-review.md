<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Statyczny deploy dist/ z GitHub Actions na VPS za Caddy

- **Plan**: context/changes/static-deploy-pipeline/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3
- **Date**: 2026-10-11
- **Verdict**: APPROVED (po triage; przed: NEEDS ATTENTION, 3 ostrzeżenia)
- **Findings**: 0 critical, 3 warnings, 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

Zakres git: commity `3e07b97`…`3407797` na `m0/static-deploy-pipeline` (fast-forward do `main`). Wszystkie planowane pliki MATCH; adaptacje z wdrożenia (profil w `issuer acme`, `bind` + `--bind`, `caddy fmt`, kontrola `is-active`, strażnik OS, `$HOME` w `-e`) udokumentowane w plikach. Kryteria: 15/15 odhaczone z dowodami (runy GitHub 38166467011 deploy, 38166671894 rollback; curl z zewnątrz; potwierdzenia właściciela dla CoiledSpring i tabletu).

## Findings

### F1 — `immutable` dla `/assets/*` obejmie przyszłą nienazwaną hashem grafikę z `public/assets`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: deploy/Caddyfile:13-14; plan gry `Martynka-urzadza.md` sekcja 10 (`public/assets/...`)
- **Detail**: Vite kopiuje `public/` do `dist/` bez hashowania; gdy w M7 pojawi się grafika w `public/assets/`, tablety zapamiętają ją na rok i nie zobaczą podmian.
- **Fix**: Przy S-01 (PWA, i tak zmienia Caddyfile i wymaga ponownego bootstrapu) przenieść hashowane bundle Vite do `build.assetsDir: '_app'` i matcher Caddy na `/_app/*`, zostawiając `public/assets/` z domyślnym cache (service worker precache zajmie się resztą).
- **Decision**: ACCEPTED (do S-01; zapisane w roadmapie jako Unknown S-01)

### F2 — `caddy fmt` po `cmp` sprawiał, że każde uruchomienie nadpisywało `.bak`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: deploy/bootstrap.sh (krok 5)
- **Detail**: Formatowanie po porównaniu oznaczało, że niezmieniona konfiguracja nigdy nie była równa tymczasowej, więc `.bak` tracił prawdziwą poprzednią wersję.
- **Fix**: `caddy fmt --overwrite "$CADDYFILE_TMP"` przed `cmp`.
- **Decision**: FIXED (2026-10-11)

### F3 — `gpg --dearmor` bez `--yes --batch` może zapytać o nadpisanie

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: deploy/bootstrap.sh (instalacja repo Caddy)
- **Detail**: Po częściowo nieudanej instalacji keyring już istnieje, a gpg pytałby interaktywnie.
- **Fix**: `gpg --dearmor --yes --batch`.
- **Decision**: FIXED (2026-10-11)

### F4 — `set -- $cmd` bez `set -f`

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: deploy/martynka-deploy (switch)
- **Detail**: Allowlista znaków wyklucza `*?[`, więc globbing nie wystąpi; `set -f` jako pas i szelki.
- **Fix**: Dodane `set -f`.
- **Decision**: FIXED (2026-10-11)

### F5 — rrsync `-wo` na całym `releases/` i symlinki w uploadzie

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: deploy/martynka-deploy (gałąź rsync), .github/workflows/deploy.yml (rsync -rlt)
- **Detail**: Klucz CI może `--delete` dowolne wydanie i wgrać symlink; zaufany klucz CI, build z `dist/` nie zawiera symlinków.
- **Fix**: Rozważyć `--safe-links` po stronie CI przy S-01; bez zmian teraz.
- **Decision**: ACCEPTED

### F6 — `--site <domena>` bez walidacji znaków dla `sed`

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: deploy/bootstrap.sh
- **Detail**: Wejście tylko od właściciela; `|` lub spacja zepsują `sed`, ale nie dadzą eskalacji.
- **Fix**: Brak zmian.
- **Decision**: ACCEPTED

### F7 — Nieudany reload po poprawnym `validate` nie przywraca `.bak`

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: deploy/bootstrap.sh (krok 7)
- **Detail**: Skrypt kończy się błędem z logiem, Caddy może zostać wyłączone; runbook sekcja 8 opisuje ręczną naprawę.
- **Fix**: Brak zmian; udokumentowane.
- **Decision**: ACCEPTED

### F8 — Runbook: ścieżka po `scp` niezgodna z komendą uruchomienia

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: deploy/README.md sekcja 4 i 7
- **Detail**: Komenda uruchamiana z cwd nie pasowała do ścieżki po kopiowaniu.
- **Fix**: Sekcja 4 pokazuje `rsync` + `ssh … bash /root/martynka-deploy/bootstrap.sh` (sprawdzone w praktyce), sekcja 7 analogicznie z `--bind`; tabela plików z `__BIND__`; nieaktualny komentarz w bootstrapie poprawiony.
- **Decision**: FIXED (2026-10-11)

### F9 — Pinowanie akcji tylko dla Tailscale

- **Severity**: ℹ️ OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: .github/workflows/deploy.yml
- **Detail**: Zgodne z planem i z CoiledSpring (tagi major dla akcji GitHuba).
- **Fix**: Brak zmian.
- **Decision**: DISMISSED
