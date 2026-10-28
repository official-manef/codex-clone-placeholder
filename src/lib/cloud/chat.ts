/**
 * Cloud transport for the workspace shell.
 *
 * The shell's `runtime` prop is read-only discovery; it does not carry chat. Cloud chat goes
 * through `src/lib/http.local.ts`'s sibling: the copied views call `#lib/http` for everything,
 * so this module is what a cloud-enabled build swaps in behind `src/lib/http.ts`.
 *
 * Design constraint (rr P0): the browser never holds a provider key. A turn is one call to the
 * Convex `chat.send` action, which decrypts the caller's own credential server-side. If Convex
 * is not configured, every function here reports "unavailable" and the shell stays on local mode.
 */

export type CloudTurn = {
	ref: string;
	messages: { role: 'user' | 'assistant'; content: string }[];
	decisionNote?: string;
};

export type CloudResult =
	| { ok: true; text: string; provider: string; model: string }
	| { ok: false; code: string; message: string };

/** The subset of the generated Convex action this module needs. */
type SendAction = (args: CloudTurn) => Promise<{ text: string; provider: string; model: string }>;

let sendAction: SendAction | null = null;

/**
 * Wire the module to the Convex action. `layout.svelte` calls this once when a deployment URL
 * exists; without it, cloud stays unavailable and local mode is untouched.
 */
export function configureCloudChat(action: SendAction | null) {
	sendAction = action;
}

export function cloudAvailable(): boolean {
	return sendAction !== null;
}

export async function cloudTurn(input: CloudTurn): Promise<CloudResult> {
	if (!sendAction) {
		return {
			ok: false,
			code: 'unsupported',
			message: 'Cloud chat is not configured. Local mode still works.'
		};
	}
	try {
		const result = await sendAction(input);
		return { ok: true, text: result.text, provider: result.provider, model: result.model };
	} catch (cause) {
		// The ConvexError payload carries {code, message}; anything else is treated as transport.
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
			message: cause instanceof Error ? cause.message : 'The cloud turn failed.'
		};
	}
}
