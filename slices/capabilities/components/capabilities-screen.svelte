<script lang="ts">
	import { t } from '$features/placeholders';
	import { getCapability } from '../registry';
	import { createCapabilitiesState } from '../state.svelte';
	import CapabilityDetail from './capability-detail.svelte';
	import CapabilityList from './capability-list.svelte';

	const state = createCapabilitiesState();
	const selected = $derived(state.selectedId ? getCapability(state.selectedId) : undefined);
</script>

<section class="flex min-h-0 flex-1">
	<div class="flex min-h-0 w-full flex-1 flex-col">
		<header class="shrink-0 px-4 pt-4">
			<h1 class="text-xl font-semibold">{t('capabilities')}</h1>
		</header>

		<div class="flex min-h-0 flex-1">
			<div
				class="min-h-0 w-full shrink-0 overflow-hidden border-border min-[850px]:w-[18rem] min-[850px]:border-r {selected
					? 'max-[850px]:hidden'
					: ''}"
			>
				<CapabilityList {state} />
			</div>

			<div class="min-h-0 min-w-0 flex-1 overflow-y-auto {selected ? '' : 'max-[850px]:hidden'}">
				{#if selected}
					<CapabilityDetail capability={selected} {state} onback={() => state.select('')} />
				{:else}
					<p class="p-4 text-sm text-muted-foreground">{t('empty_state')}</p>
				{/if}
			</div>
		</div>
	</div>
</section>
