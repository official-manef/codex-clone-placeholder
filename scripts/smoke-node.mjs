import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';

const origin = 'http://127.0.0.1:4199';
const child = spawn(process.execPath, ['build'], {
	stdio: ['ignore', 'inherit', 'inherit'],
	env: {
		...process.env,
		HOST: '127.0.0.1',
		PORT: '4199',
		ORIGIN: origin,
		PUBLIC_SITE_URL: origin,
		PUBLIC_SEO_INDEXABLE: 'false',
		PUBLIC_CONVEX_URL: '',
		AUTH_ENABLED: 'false',
		AI_ENABLED: 'false',
		MCP_CLIENT_ENABLED: 'false',
		MCP_SERVER_ENABLED: 'false'
	}
});
const closed = once(child, 'close');
try {
	let ready = false;
	for (let attempt = 0; attempt < 50; attempt++) {
		assert.equal(child.exitCode, null, 'Node server exited before becoming ready');
		try {
			ready = (await fetch(origin, { signal: AbortSignal.timeout(1000) })).ok;
		} catch {
			/* Wait for startup. */
		}
		if (ready) break;
		await setTimeout(200);
	}
	assert.ok(ready, 'Node server did not start');
	const routes = [
		{ path: '/', status: 307 },
		{ path: '/workspace', status: 200 },
		{ path: '/workspace/chat-1', status: 200 },
		{ path: '/capabilities', status: 200 },
		{ path: '/capabilities/capability_01', status: 200 },
		{ path: '/settings/configuration_category_01', status: 200 }
	];
	for (const route of routes) {
		const response = await fetch(`${origin}${route.path}`, {
			redirect: 'manual',
			signal: AbortSignal.timeout(5000)
		});
		assert.equal(response.status, route.status, route.path);
		if (route.path === '/') {
			const location = response.headers.get('location') ?? '';
			assert.ok(location.endsWith('/workspace'), `${route.path} must redirect to /workspace`);
			continue;
		}
		const html = await response.text();
		assert.match(html, /noindex,nofollow/, route.path);
		if (route.path === '/workspace') {
			const asset = html.match(/(_app\/immutable\/[^"'\s<>]+\.js)/)?.[1];
			assert.ok(asset, 'HTML must reference the client entry');
			const script = await fetch(`${origin}/${asset}`, { signal: AbortSignal.timeout(5000) });
			assert.equal(script.status, 200);
			assert.match(script.headers.get('content-type') ?? '', /javascript/);
		}
	}
	const config = await fetch(`${origin}/api/ai/config`, { signal: AbortSignal.timeout(5000) });
	assert.deepEqual(await config.json(), {
		ai: { enabled: false, providers: [] },
		mcp: { enabled: false, servers: [] }
	});
	assert.equal(config.headers.get('cache-control'), 'no-store');
	for (const path of [
		'/workspace/bad!id',
		'/capabilities/not-a-capability',
		'/settings/not-a-section',
		'/nope'
	]) {
		const response = await fetch(`${origin}${path}`, {
			redirect: 'manual',
			signal: AbortSignal.timeout(5000)
		});
		assert.equal(response.status, 404, path);
	}
	console.log('Standalone Node routes, private-cache headers and disabled capabilities passed.');
} finally {
	child.kill('SIGTERM');
	await closed;
}
