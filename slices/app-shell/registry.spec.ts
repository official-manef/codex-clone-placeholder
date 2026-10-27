import { describe, expect, it } from 'vitest';
import { DESTINATIONS, getDestination, isDestinationId } from './registry';

describe('destination registry', () => {
	it('keeps ids unique', () => {
		const ids = DESTINATIONS.map((item) => item.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('resolves known and unknown ids', () => {
		expect(getDestination('does-not-exist')).toBeUndefined();
		expect(isDestinationId('does-not-exist')).toBe(false);
	});
});
