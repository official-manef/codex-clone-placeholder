<script lang="ts">
  import RecoveryNotice from "#lib/RecoveryNotice.svelte";
  import { onDestroy, onMount } from "svelte";
  import { readDraft } from "#lib/drafts.js";
  import MicrophoneSelect from "#lib/MicrophoneSelect.svelte";
  import { Button } from "#lib/components/ui/button/index.js";
  import { Icon } from "../../shared/icons/index.js";
  import { acquireMicrophone, releaseMicrophone, recordingMime } from "#lib/recording.js";
  type Props = {
    onRecorded: (file: File) => void | Promise<void>;
    disabled?: boolean;
    maxSeconds?: number;
    label?: string;
    active?: boolean;
    onBusyChange?: (busy: boolean) => void;
    compact?: boolean;
    microphone?: string;
  };
  let {
    onRecorded,
    disabled = false,
    maxSeconds = 300,
    label = "Record audio",
    active = true,
    onBusyChange = () => {},
    compact = false,
    microphone = $bindable(""),
  }: Props = $props();
  let recorderState = $state<"idle" | "requesting" | "recording" | "processing">("idle");
  let elapsed = $state(0);
  let error = $state("");
  onMount(() => {
    const saved = readDraft<any>("microphone", "");
    if (!microphone && typeof saved === "string") microphone = saved;
  });
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let chunks: Blob[] = [];
  let cancelled = false;
  let alive = true;
  let requestVersion = 0;
  function release() {
    if (timer) clearInterval(timer);
    timer = undefined;
    releaseMicrophone(stream);
    stream = null;
  }
  function cancel() {
    ++requestVersion;
    cancelled = true;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    else {
      release();
      recorderState = "idle";
    }
  }
  function stop() {
    if (recorder?.state === "recording") recorder.stop();
  }
  async function start() {
    error = "";
    cancelled = false;
    recorderState = "requesting";
    const version = ++requestVersion;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error(
          "Recording needs a supported browser on localhost or HTTPS. You can upload an audio file instead.",
        );
      const audio = await acquireMicrophone(
        () =>
          navigator.mediaDevices.getUserMedia({
            audio: microphone ? { deviceId: { exact: microphone } } : true,
          }),
        () => alive && !cancelled && active && version === requestVersion,
      );
      if (!audio) {
        if (version === requestVersion) recorderState = "idle";
        return;
      }
      stream = audio;
      const mime = recordingMime((item) => MediaRecorder.isTypeSupported(item));
      const currentRecorder = new MediaRecorder(audio, mime ? { mimeType: mime } : undefined);
      recorder = currentRecorder;
      chunks = [];
      elapsed = 0;
      currentRecorder.ondataavailable = (event) => {
        if (recorder === currentRecorder && event.data.size) chunks.push(event.data);
      };
      currentRecorder.onerror = () => {
        if (recorder !== currentRecorder) return;
        error = "Microphone recording failed. Check the selected microphone and try again.";
        cancel();
      };
      currentRecorder.onstop = async () => {
        if (recorder !== currentRecorder) {
          releaseMicrophone(audio);
          return;
        }
        release();
        const mediaType = currentRecorder.mimeType || mime || "audio/webm";
        recorder = null;
        if (cancelled || !alive) {
          chunks = [];
          recorderState = "idle";
          return;
        }
        const blob = new Blob(chunks, { type: mediaType });
        chunks = [];
        if (!blob.size) {
          error = "No audio was recorded. Check your microphone and try again.";
          recorderState = "idle";
          return;
        }
        const ext = mediaType.includes("mp4") ? "m4a" : mediaType.includes("ogg") ? "ogg" : "webm";
        recorderState = "processing";
        try {
          await onRecorded(new File([blob], `recording-${Date.now()}.${ext}`, { type: mediaType }));
        } catch (e: any) {
          error = e.message ?? "The recording could not be processed. Try again.";
        } finally {
          if (alive) recorderState = "idle";
        }
      };
      const startedAt = performance.now();
      currentRecorder.start(1000);
      recorderState = "recording";
      timer = setInterval(() => {
        elapsed = Math.floor((performance.now() - startedAt) / 1000);
        if (elapsed >= maxSeconds) stop();
      }, 250);
    } catch (e: any) {
      if (version !== requestVersion) return;
      release();
      recorderState = "idle";
      error =
        e.name === "NotAllowedError"
          ? "Microphone permission was denied. Allow it in your browser or choose an audio file."
          : e.name === "NotFoundError"
            ? "No microphone was found. Connect one or choose an audio file."
            : (e.message ?? "Cannot start the microphone.");
    }
  }
  $effect(() => {
    onBusyChange(recorderState !== "idle");
  });
  $effect(() => {
    if (!active && (recorderState === "recording" || recorderState === "requesting")) cancel();
  });
  onDestroy(() => {
    alive = false;
    cancel();
    release();
  });
</script>

<div class="audio-recorder" class:compact>
  {#if !compact}<MicrophoneSelect
      bind:value={microphone}
      disabled={disabled || recorderState !== "idle"}
    />{/if}
  {#if recorderState === "recording"}<span class="recording-status" role="status"
      ><span aria-hidden="true"></span>Recording {Math.floor(elapsed / 60)}:{String(
        elapsed % 60,
      ).padStart(2, "0")} / {Math.floor(maxSeconds / 60)}:{String(maxSeconds % 60).padStart(
        2,
        "0",
      )}</span
    ><Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "sm" : "default"}
      onclick={stop}>Stop & use</Button
    ><Button variant="ghost" size={compact ? "sm" : "default"} onclick={cancel}>Cancel</Button>
  {:else if recorderState === "requesting"}<span role="status"
      >Waiting for microphone permission…</span
    ><Button variant="ghost" onclick={cancel}>Cancel</Button>
  {:else}<Button
      variant={compact ? "ghost" : "outline"}
      size={compact ? "icon" : "default"}
      aria-label={recorderState === "processing" ? "Transcribing recording" : label}
      title={recorderState === "processing" ? "Transcribing recording" : label}
      onclick={start}
      disabled={disabled || !active || recorderState === "processing"}
      ><Icon
        name={recorderState === "processing" ? "clock" : "mic"}
        size={16}
      />{#if !compact}{recorderState === "processing"
          ? "Processing recording…"
          : label}{/if}</Button
    >{/if}
  {#if compact && recorderState === "processing"}<span class="sr-only" role="status"
      >Transcribing recording…</span
    >{/if}
  {#if error}<div class="recorder-error">
      <RecoveryNotice message={error} retry={start} retryLabel="Try microphone again" />
    </div>{/if}
</div>

<style>
  .audio-recorder {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
  }
  .recording-status {
    display: flex;
    align-items: center;
    gap: 7px;
    color: var(--color-ink);
    font-variant-numeric: tabular-nums;
  }
  .recording-status > span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #f58c98;
  }
  .recorder-error {
    flex-basis: 100%;
    color: #ffb4c2;
    font-size: 12px;
    line-height: 1.6;
  }
  .audio-recorder :global(button) {
    min-height: 36px;
  }
  .compact {
    position: relative;
    justify-content: flex-end;
    gap: 5px;
  }
  .compact .recording-status {
    font-size: 11px;
  }
  .compact :global([data-slot="button"][title]) {
    border-radius: 50%;
  }
  .compact .recorder-error {
    position: absolute;
    width: min(340px, calc(100vw - 48px));
    inset-inline-end: 0;
    bottom: 100%;
    z-index: 2;
  }
</style>
