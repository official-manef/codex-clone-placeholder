<script lang="ts">
	import { t } from '$features/placeholders';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import ContextSummary from './context-summary.svelte';

	let {
		summaryOpen = false,
		ontogglesummary
	}: { summaryOpen?: boolean; ontogglesummary?: () => void } = $props();

	const OVERFLOW_ITEMS = ['menu_b', 'menu_c', 'menu_d'] as const;
</script>

<header class="flex min-h-0 items-center gap-3 border-b border-border px-4 py-2.5">
	<div class="flex min-w-0 flex-1 flex-col">
		<h2 class="truncate text-sm font-semibold">{t('object_title_01')}</h2>
		<p class="truncate text-xs" style="color: var(--shell-fg-muted)">{t('context_name')}</p>
	</div>
	<!-- Context summary trigger is the Popover's own Button, so Escape returns focus to it (AC11). -->
	<ContextSummary
		open={summaryOpen}
		onopenchange={(next) => {
			if (next !== summaryOpen) ontogglesummary?.();
		}}
	/>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon-sm" aria-label={t('menu_a')}>
					<Ellipsis />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{#each OVERFLOW_ITEMS as key (key)}
				<DropdownMenuItem disabled>{t(key)}</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
</header>
