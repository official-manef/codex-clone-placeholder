import type { CloseDecision, Tab, WorkbenchLayout } from './types';

const MIN_WIDTH = 340;
const PRIMARY_MIN_WIDTH = 320;
const DEFAULT_STORAGE_KEY = 'workbench:tabs';

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
	/** True when the creation read a stored snapshot, so the host can skip its defaults. */
	readonly restored: boolean;
};

export type WorkbenchStateOptions = {
	/** Test hook for AC09: which outcome `commitTab` produces. Defaults to 'saved'. */
	saveOutcome?: 'saved' | 'failed';
	/** A Storage (sessionStorage) makes the workbench survive a route round trip (AC14). */
	storage?: Storage | null;
	storageKey?: string;
};

// ponytail: local-only save delay; replace with the real persistence call when a backend exists.
const SAVE_DELAY_MS = 10;

const LAYOUTS: readonly WorkbenchLayout[] = ['closed', 'split', 'focused'];
const TAB_KINDS: readonly Tab['kind'][] = ['browser', 'document', 'file_preview', 'tool', 'review'];
const TAB_STATUSES: readonly Tab['status'][] = ['idle', 'loading', 'ready', 'error'];

type Snapshot = {
	tabs: Tab[];
	activeTabId: string | null;
	layout: WorkbenchLayout;
	hidden: boolean;
	splitWidth: number;
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Rebuilds one tab from storage; a malformed tab is dropped rather than rendered half-broken. */
function restoreTab(value: unknown): Tab | null {
	if (!value || typeof value !== 'object') return null;
	const tab = value as Partial<Tab>;
	if (typeof tab.id !== 'string' || typeof tab.titleKey !== 'string') return null;
	const error =
		tab.error && typeof tab.error === 'object' && typeof tab.error.messageKey === 'string'
			? { code: String(tab.error.code ?? ''), messageKey: tab.error.messageKey }
			: null;
	return {
		id: tab.id,
		kind: oneOf(tab.kind, TAB_KINDS, 'browser'),
		titleKey: tab.titleKey,
		resourceId: typeof tab.resourceId === 'string' ? tab.resourceId : null,
		status: oneOf(tab.status, TAB_STATUSES, 'idle'),
		// AC14: dirty is a local edit flag; it survives exactly as it was written.
		dirty: tab.dirty === true,
		ownerChatId: typeof tab.ownerChatId === 'string' ? tab.ownerChatId : null,
		lastFocusedAt:
			typeof tab.lastFocusedAt === 'number' && Number.isFinite(tab.lastFocusedAt)
				? tab.lastFocusedAt
				: Date.now(),
		error
	};
}

function restoreSnapshot(raw: string | null): Snapshot | null {
	if (!raw) return null;
	const parsed = JSON.parse(raw) as Partial<Snapshot>;
	if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tabs)) {
		throw new Error('workbench snapshot: missing tabs');
	}
	const tabs = parsed.tabs.map(restoreTab).filter((tab): tab is Tab => tab !== null);
	return {
		tabs,
		activeTabId: typeof parsed.activeTabId === 'string' ? parsed.activeTabId : null,
		layout: oneOf(parsed.layout, LAYOUTS, 'closed'),
		hidden: parsed.hidden === true,
		splitWidth:
			typeof parsed.splitWidth === 'number' && Number.isFinite(parsed.splitWidth)
				? parsed.splitWidth
				: MIN_WIDTH
	};
}

export function createWorkbenchState(options: WorkbenchStateOptions = {}): WorkbenchState {
	const saveOutcome = options.saveOutcome ?? 'saved';
	const storage = options.storage ?? null;
	const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

	let restored: Snapshot | null = null;
	if (storage) {
		try {
			restored = restoreSnapshot(storage.getItem(storageKey));
		} catch {
			// A corrupt payload never throws out of creation: fall back to defaults, and the
			// first mutation overwrites the bad value.
			restored = null;
		}
	}

	// C2 owns the cold scene: no secondary region until the user opens it (T8). A restored
	// snapshot keeps whatever layout the user chose.
	let layout = $state<WorkbenchLayout>(restored?.layout ?? 'closed');
	let hidden = $state(restored?.hidden ?? false);
	const tabs = $state<Tab[]>(restored?.tabs ?? []);
	let activeTabId = $state<string | null>(restored?.activeTabId ?? null);
	let splitWidth = $state(restored?.splitWidth ?? MIN_WIDTH);
	/** Write-through mirror; a throwing Storage (private mode, quota) never breaks a mutation. */
	function persist(): void {
		if (!storage) return;
		try {
			storage.setItem(
				storageKey,
				JSON.stringify({
					tabs,
					activeTabId,
					layout,
					hidden,
					splitWidth
				} satisfies Snapshot)
			);
		} catch {
			// Memory stays authoritative for this session.
		}
	}

	return {
		get restored() {
			return restored !== null;
		},
		get layout() {
			return layout;
		},
		setLayout(next) {
			layout = next;
			persist();
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
			persist();
		},
		activateTab(id) {
			const target = tabs.find((tab) => tab.id === id);
			if (!target) return;
			target.lastFocusedAt = Date.now();
			activeTabId = id;
			persist();
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
				persist();
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
			persist();
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
				persist();
				return 'failed';
			}
			tab.dirty = false;
			tab.status = 'ready';
			tab.error = null;
			persist();
			return 'saved';
		},
		markDirty(id, dirty = true) {
			const tab = tabs.find((candidate) => candidate.id === id);
			if (!tab) return;
			tab.dirty = dirty;
			persist();
		},
		get splitWidth() {
			return splitWidth;
		},
		setSplitWidth(next, containerWidth) {
			splitWidth = clampSplitWidth(next, containerWidth);
			persist();
		},
		get hidden() {
			return hidden;
		},
		toggleHidden() {
			hidden = !hidden;
			persist();
		}
	};
}
