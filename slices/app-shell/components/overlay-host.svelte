<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import { getShellState } from '../state.svelte';
	import type { OverlayId } from '../types';

	const shell = getShellState();

	// `context-summary` is rendered by the workspace slice; only the placeholders live here.
	const PLACEHOLDER_OVERLAYS: readonly OverlayId[] = ['command-palette', 'composition-menu'];
	const [CLOSE_LABEL] = GENERIC_LABELS;

	let dialog = $state<HTMLDivElement | null>(null);
	let lastTrigger: HTMLElement | null = null;

	function owns(id: OverlayId | null): boolean {
		return id !== null && PLACEHOLDER_OVERLAYS.includes(id);
	}

	$effect(() => {
		if (owns(shell.overlay)) {
			lastTrigger = shell.overlayTrigger;
			dialog?.focus();
			return;
		}
		const trigger = lastTrigger;
		lastTrigger = null;
		// T13: the dialog just unmounted, so focus fell to body; never steal it from a live element.
		if (trigger && (document.activeElement === null || document.activeElement === document.body)) {
			trigger.focus();
		}
	});
</script>

{#if owns(shell.overlay)}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4">
		<div
			bind:this={dialog}
			role="dialog"
			aria-modal="true"
			aria-label={t('menu_a')}
			tabindex="-1"
			class="flex w-full max-w-md flex-col gap-3 rounded-lg bg-background p-4 text-foreground shadow-lg ring-1 ring-border outline-none"
		>
			<p class="text-sm">{t(shell.overlay === 'command-palette' ? 'menu_c' : 'menu_d')}</p>
			<div class="flex justify-end">
				<Button variant="ghost" class="h-11 sm:h-8" onclick={() => shell.closeOverlay()}>
					{CLOSE_LABEL}
				</Button>
			</div>
		</div>
	</div>
{/if}
