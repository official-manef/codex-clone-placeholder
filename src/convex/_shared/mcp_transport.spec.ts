import { afterEach, expect, test, vi } from 'vitest';
import { callRemoteToolOnce, discoverToolNames } from './mcp_transport';

const endpoint = { url: 'https://mcp.example.com/mcp', auth: 'x-api-key' as const };
const secret = 'secret-test-token';
const schema = { type: 'object', properties: { text: { type: 'string' } } };

afterEach(() => vi.unstubAllGlobals());

function server(options: { repeatCursor?: boolean; failTool?: boolean } = {}) {
	const calls: { method: string; rpc?: Record<string, unknown>; headers: Headers }[] = [];
	vi.stubGlobal(
		'fetch',
		vi.fn(async (_url: unknown, init: RequestInit) => {
			const method = init.method ?? 'GET';
			const rpc = init.body
				? (JSON.parse(String(init.body)) as Record<string, unknown>)
				: undefined;
			calls.push({ method, rpc, headers: new Headers(init.headers) });
			if (method === 'DELETE') return new Response(null, { status: 200 });
			if (rpc?.method === 'notifications/initialized')
				return new Response(null, { status: 202, headers: { 'mcp-session-id': 's1' } });
			let result: unknown;
			if (rpc?.method === 'initialize')
				result = {
					protocolVersion: '2025-06-18',
					capabilities: { tools: {} },
					serverInfo: { name: 'fixture', version: '1.0.0' }
				};
			else if (rpc?.method === 'tools/list')
				result = {
					tools: [
						{ name: 'echo', description: `Description ${secret}`, inputSchema: schema },
						{ name: 'not-allowed', inputSchema: { type: 'object' } }
					],
					...(options.repeatCursor ? { nextCursor: 'same' } : {})
				};
			else
				result = {
					content: [{ type: 'text', text: `result ${secret}` }],
					...(options.failTool ? { isError: true } : {})
				};
			return Response.json(
				{ jsonrpc: '2.0', id: rpc?.id, result },
				{ headers: { 'mcp-session-id': 's1' } }
			);
		})
	);
	return calls;
}

test('discovery initializes, pages once, and terminates its session', async () => {
	const calls = server();
	const result = await discoverToolNames(endpoint, secret);
	expect(result).toEqual({
		reachable: true,
		error: null,
		names: ['echo', 'not-allowed']
	});
	expect(calls.map((call) => call.method)).toEqual(['POST', 'POST', 'POST', 'DELETE']);
	expect(calls[0].rpc?.method).toBe('initialize');
	expect(calls[2].headers.get('x-api-key')).toBe(secret);
	expect(calls[2].headers.get('mcp-session-id')).toBe('s1');
});

test('a repeated cursor is refused instead of looping', async () => {
	server({ repeatCursor: true });
	const result = await discoverToolNames(endpoint, secret);
	expect(result.reachable).toBe(false);
	expect(result.error).toContain('cursor repeated');
});

test('a call returns redacted text and the server isError flag', async () => {
	server({ failTool: true });
	const result = await callRemoteToolOnce(endpoint, secret, 'echo', '{"text":"hi"}');
	expect(result).toEqual({ content: 'result [redacted]', isError: true });
});

test('an HTTP failure is reported without the credential', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => new Response('denied', { status: 403 }))
	);
	const result = await discoverToolNames(endpoint, secret);
	expect(result).toEqual({ reachable: false, error: 'MCP server returned HTTP 403', names: [] });
});
