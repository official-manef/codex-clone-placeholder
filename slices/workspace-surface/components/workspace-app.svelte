<script lang="ts">
	import { WorkspaceShell, createFeatureRegistry } from '$features/workspace-shell';
	import type { WorkspaceMenuItem } from '$features/workspace-shell';
	import { ChatView, createTemplatePersistence } from '$features/chat';
	import { createLocalRuntime } from '../runtime';
	import {
		AUXILIARY_VIEWS,
		CHAT_PRESENTATION,
		FEATURES,
		LAUNCHER,
		PROJECT,
		RAIL_VIEWS
	} from '../registry';

	// Registry metadata only selects what is enabled; it grants no authority.
	const registry = createFeatureRegistry({ features: FEATURES });
	const enabled = registry.features;
	const sections = enabled;
	const auxiliaryViews = enabled.filter((item) => AUXILIARY_VIEWS.includes(item.id));
	const railViews = RAIL_VIEWS.filter((id) => registry.get(id));

	const runtime = createLocalRuntime();
	const persistence = createTemplatePersistence();

	const menuContributions: Partial<
		Record<'file' | 'edit' | 'view' | 'help', readonly WorkspaceMenuItem[]>
	> = {
		help: [
			{
				id: 'documentation',
				label: 'Documentation',
				separatorBefore: true,
				onSelect: () => window.open(`${PROJECT.repo}#readme`, '_blank', 'noopener,noreferrer')
			}
		]
	};
</script>

<WorkspaceShell
	displayName={PROJECT.displayName}
	launcher={{ ...LAUNCHER, quick: [...LAUNCHER.quick], suggested: [...LAUNCHER.suggested] }}
	{sections}
	{auxiliaryViews}
	{railViews}
	{runtime}
	{persistence}
	{menuContributions}
	chat={ChatView}
	chatPresentation={CHAT_PRESENTATION}
/>
