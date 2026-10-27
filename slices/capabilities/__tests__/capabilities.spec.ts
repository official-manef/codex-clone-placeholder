import { describe, expect, it } from 'vitest';
import { CAPABILITIES, createCapabilitiesState, getCapability, groupCapabilities } from '../index';

const ids = Array.from({ length: 16 }, (_, i) => `capability_${String(i + 1).padStart(2, '0')}`);

/** Let the optimistic transition flush (microtask in the MVP adapter). */
function settle(): Promise<void> {
	return Promise.resolve();
}

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

	it('connects on success and fails on failure', async () => {
		const state = createCapabilitiesState();
		state.toggleConnection('capability_01', 'success');
		await settle();
		expect(state.getConnection('capability_01')).toBe('connected');

		const other = createCapabilitiesState();
		other.toggleConnection('capability_01', 'failure');
		await settle();
		expect(other.getConnection('capability_01')).toBe('failed');

		// retry from failed resolves to connected
		other.toggleConnection('capability_01', 'success');
		await settle();
		expect(other.getConnection('capability_01')).toBe('connected');

		// disconnect succeeds back to not_connected
		other.toggleConnection('capability_01', 'success');
		await settle();
		expect(other.getConnection('capability_01')).toBe('not_connected');
	});

	it('ignores a second toggle while the first is pending', async () => {
		const state = createCapabilitiesState();
		state.toggleConnection('capability_02', 'success');
		expect(state.pendingId).toBe('capability_02');
		expect(state.getConnection('capability_02')).toBe('pending');

		state.toggleConnection('capability_02', 'failure');
		expect(state.pendingId).toBe('capability_02');

		await settle();
		expect(state.pendingId).toBeNull();
		expect(state.getConnection('capability_02')).toBe('connected');
	});

	it('clears the pending marker after resolution', async () => {
		const state = createCapabilitiesState();
		state.toggleConnection('capability_03', 'success');
		await settle();
		expect(state.pendingId).toBeNull();
	});

	it('selects a capability (T17)', () => {
		const state = createCapabilitiesState();
		state.select('capability_04');
		expect(state.selectedId).toBe('capability_04');
	});
});
