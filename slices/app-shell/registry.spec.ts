import { describe, expect, it } from 'vitest';
import { t } from '$features/placeholders';
import { DESTINATIONS, getDestination, isDestinationId } from './registry';
import type { AreaId } from './types';

const AREAS: readonly AreaId[] = ['workspace', 'capabilities', 'settings'];

describe('destination registry', () => {
	it('keeps ids unique', () => {
		const ids = DESTINATIONS.map((item) => item.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('resolves known and unknown ids', () => {
		expect(getDestination('does-not-exist')).toBeUndefined();
		expect(isDestinationId('does-not-exist')).toBe(false);
		expect(isDestinationId(DESTINATIONS[0].id)).toBe(true);
	});

	it('describes every destination fully', () => {
		for (const destination of DESTINATIONS) {
			expect(destination.route.startsWith('/')).toBe(true);
			expect(AREAS).toContain(destination.area);
			expect(t(destination.labelKey)).not.toMatch(/[{}]/);
		}
	});

	it('ships exactly the three MVP areas, in order', () => {
		expect(DESTINATIONS).toHaveLength(3);
		expect(DESTINATIONS.map((item) => item.area)).toEqual([
			'workspace',
			'capabilities',
			'settings'
		]);
	});
});
