<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title = "",
    titleSnippet,
    leading,
    children,
    actions,
    ariaLabel = "Conversation header",
    class: className = "",
    style,
  }: {
    title?: string;
    titleSnippet?: Snippet;
    leading?: Snippet;
    children?: Snippet;
    actions?: Snippet;
    ariaLabel?: string;
    class?: string;
    style?: string;
  } = $props();
</script>

<header class={`conversation-toolbar chat-header ${className}`} aria-label={ariaLabel} {style}>
  {#if leading}{@render leading()}{/if}
  {#if titleSnippet}<div class="chat-header-title">{@render titleSnippet()}</div>
  {:else if title}<strong class="active-chat-title chat-header-title" {title}>{title}</strong>{/if}
  {#if children}{@render children()}{/if}
  {#if actions}<div class="conversation-toolbar-actions">{@render actions()}</div>{/if}
</header>

<style>
  .chat-header {
    display: flex;
    align-items: center;
    flex: none;
    min-width: 0;
    min-height: var(--chat-header-height, 51px);
    gap: var(--chat-header-gap, 8px);
    padding: 0 var(--chat-header-inset, 13px);
    border-bottom: 1px solid var(--color-line);
    color: var(--color-ink);
  }
  .chat-header-title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 13px;
    font-weight: 600;
  }
  .conversation-toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--chat-header-action-gap, 4px);
    flex: none;
    margin-inline-start: auto;
  }
  .conversation-toolbar-actions :global(button) {
    border-color: var(--chat-header-action-border, transparent);
  }
</style>
