import { expect, test } from '@playwright/test';

test('/ redirects to /workspace with rail and primary region', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/workspace$/);
	await expect(page.getByRole('navigation')).toBeVisible();
	await expect(page.getByRole('main')).toBeVisible();
});

test('/workspace has no horizontal overflow', async ({ page }) => {
	await page.goto('/workspace');
	await expect(page.getByRole('main')).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
	).toBe(true);
});

test('rail capabilities destination navigates and comes back', async ({ page }) => {
	await page.goto('/workspace');
	await page.getByRole('button', { name: '{rail_secondary_destination}' }).click();
	await expect(page).toHaveURL(/\/capabilities$/);
	await expect(page.getByRole('heading', { name: '{capabilities}' })).toBeVisible();
	await page.getByRole('button', { name: '{rail_primary_destination}' }).click();
	await expect(page).toHaveURL(/\/workspace$/);
});

test('/capabilities/does-not-exist is a 404 with a recovery link', async ({ page }) => {
	const response = await page.goto('/capabilities/does-not-exist');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('link').first()).toBeVisible();
});

test('/settings/configuration_category_01 renders at least 2 field rows', async ({ page }) => {
	await page.goto('/settings/configuration_category_01');
	expect(await page.locator('[data-field]').count()).toBeGreaterThanOrEqual(2);
});

test('/workspace/bad!id is a 404 with a recovery action', async ({ page }) => {
	const response = await page.goto('/workspace/bad!id');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: '{empty_state}' })).toBeVisible();
	await page.getByRole('button', { name: '{rail_primary_destination}' }).click();
	await expect(page).toHaveURL(/\/workspace$/);
});
