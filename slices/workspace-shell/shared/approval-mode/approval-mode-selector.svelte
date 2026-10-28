<script lang="ts">
  import { Popover } from "bits-ui";
  import { Check, Shield } from "@lucide/svelte";
  import type { Snippet } from "svelte";
  import { validatedApprovalModes } from "./lib/modes.js";
  import type { ApprovalMode, ApprovalModeSelection } from "./types.js";

  type Props = {
    modes: readonly ApprovalMode[];
    value?: string | null;
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    onSelect?: ApprovalModeSelection;
    /** Optional product-owned icon for each mode. */
    renderIcon?: Snippet<[ApprovalMode]>;
    footer?: Snippet;
    iconOnly?: boolean;
  };
  let {
    modes,
    value = null,
    label = "Action approval",
    placeholder = "Choose approval mode",
    disabled = false,
    onSelect,
    renderIcon,
    footer,
    iconOnly = false,
  }: Props = $props();
  const uniqueId = $props.id();
  let open = $state(false);
  let pending = $state(false);
  let error = $state("");
  let fieldElement = $state<HTMLFieldSetElement>();
  let available = $derived(validatedApprovalModes(modes));
  let selected = $derived(available.find((mode) => mode.id === value));

  async function choose(mode: ApprovalMode) {
    // Keep the rendered radio state controlled by the consumer even if the
    // native browser selection changed before an async request is confirmed.
    for (const input of fieldElement?.querySelectorAll<HTMLInputElement>('input[type="radio"]') ??
      [])
      input.checked = input.value === value;
    if (pending || disabled || mode.disabled || !onSelect || mode.id === value) return;
    pending = true;
    error = "";
    try {
      await onSelect(mode.id);
      open = false;
    } catch {
      error = "Could not change this setting. Try again.";
    } finally {
      pending = false;
    }
  }
</script>

{#if available.length}
  <Popover.Root bind:open>
    <Popover.Trigger
      class="approval-trigger"
      aria-label={`${label}: ${selected?.label ?? placeholder}`}
      disabled={disabled || pending}
    >
      <Shield size={15} aria-hidden="true" />
      {#if !iconOnly}<span>{selected?.label ?? placeholder}</span>{/if}
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content
        class="approval-popover"
        side="top"
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label={label}
      >
        <h3>{label}</h3>
        <fieldset bind:this={fieldElement} disabled={disabled || pending}>
          <legend class="visually-hidden">{label}</legend>
          {#each available as mode (mode.id)}
            {#if onSelect}
              <label class="approval-choice" class:selected={value === mode.id}>
                <input
                  type="radio"
                  value={mode.id}
                  name={`${uniqueId}-approval-mode`}
                  checked={value === mode.id}
                  disabled={mode.disabled}
                  onchange={() => choose(mode)}
                />
                {#if renderIcon}<span class="mode-icon">{@render renderIcon(mode)}</span>{/if}
                <span class="mode-copy"
                  ><strong>{mode.label}</strong>{#if mode.description}<small
                      >{mode.description}</small
                    >{/if}</span
                >
                {#if value === mode.id}<Check size={16} aria-hidden="true" />{/if}
              </label>
            {:else}
              <div class="approval-choice readonly" class:selected={value === mode.id}>
                {#if renderIcon}<span class="mode-icon">{@render renderIcon(mode)}</span>{/if}
                <span class="mode-copy"
                  ><strong>{mode.label}</strong>{#if mode.description}<small
                      >{mode.description}</small
                    >{/if}</span
                >
                {#if value === mode.id}<span class="visually-hidden">Current setting</span><Check
                    size={16}
                    aria-hidden="true"
                  />{/if}
              </div>
            {/if}
          {/each}
        </fieldset>
        {#if pending}<p class="mode-status" role="status">Updating…</p>{/if}
        {#if error}<p class="mode-error" role="alert">{error}</p>{/if}
        {#if footer}{@render footer()}{/if}
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>
{/if}

<style>
  :global(.approval-trigger) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 5px 8px;
    border-radius: 7px;
    color: var(--color-approval, var(--color-ink-2));
    font-size: 12px;
  }
  :global(.approval-trigger:hover),
  :global(.approval-trigger[data-state="open"]) {
    color: var(--color-ink);
    background: var(--color-hover);
  }
  :global(.approval-trigger:focus-visible) {
    outline: 2px solid var(--color-execution);
    outline-offset: 2px;
  }
  :global(.approval-popover) {
    z-index: 110;
    width: min(360px, calc(100vw - 24px));
    padding: 12px;
    border: 1px solid var(--color-line);
    border-radius: 12px;
    background: var(--color-panel-2);
    color: var(--color-ink);
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.24);
  }
  h3 {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    min-width: 0;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .approval-choice {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
  }
  .approval-choice:hover,
  .approval-choice.selected {
    background: var(--color-hover);
  }
  .approval-choice:has(input:focus-visible) {
    outline: 2px solid var(--color-execution);
    outline-offset: -2px;
  }
  .approval-choice:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .approval-choice.readonly {
    cursor: default;
  }
  .mode-icon {
    flex: none;
    display: flex;
    margin-top: 2px;
  }
  .mode-copy {
    display: grid;
    gap: 3px;
    min-width: 0;
    flex: 1;
  }
  strong {
    font-size: 12px;
    font-weight: 600;
  }
  small {
    font-size: 12px;
    line-height: 1.4;
    color: var(--color-ink-2);
  }
  .mode-status,
  .mode-error {
    margin: 8px 8px 0;
    font-size: 12px;
    color: var(--color-ink-2);
  }
</style>
