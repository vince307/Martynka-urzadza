# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-implement` step, phase 2, of run 2026-10-24-audit-backdrop-fox: `GuideFox` hides for the whole scene when any pose is missing and records `guide`; `UIScene` passes `noStandIn`.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | phase 2 commit 63fb936, plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged |
| `## Progress` rows | 2.1-2.3 ticked with 63fb936; 2.4 left (its e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/GuideFox.ts` | `available` once in the constructor, `recordFallback(scene,'guide','none')`, `requested` in `GuideSnapshot`, no per-pose texture check |
| `src/scenes/UIScene.ts` | `noStandIn` = UI keys of the three fox poses |
| `tests/e2e/support/hook.ts` | `guide.requested` |
| `tests/guideWiring.test.ts` | two new source-guard cases |

## 3. Verification

| command | result |
|---|---|
| deliberate break 1: per-pose `textures.exists` back in `show` | wiring case red; restored |
| deliberate break 2: `recordFallback` call deleted | same case red; restored. Meta: source guards only; on-screen behaviour is proven by phase 6 e2e |
| lint, typecheck, `npm test` + deploy scripts + sample E1-E6, build | green; unit 3905 (3903 + 2); `e2e hook: absent (2 chunks checked)` |
| e2e | not run (orchestrator) |

## 4. Next command

`/10x-implement audit-backdrop-fox phase 3`

## 5. Open

- Phases 3-6 per plan. Manual rows 4.7-4.10 unchanged. `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **I-1 Both breaks live in one test case** (constructor/record/no-per-pose), so each break turns that one case red rather than two separate cases. Would change: split if a reviewer wants separate cases.
- **I-2 Row 2.4 left unticked**: includes the e2e baseline run by the orchestrator.
