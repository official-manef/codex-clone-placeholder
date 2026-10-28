import type { ChatPanelRoute } from '$features/workspace-shell';
import type { WorkspaceLabels } from '$features/workspace-shell';

/**
 * Consumer-side configuration for the shell. This file is Laya's
 * `laya_workspace_routes.ts`, re-pointed at the template: same shape, its own identity.
 *
 * Everything here is presentation. None of it grants authority; a product that adds a
 * backend enforces capability and approval there.
 */

export const chatPanels: readonly ChatPanelRoute[] = [
	{ id: 'chat-tools', panel: 'tools', aliases: ['mcp', 'skills'] },
	{ id: 'chat-settings', panel: 'models' },
	{ id: 'chat-session', panel: 'utils' }
];

export const settingsMenu = {
	primary: 'chat-settings',
	integrations: 'chat-tools',
	help: 'faq',
	setup: 'setup'
};

export const launcherId = 'workspace-home';

export const fileMenuViews = [
	{ id: 'files', label: 'Open files…', command: 'openFiles' },
	{
		id: 'files',
		label: 'Open folder…',
		command: 'openFolder',
		shortcut: 'Ctrl+O',
		binding: { key: 'o', ctrl: true, allowInEditable: true }
	},
	{ id: 'browser', label: 'Open browser' }
];

export const canvasPresentation = {
	selfHeaderIds: ['files', 'browser'],
	hideComputeIds: ['apps']
};

/** Connection copy. The template runs in the browser, so it says that. */
export const workspaceLabels: Partial<WorkspaceLabels> = {
	statusOnline: 'Local workspace',
	hostedConnection: 'Local connection',
	connectedTooltip: 'Running in this browser',
	disconnectedTooltip: 'Browser session ended',
	connectionFailed: 'The local workspace could not be reached.',
	connectionLost: 'The local workspace disconnected.',
	moreTools: 'More tools',
	moreToolsTitle: 'More tools'
};

export const chatPresentation = {
	modes: ['chat', 'work', 'compare'],
	modeLabels: { chat: 'Chat', work: 'Work', compare: 'Compare' },
	maxComparisonPanels: 3,
	comparisonAddLabel: 'Add comparison',
	defaultMode: 'chat',
	comparisonKinds: ['models', 'processors']
} as const;

/** Theme choices. Presentation only; the shell owns the bounded defaults. */
export const chatAppearance = {
	userBubbleBackground: '#4f3282',
	userBubbleColor: '#ffffff',
	bubbleRadius: 17,
	bubblePadding: 14,
	userMessageWidth: 80,
	actionSize: 28,
	headerHeight: 51,
	modeHeight: 52,
	entryWidth: 640,
	conversationWidth: 738,
	rowHeight: 34,
	rowRadius: 8,
	comparisonMinWidth: 220,
	modePlacement: 'below-header',
	actionVisibility: 'hover',
	rowActionVisibility: 'hover',
	candidateColors: ['#b998f2', '#6bcec0', '#edb46b']
} as const;

/** Menu availability and composer contributions, separate from the shell. */
export const chatUI = {
	modeSelection: 'empty',
	modeCommands: true,
	pickerTitle: 'Add to chat',
	attachmentLabel: 'Files and folders',
	pickerEmptyLabel: 'No matching tool or plugin. Try another name.',
	recentsLabel: 'Recents',
	pickerTabs: [
		{
			id: 'tools',
			label: 'Tools /',
			marker: '/',
			kinds: ['action', 'mode', 'tool', 'skill', 'category']
		},
		{ id: 'plugins', label: 'Plugins @', marker: '@', kinds: ['plugin', 'connection', 'category'] }
	],
	recentsActions: [
		{ id: 'options', label: 'Recents options', icon: 'more' },
		{ id: 'filter', label: 'Filter chats', icon: 'filter' },
		{ id: 'new', label: 'New chat', icon: 'edit' }
	],
	sessionMenu: [
		{ id: 'rename', label: 'Rename', icon: 'edit', shortcut: 'Ctrl+Alt+R' },
		{ id: 'pin', label: 'Pin', icon: 'pin', shortcut: 'Ctrl+Alt+P' },
		{
			id: 'section',
			label: 'Section',
			icon: 'list',
			children: [
				{ id: 'section-pinned', label: 'Pinned' },
				{ id: 'section-recents', label: 'Recents' }
			]
		},
		{
			id: 'lock',
			label: 'Lock chat',
			icon: 'lock',
			disabledReason: 'This runtime does not enforce session locks.'
		},
		{
			id: 'share',
			label: 'Share',
			icon: 'share',
			separator: true,
			disabledReason: 'This local runtime does not provide share links.'
		},
		{
			id: 'open',
			label: 'Open in browser',
			icon: 'globe',
			separator: true,
			disabledReason: 'Individual session links are not available.'
		},
		{
			id: 'archive',
			label: 'Archive',
			icon: 'archive',
			separator: true,
			disabledReason: 'Server-side session archiving is not available.'
		},
		{ id: 'export', label: 'Export chat', icon: 'file' },
		{ id: 'delete', label: 'Delete', icon: 'trash', destructive: true },
		{
			id: 'move-project',
			label: 'Move to project',
			icon: 'folder',
			separator: true,
			disabledReason: 'This runtime has no chat project membership.'
		},
		{
			id: 'remove-project',
			label: 'Remove from project',
			icon: 'folder',
			disabledReason: 'This runtime has no chat project membership.'
		}
	]
} as const;
