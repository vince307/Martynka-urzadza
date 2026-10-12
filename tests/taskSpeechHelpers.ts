import { months } from '../src/data/calendar';

export const monthsOf = (): string[] => months.map((m) => m.name);
