<script lang="ts">
	import { t } from '$features/placeholders';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import Input from '$lib/components/ui/input/input.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import RotateCw from '@lucide/svelte/icons/rotate-cw';

	// ponytail: history back/forward and reload are inert in the MVP (no navigation model).
	const overflowKeys = ['menu_b', 'menu_c', 'menu_d'];
</script>

<div
	class="flex items-center gap-1 border-b border-[var(--shell-border)] bg-[var(--shell-surface)] px-2 py-1"
>
	<Button
		variant="ghost"
		size="icon"
		class="size-11 sm:size-8"
		disabled
		aria-label={t('resource_history')}
	>
		<ArrowLeft />
	</Button>
	<Button
		variant="ghost"
		size="icon"
		class="size-11 sm:size-8"
		disabled
		aria-label={t('resource_history')}
	>
		<ArrowRight />
	</Button>
	<Input
		class="h-11 min-w-0 flex-1 sm:h-8"
		aria-label={t('resource_location')}
		placeholder={t('resource_location')}
	/>
	<Button variant="ghost" size="icon" class="size-11 sm:size-8" aria-label={t('resource_reload')}>
		<RotateCw />
	</Button>
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon"
					class="size-11 sm:size-8"
					aria-label={t('resource_overflow')}
					{...props}
				>
					<Ellipsis />
				</Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			{#each overflowKeys as key (key)}
				<DropdownMenuItem disabled>{t(key)}</DropdownMenuItem>
			{/each}
		</DropdownMenuContent>
	</DropdownMenu>
</div>
