<script lang="ts">
	import { onMount, setContext, untrack, type Snippet } from 'svelte';
	import TitleBar from './title-bar.svelte';
	import GlobalRail from './global-rail.svelte';
	import SidebarRegion from './sidebar-region.svelte';
	import OverlayHost from './overlay-host.svelte';
	import { createShellState, SHELL_CONTEXT, sidebarModeFor } from '../state.svelte';
	import type { AreaId } from '../types';

	let { area, children }: { area: AreaId; children?: Snippet } = $props();

	// untrack: the shell only reads the initial area; a later area change remounts the shell.
	const shell = createShellState(untrack(() => area));
	setContext(SHELL_CONTEXT, shell);

	// ponytail: initial drawer only; live breakpoint crossing (T19) waits for a resize test.
	onMount(() => {
		shell.setSidebar(sidebarModeFor(window.innerWidth, shell.sidebar));
	});

	/** T13: Escape closes the topmost layer only; OverlayHost restores focus. */
	function onkeydown(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || shell.overlay === null) return;
		event.preventDefault();
		shell.closeOverlay();
	}
</script>

<svelte:window {onkeydown} />

<div class="shell-root" data-area={area}>
	<TitleBar />
	<GlobalRail />
	<div class="shell-body">
		<SidebarRegion />
		<main class="shell-primary" id="primary-region" tabindex="-1">{@render children?.()}</main>
	</div>
	<OverlayHost />
</div>
