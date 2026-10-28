/**
 * Engine selection: where a turn actually runs.
 *
 * `local`  — the browser. No account, no network. The shell's own chat stub answers, and if the
 *            user has a paired device the turn can be forwarded to it.
 * `device` — a runtime the user paired (a laptop, a box with the NPU). The browser streams to it.
 * `cloud`  — a Convex action calls the user's own BYOK key. Requires sign-in.
 *
 * The template ships with all three reachable; nothing is removed by enabling cloud.
 */
export type Engine = 'local' | 'device' | 'cloud';

export type EngineAvailability = {
	local: true;
	device: boolean;
	cloud: boolean;
	/** Why an engine is unavailable, for a disabled control's accessible name. */
	reason: { device: string | null; cloud: string | null };
};

export function engineAvailability(input: {
	hasDevice: boolean;
	hasCredential: boolean;
	signedIn: boolean;
}): EngineAvailability {
	return {
		local: true,
		device: input.hasDevice,
		cloud: input.signedIn && input.hasCredential,
		reason: {
			device: input.hasDevice ? null : 'Pair a device in Settings first.',
			cloud: !input.signedIn
				? 'Sign in to run on a provider key.'
				: input.hasCredential
					? null
					: 'Connect a provider key in Providers first.'
		}
	};
}

export const ENGINE_LABEL: Readonly<Record<Engine, string>> = {
	local: 'This browser',
	device: 'Paired device',
	cloud: 'Provider key'
};
