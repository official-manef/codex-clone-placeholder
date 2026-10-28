<script lang="ts">
  import { onMount } from "svelte";
  import { readDraft, saveDraft } from "#lib/drafts.js";
  let { value = $bindable(""), disabled = false }: { value?: string; disabled?: boolean } =
    $props();
  let microphones = $state<MediaDeviceInfo[]>([]);
  async function list() {
    try {
      microphones = (await navigator.mediaDevices.enumerateDevices()).filter(
        (item) => item.kind === "audioinput" && item.deviceId && item.deviceId !== "default",
      );
    } catch {
      /* The system default remains usable without device labels or permission. */
    }
  }
  onMount(() => {
    const saved = readDraft<unknown>("microphone", "");
    if (!value && typeof saved === "string") value = saved;
    list();
    navigator.mediaDevices?.addEventListener("devicechange", list);
    return () => navigator.mediaDevices?.removeEventListener("devicechange", list);
  });
</script>

<label class="microphone-picker"
  >Microphone
  <select
    class="field"
    bind:value
    {disabled}
    onfocus={list}
    onchange={(event) => saveDraft("microphone", event.currentTarget.value)}
  >
    <option value="">System default</option>
    {#if value && !microphones.some((item) => item.deviceId === value)}<option {value}
        >Selected microphone · reconnect or choose another</option
      >{/if}
    {#each microphones as item, index}<option value={item.deviceId}
        >{item.label || `Microphone ${index + 1}`}</option
      >{/each}
  </select>
</label>

<style>
  .microphone-picker {
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: var(--color-ink-2);
    font-size: 12px;
    min-width: 0;
  }
  select {
    max-width: 100%;
    min-height: 36px;
    font-size: 12px;
  }
</style>
