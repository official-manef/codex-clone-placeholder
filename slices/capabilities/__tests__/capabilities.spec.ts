import { describe, expect, it } from 'vitest';
import { CAPABILITIES, createCapabilitiesState, getCapability, groupCapabilities } from '../index';

const ids = Array.from({ length: 16 }, (_, i) => `capability_${String(i + 1).padStart(2, '0')}`);

describe('capability registry', () => {
	it('declares exactly 16 unique capabilities with slug/name keys and token colours', () => {
		expect(CAPABILITIES).toHaveLength(16);
		expect(CAPABILITIES.map((c) => c.id)).toEqual(ids);
		expect(new Set(CAPABILITIES.map((c) => c.id)).size).toBe(16);
		for (const cap of CAPABILITIES) {
			expect(cap.nameKey).toBe(cap.id);
			expect(cap.color.startsWith('var(--shell-')).toBe(true);
			expect(cap.color).not.toMatch(/#[0-9a-f]{3,8}/i);
			expect(cap.group).toBe('installed');
		}
	});

	it('looks capabilities up by id', () => {
		expect(getCapability('capability_09')).toBeDefined();
		expect(getCapability('capability_09')?.id).toBe('capability_09');
		expect(getCapability('nope')).toBeUndefined();
	});

	it('groups installed and available rows', () => {
		const grouped = groupCapabilities();
		expect(grouped.installed).toHaveLength(16);
		expect(grouped.available).toHaveLength(0);
	});
});

describe('capability connection state (T17/T18)', () => {
	it('starts every capability at not_connected (AC13)', () => {
		const state = createCapabilitiesState();
		for (const id of ids) expect(state.getConnection(id)).toBe('not_connected');
	});

	it('connects on success with an observable pending phase', async () => {
		const state = createCapabilitiesState();
		const done = state.connect('capability_01', 'success');
		expect(state.pendingId).toBe('capability_01');
		expect(state.getConnection('capability_01')).toBe('pending');
		await done;
		expect(state.pendingId).toBeNull();
		expect(state.getConnection('capability_01')).toBe('connected');
	});

	it('disconnects on success from connected', async () => {
		const state = createCapabilitiesState();
		state.setConnection('capability_01', 'connected');
		await state.connect('capability_01', 'success');
		expect(state.getConnection('capability_01')).toBe('not_connected');
	});

	it('reverts a failed disconnect to connected (T18 revert)', async () => {
		const state = createCapabilitiesState();
		state.setConnection('capability_01', 'connected');
		await state.connect('capability_01', 'failure');
		expect(state.getConnection('capability_01')).toBe('connected');
		expect(state.getError('capability_01')).toBe(true);
	});

	it('keeps not_connected and flags the error on a failed connect (AC13)', async () => {
		const state = createCapabilitiesState();
		await state.connect('capability_01', 'failure');
		expect(state.getConnection('capability_01')).toBe('not_connected');
		expect(state.getError('capability_01')).toBe(true);
	});

	it('clears the error marker on the next attempt', async () => {
		const state = createCapabilitiesState();
		await state.connect('capability_01', 'failure');
		const done = state.connect('capability_01', 'success');
		expect(state.getError('capability_01')).toBe(false);
		await done;
		expect(state.getConnection('capability_01')).toBe('connected');
	});

	it('ignores a second connect while the first is pending', async () => {
		const state = createCapabilitiesState();
		const first = state.connect('capability_02', 'success');
		expect(state.pendingId).toBe('capability_02');

		await state.connect('capability_02', 'failure');
		expect(state.pendingId).toBe('capability_02');

		await first;
		expect(state.pendingId).toBeNull();
		expect(state.getConnection('capability_02')).toBe('connected');
		expect(state.getError('capability_02')).toBe(false);
	});

	it('selects a capability (T17)', () => {
		const state = createCapabilitiesState();
		state.select('capability_04');
		expect(state.selectedId).toBe('capability_04');
	});
});

describe('capability search (AC15)', () => {
	it('reports empty only for an empty input list', () => {
		const state = createCapabilitiesState();
		const result = state.filter([]);
		expect(result.matches).toHaveLength(0);
		expect(result.empty).toBe(true);
		expect(result.noMatch).toBe(false);
	});

	it('reports noMatch, not empty, when a populated list has no hit', () => {
		const state = createCapabilitiesState();
		state.setQuery('zzz');
		const result = state.filter(CAPABILITIES);
		expect(result.matches).toHaveLength(0);
		expect(result.noMatch).toBe(true);
		expect(result.empty).toBe(false);
	});

	it('matches a capability by id', () => {
		const state = createCapabilitiesState();
		state.setQuery('capability_03');
		const result = state.filter(CAPABILITIES);
		expect(result.matches.map((c) => c.id)).toEqual(['capability_03']);
		expect(result.noMatch).toBe(false);
		expect(result.empty).toBe(false);
	});
});
