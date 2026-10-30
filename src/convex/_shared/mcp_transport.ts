/**
 * Minimal MCP Streamable HTTP client for Convex actions.
 *
 * The operator path uses `@modelcontextprotocol/sdk` in `src/lib/server/mcp/client.ts`. That
 * package is a Node-oriented graph (ajv codegen, zod v3/v4 interop) and importing it here would
 * force `'use node'` on the whole module, which also disallows the queries and mutations that
 * live next to these actions. So this module speaks the same wire protocol with plain `fetch`
 * and keeps the identical bounds: 8 discovery pages, 128 tools, a 15-second deadline, 2 MiB
 * per response, redirects refused, one session per request, terminated in `finally`.
 *
 * Secrets never appear in an error message; callers redact before returning text.
 */
import { MAX_RESULT_CHARS, redactSecrets } from './mcp_rules';

export type McpAuth = 'bearer' | 'x-api-key';

export type McpEndpoint = { url: string; auth: McpAuth };

const MAX_RESPONSE_BYTES = 2_097_152;
const DEADLINE_MS = 15_000;
const CLEANUP_MS = 2_000;
const MAX_PAGES = 8;
const MAX_TOOLS = 128;
const PROTOCOL_VERSION = '2025-06-18';

type JsonRpcMessage = { jsonrpc?: string; id?: number; result?: unknown; error?: unknown };

function headersFor(endpoint: McpEndpoint, secret: string, sessionId: string | null): Headers {
	const headers = new Headers({
		'content-type': 'application/json',
		accept: 'application/json, text/event-stream'
	});
	if (endpoint.auth === 'bearer') headers.set('authorization', `Bearer ${secret}`);
	else headers.set('x-api-key', secret);
	if (sessionId) headers.set('mcp-session-id', sessionId);
	return headers;
}

async function readBounded(response: Response): Promise<string> {
	if (!response.body) return '';
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let bytes = 0;
	let text = '';
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		bytes += value.byteLength;
		if (bytes > MAX_RESPONSE_BYTES) {
			await reader.cancel().catch(() => {});
			throw new Error('MCP response exceeded the size limit');
		}
		text += decoder.decode(value, { stream: true });
	}
	return text + decoder.decode();
}

/** One JSON-RPC reply from either a JSON body or an SSE frame stream. */
function parseReply(body: string, contentType: string, id: number): JsonRpcMessage | null {
	if (contentType.includes('text/event-stream')) {
		for (const frame of body.split(/\r?\n\r?\n/)) {
			const data = frame
				.split(/\r?\n/)
				.filter((line) => line.startsWith('data:'))
				.map((line) => line.slice(5).trimStart())
				.join('\n');
			if (!data) continue;
			let message: JsonRpcMessage;
			try {
				message = JSON.parse(data) as JsonRpcMessage;
			} catch {
				continue;
			}
			if (message.id === id) return message;
		}
		return null;
	}
	if (!body.trim()) return null;
	const parsed = JSON.parse(body) as JsonRpcMessage | JsonRpcMessage[];
	const messages = Array.isArray(parsed) ? parsed : [parsed];
	return messages.find((message) => message.id === id) ?? null;
}

