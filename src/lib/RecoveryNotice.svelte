<script lang="ts">
  import { Icon } from "../../shared/icons/index.js";
  import { recoveryFor } from "#lib/recovery.js";
  type Props = { message: string; retry?: () => void | Promise<void>; retryLabel?: string };
  let { message, retry, retryLabel = "Try again" }: Props = $props();
  let pending = $state(false);
  let failure = $state("");
  let recovery = $derived(recoveryFor(message));
  async function again() {
    if (!retry || pending) return;
    pending = true;
    failure = "";
    try {
      await retry();
    } catch (e) {
      failure = e instanceof Error ? e.message : "The operation could not be retried.";
    } finally {
      pending = false;
    }
  }
</script>

<div class="recovery-notice" role="alert">
  <div class="recovery-message">
    <Icon name="help" size={16} />
    <p>{message}</p>
  </div>
  <p class="recovery-hint">{recovery.hint}</p>
  <div class="recovery-actions">
    {#if retry}<button class="btn" onclick={again} disabled={pending}
        >{pending ? "Working…" : retryLabel}</button
      >{/if}
    {#each recovery.links as link}<a class="btn" href={link.href}
        >{link.label}<Icon name="arrowUpRight" size={12} /></a
      >{/each}
    {#if recovery.reload}<button class="btn" onclick={() => location.reload()}>Reconnect</button
      >{/if}
  </div>
  {#if failure}<p class="recovery-hint">{failure}</p>{/if}
</div>

<style>
  .recovery-notice {
    margin: 12px 0;
    padding: 13px 15px;
    border: 1px solid var(--color-line);
    border-radius: 10px;
    background: var(--color-panel);
    color: var(--color-ink);
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .recovery-message {
    display: flex;
    align-items: flex-start;
    gap: 9px;
  }
  .recovery-message :global(svg) {
    flex: none;
    margin-top: 3px;
  }
  p {
    margin: 0;
  }
  .recovery-hint {
    color: var(--color-ink-2);
    margin: 5px 0 0 25px;
  }
  .recovery-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
    margin: 10px 0 0 25px;
  }
  .recovery-actions .btn {
    min-height: 30px;
    font-size: 11px;
  }
</style>
