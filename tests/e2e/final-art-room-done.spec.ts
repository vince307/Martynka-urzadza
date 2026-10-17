// Risk #16 / FR-019 of context/foundation/test-plan.md, change final-art-p2 (S-16c): the last purchase shows "Pokój gotowy!"
// and the tile of the finished room keeps the child's own salon; with salon pictures missing it shows the pack thumbnail,
// and with that missing too the drawn miniature. The hook reports the CHOICE (snapshot.room.doneMiniature), not the look
// (the look is the visual gate). Runs in the chromium-hook project; the service worker is blocked so the aborted route
// really cuts the file. Stars come from the e2e-only ?e2eStars seam; ?e2eArt=room queues no salon picture.
import { test, expect, type Page } from '@playwright/test';
import { finishSalon, room } from './support/salon';
import { tapTarget } from './support/hook';

test.setTimeout(180_000);
test.use({ serviceWorkers: 'block' });

/** "Dalej" closes the card and the miniature report goes back to null. */
const closeCard = async (page: Page): Promise<void> => {
    await tapTarget(page, 'cardNext');
    await expect.poll(async () => (await room(page)).card, { timeout: 15_000 }).toBeNull();
    expect((await room(page)).doneMiniature).toBeNull();
};

test('FR-019 S-16c the done card shows the child\'s own salon', async ({ page }) => {
    await finishSalon(page, {});
    expect((await room(page)).doneMiniature).toBe('live');
    await closeCard(page);
});

test('FR-019 S-16c with salon pictures missing the done card shows the pack thumbnail', async ({ page }) => {
    await finishSalon(page, { e2eArt: 'room' });
    expect((await room(page)).doneMiniature).toBe('thumbnail');
    await closeCard(page);
});

test('FR-019 S-16c with the thumbnail missing too the drawn miniature stays', async ({ page }) => {
    await page.route('**/assets/ui/salon-after.webp', (route) => route.abort());
    await finishSalon(page, { e2eArt: 'room' });
    expect((await room(page)).doneMiniature).toBe('drawn');
    await closeCard(page);
});
