import { api, runtimeConnection } from '#lib/http.js';
import type {
	WorkspaceBackend,
	WorkspaceBackendSelection,
	WorkspaceRuntimeAdapter
} from '$features/workspace-shell';

/**
 * Runtime discovery. The transport is the template's in-browser stub, so `listBackends()`
 * resolves one honest local backend. The shape is Laya's, which is why the shell's device
 * selector works without changes.
 */
export const workspaceRuntime: WorkspaceRuntimeAdapter = {
	connection() {
		const { hosted, connected } = runtimeConnection();
		return { hosted, connected };
	},
	async listBackends() {
		const result = await api.backends();
		if (result.error) throw new Error(result.error);
		if (!Array.isArray(result.backends))
			throw new Error('The runtime returned an invalid device list. Reconnect and try again.');
		return result.backends.filter(
			(item: unknown): item is WorkspaceBackend =>
				!!item &&
				typeof item === 'object' &&
				typeof (item as WorkspaceBackend).id === 'string' &&
				typeof (item as WorkspaceBackend).kind === 'string' &&
				typeof (item as WorkspaceBackend).ready === 'boolean'
		);
	}
};

/**
 * Selection policy. Passive: it decides what the UI may show and remember, never what the
 * runtime may execute.
 */
export const backendSelection: WorkspaceBackendSelection = {
	chatEligible: (backend) => backend.kind === 'local',
	chatSelectable: (id) => id === 'local',
	persistBackend: (id) => id !== 'byok',
	defaultCompareIds: ['local']
};
