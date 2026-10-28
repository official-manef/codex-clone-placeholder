/** Native edit actions, dispatched only to the editable captured before a menu opens. */
export type WorkspaceEditCommand =
  "undo" | "redo" | "cut" | "copy" | "paste" | "delete" | "selectAll";

const commands: readonly WorkspaceEditCommand[] = [
  "undo",
  "redo",
  "cut",
  "copy",
  "paste",
  "delete",
  "selectAll",
];
const textTypes = new Set(["text", "search", "url", "tel", "email", "password"]);

type TextTarget = HTMLInputElement | HTMLTextAreaElement;
type Snapshot =
  | {
      kind: "text";
      target: TextTarget;
      start: number;
      end: number;
      direction: "forward" | "backward" | "none";
    }
  | { kind: "content"; target: HTMLElement; range: Range };

/** Captures selection and command availability while the editable still has focus. */
export function captureEditCommands(document: Document) {
  const active = document.activeElement as HTMLElement | null;
  let snapshot: Snapshot | undefined;
  if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
    const target = active as TextTarget;
    if (
      !target.disabled &&
      !target.readOnly &&
      (target.tagName === "TEXTAREA" || textTypes.has((target as HTMLInputElement).type)) &&
      target.selectionStart !== null &&
      target.selectionEnd !== null
    ) {
      snapshot = {
        kind: "text",
        target,
        start: target.selectionStart,
        end: target.selectionEnd,
        direction: target.selectionDirection ?? "none",
      };
    }
  } else if (active?.isContentEditable) {
    const selection = document.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      if (active.contains(range.startContainer) && active.contains(range.endContainer))
        snapshot = { kind: "content", target: active, range: range.cloneRange() };
    }
  }

  const enabled = new Map<WorkspaceEditCommand, boolean>();
  for (const command of commands) {
    try {
      enabled.set(
        command,
        !!snapshot &&
          document.queryCommandSupported(command) &&
          document.queryCommandEnabled(command),
      );
    } catch {
      enabled.set(command, false);
    }
  }

  return {
    isEnabled(command: WorkspaceEditCommand): boolean {
      return enabled.get(command) === true;
    },
    execute(command: WorkspaceEditCommand): boolean {
      if (
        !snapshot ||
        !enabled.get(command) ||
        !snapshot.target.isConnected ||
        snapshot.target.ownerDocument !== document
      )
        return false;
      if (snapshot.kind === "text" && (snapshot.target.disabled || snapshot.target.readOnly))
        return false;
      if (snapshot.kind === "content" && !snapshot.target.isContentEditable) return false;
      try {
        snapshot.target.focus({ preventScroll: true });
        if (snapshot.kind === "text") {
          snapshot.target.setSelectionRange(snapshot.start, snapshot.end, snapshot.direction);
        } else {
          if (
            !snapshot.target.contains(snapshot.range.startContainer) ||
            !snapshot.target.contains(snapshot.range.endContainer)
          )
            return false;
          const selection = document.getSelection();
          if (!selection) return false;
          selection.removeAllRanges();
          selection.addRange(snapshot.range);
        }
        return (
          document.queryCommandSupported(command) &&
          document.queryCommandEnabled(command) &&
          document.execCommand(command)
        );
      } catch {
        return false;
      }
    },
  };
}
