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
	for (const path of ['/', '/apps/dashboard', '/apps/notes', '/apps/assistant']) {
		const response = await fetch(`${origin}${path}`);
		assert.equal(response.status, 200, path);
		assert.match(await response.text(), /noindex,nofollow/, path);
	}
	const config = await fetch(`${origin}/api/ai/config`);
	assert.deepEqual(await config.json(), {
		ai: { enabled: false, providers: [] },
		mcp: { enabled: false, servers: [] }
	});
	assert.equal(config.headers.get('cache-control'), 'no-store');
	assert.equal((await fetch(`${origin}/apps/missing`)).status, 404);
	console.log('Standalone Node routes, private-cache headers and disabled capabilities passed.');
} finally {
	child.kill('SIGTERM');
	await closed;
}
