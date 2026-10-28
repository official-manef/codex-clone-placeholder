import { expect, test } from 'vitest';
import { normalizeEndpoint } from './endpoint';

test('accepts a bare http or https origin', () => {
	expect(normalizeEndpoint('http://127.0.0.1:8649')).toBe('http://127.0.0.1:8649');
	expect(normalizeEndpoint('https://bridge.example.com')).toBe('https://bridge.example.com');
	expect(normalizeEndpoint('  https://box.tailnet-abc.ts.net/  ')).toBe(
		'https://box.tailnet-abc.ts.net'
	);
});

test('rejects credentials, query, fragment, path and other schemes', () => {
	for (const input of [
		'http://user:pass@127.0.0.1:8649',
		'http://user@127.0.0.1:8649',
		'http://127.0.0.1:8649/?token=abc',
		'http://127.0.0.1:8649/#fragment',
		'http://127.0.0.1:8649/v1/health',
		'ws://127.0.0.1:8649',
		'file:///etc/passwd',
		'127.0.0.1:8649',
		'not a url',
		'',
		'   '
	]) {
		expect(normalizeEndpoint(input), input).toBeNull();
	}
});

test('rejects a non-string and an over-long value', () => {
	expect(normalizeEndpoint(undefined)).toBeNull();
	expect(normalizeEndpoint(42)).toBeNull();
	expect(normalizeEndpoint({ origin: 'http://127.0.0.1:8649' })).toBeNull();
	expect(normalizeEndpoint(`https://example.com/${'a'.repeat(3000)}`)).toBeNull();
});
