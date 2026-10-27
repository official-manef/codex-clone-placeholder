<script lang="ts">
	import { t, tp } from '$features/placeholders';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import type { SummaryGroup } from '../types';

	let { open = false, onopenchange }: { open?: boolean; onopenchange?: (next: boolean) => void } =
		$props();

	/** AC18: `sources` keeps a section-scoped empty state while the other groups are populated. */
	const GROUPS: readonly SummaryGroup[] = [
		{
			id: 'related_records',
			itemKeys: [
				tp('related_records_item', 1),
				tp('related_records_item', 2),
				tp('related_records_item', 3),
				tp('related_records_item', 4)
			]
		},
		{
			id: 'outputs',
			itemKeys: [
				tp('outputs_item', 1),
				tp('outputs_item', 2),
				tp('outputs_item', 3),
				tp('outputs_item', 4)
			]
		},
		{
			id: 'processes',
			itemKeys: [
				tp('processes_item', 1),
				tp('processes_item', 2),
				tp('processes_item', 3),
				tp('processes_item', 4)
			]
		},
		{ id: 'sources', itemKeys: [] }
	];
</script>

<Popover {open} onOpenChange={(next) => onopenchange?.(next)}>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm" aria-haspopup="dialog">
				{t('menu_d')}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="end" class="w-80">
		<div class="flex flex-col gap-3">
			{#each GROUPS as group, index (group.id)}
				{#if index > 0}<Separator />{/if}
				<section aria-label={t(group.id)} class="flex flex-col gap-1.5">
					<h3
						class="text-xs font-semibold tracking-wide uppercase"
						style="color: var(--shell-fg-muted)"
					>
						{t(group.id)}
					</h3>
					{#if group.itemKeys.length === 0}
						<p class="text-sm" style="color: var(--shell-fg-muted)">{t('empty_state')}</p>
					{:else}
						<ul class="flex flex-col gap-1">
							{#each group.itemKeys as itemKey (itemKey)}
								<li class="truncate text-sm">{t(itemKey)}</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/each}
		</div>
	</PopoverContent>
</Popover>
