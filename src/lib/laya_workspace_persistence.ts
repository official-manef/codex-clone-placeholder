import { readDraft, saveDraft } from "#lib/drafts.js";
import { loadWorkspaceLayout, persistWorkspaceLayout } from "#lib/laya_workspace_layout.js";
import type { WorkspacePersistence } from "../../slices/workspace-shell/shared/runtime/index.js";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Preserve the existing Laya tab draft scope and persistent backend preference keys. */
export function createLayaWorkspacePersistence(
  options: {
    draftStorage?: StorageLike;
    backendStorage?: () => StorageLike | undefined;
  } = {},
): WorkspacePersistence {
  const local =
    options.backendStorage ??
    (() => (typeof window === "undefined" ? undefined : window.localStorage));
  return {
    loadLayout: (tools) => loadWorkspaceLayout(tools, options.draftStorage),
    saveLayout: (layout, tools) => persistWorkspaceLayout(layout, tools, options.draftStorage),
    readDraft: (key, fallback) => readDraft(key, fallback, options.draftStorage),
    saveDraft: (key, value) => saveDraft(key, value, options.draftStorage),
    readBackends: () => {
      let backend = "",
        chatBackend = "";
      try {
        const storage = local();
        backend = storage?.getItem("laya-backend") ?? "";
        chatBackend = storage?.getItem("laya-chat-backend") ?? backend;
      } catch {
        // Optional preferences may be blocked by the browser.
      }
      return { backend, chatBackend };
    },
    saveBackend: (kind, value) => {
      try {
        local()?.setItem(kind === "backend" ? "laya-backend" : "laya-chat-backend", value);
      } catch {
        // Optional preferences may be blocked by the browser.
      }
    },
  };
}

export const layaWorkspacePersistence = createLayaWorkspacePersistence();
