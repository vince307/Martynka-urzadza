# Statyczny deploy dist/ z GitHub Actions na VPS za Caddy — Implementation Plan

## Overview

Roadmapa F-02 (`static-deploy-pipeline`, etap M0). Każdy push na `main` buduje `dist/` w GitHub Actions i publikuje go na istniejącym VPS (wspólnym z CoiledSpring) jako nowe wydanie w `/srv/martynka/releases/<id>/`, przełącza symlink `current` atomowo i sprawdza stronę przez HTTPS. Caddy serwuje `current` na publicznych 80/443 z certyfikatem Let's Encrypt wystawionym na publiczny adres IPv4 (do czasu kupienia domeny). Dostęp CI do serwera: Tailscale (efemeryczny węzeł `tag:ci`) → OpenSSH na adresie tailnetu → użytkownik `martynka` z wymuszoną komendą-dyspozytorem (rsync przez rrsync, `switch`, `rollback`). Poprzednie wydania zostają (5 ostatnich). Odblokowuje S-01 (gra otwiera się z adresu URL na tablecie) i weryfikację offline po każdym etapie.

## Current State Analysis

Z `context/changes/static-deploy-pipeline/research.md` (status partial: VPS znany z dokumentacji CoiledSpring, nie z obserwacji):

- VPS: Ubuntu 24.04 po `CoiledSpring/deploy/bootstrap.sh`: Docker, Tailscale, UFW (`allow in on tailscale0`, `22/tcp` do czasu blokady, `default deny incoming`), użytkownicy `deploy` (CI CoiledSpring, bez ograniczeń) i `ops` (agent, `ForceCommand cs-ops`, plik sshd `60-coiled-spring-ops.conf`). CoiledSpring wystawione tylko przez `tailscale serve --bg 4321`. **Brak** Caddy, rsync/rrsync, czegokolwiek na publicznych 80/443.
- CI CoiledSpring (`.github/workflows/deploy.yml:117-144`): `tailscale/github-action@d1b6cd204f8dceda5b3eaad7f1f767be390056cd # v4.2.0`, sekrety `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `StrictHostKeyChecking yes`, `concurrency: deploy`. ACL tailnetu już zawiera `tag:ci → tag:server tcp:22`.
- `rrsync` w pakiecie `rsync` (`/usr/bin/rrsync`); dopuszcza `--delete`, `--delay-updates`, `--mkpath`; odrzuca `..`, `--chmod`. Tailscale SSH nie ma wymuszonych komend, więc ograniczenie jest w OpenSSH z `from=` dla CGNAT tailnetu.
- Let's Encrypt wydaje certyfikaty na adresy IP (6-dniowe, od 2026-01-15); Caddy obsługuje je przez `tls { profile shortlived }` (Caddy ≥ 2.10; pakiet z Ubuntu 24.04 jest starszy, więc instalacja z oficjalnego repo apt Caddy). `sslip.io` odrzucone (wspólny limit LE).
- To repo: `package.json` ma `build` i `typecheck`, `package-lock.json` spójny (F-01), `dist/` z `index.html` i `assets/{index,phaser}-*.js`, `base: './'`. Brak `.github/`, brak `deploy/`.
- Agent nie ma dostępu root do VPS (konto `ops` ma allowlistę); bootstrap uruchamia właściciel. Probe VPS z sesji agenta jest zablokowany (sandbox, klasyfikator).

## Desired End State

Po pushu na `main` workflow „Deploy” kończy się zielono: build, typecheck, rsync do `releases/<id>`, `switch`, health check `https://<IP>/` zwraca 200 i HTML z tytułem gry; `curl -sI https://<IP>/assets/<plik>.js` ma `Cache-Control: public, max-age=31536000, immutable`, a `/` i `/index.html` `no-cache`. `workflow_dispatch` z `action=rollback` przywraca poprzednie wydanie. Na VPS: `caddy` aktywne na 80/443 z certyfikatem LE na IP, `/srv/martynka/{releases,current}`, użytkownik `martynka` tylko z dyspozytorem, UFW z 80/443, CoiledSpring nietknięte (`tailscale serve` działa). `deploy/README.md` opisuje bootstrap, sekrety, deploy, rollback i przejście na domenę.

### Key Discoveries:

