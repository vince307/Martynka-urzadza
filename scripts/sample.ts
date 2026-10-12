// Prints sample tasks for every curriculum step of a stage and reports
// violations (PRD FR-005). Usage: npm run sample -- E3 [--seed N] [--count N]
// Exit codes: 0 ok, 1 violations or generator errors, 2 usage.
import { createRng } from '../src/core/rng';
import { getGenerator } from '../src/core/tasks/registry';
import { validateTask, type Violation } from '../src/core/tasks/validate';
import { availableStages, getStage } from '../src/data/curriculum';
import { nouns } from '../src/data/nouns';

const DEFAULT_SEED = 1;
const DEFAULT_COUNT = 3;

const usage = (): never => {
    console.error('Użycie: npm run sample -- <etap> [--seed N] [--count N]');
    console.error(`Etapy z danymi: ${availableStages().join(', ')}`);
    process.exit(2);
};

const args = process.argv.slice(2);
const stageId = args.find((a) => !a.startsWith('--'));
const option = (name: string, fallback: number): number => {
    const i = args.indexOf(`--${name}`);
    if (i === -1) {
        return fallback;
    }
    const value = Number(args[i + 1]);
    return Number.isInteger(value) ? value : usage();
};
const seed = option('seed', DEFAULT_SEED);
const count = option('count', DEFAULT_COUNT);
const stage = stageId ? getStage(stageId) : undefined;
if (!stage) {
    usage();
}

const violations: Violation[] = [];
let errors = 0;
let draw = 0;

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
            draw += 1;
            try {
                const task = generate(skill, createRng(seed * 1000 + draw));
                const max = typeof skill.params.max === 'number' ? skill.params.max : undefined;
                const found = validateTask(task, { max, nouns });
                violations.push(...found);
                const flag = found.length > 0 ? '  ⚠' : '';
                console.log(`    ${task.prompt}  → ${String(task.answer)}   podpowiedź: ${task.hint.join(' · ')}${flag}`);
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
