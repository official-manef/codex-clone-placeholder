import { api, runtimeConnection } from "#lib/http.js";
import type {
  WorkspaceBackend,
  WorkspaceBackendSelection,
  WorkspaceRuntimeAdapter,
} from "../../slices/workspace-shell/shared/runtime/index.js";

/** Laya retains control of its own transport, credentials, and authorization. */
export const layaWorkspaceRuntime: WorkspaceRuntimeAdapter = {
  connection() {
    const { hosted, connected } = runtimeConnection();
    return { hosted, connected };
  },
  async listBackends() {
    const result = await api.backends();
    if (result.error) throw new Error(result.error);
    if (!Array.isArray(result.backends))
      throw new Error("The runtime returned an invalid device list. Reconnect and try again.");
    return result.backends.filter(
      (item: unknown): item is WorkspaceBackend =>
        !!item &&
        typeof item === "object" &&
        typeof (item as WorkspaceBackend).id === "string" &&
        typeof (item as WorkspaceBackend).kind === "string" &&
        typeof (item as WorkspaceBackend).ready === "boolean",
    );
  },
};

/** Laya retains its existing selection policy without granting action authority. */
export const layaBackendSelection: WorkspaceBackendSelection = {
  chatEligible: (backend) => backend.kind === "local",
  chatSelectable: (id) => /^local:(npu|gpu|cpu)$/.test(id),
  persistBackend: (id) => id !== "byok",
  defaultCompareIds: ["local:cpu", "local:npu", "local:gpu"],
};