- rrsync czyta `SSH_ORIGINAL_COMMAND` sam, więc dyspozytor rozpoznaje tylko prefiks `rsync --server` i wykonuje `exec /usr/bin/rrsync -wo /srv/martynka/releases`; reszta podkomend to proste akcje na symlinku.
- rrsync odrzuca `--chmod` i `..`, więc uprawnienia plików dla Caddy (użytkownik `caddy` musi czytać) ustawia dyspozytor przy `switch` (`chmod -R u=rwX,go=rX`), a `--link-dest` nie jest używane (dist ma ok. 1,4 MB).
- Nazwa wydania `YYYYMMDDTHHMMSSZ-<sha7>` sortuje się leksykograficznie = chronologicznie, więc `rollback` to „najnowsze wydanie starsze od bieżącego”.
- Caddy `header` wykonuje się przed `file_server`; `try_files` niepotrzebne (gra bez routingu URL).
- `tailscale/github-action` v4 wymaga Node 24 na runnerze (`ubuntu-latest` ma) i `tags` przy OAuth; węzeł efemeryczny, usuwany po jobie.

## What We're NOT Doing

- Zakup domeny i DNS; Caddyfile ma gotowy wariant na domenę, przełączany jednym parametrem bootstrapu.
- Manifest PWA, service worker, instrukcja instalacji, nakładka „Obróć tablet” (S-01). Health check sprawdza tylko stronę główną.
- Zmiany w CoiledSpring (jego użytkownicy, UFW poza dodaniem 80/443, `tailscale serve`, jednostki). Reużywamy jedynie klienta OAuth Tailscale i ACL.
- Tailscale Funnel, sslip.io, certyfikaty wewnętrzne Caddy.
- Deploy ze środowisk innych niż `main` (brak staging), podgląd PR, CI na pull requestach (dojdzie z F-03 razem z testami).
- Monitoring i alerty (poza health checkiem w workflow).
- Uruchamianie bootstrapu przez agenta: robi to właściciel jako root (faza 3).

## Implementation Approach

Trzy fazy: najpierw strona serwera jako pliki w repo (`deploy/`), testowane lokalnie na tyle, na ile się da (składnia, logika dyspozytora w katalogu tymczasowym); potem workflow GitHub walidowany lokalnie (YAML, te same komendy builda); na końcu uruchomienie przez właściciela (bootstrap jako root, sekrety) i weryfikacja z zewnątrz przez `curl` oraz test rollbacku. Konwencje z CoiledSpring: idempotentny `bootstrap.sh` z `set -euo pipefail` i funkcjami `ensure_*`, runbook po polsku, `restrict,from=` w `authorized_keys`, osobny plik `Match` w `sshd_config.d`, pinowany SHA akcji Tailscale.

## Critical Implementation Details

**Kolejność w bootstrapie.** Najpierw użytkownik i katalogi, potem sshd (`sshd -t` przed `systemctl reload ssh`), potem Caddy (instalacja repo apt → Caddyfile → `caddy validate` → `systemctl enable --now caddy`), na końcu UFW 80/443. Jeśli `sshd -t` nie przejdzie, bootstrap musi się zatrzymać przed przeładowaniem SSH, żeby nie odciąć właściciela.

**Certyfikat na IP.** Blok `https://<IPv4>` z `tls { profile shortlived }` wymaga Caddy ≥ 2.10; bootstrap sprawdza `caddy version` i przerywa z komunikatem, jeśli jest starsza. Let's Encrypt wymaga dostępu do portu 80 i 443 z internetu, więc UFW musi być otwarte przed pierwszym `caddy reload`; Caddy odnawia 6-dniowe certyfikaty sam.

**Współistnienie z `tailscale serve`.** Caddy binduje `0.0.0.0:443`; `tailscaled` obsługuje 443 na adresie tailnetu wewnętrznie. Bootstrap wypisuje `ss -ltnp | grep :443` i `tailscale serve status` po starcie Caddy, a runbook każe sprawdzić, że CoiledSpring nadal odpowiada; to jest kryterium ręczne fazy 3.

**Bezpieczeństwo klucza CI.** Klucz `martynka` daje tylko: zapis do `releases/` przez rrsync i przełączanie symlinku; `restrict` + `from=100.64.0.0/10,fd7a:115c:a1e0::/48` + `ForceCommand` (plik `Match`), brak sudo. Nigdy nie dodawać go do konta `deploy` CoiledSpring.

## Phase 1: Strona serwera w repo (`deploy/`)

### Overview

Wszystko, co ląduje na VPS, jako pliki w repo: bootstrap, dyspozytor, Caddyfile, test dyspozytora.

### Changes Required:

#### 1. Dyspozytor

**File**: `deploy/martynka-deploy`

