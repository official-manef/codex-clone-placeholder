import { defaultValues } from './fields';
import type { FieldValue, SettingSection, SettingStatus } from './types';

/**
 * Settings persistence store. No backend in MVP: `setValue` marks the key dirty then saving
 * and leaves it there until `resolveSave` is called with the matching revision.
 */
export function createSettingsState() {
	const store = $state({
		query: '',
		values: defaultValues() as Record<string, FieldValue>,
		revisions: {} as Record<string, number>,
		statuses: {} as Record<string, SettingStatus>
	});

	function getValue(key: string): FieldValue {
		return store.values[key];
	}

	function getStatus(key: string): SettingStatus {
		return store.statuses[key] ?? 'clean';
	}

	return {
		get query() {
			return store.query;
		},
		setQuery(next: string): void {
			store.query = next;
		},
		get values() {
			return store.values;
		},
		getValue,
		setValue(key: string, next: FieldValue): number {
			store.values[key] = next;
			store.statuses[key] = 'dirty';
			const revision = (store.revisions[key] ?? 0) + 1;
			store.revisions[key] = revision;
			store.statuses[key] = 'saving';
			return revision;
		},
		resolveSave(key: string, revision: number, outcome: 'ok' | 'error'): 'applied' | 'ignored' {
			if (revision < (store.revisions[key] ?? 0)) return 'ignored';
			store.statuses[key] = outcome === 'ok' ? 'saved' : 'save_error';
			return 'applied';
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
