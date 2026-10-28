<script lang="ts">
  import RecoveryNotice from "#lib/RecoveryNotice.svelte";
  import View from "#lib/View.svelte";
  import { Icon } from "../../../shared/icons/index.js";
  import { api, get as httpGet, post as httpPost } from "#lib/http.js";
  import { onMount } from "svelte";
  import { readDraft, saveDraft } from "#lib/drafts.js";

  type Props = { backend?: string };
  let { backend = "" }: Props = $props();

  let dir = $state("");
  let roots = $state<string[]>([]);
  let files = $state<any[]>([]);
  let results = $state<any[]>([]);
  let task = $state("doc_type");
  let busy = $state(false);
  let error = $state("");
  let scanned = $state(false);
  let classified = $state(false);
  let hydrated = $state(false);
  let alive = true;
  let requestVersion = 0;
  function resetScan() {
    requestVersion++;
    busy = false;
    scanned = false;
    classified = false;
    files = [];
    results = [];
    error = "";
  }

  const TASKS = [
    ["doc_type", "Document type"],
    ["email", "Inbound email"],
    ["triage", "Support ticket"],
  ];

  onMount(() => {
    alive = true;
    const saved = readDraft<any>("corpus", null);
    if (saved && typeof saved.dir === "string") dir = saved.dir;
    if (saved && TASKS.some(([id]) => id === saved.task)) task = saved.task;
    hydrated = true;
    httpGet("/api/corpus/roots")
      .then((d: any) => {
        if (!alive) return;
        if (d.error) throw new Error(d.error);
        roots = d.roots ?? [];
      })
      .catch((e: any) => {
        if (alive)
          error =
            e.message ??
            "Could not read allowed folders. Reconnect the local server and reopen this page.";
      });
    return () => {
      alive = false;
      requestVersion++;
    };
  });
  $effect(() => {
    if (hydrated) saveDraft("corpus", { dir, task });
  });
  $effect(() => {
    backend;
    requestVersion++;
    busy = false;
    results = [];
    classified = false;
  });

  const localPost = httpPost;

  async function list() {
    const request = ++requestVersion,
      requestedDir = dir;
    busy = true;
    error = "";
    results = [];
    classified = false;
    try {
      const d: any = await localPost("/api/corpus/list", { dir: requestedDir });
      if (!alive || request !== requestVersion || dir !== requestedDir) return;
      if (d.error) throw new Error(d.error);
      files = d.files ?? [];
      dir = d.dir ?? dir;
      scanned = true;
    } catch (e: any) {
      if (alive && request === requestVersion) error = String(e.message ?? e);
    } finally {
      if (alive && request === requestVersion) busy = false;
    }
  }

  async function classify() {
    const request = ++requestVersion,
      requestedDir = dir,
      requestedTask = task,
      requestedBackend = backend;
    busy = true;
    error = "";
    try {
      const d: any = await api.corpusClassify({
        dir: requestedDir,
        task: requestedTask,
        backend: requestedBackend,
        limit: 20,
      });
      if (
        !alive ||
        request !== requestVersion ||
        dir !== requestedDir ||
        task !== requestedTask ||
        backend !== requestedBackend
      )
        return;
      if (d.error) throw new Error(d.error);
      results = d.results ?? [];
      classified = true;
    } catch (e: any) {
      if (alive && request === requestVersion) error = String(e.message ?? e);
    } finally {
      if (alive && request === requestVersion) busy = false;
    }
  }

  function kb(n: number | null) {
    if (n == null) return "—";
    return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(0)} KB`;
  }
</script>

<View
  title="Document corpus"
  icon="folder"
  subtitle="Inspect and classify English documents in a folder on this laptop. This reads and labels files; use Workflow Studio to save organized copies. Scanned PDFs and images need OCR, which is not included."
>
  <div class="card shrink-0 p-4">
    <label class="label mb-1.5 block" for="corpus-directory">Directory</label>
    <div class="flex flex-wrap gap-2">
      <input
        id="corpus-directory"
        class="field mono flex-1 min-w-0 basis-full sm:basis-auto"
        bind:value={dir}
        oninput={resetScan}
        disabled={busy}
        aria-describedby="corpus-roots"
        placeholder="C:\Users\you\Documents\invoices"
      />
      <select
        class="field w-auto"
        bind:value={task}
        aria-label="Document classification task"
        disabled={busy}
        onchange={() => {
          requestVersion++;
          results = [];
          classified = false;
        }}
      >
        {#each TASKS as [id, label]}
          <option value={id}>{label}</option>
        {/each}
      </select>
      <button class="btn h-[34px]" onclick={list} disabled={busy || !dir.trim()}>
        <Icon name="search" size={11} /> Scan
      </button>
      <button class="btn btn-solid h-[34px]" onclick={classify} disabled={busy || !dir.trim()}>
        {busy ? "Working…" : "Classify first 20"}
      </button>
    </div>

    <p id="corpus-roots" class="mt-2 break-all text-[12px] leading-relaxed text-ink-2">
      Allowed roots: {roots.join(", ") || "—"}. Anything outside them is refused.
    </p>
    <p class="mt-1 text-[12px] leading-relaxed text-ink-2">
      Scan lists up to 40 entries. Classification processes up to 20 files from this folder without
      recursing into subfolders. Long text is limited by Laya’s 256-token input window.
    </p>
  </div>

  {#if error}
    <RecoveryNotice message={error} retry={list} retryLabel="Scan again" />
  {/if}

  {#if results.length}
    <span class="label mt-4 mb-2 block">Results · {results.length} files</span>
    <div class="card overflow-hidden">
      {#each results as r, i}
        <div
          class="grid grid-cols-1 gap-2 px-4 py-3 text-[12px] sm:grid-cols-[1.4fr_1fr_70px] sm:items-center {i >
          0
            ? 'border-t border-line'
            : ''}"
        >
          <span class="flex min-w-0 items-center gap-2">
            <span class="mono text-[9.5px] text-ink-3">{r.kind}</span>
            <span class="break-all text-ink-2">{r.name}</span>
          </span>
          <span class="break-words">
            {#if r.error}
              <span class="text-[#ffb4c2]">{r.error}</span>
            {:else}
              <span class="font-semibold">{r.action_label ?? r.answers?.[0]?.value}</span>
              {#if r.answers?.[0]?.probability != null}
                <span class="mono ml-1.5 text-[10px] text-ink-3"
                  >p={r.answers[0].probability.toFixed(2)}</span
                >
              {/if}
            {/if}
          </span>
          <span class="mono text-right text-[10.5px] text-ink-3">{r.ms ? r.ms + " ms" : "—"}</span>
        </div>
      {/each}
    </div>
  {:else if classified}
    <p class="mt-4 text-[13px] text-ink-2" role="status">
      No files were classified. Check the folder contents and supported formats, then try another
      folder.
    </p>
  {:else if scanned && files.length}
    <span class="label mt-4 mb-2 block">Found · {files.length} entries</span>
    <div class="card overflow-hidden">
      {#each files as f, i}
        <div
          class="grid grid-cols-[1.6fr_90px_70px] items-center gap-3 px-4 py-2 text-[12px] {i > 0
            ? 'border-t border-line'
            : ''}"
        >
          <span class="truncate text-ink-2">{f.name}</span>
          <span class="mono text-[9.5px] {f.kind === 'unsupported' ? 'text-ink-3' : 'text-ink'}"
            >{f.kind}</span
          >
          <span class="mono text-right text-[10.5px] text-ink-3">{kb(f.size)}</span>
        </div>
      {/each}
    </div>
  {:else if scanned}
    <p class="mt-4 text-[12px] text-ink-3">No files in that directory.</p>
  {/if}
</View>
