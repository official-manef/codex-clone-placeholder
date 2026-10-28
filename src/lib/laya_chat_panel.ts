/** Laya-owned panels; other consumers may define entirely different panel IDs. */
export type LayaChatPanel = "" | "tools" | "mcp" | "skills" | "models" | "utils";

/** An unknown host-provided panel must not mutate the current chat panel. */
export function isLayaChatPanel(value: string): value is LayaChatPanel {
  return ["", "tools", "mcp", "skills", "models", "utils"].includes(value);
}
