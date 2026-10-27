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

/**
 * The segment control flips its buttons from disabled to enabled in `onMount`, so it is the
 * app's own "client took over" marker. Waiting on it keeps the hydration assertions below
 * honest instead of racing the dev server's module graph.
 */
async function waitForShellHydration(page: Page): Promise<void> {
	const mode = page.getByRole('group', { name: '{workspace_name}' });
	await expect(mode.getByRole('button').first()).toBeEnabled();
}

test('fresh clone boots without credentials and hydrates the workspace shell', async ({ page }) => {
	const errors = collectErrors(page);

	// Direct path: the root redirect is covered elsewhere; this test is about hydration.
	await page.goto('/workspace');

	await expect(page.getByRole('navigation')).toBeVisible();
	await expect(page.getByRole('main')).toBeVisible();
	await expect(page.getByRole('heading', { name: '{entry_heading}' })).toBeVisible();
	await waitForShellHydration(page);

	// No credentials configured: the composer is usable, nothing is disabled by config.
	const textarea = page.getByRole('textbox', { name: '{entry_heading}' });
	await expect(textarea).toBeVisible();
	await expect(textarea).toBeEnabled();

	expect(errors).toEqual([]);
});

test('client controls wait for hydration before they accept input', async ({ page }) => {
	await page.goto('/workspace');
	await waitForShellHydration(page);

	const textarea = page.getByRole('textbox', { name: '{entry_heading}' });
	await textarea.fill('draft-before-hydration');
	await expect(textarea).toHaveValue('draft-before-hydration');

	// Authority is `unknown` on /workspace, so the button stays closed; the reason paragraph
	// must move off the server-rendered `empty` reason to `invalid`, which only the reactive
	// derivation can do once text exists after hydration.
	const reason = page.locator('#composer-submit-reason');
	await expect(reason).toBeVisible();
	await expect(reason).toHaveText('{submit_disabled_reason_invalid}');
	await expect(page.getByRole('button', { name: '{entry_heading}' })).toBeDisabled();

	// Client-side round trip: the mounted draft store mirrors to sessionStorage and back.
	await page.getByRole('button', { name: '{rail_secondary_destination}' }).click();
	await expect(page).toHaveURL(/\/capabilities$/);
	await page.getByRole('button', { name: '{rail_primary_destination}' }).click();
	await expect(page).toHaveURL(/\/workspace$/);

	await expect(page.getByRole('textbox', { name: '{entry_heading}' })).toHaveValue(
		'draft-before-hydration'
	);
});
