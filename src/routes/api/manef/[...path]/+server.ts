import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import { readJsonBody } from '$lib/server/access';
import { hubConfigured, hubRequest } from '$lib/server/manef';
import type { RequestHandler } from './$types';

/**
 * The only paths this console exposes from the MANEF AI hub. Anything else in the hub — and
 * any path a caller invents — is not reachable, so the bridge cannot be widened by URL.
 */
const ROUTES = {
	'/api/manef/modules': { path: '/api/modules', method: 'GET', accept: [] },
	// `/ready` answers 503 with `{status:"unconfigured"}` by design; that is a real answer.
	'/api/manef/ready': { path: '/ready', method: 'GET', accept: [503] },
	'/api/manef/plan': { path: '/api/plan', method: 'POST', accept: [] }
} as const;

export const GET: RequestHandler = async ({ url }) => {
	const route = ROUTES[url.pathname as keyof typeof ROUTES];
	if (!route) error(404, 'Unknown MANEF hub path.');
	if (route.method !== 'GET') error(405, 'Use POST for this MANEF hub path.');
	return reply(route.path, route.accept, { method: 'GET' });
};

export const POST: RequestHandler = async ({ url, request }) => {
	const route = ROUTES[url.pathname as keyof typeof ROUTES];
	if (!route) error(404, 'Unknown MANEF hub path.');
	if (route.method !== 'POST') error(405, 'Use GET for this MANEF hub path.');
	const body = await readJsonBody(request);
	return reply(route.path, route.accept, { method: 'POST', body: JSON.stringify(body) });
};

async function reply(
	path: string,
	accept: readonly number[],
	init: { method: 'GET' | 'POST'; body?: string }
) {
	// Not configured is a state, not a failure to hide: the console still renders, it just
	// has no hub to read. The shape matches the hub's own `/ready` answer.
	if (!hubConfigured(env.MANEF_HUB_URL))
		return json(
			{ error: { code: 'hub_unconfigured' }, liveAdapters: 'unconfigured' },
			{ status: 503, headers: { 'Cache-Control': 'no-store' } }
		);
	const result = await hubRequest(path, { ...init, accept });
	if (!result.ok)
		return json(
			{ error: { code: result.code } },
			{ status: result.status, headers: { 'Cache-Control': 'no-store' } }
		);
	return json(result.value, { headers: { 'Cache-Control': 'no-store' } });
}
