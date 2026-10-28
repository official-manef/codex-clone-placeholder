<script lang="ts">
  import AppSelect from "#lib/AppSelect.svelte";
  type Props = { backend?: string; onPick?: (id: string) => void; backends?: any[] };
  let { backend = "", onPick = () => {}, backends = [] }: Props = $props();
  let options = $derived(
    backends.map((b) => ({
      value: b.id,
      label: `${b.device}${!b.ready ? " · not ready" : ""}`,
      disabled: !b.ready && b.kind !== "byok",
    })),
  );
</script>

<div class="backend-picker">
  <AppSelect
    value={backend}
    {options}
    label="Decision compute device"
    disabled={!backends.length}
    onchange={onPick}
  />
</div>
