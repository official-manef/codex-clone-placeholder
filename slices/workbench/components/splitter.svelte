<script lang="ts">
	import { clampSplitWidth } from '../state.svelte';

	let {
		width,
		containerWidth,
		onchange
	}: {
		width: number;
		containerWidth: number;
		onchange: (next: number) => void;
	} = $props();

	// A too-narrow or unmeasured container pins both bounds to the 340px floor.
	const min = $derived(clampSplitWidth(Number.NEGATIVE_INFINITY, containerWidth));
	const max = $derived(clampSplitWidth(Number.POSITIVE_INFINITY, containerWidth));

	let dragging = $state(false);
	let startX = 0;
	let startWidth = 0;

	function onPointerDown(event: PointerEvent): void {
		dragging = true;
		startX = event.clientX;
		startWidth = width;
	}

	// The handle sits on the region's leading edge, so dragging left widens the region.
	$effect(() => {
		if (!dragging) return;
		const move = (event: PointerEvent) => {
			onchange(startWidth - (event.clientX - startX));
		};
		const up = () => {
			dragging = false;
		};
		window.addEventListener('pointermove', move);
		window.addEventListener('pointerup', up);
		return () => {
			window.removeEventListener('pointermove', move);
			window.removeEventListener('pointerup', up);
		};
	});

	function onKeydown(event: KeyboardEvent): void {
		if (event.key === 'ArrowLeft') onchange(width + 20);
		else if (event.key === 'ArrowRight') onchange(width - 20);
		else if (event.key === 'Home') onchange(min);
		else if (event.key === 'End') onchange(max);
		else return;
		event.preventDefault();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	role="separator"
	aria-orientation="vertical"
	tabindex="0"
	aria-valuenow={Math.round(width)}
	aria-valuemin={min}
	aria-valuemax={max}
	class="w-1.5 shrink-0 cursor-col-resize bg-[var(--shell-border)] focus-visible:bg-[var(--shell-accent)] focus-visible:outline-none"
	onpointerdown={onPointerDown}
	onkeydown={onKeydown}
></div>
