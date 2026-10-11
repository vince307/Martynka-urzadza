# Deploy: Martynka urządza na VPS

Runbook dla właściciela. Gra to statyczny build (`dist/`), serwowany przez Caddy na publicznych portach 80/443 z tego samego VPS, na którym działa CoiledSpring. CoiledSpring pozostaje widoczne tylko w tailnecie; ten runbook niczego w nim nie zmienia.

## 1. Architektura

```
push na main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       ├─ build: npm ci → typecheck → vite build → artefakt dist/
       └─ deploy: węzeł Tailscale (tag:ci, efemeryczny)
            └─ ssh martynka@<VPS w tailnecie>   (klucz z sekretu, ForceCommand martynka-deploy)
                 ├─ rsync dist/ → /srv/martynka/releases/<YYYYMMDDTHHMMSSZ-sha7>/   (rrsync, tylko zapis)
                 ├─ switch <id> → /srv/martynka/current → releases/<id>   (atomowo, 5 ostatnich wydań)
                 └─ health check: curl https://<adres>/ zawiera „Martynka urządza”
Caddy (/etc/caddy/Caddyfile): root /srv/martynka/current, HTTPS z Let's Encrypt
  ├─ do czasu domeny: certyfikat na publiczny adres IPv4 (profile shortlived, 6 dni, auto-odnawiany)
  └─ po zakupie domeny: zwykły certyfikat na domenę
Tablet → https://<adres>
```

Pliki w `deploy/`:

| Plik | Rola |
|---|---|
| `bootstrap.sh` | idempotentne przygotowanie serwera (root) |
| `martynka-deploy` | jedyna komenda dostępna dla klucza CI (`rsync`, `switch`, `rollback`, `status`) |
| `test-martynka-deploy.sh` | lokalny test dyspozytora (`bash deploy/test-martynka-deploy.sh`) |
| `Caddyfile` | szablon konfiguracji Caddy (`__SITE__`, `__BIND__`, `__TLS__` podstawia bootstrap) |

## 2. Wymagania

- VPS po bootstrapie CoiledSpring (Ubuntu 24.04, Tailscale, UFW). Publiczny adres IPv4 (do certyfikatu na IP).
- Tailnet: ACL ma już `tag:ci → tag:server` na `tcp:22` (konfiguracja CoiledSpring); klient OAuth Tailscale z uprawnieniem `auth_keys` i tagiem `tag:ci` (ten sam co CoiledSpring).
- Dostęp root do VPS z Twojej maszyny (własne SSH; konto `ops` agenta ma allowlistę i nie wystarcza).

## 3. Klucz CI

Na swojej maszynie:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/martynka_deploy -N '' -C martynka-ci
cat ~/.ssh/martynka_deploy.pub
```

Klucz prywatny trafi do sekretu `DEPLOY_SSH_KEY`, publiczny do bootstrapu. Nigdy nie dodawaj go do konta `deploy` CoiledSpring.

## 4. Bootstrap serwera

Skopiuj katalog `deploy/` na VPS i uruchom skrypt jako root, z Twojej maszyny (klucz admina jak w CoiledSpring):

```bash
rsync -a -e "ssh -i ~/.ssh/<klucz_admina>" deploy/ root@<vps w tailnecie>:/root/martynka-deploy/
ssh -i ~/.ssh/<klucz_admina> root@<vps w tailnecie> \
  "bash /root/martynka-deploy/bootstrap.sh --site <publiczny IPv4> --ci-pubkey '$(cat ~/.ssh/martynka_deploy.pub)'"
```

Skrypt odmawia uruchomienia poza Linuksem z `apt-get`, więc uruchomiony przez pomyłkę na Macu tylko wypisze komunikat.

Caddy słucha tylko na publicznym IPv4 (`--bind`, domyślnie adres z `--site`; przy domenie podaj `--bind <IPv4>` albo skrypt weźmie adres z trasy domyślnej), bo port 443 na adresach tailnetu zajmuje `tailscaled` dla CoiledSpring.

Skrypt jest idempotentny; każdy krok wypisuje `[ok]` albo `[skip]`. Po zapisaniu Caddyfile formatuje go (`caddy fmt`), a po przeładowaniu sprawdza `systemctl is-active caddy` i w razie awarii wypisuje ostatnie linie logu. Co robi: instaluje `rsync` (z `rrsync`) i Caddy z oficjalnego repozytorium apt (wymaga ≥ 2.10 dla certyfikatu na IP), tworzy użytkownika `martynka` i `/srv/martynka/releases`, wpisuje klucz CI do `authorized_keys` z `restrict,from="<tailnet>",command="/usr/local/bin/martynka-deploy"`, instaluje dyspozytor, dodaje `/etc/ssh/sshd_config.d/61-martynka-deploy.conf` (`Match User martynka`, `ForceCommand`, bez forwardingu i TTY) i przeładowuje sshd dopiero po `sshd -t`, zapisuje `/etc/caddy/Caddyfile` (kopia poprzedniego w `.bak`), otwiera w UFW `80/tcp` i `443/tcp`, włącza Caddy i wypisuje diagnostykę (`caddy version`, listenery 80/443, `tailscale serve status`).

Po bootstrapie sprawdź:

```bash
ssh -i ~/.ssh/martynka_deploy martynka@<adres VPS w tailnecie> status   # wypisuje stan wydań
ssh -i ~/.ssh/martynka_deploy martynka@<adres VPS w tailnecie> bash     # musi odmówić (exit 2)
```

oraz że CoiledSpring nadal odpowiada przez tailnet.

## 5. Sekrety i zmienne w GitHub

Repo → Settings → Secrets and variables → Actions.

| Sekret | Wartość |
|---|---|
| `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET` | klient OAuth Tailscale (ten sam co w CoiledSpring) |
| `DEPLOY_SSH_KEY` | zawartość `~/.ssh/martynka_deploy` (klucz prywatny) |
| `DEPLOY_HOST` | nazwa lub adres VPS w tailnecie, np. `srv2033611.tail33005d.ts.net` lub `100.x.y.z` |
| `DEPLOY_KNOWN_HOSTS` | wynik `ssh-keyscan -t ed25519 <DEPLOY_HOST>` (z Twojej maszyny w tailnecie) |

| Zmienna (Variables) | Wartość |
|---|---|
| `DEPLOY_SITE_URL` | publiczny adres gry bez końcowego ukośnika, np. `https://1.2.3.4` |

