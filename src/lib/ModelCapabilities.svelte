<script lang="ts">
  type CapabilityData = {
    text?: boolean | null;
    vision?: boolean | null;
    vision_label?: string;
    provenance?: string;
    image_input?: string;
    image_note?: string;
    device_status?: {
      device: string;
      available: boolean | null;
      model_supported: boolean | null;
      prepared: boolean;
      status: string;
      label: string;
    }[];
  };
  type Props = { capabilities?: CapabilityData | null; compact?: boolean };
  let { capabilities = null, compact = false }: Props = $props();
</script>

<div class="model-capabilities" class:compact aria-label="Model input capabilities">
  <span class="capability-tag">{capabilities?.vision_label ?? "Capabilities unavailable"}</span>
  {#if !compact}
    {#if capabilities?.provenance === "custom_unverified"}
      <span class="capability-source">Custom checkpoint · identity unverified</span>
    {/if}
    <p>{capabilities?.image_note ?? "Refresh model status to check its input capabilities."}</p>
    {#if capabilities?.device_status?.length}
      <dl>
        {#each capabilities.device_status as row}
          <div>
            <dt>{row.device}</dt>
            <dd>{row.label}</dd>
          </div>
        {/each}
      </dl>
    {/if}
  {/if}
</div>

<style>
  .model-capabilities {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 9px;
    min-width: 0;
    font-size: 11px;
    line-height: 1.5;
    color: var(--color-ink-2);
  }
  .capability-tag {
    display: inline-block;
    border: 1px solid var(--color-line);
    border-radius: 5px;
    padding: 1px 6px;
    color: var(--color-ink);
    white-space: nowrap;
  }
  p,
  dl {
    flex-basis: 100%;
    margin: 0;
  }
  dl {
    display: grid;
    gap: 4px;
  }
  dl > div {
    display: flex;
    gap: 8px;
  }
  dt {
    flex: 0 0 32px;
    color: var(--color-ink);
  }
  dd {
    margin: 0;
  }
  .compact {
    display: inline-flex;
    font-size: 10px;
  }
</style>
