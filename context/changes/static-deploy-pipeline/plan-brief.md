# Statyczny deploy dist/ z GitHub Actions na VPS za Caddy — Plan Brief

> Full plan: `context/changes/static-deploy-pipeline/plan.md`
> Research: `context/changes/static-deploy-pipeline/research.md`

## What & Why

Roadmapa F-02 (etap M0): po każdym pushu na `main` GitHub Actions buduje grę i publikuje ją na istniejącym VPS jako nowe wydanie, przełącza je atomowo i sprawdza stronę przez HTTPS; poprzednie wydania zostają do rollbacku. Bez tego S-01 (instalowalna PWA) nie ma gdzie być testowane na tablecie, a plan wymaga sprawdzania offline po każdym etapie.

## Starting Point

VPS dzielony z CoiledSpring: Ubuntu 24.04, Docker, Tailscale, UFW blokujący cały ruch publiczny, CoiledSpring widoczne tylko w tailnecie przez `tailscale serve`. Brak Caddy, rsync, publicznych 80/443. CI CoiledSpring łączy się przez `tailscale/github-action` v4.2.0 (tag `tag:ci`, ACL już pozwala na SSH do serwera) na nieograniczone konto `deploy`. Repo Martynki ma działający `npm run build` (F-01), brak `.github/` i `deploy/`. Agent nie ma roota na VPS; konto `ops` ma allowlistę.

## Desired End State

Push na `main` → workflow zielony → `https://<publiczne IPv4>` pokazuje grę z certyfikatem Let's Encrypt (bez ostrzeżeń na tablecie), assety z `immutable`, `index.html` z `no-cache`. `workflow_dispatch` z `rollback` przywraca poprzednie wydanie. Na VPS użytkownik `martynka` może tylko wgrać wydanie i przełączyć symlink; CoiledSpring działa jak dotąd. `deploy/README.md` prowadzi właściciela przez bootstrap, sekrety, deploy, rollback i przejście na domenę.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| HTTPS bez domeny | Caddy + cert Let's Encrypt na publiczne IPv4 (`tls { profile shortlived }`) | Docelowa architektura od razu, przejście na domenę to jeden parametr; sslip.io odrzucone (wspólny limit LE), Funnel omijałby Caddy | Research / Plan |
| Podmiana wydania | Jeden klucz SSH z dyspozytorem `martynka-deploy` (rsync → rrsync, `switch`, `rollback`, `status`) | Jeden sekret, jeden audytowalny plik, wzór `cs-ops`; rrsync sam nie zmieni symlinku | Research / Plan |
| Dostęp CI | Tailscale (`tag:ci`) → OpenSSH na adresie tailnetu, `restrict,from=` CGNAT, `Match User` + `ForceCommand` | Tailscale SSH nie ma wymuszonych komend; ACL i klient OAuth już istnieją | Research |
| Izolacja od CoiledSpring | Osobny użytkownik, `/srv/martynka`, własny plik sshd `61-…`, UFW tylko +80/443 | Klucz CI Martynki nie może dać dostępu do CoiledSpring | Research |
| Caddy | Oficjalne repo apt (≥ 2.10), `encode zstd gzip`, `immutable` dla `/assets/*`, `no-cache` dla `/`, `index.html`, `sw.js`, manifestu | Pakiet Ubuntu za stary na cert na IP; nagłówki pod Vite i przyszły service worker | Research |
| Retencja | 5 wydań, `rollback` do poprzedniego | Spełnia Outcome F-02 przy małym builda (1,4 MB), bez `--link-dest` | Plan |
| Kto uruchamia bootstrap | Właściciel jako root; agent dostarcza skrypt, runbook i weryfikuje z zewnątrz | Konto agenta na VPS ma allowlistę; probe z sesji zablokowany | Research |

## Scope

**In scope:** `deploy/bootstrap.sh`, `deploy/martynka-deploy`, `deploy/test-martynka-deploy.sh`, `deploy/Caddyfile`, `.github/workflows/deploy.yml`, `deploy/README.md`, aktualizacja CLAUDE.md i AGENTS.md, pierwszy deploy i test rollbacku z udziałem właściciela.

**Out of scope:** domena i DNS (gotowy wariant w bootstrapie), PWA (S-01), zmiany w CoiledSpring, Funnel/sslip.io, staging, CI na PR (F-03), monitoring.

## Architecture / Approach

GitHub Actions (build, typecheck, artefakt) → węzeł Tailscale `tag:ci` → `rsync` przez SSH do `martynka@<tailnet>` (rrsync, `/srv/martynka/releases/<id>`) → `switch <id>` (symlink `current`, chmod, prune) → Caddy serwuje `current` na 80/443 z certem LE na IP → health check `curl`. Wszystko po stronie serwera to pliki w `deploy/` instalowane idempotentnym bootstrapem.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Strona serwera w repo | bootstrap, dyspozytor z testem lokalnym, Caddyfile | Błąd w sshd `Match` mógłby odciąć SSH: `sshd -t` przed reload |
| 2. Workflow GitHub Actions | deploy po pushu, rollback na żądanie, health check | Zestaw sekretów i pin akcji Tailscale muszą zgadzać się z runbookiem |
| 3. Uruchomienie i runbook | bootstrap przez właściciela, sekrety, pierwszy deploy, rollback, docs | Cert na IP wymaga Caddy ≥ 2.10 i otwartych 80/443 z internetu; współistnienie z `tailscale serve` niepotwierdzone |

**Prerequisites:** F-01 zmergowane (build działa), dostęp root właściciela do VPS, klient OAuth Tailscale z CoiledSpring, publiczny adres IPv4 VPS.
**Estimated effort:** jedna sesja agenta na fazy 1–2; faza 3 zależy od czasu właściciela (bootstrap, sekrety, push) i jednego przebiegu workflow.

## Open Risks & Assumptions

- Stan VPS znany z dokumentacji CoiledSpring, nie z obserwacji; bootstrap musi być idempotentny i wypisywać diagnostykę.
- Certyfikaty LE na IP są nowe (GA 2026-01) i 6-dniowe; Caddy odnawia je sam, ale pierwsza emisja wymaga portów 80/443 otwartych zanim Caddy wystartuje.
- Caddy na `0.0.0.0:443` obok `tailscale serve` na 443 adresu tailnetu: oczekiwane współistnienie, sprawdzane w fazie 3.
- Zmiana adresu z IP na domenę później wymusi reinstalację PWA na tablecie (koszt zaakceptowany).

## Success Criteria (Summary)

- Push na `main` kończy się zielonym workflow, a `https://<IP>` z sesji agenta zwraca stronę z tytułem gry i poprawnymi nagłówkami cache.
- Rollback przez `workflow_dispatch` działa; użytkownik `martynka` nie może wykonać nic poza dyspozytorem.
- CoiledSpring działa bez zmian; runbook pozwala właścicielowi powtórzyć bootstrap i przejść na domenę.
