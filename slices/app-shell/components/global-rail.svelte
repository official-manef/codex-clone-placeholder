<script lang="ts">
	import { goto } from '$app/navigation';
	import type { ResolvedPathname } from '$app/types';
	import { Blocks, EllipsisVertical, MessageSquare, Settings } from '@lucide/svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$features/placeholders';
	import { DESTINATIONS } from '../registry';
	import { getShellState } from '../state.svelte';
	import type { Destination } from '../types';

	const shell = getShellState();

	const ICONS: Record<string, typeof MessageSquare> = {
		blocks: Blocks,
		'message-square': MessageSquare,
		settings: Settings
	};

	const OVERFLOW_ITEMS = [
		'rail_overflow_item_01',
		'rail_overflow_item_02',
		'rail_overflow_item_03'
	];

	function select(destination: Destination): void {
		shell.setActiveArea(destination.area);
		// Routes land in the integration step; casting keeps the registry free of kit types.
		goto(destination.route as ResolvedPathname).catch(() => {
			// ponytail: static-route navigation has no recoverable failure UI; add with real loaders.
		});
	}
</script>

<nav class="shell-rail items-center gap-1 py-2" aria-label={t('rail_overflow')}>
	{#each DESTINATIONS as destination (destination.id)}
		{@const Icon = ICONS[destination.icon] ?? MessageSquare}
		<Button
			variant="ghost"
			size="icon"
			class="size-11 sm:size-8"
			aria-label={t(destination.labelKey)}
			aria-current={shell.activeArea === destination.area ? 'page' : undefined}
			onclick={() => select(destination)}
		>
			<Icon class="size-4" />
		</Button>
	{/each}
	<div class="flex-1"></div>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon"
					class="size-11 sm:size-8"
					aria-label={t('rail_overflow')}
				>
					<EllipsisVertical class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start">
			{#each OVERFLOW_ITEMS as key (key)}
				<DropdownMenuItem disabled>{t(key)}</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
</nav>
