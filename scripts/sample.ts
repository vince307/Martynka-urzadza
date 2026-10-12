// Prints sample tasks for every curriculum step of a stage and reports
// violations (PRD FR-005). Usage: npm run sample -- E3 [--seed N] [--count N]
// Exit codes: 0 ok, 1 violations or generator errors, 2 usage.
import { spokenTask } from '../src/core/narration/spoken';
import { createRng, seedFromString } from '../src/core/rng';
import { boundOf } from '../src/core/tasks/bounds';
import { generateTask } from '../src/core/tasks/generateTask';
import { getGenerator } from '../src/core/tasks/registry';
import { validateTask, type Violation } from '../src/core/tasks/validate';
import { balance } from '../src/data/balance';
import { availableStages, getStage } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';
import { pl } from '../src/data/pl';

const DEFAULT_SEED = 1;
const DEFAULT_COUNT = 3;

const usage = (): never => {
    console.error('Użycie: npm run sample -- <etap> [--seed N] [--count N]');
    console.error(`Etapy z danymi: ${availableStages().join(', ')}`);
    process.exit(2);
};

const args = process.argv.slice(2);
const options: Record<string, number> = { seed: DEFAULT_SEED, count: DEFAULT_COUNT };
let stageId: string | undefined;
for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--seed' || arg === '--count') {
        const value = Number(args[i + 1]);
        if (!Number.isInteger(value)) {
            usage();
        }
        options[arg.slice(2)] = value;
        i += 1;
    } else if (arg.startsWith('--') || stageId !== undefined) {
        usage();
    } else {
        stageId = arg;
    }
}
const { seed, count } = options;
const stage = stageId ? getStage(stageId) : undefined;
if (!stage) {
    usage();
}

const violations: Violation[] = [];
let errors = 0;

for (const step of stage!.steps) {
    console.log(`\n${stage!.id}.${step.step} ${step.title}`);
    if (step.skills.length === 0) {
        console.log(`  (brak generatora: ${step.types.join(', ')})`);
        continue;
    }
    for (const skill of step.skills) {
        const generate = getGenerator(skill.type);
        if (!generate) {
            console.log(`  (brak generatora: ${skill.type})`);
            continue;
        }
        console.log(`  ${skill.id}`);
        for (let i = 0; i < count; i += 1) {
            try {
                // Seed per skill and draw: adding a skill elsewhere never reshuffles this one.
                const task = generateTask(skill, createRng(seedFromString(`${seed}:${skill.id}:${i}`)), { tileCount: balance.tiles.count });
                const max = boundOf(skill);
                const found = validateTask(task, { max, nouns });
                violations.push(...found);
                const flag = found.length > 0 ? '  ⚠' : '';
                const answer = Array.isArray(task.answer) ? task.answer.join(', ') : String(task.answer);
                const choices = task.choices ? `  [${task.choices.join(' / ')}]` : '';
                console.log(`    ${task.prompt}  → ${answer}${choices}   podpowiedź: ${task.hint.join(' | ')}${flag}`);
                console.log(`      czyta: ${spokenTask(task, pl.speech, pl.round.calculate)}`);
            } catch (error) {
                errors += 1;
                console.log(`    BŁĄD ${skill.id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
}

console.log(`\nNaruszenia: ${violations.length}${errors > 0 ? `, błędy generatorów: ${errors}` : ''}`);
for (const v of violations) {
    console.log(`  ${v.skillId} ${v.rule} ${v.detail}`);
}
process.exit(violations.length > 0 || errors > 0 ? 1 : 0);
