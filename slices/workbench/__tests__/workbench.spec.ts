import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
// ponytail: import state.ts directly, not the barrel — the barrel re-exports the .svelte
// component, and pulling Svelte into this module pushes src/lib/config/linting.spec.ts over
// its 5s timeout. The barrel surface is asserted from source below instead.
import { activeTab, clampSplitWidth, createWorkbenchState, effectiveLayout } from '../state.svelte';
import type { Tab } from '../types';

describe('barrel surface', () => {
	const source = readFileSync(path.join(import.meta.dirname, '..', 'index.ts'), 'utf8');

	it('exports the documented runtime helpers', () => {
		for (const name of [
			'Workbench',
			'createWorkbenchState',
			'clampSplitWidth',
			'effectiveLayout',
			'activeTab'
		]) {
			expect(source).toContain(name);
		}
	});

	it('exports the documented types', () => {
		for (const name of ['CloseDecision', 'Tab', 'WorkbenchLayout']) {
			expect(source).toContain(name);
		}
	});
});

let clock = 0;
function makeTab(overrides: Partial<Tab> = {}): Tab {
	clock += 1;
	return {
		id: `tab-${clock}`,
		kind: 'browser',
		titleKey: 'resource_start_title',
		resourceId: null,
		status: 'idle',
		dirty: false,
		ownerChatId: null,
		lastFocusedAt: clock,
		error: null,
		...overrides
	};
}

describe('workbench state', () => {
	it('starts closed on a cold visit (C2) and hides no tabs', () => {
		const state = createWorkbenchState();
		expect(state.layout).toBe('closed');
		expect(state.hidden).toBe(false);
	});

	it('restores a stored layout verbatim (T8/AC14)', () => {
		const storage = new Map<string, string>();
		const store = {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => void storage.set(key, value),
			removeItem: (key: string) => void storage.delete(key)
		} as unknown as Storage;
		store.setItem(
			'workbench:tabs',
			JSON.stringify({
				tabs: [],
				activeTabId: null,
				layout: 'split',
				hidden: false,
				splitWidth: 400
			})
		);
		const state = createWorkbenchState({ storage: store });
		expect(state.restored).toBe(true);
		expect(state.layout).toBe('split');
	});

	it('keeps tabs and active tab across hide/show (AC08)', () => {
		const state = createWorkbenchState();
		const [a, b, c] = [makeTab(), makeTab(), makeTab()];
		state.addTab(a);
		state.addTab(b);
		state.addTab(c);
		state.activateTab(b.id);

		state.setLayout('closed');
		expect(state.layout).toBe('closed');

		state.setLayout('split');
		expect(state.layout).toBe('split');
		expect(state.tabs.length).toBe(3);
		expect(state.activeTabId).toBe(b.id);
	});

	it('toggleHidden twice keeps three tabs and the active tab (AC08)', () => {
		const state = createWorkbenchState();
		const [a, b, c] = [makeTab(), makeTab(), makeTab()];
		state.addTab(a);
		state.addTab(b);
		state.addTab(c);
		state.activateTab(b.id);

		expect(state.hidden).toBe(false);
		state.toggleHidden();
		expect(state.hidden).toBe(true);
		expect(state.tabs).toHaveLength(3);
		expect(state.activeTabId).toBe(b.id);

		state.toggleHidden();
		expect(state.hidden).toBe(false);
		expect(state.tabs).toHaveLength(3);
		expect(state.activeTabId).toBe(b.id);

		// Independent of layout: hiding never closes, closing never hides.
		state.toggleHidden();
		state.setLayout('closed');
		expect(state.hidden).toBe(true);
		expect(state.tabs).toHaveLength(3);
	});

	it('guards a dirty tab until a decision arrives (AC09)', () => {
		const state = createWorkbenchState();
		const clean = makeTab();
		const dirty = makeTab({ dirty: true });
		state.addTab(clean);
		state.addTab(dirty);

		expect(state.closeTab(dirty.id)).toBe(false);
		expect(state.tabs.some((tab) => tab.id === dirty.id)).toBe(true);

		expect(state.closeTab(dirty.id, 'cancel')).toBe(false);
		expect(state.tabs.some((tab) => tab.id === dirty.id)).toBe(true);

		expect(state.closeTab(dirty.id, 'discard')).toBe(true);
		expect(state.tabs.some((tab) => tab.id === dirty.id)).toBe(false);
		expect(state.tabs.length).toBe(1);
	});

	it('keep clears dirty and leaves the tab open', () => {
		const state = createWorkbenchState();
		const dirty = makeTab({ dirty: true });
		state.addTab(dirty);

		expect(state.closeTab(dirty.id, 'keep')).toBe(false);
		expect(state.tabs).toHaveLength(1);
		expect(state.tabs[0].dirty).toBe(false);
	});

	it('commitTab saves a dirty tab and clears dirty (AC09)', async () => {
		const state = createWorkbenchState({ saveOutcome: 'saved' });
		const tab = makeTab({ dirty: true });
		state.addTab(tab);

		await expect(state.commitTab(tab.id)).resolves.toBe('saved');
		expect(state.tabs[0].dirty).toBe(false);
		expect(state.tabs[0].status).toBe('ready');
	});

	it('a failed save keeps the tab dirty, open and unclosable (AC09)', async () => {
		const state = createWorkbenchState({ saveOutcome: 'failed' });
		const tab = makeTab({ dirty: true });
		state.addTab(tab);

		await expect(state.commitTab(tab.id)).resolves.toBe('failed');
		expect(state.tabs[0].dirty).toBe(true);
		expect(state.tabs[0].status).toBe('error');
		expect(state.tabs[0].error).toEqual({
			code: 'save_failed',
			messageKey: 'settings_save_error'
		});

		expect(state.closeTab(tab.id)).toBe(false);
		expect(state.tabs).toHaveLength(1);
	});

	it('markDirty marks a clean tab dirty without switching tabs (AC09)', () => {
		const state = createWorkbenchState();
		const [a, b] = [makeTab(), makeTab()];
		state.addTab(a);
		state.addTab(b);
		state.activateTab(a.id);

		state.markDirty(b.id, true);
		expect(state.tabs.find((tab) => tab.id === b.id)?.dirty).toBe(true);
		expect(state.activeTabId).toBe(a.id);

		state.markDirty(b.id, false);
		expect(state.tabs.find((tab) => tab.id === b.id)?.dirty).toBe(false);
	});

	it('closing a missing tab changes nothing', () => {
		const state = createWorkbenchState();
		state.addTab(makeTab());
		expect(state.closeTab('missing-id')).toBe(false);
		expect(state.tabs).toHaveLength(1);
	});

	it('closes the layout when the last clean tab goes (T9)', () => {
		const state = createWorkbenchState();
		const last = makeTab();
		state.addTab(last);

		expect(state.closeTab(last.id)).toBe(true);
		expect(state.tabs).toHaveLength(0);
		expect(state.layout).toBe('closed');
	});
});

