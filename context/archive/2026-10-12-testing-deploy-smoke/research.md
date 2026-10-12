---
date: 2026-10-12T20:00:00+02:00
researcher: Claude (orkiestrator, sesja 2026-10-12)
git_commit: 4e52179
branch: m1/testing-deploy-smoke
repository: Martynka-urzadza
topic: "Etap 2 planu testów (smoke wdrożenia i PWA): co da się sprawdzić po `switch` z joba deploy i z sesji agenta, jak zweryfikować precache i nagłówki, jak obserwować CoiledSpring, jak ćwiczyć rollback"
tags: [research, deploy, pwa, smoke, caddy, workflow, test-plan]
status: complete
last_updated: 2026-10-12
last_updated_by: Claude (orkiestrator)
---

# Research: testing-deploy-smoke

**Date**: 2026-10-12T20:00:00+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-12)
**Git Commit**: 4e52179
**Branch**: m1/testing-deploy-smoke
**Repository**: Martynka-urzadza

## Research Question

Ground rollout Phase 2 of `context/foundation/test-plan.md` („Deploy and PWA smoke”). Ryzyka #3 (stary build, złe nagłówki, zepsuty precache po deployu) i #4 (deploy/bootstrap psuje wspólny VPS). Pytania: (1) co dziś sprawdza job `deploy` po `switch`; (2) jakie obserwowalne fakty dowodzą, że nowy build jest na żywo i instalowalny offline; (3) czy z joba CI da się zaobserwować CoiledSpring; (4) jak ćwiczyć rollback bez ryzyka; (5) gdzie umieścić logikę smoke, żeby służyła i workflow, i sesji agenta.

## Summary

- Dziś (`.github/workflows/deploy.yml:104-112`): po `switch` krok „Health check” robi `curl` na `/` (tytuł), `manifest.webmanifest` (nazwa) i `sw.js` (200), potem `ssh vps status`. Nie sprawdza: identyfikatora builda (czy serwowany bundle odpowiada `GITHUB_SHA`), nagłówków `Cache-Control`, zgodności precache z `index.html`, `Content-Type` manifestu, przekierowania `www`.
- Obserwowalne fakty (zweryfikowane w S-01 ręcznie przez `curl`): `index.html` odwołuje się do `/_app/index-<hash>.js` i `/_app/index-<hash>.css`; bundle zawiera literał krótkiego SHA (`__BUILD_ID__` z `GITHUB_SHA.slice(0,7)` w CI, `vite/config.shared.mjs`); `sw.js` zawiera wpisy `url:"_app/<plik>"` z `revision:null` i wpisy `index.html`, `manifest.webmanifest`, `icons/*`; nagłówki: `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest` → `cache-control: no-cache`, `/_app/*` → `public, max-age=31536000, immutable`, manifest `content-type: application/manifest+json` (`deploy/Caddyfile:12-23`); `https://www.martynka-urzadza.pl/` → 301 na apex.
- Identyfikator builda w CI: `RELEASE=<data>-${GITHUB_SHA::7}` (`deploy.yml:91`), więc `GITHUB_SHA::7` jest dostępne w jobie; przy `rollback` oczekiwany SHA to poprzednie wydanie (`status` wypisuje `previous:`), więc smoke przy rollbacku sprawdza tylko spójność (bundle z `index.html` istnieje i jest w precache), bez porównania z `GITHUB_SHA`.
- CoiledSpring z joba CI: węzeł Tailscale `tag:ci` ma ACL tylko `tcp:22` do `tag:server` (F-02 research), a klucz CI jest ograniczony do `martynka-deploy` (`status`, `switch`, `rollback`), więc job nie zobaczy CoiledSpring (HTTPS 443 tailnetu ani `cs-ops`). Obserwacja CoiledSpring zostaje po stronie agenta/właściciela: `ssh cs-ops status` przed i po `bootstrap` (archiwum `agent-ops-access`), nie po zwykłym deployu (deploy nie dotyka Caddy ani Dockera; tylko rsync + symlink).
- Rollback: `workflow_dispatch` z `action=rollback` działa (F-02, testowane 2026-10-11); automatyczny harmonogram przełączałby produkcję, więc „ćwiczenie” = udokumentowana procedura ręczna (co kwartał lub po zmianach w `deploy/`): rollback → smoke → ponowny deploy przez `workflow_dispatch` `action=deploy`. Smoke przy rollbacku weryfikuje spójność serwowanego wydania.
- Miejsce logiki: skrypt `scripts/check-deploy.ts` (Node 22 ma globalne `fetch`; uruchamiany przez `node --import tsx` jak `sample`), parametry: adres, oczekiwany SHA (opcjonalnie); kod 1 przy jakiejkolwiek rozbieżności z czytelną listą. Workflow woła `npm run check:deploy -- "$SITE_URL" "${GITHUB_SHA::7}"` (lub bez SHA przy rollbacku); agent woła to samo z sesji (`allowed_domains: martynka-urzadza.pl`). Testy jednostkowe funkcji analizujących (wyciąganie bundli z HTML, wpisów precache z `sw.js`, porównanie) na próbkach tekstu; część sieciowa w CI.
- `curl --retry` w kroku health zostaje (Caddy może dopiero wystawiać certyfikat przy pierwszym wydaniu); skrypt ma własne ponawianie (np. 6 × 5 s) dla pierwszego żądania.

