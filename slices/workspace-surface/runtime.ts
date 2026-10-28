import type { WorkspaceRuntimeAdapter } from '$features/workspace-shell';

/**
 * Local-only runtime discovery. There is no network call and no provider key: the
 * adapter reports one in-browser backend so the shell's selector has something honest
 * to render.
 *
 * A real product replaces `listBackends()` with its own discovery. The shell treats the
 * result as descriptive metadata and never as execution authority.
 */
export function createLocalRuntime(options: { connected?: boolean } = {}): WorkspaceRuntimeAdapter {
	let connected = options.connected ?? true;
	return {
		connection: () => ({ hosted: false, connected }),
		listBackends: async () => [
			{ id: 'local', kind: 'in-browser', ready: true, label: 'This browser' }
		],
		// Exposed for a host that wants a reconnect affordance later.
		setConnected(next: boolean) {
			connected = next;
		}
	} as WorkspaceRuntimeAdapter;
}
