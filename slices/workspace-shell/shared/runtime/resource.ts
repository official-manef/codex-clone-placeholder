import type { Snippet } from "svelte";

/** A view contributes its real toolbar and passive local commands to the shared chrome. */
export type WorkspaceResourceHeader = {
  toolbar: Snippet;
  commands?: Readonly<Record<string, () => void>>;
};

export type WorkspaceResourceContext = {
  register(id: string, header: WorkspaceResourceHeader): () => void;
};

/** Context belongs to the mounted workspace; no module-level user or document state. */
export const WORKSPACE_RESOURCE_CONTEXT = "workspace-template:resource-header:v1";
