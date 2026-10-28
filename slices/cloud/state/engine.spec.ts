import { describe, expect, it } from 'vitest';
import { engineAvailability, ENGINE_LABEL } from './engine';

describe('engine availability', () => {
	it('always allows local, even with nothing configured', () => {
		const result = engineAvailability({ hasDevice: false, hasCredential: false, signedIn: false });
		expect(result.local).toBe(true);
		expect(result.device).toBe(false);
		expect(result.cloud).toBe(false);
	});

	it('names why device and cloud are unavailable', () => {
		const result = engineAvailability({ hasDevice: false, hasCredential: false, signedIn: false });
		expect(result.reason.device).toContain('Pair a device');
		expect(result.reason.cloud).toContain('Sign in');
	});

	it('cloud needs both a session and a credential, not just one', () => {
		expect(
			engineAvailability({ hasDevice: false, hasCredential: true, signedIn: false }).cloud
		).toBe(false);
		expect(
			engineAvailability({ hasDevice: false, hasCredential: false, signedIn: true }).cloud
		).toBe(false);
		expect(
			engineAvailability({ hasDevice: false, hasCredential: true, signedIn: true }).cloud
		).toBe(true);
	});

	it('clears a reason once the requirement is met', () => {
		const result = engineAvailability({ hasDevice: true, hasCredential: true, signedIn: true });
		expect(result.reason.device).toBeNull();
		expect(result.reason.cloud).toBeNull();
		expect(result.device).toBe(true);
	});

	it('labels every engine', () => {
		expect(Object.keys(ENGINE_LABEL).sort()).toEqual(['cloud', 'device', 'local']);
	});
});
