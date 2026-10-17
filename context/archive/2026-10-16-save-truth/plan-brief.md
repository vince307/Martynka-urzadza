# Save truth — Plan Brief

> Full plan: `context/changes/save-truth/plan.md`
> Research: `context/changes/save-truth/research.md`

## What & Why

Slice 2 of the audit sweep 2026-10-16: the parent must be told the truth about the save, the copy of an old save,
import/reset and a second tab, and no save path may silently lose a chance to write or to keep the old copy. 15 MEDIUM
and 12 LOW audit ids; FR-021 ("nieudane przeniesienie zostawia stary zapis nietknięty i pokazuje rodzicowi możliwość
eksportu") is the binding sentence.

## Starting Point

Save format v4 with migrations, autosaver with copy-before-write (`backup-v<N>`, plain overwrite, write-only),
`replaceGate`, `writeVerdict` with a per-load random writer, "Zapis gry" lines built from session-only status, export /
import / reset dialogs. The cards say "Kod: corrupt" with no field; a hidden flush gives the old copy one try; the first
`unavailable` start is already forceable; `migration-failed` is replaced without warning.

## Desired End State

Card and log name the broken field; migration-failed / unknown-version / migrated-corrupt and a first-start
`unavailable` need the double confirmation; the first old copy is kept forever and can be saved from "Zapis gry"; the
copy's fate (kept / lost / uncertain / moving) survives launches; timeouts say "mogło się zapisać" / "nie
potwierdzono"; a reload is never "another window", a second tab stops this one at once and the refusal card shows a
code; export, import, broken-save and room-mismatch cases each get one true line.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Save format | stays v4; all new state outside the record | maintainer accepted v4 the same day; nothing here needs a field | Research |
| SRR-01 | keep `reason:'corrupt'`, add `from`/`problem`; migrated corrupt treated like `migration-failed` | a pinned test forbids the rename | Research |
| `corrupt` e2e seam | becomes a v4-shaped corrupt save | existing specs keep their meaning; migrated corrupt is unit-proven | Plan |
| SRR-08 | localStorage counter, force from the 2nd start, first-start line promises nothing | counter can fail with IndexedDB when site data is blocked | Research + Plan |
| Backups | write-once via `os.count` + put, record in the same transaction | `idb-keyval update` always puts; `getKey` needs Safari 15 | Research |
| SVB-01 | write progress first on a hidden flush, copy owed while the raw value is in memory | "3 tries" were 1 on a tablet | Research |
| P-1 retry cap | `backupAttempts + 1` | gives the copy its tries, then writes | Research |
| T-3 writer | `tabId:nonce` with an ended list in sessionStorage | a plain tab id would switch off B-1 for duplicated tabs | Research |
| T-1 | detection only (`olderWriter` when `base > 0`) | change.md decision 4 | Change |
| T-2 | BroadcastChannel as a hint behind `channelVerdict` | `writeVerdict` stays the authority; Safari < 15.4 keeps today's behaviour | Research |
| R-4 `unknown-room` | log only | every fixture and early device holds `living` | Research |
| Design gaps | 126–138 in phase order, one `[human]` wording row | the kit has no parent views | Plan |

## Scope

**In scope:** decode report, gate, counter, write-once/readable backups + record, copy accounting and retry, "Zapis
gry" lines, writer identity, older-build detection, channel, refusal code, old-copy button, export/import/reset lines,
room-state report, late read error, word-round warn, docs and follow-ups.

**Out of scope:** S12-03, S12-11, S12-13, SRR-07, SRR-13, SV2-13, SV2-15 (deferred with triggers); T-4/F6; forced
reload of an older build; any `deploy/` change; any new view or style.

## Architecture / Approach

Pure rule in `src/core` with a failing test, browser storage only in `src/storage/` (`startCounter.ts`, `writerId.ts`,
`saveChannel.ts`, `idb.ts`), wiring in `main.ts`/`UIScene`/the dialogs. `replaceGate` and `writeVerdict` remain the one
gate and the one verdict.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Decode truth (tdd) | `from`/`problem`, `Kod: corrupt/<field>`, v1 old-salon fixture | exact-match tests churn |
| 2. Replace gate (tdd) | force step for migration-failed/unknown-version/migrated corrupt | two reversed tests |
| 3. Unavailable counter (tdd) | force from 2nd start, gap 126 | two edited e2e specs |
| 4. Write-once backups (tdd) | `count`+put, record, `readBackups` | store contract churn in test stores |
| 5. Copy after write (tdd) | hidden flush writes, bounded first-write retry | reversed SV2-01 tests |
| 6. Health lines (tdd) | kept/lost/uncertain/pending, timeout, fatal code | gaps 127–129 |
| 7. Writer and older build (tdd) | `tabId:nonce`, `olderWriter` | B-1 must stay intact |
| 8. Stale signal (tdd) | channel + `noticeOtherWriter`, refusal `Kod:` | false block |
| 9. Old-copy button (impl) | "Zachowaj kopię starego zapisu" | gap 131 |
| 10. Export lines (impl) | `downloadStarted`, `invalid` | two edited specs |
| 11. Import/reset lines (tdd) | `replaceUnconfirmed`, `unreadable-file`, `deviceBroken` | edited SV2-02 spec |
| 12. Room state (tdd) | `roomStateProblems`, two lines | `living` on every fixture |
| 13. Late read, docs, sweep (impl) | `lateReadVerdict` + `slowfail`, CLAUDE.md, follow-ups | — |
| 14. e2e stale tab (#2) | T-2, T-5 in a browser | Chromium in agent sessions |
| 15. e2e late read + old copy (#2, #7) | SVB-02, SV2-04 export/import | download handling |

**Prerequisites:** branch `feat/save-truth`; e2e by the orchestrator (`--workers=4`).
**Estimated effort:** 15 phase sessions (13 code + 2 e2e), each small and independently green.

## Open Risks & Assumptions

- Write-once reverses the earlier "latest `backup-v3`" choice; `[human]` row 4.6.
- First `unavailable` start no longer forceable; `[human]` row 3.8.
- BroadcastChannel inside an iPadOS home-screen app unverified (hint only).
- Several deliberately reversed tests, each named in its phase; any other red is a regression.

## Success Criteria (Summary)

- No parent line about the save, the old copy, an import/reset or a second tab says something the game does not know.
- The first old-version copy is never overwritten and can be saved by the parent.
- v1–v4 saves load exactly as before; format stays v4.
