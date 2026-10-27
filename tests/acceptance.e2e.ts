import { expect, test, type Page } from '@playwright/test';

/**
 * Browser proof for the acceptance criteria that only had state/unit coverage.
 * Every assertion drives the shipped UI; nothing is imported from the app.
 */

const PNG_1X1 = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
	'base64'
);
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

/** The shell opens its sidebar as a drawer below 650px; it covers the primary region. */
async function closeDrawer(page: Page): Promise<void> {
	const drawer = page.locator('#shell-sidebar[data-mode="drawer_open"]');
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

function composerTextarea(page: Page) {
	return page.getByRole('textbox', { name: '{entry_heading}' });
}

/**
 * One accepted send. The composer keeps `running` until the run is closed, so a caller that
 * needs a second send has to cancel first (see the AC17 loop).
 */
async function sendMessage(page: Page, text: string): Promise<void> {
	const textarea = composerTextarea(page);
	await textarea.fill(text);
	await page.getByRole('button', { name: '{entry_heading}' }).click();
	await expect(textarea).toHaveValue('');
}

test.describe('composer acceptance', () => {
	// AC03: Two attachments, one failed → send pressed → send blocked, per-file reason,
	// ready files kept.
	test('AC03 a failed file blocks the send and keeps the ready file', async ({ page }) => {
		await open(page, '/workspace/chat-1');

		await page.setInputFiles('input[type="file"]', [
			{ name: 'ready.png', mimeType: 'image/png', buffer: PNG_1X1 },
			{ name: 'rejected.pdf', mimeType: 'application/pdf', buffer: PDF }
		]);

		// Validation resolves per file after its own delay, so each chip settles separately.
		const failed = page.locator('[data-status="failed"]');
		const ready = page.locator('[data-status="ready"]');
		await expect(failed).toHaveCount(1);
		await expect(ready).toHaveCount(1);

		// Per-file reason lives on the failed chip; the ready chip is untouched by it.
		await expect(failed.getByText('{attachment_failed_reason}', { exact: true })).toBeVisible();
		await expect(ready.getByText('ready.png', { exact: true })).toBeVisible();

		// The blocked send names its reason and the ready file was not dropped.
		const submit = page.getByRole('button', { name: '{entry_heading}' });
		await expect(submit).toBeDisabled();
		await expect(submit).toHaveAttribute('aria-disabled', 'true');
		const reason = page.locator('#composer-submit-reason');
		await expect(reason).toBeVisible();
		await expect(reason).not.toBeEmpty();
		await expect(reason).toHaveText('{attachment_failed_reason}');
	});

	// AC05: Request not yet accepted → connection lost → draft retained, retry does not
	// duplicate.
	test('AC05 offline keeps the draft and retry reuses the request identity', async ({ page }) => {
		await open(page, '/workspace/chat-1');
		const textarea = composerTextarea(page);

		await sendMessage(page, 'survives the drop');
		await expect(page.locator('[data-entry]')).toHaveCount(1);

		await page.context().setOffline(true);
		// Chromium emits `offline` from setOffline; the extra dispatch makes the test read the
		// app's window listener even on a browser that only flips navigator.onLine.
		await page.evaluate(() => window.dispatchEvent(new Event('offline')));

		await expect(textarea).toHaveValue('survives the drop');
		await expect(page.getByText('{error_state}', { exact: true })).toBeVisible();
		const retry = page.getByRole('button', { name: '{constraint_notice.recovery}' });
		await expect(retry).toBeVisible();

		await page.context().setOffline(false);
		await retry.click();

		// One send, one identity: the retry re-sends the aborted request id, so the host must
		// still show exactly the single entry the message earned.
		await expect(page.locator('[data-entry]')).toHaveCount(1);
	});

	// AC06: Response streaming → user cancels → partial output kept, cancelled status explicit.
	test('AC06 cancel keeps partial output and does not clear the draft', async ({ page }) => {
		await open(page, '/workspace/chat-1');
		const textarea = composerTextarea(page);

		await sendMessage(page, 'streamed body');
		// Text typed after the accepted send is unsent draft state; cancel owns neither.
		await textarea.fill('typed while running');

		await page.getByRole('button', { name: '{cancel_running}' }).click();

		const partial = page.locator('[data-partial-output]');
		await expect(partial).toBeVisible();
		await expect(partial.locator('p').first()).toHaveText('streamed body');
		await expect(partial.getByText('{cancel_running}', { exact: true })).toBeVisible();
		await expect(textarea).toHaveValue('typed while running');
	});
});

test.describe('workbench acceptance', () => {
	// AC09: Tab dirty → close → keep/discard/cancel offered; failed save keeps the tab open.
	test('AC09 dirty close offers keep/discard/cancel and a failed save keeps the tab', async ({
		page
	}) => {
		await open(page, '/workspace');
		const aside = page.locator('#workbench-region');
		const tablist = page.getByRole('tablist');
		await tablist.getByRole('button', { name: 'Add' }).click();
		await expect(page.getByRole('tab')).toHaveCount(1);

		// The resource body edit surface is the only local edit hook; the toolbar location input
		// shares its accessible name, so the strip must expose two textboxes once a tab exists.
		const editors = aside.getByRole('textbox', { name: '{resource_location}' });
		await expect(editors).toHaveCount(2);
		await editors.last().fill('edited resource');

		const tab = page.locator('[role="tab"]');
		await expect(tab).toHaveAttribute('data-dirty', 'true');

		await tab.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByText('{tab_close_dirty_prompt}', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: '{tab_close_dirty_cancel}' }).click();
		await expect(page.getByRole('tab')).toHaveCount(1);

		// Second half: the same edit path against the forced failure outcome.
		await open(page, '/workspace?saveOutcome=failed');
		const failedAside = page.locator('#workbench-region');
		await page.getByRole('tablist').getByRole('button', { name: 'Add' }).click();
		await expect(failedAside.getByRole('textbox', { name: '{resource_location}' })).toHaveCount(2);
		await failedAside
			.getByRole('textbox', { name: '{resource_location}' })
			.last()
			.fill('save must fail');

		const failedTab = page.locator('[role="tab"]');
		await expect(failedTab).toHaveAttribute('data-dirty', 'true');
		await failedTab.getByRole('button', { name: 'Close' }).click();
		await page.getByRole('button', { name: '{settings_saved}' }).click();

		await expect(page.getByText('{settings_save_error}', { exact: true })).toBeVisible();
		await expect(page.getByRole('tab')).toHaveCount(1);
		await expect(page.locator('[role="tab"]')).toHaveAttribute('data-dirty', 'true');
		await expect(page.locator('[role="tab"]')).toHaveAttribute('data-tab-status', 'error');
	});
});

