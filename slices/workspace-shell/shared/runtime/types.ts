/** Passive connection status; credentials and action authority stay outside the shell. */
export type WorkspaceConnection = {
	hosted: boolean;
	connected: boolean;
};

/** The minimum compute metadata required by workspace selection. */
export type WorkspaceBackend = {
	id: string;
	kind: string;
	ready: boolean;
	[key: string]: unknown;
};

/** Read-only runtime discovery. This contract does not authorize actions. */
export type WorkspaceRuntimeAdapter = {
	connection: () => WorkspaceConnection;
	listBackends: () => Promise<WorkspaceBackend[]>;
};
