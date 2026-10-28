<script lang="ts">
  import { onDestroy } from "svelte";
  import { beginPanelResize } from "../../shared/workspace-layout/index.js";
  let {
    value = $bindable(290),
    min = 200,
    max = 400,
    label = "Panel width",
  }: {
    value?: number;
    min?: number;
    max?: number;
    label?: string;
  } = $props();
  let current = $derived(Math.min(max, Math.max(min, value)));
  let release: (() => void) | undefined;
  function drag(event: PointerEvent) {
    if (event.button !== 0) return;
    release?.();
    const width = current;
    release = beginPanelResize(event, (deltaX) => {
      value = Math.min(max, Math.max(min, width - deltaX));
    });
  }
  function keyboard(event: KeyboardEvent) {
    const change = event.shiftKey ? 50 : 10;
    const next =
      event.key === "Home"
        ? min
        : event.key === "End"
          ? max
          : event.key === "ArrowLeft" || event.key === "ArrowDown"
            ? current + change
            : event.key === "ArrowRight" || event.key === "ArrowUp"
              ? current - change
              : null;
    if (next === null) return;
    event.preventDefault();
    value = Math.min(max, Math.max(min, next));
  }
  onDestroy(() => release?.());
</script>

<div class="panel-resize-handle">
  <input
    type="range"
    aria-label={label}
    aria-valuetext={`${Math.round(current)} pixels`}
    {min}
    {max}
    step="1"
    value={current}
    title="Drag to resize. Arrow keys adjust panel width."
    onpointerdown={drag}
    onkeydown={keyboard}
    oninput={(event) => (value = event.currentTarget.valueAsNumber)}
  />
  <span aria-hidden="true"></span>
</div>

<style>
  .panel-resize-handle {
    position: relative;
    display: grid;
    place-items: center;
    width: 8px;
    min-height: 48px;
    background: var(--color-page);
  }
  .panel-resize-handle::before {
    content: "";
    position: absolute;
    inset-block: 0;
    inset-inline-start: 50%;
    width: 1px;
    background: var(--color-line);
    pointer-events: none;
  }
  input {
    position: absolute;
    inset: 0;
    appearance: none;
    opacity: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: col-resize;
    touch-action: none;
  }
  span {
    width: 2px;
    height: 28px;
    background: transparent;
    border-radius: 2px;
    pointer-events: none;
  }
  .panel-resize-handle:hover span,
  .panel-resize-handle:focus-within span {
    z-index: 1;
    background: var(--color-ink-2);
  }
  .panel-resize-handle:focus-within::before {
    width: 2px;
    background: var(--color-ink-2);
  }
</style>
