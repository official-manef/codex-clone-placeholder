<script lang="ts">
  import { Icon } from "../../shared/icons/index.js";
  import { getContext, type Snippet } from "svelte";
  const embedded = getContext<boolean>("workspace-output-panel") ?? false;

  type Props = {
    title: string;
    icon?: string;
    subtitle?: string;
    actions?: Snippet;
    children: Snippet;
  };
  let { title, icon = "circle", subtitle = "", actions, children }: Props = $props();
</script>

<div class="view-frame flex h-full min-h-0 flex-col px-7 py-6">
  {#if embedded}
    <h1 class="sr-only">{title}</h1>
    {#if subtitle || actions}<div class="embedded-view-actions">
        {#if subtitle}<details class="tool-info">
            <summary><Icon name="help" size={14} /><span>About this tool</span></summary>
            <p>{subtitle}</p>
          </details>{/if}
        {#if actions}<div class="embedded-actions">{@render actions()}</div>{/if}
      </div>{/if}
  {:else}
    <div
      class="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-line pb-3.5"
    >
      <div class="min-w-0">
        <h1 class="flex items-center gap-2 text-[20px] font-semibold">
          <span class="text-ink-3"><Icon name={icon} size={15} /></span>
          {title}
        </h1>
        {#if subtitle}
          <p class="mt-1 max-w-[680px] text-[13px] leading-relaxed text-ink-2">{subtitle}</p>
        {/if}
      </div>
      {#if actions}
        <div class="flex flex-wrap items-center gap-1.5">{@render actions()}</div>
      {/if}
    </div>
  {/if}

  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
    {@render children()}
  </div>
</div>

<style>
  .embedded-view-actions {
    display: flex;
    justify-content: space-between;
    align-items: start;
    gap: 12px;
    flex-shrink: 0;
    margin-bottom: 14px;
    font-size: 11px;
    color: var(--color-ink-2);
  }
  .tool-info {
    max-width: 65ch;
  }
  .tool-info summary {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    list-style: none;
    padding: 4px 0;
  }
  .tool-info summary::-webkit-details-marker {
    display: none;
  }
  .tool-info p {
    margin-top: 8px;
    line-height: 1.6;
  }
  .embedded-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-left: auto;
  }
</style>
