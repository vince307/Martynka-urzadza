# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 3 of run `2026-10-15-fix-s14c-s14d`. Phase 3 is done and committed (ORDER_OPS, TIMES_MORE, PRICE playable in E5.10 and E5.11). The next agent must not get wrong: `vite/e2eHookGuard.mjs` stays unchanged (plan-review F1); ORDER_OPS forms `a*b+c` and `a:b-c` cannot differ from left-to-right evaluation, so the generator and test demand a different left-to-right result only for `a+b*c` and `a-b:c` (plan said "always").

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | 3.4 (e2e part) , 3.5 `[reviewer]`, 3.6 `[visual]`; 1.5, 2.6, 2.7 as before; phases 4-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/{orderOps,timesMore,price}.ts` | the three generators and their parsers; registered in `registry.ts` |
| `src/data/wordTemplates.ts` | `goods` (noun, accusative, `one`, price range in whole złoty), `goodObj` |
| `src/data/nouns.ts` | zeszyt, długopis, bułka, lizak, gumka, pocztówka, ołówek, banan, pączek |
| `src/data/pl.ts` | `words.paid`, `tasks.orderOpsFirst/timesMore*/price*Hint` |
| `src/data/curriculum/E5.ts` | `E5.10.price_100`, `E5.10.times_more_100`, `E5.11.order_ops_100`; E5.11 `childName` "Kolejność działań i kwartały" |
| `tests/{orderOps,timesMore,price}.test.ts`, `tests/curriculum.test.ts` | new tests; 3 types moved from `LATER` to `GROUP_1` |

## 3. Verification

| command | result |
|---|---|
| RED (stubs returning an empty task) | `AssertionError: T.order_ops.a+b*c seed=1 draw=0 prompt="": expected [ { …(3) }, { …(3) } ] to deeply equal []` (18 of 18 red) |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2525 passed = baseline 2495 + 30 (18 new generator tests + 12 per-skill content invariants); deploy test scripts OK |
| `sample` E1-E6 | exit 0 each, 0 violations |
| `npm run build` | OK, `e2e hook: absent`; `tests/fixtures/` untouched |
| e2e | not runnable in this session — orchestrator gate (Chromium: MachPortRendezvous Permission denied, plain command `--workers=4`); expected 82 passed = baseline 82 + 0 (no spec touches E5.10/E5.11; E5 rounds only reach them from a stage-E5 start) |
| Deliberate breaks | ORDER_OPS answer left-to-right -> 2 red; TIMES_MORE `less` answer = total -> `expected 64 to be 32`; goods accusative `bułkę`->`bułka` -> inflection violation "kupiła 1 bułka" red; restored, 18 green. Meta-check: oracles read the printed prompt, not `task.answer` |
| Teacher read E5.10/E5.11 `--count 6` (two seeds) | "razy więcej/mniej" always with genitive plural ("3 razy więcej naklejek", "2 razy mniej rogalików"); first hint contrasts with "o" ("Razy więcej to mnożenie, nie dodawanie: 20 · 4.") with no result; PRICE: "Jedna bułka kosztuje 3 złote", "kupił 4 pączki", "zapłaciła" by gender, złote/złotych correct; first read showed 24 zł for a bułka, so goods got believable price ranges (2-8 zł); ORDER_OPS hints "Najpierw mnożenie: 4 · 8." -> "4 · 8 = 32" -> "29 + 32 = 61"; speech "dwadzieścia dziewięć plus cztery razy osiem" OK |

## 4. Next command

`/10x-tdd text-measure-time-types phase 4` (phase 4, `Driver: tdd`)

## 5. Open

- `[reviewer]` 3.5 (done informally above), `[visual]` 3.6 screenshots (PRICE longest prompt, TIMES_MORE with hint, ORDER_OPS step 1 and last solution step; 1440x900 and 1024x768); 1.5, 2.6, 2.7 as before; `[human]` 4.8, 9.6.
- 3.4 stays unticked until the orchestrator's e2e run.
- Unlock thresholds now: E5.10 n 1 -> 3 (threshold 1 -> 2), E5.11 n 1 -> 2 (1 -> 1); to list in the PR body.
- PRICE `unit` shows totals up to 100; "mnożenie kilku liczb" of E5.10 is out of scope (plan).

## 6. Autonomous decisions

1. **ORDER_OPS "left-to-right differs" only for forms where the high-precedence operation is second** (`a+b*c`, `a-b:c`); in `a*b+c` and `a:b-c` left-to-right is the same number by arithmetic. Would change: the maintainer wants those forms dropped.
2. **PRICE goods carry a price range** (whole złoty, min 2 so the total never equals the quantity that ends the first hint); `minQty` param (default 2, data uses 2; the test uses 1 for the accusative). Rejected: one price range for all goods (24 zł bułka).
3. **E5.11 `childName`** changed to "Kolejność działań i kwartały" (plan: it covers order of operations).
4. **TIMES_MORE contexts limited to `portable` ones** (small things), so large counts read naturally.
