<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { WorkspaceScreen } from '$features/workspace';
</script>

<!-- TODO(rr): composer mounts once workspace exposes a snippet slot -->
<!-- TODO(rr): workbench mounts once workspace exposes a secondary-region slot -->

<AppShell area="workspace">
	<WorkspaceScreen chatId={null} />
</AppShell>
