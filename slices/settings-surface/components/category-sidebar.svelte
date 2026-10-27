<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$features/placeholders';
	import type { SettingSection } from '../types';

	let {
		query,
		matches,
		empty,
		noMatch,
		activeId,
		onquery,
		onselect
	}: {
		query: string;
		matches: readonly SettingSection[];
		empty: boolean;
		noMatch: boolean;
		activeId: string;
		onquery: (next: string) => void;
		onselect: (id: string) => void;
	} = $props();

	const groups = $derived(
		[
			{ heading: 'priority_group', group: 'configuration' },
			{ heading: 'context_group', group: 'integration' },
			{ heading: 'recent_group', group: 'advanced' }
		].map(({ heading, group }) => ({
			heading,
			items: matches.filter((item) => item.group === group)
		}))
	);
</script>

<nav class="flex min-h-0 w-60 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border p-3">
	<Input
		type="search"
		value={query}
		aria-label={t('settings_search_placeholder')}
		placeholder={t('settings_search_placeholder')}
		oninput={(event) => onquery(event.currentTarget.value)}
	/>

	{#if noMatch}
		<p class="shell-fg-muted text-sm">{t('no_match_state')}</p>
	{:else if empty}
		<p class="shell-fg-muted text-sm">{t('empty_state')}</p>
	{:else}
		{#each groups as { heading, items } (heading)}
			{#if items.length > 0}
				<div class="flex flex-col gap-1">
					<span class="shell-fg-muted text-xs">{t(heading)}</span>
					{#each items as item (item.id)}
						<Button
							variant="ghost"
							size="sm"
							class="justify-start"
							aria-current={item.id === activeId ? 'page' : undefined}
							onclick={() => onselect(item.id)}>{t(item.labelKey)}</Button
						>
					{/each}
				</div>
			{/if}
		{/each}
	{/if}
</nav>
