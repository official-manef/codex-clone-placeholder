import { get, post } from "#lib/http.js";
import { installWebMCP, type WebMCPAdapter } from "#lib/webmcp.js";

/** Laya owns its page tools and HTTP transport; the shell only supplies view state. */
export function installLayaWorkspaceIntegration(
  workspace: Pick<WebMCPAdapter, "views" | "workspace" | "navigate">,
): () => void {
  const integration = installWebMCP({
    ...workspace,
    read: (path, signal) => get(path, signal),
    validate: (spec, signal) => post("/api/workflows/validate", { spec }, signal),
  });
  return () => integration.dispose();
}
