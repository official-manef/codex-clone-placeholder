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
	isSectionId
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
