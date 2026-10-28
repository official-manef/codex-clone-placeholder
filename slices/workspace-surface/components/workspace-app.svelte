<script lang="ts">
	import { WorkspaceShell, createFeatureRegistry } from '$features/workspace-shell';
	import type { ApprovalControlConfig } from '$features/workspace-shell';
	import type { WorkspaceMenuItem } from '$features/workspace-shell';
	import Chat from '#lib/views/Chat.svelte';
	import RuntimeControls from '#lib/RuntimeControls.svelte';
	import SettingsWindow from '#lib/SettingsWindow.svelte';
	import SiteHeader from '#lib/SiteHeader.svelte';
	import WorkspaceLauncher from '#lib/WorkspaceLauncher.svelte';
	import { onMount } from 'svelte';
	import { CHAT_OUTPUTS, LAUNCHER_CONFIG, PROJECT, RAIL_VIEWS, SECTIONS } from '#lib/registry.js';
	import { ALWAYS_ENABLED, resolveEnabled } from '#lib/feature_access.js';
	import { featureSettings } from '#lib/feature_settings.svelte.js';
	import { backendSelection, workspaceRuntime } from '#lib/template_runtime_adapter.js';
	import { workspacePersistence } from '#lib/workspace_persistence.js';
	import {
		canvasPresentation,
		chatAppearance,
		chatPanels,
		chatPresentation,
		chatUI,
		fileMenuViews,
		launcherId,
		settingsMenu,
		workspaceLabels
	} from '#lib/workspace_routes.js';

	const openDocumentation = (path: string) =>
		window.open(`${PROJECT.repo}/${path}`, '_blank', 'noopener,noreferrer');

	const menuContributions: Partial<
		Record<'file' | 'edit' | 'view' | 'help', readonly WorkspaceMenuItem[]>
	> = {
		file: [
			{
				id: 'new-window',
				label: 'New window',
				onSelect: () =>
					window.open(
						window.location.href,
						'_blank',
						'noopener,noreferrer,popup,width=1280,height=860'
					)
			}
		],
		view: [
			{
				id: 'browser-menu',
				label: 'Browser',
				separatorBefore: true,
				children: [
					{
						id: 'browser-open',
						label: 'Open browser',
						onSelect: () => (location.hash = 'browser')
					},
					{
						id: 'browser-automation',
						label: 'Browser automation',
						onSelect: () => (location.hash = 'apps')
					}
				]
			}
		],
		help: [
			{
				id: 'documentation',
				label: 'Documentation',
				separatorBefore: true,
				onSelect: () => openDocumentation('#readme')
			},
			{ id: 'status', label: 'System status', onSelect: () => (location.hash = 'backends') },
			{
				id: 'about',
				label: `About ${PROJECT.displayName}`,
				separatorBefore: true,
				onSelect: () => openDocumentation('#readme')
			}
		]
	};

	// Registry metadata selects what is enabled; it grants no authority. The Tools screen
	// owns the per-feature toggle, so the registry is recreated when that selection changes.
	const registry = $derived(
		createFeatureRegistry({
			features: [...SECTIONS, ...CHAT_OUTPUTS],
			enabledIds: resolveEnabled(featureSettings.enabled, featureSettings.surface),
			requiredIds: ALWAYS_ENABLED
		})
	);
	const sections = $derived(SECTIONS.filter((feature) => registry.get(feature.id)));
	const auxiliaryViews = $derived(CHAT_OUTPUTS.filter((feature) => registry.get(feature.id)));

	// Resolve the surface and the stored tool selection once, after hydration.
	onMount(() => featureSettings.start());

	// Local approval policy, expressed as UI only. The template has no executor to gate.
	const approval: ApprovalControlConfig = {
		modes: [
			{
				id: 'review',
				label: 'Review each action',
				description: 'This template has no executor; approvals are shown, never applied.'
			}
		],
		value: 'review',
		label: 'How are actions approved?'
	};
</script>

<WorkspaceShell
	displayName={PROJECT.displayName}
	labels={workspaceLabels}
	launcher={{ ...LAUNCHER_CONFIG, id: launcherId }}
	{chatPanels}
	{chatPresentation}
	{chatAppearance}
	{chatUI}
	{settingsMenu}
	{fileMenuViews}
	{canvasPresentation}
	{sections}
	{auxiliaryViews}
	railViews={RAIL_VIEWS}
	runtime={workspaceRuntime}
	{backendSelection}
	persistence={workspacePersistence}
	chat={Chat}
	runtimeControls={RuntimeControls}
	siteHeader={SiteHeader}
	settingsWindow={SettingsWindow}
	workspaceLauncher={WorkspaceLauncher}
	{approval}
	{menuContributions}
/>
