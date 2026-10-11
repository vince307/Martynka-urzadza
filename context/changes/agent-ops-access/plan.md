# Profil dostępu agenta do VPS (martynka-ops) — Implementation Plan

## Overview

Agent dostaje własne konto `martynka-ops` na VPS z wymuszoną komendą i allowlistą (wzór `cs-ops` z CoiledSpring) oraz jednym helperem root, który uruchamia wyłącznie skrypty z klonu repo na gałęzi `main` (`/opt/martynka-src`) z argumentami z `/etc/martynka/ops.conf`. Po stronie Claude Code wystarczy wpis `ssh martynka-ops *` w `sandbox.excludedCommands` i `Bash(ssh martynka-ops *)` w `permissions.allow` (plik poza zapisem agenta: robi to właściciel). Efekt: bootstrap Caddy/sshd/UFW, diagnostyka, logi i rollback bez ręcznego przepisywania komend przez właściciela; granica zaufania = PR zmergowany na GitHubie.

## Current State Analysis

Z `context/changes/agent-ops-access/research.md`: sandbox blokuje TCP i DNS tailnetu; `excludedCommands` w `~/.claude/settings.json:158-171` już wyłącza `gh *`, `ssh cs-ops *`, `git push/fetch/pull *`; proste `ssh cs-ops help` i `gh api …` działają poza sandboxem (potwierdzone 2026-10-11), komendy złożone nie. Wzorzec konta: `CoiledSpring/deploy/ops/{cs-ops,cs-ops-root,install-ops.sh}` (shim z allowlistą znaków i limitem słów, root-helper z `case`, sudoers przez `visudo -cqf`, `Match User` z `DisableForwarding`). W tym repo: `deploy/bootstrap.sh` (kroki 1–8), `deploy/martynka-deploy` (dyspozytor wydań jako `martynka`), brak `deploy/ops/`. Serwer: Ubuntu 24.04, `git` nie wiadomo czy jest (bootstrap instaluje), `runuser` z util-linux dostępny.

## Desired End State

Po `bootstrap.sh … --ops-pubkey "<pub>"` na serwerze istnieją: użytkownik `martynka-ops` (klucz z `restrict,from=,command=`), `/usr/local/sbin/martynka-ops` (shim), `/usr/local/sbin/martynka-ops-root` (allowlista), `/etc/sudoers.d/martynka-ops`, `/etc/ssh/sshd_config.d/62-martynka-ops.conf`, `/opt/martynka-src` (klon `main`), `/etc/martynka/ops.conf` (600). Z sesji agenta proste `ssh martynka-ops help|status|diag|caddy-logs 10m|sync|bootstrap|rollback|switch <id>|caddy-validate|caddy-reload` działają poza sandboxem, każda operacja ma wpis `martynka-ops` w journalu, a `ssh martynka-ops bash` jest odrzucane. CoiledSpring, konta `deploy`/`ops`, `martynka` i klucz CI bez zmian.

### Key Discoveries:

- Matching `excludedCommands`: cały łańcuch musi pasować; `cd`, `|`, `$(…)` zostawiają wywołanie w sandboxie. Agent ma wołać `ssh martynka-ops <cmd>` jako jedyną komendę w wywołaniu.
- `cs-ops` przekazuje słowa do root-helpera przez jedną regułę sudo; root-helper waliduje każdą komendę i argument osobno. Ten sam podział tutaj.
- Dyspozytor `martynka-deploy` czyta `SSH_ORIGINAL_COMMAND`, więc root-helper może go wołać jako `martynka` przez `runuser -u martynka -- env SSH_ORIGINAL_COMMAND=<cmd> /usr/local/bin/martynka-deploy`.
- `bootstrap.sh` z `--ops-pubkey` zapisuje do `ops.conf` komplet argumentów, więc `ssh martynka-ops bootstrap` powtarza dokładnie ostatni ręczny bootstrap (bez dowolnych argumentów od agenta).

## What We're NOT Doing

