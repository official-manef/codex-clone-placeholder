import { expect, test } from 'vitest';
import { detectSurface } from './surface';
import {
	ALWAYS_ENABLED,
	FEATURE_ACCESS,
	defaultEnabled,
	resolveEnabled,
	isHiddenBySurface
} from '#lib/feature_access.js';

test('hosted origins are the cloud surface', () => {
	expect(detectSurface({ url: 'https://example.com/app' })).toBe('cloud');
	expect(detectSurface({ url: 'http://example.com' })).toBe('cloud');
	expect(detectSurface({ url: 'https://workspace.vercel.app/tools' })).toBe('cloud');
});

test('loopback, private-network and MagicDNS origins are local', () => {
	for (const url of [
		'http://localhost:5173',
		'http://127.0.0.1:5173/',
		'http://[::1]:5173/',
		'http://192.168.1.20:5173',
		'http://10.0.0.5/',
		'http://172.20.4.1/',
		'http://169.254.10.2/',
		'http://desktop.local/',
		'https://laptop-1.tailnet-abc.ts.net/',
		'http://[fd12:3456::1]/',
		'http://[fe80::1]/'
	]) {
		expect(detectSurface({ url }), url).toBe('local');
	}
});

test('public IPv6 is not local', () => {
	expect(detectSurface({ url: 'http://[2001:db8::1]/' })).toBe('cloud');
});

test('override wins when it names a known surface', () => {
	expect(detectSurface({ url: 'https://example.com', override: 'local' })).toBe('local');
	expect(detectSurface({ url: 'http://localhost:5173', override: 'cloud' })).toBe('cloud');
	expect(detectSurface({ url: 'https://example.com', override: 'staging' })).toBe('cloud');
	expect(detectSurface({ url: null, override: 'local' })).toBe('local');
});

test('missing or garbage URLs do not throw and fall back to cloud', () => {
	expect(detectSurface({ url: null })).toBe('cloud');
	expect(() => detectSurface({ url: 'not a url' })).not.toThrow();
	expect(detectSurface({ url: 'not a url' })).toBe('cloud');
	expect(detectSurface({ url: '' })).toBe('cloud');
});

test('every registered section and chat output has an access rule', async () => {
	const { SECTIONS, CHAT_OUTPUTS } = await import('#lib/registry.js');
	for (const view of [...SECTIONS, ...CHAT_OUTPUTS]) {
		expect(FEATURE_ACCESS[view.id], view.id).toBeTruthy();
	}
	for (const id of ALWAYS_ENABLED) expect(FEATURE_ACCESS[id], id).toBeTruthy();
});

test('defaults hide local-runtime features only on the cloud surface', () => {
	const cloud = defaultEnabled('cloud');
	expect(cloud).toContain('chat');
	expect(cloud).not.toContain('files');
	expect(cloud).not.toContain('browser');
	expect(cloud).toEqual([...new Set(cloud)].sort());
	const local = defaultEnabled('local');
	expect(local).toEqual(Object.keys(FEATURE_ACCESS).sort());
	expect(isHiddenBySurface('files', 'cloud')).toBe(true);
	expect(isHiddenBySurface('files', 'local')).toBe(false);
});

test('resolveEnabled drops unknown ids, unions always-enabled and falls back when corrupt', () => {
	const resolved = resolveEnabled(['chat', 'bogus', 'bogus', 'files', 'chat'], 'cloud');
	expect(resolved).toContain('files');
	expect(resolved).not.toContain('bogus');
	for (const id of ALWAYS_ENABLED) expect(resolved).toContain(id);
	expect(resolved).toEqual([...new Set(resolved)].sort());

	for (const corrupt of [null, undefined, 'x', {}, 7, { version: 1, enabled: ['files'] }]) {
		expect(resolveEnabled(corrupt, 'cloud'), JSON.stringify(corrupt)).toEqual(
			defaultEnabled('cloud')
		);
	}
	expect(resolveEnabled(['files', 42], 'cloud')).toEqual(defaultEnabled('cloud'));
	expect(resolveEnabled([], 'local')).toEqual([...ALWAYS_ENABLED].sort());
});
