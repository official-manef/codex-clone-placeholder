import type { WorkspaceMenuItem } from "./types.js";

/** Register once at the owning surface; removes its listener on cleanup. */
export function registerMenuShortcuts(
  target: EventTarget,
  items: () => readonly WorkspaceMenuItem[],
): () => void {
  const listener = (event: Event) => {
    if (
      !(event instanceof KeyboardEvent) ||
      event.defaultPrevented ||
      event.repeat ||
      event.isComposing
    )
      return;
    const keyboardEvent = event;
    const origin = event.target;
    const editable =
      origin instanceof HTMLElement &&
      (origin.isContentEditable ||
        !!origin.closest("input, textarea, select, [contenteditable='true']"));
    const found: WorkspaceMenuItem[] = [];
    function visit(rows: readonly WorkspaceMenuItem[]) {
      for (const item of rows) {
        if (item.disabled) continue;
        if (item.children?.length) {
          visit(item.children);
          continue;
        }
        const b = item.binding;
        if (!b || !item.onSelect || (editable && !b.allowInEditable)) continue;
        if (
          keyboardEvent.key.toLowerCase() === b.key.toLowerCase() &&
          keyboardEvent.ctrlKey === !!b.ctrl &&
          keyboardEvent.altKey === !!b.alt &&
          keyboardEvent.shiftKey === !!b.shift &&
          keyboardEvent.metaKey === !!b.meta
        )
          found.push(item);
      }
    }
    visit(items());
    // Ambiguous bindings do nothing; configuration must resolve the conflict.
    if (found.length !== 1) return;
    event.preventDefault();
    found[0].onSelect?.();
  };
  target.addEventListener("keydown", listener);
  return () => target.removeEventListener("keydown", listener);
}
