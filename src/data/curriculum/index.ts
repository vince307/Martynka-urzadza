// Curriculum stages as data (plan section 4). Stages without content yet are
// absent, so tools can list what exists.
import type { StageDef, StageId } from '../../core/types';
import { E3 } from './E3';

export const stages: Readonly<Partial<Record<StageId, StageDef>>> = {
    E3,
};

export const getStage = (id: string): StageDef | undefined =>
    Object.prototype.hasOwnProperty.call(stages, id) ? stages[id as StageId] : undefined;

export const availableStages = (): StageId[] => Object.keys(stages) as StageId[];
