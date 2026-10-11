---
date: 2026-10-11T15:34:50+02:00
researcher: Claude (orkiestrator, sesja 2026-10-11)
git_commit: 4660eb7
branch: main
repository: Martynka-urzadza
topic: "F-02 static-deploy-pipeline: jak wdrożyć statyczny build dist/ z GitHub Actions na istniejący VPS (CoiledSpring) za Caddy z HTTPS i rollbackiem, bez własnej domeny"
tags: [research, deploy, github-actions, tailscale, rsync, rrsync, caddy, ufw, M0]
status: partial
last_updated: 2026-10-11
last_updated_by: Claude (orkiestrator)
---

# Research: F-02 static-deploy-pipeline

**Date**: 2026-10-11T15:34:50+02:00
**Researcher**: Claude (orkiestrator, sesja 2026-10-11)
**Git Commit**: 4660eb7
**Branch**: main
**Repository**: Martynka-urzadza

## Research Question

Roadmapa F-02 (etap M0): build `dist/` publikowany z GitHub Actions na istniejący VPS za Caddy (HTTPS), z zachowaniem poprzedniego wydania do rollbacku; runbook w `deploy/README.md`. Decyzje nadrzędne: CLAUDE.md „Deployment” (2026-10-10: Caddy na 80/443 na tym samym VPS co CoiledSpring, CoiledSpring zostaje tailnet-only, deploy z GitHub Actions przez Tailscale SSH do użytkownika rsync-only, poprzednie wydanie do rollbacku) i `tech-stack.md` (self-host, github-actions, auto-deploy-on-merge). Pytania: (1) co jest na VPS i co trzeba dodać; (2) jak CoiledSpring robi CI → VPS i co z tego przenieść; (3) jak ograniczyć użytkownika do rsync i zrobić atomową podmianę wydania; (4) jak mieć HTTPS (wymagane przez service worker PWA w S-01) bez kupionej domeny; (5) konfiguracja Caddy i workflow.

## Summary