**Intent**: Jedyna komenda dostępna dla klucza CI; ogranicza użytkownika `martynka` do rsync wydań i przełączania symlinku.

**Contract**: Bash, `set -euo pipefail`, czyta `SSH_ORIGINAL_COMMAND`. Katalog bazowy z `MARTYNKA_ROOT` (domyślnie `/srv/martynka`; zmienna istnieje po to, żeby test lokalny mógł wskazać katalog tymczasowy). Podkomendy: `rsync --server …` → `exec /usr/bin/rrsync -wo "$ROOT/releases"` (ścieżka rrsync z `MARTYNKA_RRSYNC`, domyślnie `/usr/bin/rrsync`); `switch <id>` → waliduje `<id>` regexem `^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{7,40}$`, wymaga `releases/<id>/index.html`, `chmod -R u=rwX,go=rX releases/<id>`, `ln -sfn "releases/<id>" current.tmp && mv -T current.tmp current`, zapisuje `.previous` (poprzedni cel symlinku), przycina do 5 najnowszych wydań (nigdy bieżącego ani `.previous`), wypisuje `switched to <id>`; `rollback` → cel z `.previous` (musi istnieć), wykonuje `switch`; `status` → bieżący cel, poprzedni, lista wydań; `help`; wszystko inne → `exit 2` z komunikatem. Znaki dozwolone w komendzie: `[A-Za-z0-9._:/ -]` (wzór `cs-ops`).

#### 2. Test dyspozytora

**File**: `deploy/test-martynka-deploy.sh`

**Intent**: Logika symlinków, rollbacku i przycinania sprawdzana lokalnie, bez serwera.

**Contract**: Tworzy katalog tymczasowy jako `MARTYNKA_ROOT`, tworzy 7 wydań z `index.html`, woła dyspozytor przez `SSH_ORIGINAL_COMMAND="switch <id>"` kolejno, sprawdza: `current` wskazuje ostatnie, po 7 przełączeniach w `releases/` zostaje 5, `rollback` wraca do poprzedniego, `switch` na nieistniejące lub źle nazwane wydanie kończy się błędem, `status` wypisuje bieżące. Kończy się `exit 0` i `OK` albo `exit 1` z nazwą nieudanej asercji. Gałąź `rsync --server` nie jest testowana lokalnie (wymaga rrsync).

#### 3. Caddyfile

**File**: `deploy/Caddyfile`

**Intent**: Statyczny serwis z poprawnym cache dla Vite i PWA; jeden plik dla wariantu IP i domeny.

**Contract**: Szablon z placeholderem `__SITE__` (adres bloku) i `__TLS__` (dla IP: `tls { profile shortlived }`; dla domeny: pusty). Treść bloku: `root * /srv/martynka/current`, `encode zstd gzip`, `@immutable path /assets/*` → `header @immutable Cache-Control "public, max-age=31536000, immutable"`, `@nocache path / /index.html /sw.js /manifest.webmanifest` → `header @nocache Cache-Control "no-cache"`, `file_server`. Bootstrap podstawia placeholdery przez `sed`.

#### 4. Bootstrap

**File**: `deploy/bootstrap.sh`

**Intent**: Idempotentne przygotowanie VPS jako root; można uruchamiać wielokrotnie.

**Contract**: `bash deploy/bootstrap.sh --site <IPv4|domena> --ci-pubkey "<ssh-ed25519 …>"`; `set -euo pipefail`, wymaga root. Kroki: (1) `apt-get install -y rsync` i oficjalne repo Caddy (`apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl`, klucz i lista z `dl.cloudsmith.io/public/caddy/stable`), `apt-get install -y caddy`; sprawdzenie `caddy version` ≥ 2.10 dla wariantu IP; (2) użytkownik `martynka` (`useradd --create-home --shell /bin/bash`, bez grup dodatkowych), `/srv/martynka/releases` 755 owner `martynka`, `~martynka/.ssh` 700, `authorized_keys` 600 z jedną linią `restrict,from="100.64.0.0/10,fd7a:115c:a1e0::/48",command="/usr/local/bin/martynka-deploy" <pubkey>` (idempotentnie: zastępuje poprzednią linię z tym komentarzem); (3) kopia `martynka-deploy` do `/usr/local/bin` 755 root; (4) `/etc/ssh/sshd_config.d/61-martynka-deploy.conf` z `Match User martynka` → `ForceCommand /usr/local/bin/martynka-deploy`, `AllowTcpForwarding no`, `X11Forwarding no`, `PermitTTY no`, `PasswordAuthentication no`, `AuthenticationMethods publickey`; `sshd -t` i dopiero potem `systemctl reload ssh`; (5) Caddyfile: `sed` placeholderów do `/etc/caddy/Caddyfile` (zachowuje kopię poprzedniego jako `.bak`), `caddy validate --config /etc/caddy/Caddyfile`; (6) `ufw allow 80/tcp`, `ufw allow 443/tcp` (bez `--force enable`, bez zmian innych reguł); (7) `systemctl enable --now caddy` lub `systemctl reload caddy`; (8) diagnostyka: `ss -ltnp | grep -E ':80 |:443 '`, `tailscale serve status`, `caddy version`, `ls -la /srv/martynka`. Każdy krok wypisuje `[ok]`/`[skip]`.

