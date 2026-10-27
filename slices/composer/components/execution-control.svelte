<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { t } from '$features/placeholders';
	import type { ExecutionOption } from '../types';

	let { value, onchange }: { value: ExecutionOption; onchange: (next: ExecutionOption) => void } =
		$props();

	const options: { id: ExecutionOption; key: string }[] = [
		{ id: 'standard', key: 'execution_option_field_01' },
		{ id: 'extended', key: 'execution_option_field_02' }
	];
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm">{t('execution_option')}</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start">
		<DropdownMenu.Label>{t('level')}</DropdownMenu.Label>
		<DropdownMenu.RadioGroup
			{value}
			onValueChange={(next) => onchange(next === 'extended' ? 'extended' : 'standard')}
		>
			{#each options as option (option.id)}
				<DropdownMenu.RadioItem value={option.id}>{t(option.key)}</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