## Detailed Findings

### 1. Co serwuje produkcja (stan po S-01/S-02)

- `index.html` (budowany przez Vite): `<script type="module" crossorigin src="/_app/index-<hash>.js">`, `<link rel="stylesheet" crossorigin href="/_app/index-<hash>.css">`, `<link rel="manifest" href="/manifest.webmanifest">`.
- `sw.js` (workbox, `inlineWorkboxRuntime`): precache jako tablica obiektów `{url:"…",revision:…}`; bundle `_app/*` z `revision:null`, pozostałe z hashem.
- Chunk Phasera `_app/phaser-<hash>.js` ładowany przez `index-<hash>.js` (import), nie przez `index.html`; pełna lista bundli = pliki `_app/*.js|css` z `dist/` — w smoke dostępna tylko lista z `index.html` plus to, co wymienia `sw.js`; test spójności: każdy bundle z `index.html` jest w precache, a każdy wpis `_app/*` z precache odpowiada 200 z `immutable`.

### 2. Co może zrobić job deploy

- Ma `SITE_URL`, `GITHUB_SHA`, `RELEASE`, SSH do `martynka-deploy` (`status`). Może uruchomić `node --import tsx scripts/check-deploy.ts` tylko, jeśli ma `node_modules` (job `deploy` nie robi `npm ci`; job `build` robi). Opcje: (a) `npm ci` w jobie deploy (~15 s z cache), (b) skompilować/skopiować skrypt jako artefakt, (c) smoke w bashu z `curl`/`grep`. Wybór (a) jest najprostszy i trzyma jedną implementację.
- Dla `workflow_dispatch` `rollback` job `build` jest pomijany; `npm ci` w jobie deploy i tak działa (checkout potrzebny: dziś job deploy nie robi `actions/checkout` — trzeba dodać).

### 3. CoiledSpring i bootstrap

- `ssh cs-ops status` z sesji agenta (poza sandboxem) pokazuje kontenery i health; `ssh martynka-ops status`/`diag` pokazują Caddy, listenery, `tailscale serve status`. Procedura po `bootstrap`: `cs-ops status` przed i po — już stosowana ręcznie w S-01; do zapisania jako lista kontrolna w runbooku (`deploy/README.md` sekcja 10) i w cookbooku §6.4.

### 4. Hot-spot `deploy/` i granice

- Pliki: `bootstrap.sh`, `Caddyfile`, `martynka-deploy`, `ops/*`, `README.md` — zmiany w ostatnich 30 dniach to F-02, agent-ops-access, S-01 (`/_app`, Content-Type). Testy lokalne: `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` (istnieją, nie są w CI). Dodanie ich do `ci.yml` (bash, bez serwera) to tani sygnał dla ryzyka #4 (dyspozytor i allowlista).

## Code References

- `.github/workflows/deploy.yml:46-112` - job deploy (brak checkout/npm ci, health check, status)
- `deploy/Caddyfile:12-23` - matchery cache i Content-Type
- `vite/config.shared.mjs` - `__BUILD_ID__`, `assetsDir: '_app'`, precache globy
- `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` - testy lokalne dyspozytorów
- `scripts/sample.ts` - wzorzec skryptu `node --import tsx` z kodami wyjścia

## Architecture Insights

- Jedna implementacja smoke (`scripts/check-deploy.ts`) z czystymi funkcjami parsującymi (testowalne vitest) i cienką warstwą sieciową; używana przez workflow i agenta.
- Smoke nie zastępuje ręcznego testu na tablecie (instalacja, offline): dowodzi stanu serwera, nie zachowania przeglądarki (test-plan §7).

## Historical Context (from prior changes)

- F-02: health check i rollback; S-01: nagłówki PWA, `_app`, Content-Type manifestu (PR #6 jako poprawka po deployu — dokładnie klasa błędu, którą smoke ma łapać).

## Related Research

- `context/archive/2026-10-11-static-deploy-pipeline/research.md`, `context/archive/2026-10-11-installable-offline-pwa/research.md`.

## Open Questions

1. `npm ci` w jobie deploy (ok. 15 s) kontra smoke w bashu: propozycja `npm ci` + skrypt TS (jedna implementacja, testy jednostkowe parserów).
2. Czy dodać `deploy/test-*.sh` do `ci.yml`? Propozycja: tak (sekundy, bez serwera).
