import { describe, expect, it } from 'vitest';
import {
	callMcp,
	cloudMcpAvailable,
	configureCloudMcp,
	connectMcp,
	discoverMcp,
	listMcpConnections,
	prepareMcpCall,
	type CloudMcpClient,
	type McpConnection
} from './mcp';

const connection: McpConnection = {
	alias: 'approved-service',
	url: 'https://mcp.example.com/mcp',
	auth: 'bearer',
	tools: ['read_file'],
	enabled: true,
	updatedAt: 1
};

function client(overrides: Partial<CloudMcpClient> = {}): CloudMcpClient {
	return {
		list: async () => ({ connections: [connection] }),
		connect: async (input) => ({ ...connection, ...input }),
		disconnect: async () => ({ removed: true }),
		setEnabled: async () => ({ updated: true }),
		discover: async () => ({ reachable: true, error: null, tools: ['read_file'] }),
		prepare: async ({ alias, tool, arguments: args }) => ({
			token: 'a'.repeat(64),
			alias,
			tool,
			arguments: JSON.stringify(args)
		}),
		call: async () => ({ content: 'ok', isError: false }),
		...overrides
	};
}

describe('cloud MCP adapter', () => {
	it('is null-safe before a deployment is wired', async () => {
		configureCloudMcp(null);
		expect(cloudMcpAvailable()).toBe(false);
		for (const result of [
			await listMcpConnections(),
			await connectMcp({
				alias: 'approved-service',
				url: connection.url,
				auth: 'bearer',
				secret: 'sk-1',
				tools: ['read_file']
			}),
			await discoverMcp('approved-service'),
			await prepareMcpCall('approved-service', 'read_file', {}),
			await callMcp('a'.repeat(64))
		])
			expect(result).toMatchObject({ ok: false, code: 'unsupported' });
	});

	it('returns the exact alias, tool and argument snapshot as the confirm payload', async () => {
		let sent: { alias: string; tool: string; arguments: unknown } | null = null;
		configureCloudMcp(
			client({
				prepare: async (input) => {
					sent = input;
					return {
						token: 'b'.repeat(64),
						alias: input.alias,
						tool: input.tool,
						arguments: '{"q":"x"}'
					};
				}
			})
		);
		const prepared = await prepareMcpCall('approved-service', 'read_file', { q: 'x' });
		expect(sent).toEqual({ alias: 'approved-service', tool: 'read_file', arguments: { q: 'x' } });
		expect(prepared).toEqual({
			ok: true,
			approval: {
				token: 'b'.repeat(64),
				alias: 'approved-service',
				tool: 'read_file',
				arguments: '{"q":"x"}'
			}
		});
	});

	it('surfaces the typed rejection for a stale token instead of throwing', async () => {
		configureCloudMcp(
			client({
				call: async () => {
					const stale = new Error('expired') as Error & { data: unknown };
					stale.data = { code: 'expired', message: 'This approval expired after 120 seconds.' };
					throw stale;
				}
			})
		);
		await expect(callMcp('c'.repeat(64))).resolves.toEqual({
			ok: false,
			code: 'expired',
			message: 'This approval expired after 120 seconds.'
		});
	});

	it('passes a connect payload through unchanged, then forgets the configured client', async () => {
		configureCloudMcp(client());
		const connected = await connectMcp({
			alias: 'approved-service',
			url: connection.url,
			auth: 'x-api-key',
			secret: 'sk-1',
			tools: ['read_file'],
			label: 'Demo'
		});
		expect(connected).toMatchObject({ ok: true, connection: { alias: 'approved-service' } });
		configureCloudMcp(null);
		expect(cloudMcpAvailable()).toBe(false);
	});
});
