<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { t } from '$features/placeholders';

	let { value, onchange }: { value: string; onchange: (next: string) => void } = $props();

	const options = ['access_scope_field_01', 'access_scope_field_02'];
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="sm">{t('access_scope')}</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="start">
		<DropdownMenu.RadioGroup {value} onValueChange={(next) => onchange(String(next))}>
			{#each options as option (option)}
				<DropdownMenu.RadioItem value={option}>{t(option)}</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
