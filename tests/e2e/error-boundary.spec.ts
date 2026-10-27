// Error boundary (plan observability-c1-c2, phase 6; test-plan risk #15 (proposed, refresh pending)):
// an exception must end in a calm restart card, never in a frozen screen or a dead touch, and browser noise
// must never interrupt a child. The boundary, the card and the input switch exist only in the rendered game
// (window error events, DOM card over the canvas), so this runs in the chromium-hook project.
// Failures are forced by the e2e build only: ?e2eFail=step|boot|settings (read by main.ts under __E2E_HOOK__).
// Origin: seed.spec.ts / parent-settings.spec.ts pattern; strings from src/data/pl.ts, no assertion on exception text.
import { test, expect } from '@playwright/test';
import { pl } from '../../src/data/pl';
import { answerRight, phaseIs, readHook, silenceSpeech, snapshot } from './support/hook';
import { openSettings, passWelcome } from './support/welcome';

// One canvas at a time (see task-round.spec.ts).
test.describe.configure({ mode: 'serial' });
test.setTimeout(90_000);

const card = (page: import('@playwright/test').Page) => page.getByRole('alertdialog', { name: pl.errorCard.title });

test('#15 (proposed) an exception in a frame shows the restart card instead of a frozen screen', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eFail: 'step' });

    // The frame that throws: the card is up, the game takes no touch, the card names the build.
    await expect(card(page)).toBeVisible();
    await expect.poll(async () => (await snapshot(page)).inputEnabled).toBe(false);
    const build = await page.locator('#game-container').getAttribute('data-build');
    expect(build).toBeTruthy();
    // The forced failure throws a plain Error: the line is the shared "Kod: Error · Wersja <build>", not the bare build.
    await expect(card(page).getByText(pl.saveFailed.detail('Error', build!), { exact: true })).toBeVisible();
    await expect(card(page).getByText(pl.errorCard.build(build!), { exact: true })).toHaveCount(0);

    // "Zacznij od nowa" reloads the page: the card is gone and the welcome screen is back.
    await Promise.all([
        page.waitForEvent('load'),
        card(page).getByRole('button', { name: pl.errorCard.restart, exact: true }).tap(),
    ]);
    await expect(card(page)).toHaveCount(0);
    await expect.poll(async () => (await readHook(page, 'snapshot'))?.screen).toBe('welcome');
});

test('#15 (proposed) a failure while the game boots shows the card', async ({ page }) => {
    await silenceSpeech(page);
    // The boot scene throws inside the font loader's promise chain: the carrier is an unhandled rejection.
    await page.goto('./?e2eFail=boot');
    await expect(card(page)).toBeVisible();
    await expect(card(page).getByRole('button', { name: pl.errorCard.restart, exact: true })).toBeVisible();
    const build = await page.locator('#game-container').getAttribute('data-build');
    expect(build).toBeTruthy();
    await expect(card(page).getByText(pl.saveFailed.detail('Error', build!), { exact: true })).toBeVisible();
    await expect(card(page).getByText(pl.errorCard.build(build!), { exact: true })).toHaveCount(0);
});

test('#15 (proposed) an exception in the parent settings callback shows the card, not a dead screen', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page, { e2eFail: 'settings' });
    await phaseIs(page, 'first');

    const panel = await openSettings(page);
    await panel.getByRole('button', { name: pl.parent.confirm, exact: true }).tap();

    await expect(card(page)).toBeVisible();
    await expect(page.getByRole('dialog', { name: pl.settings.title })).toHaveCount(0);
});

test('#15 (proposed) browser noise does not show the card', async ({ page }) => {
    await silenceSpeech(page);
    await passWelcome(page);
    await phaseIs(page, 'first');

    await page.evaluate(() => {
        window.dispatchEvent(new ErrorEvent('error', { message: 'ResizeObserver loop completed with undelivered notifications' }));
    });
    await expect(card(page)).toHaveCount(0);

    // The round still takes a touch.
    await answerRight(page);
    await phaseIs(page, 'done');
});
