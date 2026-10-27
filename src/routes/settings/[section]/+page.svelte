<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { SettingsScreen } from '$features/settings-surface';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<AppShell area="settings">
	<SettingsScreen section={data.section} />
</AppShell>
