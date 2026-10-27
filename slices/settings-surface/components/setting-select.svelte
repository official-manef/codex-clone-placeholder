<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger,
		SelectValue
	} from '$lib/components/ui/select';
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

	const options = $derived(field.options ?? []);
</script>

<Select type="single" value={String(value)} onValueChange={(next: string) => onchange(next)}>
	<SelectTrigger aria-label={t(field.labelKey)} data-persistence={rowStatus}>
		<SelectValue />
	</SelectTrigger>
	<SelectContent>
		{#each options as option (option)}
			<SelectItem value={option} label={t(option)}>{t(option)}</SelectItem>
		{/each}
	</SelectContent>
</Select>