- Zmian w CoiledSpring (`ops`, `cs-ops*`, `60-coiled-spring-ops.conf`, `/opt/coiled-spring`).
- Dostępu agenta do shella, Dockera, sudo poza jednym helperem, do kluczy CI czy sekretów.
- Edycji `~/.claude/settings.json` i `~/.ssh/config` przez agenta (poza zapisem; właściciel wkleja snippet z runbooka).
- Profilu `/10x-autonomous-run` (`context/foundation/autonomous-run.md`): dopiero gdy istnieje lokalna bramka (F-03) i CI; tu tylko odnotowanie zależności.
- Automatycznego `sync`+`bootstrap` z workflow GitHub (zostaje ręczne wywołanie przez agenta po merge zmian w `deploy/`).

## Implementation Approach

Dwa skrypty w `deploy/ops/` (shim i root-helper), rozszerzenie `bootstrap.sh` o opcjonalny krok 9 (`--ops-pubkey`), lokalny test shima, runbook i docs; wszystko jednym PR. Po merge właściciel robi ostatni ręczny bootstrap z `--ops-pubkey`, dodaje host i wpis w ustawieniach, a agent weryfikuje końcowo przez `ssh martynka-ops`.

## Critical Implementation Details

**sudoers przed sshd.** Jeśli `visudo -cqf` odrzuci regułę, bootstrap przerywa przed zapisem `Match`, żeby nie zostawić konta bez działającego helpera. `sshd -t` przed reloadem jak w kroku 4.

**`runuser` i środowisko.** Root-helper czyści środowisko (`env -i` z `PATH`, `HOME`, `SSH_ORIGINAL_COMMAND`) przy wołaniu dyspozytora jako `martynka`, żeby `MARTYNKA_ROOT` i podobne zmienne nie dały się przemycić z klienta SSH (sshd przekazuje `LANG`/`LC_*` przez `AcceptEnv`; shim ustawia `LC_ALL=C`).

**Klon repo jako root, pull tylko ff.** `/opt/martynka-src` jest własnością root, `git pull --ff-only origin main` odmawia przy rozjeździe; `safe.directory` nie jest potrzebne, bo właściciel plików = użytkownik wykonujący.

## Phase 1: Skrypty konta ops i rozszerzenie bootstrapu

### Overview

Shim, root-helper, krok `--ops-pubkey` w bootstrapie, test shima; wszystko weryfikowalne lokalnie.

### Changes Required:

#### 1. Shim

**File**: `deploy/ops/martynka-ops`

**Intent**: Wymuszona komenda konta `martynka-ops`: waliduje znaki i liczbę słów, loguje, przekazuje do helpera root przez sudo.

**Contract**: Bash `set -euf -o pipefail`, `LC_ALL=C`; `ROOT_CMD="${MARTYNKA_OPS_ROOT:-/usr/local/sbin/martynka-ops-root}"` (zmienna tylko do testu lokalnego; na serwerze sshd nie przekazuje jej, a `restrict` blokuje `environment=`); allowlista `^[A-Za-z0-9._:/ -]+$`, max 3 słowa; pusta komenda, zły znak, za dużo słów → `exit 2` z komunikatem „run `ssh martynka-ops help`” i `logger -t martynka-ops rejected …`; w przeciwnym razie `exec sudo -n "$ROOT_CMD" "${words[@]}"`.

#### 2. Helper root

**File**: `deploy/ops/martynka-ops-root`

**Intent**: Jedyne, co agent może wykonać jako root; każda komenda zwalidowana i zaudytowana.

