import type { ChatPanelRoute } from "../../slices/workspace-shell/shared/output-tabs/index.js";
import type { WorkspaceLabels } from "../../slices/workspace-shell/index.js";

/** Laya maps its chat-owned panels to its settings contributions. */
export const layaChatPanels: readonly ChatPanelRoute[] = [
  { id: "chat-tools", panel: "tools", aliases: ["mcp", "skills"] },
  { id: "chat-settings", panel: "models" },
  { id: "chat-session", panel: "utils" },
];

export const layaSettingsMenu = {
  primary: "chat-settings",
  integrations: "chat-tools",
  help: "faq",
  setup: "setup",
};

export const layaLauncherId = "workspace-home";

export const layaFileMenuViews = [
  { id: "files", label: "Open files…", command: "openFiles" },
  {
    id: "files",
    label: "Open folder…",
    command: "openFolder",
    shortcut: "Ctrl+O",
    binding: { key: "o", ctrl: true, allowInEditable: true },
  },
  { id: "browser", label: "Open browser" },
];

export const layaCanvasPresentation = {
  selfHeaderIds: ["files", "browser"],
  hideComputeIds: ["apps"],
};

/** Laya-specific connection copy; other labels use the neutral shell defaults. */
export const layaWorkspaceLabels: Partial<WorkspaceLabels> = {
  statusOnline: "Local workspace",
  hostedConnection: "Local connection",
  connectedTooltip: "Local server connected",
  disconnectedTooltip: "Server disconnected",
  connectionFailed: "The local server could not be reached.",
  connectionLost: "Local server disconnected.",
  moreTools: "More local tools",
  moreToolsTitle: "More tools",
};

/** Laya opts into these optional presentation features; the template defaults to Chat. */
export const layaChatPresentation = {
  modes: ["chat", "work", "compare"],
  modeLabels: { chat: "Chat", work: "Work", compare: "Compare" },
  maxComparisonPanels: 3,
  comparisonAddLabel: "Add comparison",
  defaultMode: "chat",
  comparisonKinds: ["models", "processors"],
} as const;

/** Laya theme choices; the template owns their presentation and bounded defaults. */
export const layaChatAppearance = {
  userBubbleBackground: "#4f3282",
  userBubbleColor: "#ffffff",
  bubbleRadius: 17,
  bubblePadding: 14,
  userMessageWidth: 80,
  actionSize: 28,
  headerHeight: 51,
  modeHeight: 52,
  entryWidth: 640,
  conversationWidth: 738,
  rowHeight: 34,
  rowRadius: 8,
  comparisonMinWidth: 220,
  modePlacement: "below-header",
  actionVisibility: "hover",
  rowActionVisibility: "hover",
  candidateColors: ["#b998f2", "#6bcec0", "#edb46b"],
} as const;

/** Product menu availability and composer contributions, separate from the template. */
export const layaChatUI = {
  modeSelection: "empty",
  modeCommands: true,
  pickerTitle: "Add to chat",
  attachmentLabel: "Files and folders",
  pickerEmptyLabel: "No matching tool or plugin. Try another name.",
  recentsLabel: "Recents",
  pickerTabs: [
    {
      id: "tools",
      label: "Tools /",
      marker: "/",
      kinds: ["action", "mode", "tool", "skill", "category"],
    },
    { id: "plugins", label: "Plugins @", marker: "@", kinds: ["plugin", "connection", "category"] },
  ],
  recentsActions: [
    { id: "options", label: "Recents options", icon: "more" },
    { id: "filter", label: "Filter chats", icon: "filter" },
    { id: "new", label: "New chat", icon: "edit" },
  ],
  sessionMenu: [
    { id: "rename", label: "Rename", icon: "edit", shortcut: "Ctrl+Alt+R" },
    { id: "pin", label: "Pin", icon: "pin", shortcut: "Ctrl+Alt+P" },
    {
      id: "section",
      label: "Section",
      icon: "list",
      children: [
        { id: "section-pinned", label: "Pinned" },
        { id: "section-recents", label: "Recents" },
      ],
    },
    {
      id: "lock",
      label: "Lock chat",
      icon: "lock",
      disabledReason: "This runtime does not enforce session locks.",
    },
    {
      id: "share",
      label: "Share",
      icon: "share",
      separator: true,
      disabledReason: "This local runtime does not provide share links.",
    },
    {
      id: "open",
      label: "Open in browser",
      icon: "globe",
      separator: true,
      disabledReason: "Individual session links are not available.",
    },
    {
      id: "archive",
      label: "Archive",
      icon: "archive",
      separator: true,
      disabledReason: "Server-side session archiving is not available.",
    },
    { id: "export", label: "Export chat", icon: "file" },
    { id: "delete", label: "Delete", icon: "trash", destructive: true },
    {
      id: "move-project",
      label: "Move to project",
      icon: "folder",
      separator: true,
      disabledReason: "This runtime has no chat project membership.",
    },
    {
      id: "remove-project",
      label: "Remove from project",
      icon: "folder",
      disabledReason: "This runtime has no chat project membership.",
    },
  ],
} as const;