- **Status: partial.** Bezpośredni, tylko do odczytu probe VPS (`ssh cs-ops`) nie był możliwy: sandbox nie rozwiązuje nazw tailnetu, a próba poza sandboxem została odrzucona przez klasyfikator uprawnień. Konto `ops` i tak ma wymuszoną komendę z allowlistą (`cs-ops`: status, health, logs, sql, rollback), więc nie pozwoliłoby na inspekcję systemu. Stan VPS poniżej pochodzi z dokumentacji i skryptów `CoiledSpring/deploy/` (stan po ich bootstrapie), nie z obserwacji maszyny; luka: aktualna wersja systemu, zajętość portów 80/443 i wersja Tailscale wymagają potwierdzenia przez właściciela przy bootstrapie.
- **Na VPS (wg CoiledSpring) nie ma Caddy, rsync/rrsync ani żadnej usługi na publicznych 80/443.** UFW: `allow in on tailscale0`, `22/tcp` do czasu `--lock-public-ssh`, `default deny incoming` (`CoiledSpring/deploy/bootstrap.sh:303-367`). CoiledSpring jest wystawione wyłącznie przez `tailscale serve --bg 4321` (`bootstrap.sh:375`). Bootstrap Martynki musi dodać: pakiet `caddy`, `rsync` (zawiera `/usr/bin/rrsync`), osobnego użytkownika, katalogi `/srv/martynka`, reguły UFW `80/tcp` i `443/tcp`. Uruchomić go musi właściciel jako root (jak `bootstrap.sh` CoiledSpring); agent nie ma takiego dostępu.
- **CI CoiledSpring do przeniesienia:** `tailscale/github-action` v4.2.0 (pin SHA `d1b6cd20…`) z `TS_OAUTH_CLIENT_ID`/`TS_OAUTH_SECRET` i `tags: tag:ci` (`.github/workflows/deploy.yml:117-121`), SSH z sekretów `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `StrictHostKeyChecking yes` (`:123-144`), `concurrency: deploy`. ACL tailnetu już ma `tag:ci → tag:server tcp:22` (`CoiledSpring/deploy/README.md:36-45`), więc osobne repo Martynki potrzebuje tylko własnych sekretów (ten sam klient OAuth może być użyty ponownie) i własnego klucza SSH. CoiledSpring nie używa rsync (`scp`) ani katalogów wydań (wydania = tagi obrazów Dockera), więc układ `releases/` i rollback dla plików statycznych trzeba zaprojektować od zera.
- **Użytkownik rsync-only:** `rrsync` jest w pakiecie `rsync` (`/usr/bin/rrsync`, Debian/Ubuntu). `authorized_keys`: `restrict,from="100.64.0.0/10,fd7a:115c:a1e0::/48",command="rrsync -wo /srv/martynka/releases" ssh-ed25519 …` (wzorzec `restrict,from=` taki jak dla konta `ops`, `CoiledSpring/deploy/README.md:377`). rrsync dopuszcza `--delete`, `--link-dest` (ścieżka pod DIR), `--delay-updates`, `--mkpath`; odrzuca `..`, `--chmod`, `-s`. **Tailscale SSH nie ma wymuszonych komend**, więc ograniczenie musi być w OpenSSH (po adresie tailnetu), nie w Tailscale SSH.
- **Atomowa podmiana wydania:** rrsync nie pozwala zmienić symlinku, więc potrzebny jest drugi krok: albo drugi klucz z `command="/usr/local/bin/martynka-switch"` (skrypt robi `ln -sfn releases/<ts> current.tmp && mv -T current.tmp current`, przycina do N wydań, umie `rollback`), albo jeden klucz z własnym skryptem-dyspozytorem, który dla podkomendy `rsync` wywołuje `rrsync`, a dla `switch`/`rollback` przełącza symlink. Alternatywa „jeden katalog + `rsync --delete --delay-updates`” nie jest atomowa i nie daje rollbacku.
- **HTTPS bez domeny** (wymagane dla PWA): (a) `sslip.io`/`nip.io` nie są na Public Suffix List, więc dzielą jeden limit Let's Encrypt (50 certów/tydzień na domenę) ze wszystkimi użytkownikami: zawodne; (b) Let's Encrypt wydaje od 2026-01-15 certyfikaty na adresy IP (6-dniowe, auto-odnawiane), Caddy obsługuje je przez `profile shortlived` (IPv4 OK; zgłaszane dziwactwa dla IPv6), wymaga publicznego IPv4 i otwartych 80/443; (c) Tailscale Funnel wystawia `https://<maszyna>.<tailnet>.ts.net` publicznie bez aplikacji na tablecie (beta, limit przepustowości), ale omija Caddy i decyzję o 80/443; (d) `tailscale serve` tylko w tailnecie wymaga Tailscale na tablecie. Po kupieniu domeny wystarczy zmiana nagłówka bloku w Caddyfile.
- **Caddyfile dla statycznego PWA:** `root * /srv/martynka/current`, `encode zstd gzip`, `Cache-Control: public, max-age=31536000, immutable` dla `/assets/*` (Vite hashuje nazwy), `no-cache` dla `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`, `file_server`; `try_files` niepotrzebne (gra nie ma routingu URL). Caddy binduje 0.0.0.0:443; `tailscale serve` CoiledSpring obsługuje 443 wewnątrz `tailscaled` (nie przez socket systemowy) na adresie tailnetu: współistnienie prawdopodobne, ale do potwierdzenia na maszynie (luka).
- **GitHub Actions:** `actions/setup-node@v7` z `node-version: 22`, `cache: npm`; `npm ci` wymaga spójnego `package-lock.json` (jest, z F-01); `npx tsc --noEmit` jako osobny krok (Vite nie typuje); `tailscale/github-action` v4 wymaga runnera z Node 24 (ubuntu-latest spełnia), węzeł jest efemeryczny i usuwany po jobie; z OAuth `tags` jest obowiązkowe.

## Detailed Findings

### 1. Stan VPS (z dokumentacji CoiledSpring, nie z obserwacji)

Zbadane: `/Users/kamilp/Dev/CoiledSpring/deploy/{bootstrap.sh,deploy.sh,compose.yml,ops/*,README.md}`, `.github/workflows/deploy.yml`.

