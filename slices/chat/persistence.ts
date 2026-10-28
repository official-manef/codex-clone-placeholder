import { createWorkspaceLayoutPersistence } from '$shared/workspace-layout/index.js';
import type { WorkspacePersistence } from '$features/workspace-shell';

/**
 * Passive workspace preferences backed by sessionStorage. Namespaced so a template
 * consumer never collides with its own product keys.
 *
 * Nothing here is authority: no credentials, approvals, drafts of executed jobs or file
 * objects are stored. See docs/state-model.md §6.
 */
const NAMESPACE = 'workspace-template';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const memory = new Map<string, unknown>();

function safeRead(key: string, fallback: unknown): unknown {
	try {
		if (typeof sessionStorage === 'undefined') return memory.has(key) ? memory.get(key) : fallback;
		const raw = sessionStorage.getItem(`${NAMESPACE}:${key}`);
		if (raw === null) return fallback;
		return JSON.parse(raw) as unknown;
	} catch {
		return fallback;
	}
}

function safeSave(key: string, value: unknown): boolean {
	try {
		const serialized = JSON.stringify(value);
		if (typeof sessionStorage === 'undefined') {
			memory.set(key, JSON.parse(serialized) as unknown);
			return true;
		}
		sessionStorage.setItem(`${NAMESPACE}:${key}`, serialized);
		return true;
	} catch {
		return false;
	}
}

const adapter = {
	read: <T>(key: string, fallback: T): T => {
		const value = safeRead(key, fallback);
		return value === undefined ? fallback : (value as T);
	},
	save: (key: string, value: unknown) => safeSave(key, value)
};

const layoutPersistence = createWorkspaceLayoutPersistence(adapter, `${NAMESPACE}-layout`);

/** Backend preferences are UI selections, never connection credentials. */
function backendStorage(): StorageLike | undefined {
	try {
		return typeof localStorage === 'undefined' ? undefined : localStorage;
	} catch {
		return undefined;
	}
}

export function createTemplatePersistence(): WorkspacePersistence {
	return {
		loadLayout: (tools) => layoutPersistence.load(tools),
		saveLayout: (layout, tools) => layoutPersistence.save(layout, tools),
		readDraft: (key, fallback) => adapter.read(key, fallback),
		saveDraft: (key, value) => adapter.save(key, value),
		readBackends: () => {
			try {
				const storage = backendStorage();
				const backend = storage?.getItem(`${NAMESPACE}:backend`) ?? '';
				const chatBackend = storage?.getItem(`${NAMESPACE}:chat-backend`) ?? backend;
				return { backend, chatBackend };
			} catch {
				return { backend: '', chatBackend: '' };
			}
		},
		saveBackend: (kind, value) => {
			try {
				backendStorage()?.setItem(
					`${NAMESPACE}:${kind === 'backend' ? 'backend' : 'chat-backend'}`,
					value
				);
			} catch {
				// Preferences are optional; a blocked store must not break the workspace.
			}
		}
	};
}
