<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$features/placeholders';
	import { createWorkspaceState, derivePopulated } from '../state.svelte';
	import type { WorkspaceScreenProps } from '../types';
	import ContextHeader from './context-header.svelte';
	import MessageTimeline from './message-timeline.svelte';
	import UnstartedSurface from './unstarted-surface.svelte';

	let { chatId }: WorkspaceScreenProps = $props();

	// Initial slice only; later chat switches flow through the route, which remounts the screen.
	const state = createWorkspaceState(untrack(() => chatId));

	// D04: `populated` follows the selected chat; entries never un-populate an existing chat.
	$effect(() => {
		state.setPopulated(
			derivePopulated(
				chatId,
				untrack(() => state.entries.length)
			)
		);
	});
</script>

<section class="flex min-h-0 flex-1 flex-col" aria-label={t('workspace_name')}>
	{#if state.populated}
		<ContextHeader
			summaryOpen={state.contextSummary === 'shown'}
			ontogglesummary={() => state.toggleContextSummary()}
		/>
		<MessageTimeline entries={state.entries} />
		<!-- composer slice mounts here (slices/composer) -->
		<div class="workspace-composer-slot" data-slot="composer"></div>
	{:else}
		<!-- unstarted surface owns the composer slot in C2 -->
		<UnstartedSurface mode={state.mode} onmodechange={(next) => state.setMode(next)} />
	{/if}
</section>
