// Risk #11 for the six-place wallet of the pack (S-16c phase 10): coins are dragged over the wallet art by touch. The wallet takes six
// coins and refuses a seventh (the tray dims), a coin lifted from the wallet leaves its OWN place empty (the first of two equal coins),
// and without the wallet picture the drawn wallet still pays. The aim is the hook's interior points (scale FIT); the finger held
// mid-drag is `holdDrag`. ?e2eSkills (e2e build only) forces the skill; parent path on E1 as in money-pay.spec.ts.
import { test, expect, type Page } from '@playwright/test';
import { answerRight, holdDrag, payCoins, phaseIs, silenceSpeech, snapshot, tapScene, dragTouch, targets } from './support/hook';
import { passWelcomeAsParent } from './support/welcome';

test.use({ serviceWorkers: 'block' });

const open = async (page: Page): Promise<void> => {
    await silenceSpeech(page);
    await passWelcomeAsParent(page, {
        age: '10+',
        stageLabel: 'Klasa 1, I półrocze',
        stage: 'E1',
        month: 9,
        query: { e2eSkills: 'E1.11.money_pay_10', e2eVariant: 'off' },
    });
    await phaseIs(page, 'first');
};

const wallet = async (page: Page): Promise<number[]> => (await snapshot(page)).wallet ?? [];

test('#11 S-16c six coins fill the wallet art, a seventh flies back and the tray dims', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    expect((await targets(page)).coins?.walletArt).toBe('art');
    expect((await targets(page)).coins?.full).toBe(false);
    await payCoins(page, [100, 100, 100, 100, 100, 100]);
    await expect.poll(async () => (await targets(page)).coins?.full).toBe(true);
    expect(await wallet(page)).toHaveLength(6);

    // A seventh coin is refused: dragged in, it does not stay. The next action (a coin taken out) is processed after it,
    // so a wallet of five afterwards proves the seventh never took a place.
    const { coins } = await targets(page);
    await dragTouch(page, coins!.tray['coin-2zl']!, coins!.wallet!, 3);
    const placed = (await targets(page)).coins!.coins;
    expect(placed).toHaveLength(6);
    await tapScene(page, placed[0]);
    await expect.poll(async () => (await wallet(page)).length).toBe(5);
    expect((await targets(page)).coins?.full).toBe(false);
});

test('#11 S-16c lifting the first of two equal coins leaves its own place empty', async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    await payCoins(page, [200, 200]);
    const before = (await targets(page)).coins!;
    expect(before.coins).toHaveLength(2);
    const [first, second] = before.coins;
    expect(first).not.toEqual(second);

    // The finger lifts the coin of cell 0 and stays down mid-way: the drawn cells are cell 1 only.
    const held = await holdDrag(page, first, { x: first.x, y: first.y - 150 });
    try {
        await expect.poll(async () => (await targets(page)).coins?.coins.length).toBe(1);
        const drawn = (await targets(page)).coins!.coins[0];
        expect({ x: drawn.x, y: drawn.y }).toEqual({ x: second.x, y: second.y });
    } finally {
        // Released outside the wallet (over the tray) the coin is gone for good.
        await held.release(before.tray['coin-1zl']!);
    }
    await expect.poll(async () => (await wallet(page)).length).toBe(1);
});

test('#11 S-16c without the wallet picture the drawn wallet still pays', async ({ page }) => {
    test.setTimeout(60_000);
    await page.route('**/assets/ui/wallet-open.webp', (route) => route.abort());
    await open(page);
    expect((await targets(page)).coins?.walletArt).toBe('drawn');
    const before = await snapshot(page);
    await answerRight(page);
    await phaseIs(page, 'done');
    const done = await snapshot(page);
    expect(done.outcomes[done.index]).toBe('first');
    expect(done.starsEarned).toBe(before.starsEarned + 1);
});