test.describe('settings acceptance', () => {
	// AC12: Setting changed twice quickly → first save resolves last → newest value wins.
	test('AC12 the newest of two quick toggles survives a reload', async ({ page }) => {
		await open(page, '/settings/configuration_category_01');
		const field = page.locator('[data-field="permission_field_01"]');
		const toggle = field.locator('[data-slot="switch"]');
		await expect(toggle).toHaveAttribute('aria-checked', 'false');

		// Settle to `true` first: two clicks from `false` would land back on the default and the
		// persisted value could not tell the newest write from a stale one.
		await toggle.click();
		await expect(toggle).toHaveAttribute('data-persistence', 'saved');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');

		// Two clicks in quick succession: true → false → true. First save is revision 2, second
		// revision 3; the store applies only the newest revision.
		await toggle.click();
		await toggle.click();
		await expect(toggle).toHaveAttribute('data-persistence', 'saved');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');

		await page.reload();

		const restored = page.locator('[data-field="permission_field_01"] [data-slot="switch"]');
		await expect(restored).toHaveAttribute('aria-checked', 'true');
		await expect(page.getByText('{settings_save_error}', { exact: true })).toHaveCount(0);
		expect(await page.evaluate(() => sessionStorage.getItem('settings:permission_field_01'))).toBe(
			'true'
		);
	});

	// AC15: Populated list → search with no match → "no search results", not "no data".
	test('AC15 no-match copy replaces the empty copy in settings search', async ({ page }) => {
		await open(page, '/settings/configuration_category_01');
		// Scope to the category list: the sidebar region renders its own `{empty_state}` on a
		// non-workspace area, so a document-level assertion would count the wrong copy.
		const search = page.getByRole('searchbox', { name: '{settings_search_placeholder}' });
		const list = page.locator('nav').filter({ has: search });
		await expect(list).toHaveCount(1);
		await search.fill('zzz');

		await expect(list.getByText('{no_match_state}', { exact: true })).toBeVisible();
		await expect(list.getByText('{empty_state}', { exact: true })).toHaveCount(0);
	});
});

