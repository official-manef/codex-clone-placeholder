<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { WorkspaceScreen } from '$features/workspace';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- TODO(rr): composer mounts once workspace exposes a snippet slot -->
<!-- TODO(rr): workbench mounts once workspace exposes a secondary-region slot -->

<AppShell area="workspace">
	<WorkspaceScreen chatId={data.chatId} />
</AppShell>
