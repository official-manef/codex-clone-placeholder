<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '$features/placeholders';
	import CategorySidebar from './category-sidebar.svelte';
	import SettingRow from './setting-row.svelte';
	import { FIELDS, getField } from '../fields';
	import { SECTIONS, getSection } from '../registry';
	import { createSettingsState } from '../state.svelte';
	import type { SettingsState } from '../state.svelte';
	import type { FieldValue, SettingField, SettingSection } from '../types';

	let { section }: { section: string } = $props();

	/**
	 * Browser-only preference store. Created inside `$effect` so no storage is touched during SSR
	 * or module evaluation; `sessionStorage` may throw in private mode, so it degrades to memory.
	 * Until the effect runs the screen renders field defaults, which is also what the server sent.
	 */
	let settings = $state.raw<SettingsState | null>(null);
	$effect(() => {
		let storage: Storage | null;
		try {
			storage = sessionStorage;
		} catch {
			storage = null;
		}
		// Prime hydration with a local reference: reading `settings` back here would make the
		// effect depend on the state it just wrote.
		const state = createSettingsState(storage);
		untrack(() => {
			for (const field of FIELDS) state.getValue(field.key);
		});
		settings = state;
	});

	/** Local selection; falls back to the routed section until the user picks a category. */
	let picked = $state<string | null>(null);
	const activeId = $derived(picked && getSection(picked) ? picked : section);
	const activeSection = $derived(getSection(activeId) ?? SECTIONS[0]);
	const filtered = $derived(
		settings?.filterSections(SECTIONS) ?? {
			matches: [...SECTIONS] as SettingSection[],
			empty: SECTIONS.length === 0,
			noMatch: false
		}
	);
	const rows = $derived(
		activeSection.fieldKeys
			.map((key) => getField(key))
			.filter((field): field is SettingField => field !== undefined)
	);

	function change(field: SettingField, next: FieldValue): void {
		if (!settings) return;
		settings.setValue(field.key, next);
		// Newest revision wins: the commit resolves against the revision captured here (AC12).
		settings.commit(field.key).catch(() => undefined);
	}
</script>

<section class="flex min-h-0 flex-1" aria-label={t(activeSection.labelKey)}>
	<CategorySidebar
		query={settings?.query ?? ''}
		matches={filtered.matches}
		empty={filtered.empty}
		noMatch={filtered.noMatch}
		{activeId}
		onquery={(next) => settings?.setQuery(next)}
		onselect={(id) => (picked = id)}
	/>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
		<h1 class="text-lg font-semibold text-foreground">{t(activeSection.labelKey)}</h1>
		{#each rows as field (field.key)}
			<SettingRow
				{field}
				value={settings?.getValue(field.key) ?? field.defaultValue}
				status={settings?.getStatus(field.key) ?? 'clean'}
				onchange={(next) => change(field, next)}
			/>
		{/each}
	</div>
</section>
