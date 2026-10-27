<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$features/placeholders';
	import { SignalBanner } from '$lib/components/app-ui';
	import { Button } from '$lib/components/ui/button';
	import type { TimelineEntry } from '../types';

	let { entries = [], onrecover }: { entries?: readonly TimelineEntry[]; onrecover?: () => void } =
		$props();

	const durationFormat = new Intl.NumberFormat(undefined, {
		style: 'unit',
		unit: 'second',
		unitDisplay: 'narrow',
		maximumFractionDigits: 1
	});

	function durationLabel(ms: number | null): string {
		return ms === null ? '' : durationFormat.format(ms / 1000);
	}

	// AC17: reading anchor. `pending`/`lastLength` stay plain so the restore effect cannot loop.
	let scroller = $state<HTMLDivElement | null>(null);
	let anchor = 0;
	let pending = false;
	let lastLength = untrack(() => entries.length);
	let newContent = $state(false);

	$effect.pre(() => {
		const length = entries.length;
		if (length <= lastLength) return;
		anchor = scroller?.scrollTop ?? 0;
		lastLength = length;
		pending = true;
	});

	$effect(() => {
		// Reading the length keeps this effect tied to appends, not only to the element binding.
		const length = entries.length;
		if (!pending || length === 0) return;
		const el = scroller;
		if (el) {
			el.scrollTop = anchor;
			newContent = true;
		}
		pending = false;
	});

	function clearMarker(event: Event & { currentTarget: HTMLDivElement }) {
		const el = event.currentTarget;
		if (el.scrollHeight - el.scrollTop - el.clientHeight < 24) newContent = false;
	}
</script>

<div
	bind:this={scroller}
	onscroll={clearMarker}
	class="flex min-h-0 flex-1 flex-col overflow-y-auto"
	data-slot="timeline-scroller"
>
	{#if entries.length === 0}
		<div class="flex flex-1 items-center justify-center px-4 py-10">
			<p class="text-sm" style="color: var(--shell-fg-muted)">{t('empty_state')}</p>
		</div>
	{:else}
		<ol class="flex flex-col gap-4 px-4 py-6">
			{#each entries as entry (entry.id)}
				<li data-kind={entry.kind} data-status={entry.status} class="flex flex-col gap-1">
					{#if entry.kind === 'notice'}
						<SignalBanner title={t('constraint_notice.message')}>
							<Button variant="ghost" size="sm" onclick={() => onrecover?.()}>
								{t('constraint_notice.recovery')}
							</Button>
						</SignalBanner>
					{:else if entry.kind === 'activity'}
						<p class="text-sm" style="color: var(--shell-fg-muted)">
							{t('activity_summary')}
							<time datetime={new Date(entry.createdAt).toISOString()}>
								{durationLabel(entry.durationMs)}
							</time>
						</p>
					{:else}
						<p
							class="max-w-prose text-sm whitespace-pre-wrap"
							style={entry.kind === 'user' ? 'color: var(--shell-fg-muted)' : undefined}
						>
							{#each entry.contentKeys as contentKey (contentKey)}
								<span>{t(contentKey)} </span>
							{/each}
						</p>
					{/if}
					{#if entry.status === 'failed'}
						<p class="text-sm" role="alert" style="color: var(--shell-warn)">{t('error_state')}</p>
					{:else if entry.status === 'cancelled' || entry.status === 'pending'}
						<p class="text-xs" style="color: var(--shell-fg-muted)">{t('status')}</p>
					{/if}
				</li>
			{/each}
		</ol>
		{#if newContent}
			<div
				role="status"
				class="sticky bottom-0 border-t border-border px-4 py-2 text-xs"
				style="background: var(--shell-surface-raised); color: var(--shell-fg-muted)"
			>
				{t('status')}
			</div>
		{/if}
	{/if}
</div>