async function withSession<T>(
	endpoint: McpEndpoint,
	secret: string,
	run: (rpc: (method: string, params?: unknown) => Promise<unknown>) => Promise<T>
): Promise<T> {
	const deadline = AbortSignal.timeout(DEADLINE_MS);
	let sessionId: string | null = null;
	let nextId = 1;

	async function send(payload: unknown, signal: AbortSignal): Promise<Response> {
		return fetch(endpoint.url, {
			method: 'POST',
			headers: headersFor(endpoint, secret, sessionId),
			body: JSON.stringify(payload),
			redirect: 'error',
			signal
		});
	}

	async function rpc(method: string, params?: unknown): Promise<unknown> {
		const id = nextId++;
		const response = await send(
			{ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) },
			deadline
		);
		const session = response.headers.get('mcp-session-id');
		if (session) sessionId = session;
		if (!response.ok) throw new Error(`MCP server returned HTTP ${response.status}`);
		const body = await readBounded(response);
		const reply = parseReply(body, response.headers.get('content-type') ?? '', id);
		if (!reply) throw new Error('MCP server returned no matching reply');
		if (reply.error) throw new Error('MCP server returned an error');
		return reply.result;
	}

	try {
		await rpc('initialize', {
			protocolVersion: PROTOCOL_VERSION,
			capabilities: {},
			clientInfo: { name: 'workspace-template', version: '1' }
		});
		// The spec's initialized notification is 202 Accepted with no body; a server that
		// answers with a body is still acceptable, so the response is drained, not parsed.
		const ack = await send({ jsonrpc: '2.0', method: 'notifications/initialized' }, deadline);
		const ackSession = ack.headers.get('mcp-session-id');
		if (ackSession) sessionId = ackSession;
		await readBounded(ack).catch(() => {});
		if (!ack.ok) throw new Error(`MCP server returned HTTP ${ack.status}`);
		return await run(rpc);
	} finally {
		if (sessionId) {
			try {
				await fetch(endpoint.url, {
					method: 'DELETE',
					headers: headersFor(endpoint, secret, sessionId),
					redirect: 'error',
					signal: AbortSignal.timeout(CLEANUP_MS)
				});
			} catch {
				/* Closing locally remains required even when remote cleanup fails. */
			}
		}
	}
}

/** Advertised tool names, bounded to 128 across at most 8 pages. */
export async function discoverToolNames(
	endpoint: McpEndpoint,
	secret: string
): Promise<{ reachable: boolean; error: string | null; names: string[] }> {
	try {
		const names = await withSession(endpoint, secret, async (rpc) => {
			const found: string[] = [];
			const cursors = new Set<string>();
			let cursor: string | undefined;
			for (let page = 0; page < MAX_PAGES; page++) {
				const result = (await rpc('tools/list', cursor ? { cursor } : undefined)) as {
					tools?: { name?: unknown }[];
					nextCursor?: unknown;
				} | null;
				for (const tool of result?.tools ?? []) {
					if (typeof tool?.name === 'string' && !found.includes(tool.name)) found.push(tool.name);
					if (found.length > MAX_TOOLS) throw new Error('MCP discovery limit exceeded');
				}
				const next = typeof result?.nextCursor === 'string' ? result.nextCursor : undefined;
				if (!next) return found;
				if (cursors.has(next)) throw new Error('MCP discovery cursor repeated');
				cursors.add(next);
				cursor = next;
			}
			throw new Error('MCP discovery incomplete');
		});
		return { reachable: true, error: null, names };
	} catch (error) {
		return {
			reachable: false,
			error: redactSecrets(error instanceof Error ? error.message : 'MCP discovery failed', [
				secret,
				endpoint.url
			]),
			names: []
		};
	}
}

function contentText(result: unknown): string {
	const value = result as { content?: unknown; structuredContent?: unknown } | null;
	const content = Array.isArray(value?.content) ? value.content : [];
	const parts: string[] = [];
	for (const item of content) {
		const block = item as { type?: unknown; text?: unknown };
		if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
		else if (block.type) parts.push(`[${String(block.type)}]`);
	}
	if (!parts.length && value?.structuredContent !== undefined)
		parts.push(JSON.stringify(value.structuredContent));
	return parts.join('\n');
}

/** Execute one tool call. The allowlist check is the caller's responsibility. */
export async function callRemoteToolOnce(
	endpoint: McpEndpoint,
	secret: string,
	tool: string,
	argumentsJson: string
): Promise<{ content: string; isError: boolean }> {
	const args = JSON.parse(argumentsJson) as Record<string, unknown>;
	const result = await withSession(endpoint, secret, (rpc) =>
		rpc('tools/call', { name: tool, arguments: args })
	);
	const value = result as { isError?: unknown } | null;
	const text = redactSecrets(contentText(result), [secret, endpoint.url]);
	return {
		content: text.slice(0, MAX_RESULT_CHARS),
		isError: value?.isError === true
	};
}
