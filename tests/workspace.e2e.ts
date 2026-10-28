import { expect, test, type Page } from '@playwright/test';

/** The shell opens its sidebar as a drawer below 650px; it covers the primary region. */
async function closeDrawer(page: Page): Promise<void> {
	const drawer = page.locator('#shell-sidebar[data-mode="drawer_open"]');
	// The shell applies the drawer mode in onMount, so it can arrive after `load`. A one-shot
	// count() races that mount and leaves the drawer covering the primary region.
	await expect
		.poll(async () => (await drawer.count()) > 0 || (await page.evaluate(() => innerWidth >= 650)))
		.toBe(true);
	if ((await drawer.count()) > 0) {
		await page.locator('button[aria-controls="shell-sidebar"]').click();
		await expect(drawer).toHaveCount(0);
	}
}

async function open(page: Page, url: string): Promise<void> {
	await page.goto(url);
	await closeDrawer(page);
}

/**
 * The region may already be open: the workbench persists its layout per session
 * (AC08/AC14), so a blind click on the collapsed strip's reopen control would fail
 * when the tab strip is already expanded. Open it only when it is still closed.
 */
async function openWorkbench(page: Page): Promise<void> {
	const tablist = page.getByRole('tablist');
	if (await tablist.isVisible().catch(() => false)) return;
	await page.getByRole('button', { name: 'Show panel' }).click();
	await expect(tablist).toBeVisible();
}

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
	// The rail and the composer support bar both expose a "Capabilities" control, so the
	// accessible name alone is ambiguous; scope to the rail's labelled nav.
	const rail = page.getByRole('navigation', { name: 'More destinations' });
	await rail.getByRole('button', { name: 'Capabilities' }).click();
	await expect(page).toHaveURL(/\/capabilities$/);
	await expect(page.getByRole('heading', { name: 'Capabilities' })).toBeVisible();
	await rail.getByRole('button', { name: 'Workspace' }).click();
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
	await expect(page.getByRole('heading', { name: 'Nothing to show yet.' })).toBeVisible();
	await page.getByRole('button', { name: 'Workspace' }).click();
	await expect(page).toHaveURL(/\/workspace$/);
});

test.describe('composer mounted on the unstarted surface', () => {
	// AC01: empty draft + unknown authority → submit disabled, reason comes from deriveSubmit.
	test('AC01 submit starts disabled on an empty draft', async ({ page }) => {
		await open(page, '/workspace');
		await expect(page.getByRole('textbox', { name: 'Open local chat' })).toBeVisible();

		// The reason itself lives in a Tooltip.Content that only opens from the submit button, and
		// a `disabled` button takes no pointer or focus events, so the reason text is currently
		// unreachable in the browser. Asserting the disabled contract is the honest part.
		const submit = page.getByRole('button', { name: 'Open local chat' });
		await expect(submit).toBeDisabled();
		await expect(submit).toHaveAttribute('aria-disabled', 'true');
	});

	test('AC01 the disabled reason is visible and describes the submit button', async ({ page }) => {
		await open(page, '/workspace');

		// deriveSubmit returns 'submit_disabled_reason_empty' for an empty draft, and that key
		// is rendered inline, so the reason reaches the DOM even though the button is disabled.
		const reason = page.locator('#composer-submit-reason');
		await expect(reason).toBeVisible();
		await expect(reason).toHaveText('Submit is disabled because the draft is empty.');
		await expect(reason).toHaveAttribute('role', 'status');

		const submit = page.getByRole('button', { name: 'Open local chat' });
		await expect(submit).toBeDisabled();
		await expect(submit).toHaveAttribute('aria-describedby', 'composer-submit-reason');
	});

	test('AC07 a draft survives leaving the workspace and coming back', async ({ page }) => {
		await open(page, '/workspace');
		const textarea = page.getByRole('textbox', { name: 'Open local chat' });
		await textarea.fill('kept draft');

		// "Capabilities" is also the composer support bar's label; scope to the rail.
		const rail = page.getByRole('navigation', { name: 'More destinations' });
		await rail.getByRole('button', { name: 'Capabilities' }).click();
		await expect(page).toHaveURL(/\/capabilities$/);
		await rail.getByRole('button', { name: 'Workspace' }).click();
		await expect(page).toHaveURL(/\/workspace$/);

		await expect(page.getByRole('textbox', { name: 'Open local chat' })).toHaveValue('kept draft');
	});

	test('AC16 unknown authority keeps submit closed even with a draft', async ({ page }) => {
		await open(page, '/workspace');
		await page.getByRole('textbox', { name: 'Open local chat' }).fill('draft without authority');
		await expect(page.getByRole('button', { name: 'Open local chat' })).toBeDisabled();
	});
});

