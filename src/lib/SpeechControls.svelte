<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "#lib/http.js";
  import { readDraft, saveDraft } from "#lib/drafts.js";
  let {
    device = $bindable(""),
    language = $bindable("en"),
    disabled = false,
    status = null,
  }: { device?: string; language?: string; disabled?: boolean; status?: any } = $props();
  let own = $state<any>(null);
  let ready = $state(false);
  let data = $derived(status ?? own);
  onMount(() => {
    const saved = readDraft<any>("speech-controls", null);
    if (saved && ["NPU", "GPU", "CPU"].includes(saved.device)) device = saved.device;
    if (typeof saved?.language === "string") language = saved.language;
    ready = true;
    if (!status) {
      const controller = new AbortController();
      get("/api/asr", controller.signal)
        .then((value) => {
          if (!controller.signal.aborted) own = value;
        })
        .catch(() => {});
      return () => controller.abort();
    }
  });
  $effect(() => {
    if (!device && data?.devices?.length)
      device = data.devices.includes("NPU") ? "NPU" : data.devices[0];
  });
  $effect(() => {
    if (ready) saveDraft("speech-controls", { device, language });
  });
</script>

<div class="speech-controls">
  <label
    >Transcription device
    <select class="field" bind:value={device} disabled={disabled || !data?.devices?.length}>
      {#if !device}<option value="">{data ? "No device detected" : "Checking devices…"}</option
        >{/if}
      {#if device && !data?.devices?.includes(device)}<option value={device}
          >{device} · unavailable</option
        >{/if}
      {#each data?.devices ?? [] as item}<option value={item}>{item}</option>{/each}
    </select>
  </label>
  <label
    >Speech language
    <select class="field" bind:value={language} disabled={disabled || !data?.languages?.length}>
      {#if data?.multilingual}<option value="auto">Auto detect</option>{/if}
      {#if language === "auto" && !data?.multilingual}<option value="auto"
          >Auto detect · unavailable</option
        >{/if}
      {#if !data?.languages?.includes(language) && language !== "auto"}<option value={language}
          >{language} · unavailable</option
        >{/if}
      {#each data?.languages ?? [] as item}<option value={item}
          >{item === "en" ? "English" : item === "id" ? "Bahasa Indonesia" : item}</option
        >{/each}
    </select>
  </label>
  {#if data && !data.languages?.length}<p role="status">
      Speech language metadata is unavailable. Open Setup check and verify the installed Whisper
      export.
    </p>{/if}
  {#if language === "auto"}<p>
      Automatic detection prepares a fresh local speech pipeline for each recording to avoid
      carrying a previous language across requests.
    </p>{/if}
</div>

<style>
  .speech-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-bottom: 12px;
  }
  label {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--color-ink-2);
    font-size: 12px;
  }
  select {
    max-width: 190px;
    min-height: 34px;
    font-size: 12px;
  }
  p {
    flex-basis: 100%;
    color: var(--color-ink-2);
    font-size: 11px;
    margin: 0;
  }
</style>
