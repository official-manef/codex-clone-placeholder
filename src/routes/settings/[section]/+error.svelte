<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import { t } from '$features/placeholders';
	import { FIRST_SECTION_ID } from '$features/settings-surface';

	const target = resolve('/settings/[section]', { section: FIRST_SECTION_ID });

	async function back(): Promise<void> {
		await goto(target);
	}
</script>

<main class="grid min-h-dvh w-full place-items-center p-6 text-center">
	<div class="max-w-md space-y-3">
		<h1 class="text-xl font-semibold">{t('empty_state')}</h1>
		<p class="shell-fg-muted text-sm">{t('error_state')}</p>
		<Button variant="outline" onclick={back}>{t('rail_tertiary_destination')}</Button>
	</div>
</main>
