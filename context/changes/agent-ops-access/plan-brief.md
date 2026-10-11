# Profil dostępu agenta do VPS (martynka-ops) — Plan Brief

> Full plan: `context/changes/agent-ops-access/plan.md`
> Research: `context/changes/agent-ops-access/research.md`

## What & Why

Konto `martynka-ops` na VPS z wymuszoną komendą i allowlistą (wzór `cs-ops`), jeden helper root uruchamiający wyłącznie skrypty z klonu `main`, plus dwa wpisy w ustawieniach Claude Code. Dzięki temu agent sam robi bootstrap Caddy/sshd/UFW, diagnostykę i rollback; właściciel nie przepisuje komend. Powód: przy F-02 każdy krok na serwerze wymagał właściciela, a S-01 i kolejne etapy znów zmieniają Caddyfile.

## Starting Point

Sandbox blokuje TCP/DNS tailnetu, ale `~/.claude/settings.json` już wyłącza `gh *` i `ssh cs-ops *` z sandboxa; proste komendy działają (potwierdzone). Na VPS są konta `deploy`/`ops` (CoiledSpring) i `martynka` (CI). Brak konta dla agenta Martynki, brak klonu repo na serwerze.

## Desired End State

`ssh martynka-ops help|status|diag|caddy-logs|caddy-validate|caddy-reload|rollback|switch <id>|sync|bootstrap` działa z sesji agenta bez promptów i poza sandboxem; każda operacja w journalu; `ssh martynka-ops bash` odrzucone; `bootstrap` wykonuje dokładnie ostatni ręczny bootstrap (argumenty z `/etc/martynka/ops.conf`, skrypt z `/opt/martynka-src` = `origin/main`).

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Zakres root | sync, bootstrap, caddy-logs/validate/reload, status, rollback, switch, diag | Agent domyka etapy bez właściciela; root tylko dla skryptów po PR | Plan (właściciel) |
| Źródło skryptów | klon publicznego repo w `/opt/martynka-src`, `merge --ff-only origin/main` | Źródło prawdy = main po merge; audyt `git log` na serwerze | Plan (właściciel) |
| Prompty | brak (`permissions.allow` + `excludedCommands`) | Autonomiczne runy nie blokują się na SSH; audyt w journalu | Plan (właściciel) |
| Mechanizm Claude Code | `sandbox.excludedCommands: "ssh martynka-ops *"` w `~/.claude/settings.json` | Udokumentowane i już używane dla `cs-ops`; agent woła proste komendy | Research |
| Wzorzec konta | shim + root-helper + sudoers + `Match User` jak `cs-ops` | Sprawdzony w CoiledSpring, zero nowych pomysłów | Research |

## Scope

**In scope:** `deploy/ops/martynka-ops`, `deploy/ops/martynka-ops-root`, `deploy/ops/test-martynka-ops.sh`, krok 9 w `deploy/bootstrap.sh` (`--ops-pubkey`), runbook sekcja 10, CLAUDE.md/AGENTS.md, roadmapa (S-01), PR, ostatni ręczny bootstrap właściciela, weryfikacja przez agenta.

**Out of scope:** zmiany w CoiledSpring, shell/Docker/sekrety dla agenta, edycja ustawień Claude Code przez agenta, profil `/10x-autonomous-run`, automatyczny bootstrap z workflow.

## Architecture / Approach

`ssh martynka-ops <cmd>` (poza sandboxem) → sshd `ForceCommand` → shim (allowlista znaków, ≤ 3 słowa, logger) → `sudo -n martynka-ops-root <cmd>` → `case`: operacje Caddy/systemd jako root, operacje wydań jako `martynka` przez dyspozytor, `sync` = ff-only z `origin/main`, `bootstrap` = `deploy/bootstrap.sh` z klonu z argumentami z `ops.conf`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Skrypty i bootstrap | shim, root-helper, krok `--ops-pubkey`, test shima | Reguła sudoers lub `Match` błędna: `visudo -cqf` i `sshd -t` przed instalacją |
| 2. Runbook, docs, PR | instrukcja właściciela, zasady agenta, PR | Snippet ustawień musi trafić do `~/.claude/settings.json` (user), nie do repo |
| 3. Instalacja i weryfikacja | ostatni ręczny bootstrap, test z sesji agenta | Pierwsze `sync` wymaga `git` i wyjścia do github.com z serwera |

**Prerequisites:** F-02 na serwerze (jest), klucz `martynka_ops` (właściciel), dostęp root właściciela (ostatni raz).
**Estimated effort:** jedna sesja agenta na fazy 1–2; faza 3 zależy od właściciela (ok. 5 minut) i jednego przebiegu testów agenta.

## Open Risks & Assumptions

- Po dopisaniu `excludedCommands` sesja Claude Code może wymagać restartu, zanim nowy wzorzec zadziała.
- `runuser` i `git` dostępne na Ubuntu 24.04 (git instalowany w kroku 9, jeśli brak).
- Ochrona `main` bez egzekwowania dla adminów: właściciel-admin może pushować bezpośrednio; to świadomy wyjątek.

## Success Criteria (Summary)

- Z sesji agenta proste `ssh martynka-ops …` wykonuje komendy z allowlisty bez promptów, a `bash` jest odrzucane.
- `sync` + `bootstrap` odtwarzają stan serwera z `main` i strona `https://martynka-urzadza.pl` nadal odpowiada.
- CoiledSpring i konto `martynka` bez zmian; audyt w `journalctl -t martynka-ops`.
