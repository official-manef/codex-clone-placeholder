/** Browser page tools, separate from the local stdio/HTTP MCP transport. */
export type WebMCPView = { id: string; label: string; group?: string };
export type WebMCPStatus = {
  state: "unsupported" | "registering" | "ready" | "error" | "closed";
  api: "document" | "navigator" | null;
  toolCount: number;
};
type Workspace = { activeView: string; openViews: readonly string[] };
type Input = Record<string, unknown>;
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Input;
  annotations: { readOnlyHint: boolean; consequentialHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown, options?: { signal?: AbortSignal }) => Promise<string>;
};
type ModelContext = {
  registerTool: (tool: Tool, options?: { signal: AbortSignal }) => void | Promise<void>;
  unregisterTool?: (name: string) => void;
};
type Environment = {
  document?: { modelContext?: ModelContext };
  navigator?: { modelContext?: ModelContext };
  secureContext?: boolean;
};
export type WebMCPAdapter = {
  views: () => readonly WebMCPView[];
  workspace: () => Workspace;
  navigate: (id: string) => void | Promise<void>;
  read: (path: string, signal?: AbortSignal) => Promise<unknown>;
  validate: (spec: Input, signal?: AbortSignal) => Promise<unknown>;
  onStatus?: (status: WebMCPStatus) => void;
};
const NONE = { type: "object", properties: {}, additionalProperties: false };
const CAPABILITY_GROUPS = [
  "chat",
  "audio",
  "attachments",
  "embeddings",
  "browser_rpa",
  "desktop_rpa",
  "workflows",
  "benchmarks",
  "sessions",
  "mcp",
];
const AUDIO_LISTS = ["formats", "devices", "prepared_devices", "languages"];
function record(value: unknown): value is Input {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function validInput(value: unknown, keys: readonly string[] = []): Input {
  if (!record(value) || Object.keys(value).some((key) => !keys.includes(key)))
    throw new Error("Supply only the fields declared by this tool's input schema.");
  return value;
}
function checked(value: unknown): Input {
  if (!record(value) || value.error)
    throw new Error(
      "The local runtime could not complete this request. Check the connection in Laya and retry.",
    );
  return value;
}
function safeLimits(value: unknown): Input {
  if (!record(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, item]) =>
        (key.startsWith("max_") ||
          ["approval_seconds", "attachment_chunk_chars", "width", "height"].includes(key)) &&
        typeof item === "number" &&
        Number.isFinite(item) &&
        item >= 0,
    ),
  );
}
/** Deliberately excludes audio model paths, errors, credentials and future unknown fields. */
export function publicCapabilities(value: unknown): Input {
  const root = checked(value),
    result: Input = {};
  for (const group of CAPABILITY_GROUPS) {
    const source = root[group];
    if (!record(source)) continue;
    result[group] = safeLimits(source);
    if (group === "audio") {
      const target = result[group] as Input;
      for (const key of ["present", "converter", "multilingual", "timestamps"])
        if (typeof source[key] === "boolean") target[key] = source[key];
      for (const key of AUDIO_LISTS)
        if (Array.isArray(source[key]))
          target[key] = source[key].filter((item) => typeof item === "string");
    }
    if (group === "attachments" && record(source.images))
      (result[group] as Input).images = Object.fromEntries(
        ["vision", "ocr", "verification"]
          .filter((key) => typeof (source.images as Input)[key] === "boolean")
          .map((key) => [key, (source.images as Input)[key]]),
      );
    if (group === "mcp" && Array.isArray(source.protocol_versions))
      (result[group] as Input).protocol_versions = source.protocol_versions.filter(
        (item) => typeof item === "string",
      );
  }
  return result;
}
function currentEnvironment(): Environment {
  return {
    document:
      typeof document === "undefined"
        ? undefined
        : (document as unknown as Environment["document"]),
    navigator:
      typeof navigator === "undefined"
        ? undefined
        : (navigator as unknown as Environment["navigator"]),
    secureContext: typeof window === "undefined" ? false : window.isSecureContext,
  };
}
/** Installation is optional and never polyfills browser authority or weakens permissions. */
export function installWebMCP(
  adapter: WebMCPAdapter,
  environment: Environment = currentEnvironment(),
) {
  const preferred = environment.document?.modelContext;
  const legacy = environment.navigator?.modelContext;
  const context =
    typeof preferred?.registerTool === "function"
      ? preferred
      : typeof legacy?.registerTool === "function" && typeof legacy.unregisterTool === "function"
        ? legacy
        : undefined;
  const api: WebMCPStatus["api"] = context
    ? context === preferred
      ? "document"
      : "navigator"
    : null;
  const controller = new AbortController();
  const registered = new Set<string>();
  let disposed = false;
  let status: WebMCPStatus = { state: "unsupported", api, toolCount: 0 };
  const update = (state: WebMCPStatus["state"]) => {
    status = { state, api, toolCount: state === "ready" ? registered.size : 0 };
    adapter.onStatus?.(status);
  };
  const unregisterLegacy = () => {
    if (api !== "navigator" || !context?.unregisterTool) return;
    for (const name of registered) {
      try {
        context.unregisterTool(name);
      } catch {
        /* Other registrations are never cleared. */
      }
    }
    registered.clear();
  };
  const views = () =>
    adapter
      .views()
      .filter((view) => /^[a-z][a-z0-9-]{0,63}$/.test(view.id))
      .map(({ id, label, group }) => ({ id, label, group }));
  const snapshot = () => {
    const allowed = new Set(views().map((view) => view.id));
    const value = adapter.workspace();
    return {
      activeView: allowed.has(value.activeView) ? value.activeView : "chat",
      openViews: [...new Set(value.openViews.filter((id) => allowed.has(id)))],
    };
  };
  type Action = (input: Input, signal: AbortSignal) => unknown | Promise<unknown>;
  const tool = (
    name: string,
    title: string,
    description: string,
    inputSchema: Input,
    action: Action,
    readOnly = true,
    untrusted = false,
  ): Tool => ({
    name,
    title,
    description,
    inputSchema,
    annotations: {
      readOnlyHint: readOnly,
      consequentialHint: false,
      untrustedContentHint: untrusted,
    },
    async execute(input, options = {}) {
      const execution = new AbortController();
      const cancel = () => execution.abort();
      controller.signal.addEventListener("abort", cancel, { once: true });
      options.signal?.addEventListener("abort", cancel, { once: true });
      try {
        if (disposed || controller.signal.aborted || options.signal?.aborted)
          throw new Error("Tool execution was cancelled. Reopen Laya if its page has closed.");
        const result = await action(
          validInput(input, Object.keys((inputSchema.properties as Input) ?? {})),
          execution.signal,
        );
        if (execution.signal.aborted) throw new Error("Tool execution was cancelled.");
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          ok: false,
          error:
            error instanceof Error
              ? error.message.slice(0, 500)
              : "This tool could not complete. Check Laya and retry.",
        });
      } finally {
        controller.signal.removeEventListener("abort", cancel);
        options.signal?.removeEventListener("abort", cancel);
      }
    },
  });
  const definitions = [
    tool(
      "laya_ui_views",
      "List workspace views",
      "Discover Laya's real workspace views and current view selection. No chat contents or saved files are read.",
      NONE,
      () => ({ views: views(), workspace: snapshot() }),
    ),
    tool(
      "laya_ui_open_view",
      "Open workspace view",
      "Open a canvas view or its Settings category. Opening a view never starts a workflow, inference, recording or approval.",
      {
        type: "object",
        properties: {
          view: {
            type: "string",
            description: "Workspace view ID returned by laya_ui_views; available views can change.",
          },
        },
        required: ["view"],
        additionalProperties: false,
      },
      async (input) => {
        if (typeof input.view !== "string" || !views().some((view) => view.id === input.view))
          throw new Error("Choose a view returned by laya_ui_views.");
        await adapter.navigate(input.view);
        return { ok: true, workspace: snapshot() };
      },
      false,
    ),
    tool(
      "laya_ui_status",
      "Read runtime capabilities",
      "Read connection and bounded runtime limits, without credentials, model paths, session contents or recordings.",
      NONE,
      async (_input, signal) => {
        const [runtimeValue, capabilityValue] = await Promise.all([
          adapter.read("/api/runtime", signal),
          adapter.read("/api/capabilities", signal),
        ]);
        const runtime = checked(runtimeValue);
        return {
          runtime: {
            state: typeof runtime.state === "string" ? runtime.state : "unknown",
            uptime_s: typeof runtime.uptime_s === "number" ? runtime.uptime_s : null,
            local: runtime.local === true,
            restart_available: runtime.restart_available === true,
            blocked_operations: Array.isArray(runtime.blockers) ? runtime.blockers.length : 0,
          },
          capabilities: publicCapabilities(capabilityValue),
        };
      },
    ),
    tool(
      "laya_ui_agent_context",
      "Read local AI authoring guidance",
      "Read Laya's typed question, option and deterministic policy contract before authoring questions or a workflow. Discovery grants no action permission.",
      NONE,
      async (_input, signal) => {
        const result = checked(await adapter.read("/api/agent-context", signal));
        const model = record(result.model) ? result.model : {};
        return {
          ...Object.fromEntries(
            [
              "schema_version",
              "purpose",
              "limits",
              "supported_question_types",
              "model_input",
              "authoring",
              "execution",
              "question_example",
              "workflow_schema",
              "task_status",
              "sources",
            ]
              .filter((key) => key in result)
              .map((key) => [key, result[key]]),
          ),
          model: { label: model.label, custom: model.custom, capabilities: model.capabilities },
        };
      },
    ),
    tool(
      "laya_ui_workflow_catalogue",
      "Read workflow catalogue",
      "Read current declarative workflow schema, adapters, templates and approval rules. This does not read saved private workflows or run anything.",
      NONE,
      async (_input, signal) => checked(await adapter.read("/api/workflows/catalogue", signal)),
    ),
    tool(
      "laya_ui_validate_workflow",
      "Validate a workflow draft",
      "Validate a bounded declarative workflow without saving, running or approving it. Read the workflow catalogue before authoring its steps.",
      {
        type: "object",
        properties: {
          spec: { type: "object", description: "Declarative workflow definition to validate." },
        },
        required: ["spec"],
        additionalProperties: false,
      },
      async (input, signal) => {
        if (!record(input.spec)) throw new Error("Supply the workflow definition as an object.");
        const capability = checked(await adapter.read("/api/capabilities", signal));
        const maximum = record(capability.workflows)
          ? capability.workflows.max_spec_bytes
          : undefined;
        if (typeof maximum !== "number" || !Number.isFinite(maximum) || maximum <= 0)
          throw new Error(
            "Laya did not report its workflow limit. Reconnect and retry validation.",
          );
        let encoded: string;
        try {
          encoded = JSON.stringify(input.spec);
        } catch {
          throw new Error("Workflow input must be serializable JSON.");
        }
        if (new TextEncoder().encode(encoded).byteLength > maximum)
          throw new Error(
            "Workflow exceeds the runtime's current definition limit. Reduce the draft and retry.",
          );
        if (signal.aborted) throw new Error("Tool execution was cancelled.");
        return checked(await adapter.validate(input.spec, signal));
      },
      true,
      true,
    ),
  ];
  const ready = (async () => {
    if (!context || environment.secureContext === false) {
      update("unsupported");
      return;
    }
    update("registering");
    try {
      for (const definition of definitions) {
        if (disposed) break;
        await context.registerTool(definition, { signal: controller.signal });
        registered.add(definition.name);
        if (disposed) unregisterLegacy();
      }
      if (!disposed) update("ready");
    } catch {
      controller.abort();
      unregisterLegacy();
      if (!disposed) update("error");
    }
  })();
  return {
    ready,
    get status() {
      return status;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      unregisterLegacy();
      update("closed");
    },
  };
}
