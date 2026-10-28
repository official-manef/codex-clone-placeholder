/** Presentation metadata only. Consumers supply handlers and enforce permissions. */
export type ChatMenuAction = {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  destructive?: boolean;
  disabledReason?: string;
  separator?: boolean;
  children?: readonly ChatMenuAction[];
};

export type WorkspaceChatUIConfig = {
  modeSelection?: "empty" | "always";
  modeCommands?: boolean;
  sessionMenu?: readonly ChatMenuAction[];
  recentsActions?: readonly { id: string; label: string; icon?: string }[];
  pickerTabs?: readonly {
    id: string;
    label: string;
    marker: "/" | "@";
    kinds: readonly string[];
  }[];
  pickerTitle?: string;
  pickerEmptyLabel?: string;
  attachmentLabel?: string;
  recentsLabel?: string;
};

export type ResolvedChatUIConfig = Required<WorkspaceChatUIConfig>;

const MAX_ITEMS = 64;
const MAX_MENU_DEPTH = 6;
const MAX_MENU_ITEMS = 256;
const MAX_LABEL_LENGTH = 500;

function label(value: string | undefined, fallback: string): string {
  return value === undefined ? fallback : value.slice(0, MAX_LABEL_LENGTH);
}

/** Return a bounded, independent snapshot; never modify the consumer's config. */
export function resolveChatUI(config: WorkspaceChatUIConfig = {}): ResolvedChatUIConfig {
  let remaining = MAX_MENU_ITEMS;
  function menu(items: readonly ChatMenuAction[], depth = 0): ChatMenuAction[] {
    const result: ChatMenuAction[] = [];
    for (const item of items.slice(0, MAX_ITEMS)) {
      if (remaining-- <= 0) break;
      const copy: ChatMenuAction = { ...item };
      if (item.children !== undefined)
        copy.children = depth < MAX_MENU_DEPTH ? menu(item.children, depth + 1) : [];
      result.push(copy);
    }
    return result;
  }
  return {
    modeSelection: config.modeSelection === "always" ? "always" : "empty",
    modeCommands: config.modeCommands === true,
    sessionMenu: menu(config.sessionMenu ?? []),
    recentsActions: (config.recentsActions ?? []).slice(0, MAX_ITEMS).map((item) => ({ ...item })),
    pickerTabs: (config.pickerTabs ?? []).slice(0, MAX_ITEMS).map((item) => ({
      ...item,
      kinds: item.kinds.slice(0, MAX_ITEMS),
    })),
    pickerTitle: label(config.pickerTitle, "Commands"),
    pickerEmptyLabel: label(config.pickerEmptyLabel, "No matching items."),
    attachmentLabel: label(config.attachmentLabel, "Attach files"),
    recentsLabel: label(config.recentsLabel, "Recents"),
  };
}
