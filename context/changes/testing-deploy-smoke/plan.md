# Smoke wdrożenia i PWA — Implementation Plan

## Overview

Etap 2 planu testów: po każdym `switch` job `deploy` dowodzi, że produkcja serwuje nowy build (SHA w bundlu), że `index.html`, `manifest.webmanifest` i `sw.js` mają `no-cache`, bundle `_app/*` `immutable`, manifest właściwy `Content-Type`, a precache w `sw.js` obejmuje każdy bundle z `index.html`; ta sama implementacja (`scripts/check-deploy.ts`) działa z sesji agenta. Testy dyspozytorów z `deploy/` wchodzą do CI na PR. Runbook dostaje procedurę ćwiczenia rollbacku i listę kontrolną CoiledSpring przy bootstrapie. Ryzyka #3 i #4.

## Current State Analysis

Z `context/changes/testing-deploy-smoke/research.md`: health check sprawdza tylko obecność tytułu, nazwy w manifeście i 200 dla `sw.js`; job `deploy` nie ma checkoutu ani `node_modules`; CoiledSpring nie jest osiągalny z CI (ACL, klucz), więc jego obserwacja zostaje w procedurze agenta/właściciela; testy `deploy/test-*.sh` istnieją, ale nie biegną w CI; rollback działa przez `workflow_dispatch`.

## Desired End State

`npm run check:deploy -- https://martynka-urzadza.pl <sha7>` kończy się kodem 0 na zdrowej produkcji i wypisuje listę sprawdzeń; z błędnym SHA lub przy braku precache kończy się kodem 1 z nazwą sprawdzenia; job `deploy` uruchamia go po `switch` (przy `rollback` bez SHA); `ci.yml` uruchamia testy dyspozytorów; `deploy/README.md` opisuje smoke, drill rollbacku i listę kontrolną CoiledSpring; cookbook §6.4 wypełniony; etap 2 `complete`.

### Key Discoveries:

- `GITHUB_SHA::7` jest w jobie deploy; przy rollbacku porównanie SHA pomijamy (research Summary).
- Pełna lista bundli nie jest znana z zewnątrz; spójność = bundle z `index.html` ⊆ precache, a każdy wpis `_app/*` z precache daje 200 z `immutable` (research §1).
- Job `deploy` potrzebuje `actions/checkout` + `setup-node` + `npm ci` (~15 s), by uruchomić skrypt TS (research §2, Open Question 1).

## What We're NOT Doing

- E2E w przeglądarce, sprawdzanie instalacji PWA/offline (test ręczny na tablecie, §7).
- Automatyczny rollback na harmonogramie; obserwacja CoiledSpring z CI (ACL/klucz); monitoring/alerty.
- Zmiany w `bootstrap.sh`, `martynka-deploy`, `martynka-ops*`, Caddyfile.

## Implementation Approach

Trzy fazy: (1) skrypt smoke z czystymi parserami i testami; (2) workflowy (deploy: checkout, node, `npm ci`, smoke; ci: testy dyspozytorów); (3) runbook, cookbook, dokumentacja i weryfikacja na żywo po merge (job deploy wykonuje smoke; agent uruchamia go z sesji).

## Phase 1: Skrypt smoke z parserami

### Overview

`scripts/check-deploy.ts` + `scripts/deploy-check/parse.ts` + testy.

### Changes Required:

#### 1. Parsery (czyste)

**File**: `scripts/deploy-check/parse.ts` (nowy), `tests/deployCheck.test.ts` (nowy)

**Contract**: `export const bundlesFromHtml = (html: string): string[]` (ścieżki `/_app/*.js` i `*.css` z `src=`/`href=`, bez duplikatów); `export const precacheFromSw = (sw: string): string[]` (wartości `url:"…"` z tablicy precache, znormalizowane do `/…`); `export const buildIdFromBundle = (js: string, sha7: string): boolean` (literał `"<sha7>"` w tekście); `export interface CheckResult { name: string; ok: boolean; detail: string }`; `export const compareBundles = (html: string[], precache: string[]): CheckResult` (każdy bundle z HTML w precache); `export const cacheControlCheck = (name: string, header: string | null, expected: 'no-cache' | 'immutable'): CheckResult`. Testy na próbkach tekstu z `dist/` (fragment `index.html` i `sw.js` jako stałe w teście) oraz przypadkach negatywnych.

#### 2. CLI

**File**: `scripts/check-deploy.ts` (nowy), `package.json`

**Contract**: `node --import tsx scripts/check-deploy.ts <baseUrl> [sha7]`; `fetch` (Node 22) z ponawianiem pierwszego żądania (6 × 5 s); sprawdzenia: `/` 200 z tytułem i `cache-control: no-cache`; `/index.html` `no-cache`; `/manifest.webmanifest` 200, `content-type` zaczyna się od `application/manifest+json`, `no-cache`, JSON z `name === 'Martynka urządza'`; `/sw.js` 200, `no-cache`, precache niepusty; bundle z `index.html` ⊆ precache; każdy bundle z `index.html` 200 z `immutable`; gdy `sha7` podany: bundle `index-*.js` zawiera `sha7`; `https://www.<host>/` → 301/308 na apex (tylko gdy host nie zaczyna się od `www.` i nie jest `localhost`). Wydruk `ok`/`FAIL` per sprawdzenie, kod 0/1; kod 2 przy złych argumentach. Skrypt `"check:deploy": "node --import tsx scripts/check-deploy.ts"`.

### Success Criteria:

#### Automated Verification:

