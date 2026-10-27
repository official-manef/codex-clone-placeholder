<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
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

<Switch
	checked={value === true}
	onCheckedChange={(next) => onchange(next)}
	aria-label={t(field.labelKey)}
	data-persistence={rowStatus}
/>
