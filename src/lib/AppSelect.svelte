<script lang="ts">
  import * as Select from "#lib/components/ui/select/index.js";
  type Props = {
    value?: string;
    options: { value: string; label: string; description?: string; disabled?: boolean }[];
    label: string;
    disabled?: boolean;
    displayLabel?: string;
    class?: string;
    onchange?: (value: string) => void;
  };
  let {
    value = $bindable(""),
    options,
    label,
    disabled = false,
    displayLabel,
    class: className = "",
    onchange = () => {},
  }: Props = $props();
</script>

<Select.Root type="single" bind:value onValueChange={onchange} {disabled}>
  <Select.Trigger class={`app-select-trigger ${className}`} aria-label={label}
    >{displayLabel ?? options.find((item) => item.value === value)?.label ?? label}</Select.Trigger
  >
  <Select.Content class="app-select-menu"
    >{#each options as option}<Select.Item
        value={option.value}
        label={option.label}
        disabled={option.disabled}
        ><span class="option-copy"
          ><span>{option.label}</span>{#if option.description}<small>{option.description}</small
            >{/if}</span
        ></Select.Item
      >{/each}</Select.Content
  >
</Select.Root>

<style>
  .option-copy {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .option-copy small {
    color: var(--color-ink-2);
    font-size: 11px;
    white-space: normal;
  }
</style>
