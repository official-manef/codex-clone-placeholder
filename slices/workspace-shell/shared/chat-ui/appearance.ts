/** Generic chat presentation tokens. They grant no runtime capabilities. */
export type WorkspaceChatAppearance = {
  userBubbleBackground?: string;
  userBubbleColor?: string;
  assistantBubbleBackground?: string;
  bubbleRadius?: number;
  bubblePadding?: number;
  userMessageWidth?: number;
  actionSize?: number;
  headerHeight?: number;
  modeHeight?: number;
  entryWidth?: number;
  conversationWidth?: number;
  rowActionFade?: number;
  rowActionDuration?: number;
  pickerRadius?: number;
  rowHeight?: number;
  rowRadius?: number;
  comparisonMinWidth?: number;
  actionVisibility?: "hover" | "always";
  rowActionVisibility?: "hover" | "always";
  modePlacement?: "below-header" | "above-header";
  candidateColors?: readonly string[];
};
export function chatAppearanceStyle(config: WorkspaceChatAppearance = {}): string {
  const size = (v: number | undefined, fallback: number, min: number, max: number) =>
    `${typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback}px`;
  const color = (v: string | undefined, fallback: string) =>
    typeof v === "string" && v.length < 150 && !/[;{}<>]/.test(v) ? v : fallback;
  const tokens = {
    "--chat-user-background": color(config.userBubbleBackground, "var(--color-hover)"),
    "--chat-user-color": color(config.userBubbleColor, "var(--color-ink)"),
    "--chat-assistant-background": color(config.assistantBubbleBackground, "transparent"),
    "--chat-bubble-radius": size(config.bubbleRadius, 16, 0, 40),
    "--chat-bubble-padding": size(config.bubblePadding, 14, 4, 32),
    "--chat-user-width": `${Math.max(40, Math.min(100, Number.isFinite(config.userMessageWidth) ? config.userMessageWidth! : 80))}%`,
    "--chat-action-size": size(config.actionSize, 28, 24, 44),
    "--chat-header-height": size(config.headerHeight, 51, 40, 80),
    "--chat-mode-height": size(config.modeHeight, 52, 40, 80),
    "--chat-entry-width": size(config.entryWidth, 640, 240, 1600),
    "--chat-reading-width": size(config.conversationWidth, 738, 240, 1800),
    "--chat-row-action-fade": size(config.rowActionFade, 14, 0, 32),
    "--chat-picker-radius": size(config.pickerRadius, 12, 0, 32),
    "--chat-row-action-duration": `${typeof config.rowActionDuration === "number" && Number.isFinite(config.rowActionDuration) ? Math.max(0, Math.min(400, config.rowActionDuration)) : 140}ms`,
    "--chat-row-height": size(config.rowHeight, 34, 28, 60),
    "--chat-row-radius": size(config.rowRadius, 8, 0, 30),
    "--chat-comparison-min": size(config.comparisonMinWidth, 240, 180, 500),
    "--chat-action-idle-opacity": config.actionVisibility === "always" ? "1" : "0",
    "--chat-action-idle-pointer-events": config.actionVisibility === "always" ? "auto" : "none",
    "--chat-row-idle-pointer-events": config.rowActionVisibility === "always" ? "auto" : "none",
    "--chat-row-idle-space":
      config.rowActionVisibility === "always" ? "var(--chat-row-actions-width, 62px)" : "8px",
    "--chat-row-idle-opacity": config.rowActionVisibility === "always" ? "1" : "0",
    "--chat-mode-order": config.modePlacement === "above-header" ? "-1" : "0",
  };
  return Object.entries(tokens)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}
export function chatCandidateColors(config?: WorkspaceChatAppearance): readonly string[] {
  const colors = config?.candidateColors
    ?.filter((value) => /^#[0-9a-f]{6}$/i.test(value))
    .slice(0, 8);
  return colors?.length ? colors : ["#b998f2", "#6bcec0", "#edb46b"];
}
