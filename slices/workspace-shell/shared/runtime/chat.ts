import type { Component, Snippet } from 'svelte';
import type { ApprovalControlConfig } from '../approval-mode/index.js';
import type { WorkspaceChatUIConfig } from '../chat-ui/config.js';
import type { WorkspaceChatAppearance } from '../chat-ui/appearance.js';
import type { WorkspaceBackend } from './types.js';

/** Inputs and passive callbacks supplied by the shell to its single mounted chat. */
export type WorkspaceChatProps = {
	approval?: ApprovalControlConfig;
	presentation?: WorkspaceChatPresentation;
	appearance?: WorkspaceChatAppearance;
	ui?: WorkspaceChatUIConfig;
	backend?: string;
	backends?: WorkspaceBackend[];
	comparison?: boolean;
	compareBackends?: string[];
	active?: boolean;
	onPick?: (id: string) => void;
	onNavigate?: (id: string) => void;
	onOpenOutput?: (id: string, origin: WorkspaceOutputOrigin) => void;
	onCompareSettings?: (enabled: boolean, ids: string[]) => void;
	navigation?: Snippet;
	navigationItems?: Snippet;
	onToggleOutput?: () => void;
	outputOpen?: boolean;
	outputTabCount?: number;
	splitLayout?: boolean;
	navigationOpen?: boolean;
	sidebarWidth?: number;
	inspectorWidth?: number;
	navigationCollapsed?: boolean;
	externalPanels?: boolean;
	panelContent?: Snippet;
	onOpenPanel?: (panel: string) => void;
};

/** The mounted chat is retained when the output view changes. */
export type WorkspaceChatHandle = {
	openPanel(panel: string, notify?: boolean): void;
	focusSessionSearch(): void;
	focusComposer(): void;
	newConversation(): Promise<void>;
};

/** Bindable preferences are passive and cannot grant runtime authority. */
export type WorkspaceChatComponent = Component<
	WorkspaceChatProps,
	WorkspaceChatHandle,
	'navigationOpen' | 'sidebarWidth' | 'inspectorWidth' | 'panelContent'
>;

/** Passive origin metadata; it never grants tool execution authority. */
export type WorkspaceOutputOrigin = {
	id: string;
	label: string;
	color: string;
	result?: unknown;
	resultOnly?: boolean;
};

export type WorkspaceChatPresentation = {
	modes: readonly ('chat' | 'work' | 'compare')[];
	defaultMode?: 'chat' | 'work' | 'compare';
	comparisonKinds?: readonly ('models' | 'processors')[];
	modeLabels?: Record<string, string>;
	maxComparisonPanels?: number;
	comparisonAddLabel?: string;
};
/** Consumer presentation preferences only; no model or permission defaults. */
export function resolveChatPresentation(
	config?: WorkspaceChatPresentation
): WorkspaceChatPresentation {
	const modes = [...new Set<'chat' | 'work' | 'compare'>(config?.modes ?? ['chat'])].filter(
		(value) => ['chat', 'work', 'compare'].includes(value)
	);
	if (!modes.length) modes.push('chat');
	const comparisonKinds = [...new Set(config?.comparisonKinds ?? [])].filter((value) =>
		['models', 'processors'].includes(value)
	);
	return {
		modes,
		defaultMode: modes.includes(config?.defaultMode ?? 'chat')
			? (config?.defaultMode ?? 'chat')
			: modes[0],
		comparisonKinds,
		...(config?.modeLabels ? { modeLabels: config.modeLabels } : {}),
		...(config?.maxComparisonPanels ? { maxComparisonPanels: config.maxComparisonPanels } : {}),
		...(config?.comparisonAddLabel ? { comparisonAddLabel: config.comparisonAddLabel } : {})
	};
}
