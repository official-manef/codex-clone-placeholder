import { readDraft, saveDraft } from "#lib/drafts.js";
import {
  createWorkspaceLayoutPersistence,
  type WorkspaceLayout,
} from "../../shared/workspace-layout/index.js";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function layaLayout(storage?: StorageLike) {
  return createWorkspaceLayoutPersistence({
    read: (key, fallback) => readDraft(key, fallback, storage),
    save: (key, value) => saveDraft(key, value, storage),
  });
}

/** Restore passive layout only, using the existing Laya draft namespace. */
export function loadWorkspaceLayout<Tool extends string>(
  tools: readonly Tool[],
  storage?: StorageLike,
): WorkspaceLayout<Tool> {
  return layaLayout(storage).load(tools);
}

export function persistWorkspaceLayout<Tool extends string>(
  value: WorkspaceLayout<Tool>,
  tools: readonly Tool[],
  storage?: StorageLike,
): boolean {
  return layaLayout(storage).save(value, tools);
}
