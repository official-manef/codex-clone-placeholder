<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/ui/button';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import type { Attachment } from '../types';

	let { attachments, onremove }: { attachments: Attachment[]; onremove: (id: string) => void } =
		$props();
</script>

<div class="flex flex-wrap gap-2" role="list">
	{#each attachments as attachment (attachment.id)}
		<div
			role="listitem"
			class="flex max-w-60 items-center gap-2 rounded-lg border bg-muted/40 px-2 py-1.5"
			data-status={attachment.status}
		>
			{#if attachment.previewUrl}
				<img
					src={attachment.previewUrl}
					alt={attachment.name}
					class="size-8 shrink-0 rounded object-cover"
				/>
			{/if}
			<div class="min-w-0">
				<p class="truncate text-xs">{attachment.name}</p>
				{#if attachment.status === 'failed' && attachment.reasonKey}
					<p class="truncate text-xs text-destructive">{t(attachment.reasonKey)}</p>
				{/if}
			</div>
			<Button
				variant="ghost"
				size="icon-xs"
				aria-label={GENERIC_LABELS[1]}
				onclick={() => onremove(attachment.id)}
			>
				<X class="size-3" />
			</Button>
		</div>
	{/each}
</div>
