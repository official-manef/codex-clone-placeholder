<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { t, tp } from '$features/placeholders';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import Folder from '@lucide/svelte/icons/folder';
	import Search from '@lucide/svelte/icons/search';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import { getShellState } from '../state.svelte';

	const shell = getShellState();

	const RECENT = Array.from({ length: 24 }, (_, index) => index + 1);
	const GROUPS = ['priority_group', 'context_group', 'recent_group'];
	const PRIORITY = ['object_title_01', 'object_title_02'] as const;

	function selectObject(): void {
		// ponytail: selection is owned by the workspace slice; the row only proves the target.
		shell.setActiveArea('workspace');
	}
</script>

<aside
	class="shell-sidebar flex flex-col gap-1 p-2"
	id="shell-sidebar"
	data-mode={shell.sidebar}
	aria-label={t('workspace_name')}
>
	{#if shell.activeArea === 'workspace'}
		<div class="flex shrink-0 items-center gap-1 px-2 py-1.5">
			<h2 class="min-w-0 flex-1 truncate text-sm font-semibold">{t('workspace_name')}</h2>
			<!-- ponytail: header actions are placeholders like the reference; wire when overlays land. -->
			<Button variant="ghost" size="icon" class="size-11 sm:size-7" aria-label={t('rail_overflow')}>
				<Ellipsis />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="size-11 sm:size-7"
				aria-label={t('settings_search_placeholder')}
			>
				<Search />
			</Button>
		</div>

		<Button
			variant="ghost"
			class="h-11 w-full shrink-0 justify-start gap-2 sm:h-7"
			onclick={selectObject}
		>
			<SquarePen />
			<span class="truncate">{t('create_object')}</span>
		</Button>

		<div class="min-h-0 flex-1 overflow-y-auto">
			{#each GROUPS as group (group)}
				<h3 class="shell-fg-muted px-2 pt-3 pb-1 text-xs font-medium uppercase">{t(group)}</h3>
				{#if group === 'priority_group'}
					{#each PRIORITY as key (key)}
						<Button variant="ghost" class="h-11 w-full justify-start sm:h-7" onclick={selectObject}>
							{t(key)}
						</Button>
					{/each}
				{:else if group === 'context_group'}
					<Button
						variant="ghost"
						class="h-11 w-full justify-start gap-2 sm:h-7"
						onclick={selectObject}
					>
						<Folder />
						<span class="truncate">{t('context_name')}</span>
					</Button>
					<!-- A state line, not an action: nothing to open inside an empty context. -->
					<p class="shell-fg-muted px-2 py-1 pl-8 text-xs">{t('empty_context')}</p>
				{:else}
					{#each RECENT as n (n)}
						<Button variant="ghost" class="h-11 w-full justify-start sm:h-7" onclick={selectObject}>
							{tp('recent_object', n)}
						</Button>
					{/each}
				{/if}
			{/each}
		</div>
	{:else}
		<h2 class="px-2 py-1.5 text-sm font-semibold">{t('workspace_name')}</h2>
		<p class="shell-fg-muted px-2 text-sm">{t('empty_state')}</p>
	{/if}
</aside>