**Contract**: Bash `set -euf -o pipefail`; stałe `SRC=/opt/martynka-src`, `CONF=/etc/martynka/ops.conf`, `DISPATCH=/usr/local/bin/martynka-deploy`, `DEPLOY_USER=martynka`; `audit()` przez `logger -t martynka-ops`, wpis na wejściu i w `trap EXIT` z kodem wyjścia. Komendy (argumenty poza wymienionymi → `exit 2`): `help`; `status` (dyspozytor `status` jako `martynka`, `systemctl is-active caddy`, listenery 80/443 z `ss -ltnp`); `diag` (`caddy version`, `ufw status`, `tailscale serve status`, `df -h /`, `git -C $SRC log -1 --oneline`); `caddy-logs [since]` (`since` ~ `^[0-9]+[smh]$`, domyślnie `1h`; `journalctl -u caddy --since "-<since>" --no-pager | tail -n 300`); `caddy-validate`; `caddy-reload`; `rollback`; `switch <id>` (`id` ~ `^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{7,40}$`); `sync` (`git -C $SRC fetch -q origin main && git -C $SRC merge --ff-only -q origin/main`, wypisuje `HEAD` i czy się zmienił); `bootstrap` (`source $CONF`, wymaga `SITE`, `BIND`, `CI_PUBKEY`, `OPS_PUBKEY`; `bash $SRC/deploy/bootstrap.sh --site … --bind … --ci-pubkey … --ops-pubkey …`). Wywołania dyspozytora: `runuser -u martynka -- env -i PATH=/usr/bin:/bin HOME=/home/martynka SSH_ORIGINAL_COMMAND="<cmd>" /usr/local/bin/martynka-deploy`.

#### 3. Bootstrap: krok 9

**File**: `deploy/bootstrap.sh`

**Intent**: Idempotentna instalacja konta ops, gdy podano `--ops-pubkey`.

