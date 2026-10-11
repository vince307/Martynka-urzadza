---
change_id: agent-ops-access
title: Profil dostępu agenta do VPS (konto martynka-ops, allowlista, konfiguracja Claude Code)
status: implementing
created: 2026-10-11
updated: 2026-10-11
archived_at: null
---

## Notes

Decyzja właściciela 2026-10-11: po F-02 agent ma mieć własny profil dostępu do VPS, żeby bootstrapy i operacje deployu Martynki robić bez ręcznego przepisywania komend przez właściciela. Wzorzec: konto `ops` CoiledSpring (`cs-ops`: ForceCommand + allowlista + sudo do jednego helpera root). Granica zaufania: agent może uruchamiać jako root wyłącznie skrypty z gałęzi `main` repo (po merge PR), nigdy dowolnych komend. Nie zmienia F-02 ani CoiledSpring. Spoza roadmapy (zmiana wspierająca proces), prowadzona przez agenta jako orkiestratora.
