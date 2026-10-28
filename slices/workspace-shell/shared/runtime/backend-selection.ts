import type { WorkspaceBackend } from './types.js';

/** UI selection preferences only; runtime authorization remains with the host. */
export type WorkspaceBackendSelection = {
	chatEligible: (backend: WorkspaceBackend) => boolean;
	chatSelectable: (id: string, backends: readonly WorkspaceBackend[]) => boolean;
	persistBackend: (id: string) => boolean;
	defaultCompareIds: readonly string[];
};

export const defaultBackendSelection: WorkspaceBackendSelection = {
	chatEligible: () => true,
	chatSelectable: (id, backends) => backends.some((backend) => backend.id === id && backend.ready),
	persistBackend: () => true,
	defaultCompareIds: []
};

export function initialBackend(
	backends: readonly WorkspaceBackend[],
	saved: string,
	eligible: (backend: WorkspaceBackend) => boolean = () => true
): string {
	return (
		backends.find((item) => item.id === saved && item.ready && eligible(item))?.id ??
		backends.find((item) => item.ready && eligible(item))?.id ??
		''
	);
}

export function initialCompare(
	backends: readonly WorkspaceBackend[],
	ids: readonly string[]
): string[] {
	return ids.filter((id) => backends.some((item) => item.id === id && item.ready));
}
