import { describe, expect, it } from 'vitest';
import {
	FIELDS,
	SECTIONS,
	createSettingsState,
	defaultValues,
	FIRST_SECTION_ID,
	getField,
	getSection,
	groupSections,
	isSectionId,
	SETTINGS_STORAGE_PREFIX
} from '../index';
import { FIELDS_BY_KEY } from '../fields';

describe('settings section registry', () => {
	it('declares 27 unique sections in 16/6/5 groups', () => {
		expect(SECTIONS).toHaveLength(27);
		const groups = groupSections();
		expect(groups.configuration).toHaveLength(16);
		expect(groups.integration).toHaveLength(6);
		expect(groups.advanced).toHaveLength(5);
		expect(new Set(SECTIONS.map((section) => section.id)).size).toBe(27);
		expect(isSectionId(FIRST_SECTION_ID)).toBe(true);
		expect(isSectionId('nope')).toBe(false);
	});

	it('resolves the first section and rejects unknown ids', () => {
		expect(getSection(FIRST_SECTION_ID)?.id).toBe(FIRST_SECTION_ID);
		expect(getSection('nope')).toBeUndefined();
	});

	it('gives every section 2-4 existing field keys', () => {
		for (const section of SECTIONS) {
			expect(section.fieldKeys.length).toBeGreaterThanOrEqual(2);
			expect(section.fieldKeys.length).toBeLessThanOrEqual(4);
			for (const key of section.fieldKeys) expect(FIELDS_BY_KEY.has(key)).toBe(true);
		}
	});

	it('covers every field key exactly once in the default values', () => {
		const keys = FIELDS.map((field) => field.key);
		expect(new Set(keys).size).toBe(keys.length);
		expect(Object.keys(defaultValues()).sort()).toEqual([...keys].sort());
		expect(getField('boolean_field_01')?.type).toBe('toggle');
	});
});

describe('settings persistence', () => {
	it('ignores a stale save resolution (AC12)', () => {
		const state = createSettingsState();
		const key = 'boolean_field_01';

		const first = state.setValue(key, true);
		const second = state.setValue(key, false);
		expect(second).toBeGreaterThan(first);
		expect(state.getStatus(key)).toBe('saving');

		expect(state.resolveSave(key, first, 'ok')).toBe('ignored');
		expect(state.getValue(key)).toBe(false);
		expect(state.getStatus(key)).toBe('saving');

		expect(state.resolveSave(key, second, 'ok')).toBe('applied');
		expect(state.getStatus(key)).toBe('saved');
	});

	it('marks a failed save with the same staleness check', () => {
		const state = createSettingsState();
		const key = 'path_field_01';

		const first = state.setValue(key, 'alpha');
		expect(state.resolveSave(key, first, 'error')).toBe('applied');
		expect(state.getStatus(key)).toBe('save_error');

		const second = state.setValue(key, 'beta');
		expect(state.resolveSave(key, first, 'error')).toBe('ignored');
		expect(state.getStatus(key)).toBe('saving');
		expect(state.resolveSave(key, second, 'ok')).toBe('applied');
		expect(state.getValue(key)).toBe('beta');
	});

	it('lets the newest of two overlapping commits win (AC12)', async () => {
		const state = createSettingsState();
		const key = 'boolean_field_01';

		state.setValue(key, true);
		const first = state.commit(key);
		state.setValue(key, false);
		const second = state.commit(key);

		// The older revision is the one that resolves last, so the race is observable.
		expect(await second).toBe('applied');
		expect(await first).toBe('ignored');
		expect(state.getValue(key)).toBe(false);
		expect(state.getStatus(key)).toBe('saved');
	});

	it('reports a save error when committing a key that was never changed', async () => {
		const state = createSettingsState();
		expect(await state.commit('boolean_field_01')).toBe('save_error');
		expect(state.getStatus('boolean_field_01')).toBe('clean');
	});
});

/** Minimal `Storage` over a `Map`, so the persistence path is testable without a browser. */
function memoryStorage(): Storage & { data: Map<string, string> } {
	const data = new Map<string, string>();
	return {
		data,
		get length() {
			return data.size;
		},
		clear: () => data.clear(),
		getItem: (key: string) => data.get(key) ?? null,
		key: (index: number) => [...data.keys()][index] ?? null,
		removeItem: (key: string) => void data.delete(key),
		setItem: (key: string, value: string) => void data.set(key, value)
	};
}

describe('settings persistence to session storage (AC14)', () => {
	it('hydrates a committed value into a fresh state as clean, not dirty', async () => {
		const storage = memoryStorage();
		const key = 'path_field_01';

		const first = createSettingsState(storage);
		first.setValue(key, '/somewhere');
		expect(await first.commit(key)).toBe('applied');
		expect(storage.data.get(SETTINGS_STORAGE_PREFIX + key)).toBe('"/somewhere"');

		const restored = createSettingsState(storage);
		expect(restored.getValue(key)).toBe('/somewhere');
		expect(restored.getStatus(key)).toBe('clean');
	});

	it('keeps the default when storage is empty and survives a throwing storage', () => {
		const empty = memoryStorage();
		expect(createSettingsState(empty).getValue('boolean_field_01')).toBe(false);

		const hostile = memoryStorage();
		hostile.getItem = () => {
			throw new Error('blocked');
		};
		hostile.setItem = () => {
			throw new Error('blocked');
		};
		const state = createSettingsState(hostile);
		state.setValue('boolean_field_01', true);
		expect(state.getValue('boolean_field_01')).toBe(true);
	});

	it('never touches storage keys outside the settings prefix', async () => {
		const storage = memoryStorage();
		const state = createSettingsState(storage);
		state.setValue('boolean_field_01', true);
		await state.commit('boolean_field_01');
		expect([...storage.data.keys()]).toEqual([SETTINGS_STORAGE_PREFIX + 'boolean_field_01']);
	});
});

describe('settings category search', () => {
	it('separates an empty list from a search with no match (AC15)', () => {
		const state = createSettingsState();

		const empty = state.filterSections([]);
		expect(empty).toEqual({ matches: [], empty: true, noMatch: false });

		state.setQuery('zzz');
		const noMatch = state.filterSections(SECTIONS);
		expect(noMatch.matches).toEqual([]);
		expect(noMatch.empty).toBe(false);
		expect(noMatch.noMatch).toBe(true);

		state.setQuery('advanced');
		expect(state.filterSections(SECTIONS).matches).toHaveLength(5);
	});
});
