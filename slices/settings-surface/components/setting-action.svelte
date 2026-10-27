<script lang="ts">
	import { Button } from '$lib/components/ui/button';
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

<Button
	variant="outline"
	size="sm"
	data-persistence={rowStatus}
	onclick={() => onchange(!(value === true))}
>
	{t(field.labelKey)}
</Button>