### Success Criteria:

#### Automated Verification:

- `bash -n deploy/bootstrap.sh && bash -n deploy/martynka-deploy && bash -n deploy/test-martynka-deploy.sh` przechodzą
- `bash deploy/test-martynka-deploy.sh` kończy się kodem 0 i wypisuje `OK`
- `grep -c "__SITE__\|__TLS__" deploy/Caddyfile` zwraca 2 i `grep -n "profile shortlived\|61-martynka-deploy\|ufw allow 443/tcp\|sshd -t" deploy/bootstrap.sh` znajduje wszystkie cztery

#### Manual Verification:

- Przegląd `deploy/bootstrap.sh` pod kątem bezpieczeństwa: nic nie dotyka użytkowników `deploy`/`ops`, plików CoiledSpring ani reguł UFW poza 80/443

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Workflow GitHub Actions

### Overview

Build i deploy po pushu na `main`, rollback na żądanie.

### Changes Required:

#### 1. Workflow

**File**: `.github/workflows/deploy.yml`

**Intent**: Auto-deploy po merge (decyzja `ci_default_flow`), z możliwością ręcznego rollbacku.

**Contract**: `on: push: branches: [main]` oraz `workflow_dispatch` z `inputs.action` (`deploy` | `rollback`, domyślnie `deploy`); `concurrency: { group: deploy, cancel-in-progress: false }`; `permissions: contents: read`. Job `build` (ubuntu-latest): `actions/checkout`, `actions/setup-node` (`node-version: 22`, `cache: npm`), `npm ci`, `npm run typecheck`, `npm run build`, `actions/upload-artifact` `dist`; pomijany przy `action=rollback`. Job `deploy` (`needs: build`, `if: ${{ !cancelled() && (needs.build.result == 'success' || inputs.action == 'rollback') }}`, bo job `build` jest pomijany przy rollbacku, a domyślne `needs` wymagałoby sukcesu): `actions/download-artifact`; `tailscale/github-action@d1b6cd204f8dceda5b3eaad7f1f767be390056cd # v4.2.0` z `oauth-client-id`/`oauth-secret` z sekretów `TS_OAUTH_CLIENT_ID`/`TS_OAUTH_SECRET`, `tags: tag:ci`; konfiguracja SSH jak w CoiledSpring (`DEPLOY_SSH_KEY` → `~/.ssh/deploy_key` 600, `DEPLOY_KNOWN_HOSTS` → `known_hosts`, host z `DEPLOY_HOST`, user `martynka`, `StrictHostKeyChecking yes`); `RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-${GITHUB_SHA::7}"`; `rsync -rlt --delete --mkpath -e "ssh -F ~/.ssh/config" dist/ martynka@host:/$RELEASE/`; `ssh martynka@host switch $RELEASE` (lub `rollback`); health: `curl -fsS --retry 12 --retry-delay 10 --retry-all-errors "$SITE_URL/" | grep -q "Martynka urządza"` z `vars.DEPLOY_SITE_URL` (np. `https://1.2.3.4`); długie retry, bo przy pierwszym wydaniu Caddy może dopiero wystawiać certyfikat; na końcu `ssh … status`. Akcje `checkout`/`setup-node`/`upload-artifact`/`download-artifact` pinowane do wersji major (v4/v7/v4/v4) zgodnie z CoiledSpring.

#### 2. Ignorowanie artefaktów

**File**: `.gitignore`

**Intent**: Lokalny `dist/` już ignorowany; nic nowego, chyba że faza 1 wygeneruje pliki tymczasowe testu (test używa `mktemp -d` w `$TMPDIR`, więc nie).

**Contract**: Bez zmian, chyba że implementacja wykaże potrzebę; wtedy jeden wpis.

