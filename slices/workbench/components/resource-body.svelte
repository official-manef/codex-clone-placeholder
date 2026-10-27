<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Input from '$lib/components/ui/input/input.svelte';
	import LoadingState from '$lib/components/app-ui/loading-state.svelte';
	import SignalBanner from '$lib/components/app-ui/signal-banner.svelte';
	import { t, tp } from '$features/placeholders';
	import type { Tab } from '../types';

	let {
		tab,
		recentEmpty = false,
		onretry,
		onedit
	}: {
		tab: Tab | null;
		/** Scopes emptiness to the recent list, not to the whole landing (AC18). */
		recentEmpty?: boolean;
		onretry?: () => void;
		/** Local edit marks the tab dirty (AC09); no backend yet. */
		onedit?: () => void;
	} = $props();

	const suggestions = [1, 2, 3, 4];
	const recents = [1, 2, 3, 4];
</script>

<div class="min-h-0 flex-1 overflow-y-auto p-4">
	{#if tab}
		<!-- ponytail: local edit surface only; a real document model replaces it.
		     It sits above the landing surface so an idle tab is editable too (AC09). -->
		<div class="space-y-2">
			<p class="text-sm">{t('resource_start_title')}</p>
			<Input
				data-slot="tab-editor"
				aria-label={t('resource_location')}
				placeholder={t('resource_location')}
				oninput={() => onedit?.()}
			/>
		</div>
	{/if}
	{#if tab === null || tab.status === 'idle'}
		<section class="space-y-4">
			<h2 class="text-base font-semibold">{t('resource_start_title')}</h2>
			<div class="space-y-2">
				<h3 class="text-sm font-medium">{t('capabilities')}</h3>
				<ul class="space-y-1 text-sm text-[var(--shell-fg-muted)]">
					{#each suggestions as n (n)}
						<li>{tp('suggested_resource', n)}</li>
					{/each}
				</ul>
			</div>
			<div class="space-y-2">
				<h3 class="text-sm font-medium">{t('resource_history')}</h3>
				{#if recentEmpty}
					<p class="text-sm text-[var(--shell-fg-muted)]">{t('empty_state')}</p>
				{:else}
					<ul class="space-y-1 text-sm text-[var(--shell-fg-muted)]">
						{#each recents as n (n)}
							<li>{tp('recent_resource', n)}</li>
						{/each}
					</ul>
				{/if}
			</div>
		</section>
	{:else if tab.status === 'loading'}
		<LoadingState label={t('loading_state')} />
	{:else if tab.status === 'error'}
		<SignalBanner title={t('error_state')}>
			<!-- A failed save already reports its own copy next to the decision (AC09); repeating
			     it here would render the same token twice. -->
			{#if tab.error && tab.error.code !== 'save_failed'}
				<p>{t(tab.error.messageKey)}</p>
			{/if}
			{#snippet action()}
				<!-- ponytail: retry stays disabled until a refetch exists; a no-op button lies. -->
				<Button variant="ghost" disabled={!onretry} onclick={onretry}>
					{t('resource_reload')}
				</Button>
			{/snippet}
		</SignalBanner>
	{/if}
</div>
