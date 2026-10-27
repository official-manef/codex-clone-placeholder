<script lang="ts">
	import { t } from '$features/placeholders';
	import { activeTab, createWorkbenchState, effectiveLayout } from '../state.svelte';
	import type { Tab } from '../types';
	import Button from '$lib/components/ui/button/button.svelte';
	import PanelRight from '@lucide/svelte/icons/panel-right';
	import ResourceBody from './resource-body.svelte';
	import ResourceToolbar from './resource-toolbar.svelte';
	import Splitter from './splitter.svelte';
	import TabStrip from './tab-strip.svelte';

	// ponytail: `?saveOutcome=failed` makes the AC09 failure path browser-reachable before a
	// real backend exists; drop the query switch when persistence can actually fail.
	const saveOutcome =
		typeof window !== 'undefined' &&
		new URLSearchParams(window.location.search).get('saveOutcome') === 'failed'
			? 'failed'
			: 'saved';
	const workbench = createWorkbenchState({ saveOutcome });

	// SSR renders desktop; the effects replace both numbers once mounted.
	let viewportWidth = $state(1440);
	let containerWidth = $state(1440);
	let sized = false;

	const layout = $derived(effectiveLayout(viewportWidth, workbench.layout));
	// Hidden and closed are independent: both collapse, only closed came from dropping tabs (AC08).
	const collapsed = $derived(workbench.hidden || layout === 'closed');
	const current = $derived(activeTab(workbench.tabs, workbench.activeTabId));

	$effect(() => {
		const media = window.matchMedia('(min-width: 1100px)');
		const sync = () => (viewportWidth = window.innerWidth);
		sync();
		media.addEventListener('change', sync);
		return () => media.removeEventListener('change', sync);
	});

	// Start near the 40% split the spec asks for once the real viewport is known.
	$effect(() => {
		if (sized) return;
		sized = true;
		workbench.setSplitWidth(Math.round(containerWidth * 0.4), containerWidth);
	});

	// Reopen covers both collapse causes: hidden is a toggle, closed needs the layout back (AC08).
	function show(): void {
		if (workbench.hidden) workbench.toggleHidden();
		if (workbench.layout === 'closed') workbench.setLayout('split');
	}

	// ponytail: demo tab, no resource model yet; replace when tabs come from a query.
	function addDemoTab(): void {
		const tab: Tab = {
			id: crypto.randomUUID(),
			kind: 'browser',
			titleKey: 'resource_start_title',
			resourceId: null,
			status: 'idle',
			dirty: false,
			ownerChatId: null,
			lastFocusedAt: Date.now(),
			error: null
		};
		workbench.addTab(tab);
	}
</script>

<aside
	id="workbench-region"
	aria-label={t('resource_start_title')}
	data-layout={layout}
	bind:clientWidth={containerWidth}
	class="h-full min-h-0 bg-[var(--shell-surface)]"
>
	{#if collapsed}
		<div class="flex h-full w-9 items-start justify-center pt-2">
			<Button
				variant="ghost"
				size="icon"
				class="size-11 sm:size-8"
				aria-label={t('resource_show')}
				aria-expanded="false"
				aria-controls="workbench-region"
				onclick={show}
			>
				<PanelRight />
			</Button>
		</div>
	{:else}
		<div class="flex h-full min-h-0">
			{#if layout === 'split'}
				<Splitter
					width={workbench.splitWidth}
					{containerWidth}
					onchange={(next) => workbench.setSplitWidth(next, containerWidth)}
				/>
			{/if}
			<div
				class="flex min-h-0 min-w-0 flex-col {layout === 'split' ? 'shrink-0' : 'flex-1'}"
				style:width={layout === 'split' ? `${workbench.splitWidth}px` : undefined}
			>
				<ResourceToolbar />
				<TabStrip
					tabs={workbench.tabs}
					activeTabId={workbench.activeTabId}
					hidden={workbench.hidden}
					onactivate={(id) => workbench.activateTab(id)}
					onclose={(id, decision) => workbench.closeTab(id, decision)}
					onsave={(id) => workbench.commitTab(id)}
					onadd={addDemoTab}
					ontoggle={() => workbench.toggleHidden()}
				/>
				<ResourceBody
					tab={current}
					onretry={() => {
						if (!current) return;
						current.status = 'idle';
						current.error = null;
					}}
					onedit={() => {
						if (!current) return;
						workbench.markDirty(current.id, true);
					}}
				/>
			</div>
		</div>
	{/if}
</aside>
