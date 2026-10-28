import type { Component, Snippet } from "svelte";
import type { WorkspaceBackend } from "./types.js";

/** Optional UI contributions. These props describe presentation, not authority. */
export type WorkspaceGateProps = {
  children: Snippet;
  onConnected?: () => void;
  onWorkspaceActive?: (active: boolean) => void;
};
export type WorkspaceGateComponent = Component<WorkspaceGateProps>;

export type WorkspaceRuntimeControlsProps = { placement?: "header" | "rail" };
export type WorkspaceRuntimeControlsComponent = Component<WorkspaceRuntimeControlsProps>;

export type WorkspaceHeaderProps = {
  backends?: WorkspaceBackend[];
  backend?: string;
  connection?: "checking" | "online" | "offline";
  title?: string;
  icon?: string;
  canClose?: boolean;
  showCompute?: boolean;
  showOptions?: boolean;
  comparison?: boolean;
  compareBackends?: string[];
  onPick?: (id: string) => void;
  onClose?: () => void;
  onComparison?: (enabled: boolean) => void;
  onComparePick?: (ids: string[]) => void;
};
export type WorkspaceHeaderComponent = Component<WorkspaceHeaderProps>;

export type WorkspaceSettingsProps = {
  open?: boolean;
  selected?: string;
  categories: readonly { id: string; label: string; icon: string }[];
  onSelect?: (id: string) => void;
  children: Snippet<[string]>;
};
export type WorkspaceSettingsComponent = Component<WorkspaceSettingsProps, {}, "open" | "selected">;

export type WorkspaceLauncherProps = {
  outputs: readonly { id: string; label: string; icon: string }[];
  recent?: string[];
  quickIds?: readonly string[];
  suggestedIds?: readonly string[];
  recentLabel?: string;
  launcherId?: string;
  onOpen: (id: string) => void;
};
export type WorkspaceLauncherComponent = Component<WorkspaceLauncherProps>;
