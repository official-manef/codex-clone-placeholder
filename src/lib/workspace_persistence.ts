import { readDraft, saveDraft } from '#lib/drafts.js';
import {
	createWorkspaceLayoutPersistence,
	type WorkspaceLayout
} from '$shared/workspace-layout/index.js';
import type { WorkspacePersistence } from '$features/workspace-shell';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/**
 * Passive workspace preferences.
 *
 * The template namespaces its keys so a product built from it never collides with another
 * app on the same origin. `readDraft`/`saveDraft` come from the copied `#lib/drafts` store,
 * which already handles quota and private-mode failures.
 *
 * Nothing here is authority: no credentials, approvals, executed jobs or file objects.
 */
export function createWorkspacePersistence(
	options: {
		draftStorage?: StorageLike;
		backendStorage?: () => StorageLike | undefined;
	} = {}
): WorkspacePersistence {
	const local =
		options.backendStorage ??
		(() => (typeof window === 'undefined' ? undefined : window.localStorage));

	return {
		loadLayout: (tools) => loadLayout(tools, options.draftStorage),
		saveLayout: (layout, tools) => saveLayout(layout, tools, options.draftStorage),
		readDraft: (key, fallback) => readDraft(key, fallback, options.draftStorage),
		saveDraft: (key, value) => saveDraft(key, value, options.draftStorage),
		readBackends: () => {
			let backend = '';
			let chatBackend = '';
			try {
				const storage = local();
				backend = storage?.getItem('workspace-template:backend') ?? '';
				chatBackend = storage?.getItem('workspace-template:chat-backend') ?? backend;
			} catch {
				// Optional preferences may be blocked by the browser.
			}
			return { backend, chatBackend };
		},
		saveBackend: (kind, value) => {
			try {
				local()?.setItem(
					kind === 'backend' ? 'workspace-template:backend' : 'workspace-template:chat-backend',
					value
				);
			} catch {
				// Preferences are optional; a blocked store must not break the workspace.
			}
		}
	};
}

export const workspacePersistence = createWorkspacePersistence();

// The layout adapter ships with the copied shell; this wrapper only supplies storage.
function layoutFor(storage?: StorageLike) {
	return createWorkspaceLayoutPersistence({
		read: (key, fallback) => readDraft(key, fallback, storage),
		save: (key, value) => saveDraft(key, value, storage)
	});
}

export function loadLayout<Tool extends string>(
	tools: readonly Tool[],
	storage?: StorageLike
): WorkspaceLayout<Tool> {
	return layoutFor(storage).load(tools);
}

export function saveLayout<Tool extends string>(
	value: WorkspaceLayout<Tool>,
	tools: readonly Tool[],
	storage?: StorageLike
): boolean {
	return layoutFor(storage).save(value, tools);
}