**Contract**: Nowy argument `--ops-pubkey "<ssh-ed25519 …>"` (opcjonalny; bez niego krok 9 jest `[skip] ops profile not requested`, a istniejący `ops.conf` nie jest nadpisywany). Krok 9 po kroku 8: `apt-get install -y git` jeśli brak; użytkownik `martynka-ops` (`/bin/bash`, bez grup); `authorized_keys` z `restrict,from="<CGNAT>",command="/usr/local/sbin/martynka-ops"` (idempotentnie jak dla `martynka`); `install -m 755 root:root` obu skryptów z `deploy/ops/` do `/usr/local/sbin`; sudoers `/etc/sudoers.d/martynka-ops` = `martynka-ops ALL=(root) NOPASSWD: /usr/local/sbin/martynka-ops-root`, sprawdzony `visudo -cqf` przed instalacją (440) i `visudo -cq` po; `/etc/ssh/sshd_config.d/62-martynka-ops.conf` (`Match User martynka-ops`, `ForceCommand /usr/local/sbin/martynka-ops`, `DisableForwarding yes`, `PermitTTY no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `AuthenticationMethods publickey`) z `sshd -t` i reloadem jak w kroku 4; `/opt/martynka-src`: `git clone --branch main https://github.com/vince307/Martynka-urzadza.git` jeśli brak, inaczej `fetch` + `merge --ff-only`; `/etc/martynka/ops.conf` (katalog 700, plik 600 root) z `SITE=`, `BIND=`, `CI_PUBKEY=`, `OPS_PUBKEY=` w cudzysłowach. Diagnostyka na końcu dopisuje `ops: martynka-ops ready, src <sha>`.

#### 4. Test shima

**File**: `deploy/ops/test-martynka-ops.sh`

**Intent**: Walidacja shima bez serwera.

**Contract**: Tworzy w katalogu tymczasowym fałszywy root-helper (`printf '%s\n' "$@"`) i ustawia `MARTYNKA_OPS_ROOT` na niego oraz `PATH` z fałszywym `sudo` (skrypt, który pomija `-n` i wykonuje resztę) i `logger` (no-op); sprawdza: `help` → helper dostał `help`; `caddy-logs 10m` → dwa słowa; `bash`, `status; id`, `a b c d`, pusta komenda → exit 2; `switch ../x` → exit 2 (znak `.` dozwolony, ale `/`? `../x` składa się z dozwolonych znaków, więc shim przepuszcza; odrzuca dopiero helper: test dokumentuje to i sprawdza w helperze przez `MARTYNKA_OPS_ROOT` wskazujący na prawdziwy `martynka-ops-root` z `SRC`/`CONF` w tmp? Nie: helper wymaga roota. Test shima nie testuje helpera; walidacja `<id>` w helperze jest kopią regexu z `martynka-deploy`, sprawdzanego w jego teście). Kończy `OK`/`exit 1`.

### Success Criteria:

#### Automated Verification:

- `bash -n deploy/bootstrap.sh deploy/ops/martynka-ops deploy/ops/martynka-ops-root deploy/ops/test-martynka-ops.sh` przechodzi
- `bash deploy/ops/test-martynka-ops.sh` kończy się `OK`
- `grep -c "ops-pubkey\|62-martynka-ops\|visudo -cqf\|/opt/martynka-src\|/etc/martynka/ops.conf" deploy/bootstrap.sh` ≥ 5, a `bash deploy/test-martynka-deploy.sh` nadal `OK`

#### Manual Verification:

- Przegląd `martynka-ops-root`: żadna komenda nie przyjmuje dowolnego argumentu poza `<id>` (regex) i `[since]` (regex); `bootstrap` bierze argumenty tylko z `ops.conf`

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Runbook, docs i PR

### Overview

Instrukcja dla właściciela i zasady dla agenta.

### Changes Required:

#### 1. Runbook

**File**: `deploy/README.md`

**Intent**: Sekcja 10 „Profil agenta (martynka-ops)”: klucz, ostatni ręczny bootstrap z `--ops-pubkey`, `~/.ssh/config`, `~/.claude/settings.json`, lista komend, audyt, czego konto nie może.

**Contract**: Snippet `Host martynka-ops` (HostName `srv2033611.tail33005d.ts.net`, User `martynka-ops`, IdentityFile `~/.ssh/martynka_ops`, IdentitiesOnly yes, UserKnownHostsFile `~/.ssh/known_hosts_coiled_spring`, StrictHostKeyChecking yes); snippet JSON dla `sandbox.excludedCommands` (`"ssh martynka-ops *"`) i `permissions.allow` (`"Bash(ssh martynka-ops *)"`); tabela komend; `journalctl -t martynka-ops` jako audyt; test: `ssh martynka-ops help`, `ssh martynka-ops bash` → odmowa.

#### 2. Zasady dla agenta

**File**: `CLAUDE.md`, `AGENTS.md`

**Intent**: Agent wie, jak i kiedy używać `martynka-ops`.

**Contract**: CLAUDE.md, sekcja „Deployment”: dopisek o `ssh martynka-ops` (proste komendy, bez `cd`/potoków; po merge zmian w `deploy/`: `sync` potem `bootstrap`; `gh` tak samo proste). AGENTS.md: jedno zdanie w „Commits and PRs” lub „Hard rules”, limit 400 słów.

#### 3. Pamięć projektu i roadmapa

**File**: `context/foundation/roadmap.md`

**Intent**: Odnotować, że bootstrap przy S-01 wykona agent.

**Contract**: W S-01 Unknowns: zdanie „bootstrap Caddyfile przez `ssh martynka-ops sync && bootstrap` (agent), nie ręcznie”. Pamięć agenta (poza repo) aktualizuje `chain-state` i `agent-vps-access-profile-todo`.

### Success Criteria:

#### Automated Verification:

- `grep -n "martynka-ops" deploy/README.md CLAUDE.md AGENTS.md context/foundation/roadmap.md` znajduje wpisy w czterech plikach
- `tail -n +2 AGENTS.md | wc -w` ≤ 400
- PR otwarty przez agenta (`gh pr create` lub API) i zielony build w workflow po merge

#### Manual Verification:

- Właściciel przeczytał sekcję 10 runbooka i zmergował PR

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Instalacja i weryfikacja z sesji agenta

### Overview

Ostatni ręczny bootstrap właściciela, potem agent sprawdza własne konto.

### Changes Required:

#### 1. Działania właściciela

**File**: brak (VPS, `~/.ssh/config`, `~/.claude/settings.json`)

**Intent**: Jednorazowa instalacja profilu.

**Contract**: `ssh-keygen -t ed25519 -f ~/.ssh/martynka_ops -N '' -C martynka-ops`; `rsync` + `ssh root … bootstrap.sh --site martynka-urzadza.pl --bind 179.198.222.94 --ci-pubkey "$(cat ~/.ssh/martynka_deploy.pub)" --ops-pubkey "$(cat ~/.ssh/martynka_ops.pub)"`; wpisy w `~/.ssh/config` i `~/.claude/settings.json` wg runbooka; restart sesji Claude Code, jeśli ustawienia nie przeładują się same.

#### 2. Weryfikacja przez agenta

**File**: brak

**Intent**: Dowód, że profil działa i jest ograniczony.

**Contract**: Proste komendy: `ssh martynka-ops help`, `status`, `diag`, `caddy-logs 10m`, `caddy-validate`, `sync` (HEAD = `origin/main`), `bootstrap` (wszystko `[skip]`/`[ok]`, Caddy aktywny, strona 200), `ssh martynka-ops bash` → exit 2.

### Success Criteria:

#### Automated Verification:

- `ssh martynka-ops help` wypisuje listę komend, a `ssh martynka-ops status` pokazuje bieżące wydanie i `caddy active`
- `ssh martynka-ops sync` zwraca HEAD równy `origin/main`, a `ssh martynka-ops bootstrap` kończy się `done.` i `curl -fsS https://martynka-urzadza.pl/` zwraca stronę
- `ssh martynka-ops bash` kończy się kodem 2

#### Manual Verification:

- `journalctl -t martynka-ops` na serwerze pokazuje wywołania agenta (właściciel)
- CoiledSpring działa (`ssh cs-ops status`)

---

## Testing Strategy

### Unit Tests:

- `deploy/ops/test-martynka-ops.sh` (shim), `deploy/test-martynka-deploy.sh` (dyspozytor, bez zmian).

### Integration Tests:

- Faza 3: pełna ścieżka `ssh martynka-ops sync` → `bootstrap` → strona 200 na prawdziwym serwerze.

### Manual Testing Steps:

1. Po bootstrapie: `ssh martynka-ops help` i `ssh martynka-ops bash` z maszyny właściciela.
2. `sudo journalctl -t martynka-ops --since -10min` na serwerze.
3. `ssh cs-ops status` (CoiledSpring bez zmian).

## Performance Considerations

Brak.

## Migration Notes

Profil jest addytywny; usunięcie = `userdel -r martynka-ops`, usunięcie `/etc/sudoers.d/martynka-ops`, `62-martynka-ops.conf`, `/opt/martynka-src`, `/etc/martynka` (opisane w runbooku).

## References

- Related research: `context/changes/agent-ops-access/research.md`
- Wzorzec: `/Users/kamilp/Dev/CoiledSpring/deploy/ops/{cs-ops,cs-ops-root,install-ops.sh}`
- Dokumentacja Claude Code: https://code.claude.com/docs/en/sandboxing, https://code.claude.com/docs/en/permissions
- `deploy/bootstrap.sh`, `deploy/martynka-deploy`, `deploy/README.md` (F-02)

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Skrypty konta ops i rozszerzenie bootstrapu

#### Automated

- [x] 1.1 `bash -n` dla bootstrap.sh i trzech plików w deploy/ops
- [x] 1.2 `bash deploy/ops/test-martynka-ops.sh` kończy się OK
- [x] 1.3 Frazy kroku 9 w bootstrap.sh (≥ 5) i test dyspozytora nadal OK

#### Manual

- [ ] 1.4 Przegląd martynka-ops-root: argumenty tylko <id> i [since] z regexem, bootstrap tylko z ops.conf

### Phase 2: Runbook, docs i PR

#### Automated

- [ ] 2.1 martynka-ops w README, CLAUDE.md, AGENTS.md, roadmap.md
- [ ] 2.2 AGENTS.md ≤ 400 słów
- [ ] 2.3 PR otwarty, build zielony po merge

#### Manual

- [ ] 2.4 Właściciel przeczytał sekcję 10 runbooka i zmergował PR

### Phase 3: Instalacja i weryfikacja z sesji agenta

#### Automated

- [ ] 3.1 ssh martynka-ops help i status działają
- [ ] 3.2 ssh martynka-ops sync + bootstrap przechodzą, strona 200
- [ ] 3.3 ssh martynka-ops bash kończy się kodem 2

#### Manual

- [ ] 3.4 journalctl -t martynka-ops pokazuje wywołania agenta
- [ ] 3.5 CoiledSpring działa (ssh cs-ops status)
