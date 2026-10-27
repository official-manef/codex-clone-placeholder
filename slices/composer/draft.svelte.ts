import { SvelteMap } from 'svelte/reactivity';

/**
 * Draft text keyed by `draftKey`. In-memory map is the source of truth; a Storage
 * (sessionStorage) is a best-effort mirror so a reload restores text (AC07, AC14).
 * Every storage call is guarded: private mode and SSR have no usable Storage.
 */
export function createDraftStore(storage?: Storage | null) {
	const memory = new SvelteMap<string, string>();
	const key = (draftKey: string) => `draft:${draftKey}`;

	function read(draftKey: string): string {
		const cached = memory.get(draftKey);
		if (cached !== undefined) return cached;
		if (!storage) return '';
		try {
			return storage.getItem(key(draftKey)) ?? '';
		} catch {
			return '';
		}
	}

	return {
		get(draftKey: string): string {
			return read(draftKey);
		},
		setValue(draftKey: string, value: string): void {
			memory.set(draftKey, value);
			if (!storage) return;
			try {
				storage.setItem(key(draftKey), value);
			} catch {
				// Private mode / quota: memory still holds the value for this session.
			}
		},
		clear(draftKey: string): void {
			memory.delete(draftKey);
			if (!storage) return;
			try {
				storage.removeItem(key(draftKey));
			} catch {
				// Nothing to recover: memory is already authoritative.
			}
		}
	};
}

/** SSR-safe default for the barrel; the component builds its own from sessionStorage. */
export const draftStore = createDraftStore(null);
