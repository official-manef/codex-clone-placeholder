<script lang="ts">
	import { t } from '$features/placeholders';
	import SettingAction from './setting-action.svelte';
	import SettingPath from './setting-path.svelte';
	import SettingSelect from './setting-select.svelte';
	import SettingToggle from './setting-toggle.svelte';
	import type { FieldValue, SettingField, SettingStatus } from '../types';

	let {
		field,
		value,
		status: rowStatus,
		onchange
	}: {
		field: SettingField;
		value: FieldValue;
		status: SettingStatus;
		onchange: (next: FieldValue) => void;
	} = $props();

	const marker = $derived(
		rowStatus === 'saving'
			? t('settings_saving')
			: rowStatus === 'saved'
				? t('settings_saved')
				: rowStatus === 'save_error'
					? t('settings_save_error')
					: null
	);
</script>

<div class="flex flex-col gap-2 border-b border-border py-3 last:border-b-0" data-field={field.key}>
	<div class="flex min-w-0 flex-col gap-0.5">
		<span class="text-sm font-medium text-foreground">{t(field.labelKey)}</span>
		{#if field.descriptionKey}
			<span class="shell-fg-muted text-xs">{t(field.descriptionKey)}</span>
		{/if}
	</div>
	<div class="flex min-w-0 flex-col gap-1">
		{#if field.type === 'toggle'}
			<SettingToggle {field} {value} status={rowStatus} {onchange} />
		{:else if field.type === 'select'}
			<SettingSelect {field} {value} status={rowStatus} {onchange} />
		{:else if field.type === 'path'}
			<SettingPath {field} {value} status={rowStatus} {onchange} />
		{:else}
			<SettingAction {field} {value} status={rowStatus} {onchange} />
		{/if}
		{#if marker}
			<span class="shell-fg-muted text-xs" role="status" data-persistence={rowStatus}>{marker}</span
			>
		{/if}
	</div>
</div>
