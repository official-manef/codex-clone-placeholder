/**
 * Browser adapter for per-user BYOK MCP (`src/convex/mcp.ts`).
 *
 * Same shape as `src/lib/cloud/chat.ts`: `configureCloudMcp(client)` wires plain functions once
 * when a Convex deployment exists, and every wrapper is `null`-safe, so a local-only build gets
 * `code: 'unsupported'` instead of a crash.
 *
 * The credential is never held here. `connect` passes the secret straight through to the
 * action, which encrypts it server-side; every other call works from an alias.
 */

export type McpAuth = 'bearer' | 'x-api-key';

export type McpConnection = {
	alias: string;
	url: string;
	auth: McpAuth | string;
	tools: string[];
	label?: string;
	enabled: boolean;
	updatedAt: number;
};

export type McpFailure = { ok: false; code: string; message: string };
export type McpResult<T> = ({ ok: true } & T) | McpFailure;

export type DiscoverResult = { reachable: boolean; error: string | null; tools: string[] };

/** Exact snapshot the confirmation shows and the call redeems. */
export type ApprovalPreview = { token: string; alias: string; tool: string; arguments: string };

/** The subset of the deployment this module needs. Wired from `+layout.svelte`. */
export type CloudMcpClient = {
	list: () => Promise<{ connections: McpConnection[] }>;
	connect: (input: {
		alias: string;
		url: string;
		auth: McpAuth;
		secret: string;
		tools: string[];
		label?: string;
	}) => Promise<McpConnection>;
	disconnect: (input: { alias: string }) => Promise<{ removed: boolean }>;
	setEnabled: (input: { alias: string; enabled: boolean }) => Promise<{ updated: boolean }>;
	discover: (input: { alias: string }) => Promise<DiscoverResult>;
	prepare: (input: {
		alias: string;
		tool: string;
		arguments: Record<string, unknown>;
	}) => Promise<ApprovalPreview>;
	call: (input: { token: string }) => Promise<{ content: string; isError: boolean }>;
};

let cloud: CloudMcpClient | null = null;

export function configureCloudMcp(client: CloudMcpClient | null) {
	cloud = client;
}

export function cloudMcpAvailable(): boolean {
	return cloud !== null;
}

function unavailable(): McpFailure {
	return {
		ok: false,
		code: 'unsupported',
		message: 'Cloud mode is not configured, so MCP servers cannot be managed in this build.'
	};
}

/** A ConvexError payload carries `{code, message}`; anything else is a transport failure. */
function failure(cause: unknown): McpFailure {
	const data =
		cause && typeof cause === 'object' && 'data' in cause
			? (cause as { data?: unknown }).data
			: undefined;
	if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
		const { code, message } = data as { code: string; message: string };
		return { ok: false, code, message };
	}
	return {
		ok: false,
		code: 'provider_error',
		message: cause instanceof Error ? cause.message : 'The MCP request failed.'
	};
}

async function attempt<T>(run: (client: CloudMcpClient) => Promise<T>): Promise<McpResult<T>> {
	if (!cloud) return unavailable();
	try {
		return { ok: true, ...(await run(cloud)) };
	} catch (cause) {
		return failure(cause);
	}
}

export function listMcpConnections(): Promise<McpResult<{ connections: McpConnection[] }>> {
	return attempt<{ connections: McpConnection[] }>((client) => client.list());
}

export function connectMcp(input: {
	alias: string;
	url: string;
	auth: McpAuth;
	secret: string;
	tools: string[];
	label?: string;
}): Promise<McpResult<{ connection: McpConnection }>> {
	return attempt<{ connection: McpConnection }>(async (client) => ({
		connection: await client.connect(input)
	}));
}

export function disconnectMcp(alias: string): Promise<McpResult<{ removed: boolean }>> {
	return attempt<{ removed: boolean }>((client) => client.disconnect({ alias }));
}

export function setMcpEnabled(
	alias: string,
	enabled: boolean
): Promise<McpResult<{ updated: boolean }>> {
	return attempt<{ updated: boolean }>((client) => client.setEnabled({ alias, enabled }));
}

export function discoverMcp(alias: string): Promise<McpResult<DiscoverResult>> {
	return attempt<DiscoverResult>((client) => client.discover({ alias }));
}

/** Freeze the preview. Nothing runs until `callMcp` redeems the returned token once. */
export function prepareMcpCall(
	alias: string,
	tool: string,
	args: Record<string, unknown>
): Promise<McpResult<{ approval: ApprovalPreview }>> {
	return attempt<{ approval: ApprovalPreview }>(async (client) => ({
		approval: await client.prepare({ alias, tool, arguments: args })
	}));
}

export function callMcp(token: string): Promise<McpResult<{ content: string; isError: boolean }>> {
	return attempt<{ content: string; isError: boolean }>((client) => client.call({ token }));
}
