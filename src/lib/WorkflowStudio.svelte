<script lang="ts">
  import { onMount, tick, untrack } from "svelte";
  import { Icon } from "../../shared/icons/index.js";
  import RecoveryNotice from "#lib/RecoveryNotice.svelte";
  import BrowserAutomation from "#lib/BrowserAutomation.svelte";
  import WorkflowCanvas from "#lib/WorkflowCanvas.svelte";
  import { get, post } from "#lib/http.js";
  import { readDraft, saveDraft } from "#lib/drafts.js";
  let { active = true }: { active?: boolean } = $props();
  let catalogue = $state<any>(null);
  let definitions = $state<any[]>([]);
  let history = $state<any[]>([]);
  let template = $state("refund");
  let definitionId = $state("");
  let revision = $state<number | null>(null);
  let specText = $state("");
  let inputsText = $state("{}");
  let validation = $state<any>(null);
  let run = $state<any>(null);
  let busy = $state("");
  let error = $state("");
  let editRecovery = $state(false);
  let editorOpen = $state(false);
  let note = $state("");
  let confirmation = $state("");
  let hydrated = $state(false);
  let alive = true;
  let version = 0;
  let runRequest = 0;
  let refreshVersion = 0;
  let filePicker: HTMLInputElement;
  let pending = $derived(
    ["queued", "running", "waiting_approval", "waiting_user"].includes(run?.state),
  );
  function checked(value: any) {
    if (value?.error && !value.run_id) throw new Error(value.error);
    return value;
  }
  async function refresh() {
    const request = ++refreshVersion;
    const results = await Promise.all([
      get("/api/workflows/catalogue"),
      get("/api/workflows"),
      get("/api/workflows/runs"),
    ]);
    results.forEach(checked);
    if (!alive || request !== refreshVersion) return;
    catalogue = results[0];
    definitions = results[1].workflows ?? [];
    history = results[2].runs ?? [];
  }
  function loadTemplate() {
    const entry =
      catalogue?.templates?.find((item: any) => item.id === template) ?? catalogue?.templates?.[0];
    if (!entry) return;
    specText = JSON.stringify(entry.spec, null, 2);
    inputsText = JSON.stringify(
      Object.fromEntries(
        Object.entries(entry.spec.inputs ?? {})
          .filter(([, item]: any) => Object.hasOwn(item, "default"))
          .map(([key, item]: any) => [key, item.default]),
      ),
      null,
      2,
    );
    definitionId = "";
    revision = null;
    run = null;
    edited();
  }
  function edited() {
    version++;
    validation = null;
    if (!pending) {
      runRequest++;
      run = null;
    }
    error = "";
    note = "";
    confirmation = "";
  }
  async function action(name: string, operation: () => Promise<void>) {
    if (busy) return;
    busy = name;
    error = "";
    editRecovery = false;
    note = "";
    try {
      await operation();
    } catch (e) {
      editRecovery =
        e instanceof SyntaxError ||
        (["validate", "save", "start", "import"].includes(name) &&
          !/fetch|network|connect|running|approval|full|capacity/i.test(
            e instanceof Error ? e.message : "",
          ));
      if (alive)
        error =
          e instanceof Error
            ? e.message
            : "The workflow could not complete. Review its status and try again.";
    } finally {
      if (alive) busy = "";
    }
  }
  async function reviewEditor() {
    editorOpen = true;
    await tick();
    document.getElementById("workflow-json")?.focus();
  }
  async function validate() {
    await action("validate", async () => {
      const current = ++version;
      const value = checked(await post("/api/workflows/validate", { spec: JSON.parse(specText) }));
      if (alive && current === version) validation = value;
    });
  }
  async function save(copy = false) {
    await action("save", async () => {
      const current = ++version;
      const result = checked(
        await post("/api/workflows/save", {
          spec: JSON.parse(specText),
          ...(!copy && definitionId ? { id: definitionId, expected_revision: revision } : {}),
        }),
      );
      if (!alive || current !== version) return;
      definitionId = result.workflow.id;
      revision = result.workflow.revision;
      note = "Saved on this device.";
      await refresh();
    });
  }
  async function openDefinition(id: string) {
    if (!id || pending) return;
    await action("read", async () => {
      const current = ++version;
      const value = checked(await post("/api/workflows/read", { id }));
      if (!alive || current !== version) return;
      specText = JSON.stringify(value.workflow.spec, null, 2);
      definitionId = id;
      revision = value.workflow.revision;
      run = null;
      validation = null;
      inputsText = JSON.stringify(
        Object.fromEntries(
          Object.entries(value.workflow.spec.inputs ?? {})
            .filter(([, item]: any) => Object.hasOwn(item, "default"))
            .map(([key, item]: any) => [key, item.default]),
        ),
        null,
        2,
      );
    });
  }
  async function start() {
    if (pending) return;
    await action("start", async () => {
      const request = ++runRequest;
      const next = checked(
        await post("/api/workflows/start", {
          spec: JSON.parse(specText),
          inputs: JSON.parse(inputsText),
        }),
      );
      if (!alive || request !== runRequest) return;
      run = next;
      await refresh();
    });
  }
  async function runAction(kind: "approve" | "cancel" | "resume") {
    if (!run?.run_id) return;
    const runId = run.run_id;
    const approvalId = run.approval?.approval_id;
    await action(kind, async () => {
      const request = ++runRequest;
      const next = checked(
        await post(`/api/workflows/${kind}`, {
          run_id: runId,
          ...(kind === "cancel" ? {} : { confirm: true }),
          ...(kind === "approve" ? { approval_id: approvalId } : {}),
        }),
      );
      if (alive && request === runRequest && run?.run_id === runId) run = next;
    });
  }
  async function readRun(id: string) {
    if (!id || pending) return;
    await action("run", async () => {
      const request = ++runRequest;
      const next = checked(await post("/api/workflows/run", { run_id: id }));
      if (alive && request === runRequest) run = next;
    });
  }
  async function remove(kind: "definition" | "run") {
    if (pending || confirmation !== kind) return;
    await action("delete", async () => {
      runRequest++;
      checked(
        await post(`/api/workflows/${kind === "run" ? "delete-run" : "delete"}`, {
          ...(kind === "run" ? { run_id: run.run_id } : { id: definitionId }),
          confirm: true,
        }),
      );
      if (kind === "run") run = null;
      else {
        definitionId = "";
        revision = null;
      }
      confirmation = "";
      await refresh();
    });
  }
  async function importFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    await action("import", async () => {
      if (!catalogue || file.size > catalogue.limits.max_spec_bytes)
        throw new Error(
          "This JSON file exceeds the workflow definition limit shown by the server.",
        );
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
      JSON.parse(text);
      specText = text;
      definitionId = "";
      revision = null;
      run = null;
      edited();
    });
  }
  function download(python = false) {
    try {
      const parsed = JSON.parse(specText);
      const text = python
        ? `import json\nfrom workflow_sdk import Client, Workflow\n\nworkflow = Workflow.from_json(${JSON.stringify(JSON.stringify(parsed))})\nclient = Client(api=${JSON.stringify(location.origin)})\nprint(client.validate(workflow))\nrun = client.start(workflow, inputs=json.loads(${JSON.stringify(inputsText)}))\nprint(json.dumps(run, indent=2))\n# Each action pauses. Review its exact arguments before client.approve(..., confirm=True).\n`
        : JSON.stringify(parsed, null, 2);
      const url = URL.createObjectURL(
        new Blob([text], { type: python ? "text/x-python;charset=utf-8" : "application/json" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = python ? "workflow.py" : "workflow.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      error = e instanceof Error ? e.message : "Correct the JSON before exporting.";
    }
  }
  onMount(() => {
    alive = true;
    const stored = readDraft<any>("workflow-studio", null);
    if (typeof stored?.specText === "string") specText = stored.specText;
    if (typeof stored?.inputsText === "string") inputsText = stored.inputsText;
    if (typeof stored?.definitionId === "string") definitionId = stored.definitionId;
    if (typeof stored?.revision === "number") revision = stored.revision;
    hydrated = true;
    const initialVersion = version;
    refresh()
      .then(() => {
        if (!stored && alive && version === initialVersion) loadTemplate();
      })
      .catch((e) => {
        if (alive) error = e.message;
      });
    if (/^[a-f0-9]{24}$/.test(stored?.runId ?? "")) {
      const request = ++runRequest;
      post("/api/workflows/run", { run_id: stored.runId })
        .then((value) => {
          if (alive && request === runRequest && version === initialVersion && !run)
            run = checked(value);
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
      version++;
      runRequest++;
    };
  });
  $effect(() => {
    if (active)
      untrack(() => {
        if (hydrated)
          refresh().catch((e) => {
            if (alive) error = e.message;
          });
      });
  });
  $effect(() => {
    if (hydrated)
      saveDraft("workflow-studio", {
        specText,
        inputsText,
        definitionId,
        revision,
        runId: run?.run_id,
      });
  });
  $effect(() => {
    if (!active || !pending || !run?.run_id) return;
    const id = run.run_id;
    let polling = false;
    let cancelled = false;
    const timer = setInterval(async () => {
      if (polling || busy) return;
      polling = true;
      const request = ++runRequest;
      try {
        const next = checked(await post("/api/workflows/run", { run_id: id }));
        if (alive && !cancelled && request === runRequest && run?.run_id === id) {
          run = next;
          if (!["queued", "running", "waiting_approval", "waiting_user"].includes(next.state))
            await refresh();
        }
      } catch (e) {
        if (alive && !cancelled && request === runRequest && run?.run_id === id)
          error = e instanceof Error ? e.message : "Cannot read workflow status.";
      } finally {
        polling = false;
      }
    }, 900);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  });
</script>

<section class="workflow-studio" aria-label="Dynamic workflow editor">
  <div class="studio-toolbar">
    <label
      >Start from<select class="field" bind:value={template} disabled={!!busy || pending}
        >{#each catalogue?.templates ?? [] as item}<option value={item.id}>{item.label}</option
          >{/each}</select
      ></label
    >
    <button class="btn" onclick={loadTemplate} disabled={!catalogue || !!busy || pending}
      >Use starter</button
    >
    <label
      >Saved workflows<select
        class="field"
        value={definitionId}
        onchange={(e) => openDefinition(e.currentTarget.value)}
        disabled={!!busy || pending}
        ><option value="">Unsaved draft</option>{#each definitions as item}<option value={item.id}
            >{item.name}</option
          >{/each}</select
      ></label
    >
    <div class="primary-actions">
      <button class="btn" onclick={validate} disabled={!!busy || pending || !specText}>Check</button
      >
      <button class="btn" onclick={() => save()} disabled={!!busy || pending || !specText}
        >Save</button
      >
      <button class="btn btn-solid" onclick={start} disabled={!!busy || pending || !specText}
        ><Icon name="play" size={13} />{busy === "start"
          ? "Starting…"
          : pending
            ? "Running"
            : "Run workflow"}</button
      >
    </div>
  </div>
  {#if run?.child}<section class="child-recording" aria-label="Workflow app recording">
      <BrowserAutomation
        kind={run.child.kind === "browser" ? "browser" : "desktop"}
        managedRunId={run.child.run_id}
        {active}
      />
    </section>{/if}
  {#if error}<RecoveryNotice
      message={error}
      retry={editRecovery ? reviewEditor : () => action("refresh", refresh)}
      retryLabel={editRecovery ? "Edit workflow" : "Check connection"}
    />{/if}
  {#if note}<p role="status" class="studio-help">{note}</p>{/if}
  <WorkflowCanvas
    bind:specText
    bind:inputsText
    {catalogue}
    {run}
    disabled={pending || !!busy}
    onedit={edited}
  />
  {#if validation}<div class="validation" role="status">
      <strong>{validation.ok ? "Ready to run" : "Review these settings"}</strong>
      {#each validation.errors ?? [] as item}<p>{item.path}: {item.message}</p>{/each}
      {#if validation.ok}<span class="studio-help">Actions pause for your approval.</span>{/if}
    </div>{/if}
  <div class="editor-grid">
    <details class="advanced-editor" bind:open={editorOpen}>
      <summary>Advanced · JSON, Python & MCP</summary>
      <label for="workflow-json" class="field-label">Workflow JSON</label>
      <textarea
        id="workflow-json"
        class="field mono spec-editor"
        bind:value={specText}
        oninput={edited}
        disabled={pending || !!busy}
        spellcheck="false"
        aria-describedby="workflow-contract"></textarea>
      <label for="workflow-inputs" class="field-label">Run inputs · JSON object</label>
      <textarea
        id="workflow-inputs"
        class="field mono inputs-editor"
        bind:value={inputsText}
        disabled={pending || !!busy}
        spellcheck="false"></textarea>
      <div class="studio-actions">
        {#if definitionId}<button
            class="btn"
            onclick={() => save(true)}
            disabled={!!busy || pending}>Save a copy</button
          >{/if}
      </div>
      <div class="studio-actions">
        <input
          type="file"
          accept=".json,application/json"
          class="sr-only"
          bind:this={filePicker}
          onchange={importFile}
        />
        <button class="btn" onclick={() => filePicker?.click()} disabled={!!busy || pending}
          >Import JSON</button
        >
        <button class="btn" onclick={() => download()} disabled={!specText}>Export JSON</button>
        <button class="btn" onclick={() => download(true)} disabled={!specText}
          >Export Python</button
        >
        <button class="btn" onclick={() => action("refresh", refresh)} disabled={!!busy}
          >Refresh list</button
        >
        {#if definitionId}<button
            class="btn"
            onclick={() => (confirmation = "definition")}
            disabled={!!busy || pending}>Delete definition…</button
          >{/if}
      </div>
    </details>
    <details class="run-panel" open={!!run}>
      <summary>Runs & history{run ? ` · ${run.state.replaceAll("_", " ")}` : ""}</summary>
      <aside aria-label="Workflow execution">
        <div class="run-title">
          <h2>{run?.name ?? "Run history"}</h2>
          {#if pending}<button class="btn" onclick={() => runAction("cancel")} disabled={!!busy}
              >Cancel run</button
            >{/if}
        </div>
        {#if run}<p role="status">{run.state} · {((run.elapsed_ms ?? 0) / 1000).toFixed(1)} s</p>
          {#if run.error}<RecoveryNotice message={run.error} />{/if}
          {#if run.approval}<section class="approval" aria-label="Review pending action">
              <h3>Approve this step?</h3>
              <p>{run.approval.type} · {run.approval.step_id}</p>
              <pre>{JSON.stringify(run.approval.args, null, 2)}</pre>
              <p>Only the data and action shown here will be approved.</p>
              <button class="btn btn-solid" onclick={() => runAction("approve")} disabled={!!busy}
                >Approve this step</button
              >
            </section>{/if}
          {#if run.state === "waiting_user"}<section
              class="approval"
              aria-label="Browser needs your attention"
            >
              <h3>Continue in the separate browser</h3>
              <p>
                {run.child?.handoff?.message ??
                  "Review the browser prompt yourself, then recheck the same page."}
              </p>
              <button class="btn" onclick={() => runAction("resume")} disabled={!!busy}
                >I finished · recheck page</button
              >
            </section>{/if}
          <ol class="run-steps">
            {#each run.steps ?? [] as step}<li>
                <strong>{step.id}</strong><span>{step.type} · {step.state}</span>{#if step.error}<p>
                    {step.error}
                  </p>{/if}{#if step.result}<details>
                    <summary>Actual result</summary>
                    <pre>{JSON.stringify(step.result, null, 2)}</pre>
                  </details>{/if}
              </li>{/each}
          </ol>
          {#if run.child}<p class="studio-help">
              {run.child.kind} recording · {run.child.run_id} · {run.child.state}
            </p>{/if}
          {#if !pending}<button class="btn" onclick={() => (confirmation = "run")} disabled={!!busy}
              >Delete run history…</button
            >{/if}
        {:else}<p>Choose a previous run, or run the workflow above.</p>{/if}
        <label class="field-label" for="workflow-history">Run history</label><select
          id="workflow-history"
          class="field"
          value={run?.run_id ?? ""}
          onchange={(e) => readRun(e.currentTarget.value)}
          disabled={pending || !!busy}
          ><option value="">Choose a previous run</option>{#each history as item}<option
              value={item.run_id}>{item.name} · {item.state}</option
            >{/each}</select
        >
      </aside>
    </details>
  </div>
  {#if confirmation}<div class="approval" role="alert">
      <p>
        Delete this {confirmation === "run" ? "run history" : "workflow definition"} permanently? Other
        definitions, recordings and user files stay in place.
      </p>
      <button
        class="btn"
        onclick={() => remove(confirmation as "definition" | "run")}
        disabled={!!busy}>Delete permanently</button
      ><button class="btn" onclick={() => (confirmation = "")} disabled={!!busy}>Keep it</button>
    </div>{/if}
  <details id="workflow-contract">
    <summary>Python, MCP and supported steps</summary>
    <p>{catalogue?.execution_note}</p>
    <p>{catalogue?.language_note}</p>
    <p>{catalogue?.step_types?.map((item: any) => item.type).join(" · ")}</p>
    <p>
      Limits: {catalogue?.limits?.max_steps ?? "…"} steps, {catalogue?.limits?.max_definitions ??
        "…"} saved definitions. An agent should read laya_agent_context and laya_workflow_catalogue before
      generating a definition.
    </p>
    <pre>{catalogue?.python_example ?? "Loading Python example…"}</pre>
  </details>
</section>

<style>
  .workflow-studio {
    max-width: 1550px;
    font-size: 13px;
    line-height: 1.6;
  }
  .studio-toolbar,
  .studio-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 8px;
  }
  .primary-actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }
  .studio-toolbar label {
    display: grid;
    gap: 5px;
    font-size: 11px;
    color: var(--color-ink-2);
  }
  .studio-toolbar select {
    width: min(270px, 100%);
    min-height: 34px;
  }
  .studio-help {
    color: var(--color-ink-2);
    font-size: 12px;
    margin: 12px 0 18px;
    max-width: 90ch;
  }
  .editor-grid {
    display: flex;
    flex-direction: column-reverse;
    gap: 8px;
  }
  .field-label {
    display: block;
    margin: 15px 0 7px;
    font-size: 12px;
  }
  .spec-editor {
    min-height: 390px;
    font-size: 12px;
    line-height: 1.7;
  }
  .inputs-editor {
    min-height: 90px;
    font-size: 12px;
  }
  .studio-actions {
    margin: 12px 0;
  }
  aside {
    min-width: 0;
    padding: 6px 0;
  }
  .run-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  h2 {
    font-size: 16px;
    margin: 12px 0;
  }
  h3 {
    font-size: 13px;
    margin: 0 0 7px;
  }
  p {
    color: var(--color-ink-2);
  }
  pre {
    font-size: 11px;
    line-height: 1.65;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    max-height: 340px;
    overflow-y: auto;
  }
  .approval,
  .validation {
    padding: 14px 0;
    margin: 14px 0;
    border-top: 1px solid var(--color-line);
    border-bottom: 1px solid var(--color-line);
  }
  .approval .btn {
    margin: 7px 6px 0 0;
  }
  .run-steps {
    padding: 0;
    list-style: none;
  }
  .run-steps li {
    padding: 10px 0;
    border-bottom: 1px solid var(--color-line);
  }
  li span {
    display: block;
    color: var(--color-ink-2);
    font-size: 11px;
  }
  details {
    margin-top: 18px;
  }
  .advanced-editor,
  .run-panel {
    border-top: 1px solid var(--color-line);
    padding-top: 16px;
  }
  .child-recording {
    margin: 24px 0;
  }
  @media (max-width: 1000px) {
    .editor-grid {
      grid-template-columns: 1fr;
    }
    aside {
      border-left: 0;
      border-top: 1px solid var(--color-line);
      padding: 16px 0 0;
    }
  }
</style>
