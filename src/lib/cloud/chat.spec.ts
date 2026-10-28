import { describe, expect, it } from 'vitest';
import { cloudAvailable, cloudTurn, configureCloudChat } from './chat';

describe('cloud chat adapter', () => {
	it('reports unavailable before a deployment is wired, and says local still works', async () => {
		configureCloudChat(null);
		expect(cloudAvailable()).toBe(false);
		const result = await cloudTurn({
			ref: 'openrouter/x',
			messages: [{ role: 'user', content: 'hi' }]
		});
		expect(result).toMatchObject({ ok: false, code: 'unsupported' });
		if (!result.ok) expect(result.message).toContain('Local mode still works');
	});

	it('returns the provider answer once wired', async () => {
		configureCloudChat(async () => ({ text: 'hello', provider: 'openrouter', model: 'x' }));
		expect(cloudAvailable()).toBe(true);
		await expect(
			cloudTurn({ ref: 'openrouter/x', messages: [{ role: 'user', content: 'hi' }] })
		).resolves.toEqual({ ok: true, text: 'hello', provider: 'openrouter', model: 'x' });
	});

	it('maps a typed ConvexError payload to a code instead of leaking the throw', async () => {
		// ConvexError reaches the client as an object with a `data` payload; model that shape
		// with a real Error that carries the field, not a bare thrown literal.
		configureCloudChat(async () => {
			const failure = new Error('no credential') as Error & { data: unknown };
			failure.data = { code: 'no_credential', message: 'No key is connected for openrouter.' };
			throw failure;
		});
		const result = await cloudTurn({ ref: 'openrouter/x', messages: [] });
		expect(result).toEqual({
			ok: false,
			code: 'no_credential',
			message: 'No key is connected for openrouter.'
		});
	});

	it('falls back to provider_error for an untyped failure', async () => {
		configureCloudChat(async () => {
			throw new Error('boom');
		});
		const result = await cloudTurn({ ref: 'openrouter/x', messages: [] });
		expect(result).toMatchObject({ ok: false, code: 'provider_error', message: 'boom' });
	});

	it('restores the unconfigured state', async () => {
		configureCloudChat(async () => ({ text: 'a', provider: 'p', model: 'm' }));
		configureCloudChat(null);
		expect(cloudAvailable()).toBe(false);
	});
});
