import { expect, test, type Page } from '@playwright/test';

/** Console/page errors seen before navigation and during hydration. */
function collectErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error') errors.push(message.text());
	});
	page.on('pageerror', (error) => errors.push(error.message));
	return errors;
}

/** The chat stub focuses its composer on mount; that is the app's "client took over" marker. */
async function waitForShellHydration(page: Page): Promise<void> {
	await expect(page.getByRole('textbox', { name: 'Message' })).toBeEnabled();
}

test('fresh clone boots without credentials and hydrates the workspace shell', async ({ page }) => {
	const errors = collectErrors(page);

	await page.goto('/');

	await expect(page.getByRole('menubar', { name: 'Workspace menu' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'What do you want to work on?' })).toBeVisible();
	await waitForShellHydration(page);

	// No credentials configured: the composer is usable, nothing is disabled by config.
	const composer = page.getByRole('textbox', { name: 'Message' });
	await expect(composer).toBeEnabled();
	await composer.fill('Hello');
	await expect(page.getByRole('button', { name: 'Send' })).toBeEnabled();

	expect(errors).toEqual([]);
});

test('a local send produces a timeline entry and keeps the draft mounted', async ({ page }) => {
	await page.goto('/');
	const composer = page.getByRole('textbox', { name: 'Message' });
	await composer.fill('First message');
	await page.getByRole('button', { name: 'Send' }).click();

	// The stub replies after a short delay. Scope to the log: the same text also becomes
	// the session title in the sidebar, so an unscoped locator is ambiguous by design.
	const log = page.getByRole('log', { name: 'Messages' });
	await expect(log.getByText('First message')).toBeVisible();
	// One user entry plus one stub reply; the reply text rotates by turn index, so the
	// assertion is on the count and on the user's own text.
	await expect(log.locator('.chat-message')).toHaveCount(2);
	await expect(log.locator('.chat-message[data-tone="assistant"]')).toHaveCount(1);
});