### Success Criteria:

#### Automated Verification:

- `ruby -ryaml -e 'YAML.load_file(".github/workflows/deploy.yml")'` (lub `python3 -c "import yaml"` jeśli dostępne) parsuje plik bez błędu
- `grep -c "tailscale/github-action@d1b6cd204f8dceda5b3eaad7f1f767be390056cd" .github/workflows/deploy.yml` zwraca 1, a `grep -o "secrets\.[A-Z_]*" .github/workflows/deploy.yml | sort -u` daje dokładnie `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_SSH_KEY`, `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`
- `npm ci && npm run typecheck && npm run build` lokalnie (te same komendy co w jobie build) przechodzą

#### Manual Verification:

- Workflow przeczytany pod kątem: brak `--no-verify`, brak echo sekretów, `StrictHostKeyChecking yes`, health check na `vars.DEPLOY_SITE_URL`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Uruchomienie na VPS i runbook

### Overview

Właściciel uruchamia bootstrap i dodaje sekrety; pierwszy deploy i rollback przechodzą; dokumentacja opisuje całość.

### Changes Required:

#### 1. Runbook

**File**: `deploy/README.md`

**Intent**: Jedno miejsce z instrukcją dla właściciela (po polsku), jak w CoiledSpring.

**Contract**: Sekcje: (1) architektura (diagram tekstowy: GitHub Actions → Tailscale → SSH `martynka` → `/srv/martynka/releases` → `current` → Caddy 80/443 → tablet); (2) wymagania (ACL tailnetu już ma `tag:ci → tag:server:22`; klient OAuth); (3) generowanie klucza CI: `ssh-keygen -t ed25519 -f martynka_deploy -N '' -C martynka-ci`; (4) bootstrap: skopiować `deploy/` na VPS (np. `scp` lub `git clone`), `sudo bash deploy/bootstrap.sh --site <IPv4> --ci-pubkey "$(cat martynka_deploy.pub)"`; (5) sekrety i zmienne w GitHub: pięć sekretów + `DEPLOY_SITE_URL`, skąd wziąć `DEPLOY_KNOWN_HOSTS` (`ssh-keyscan` adresu tailnetu); (6) deploy (push na `main`), rollback (`workflow_dispatch` → `rollback`), `status` przez SSH; (7) przejście na domenę: ponowne `bootstrap.sh --site <domena>`, DNS A na IP, zmiana `DEPLOY_SITE_URL`; (8) rozwiązywanie problemów: cert LE (porty 80/443, limity), `sshd -t`, `caddy validate`, `journalctl -u caddy`; (9) co NIE jest dotykane w CoiledSpring.

#### 2. Dokumentacja repo

**File**: `CLAUDE.md`, `AGENTS.md`

**Intent**: Sekcja „Deployment” w CLAUDE.md opisuje stan faktyczny (nie plan), AGENTS.md odsyła do runbooka.

**Contract**: CLAUDE.md: akapit „Deployment” przepisany na „jest”: workflow `deploy.yml`, użytkownik `martynka`, `/srv/martynka`, Caddy z certem na IP do czasu domeny, runbook `deploy/README.md`, sekrety wymienione z nazwy. „Current state”: dodać zdanie o deployu. AGENTS.md: w „Commits and PRs” jedno zdanie, że push na `main` wdraża (więc `main` musi budować), link `@deploy/README.md`; limit 400 słów zachowany.

#### 3. Uruchomienie (działania właściciela)

**File**: brak (VPS i GitHub)

**Intent**: Pierwsze wydanie w sieci.

**Contract**: Właściciel: generuje klucz, uruchamia bootstrap jako root, dodaje sekrety i zmienną, pushuje `main` (lub `workflow_dispatch` deploy). Agent: sprawdza z zewnątrz `curl` (sandbox z `allowed_domains` dla IP), analizuje log workflow, jeśli właściciel go wklei.

### Success Criteria:

#### Automated Verification:

- `curl -fsS https://<IP>/ | grep -q "Martynka urządza"` z sesji agenta (po deployu) kończy się kodem 0
- `curl -sI https://<IP>/ | grep -i "cache-control: no-cache"` oraz `curl -sI https://<IP>/assets/<plik z dist>.js | grep -i "immutable"` przechodzą
- `grep -n "Deployment\|deploy/README.md\|martynka" CLAUDE.md AGENTS.md` pokazuje nowe odniesienia, `tail -n +2 AGENTS.md | wc -w` ≤ 400

#### Manual Verification:

