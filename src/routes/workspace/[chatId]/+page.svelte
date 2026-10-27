<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { Composer } from '$features/composer';
	import { Workbench } from '$features/workbench';
	import { WorkspaceScreen } from '$features/workspace';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<!-- state-model §4: the selected chat is the active object, so the draft key is `chat:<id>`.
     authority is allowed here so AC02/AC04 are reachable. -->
<AppShell area="workspace">
	<WorkspaceScreen chatId={data.chatId}>
		{#snippet children(slot)}
			<Composer
				draftKey={`chat:${data.chatId}`}
				authority="allowed"
				onsubmit={(payload) => slot.appendDraft(payload.text)}
			/>
		{/snippet}
		{#snippet secondary()}
			<Workbench />
		{/snippet}
	</WorkspaceScreen>
</AppShell>
