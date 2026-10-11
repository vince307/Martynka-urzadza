---
change_id: game-shell-scaling
title: Szkielet gry na Phaser 4.2 w scenie 1920×1080 i docelowy układ katalogów
status: impl_reviewed
created: 2026-10-11
updated: 2026-10-11
archived_at: null
---

## Notes

Roadmapa F-01 (etap M0, `context/foundation/roadmap.md`): gra startuje na Phaser 4.2.x w scenie 1920×1080 dopasowanej do ekranu (`Phaser.Scale.FIT` + `CENTER_BOTH`), z pustą sceną, docelowym układem katalogów (`core/` bez importów silnika, `data/`, `scenes/`, `storage/`, `tests/`), bez telemetrii szablonu (`log.js`); `npx tsc --noEmit` przechodzi. Odblokowuje S-01 (PWA), F-03 (harness testów) i każdą scenę. Równolegle z F-02 (deploy). Pierwszy wycinek prowadzony przez agenta jako orkiestratora (run 2026-10-11).
