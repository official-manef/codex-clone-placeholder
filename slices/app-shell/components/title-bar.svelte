<script lang="ts">
	import PanelLeft from '@lucide/svelte/icons/panel-left';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$features/placeholders';
	import { getShellState } from '../state.svelte';
	import CompositionMenu from './composition-menu.svelte';

	const shell = getShellState();

	function toggleSidebar(): void {
		shell.setSidebar(shell.sidebar === 'collapsed' ? 'expanded' : 'collapsed');
	}
</script>

<div class="shell-titlebar">
	<Button
		variant="ghost"
		size="icon"
		class="size-11 sm:size-8"
		aria-label={t('menu_a')}
		aria-expanded={shell.sidebar !== 'collapsed'}
		aria-controls="shell-sidebar"
		onclick={toggleSidebar}
	>
		<PanelLeft class="size-4" />
	</Button>
	<span class="shell-fg-muted text-sm">{t('menu_b')}</span>
	<span class="shell-fg-muted text-sm">{t('menu_c')}</span>
	<span class="shell-fg-muted text-sm">{t('menu_d')}</span>
	{#if import.meta.env.DEV}
		<CompositionMenu />
	{/if}
</div>
