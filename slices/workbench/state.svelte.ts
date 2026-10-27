import type { CloseDecision, Tab, WorkbenchLayout } from './types';

const MIN_WIDTH = 340;
const PRIMARY_MIN_WIDTH = 320;

/** Clamp to [340, containerWidth - 320]; a container too narrow for both regions pins 340. */
export function clampSplitWidth(requested: number, containerWidth: number): number {
	if (containerWidth < MIN_WIDTH + PRIMARY_MIN_WIDTH) return MIN_WIDTH;
	return Math.min(Math.max(requested, MIN_WIDTH), containerWidth - PRIMARY_MIN_WIDTH);
}

/** Requested layout survives a narrow viewport; only the derived layout degrades (T19). */
export function effectiveLayout(
	viewportWidth: number,
	requested: WorkbenchLayout
): WorkbenchLayout {
	if (viewportWidth >= 1100) return requested;
	return requested === 'closed' ? 'closed' : 'focused';
}

/** Active tab, else the most recent one, else none. */
export function activeTab(tabs: readonly Tab[], activeTabId: string | null): Tab | null {
	return tabs.find((tab) => tab.id === activeTabId) ?? tabs.at(-1) ?? null;
}

export type WorkbenchState = {
	readonly layout: WorkbenchLayout;
	setLayout(next: WorkbenchLayout): void;
	readonly tabs: Tab[];
	readonly activeTabId: string | null;
	addTab(tab: Tab): void;
	activateTab(id: string): void;
	/** Returns false when a dirty tab still needs a keep/discard/cancel decision (T10). */
	closeTab(id: string, decision?: CloseDecision): boolean;
	/** AC09: attempt to persist a dirty tab. Resolves 'saved' or 'failed'; failure keeps tab.dirty. */
	commitTab(id: string): Promise<'saved' | 'failed'>;
	/** Marks a tab dirty from a local edit (the browser test needs a way in). */
	markDirty(id: string, dirty?: boolean): void;
	readonly splitWidth: number;
	setSplitWidth(next: number, containerWidth: number): void;
	/** Hide is independent of layout: hiding keeps tabs and the active tab (AC08). */
	readonly hidden: boolean;
	toggleHidden(): void;
};

export type WorkbenchStateOptions = {
	/** Test hook for AC09: which outcome `commitTab` produces. Defaults to 'saved'. */
	saveOutcome?: 'saved' | 'failed';
};

// ponytail: local-only save delay; replace with the real persistence call when a backend exists.
const SAVE_DELAY_MS = 10;

export function createWorkbenchState(options: WorkbenchStateOptions = {}): WorkbenchState {
	const saveOutcome = options.saveOutcome ?? 'saved';
	let layout = $state<WorkbenchLayout>('split');
	let hidden = $state(false);
	const tabs = $state<Tab[]>([]);
	let activeTabId = $state<string | null>(null);
	let splitWidth = $state(MIN_WIDTH);

	return {
		get layout() {
			return layout;
		},
		setLayout(next) {
			layout = next;
		},
		get tabs() {
			return tabs;
		},
		get activeTabId() {
			return activeTabId;
		},
		addTab(tab) {
			tabs.push(tab);
			activeTabId = tab.id;
		},
		activateTab(id) {
			const target = tabs.find((tab) => tab.id === id);
			if (!target) return;
			target.lastFocusedAt = Date.now();
			activeTabId = id;
		},
		closeTab(id, decision) {
			const index = tabs.findIndex((tab) => tab.id === id);
			if (index < 0) return false;
			const tab = tabs[index];
			// AC09: a dirty tab after a failed save (status 'error') still hits the dirty guard
			// below, so a bare closeTab(id) can never silently close it.
			// "keep" is not a close: it clears the dirty flag and leaves the tab open.
			if (decision === 'keep') {
				tab.dirty = false;
				return false;
			}
			if (tab.dirty && (decision === undefined || decision === 'cancel')) return false;
			tabs.splice(index, 1);
			if (tabs.length === 0) {
				layout = 'closed';
				activeTabId = null;
			} else if (activeTabId === id) {
				activeTabId = tabs[Math.min(index, tabs.length - 1)].id;
			}
			return true;
		},
		async commitTab(id) {
			const tab = tabs.find((candidate) => candidate.id === id);
			if (!tab) return 'failed';
			tab.status = 'loading';
			tab.error = null;
			await new Promise((resolve) => setTimeout(resolve, SAVE_DELAY_MS));
			if (saveOutcome === 'failed') {
				tab.dirty = true;
				tab.status = 'error';
				tab.error = { code: 'save_failed', messageKey: 'settings_save_error' };
				return 'failed';
			}
			tab.dirty = false;
			tab.status = 'ready';
			tab.error = null;
			return 'saved';
		},
		markDirty(id, dirty = true) {
			const tab = tabs.find((candidate) => candidate.id === id);
			if (!tab) return;
			tab.dirty = dirty;
		},
		get splitWidth() {
			return splitWidth;
		},
		setSplitWidth(next, containerWidth) {
			splitWidth = clampSplitWidth(next, containerWidth);
		},
		get hidden() {
			return hidden;
		},
		toggleHidden() {
			hidden = !hidden;
		}
	};
}
