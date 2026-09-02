<script lang="ts">
	export type SegmentItem = { id: string; label: string };

	let {
		items,
		value = $bindable(),
		label,
		onChange
	}: {
		items: readonly SegmentItem[];
		value: string;
		label: string;
		onChange?: (id: string) => void;
	} = $props();

	function select(id: string) {
		value = id;
		onChange?.(id);
	}
</script>

<div class="app-segmented-control" role="tablist" aria-label={label}>
	{#each items as item (item.id)}
		<button
			type="button"
			role="tab"
			aria-selected={value === item.id}
			onclick={() => select(item.id)}
		>
			{item.label}
		</button>
	{/each}
</div>
