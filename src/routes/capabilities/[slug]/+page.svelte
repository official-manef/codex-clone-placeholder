<script lang="ts">
	import { AppShell } from '$features/app-shell';
	import { CapabilitiesScreen } from '$features/capabilities';
</script>

<!-- CapabilitiesScreen owns its selection state; the loader already validated the slug. -->
<AppShell area="capabilities">
	<CapabilitiesScreen />
</AppShell>