describe('split width clamp', () => {
	it('clamps to the 340px floor', () => {
		expect(clampSplitWidth(100, 1440)).toBe(340);
	});

	it('clamps to containerWidth - 320', () => {
		expect(clampSplitWidth(5000, 1440)).toBe(1120);
	});

	it('pins 340 when the container cannot host both regions', () => {
		expect(clampSplitWidth(500, 600)).toBe(340);
	});

	it('routes setSplitWidth through the clamp', () => {
		const state = createWorkbenchState();
		state.setSplitWidth(5000, 1440);
		expect(state.splitWidth).toBe(1120);
	});
});

describe('effective layout', () => {
	it('honours the request on wide viewports', () => {
		expect(effectiveLayout(1440, 'split')).toBe('split');
	});

	it('degrades to focused below 1100', () => {
		expect(effectiveLayout(768, 'split')).toBe('focused');
	});

	it('stays closed whatever the viewport', () => {
		expect(effectiveLayout(768, 'closed')).toBe('closed');
	});
});

describe('active tab resolution', () => {
	it('falls back to the last tab for an unknown id', () => {
		const tabs = [makeTab(), makeTab(), makeTab()];
		expect(activeTab(tabs, 'missing-id')).toBe(tabs.at(-1));
	});

	it('returns null for no tabs', () => {
		expect(activeTab([], null)).toBeNull();
	});

	it('finds the active tab by id', () => {
		const tabs = [makeTab(), makeTab()];
		expect(activeTab(tabs, tabs[0].id)).toBe(tabs[0]);
	});
});
