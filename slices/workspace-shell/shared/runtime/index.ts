export type { WorkspaceBackend, WorkspaceConnection, WorkspaceRuntimeAdapter } from "./types.js";
export type {
  WorkspaceChatComponent,
  WorkspaceChatHandle,
  WorkspaceChatProps,
  WorkspaceChatPresentation,
  WorkspaceOutputOrigin,
} from "./chat.js";
export type { WorkspacePersistence } from "./persistence.js";
export { WORKSPACE_RESOURCE_CONTEXT } from "./resource.js";
export type { WorkspaceResourceContext, WorkspaceResourceHeader } from "./resource.js";
export type { WorkspaceIntegration, WorkspaceIntegrationContext } from "./integration.js";
export { defaultBackendSelection, initialBackend, initialCompare } from "./backend-selection.js";
export type { WorkspaceBackendSelection } from "./backend-selection.js";
export type {
  WorkspaceGateComponent,
  WorkspaceGateProps,
  WorkspaceHeaderComponent,
  WorkspaceHeaderProps,
  WorkspaceLauncherComponent,
  WorkspaceLauncherProps,
  WorkspaceRuntimeControlsComponent,
  WorkspaceRuntimeControlsProps,
  WorkspaceSettingsComponent,
  WorkspaceSettingsProps,
} from "./components.js";

export { resolveChatPresentation } from "./chat.js";
