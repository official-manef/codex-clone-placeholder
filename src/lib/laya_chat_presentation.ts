import {
  resolveChatPresentation,
  type WorkspaceChatPresentation,
} from "../../slices/workspace-shell/shared/runtime/index.js";
import { layaChatPresentation } from "./laya_workspace_routes.js";
export type LayaChatMode = (typeof layaChatPresentation.modes)[number];
export type LayaComparisonKind = (typeof layaChatPresentation.comparisonKinds)[number];
/** Product taxonomy belongs to the consumer, never to the reusable shell. */
export function resolveLayaChatPresentation(config?: WorkspaceChatPresentation) {
  const resolved = resolveChatPresentation(config);
  const modes = resolved.modes.filter((mode): mode is LayaChatMode =>
    layaChatPresentation.modes.some((id) => id === mode),
  );
  if (!modes.length) modes.push("chat");
  const comparisonKinds = (resolved.comparisonKinds ?? []).filter(
    (kind): kind is LayaComparisonKind =>
      layaChatPresentation.comparisonKinds.some((id) => id === kind),
  );
  return {
    ...resolved,
    modes,
    comparisonKinds,
    defaultMode: modes.includes(resolved.defaultMode as LayaChatMode)
      ? (resolved.defaultMode as LayaChatMode)
      : modes[0],
  };
}
