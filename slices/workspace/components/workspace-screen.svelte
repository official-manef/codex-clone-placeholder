<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { t } from '$features/placeholders';
	import { createWorkspaceState, derivePopulated } from '../state.svelte';
	import type { ComposerSlot, WorkspaceScreenProps } from '../types';
	import ContextHeader from './context-header.svelte';
	import MessageTimeline from './message-timeline.svelte';
	import UnstartedSurface from './unstarted-surface.svelte';

	// `children` hosts the composer slice, `secondary` the workbench slice. Both stay optional
	// so this slice still renders standalone; the route decides which slices mount.
	let {
		chatId,
		children,
		secondary
	}: WorkspaceScreenProps & {
		children?: Snippet<[ComposerSlot]>;
		secondary?: Snippet;
	} = $props();

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

	// AC04: the composer slice never renders a message list, so the host appends the entry.
	const slot: ComposerSlot = {
		appendDraft(text: string): void {
			if (!text.trim()) return;
			state.appendEntry({
				id: crypto.randomUUID(),
				kind: 'user',
				contentKeys: ['input_content_01'],
				createdAt: Date.now(),
				durationMs: null,
				status: 'complete'
			});
			state.setPopulated(true);
		}
	};
</script>

<section class="flex min-h-0 flex-1 flex-col" aria-label={t('workspace_name')}>
	<!-- Below 850px the two regions stack; from 850px they sit side by side in the shell grid,
	     where the secondary region is a sibling column and never clips the primary one. -->
	<div class="flex min-h-0 flex-1 flex-col min-[850px]:flex-row">
		<div class="flex min-h-0 min-w-0 flex-1 flex-col">
			{#if state.populated}
				<ContextHeader
					summaryOpen={state.contextSummary === 'shown'}
					ontogglesummary={() => state.toggleContextSummary()}
				/>
				<MessageTimeline entries={state.entries} />
				<!-- composer slice mounts here (slices/composer) -->
				<div class="workspace-composer-slot p-2" data-slot="composer">
					{@render children?.(slot)}
				</div>
			{:else}
				<!-- unstarted surface owns the composer slot in C2 -->
				<UnstartedSurface mode={state.mode} onmodechange={(next) => state.setMode(next)}>
					{@render children?.(slot)}
				</UnstartedSurface>
			{/if}
		</div>
		{#if secondary}
			<!-- workbench slice mounts here (slices/workbench). Below 850px it stacks under the
			     primary region in a bounded band; from 850px it becomes the secondary column. -->
			<div
				class="workspace-secondary-slot h-[45dvh] min-h-0 w-full min-[850px]:h-auto min-[850px]:w-[46%] min-[850px]:shrink-0 min-[1100px]:w-[40%] min-[1100px]:min-w-[390px]"
				data-slot="secondary"
			>
				{@render secondary()}
			</div>
		{/if}
	</div>
</section>
