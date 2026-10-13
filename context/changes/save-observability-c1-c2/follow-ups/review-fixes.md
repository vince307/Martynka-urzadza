# Follow-ups — save-observability-c1-c2

Source: audit `context/audits/observability/2026-10-13_1514-zakup-zmiana-wariantu-autozapis.md` and plan review F3.

## Open

- M-S1 — deploy rule for the save (audit § 5). Trigger: first save-format change (v2) or the next change to deploy/
- M-S2 — ask for `navigator.storage.persist()` result handling and report a denied request. Trigger: S-12 or a parent reporting lost progress
- M-S3 + L-S1 — the reason and the build id on the unreadable-save card. Trigger: S-12 or the next change to saveFailedCard.ts
- M-R4 — the task list order of a room is not guarded. Trigger: the first change to a room's task list order
- L-S2 — Trigger: S-12
- L-S3 — Trigger: the next change to the visibilitychange handler in main.ts
- L-R8 — Trigger: the next change to RoomScene / stars.ts
- L-R9 — Trigger: the next change to RoomScene / stars.ts
- L-R11 — Trigger: the next change to RoomScene / stars.ts
- S-11 F4 — explicit cases for `e2eSave` values in `tests/e2eHookGuard.test.ts`. Trigger: the next change to vite/e2eHookGuard.mjs or a new `?e2eSave=` value
- Plan review F3 (audit C-2): `validateSave` returns the path of the first bad field for the log. Trigger: S-12 import validator or the first InvalidSave seen in the parent panel
- Plan review F3 (audit M-R5): throw (the error card) when the room panel is open and the placeholder is missing. Trigger: the second room in src/data/rooms.ts or the next change to RoomScene redraw/celebrate

## Closed

- Audit C-2 "gentle signal after N failures": rejected with a reason. The run contract allows nothing new for the child; the parent's line (failing state) covers it.
- S-12 "show the save state to the parent": done by this change (settings panel section, gap 43).
