import type { Component } from 'svelte';
import type { FeatureDescriptor } from '$features/workspace-shell';

/**
 * Consumer-side feature catalogue. Metadata only — registering a feature never grants
 * authority, and a missing loader must not create a dead navigation entry.
 *
 * Screens are lazily imported so the shell keeps initial SSR and only ships the code a
 * visitor actually opens.
 */
export const FEATURES: readonly FeatureDescriptor<Component>[] = [
	{ id: 'chat', label: 'Chat', icon: 'message', group: 'Workspace' },
	{
		id: 'notes',
		label: 'Notes',
		icon: 'file',
		group: 'Workspace',
		loadScreen: () => import('./screens/notes-screen.svelte')
	},
	{
		id: 'files',
		label: 'Files',
		icon: 'folder',
		group: 'Workspace',
		loadScreen: () => import('./screens/files-screen.svelte')
	},
	{
		id: 'settings',
		label: 'Settings',
		icon: 'sliders',
		group: 'Workspace',
		placement: 'settings',
		navigationRole: 'settings',
		loadScreen: () => import('./screens/settings-screen.svelte')
	},
	{
		id: 'overview',
		label: 'Start here',
		icon: 'sparkles',
		group: 'Explore',
		navigationRole: 'explore',
		loadScreen: () => import('./screens/notes-screen.svelte')
	},
	{
		id: 'shortcuts',
		label: 'Keyboard shortcuts',
		icon: 'help',
		group: 'Explore',
		navigationRole: 'explore',
		loadScreen: () => import('./screens/notes-screen.svelte')
	}
];

/** Views reachable from the rail, in order. Unknown ids are dropped, not rendered. */
export const RAIL_VIEWS = ['chat', 'notes', 'files', 'settings'] as const;

/** Auxiliary views open in the output region only, never as rail destinations. */
export const AUXILIARY_VIEWS: readonly string[] = ['overview', 'shortcuts'];

export const PROJECT = {
	displayName: 'Workspace Template',
	repo: 'https://github.com/rahmanef63/codex-clone-placeholder'
} as const;

/** Launcher preferences; ids are validated against enabled features before render. */
export const LAUNCHER = {
	quick: ['notes', 'files'],
	suggested: ['settings', 'shortcuts'],
	recentLabel: 'Recently visited'
} as const;

/** Chat presentation this consumer opts into. Modes are UI only, never authority. */
export const CHAT_PRESENTATION = {
	modes: ['chat'],
	modeLabels: { chat: 'Chat' },
	defaultMode: 'chat'
} as const;
