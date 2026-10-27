<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t, tp } from '$features/placeholders';
	import { getShellState } from '../state.svelte';

	const shell = getShellState();

	const RECENT = Array.from({ length: 24 }, (_, index) => index + 1);
	const GROUPS = ['priority_group', 'context_group', 'recent_group'];

	function selectObject(): void {
		// ponytail: selection is owned by the workspace slice; the row only proves the target.
		shell.setActiveArea('workspace');
	}
</script>

<aside
	class="shell-sidebar p-2"
	id="shell-sidebar"
	data-mode={shell.sidebar}
	aria-label={t('workspace_name')}
>
	{#if shell.activeArea === 'workspace'}
		<h2 class="px-2 py-1.5 text-sm font-semibold">{t('workspace_name')}</h2>
		{#each GROUPS as group (group)}
			<h3 class="shell-fg-muted px-2 pt-3 pb-1 text-xs font-medium uppercase">{t(group)}</h3>
			{#if group === 'recent_group'}
				<ul class="max-h-80 overflow-y-auto">
					{#each RECENT as n (n)}
						<li>
							<Button
								variant="ghost"
								class="h-11 w-full justify-start sm:h-7"
								onclick={selectObject}
							>
								{tp('recent_object', n)}
							</Button>
						</li>
					{/each}
				</ul>
			{:else}
				<Button variant="ghost" class="h-11 w-full justify-start sm:h-7" onclick={selectObject}>
					{t(group === 'priority_group' ? 'object_title_01' : 'object_title_02')}
				</Button>
			{/if}
		{/each}
	{:else}
		<h2 class="px-2 py-1.5 text-sm font-semibold">{t('workspace_name')}</h2>
		<p class="shell-fg-muted px-2 text-sm">{t('empty_state')}</p>
	{/if}
</aside>