- `npm test` z `tests/deployCheck.test.ts`; `npm run lint`; `npm run typecheck`
- `npm run check:deploy -- https://martynka-urzadza.pl` kod 0 (z sesji agenta, `allowed_domains`); `npm run check:deploy -- https://martynka-urzadza.pl 0000000` kod 1 z `FAIL build id`
- `npm run check:deploy -- http://localhost:4173` na `npm run preview` kończy się kodem 1 wyłącznie przez nagłówki cache (Vite preview ich nie ustawia) — udokumentowane w wyjściu; `--no-headers`? Nie: preview nie jest celem; kryterium pomijane

#### Manual Verification:

- Odczyt wydruku skryptu na produkcji: wszystkie sprawdzenia `ok`, SHA zgodny z `origin/main`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Workflowy

### Changes Required:

#### 1. Deploy

**File**: `.github/workflows/deploy.yml`

**Contract**: Job `deploy`: na początku `actions/checkout@v4`, `actions/setup-node@v7` (22, cache npm), `npm ci`; krok „Health check” zastąpiony „Smoke check”: `npm run check:deploy -- "$SITE_URL" "${GITHUB_SHA::7}"` przy deployu, bez SHA przy `rollback` (warunek `inputs.action == 'rollback'`); `--retry` z curl przenosi się do skryptu. `Status` bez zmian.

#### 2. CI

**File**: `.github/workflows/ci.yml`

**Contract**: Po `npm test`: `bash deploy/test-martynka-deploy.sh` i `bash deploy/ops/test-martynka-ops.sh`.

### Success Criteria:

#### Automated Verification:

- YAML obu workflowów parsuje; `grep -c 'check:deploy' .github/workflows/deploy.yml` ≥ 1; `grep -c 'test-martynka-ops.sh' .github/workflows/ci.yml` = 1
- `bash deploy/test-martynka-deploy.sh && bash deploy/ops/test-martynka-ops.sh` lokalnie `OK`

#### Manual Verification:

- CI na PR zielone z testami dyspozytorów

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Runbook, cookbook, weryfikacja po merge

### Changes Required:

#### 1. Runbook

**File**: `deploy/README.md`

**Contract**: Sekcja 6 (deploy/rollback/status): akapit „Smoke po deployu” (co sprawdza, jak uruchomić z własnej maszyny); „Ćwiczenie rollbacku” (co kwartał lub po zmianach w `deploy/`: `workflow_dispatch` rollback → smoke bez SHA → `workflow_dispatch` deploy → smoke z SHA); sekcja 10: lista kontrolna przed/po `bootstrap` (`ssh cs-ops status`, `ssh martynka-ops status`, `check:deploy`).

#### 2. Plan testów i docs

**File**: `context/foundation/test-plan.md`, `CLAUDE.md`, `AGENTS.md`

**Contract**: §6.4 „Adding a deploy smoke check” (gdzie: `scripts/deploy-check/parse.ts` + `check-deploy.ts`, test odniesienia, komenda); §6.6 notatka; §5 wiersz deploy smoke `required`; §3 status. CLAUDE.md: `npm run check:deploy` w Commands i w akapicie Deployment. AGENTS.md: wzmianka ≤ 400 słów (lub bez zmian, jeśli limit nie pozwala).

#### 3. Weryfikacja po merge

**File**: brak

**Contract**: Po merge PR: job deploy zielony z krokiem smoke; agent uruchamia `check:deploy` z sesji na `origin/main` SHA.

### Success Criteria:

#### Automated Verification:

- `grep -c 'check:deploy' deploy/README.md CLAUDE.md` ≥ 1 w każdym; `grep -c 'scripts/deploy-check/parse.ts' context/foundation/test-plan.md` ≥ 1; `tail -n +2 AGENTS.md | wc -w` ≤ 400

#### Manual Verification:

- Job deploy po merge zielony z krokiem „Smoke check”; `check:deploy` z sesji agenta kod 0 z SHA `origin/main`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- `tests/deployCheck.test.ts` (parsery, porównania, nagłówki).

### Integration Tests:

- `check:deploy` na produkcji z sesji agenta i w jobie deploy; testy dyspozytorów w CI.

### Manual Testing Steps:

1. `npm run check:deploy -- https://martynka-urzadza.pl <sha>` po merge.
2. Drill rollbacku wg runbooka (poza tym wycinkiem, pierwszy raz po zmianach w `deploy/`).

## Performance Considerations

Smoke: ~10 żądań HTTP, kilka sekund; `npm ci` w jobie deploy ~15 s z cache.

## Migration Notes

Brak.

## References

- `context/changes/testing-deploy-smoke/research.md`; `context/foundation/test-plan.md` §2 #3, #4.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Skrypt smoke z parserami

#### Automated

- [ ] 1.1 `npm test` z deployCheck, lint, typecheck
- [ ] 1.2 `check:deploy` na produkcji kod 0; ze złym SHA kod 1 (`FAIL build id`)
- [ ] 1.3 Kryterium preview pominięte (udokumentowane)

#### Manual

- [ ] 1.4 Wydruk smoke na produkcji przeczytany, SHA zgodny z origin/main

### Phase 2: Workflowy

#### Automated

- [ ] 2.1 YAML parsuje; `check:deploy` w deploy.yml; testy dyspozytorów w ci.yml
- [ ] 2.2 Testy dyspozytorów lokalnie OK

#### Manual

- [ ] 2.3 CI na PR zielone

### Phase 3: Runbook, cookbook, weryfikacja po merge

#### Automated

- [ ] 3.1 `check:deploy` w README i CLAUDE.md; parse.ts w test-plan; AGENTS ≤ 400

#### Manual

- [ ] 3.2 Job deploy po merge zielony ze smoke; `check:deploy` z sesji kod 0
