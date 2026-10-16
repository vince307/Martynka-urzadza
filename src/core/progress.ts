// Progress preview for the parent (S-08 phase 5): the child's current step and the weakest skills of the current stage.
import { currentStep, playableSteps } from './curriculum';
import type { MasteryRules } from './mastery';
import { playable } from './round/pick';
import { formatNumber } from './text/formatNumber';
import type { Adaptation, MistakeExample, StageDef } from './types';

export interface ProgressExample {
    readonly prompt: string;
    readonly given: string;
    readonly answer: string;
}

export interface WeakSkill {
    readonly skillId: string;
    readonly title: string;
    readonly mastery: number;
    readonly max: number;
    readonly examples: readonly ProgressExample[];
}

export interface ProgressView {
    readonly step: { readonly index: number; readonly total: number; readonly title: string };
    readonly weakest: readonly WeakSkill[];
}

export interface ProgressRules {
    readonly mastery: Pick<MasteryRules, 'max'>;
    readonly view: { readonly weakestCount: number; readonly examplesPerSkill: number };
}

const formatValue = (value: number | string | readonly number[]): string =>
    typeof value === 'number' ? formatNumber(value) : typeof value === 'string' ? value : value.map(formatNumber).join(', ');

const formatExample = (example: MistakeExample): ProgressExample => ({
    prompt: example.prompt.replace(/\n/g, ' '),
    given: formatValue(example.given),
    answer: formatValue(example.answer),
});

/**
 * The step the child is on ("step N of M" over playable steps) and the weakest skills of the stage: playable skills with
 * at least one first-try miss, ranked by mastery ascending, misses descending, newer miss first, curriculum order.
 */
export const progressView = (stage: StageDef, adaptation: Adaptation, rules: ProgressRules, previous?: StageDef): ProgressView => {
    const steps = playableSteps(stage);
    const current = currentStep(stage, adaptation.unlockedStep[stage.id] ?? 1);
    const title = stage.steps.find((s) => s.step === current)?.title ?? '';
    // Previous-stage skills are drawn on every step (about 10 %): their misses count from the day the current stage began,
    // i.e. the earliest history entry of a current-stage skill. DESIGN-GAP 122: the kit's progress preview lists the current stage only.
    const began = adaptation.history.reduce((at, h) => (h.skillId.startsWith(`${stage.id}.`) ? Math.min(at, h.at) : at), Infinity);
    const sources = [...stage.steps.map((s) => ({ s, since: -Infinity })), ...(previous ? previous.steps.map((s) => ({ s, since: began })) : [])];
    const candidates = sources.flatMap(({ s, since }) =>
        s.skills.filter(playable).map((skill) => {
            const misses = adaptation.history.filter((h) => h.skillId === skill.id && !h.firstTry && h.at >= since);
            return {
                skill,
                title: s.title,
                misses,
                mastery: adaptation.mastery[skill.id] ?? 0,
                latest: misses.reduce((at, h) => Math.max(at, h.at), -Infinity),
            };
        }),
    );
    const weakest = candidates
        .filter((c) => c.misses.length > 0)
        .sort((a, b) => a.mastery - b.mastery || b.misses.length - a.misses.length || b.latest - a.latest)
        .slice(0, rules.view.weakestCount)
        .map((c) => ({
            skillId: c.skill.id,
            title: c.title,
            mastery: c.mastery,
            max: rules.mastery.max,
            examples: c.misses
                .map((h, order) => ({ h, order }))
                .filter(({ h }) => h.example !== undefined)
                .sort((a, b) => b.h.at - a.h.at || b.order - a.order)
                .slice(0, rules.view.examplesPerSkill)
                .map(({ h }) => formatExample(h.example as MistakeExample)),
        }));
    return { step: { index: steps.indexOf(current) + 1, total: steps.length, title }, weakest };
};
