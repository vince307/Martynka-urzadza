// The player's local calendar day as 'YYYY-MM-DD'. Local fields on purpose:
// toISOString() is UTC and would flip the day at the wrong hour.
const pad = (n: number, width: number): string => String(n).padStart(width, '0');

export const localDay = (d: Date): string => `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`;
