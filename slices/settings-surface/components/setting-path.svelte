<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$features/placeholders';
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
</script>

<div class="flex min-w-0 flex-1 items-center gap-2" data-persistence={rowStatus}>
	<Input
		value={String(value)}
		aria-label={t(field.labelKey)}
		oninput={(event) => onchange(event.currentTarget.value)}
	/>
	<Button variant="outline" size="sm" onclick={() => onchange(String(value))}>
		{t('resource_location')}
	</Button>
</div>