- Bootstrap na VPS zakończony `[ok]` we wszystkich krokach; `caddy version` ≥ 2.10; `ss -ltnp` pokazuje Caddy na 80/443
- CoiledSpring nadal działa po bootstrapie (`tailscale serve status`, UI przez tailnet)
- Workflow „Deploy” zielony po pushu na `main`; `workflow_dispatch` z `rollback` przywraca poprzednie wydanie i health check nadal przechodzi
- Tablet otwiera `https://<IP>` i pokazuje placeholder bez ostrzeżenia o certyfikacie

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- `deploy/test-martynka-deploy.sh`: switch, prune do 5, rollback, odrzucenie złych nazw i brakujących wydań, status.

### Integration Tests:

- Pierwszy deploy i rollback przez GitHub Actions na prawdziwym VPS (faza 3); health check w workflow jako stały test integracyjny każdego wydania.

### Manual Testing Steps:

1. Po bootstrapie: `ssh -i martynka_deploy martynka@<tailnet-host> status` z własnej maszyny wypisuje stan (dowód, że ForceCommand działa).
2. `ssh -i martynka_deploy martynka@<tailnet-host> bash` musi zostać odrzucone (`exit 2`).
3. Push na `main` → Actions zielone → `https://<IP>` w przeglądarce i na tablecie.
4. `workflow_dispatch` → `rollback` → strona nadal działa, `status` pokazuje poprzednie wydanie jako bieżące.
5. `tailscale serve status` i UI CoiledSpring przez tailnet bez zmian.

## Performance Considerations

Build ok. 1,4 MB; rsync całego wydania bez `--link-dest` jest wystarczająco szybki. `encode zstd gzip` i `immutable` dla hashowanych assetów ograniczają transfer na tablecie.

## Migration Notes

Przejście z adresu IP na domenę: `bootstrap.sh --site <domena>` (Caddyfile bez `profile shortlived`), DNS A → IP, `DEPLOY_SITE_URL` → `https://<domena>`. Zainstalowana PWA pod adresem IP (S-01) będzie wymagała ponownej instalacji; to świadomy koszt decyzji „IP do czasu domeny”.

## References

- Related research: `context/changes/static-deploy-pipeline/research.md`
- Wzorce: `/Users/kamilp/Dev/CoiledSpring/deploy/bootstrap.sh`, `ops/install-ops.sh`, `README.md`, `.github/workflows/deploy.yml`
- Roadmapa F-02: `context/foundation/roadmap.md`
- rrsync(1), Caddy `file_server`/`encode`/`header`, `tls profile shortlived`, tailscale/github-action v4 (linki w research.md)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Strona serwera w repo (deploy/)

#### Automated

- [x] 1.1 `bash -n` dla bootstrap.sh, martynka-deploy, test-martynka-deploy.sh
- [x] 1.2 `bash deploy/test-martynka-deploy.sh` kończy się kodem 0 i `OK`
- [x] 1.3 Placeholdery w Caddyfile (2) i cztery frazy w bootstrap.sh obecne

#### Manual

- [x] 1.4 Przegląd bootstrap.sh: nie dotyka deploy/ops, plików CoiledSpring ani UFW poza 80/443

### Phase 2: Workflow GitHub Actions

#### Automated

- [ ] 2.1 deploy.yml parsuje się jako YAML
- [ ] 2.2 Pin akcji Tailscale i dokładny zestaw 5 sekretów
- [ ] 2.3 `npm ci && npm run typecheck && npm run build` lokalnie przechodzą

#### Manual

- [ ] 2.4 Workflow przeczytany: bez --no-verify, bez echo sekretów, StrictHostKeyChecking yes, health na DEPLOY_SITE_URL

### Phase 3: Uruchomienie na VPS i runbook

#### Automated

- [ ] 3.1 `curl -fsS https://<IP>/` zawiera „Martynka urządza”
- [ ] 3.2 Nagłówki Cache-Control: no-cache dla /, immutable dla /assets/*.js
- [ ] 3.3 CLAUDE.md i AGENTS.md opisują deploy; AGENTS.md ≤ 400 słów

#### Manual

- [ ] 3.4 Bootstrap [ok] na VPS, caddy ≥ 2.10, Caddy na 80/443
- [ ] 3.5 CoiledSpring działa po bootstrapie
- [ ] 3.6 Workflow Deploy zielony; rollback przez workflow_dispatch działa
- [ ] 3.7 Tablet otwiera https://<IP> bez ostrzeżenia o certyfikacie
