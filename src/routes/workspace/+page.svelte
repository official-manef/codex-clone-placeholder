<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { Composer } from '$features/composer';
	import { Workbench } from '$features/workbench';
	import { WorkspaceScreen } from '$features/workspace';
</script>

<!-- state-model §4: no active object, no project → `new:none`. authority stays unknown so
     the submit guard has to say why it refuses (AC16). -->
<AppShell area="workspace">
	<WorkspaceScreen chatId={null}>
		{#snippet children(slot)}
			<Composer
				draftKey="new:none"
				authority="unknown"
				onsubmit={(payload) => slot.appendDraft(payload)}
			/>
		{/snippet}
		{#snippet secondary()}
			<Workbench />
		{/snippet}
	</WorkspaceScreen>
</AppShell>
