import type { Mode, TimelineEntry } from './types';

/** D04 `populated` derivation: a known chat or any timeline entry populates the region. */
export function derivePopulated(chatId: string | null, entryCount: number): boolean {
	return chatId !== null || entryCount > 0;
}

/** AC17: the reading anchor stays at the last user scroll offset, never above the threshold. */
export function firstVisibleAnchor(scrollTop: number, threshold: number): number {
	return scrollTop > threshold ? scrollTop : 0;
}

export function createWorkspaceState(chatId: string | null) {
	let mode = $state<Mode>('chat');
	let populated = $state(derivePopulated(chatId, 0));
	let activeObjectId = $state<string | null>(chatId);
	let contextSummary = $state<'shown' | 'hidden'>('hidden');
	let scrollAnchor = $state(0);
	const entries = $state<TimelineEntry[]>([]);

	return {
		get mode(): Mode {
			return mode;
		},
		/** T3: mode changes never touch the draft (owned by the composer draft key). */
		setMode(next: Mode) {
			mode = next;
		},
		get populated(): boolean {
			return populated;
		},
		setPopulated(next: boolean) {
			populated = next;
		},
		get activeObjectId(): string | null {
			return activeObjectId;
		},
		/** T2: selecting an object keeps the mode and the context summary untouched. */
		selectObject(id: string | null) {
			activeObjectId = id;
		},
		get contextSummary(): 'shown' | 'hidden' {
			return contextSummary;
		},
		toggleContextSummary() {
			contextSummary = contextSummary === 'shown' ? 'hidden' : 'shown';
		},
		get scrollAnchor(): number {
			return scrollAnchor;
		},
		setScrollAnchor(next: number) {
			scrollAnchor = next > 0 ? next : 0;
		},
		get entries(): TimelineEntry[] {
			return entries;
		},
		/** AC04 parity: an id appends once, even when a retry re-sends the same request. */
		appendEntry(entry: TimelineEntry) {
			if (entries.some((existing) => existing.id === entry.id)) return;
			entries.push(entry);
		}
	};
}
