<script lang="ts">
	import { t } from '$features/placeholders';
	import CategorySidebar from './category-sidebar.svelte';
	import SettingRow from './setting-row.svelte';
	import { getField } from '../fields';
	import { SECTIONS, getSection } from '../registry';
	import { createSettingsState } from '../state.svelte';
	import type { FieldValue, SettingField } from '../types';

	let { section }: { section: string } = $props();

	const settings = createSettingsState();
	/** Local selection; falls back to the routed section until the user picks a category. */
	let picked = $state<string | null>(null);
	const activeId = $derived(picked && getSection(picked) ? picked : section);
	const activeSection = $derived(getSection(activeId) ?? SECTIONS[0]);
	const filtered = $derived(settings.filterSections(SECTIONS));
	const rows = $derived(
		activeSection.fieldKeys
			.map((key) => getField(key))
			.filter((field): field is SettingField => field !== undefined)
	);

	function change(field: SettingField, next: FieldValue): void {
		settings.setValue(field.key, next);
	}
</script>

<section class="flex min-h-0 flex-1" aria-label={t(activeSection.labelKey)}>
	<CategorySidebar
		query={settings.query}
		matches={filtered.matches}
		empty={filtered.empty}
		noMatch={filtered.noMatch}
		{activeId}
		onquery={(next) => settings.setQuery(next)}
		onselect={(id) => (picked = id)}
	/>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
		<h1 class="text-lg font-semibold text-foreground">{t(activeSection.labelKey)}</h1>
		{#each rows as field (field.key)}
			<SettingRow
				{field}
				value={settings.getValue(field.key)}
				status={settings.getStatus(field.key)}
				onchange={(next) => change(field, next)}
			/>
		{/each}
	</div>
</section>
