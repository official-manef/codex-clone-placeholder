import { expect, test } from 'vitest';
import { classifyEndpoint, displayEndpoint } from './endpoint';

test('loopback is loopback over http and https', () => {
	for (const input of [
		'http://localhost:8649',
		'http://127.0.0.1:8649/',
		'http://[::1]:8649',
		'https://localhost:8649',
		'  http://127.0.0.1:8649  '
	]) {
		const result = classifyEndpoint(input);
		expect(result.kind, input).toBe('loopback');
		expect(result.reason, input).toBeNull();
	}
	expect(classifyEndpoint('http://127.0.0.1:8649').origin).toBe('http://127.0.0.1:8649');
});

test('private IPv4 and .local are lan', () => {
	for (const input of [
		'http://10.0.0.5:8649',
		'http://172.16.0.1:8649',
		'http://172.31.255.254:8649',
		'http://192.168.1.20:8649',
		'http://169.254.10.2:8649',
		'http://desktop.local:8649'
	]) {
		expect(classifyEndpoint(input).kind, input).toBe('lan');
	}
});

test('MagicDNS names and CGNAT addresses are tailscale, and plain http is allowed', () => {
	for (const input of [
		'http://laptop-1.tailnet-abc.ts.net:8649',
		'https://laptop-1.tailnet-abc.ts.net',
		'http://100.64.0.1:8649',
		'http://100.127.255.254:8649'
	]) {
		const result = classifyEndpoint(input);
		expect(result.kind, input).toBe('tailscale');
		expect(result.reason, input).toBeNull();
	}
});

test('public hosts are public over https only', () => {
	expect(classifyEndpoint('https://bridge.example.com').kind).toBe('public');
	expect(classifyEndpoint('https://203.0.113.9:8649').kind).toBe('public');
	expect(classifyEndpoint('https://100.200.0.1').kind).toBe('public');
	expect(classifyEndpoint('https://172.32.0.1').kind).toBe('public');
});

test('http on a public host is rejected with a reason', () => {
	const result = classifyEndpoint('http://bridge.example.com');
	expect(result.kind).toBe('invalid');
	expect(result.origin).toBeNull();
	expect(result.reason).toContain('https:');
});

test('userinfo, query, fragment, path and bad schemes are invalid', () => {
	for (const input of [
		'http://user:pass@127.0.0.1:8649',
		'http://user@127.0.0.1:8649',
		'http://127.0.0.1:8649/?token=abc',
		'http://127.0.0.1:8649/#frag',
		'http://127.0.0.1:8649/v1/health',
		'ws://127.0.0.1:8649',
		'ftp://127.0.0.1:8649',
		'127.0.0.1:8649',
		'not a url',
		'',
		'   '
	]) {
		const result = classifyEndpoint(input);
		expect(result.kind, input).toBe('invalid');
		expect(result.origin, input).toBeNull();
		expect(result.reason, input).toBeTruthy();
	}
});

test('over-long endpoints are invalid', () => {
	expect(classifyEndpoint(`http://127.0.0.1:8649/${'a'.repeat(3000)}`).kind).toBe('invalid');
});

test('displayEndpoint appends a short kind tag', () => {
	expect(displayEndpoint('http://127.0.0.1:8649')).toBe('http://127.0.0.1:8649 · loopback');
	expect(displayEndpoint('https://box.tailnet-abc.ts.net')).toBe(
		'https://box.tailnet-abc.ts.net · Tailscale'
	);
	expect(displayEndpoint('https://bridge.example.com')).toBe('https://bridge.example.com · public');
});
