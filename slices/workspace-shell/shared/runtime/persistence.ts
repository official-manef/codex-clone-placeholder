import type { WorkspaceLayout } from "$shared/workspace-layout/index.js";

/** Passive workspace preferences only; credentials and action authority stay outside this contract. */
export type WorkspacePersistence = {
  loadLayout: (tools: readonly string[]) => WorkspaceLayout<string>;
  saveLayout: (layout: WorkspaceLayout<string>, tools: readonly string[]) => boolean;
  readDraft: <T>(key: string, fallback: T) => T;
  saveDraft: (key: string, value: unknown) => boolean;
  readBackends: () => { backend: string; chatBackend: string };
  saveBackend: (kind: "backend" | "chatBackend", value: string) => void;
};
