// DATA: read a bar chart (ZADANIA.md, section 4). 3-4 bars, all values different
// (no ties at the top, at the bottom or in a difference), values 1..maxValue.
// Variants: `most` / `least` (tiles with the bar labels), `howMany` (keypad) and
// `diff` ("O ile więcej … niż …", keypad).
import { chartThemes } from '../../../data/charts';
import { pl } from '../../../data/pl';
import { MINUS } from '../symbols';
import type { Generator, Task } from '../types';

export type DataVariant = 'most' | 'least' | 'howMany' | 'diff';

export interface DataParams {
    variant: DataVariant;
    maxValue: number;
    bars: 3 | 4;
}

const VARIANTS: readonly DataVariant[] = ['most', 'least', 'howMany', 'diff'];

export const parseDataParams = (params: Record<string, unknown>): DataParams => {
    const { variant, maxValue, bars } = params;
    if (!VARIANTS.includes(variant as DataVariant)) {
        throw new TypeError(`DATA params.variant must be one of ${VARIANTS.join(', ')}, got ${String(variant)}`);
    }
    if (bars !== 3 && bars !== 4) {
        throw new TypeError(`DATA params.bars must be 3 or 4, got ${String(bars)}`);
    }
    if (typeof maxValue !== 'number' || !Number.isInteger(maxValue) || maxValue < bars || maxValue > 20) {
        throw new TypeError(`DATA needs an integer params.maxValue within ${bars}..20 (distinct bar values), got ${String(maxValue)}`);
    }
    return { variant: variant as DataVariant, maxValue, bars };
};

export const generateData: Generator = (skill, rng): Task => {
    const p = parseDataParams(skill.params);
    const theme = rng.pick(chartThemes);
    const picked = rng.shuffle([...theme.items]).slice(0, p.bars);
    const values = rng.shuffle(Array.from({ length: p.maxValue }, (_, i) => i + 1)).slice(0, p.bars);
    const bars = picked.map((item, i) => ({ label: item.label, value: values[i] }));
    const visual = { kind: 'bars', bars, scaleMax: p.maxValue } as const;
    const values_ = pl.tasks.dataValuesHint(bars.map((b) => `${b.label} ${b.value}`).join(', '));

    if (p.variant === 'most' || p.variant === 'least') {
        const most = p.variant === 'most';
        const target = bars.reduce((a, b) => ((most ? b.value > a.value : b.value < a.value) ? b : a));
        return {
            skillId: skill.id,
            prompt: `${theme.intro} ${most ? theme.most : theme.least}`,
            visual,
            answer: target.label,
            choices: rng.shuffle(bars.map((b) => b.label)),
            hint: [pl.tasks.dataMostLeast, values_, most ? pl.tasks.dataMostAnswerHint(target.label) : pl.tasks.dataLeastAnswerHint(target.label)],
        };
    }
    if (p.variant === 'howMany') {
        const index = rng.int(0, bars.length - 1);
        return {
            skillId: skill.id,
            prompt: pl.tasks.dataHowMany(theme.intro, picked[index].acc),
            visual,
            answer: bars[index].value,
            hint: [pl.tasks.dataHowManyHint(bars[index].label), pl.tasks.dataHowManyAnswerHint(bars[index].label, bars[index].value)],
        };
    }
    const [a, b] = rng.shuffle([...bars.keys()]);
    const [moreIndex, lessIndex] = bars[a].value > bars[b].value ? [a, b] : [b, a];
    const diff = bars[moreIndex].value - bars[lessIndex].value;
    return {
        skillId: skill.id,
        prompt: pl.tasks.dataDiff(theme.intro, picked[moreIndex].acc, picked[lessIndex].acc),
        visual,
        answer: diff,
        hint: [pl.tasks.dataDiffHint, values_, `${bars[moreIndex].value} ${MINUS} ${bars[lessIndex].value} = ${diff}`],
    };
};
