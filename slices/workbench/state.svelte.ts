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
	readonly splitWidth: number;
	setSplitWidth(next: number, containerWidth: number): void;
};

export function createWorkbenchState(): WorkbenchState {
	let layout = $state<WorkbenchLayout>('split');
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
		get splitWidth() {
			return splitWidth;
		},
		setSplitWidth(next, containerWidth) {
			splitWidth = clampSplitWidth(next, containerWidth);
		}
	};
}