test.describe('populated surface', () => {
	// AC02/AC04: authority allowed is only on the chat route, and the host appends the entry.
	test('AC02 draft enables submit and AC04 double click appends one entry', async ({ page }) => {
		await open(page, '/workspace/chat-1');
		const textarea = page.getByRole('textbox', { name: 'Open local chat' });
		const submit = page.getByRole('button', { name: 'Open local chat' });

		await expect(submit).toBeDisabled();
		await textarea.fill('single flight');
		await expect(submit).toBeEnabled();

		// Two clicks in one tick: the guard plus the derived `process === 'running'` state must
		// collapse them into a single append. Sequential Playwright clicks would hit the
		// re-rendered cancel button instead, which is not the double-submit race AC04 names.
		await submit.evaluate((element: HTMLButtonElement) => {
			element.click();
			element.click();
		});

		await expect(page.locator('[data-entry]')).toHaveCount(1);
		await expect(textarea).toHaveValue('');
	});
});

test.describe('secondary work region', () => {
	test('toggles the tab strip and keeps the draft (AC10)', async ({ page }) => {
		await open(page, '/workspace');
		await openWorkbench(page);
		const textarea = page.getByRole('textbox', { name: 'Open local chat' });
		await textarea.fill('draft across toggle');

		const tablist = page.getByRole('tablist');
		await expect(tablist).toBeVisible();
		if (test.info().project.name === 'desktop') {
			await expect(page.getByRole('separator')).toBeVisible();
		}

		// The strip starts empty; one tab gives the tab-survival assertion teeth.
		await tablist.getByRole('button', { name: 'Add' }).click();
		await expect(page.getByRole('tab')).toHaveCount(1);

		// AC10 is layout degradation: the dedicated hide control, not closing the last tab.
		await page.getByRole('button', { name: 'Hide panel' }).click();
		await expect(page.getByRole('tablist')).toBeHidden();
		const reopen = page.getByRole('button', { name: 'Show panel' });
		await expect(reopen).toBeVisible();

		await reopen.click();
		await expect(page.getByRole('tablist')).toBeVisible();
		await expect(page.getByRole('tab')).toHaveCount(1);
		await expect(textarea).toHaveValue('draft across toggle');

		const project = test.info().project.name;
		if (project === 'narrow-mobile' || project === 'mobile') {
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
			).toBe(true);
		}
	});

	test('AC08 hide then show keeps tab count and active tab', async ({ page }) => {
		await open(page, '/workspace');
		await openWorkbench(page);
		const tablist = page.getByRole('tablist');
		await expect(tablist).toBeVisible();

		// The strip starts empty on the unstarted surface; one tab gives the assertion teeth.
		const add = tablist.getByRole('button', { name: 'Add' });
		await add.click();
		await expect(page.getByRole('tab')).toHaveCount(1);

		const before = page.getByRole('tab');
		const activeLabel = await before.getAttribute('aria-selected');

		const hide = page.getByRole('button', { name: 'Hide panel' });
		await expect(hide).toHaveCount(1);
		await expect(hide).toHaveAttribute('aria-expanded', 'true');
		await hide.click();

		// Collapsed: the strip is gone, the reopen control reports the collapsed state.
		await expect(page.getByRole('tablist')).toHaveCount(0);
		const reopen = page.getByRole('button', { name: 'Show panel' });
		await expect(reopen).toHaveCount(1);
		await expect(reopen).toHaveAttribute('aria-expanded', 'false');
		await reopen.click();

		await expect(page.getByRole('tablist')).toBeVisible();
		await expect(page.getByRole('tab')).toHaveCount(1);
		await expect(page.getByRole('tab')).toHaveAttribute('aria-selected', activeLabel ?? 'false');
	});

	for (const route of ['/workspace', '/workspace/chat-1']) {
		test(`no horizontal overflow at 390px with the secondary region open (${route})`, async ({
			page
		}) => {
			await page.setViewportSize({ width: 390, height: 844 });
			await open(page, route);
			await openWorkbench(page);
			await expect(page.getByRole('tablist')).toBeVisible();
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
			).toBe(true);
		});
	}
});