test.describe('capabilities acceptance', () => {
	// AC13: Capability installed but not connected → row shows "Connect", never claims ready.
	test('AC13 an installed capability starts unconnected and reports pending then connected', async ({
		page
	}) => {
		await open(page, '/capabilities');
		const list = page.getByRole('navigation', { name: '{capabilities}' });
		const row = list.locator('button[data-connection]').first();

		await expect(row).toHaveAttribute('data-connection', 'not_connected');
		await expect(row).toContainText('{capability_connection_none}');
		await expect(row).not.toContainText('{capability_connection_ready}');

		await row.click();

		const detail = page.locator('article[data-connection]');
		await expect(detail).toHaveAttribute('data-connection', 'not_connected');
		await expect(detail.getByText('{capability_connection_ready}', { exact: true })).toHaveCount(0);

		// The pending marker lasts one stub tick; record the attribute transitions before the
		// click so the short-lived state cannot be missed by a polling race.
		await page.evaluate(() => {
			const target = document.querySelector('article[data-connection]');
			if (!target) throw new Error('capability detail missing');
			const seen = [target.getAttribute('data-connection')];
			(target as HTMLElement).dataset.seen = '';
			(globalThis as unknown as { __connectionSeen?: string[] }).__connectionSeen = seen;
			new MutationObserver(() => {
				seen.push(target.getAttribute('data-connection'));
			}).observe(target, { attributes: true, attributeFilter: ['data-connection'] });
		});

		await detail.getByRole('button', { name: '{capability_connection_none}' }).click();

		await expect
			.poll(async () =>
				page.evaluate(
					() => (globalThis as unknown as { __connectionSeen?: string[] }).__connectionSeen ?? []
				)
			)
			.toContain('pending');
		await expect(detail).toHaveAttribute('data-connection', 'connected');
		await expect(detail).toContainText('{capability_connection_ready}');
	});

	// AC18: Tab landing present but related-tab list empty → copy scopes the emptiness to that
	// list.
	test('AC18 the empty related-list copy is scoped to the related list', async ({ page }) => {
		await open(page, '/capabilities');
		await page
			.getByRole('navigation', { name: '{capabilities}' })
			.locator('button[data-connection]')
			.first()
			.click();

		const detail = page.locator('article[data-connection]');
		const related = detail.locator('section').filter({ hasText: '{related_records}' });
		await expect(related).toHaveCount(1);
		await expect(related.getByText('{no_match_state}', { exact: true })).toBeVisible();

		// The landing itself is populated, so the no-match string exists exactly once and only
		// inside the related-list section (the slice has no section-level data attribute).
		await expect(detail.getByText('{no_match_state}', { exact: true })).toHaveCount(1);
		await expect(page.getByText('{no_match_state}', { exact: true })).toHaveCount(1);
		await expect(detail.getByText('{empty_state}', { exact: true })).toHaveCount(0);
	});

	// AC15 (second surface): the capability catalog separates no-match from empty.
	test('AC15 capability search renders no_match rather than empty', async ({ page }) => {
		await open(page, '/capabilities');
		await page.getByRole('searchbox', { name: '{settings_search_placeholder}' }).fill('zzz');

		await expect(page.locator('[data-list-state="no_match"]')).toBeVisible();
		await expect(page.locator('[data-list-state="empty"]')).toHaveCount(0);
	});
});

test.describe('workspace and overlay acceptance', () => {
	// AC14: Settings opened from chat → return to workspace → chat, draft and tabs restored.
	test('AC14 returning from settings restores the chat draft and its tab', async ({ page }) => {
		await open(page, '/workspace/chat-1');
		const textarea = composerTextarea(page);
		await textarea.fill('survives settings');
		await page.getByRole('tablist').getByRole('button', { name: 'Add' }).click();
		await expect(page.getByRole('tab')).toHaveCount(1);

		await page.getByRole('button', { name: '{rail_tertiary_destination}' }).click();
		await expect(page).toHaveURL(/\/settings\/configuration_category_01$/);

		await open(page, '/workspace/chat-1');
		await expect(composerTextarea(page)).toHaveValue('survives settings');
		await expect(page.getByRole('tab')).toHaveCount(1);
	});

	// AC11: More menu opened by keyboard → Escape → menu closes, focus returns to its trigger.
	test('AC11 keyboard opens the overlay and Escape returns focus to the trigger', async ({
		page
	}) => {
		await open(page, '/workspace');
		const trigger = page.locator('[data-overlay-trigger]');

		await trigger.focus();
		await expect(trigger).toBeFocused();
		await page.keyboard.press('Enter');

		const overlay = page.locator('[data-overlay]');
		await expect(overlay).toBeVisible();
		await expect(overlay).toHaveAttribute('role', 'dialog');
		await expect(page.getByRole('button', { name: 'Close' })).toBeFocused();

		await page.keyboard.press('Escape');

		await expect(overlay).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});

	// AC17: Reading old messages → new output arrives → scroll position kept, new-content
	// marker shown.
	test('AC17 an append keeps the reading position and clears the marker at the bottom', async ({
		page
	}) => {
		await open(page, '/workspace/chat-1');
		const scroller = page.locator('[data-slot="timeline-scroller"]');
		await expect(scroller).toBeVisible();

		// Each send closes the run (the stub stays `running` otherwise), so a cancel per message
		// is what lets the timeline grow past one screen.
		for (let index = 0; index < 24; index += 1) {
			await sendMessage(page, `old message ${index}`);
			await page.getByRole('button', { name: '{cancel_running}' }).click();
			await expect(page.locator('[data-partial-output]')).toBeVisible();
		}

		expect(
			await scroller.evaluate((element) => element.scrollHeight > element.clientHeight + 120)
		).toBe(true);

		await scroller.evaluate((element) => {
			element.scrollTop = 80;
		});
		const recorded = await scroller.evaluate((element) => element.scrollTop);
		expect(recorded).toBeGreaterThan(24);

		await sendMessage(page, 'arrives while reading');

		await expect(page.locator('[data-new-content="true"]')).toBeVisible();
		expect(
			Math.abs((await scroller.evaluate((element) => element.scrollTop)) - recorded)
		).toBeLessThanOrEqual(2);
		await expect(page.locator('[data-entry]')).toHaveCount(25);

		// Reaching the bottom is the only thing that clears the marker.
		await scroller.evaluate((element) => {
			element.scrollTop = element.scrollHeight;
		});
		await expect(page.locator('[data-new-content="true"]')).toHaveCount(0);
	});
});
