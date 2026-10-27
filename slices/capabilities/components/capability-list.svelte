<script lang="ts">
	import Blocks from '@lucide/svelte/icons/blocks';
	import Database from '@lucide/svelte/icons/database';
	import FileText from '@lucide/svelte/icons/file-text';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Globe from '@lucide/svelte/icons/globe';
	import Terminal from '@lucide/svelte/icons/terminal';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$features/placeholders';
	import { CAPABILITIES } from '../registry';
	import type { CapabilitiesState } from '../state.svelte';
	import type { CapabilityConnection } from '../types';

	let { state }: { state: CapabilitiesState } = $props();

	const ICONS: Record<string, typeof Blocks> = {
		Blocks,
		Globe,
		FileText,
		Terminal,
		GitBranch,
		Database
	};

	const MARKERS: Record<CapabilityConnection, string> = {
		not_connected: 'capability_connection_none',
		pending: 'capability_connection_pending',
		connected: 'capability_connection_ready',
		failed: 'capability_connection_failed'
	};

	const filtered = $derived(state.filter(CAPABILITIES));
	const groups = $derived([
		{ key: 'priority_group', rows: filtered.matches.filter((cap) => cap.group === 'installed') },
		{ key: 'context_group', rows: filtered.matches.filter((cap) => cap.group === 'available') }
	]);
</script>

<nav
	class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-3"
	aria-label={t('capabilities')}
>
	<Input
		type="search"
		value={state.query}
		aria-label={t('settings_search_placeholder')}
		placeholder={t('settings_search_placeholder')}
		oninput={(event) => state.setQuery(event.currentTarget.value)}
	/>

	{#if filtered.noMatch}
		<p class="text-sm text-muted-foreground" data-list-state="no_match">{t('no_match_state')}</p>
	{:else if filtered.empty}
		<p class="text-sm text-muted-foreground" data-list-state="empty">{t('empty_state')}</p>
	{:else}
		{#each groups as group (group.key)}
			{#if group.rows.length > 0}
				<section class="flex flex-col gap-1">
					<h3 class="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{t(group.key)}
					</h3>
					{#each group.rows as cap (cap.id)}
						{@const connection = state.getConnection(cap.id)}
						{@const Icon = ICONS[cap.icon] ?? Blocks}
						<Button
							variant="ghost"
							class="h-auto w-full justify-start gap-2 px-2 py-2 aria-[current=true]:bg-muted"
							aria-current={state.selectedId === cap.id ? 'true' : undefined}
							data-connection={connection}
							data-error={state.getError(cap.id) ? 'true' : undefined}
							onclick={() => state.select(cap.id)}
						>
							<span
								class="grid size-7 shrink-0 place-items-center rounded-md"
								style="background: {cap.color}"
								aria-hidden="true"
							>
								<Icon class="size-4 text-background" />
							</span>
							<span class="min-w-0 flex-1 truncate text-left">{t(cap.nameKey)}</span>
							<Badge variant="outline">
								{t(cap.type === 'a' ? 'capability_type_a' : 'capability_type_b')}
							</Badge>
							<span class="shrink-0 text-xs text-muted-foreground">
								{t(state.getError(cap.id) ? 'capability_connection_failed' : MARKERS[connection])}
							</span>
						</Button>
					{/each}
				</section>
			{/if}
		{/each}
	{/if}
</nav>