## 6. Deploy, rollback, status

- **Deploy**: zmiany trafiają na `main` wyłącznie przez pull request zmergowany na GitHubie (bez lokalnego merge i push na `main`); merge jest pushem na `main`, więc uruchamia workflow „Deploy”. Ręcznie: Actions → Deploy → Run workflow → `deploy`.
- **Rollback**: Actions → Deploy → Run workflow → `rollback` (przełącza na poprzednie wydanie i powtarza health check). Z własnej maszyny: `ssh -i ~/.ssh/martynka_deploy martynka@<host> rollback`.
- **Status**: `ssh -i ~/.ssh/martynka_deploy martynka@<host> status` (bieżące, poprzednie, lista wydań). Serwer trzyma 5 ostatnich wydań.

Pierwszy deploy: certyfikat Let's Encrypt jest wystawiany przy pierwszym żądaniu, więc health check ma długie powtórzenia (do ok. 2 minut).

## 7. Domena `martynka-urzadza.pl`

Docelowy adres gry to `https://martynka-urzadza.pl` (`www.` przekierowuje na apex). Przejście z adresu IP:

1. DNS u rejestratora: rekord A `martynka-urzadza.pl` → `179.198.222.94` oraz A `www.martynka-urzadza.pl` → `179.198.222.94` (bez proxy/CDN; Caddy musi dostać ruch na 80/443 bezpośrednio). Sprawdzenie: `dig +short A martynka-urzadza.pl`.
2. Na VPS (jak w sekcji 4): `bash /root/martynka-deploy/bootstrap.sh --site martynka-urzadza.pl --bind 179.198.222.94 --ci-pubkey "$(cat ~/.ssh/martynka_deploy.pub)"` (Caddyfile na domenę bez `profile shortlived`, plus blok `www.` z przekierowaniem; certyfikaty Let's Encrypt przez HTTP-01/TLS-ALPN wystawiane przy pierwszym żądaniu).
3. GitHub: zmienna `DEPLOY_SITE_URL` → `https://martynka-urzadza.pl` (health check w workflow).
4. Zainstalowaną na tablecie PWA (etap S-01) trzeba zainstalować ponownie pod nowym adresem.

Adres IP przestaje być obsługiwany po kroku 2 (Caddyfile ma już tylko bloki domeny).

## 8. Rozwiązywanie problemów

- `journalctl -u caddy -n 100` i `caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`.
- Brak certyfikatu: porty 80 i 443 muszą być osiągalne z internetu (UFW, firewall dostawcy VPS); dla adresu IP Caddy musi być ≥ 2.10; limity Let's Encrypt (5 nieudanych walidacji / konto / godzinę).
- SSH odmawia CI: sprawdź `DEPLOY_KNOWN_HOSTS` (klucz hosta), czy węzeł CI dostał `tag:ci`, czy `from=` w `authorized_keys` obejmuje adres węzła (CGNAT `100.64.0.0/10`).
- `sshd -t` nie przechodzi w bootstrapie: skrypt usuwa swój plik `Match` i nie przeładowuje sshd; istniejące sesje pozostają.
- Rsync odrzucony przez rrsync (`--mkpath`): wymaga rsync ≥ 3.2.3 po obu stronach (Ubuntu 24.04: 3.2.7).
- `listen tcp :443: bind: address already in use` w logu Caddy: `tailscaled` trzyma port 443 na adresach tailnetu (`tailscale serve` CoiledSpring); Caddy słucha tylko na publicznym IPv4 (`bind` w Caddyfile, parametr `--bind` bootstrapu, domyślnie adres z `--site`).

## 9. Czego ten deploy nie dotyka

Użytkowników `deploy` i `ops`, `/opt/coiled-spring`, Dockera, `tailscale serve`, istniejących reguł UFW (dodaje tylko 80/443), pliku `60-coiled-spring-ops.conf`. Klucz `martynka` ma dostęp wyłącznie do `/srv/martynka/releases` (zapis przez rrsync) i do przełączania symlinku `current`.
