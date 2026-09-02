<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let {
		summary,
		children,
		open = $bindable(false),
		class: className
	}: { summary: string; children: Snippet; open?: boolean; class?: string } = $props();
</script>

<details bind:open class={cn('app-disclosure-card', className)}>
	<summary>
		<span>{summary}</span>
		<ChevronDown class="size-4 transition-transform group-open:rotate-180" />
	</summary>
	<div class="border-t px-4 py-4 sm:px-5">{@render children()}</div>
</details>
