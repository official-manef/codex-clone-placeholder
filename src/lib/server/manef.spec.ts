import { expect, test } from 'vitest';
import { FORWARDABLE, hubBase, hubConfigured } from './manef';

test('only loopback http origins are accepted as a hub', () => {
	expect(hubBase('http://127.0.0.1:3210')?.host).toBe('127.0.0.1:3210');
	expect(hubBase('http://localhost:3210')?.host).toBe('localhost:3210');
	expect(hubBase('http://[::1]:3210')?.host).toBe('[::1]:3210');
});

test('the bridge cannot be pointed at another host or scheme', () => {
	for (const value of [
		undefined,
		'',
		'not a url',
		'https://127.0.0.1:3210',
		'http://hub.example:3210',
		'http://10.0.0.5:3210',
		'http://192.168.1.20:3210',
		'http://127.0.0.1.example.com:3210',
		'http://user:pass@127.0.0.1:3210',
		'http://127.0.0.1:3210/api',
		'http://127.0.0.1:3210/?x=1',
		'http://127.0.0.1:3210/#frag',
		'file:///tmp/hub'
	])
		expect(hubBase(value), String(value)).toBeNull();
});

test('configured is exactly "parseable loopback base"', () => {
	expect(hubConfigured('http://127.0.0.1:3210')).toBe(true);
	expect(hubConfigured('http://example.com')).toBe(false);
	expect(hubConfigured(undefined)).toBe(false);
});

test('the forwardable path list is closed', () => {
	// The three hub routes the bridge exists for; `/ready` answers 503 by design.
	expect(FORWARDABLE.has('/api/modules')).toBe(true);
	expect(FORWARDABLE.has('/ready')).toBe(true);
	expect(FORWARDABLE.has('/api/plan')).toBe(true);
	for (const path of [
		'/health',
		'/api/example',
		'/api/modules/../../etc/passwd',
		'/api/plan/extra',
		'/',
		'//evil.example/api/modules'
	])
		expect(FORWARDABLE.has(path), path).toBe(false);
});