- System: Ubuntu 24.04 przygotowany przez `bootstrap.sh` (pakiety `ca-certificates curl ufw unattended-upgrades`, Docker, Tailscale; `bootstrap.sh:158,172-227`). Nigdy nie uruchamia `tailscale up` (`:8,381`).
- Użytkownicy: `deploy` (CI CoiledSpring, grupa `docker`, zwykłe SSH bez ograniczeń, `:234-251`), `ops` (agent; `Match User ops` + `ForceCommand /usr/local/sbin/cs-ops`, `install-ops.sh:120-133`; sudoers tylko `cs-ops-root`, `:108-109`; allowlista `cs-ops-root:333-362`). Pliki sshd: `60-coiled-spring-ops.conf` (nowy `Match` dla Martynki musi mieć inną nazwę/numer).
- Katalogi i nazwy: `/opt/coiled-spring`, `/var/lib/coiled-spring`, jednostki `coiled-spring-*`. Dla Martynki osobna przestrzeń: `/srv/martynka`, `martynka-*`.
- UFW: `ufw allow in on tailscale0` (`:322`), `allow 22/tcp` do `--lock-public-ssh` (`:324-326`, marker `/var/lib/coiled-spring/public-ssh-locked`, `:19`), `default deny incoming/allow outgoing` (`:332-333`). Docker omija UFW, więc compose binduje `127.0.0.1:4321` (`compose.yml:20-21`, `bootstrap.sh:304`).
- Ekspozycja: `tailscale serve --bg 4321` (`:375`); decyzja archiwalna CoiledSpring: „bez domeny, Caddy, Let's Encrypt” (`context/archive/2026-10-04-private-server-deploy/plan.md:36`). Caddy, nginx, rsync, rrsync: brak w tej konfiguracji.
- Luki (do potwierdzenia przez właściciela przy bootstrapie): czy publiczne SSH jest już zablokowane; czy cokolwiek słucha na 80/443; wersja Tailscale; publiczny adres IPv4 (potrzebny do wariantu HTTPS na IP).

### 2. CI → VPS w CoiledSpring

- `deploy.yml:3-17`: `workflow_run` po CI na `main` lub `workflow_dispatch sha`; `concurrency: deploy`.
- `:117-121`: `tailscale/github-action@d1b6cd204f8dceda5b3eaad7f1f767be390056cd # v4.2.0`, `oauth-client-id`/`oauth-secret` z `TS_OAUTH_CLIENT_ID`/`TS_OAUTH_SECRET`, `tags: tag:ci`.
- `:123-144`: klucz z `DEPLOY_SSH_KEY` do `~/.ssh/deploy_key`, `DEPLOY_KNOWN_HOSTS` do `known_hosts`, `DEPLOY_HOST`, `StrictHostKeyChecking yes`.
- `:168-171`: pliki kopiowane `scp` do `.incoming/`, potem `mv` (atomowo per plik); health = kod wyjścia `deploy.sh` (`/api/ready`).
- ACL tailnetu (`README.md:36-45`): `tagOwners` `tag:server`, `tag:ci` (admin), grants `autogroup:member → tag:server tcp:22, tcp:443` i `tag:ci → tag:server tcp:22`. Dla Martynki wystarcza bez zmian (ten sam serwer, ten sam tag CI).

### 3. rrsync i atomowa podmiana

