<script lang="ts">
  import RecoveryNotice from "#lib/RecoveryNotice.svelte";
  import View from "#lib/View.svelte";
  import { Icon } from "../../../shared/icons/index.js";
  import { api, get as httpGet, post as httpPost } from "#lib/http.js";
  import { onMount } from "svelte";
  import { readDraft, saveDraft } from "#lib/drafts.js";

  type Props = { backend?: string };
  let { backend = "" }: Props = $props();

  let specText = $state("");
  let input = $state("I was charged twice for March, please refund the duplicate.");
  let error = $state("");
  let errors = $state<any[]>([]);
  let warnings = $state<any[]>([]);
  let payload = $state("");
  let script = $state("");
  let ok = $state(false);
  let running = $state<any>(null);
  let busy = $state(false);
  let hydrated = $state(false);
  let alive = true;
  let requestVersion = 0;
  let specEdited = false;

  onMount(() => {
    alive = true;
    const saved = readDraft<any>("schema", null);
    const restoredSpec = saved && typeof saved.specText === "string";
    if (restoredSpec) specText = saved.specText;
    if (saved && typeof saved.input === "string") input = saved.input;
    hydrated = true;
    if (!restoredSpec)
      httpGet("/api/schema/starter")
        .then((d: any) => {
          if (!alive || specEdited || specText) return;
          if (d.error) throw new Error(d.error);
          specText = JSON.stringify(d.spec, null, 2);
        })
        .catch((e: any) => {
          if (alive && !specEdited && !specText)
            error =
              e.message ??
              "Could not load the starter format. Reconnect the local server and reopen this page.";
        });
    return () => {
      alive = false;
      requestVersion++;
    };
  });
  $effect(() => {
    if (hydrated) saveDraft("schema", { specText, input });
  });
  $effect(() => {
    backend;
    edited();
  });

  function edited() {
    requestVersion++;
    busy = false;
    ok = false;
    errors = [];
    warnings = [];
    payload = "";
    script = "";
    running = null;
    error = "";
  }
  function requestScope() {
    const version = ++requestVersion;
    const source = specText,
      sample = input,
      engine = backend;
    return () =>
      alive &&
      version === requestVersion &&
      source === specText &&
      sample === input &&
      engine === backend;
  }

  function parse(): any {
    try {
      const s = JSON.parse(specText);
      error = "";
      return s;
    } catch (e: any) {
      error = "invalid JSON: " + String(e.message ?? e);
      return null;
    }
  }

  const localPost = httpPost;

  async function check() {
    const spec = parse();
    if (!spec) return;
    const current = requestScope();
    busy = true;
    try {
      const d: any = await localPost("/api/schema/validate", { spec });
      if (!current()) return;
      if (d.error) throw new Error(d.error);
      ok = d.ok;
      errors = d.errors ?? [];
      warnings = d.warnings ?? [];
    } catch (e: any) {
      if (current()) error = e.message ?? "Validation failed. Reconnect and try again.";
    } finally {
      if (current()) busy = false;
    }
  }

  async function compile() {
    const spec = parse();
    if (!spec) return;
    const current = requestScope();
    busy = true;
    try {
      const d: any = await localPost("/api/schema/compile", { spec, input });
      if (!current()) return;
      if (d.error) throw new Error(d.error);
      payload = JSON.stringify(d.payload, null, 2);
      script = d.script;
      ok = true;
      errors = [];
      warnings = (d.payload?._meta?.warnings ?? []).map((message: string) => ({
        path: "spec",
        message,
      }));
    } catch (e: any) {
      if (current()) error = e.message ?? "Compilation failed. Reconnect and try again.";
    } finally {
      if (current()) busy = false;
    }
  }

  async function runIt() {
    const spec = parse();
    if (!spec) return;
    const current = requestScope();
    const requestedBackend = backend;
    busy = true;
    error = "";
    running = null;
    try {
      const d: any = await localPost("/api/schema/compile", { spec, input });
      if (!current()) return;
      if (d.error) throw new Error(d.error);
      const body = d.payload;
      const res: any = await api.custom(body.state, body.questions, { backend: requestedBackend });
      if (!current()) return;
      if (res.error) throw new Error(res.error);
      running = res;
    } catch (e: any) {
      if (current()) error = String(e.message ?? e);
    } finally {
      if (current()) busy = false;
    }
  }

  function download(name: string, text: string, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  let name = $derived.by(() => {
    try {
      return (JSON.parse(specText).name ?? "spec").toString().replace(/\s+/g, "-");
    } catch {
      return "spec";
    }
  });
</script>

<View
  title="Custom questions"
  icon="code"
  subtitle="Describe your own decision format, validate it, compile it to the wire payload, and take the generated Python client with you. Nothing here is locked into this UI."
>
  {#snippet actions()}
    <button class="btn h-7" onclick={check} disabled={busy || !specText.trim()}
      ><Icon name="check" size={10} /> Validate</button
    >
    <button class="btn h-7" onclick={compile} disabled={busy || !specText.trim()}
      ><Icon name="code" size={10} /> Compile</button
    >
    <button class="btn btn-solid h-7" onclick={runIt} disabled={busy || !specText.trim()}>
      {busy ? "Running…" : "Run on backend"}
    </button>
  {/snippet}

  <p class="mb-3 text-[12px] leading-relaxed text-ink-2">
    Use English text with the bundled Laya checkpoint. Your format and sample input are kept in this
    tab across refresh; results are produced only when you run.
  </p>

  <div class="grid min-h-0 flex-1 grid-cols-1 gap-2.5 lg:grid-cols-2">
    <div class="flex min-h-0 flex-col">
      <label class="label mb-1.5 block" for="custom-format">Your format · JSON</label>
      <textarea
        id="custom-format"
        class="field mono min-h-[240px] flex-1"
        bind:value={specText}
        spellcheck="false"
        oninput={() => {
          specEdited = true;
          edited();
        }}
        disabled={busy}></textarea>
      <label class="label mt-2 mb-1.5 block" for="custom-input">Sample input</label>
      <textarea
        id="custom-input"
        class="field mono"
        rows="3"
        bind:value={input}
        oninput={edited}
        disabled={busy}></textarea>
    </div>

    <div class="flex min-h-0 flex-col">
      {#if error}
        <RecoveryNotice message={error} retry={check} retryLabel="Validate again" />
      {/if}

      {#if errors.length}
        <div class="mb-2 rounded-card border border-[#3b1c1c] bg-[#140a0a] p-2.5">
          {#each errors as e}
            <p class="mono text-[10.5px] text-[#f43e64]">{e.path}: {e.message}</p>
          {/each}
        </div>
      {:else if ok}
        <div
          class="mb-2 rounded-card border border-[#1e3a2b] bg-[#0a140e] p-2.5 text-[11.5px] text-[#43cb7a]"
        >
          Valid spec · compiles to a Jev System One payload
        </div>
      {/if}

      {#if warnings.length}
        <div class="mb-2 rounded-card border border-[#3a3216] bg-[#14120a] p-2.5">
          {#each warnings as w}
            <p class="mono text-[10.5px] text-[#e9c93a]">{w.path}: {w.message}</p>
          {/each}
        </div>
      {/if}

      {#if payload}
        <div class="mb-2 flex gap-1.5">
          <button
            class="btn h-6 text-[10.5px]"
            onclick={() => download(`${name}.json`, payload, "application/json")}
          >
            Download payload
          </button>
          <button
            class="btn h-6 text-[10.5px]"
            onclick={() => download(`${name}.py`, script, "text/x-python")}
          >
            Download client
          </button>
        </div>
        <span class="label mb-1 block">Payload</span>
        <pre
          class="mono min-h-0 flex-1 overflow-auto rounded-card border border-line-2 bg-panel-2 p-2.5 text-[10.5px] text-ink-2">{payload}</pre>
      {/if}

      {#if running}
        <p class="mb-2 text-[12px] text-ink-2" role="status">
          Executed on {running.device} · {running.ms} ms
        </p>
        <span class="label mt-2 mb-1 block">Result</span>
        <div class="rounded-card border border-line-2 bg-panel-2 p-2.5">
          {#each running.answers as a}
            <div class="mb-1 flex items-baseline justify-between gap-2 text-[12px]">
              <span class="text-ink-3">{a.id}</span>
              <span class="font-semibold">
                {a.type === "noul" ? (a.value ? "yes" : "no") : a.value}
                <span class="mono ml-1 text-[10px] text-ink-3">p={a.probability.toFixed(3)}</span>
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</View>
