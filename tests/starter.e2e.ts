import { expect, test } from '@playwright/test';

test('fresh clone boots, opens live-data and preserves keyboard navigation', async ({
	page
}, testInfo) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	expect(response?.headers()['x-content-type-options']).toBe('nosniff');
	await page.getByRole('link', { name: 'Open starter' }).click();
	const modes = page.getByRole('group', { name: 'Dashboard reference mode' });
	await modes.getByRole('button', { name: 'Architecture' }).focus();
	await page.keyboard.press('Tab');
	await page.keyboard.press('Enter');
	await expect(modes.getByRole('button', { name: 'Interaction kit' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	const nav = page.getByRole('navigation', {
		name: testInfo.project.name === 'desktop' ? 'Apps' : 'Mobile app dock'
	});
	await nav.getByRole('link', { name: 'Live data' }).click();
	await expect(page.getByText('Convex is ready to link')).toBeVisible();
	await page.getByRole('button', { name: 'Switch workspace: Starter workspace' }).click();
	await expect(page.getByRole('menu')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('menu')).toBeHidden();
	await expect(
		page.getByRole('button', { name: 'Switch workspace: Starter workspace' })
	).toBeFocused();
	expect(errors).toEqual([]);
});

test('dynamic app shell stays responsive and semantic', async ({ page }, testInfo) => {
	await page.goto('/apps/dashboard');
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

	const geometry = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		clientWidth: document.documentElement.clientWidth
	}));
	expect(geometry.scrollWidth).toBe(geometry.clientWidth);

	const breadcrumb = page.getByRole('navigation', { name: 'Feature breadcrumb' });
	await expect(breadcrumb).toBeVisible();
	expect(await breadcrumb.locator('button, select').count()).toBe(0);
	await expect(page.getByRole('button', { name: /Switch workspace:/ })).toBeVisible();

	const stackRail = page.getByRole('region', { name: 'Stack versions' });
	await expect(stackRail).toBeVisible();
	const rail = await stackRail.evaluate((node) => ({
		client: node.clientWidth,
		scroll: node.scrollWidth
	}));

	if (testInfo.project.name !== 'desktop') {
		await expect(page.getByRole('navigation', { name: 'Mobile app dock' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Apps' })).toBeHidden();
		expect(rail.scroll).toBeGreaterThan(rail.client);
	} else {
		await expect(page.getByRole('navigation', { name: 'Apps' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Mobile app dock' })).toBeHidden();
		expect(rail.scroll).toBeLessThanOrEqual(rail.client + 1);
	}

	await page.getByRole('button', { name: 'Interaction kit' }).click();
	await expect(page.getByText('Adaptive grid', { exact: true })).toBeVisible();
	const interactionGrid = page.locator('.app-feature-grid').first();
	const columns = await interactionGrid.evaluate(
		(node) => getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length
	);
	if (testInfo.project.name !== 'desktop') expect(columns).toBe(1);
	else expect(columns).toBeGreaterThan(1);
});

test('workspace utility is separate from breadcrumb state', async ({ page }) => {
	await page.goto('/apps/dashboard');
	await page.getByRole('button', { name: 'Switch workspace: Starter workspace' }).click();
	await page.getByRole('menuitem', { name: 'Preview workspace' }).click();
	await expect(page.getByRole('navigation', { name: 'Feature breadcrumb' })).toContainText(
		'Preview workspace'
	);
	await expect(
		page.getByRole('button', { name: 'Switch workspace: Preview workspace' })
	).toBeVisible();
});

test('settings use local modes and progressive disclosure', async ({ page }) => {
	await page.goto('/apps/settings');
	await page.getByRole('button', { name: 'Interface' }).click();
	await expect(page.getByText('App-first mobile', { exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Workspace' }).click();
	await page.getByText('Advanced template rules').click();
	await expect(page.getByText(/Keep user customization in data\/config/)).toBeVisible();
});

test('invalid registry slug is a real 404', async ({ page }) => {
	const response = await page.goto('/apps/not-real');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'App not found' })).toBeVisible();
});
