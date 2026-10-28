/** Optional, passive workspace integration installed for the lifetime of the shell. */
export type WorkspaceIntegrationContext = {
  views: () => readonly { id: string; label: string; group?: string }[];
  workspace: () => { activeView: string; openViews: readonly string[] };
  navigate: (id: string) => void | Promise<void>;
};

export type WorkspaceIntegration = (context: WorkspaceIntegrationContext) => () => void;
