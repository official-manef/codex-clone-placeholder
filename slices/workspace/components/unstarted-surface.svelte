<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$features/placeholders';
	import { SegmentedControl, type SegmentItem } from '$lib/components/app-ui';
	import { Button } from '$lib/components/ui/button';
	import type { Mode } from '../types';

	let { mode = 'chat', onmodechange }: { mode?: Mode; onmodechange?: (next: Mode) => void } =
		$props();

	const MODE_ITEMS: readonly SegmentItem[] = [
		{ id: 'chat', label: t('mode_a') },
		{ id: 'work', label: t('mode_b') }
	];

	/** Local mirror only for SegmentedControl's bindable value; workspace state owns the truth (T3). */
	let selected = $state<string>(untrack(() => mode));

	const SUPPORT_ITEMS = ['context_selector', 'resources', 'capabilities'] as const;

	function select(id: string) {
		selected = id;
		onmodechange?.(id === 'work' ? 'work' : 'chat');
	}
</script>

<div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 py-10">
	<SegmentedControl
		items={MODE_ITEMS}
		value={selected}
		label={t('workspace_name')}
		onChange={select}
	/>
	<h1 class="max-w-xl text-center text-2xl font-semibold text-balance">{t('entry_heading')}</h1>
	<!-- composer slice mounts here (slices/composer) -->
	<div class="workspace-composer-slot w-full max-w-2xl" data-slot="composer"></div>
	<div class="flex flex-wrap items-center justify-center gap-2">
		{#each SUPPORT_ITEMS as key (key)}
			<Button variant="ghost" size="sm">{t(key)}</Button>
		{/each}
	</div>
</div>
