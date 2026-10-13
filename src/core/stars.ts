// Star balance rule (S-09): the balance only grows by what a round earned.
// A negative, fractional or NaN delta is ignored, so tasks can never take
// stars away. Spending goes through `purchase` in rooms.ts.
export function earn(balance: number, delta: number): number {
    return Number.isInteger(delta) && delta > 0 ? balance + delta : balance;
}
