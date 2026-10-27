<script lang="ts">
	import Blocks from '@lucide/svelte/icons/blocks';
	import Database from '@lucide/svelte/icons/database';
	import FileText from '@lucide/svelte/icons/file-text';
	import GitBranch from '@lucide/svelte/icons/git-branch';
	import Globe from '@lucide/svelte/icons/globe';
	import Terminal from '@lucide/svelte/icons/terminal';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$features/placeholders';
	import { groupCapabilities } from '../registry';
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

	const groups = groupCapabilities();
</script>

<nav
	class="flex h-full min-h-0 w-full flex-col gap-4 overflow-y-auto p-3"
	aria-label={t('capabilities')}
>
	{#each [{ key: 'priority_group', rows: groups.installed }, { key: 'context_group', rows: groups.available }] as group (group.key)}
		{#if group.rows.length > 0}
			<section class="flex flex-col gap-1">
				<h3 class="px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
					{t(group.key)}
				</h3>
				{#each group.rows as cap (cap.id)}
					{@const marker = state.getConnection(cap.id)}
					{@const Icon = ICONS[cap.icon] ?? Blocks}
					<Button
						variant="ghost"
						class="h-auto w-full justify-start gap-2 px-2 py-2 aria-[current=true]:bg-muted"
						aria-current={state.selectedId === cap.id ? 'true' : undefined}
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
						<span class="shrink-0 text-xs text-muted-foreground" data-connection={marker}>
							{t(MARKERS[marker])}
						</span>
					</Button>
				{/each}
			</section>
		{/if}
	{/each}
</nav>
