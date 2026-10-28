export { default as WorkspaceShell } from './workspace-shell.svelte';
export { defaultWorkspaceLabels, resolveWorkspaceLabels } from './labels.js';
export type { WorkspaceLabels } from './labels.js';
export type {
	WorkspacePersistence,
	WorkspaceRuntimeAdapter,
	WorkspaceChatComponent,
	WorkspaceChatHandle,
	WorkspaceChatProps,
	WorkspaceBackend,
	WorkspaceConnection
} from './shared/runtime/index.js';
export { createFeatureRegistry } from './shared/feature-registry/index.js';
export type { FeatureDescriptor } from './shared/feature-registry/index.js';
export { default as ChatSurface } from './shared/chat-ui/ChatSurface.svelte';
export { default as ChatComposer } from './shared/chat-ui/ChatComposer.svelte';
export { default as MessageFrame } from './shared/chat-ui/MessageFrame.svelte';
export { default as ChatModeSwitch } from './shared/chat-ui/ModeSwitch.svelte';
export { default as ChatHeader } from './shared/chat-ui/ChatHeader.svelte';
export { default as ChatListRow } from './shared/chat-ui/ChatListRow.svelte';
export { default as ChatGroupHeader } from './shared/chat-ui/ChatGroupHeader.svelte';
export { default as ComposerPicker } from './shared/chat-ui/ComposerPicker.svelte';
export type {
	WorkspaceMenuItem,
	WorkspaceMenuBinding,
	WorkspaceMenuGroup
} from './shared/menu/index.js';
