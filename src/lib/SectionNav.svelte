<script lang="ts">
  import { Icon } from "../../shared/icons/index.js";
  import { SECTIONS, type SectionId } from "#lib/registry.js";
  type Props = {
    active?: SectionId;
    onPick?: (id: SectionId) => void;
  };
  let { active = "chat", onPick = () => {} }: Props = $props();
  const primaryLabels: Partial<Record<SectionId, string>> = {
    chat: "Chat",
    apps: "Automation",
    transcribe: "Transcribe",
    models: "Models",
  };
</script>

<nav class="section-nav unified-navigation" aria-label="Main navigation">
  <section class="navigation-group" aria-labelledby="workspace-navigation-label">
    <h2 id="workspace-navigation-label" class="navigation-label">Workspace</h2>
    {#each SECTIONS.filter((section) => section.group === "Workspace") as section}
      <a
        class="nav-link"
        class:nav-selected={active === section.id}
        aria-current={active === section.id ? "page" : undefined}
        href={`#${section.id}`}
        onclick={() => onPick(section.id)}
        title={section.label}
      >
        <Icon name={section.icon} size={16} /><span
          >{primaryLabels[section.id] ?? section.label}</span
        >
      </a>
    {/each}
  </section>
</nav>

<style>
  .unified-navigation {
    height: auto;
    min-width: 0;
    overflow: visible;
    gap: 0;
    padding: 0;
  }
  .navigation-group {
    margin: 0 0 6px;
  }
  .navigation-label {
    display: block;
    margin: 0;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-ink-2);
  }
  h2.navigation-label {
    padding: 5px 10px 7px;
  }
  .unified-navigation .nav-link {
    min-height: 34px;
    padding: 7px 10px;
    font-size: 12px;
  }
  .unified-navigation .nav-link span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
