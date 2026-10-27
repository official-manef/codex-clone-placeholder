import { defaultValues, getField } from './fields';
import type { FieldValue, SettingSection, SettingStatus } from './types';

/** Every settings key lives under this prefix; no other slice may write into it. */
export const SETTINGS_STORAGE_PREFIX = 'settings:';

/**
 * Settings persistence store. No backend in MVP: `setValue` marks the key dirty then saving,
 * `commit` resolves that revision after a local delay, `resolveSave` applies only the newest
 * revision (race 2 / T15). With a `Storage` passed, committed values are written through and
 * hydrated lazily on the first read of each key as `clean`.
 */
export function createSettingsState(storage: Storage | null = null) {
	const store = $state({
		query: '',
		values: defaultValues() as Record<string, FieldValue>,
		revisions: {} as Record<string, number>,
		statuses: {} as Record<string, SettingStatus>
	});

	/** Keys already looked up in storage; a miss is remembered so we do not re-read. */
	const hydrated: Record<string, true> = {};

	function hydrate(key: string): void {
		if (hydrated[key]) return;
		hydrated[key] = true;
		if (!storage) return;
		let raw: string | null;
		try {
			raw = storage.getItem(SETTINGS_STORAGE_PREFIX + key);
		} catch {
			return; // storage blocked (private mode): stay in memory
		}
		if (raw === null) return;
		let parsed: unknown;
		try {
			parsed = JSON.parse(raw);
		} catch {
			return; // corrupt entry: keep the default rather than trusting it
		}
		const field = getField(key);
		if (!field) return;
		const wellTyped =
			typeof parsed === typeof field.defaultValue &&
			(typeof parsed === 'boolean' || typeof parsed === 'string');
		if (!wellTyped) return;
		store.values[key] = parsed as FieldValue;
		// Restored values are not edits: no revision, no dirty/saving status.
	}

	function persist(key: string): void {
		if (!storage) return;
		try {
			storage.setItem(SETTINGS_STORAGE_PREFIX + key, JSON.stringify(store.values[key]));
		} catch {
			// quota or blocked storage: the in-memory value still wins for this session
		}
	}

	function getValue(key: string): FieldValue {
		hydrate(key);
		return store.values[key];
	}

	function getStatus(key: string): SettingStatus {
		hydrate(key);
		return store.statuses[key] ?? 'clean';
	}

	function resolveSave(
		key: string,
		revision: number,
		outcome: 'ok' | 'error'
	): 'applied' | 'ignored' {
		if (revision < (store.revisions[key] ?? 0)) return 'ignored';
		store.statuses[key] = outcome === 'ok' ? 'saved' : 'save_error';
		return 'applied';
	}

	return {
		get query() {
			return store.query;
		},
		setQuery(next: string): void {
			store.query = next;
		},
		get values() {
			for (const key of Object.keys(store.values)) hydrate(key);
			return store.values;
		},
		getValue,
		setValue(key: string, next: FieldValue): number {
			hydrate(key); // a stored value must never clobber the user's edit on first read
			store.values[key] = next;
			store.statuses[key] = 'dirty';
			const revision = (store.revisions[key] ?? 0) + 1;
			store.revisions[key] = revision;
			store.statuses[key] = 'saving';
			return revision;
		},
		resolveSave,
		/**
		 * Stub save: resolves after a local delay; the later revision always wins (race 2 / T15).
		 * A key with no revision has nothing to save: returns `'save_error'` and leaves the
		 * status untouched (never downgrades a clean key).
		 */
		async commit(key: string): Promise<'applied' | 'ignored' | 'save_error'> {
			const revision = store.revisions[key];
			if (revision === undefined) return 'save_error';
			// ponytail: local stand-in for network jitter — the delay shrinks as the revision
			// grows, so the older save resolves last and the stale-write race is observable.
			// Swap for a real transport when settings become backend-owned.
			const delay = Math.max(40, 240 - 60 * revision);
			await new Promise<void>((resolve) => {
				setTimeout(resolve, delay);
			});
			const result = resolveSave(key, revision, 'ok');
			if (result === 'applied') persist(key);
			return result;
		},
		getStatus,
		filterSections(sections: readonly SettingSection[]): {
			matches: SettingSection[];
			empty: boolean;
			noMatch: boolean;
		} {
			const query = store.query.trim().toLowerCase();
			const matches = query
				? sections.filter((section) => section.id.toLowerCase().includes(query))
				: [...sections];
			return {
				matches,
				empty: sections.length === 0,
				noMatch: sections.length > 0 && matches.length === 0
			};
		}
	};
}

export type SettingsState = ReturnType<typeof createSettingsState>;
