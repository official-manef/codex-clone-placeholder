<script lang="ts">
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$features/placeholders';
	import type { Composition } from '../types';

	const COMPOSITIONS: readonly Composition[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
</script>

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm" class="h-11 sm:h-7" aria-label={t('menu_d')}>
				{t('menu_c')}
			</Button>
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="start">
		<DropdownMenuLabel>{t('menu_d')}</DropdownMenuLabel>
		{#each COMPOSITIONS as composition (composition)}
			<DropdownMenuItem disabled>{composition}</DropdownMenuItem>
		{/each}
	</DropdownMenuContent>
</DropdownMenu>
