<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import { getShellState } from '../state.svelte';
	import type { OverlayId } from '../types';

	const shell = getShellState();

	// `context-summary` is rendered by the workspace slice; only the placeholders live here.
	const PLACEHOLDER_OVERLAYS: readonly OverlayId[] = ['command-palette', 'composition-menu'];
	const [CLOSE_LABEL] = GENERIC_LABELS;

	let closeButton = $state<HTMLElement | null>(null);

	function owns(id: OverlayId | null): boolean {
		return id !== null && PLACEHOLDER_OVERLAYS.includes(id);
	}

	// T12: focus moves into the dialog on open (T13 focus return lives in `closeOverlay`).
	$effect(() => {
		if (!owns(shell.overlay)) return;
		closeButton?.focus();
	});
</script>

{#if owns(shell.overlay)}
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4">
		<div
			role="dialog"
			aria-modal="true"
			aria-label={t('menu_a')}
			data-overlay={shell.overlay}
			tabindex="-1"
			class="flex w-full max-w-md flex-col gap-3 rounded-lg bg-background p-4 text-foreground shadow-lg ring-1 ring-border outline-none"
		>
			<p class="text-sm">{t(shell.overlay === 'command-palette' ? 'menu_c' : 'menu_d')}</p>
			<div class="flex justify-end">
				<Button
					bind:ref={closeButton}
					variant="ghost"
					class="h-11 sm:h-8"
					onclick={() => shell.closeOverlay()}
				>
					{CLOSE_LABEL}
				</Button>
			</div>
		</div>
	</div>
{/if}