- `rrsync` w pakiecie `rsync` (`/usr/bin/rrsync` na Debian bookworm/Ubuntu; manpage rrsync(1)). Składnia `rrsync [-ro|-wo] [-munge] [-no-del] [-no-overwrite] DIR`; `-wo` = tylko zapis. Z kodu `support/rrsync`: dozwolone `--delete*`, `--link-dest=` (argument walidowany pod DIR), `--delay-updates`, `--partial-dir`, `--mkpath`; odrzucane `..`, `--protect-args`/`-s`, `--chmod`; wiodący `/` jest względny do DIR.
- `authorized_keys`: `restrict,command="rrsync -wo /srv/martynka/releases" …`; `restrict` obejmuje `no-pty`, `no-port-forwarding`, `no-agent-forwarding`, `no-X11-forwarding`.
- Tailscale SSH: brak wymuszonych komend (feature request tailscale/tailscale#4909), więc dostęp CI idzie przez OpenSSH na adresie tailnetu z `from=` ograniczonym do CGNAT `100.64.0.0/10`.
- Wzorce podmiany: (A) `releases/<ts>/` przez rrsync (z `--link-dest=/current`, żeby niezmienione pliki były hardlinkami) + skrypt `martynka-switch` jako wymuszona komenda drugiego klucza lub podkomenda jednego dyspozytora: `ln -sfn releases/<ts> current.tmp && mv -T current.tmp current`, przycięcie do N, `rollback` = przełącz na poprzedni; (B) jeden katalog z `--delete --delay-updates` („bliżej atomowości”, bez rollbacku). Rsync(1): `--delay-updates` tylko skraca okno niespójności.

### 4. HTTPS bez domeny

- Let's Encrypt: 50 certyfikatów / zarejestrowana domena (wg PSL) / 7 dni. `sslip.io` i `nip.io` nie są na PSL (sprawdzone w `public_suffix_list.dat`, 2026-10-11), `ts.net` jest. Wnioski: `sslip.io` dzieli limit ze wszystkimi; społeczność zgłasza losowe odmowy.
- Certyfikaty na adresy IP: GA od 2026-01-15 (6-dniowe); Caddy: `profile shortlived` w bloku `tls`; raporty działania dla IPv4, problemy dla IPv6 (caddy #7441). Wymaga publicznego IPv4, otwartych 80/443 i auto-odnowienia (Caddy robi to sam).
- Tailscale: `tailscale cert`/`serve` daje zaufany cert dla `<maszyna>.<tailnet>.ts.net` tylko w tailnecie (tablet musi mieć Tailscale); Funnel wystawia go publicznie na 443/8443/10000 bez aplikacji po stronie klienta, może frontować Caddy na localhost; beta, limity przepustowości nieokreślone.
- Bare IP bez `profile shortlived` dostaje w Caddy tylko wewnętrzny CA (niezaufany na tablecie).

### 5. Caddy

- Instalacja: oficjalne repo apt Caddy (cloudsmith) lub pakiet Ubuntu; usługa `caddy.service`, config `/etc/caddy/Caddyfile`, `caddy reload`.
- Caddyfile dla statycznej gry: `root * /srv/martynka/current`, `encode zstd gzip`, nagłówki `Cache-Control` (`immutable` dla `/assets/*`, `no-cache` dla `/`, `/index.html`, `/sw.js`, `/manifest.webmanifest`), `file_server`. Kolejność dyrektyw: `header` przed `try_files`; `try_files` zbędne bez routingu. Dla IP: blok `https://<ip> { tls { profile shortlived } … }` (do zweryfikowania na wersji Caddy ≥ 2.10 na maszynie).
- Współistnienie z `tailscale serve` na 443: `tailscaled` obsługuje ruch do adresu tailnetu wewnętrznie; Caddy na `0.0.0.0:443` nie powinien kolidować, ale nie zostało to zaobserwowane (luka: sprawdzić `ss -ltnp` i `tailscale serve status` przy bootstrapie).

### 6. GitHub Actions dla tego repo

- Brak `.github/` w repo (potwierdzone w F-01). Skrypty: `build`, `typecheck` (`package.json:10-15`). `package-lock.json` zsynchronizowany po F-01 (`npm ci` zadziała).
- `actions/setup-node@v7`, `node-version: 22`, `cache: npm` (cache globalnego cache npm kluczowany `package-lock.json`). `tailscale/github-action` v4 wymaga Node 24 na runnerze (ubuntu-latest OK); węzeł efemeryczny, usuwany po jobie; `tags` obowiązkowe przy OAuth.
- Sekrety do założenia w repo Martynki: `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET` (ten sam klient OAuth co CoiledSpring lub nowy), `DEPLOY_SSH_KEY` (nowy klucz ed25519 dla użytkownika Martynki), `DEPLOY_KNOWN_HOSTS` (klucz hosta VPS), `DEPLOY_HOST` (adres tailnetu).

## Code References

- `/Users/kamilp/Dev/CoiledSpring/deploy/bootstrap.sh:158,172-227,234-251,303-367,375` - pakiety, użytkownik deploy, UFW, tailscale serve
- `/Users/kamilp/Dev/CoiledSpring/deploy/ops/install-ops.sh:81-86,108-109,120-133` - konto ops: brak docker, sudoers, Match User + ForceCommand
- `/Users/kamilp/Dev/CoiledSpring/deploy/ops/cs-ops:27-35` - allowlista znaków i długości komend
- `/Users/kamilp/Dev/CoiledSpring/deploy/README.md:36-45,228,377` - ACL tailnetu, klucz deploy, linia authorized_keys z `restrict,from=`
- `/Users/kamilp/Dev/CoiledSpring/.github/workflows/deploy.yml:3-17,117-144,168-189` - trigger, Tailscale action, SSH z sekretów, scp + mv, health
- `package.json:10-15` - skrypty build/typecheck w tym repo
- `context/foundation/roadmap.md` F-02 - Outcome, Unlocks, Blocker (domena), Unknown (adres tymczasowy)

## Architecture Insights

- Dwa projekty na jednej maszynie: CoiledSpring = kontenery, tailnet-only, konto `deploy` bez ograniczeń; Martynka = pliki statyczne, publiczne 80/443, konto rsync-only. Rozdzielenie użytkowników, katalogów (`/srv/martynka`), plików sshd `Match` i jednostek jest konieczne, żeby żaden klucz CI Martynki nie dawał dostępu do CoiledSpring.
- Bootstrap jako idempotentny skrypt root (wzorzec `bootstrap.sh`) + runbook po polsku (wzorzec `README.md` CoiledSpring) to konwencja, którą `deploy/` Martynki powinno powtórzyć.
- Workflow Martynki jest prostszy niż CoiledSpring (bez obrazów, bez compose): build → rsync do `releases/<ts>` → switch → health check `curl` strony głównej.

## Historical Context (from prior changes)

- `context/archive/2026-10-11-game-shell-scaling/`: F-01 (szkielet, `npm run build` → `dist/` z chunkiem `phaser-*.js`, `base: './'`), przegląd F3/F5 odłożył deduplikację koloru i wspólną bazę configów Vite do S-01.
- CoiledSpring `context/archive/2026-10-04-private-server-deploy/plan.md:36`: decyzja „nic publicznie” dla CoiledSpring; Martynka ją świadomie zmienia dla własnego serwisu (CLAUDE.md 2026-10-10).

## Related Research

- `context/archive/2026-10-11-game-shell-scaling/research.md` (F-01).

## Open Questions

1. **Adres i HTTPS do czasu domeny**: (a) Caddy + certyfikat Let's Encrypt na publiczny IPv4 (`profile shortlived`), (b) Tailscale Funnel, (c) tylko tailnet (`tailscale serve`, Tailscale na tablecie), (d) kupić domenę teraz. Wpływa na Caddyfile, UFW i to, czy S-01 (PWA) da się sprawdzić na tablecie. Decyzja właściciela.
2. **Mechanizm podmiany wydania**: jeden klucz z dyspozytorem (`rsync` → rrsync, `switch`, `rollback`) czy dwa klucze (rrsync + `martynka-switch`)? Oba spełniają „poprzednie wydanie do rollbacku”.
3. **Kto i kiedy uruchamia bootstrap na VPS**: agent nie ma dostępu root; właściciel uruchamia `deploy/bootstrap.sh` jako root (przez swoje SSH) i raportuje wynik. Weryfikacja F-02 „gra otwiera się z adresu” zależy od tego kroku i od sekretów w GitHub.
4. **Współistnienie Caddy 0.0.0.0:443 z `tailscale serve` na 443** adresu tailnetu: ROZSTRZYGNIĘTE 2026-10-11 przy pierwszym bootstrapie: `tailscaled` binduje TCP 443 na `100.72.96.107` i adresie IPv6 tailnetu (`ss -ltnp`), więc Caddy na `:443` dostaje `address already in use`; Caddy musi używać `bind <publiczny IPv4>` (bootstrap `--bind`, domyślnie adres `--site`).
5. **Publiczne SSH**: czy `--lock-public-ssh` już wykonano (marker `/var/lib/coiled-spring/public-ssh-locked`)? Bez znaczenia dla CI (idzie przez tailnet), istotne dla runbooka.
6. **Wersja Caddy z repozytorium apt na Ubuntu 24.04** vs wymagana dla `profile shortlived` (≥ 2.10?): sprawdzić przy instalacji; wariant (a) z pytania 1 zależy od tego.
