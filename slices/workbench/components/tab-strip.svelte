<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import Plus from '@lucide/svelte/icons/plus';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import X from '@lucide/svelte/icons/x';
	import type { CloseDecision, Tab } from '../types';

	let {
		tabs,
		activeTabId,
		hidden,
		onactivate,
		onclose,
		onsave,
		onadd,
		ontoggle
	}: {
		tabs: readonly Tab[];
		activeTabId: string | null;
		hidden: boolean;
		onactivate: (id: string) => void;
		/** False means the tab is dirty and still needs a keep/discard/cancel decision (T10). */
		onclose: (id: string, decision?: CloseDecision) => boolean;
		/** AC09: persist a dirty tab; a 'failed' outcome leaves it dirty and open. */
		onsave: (id: string) => Promise<'saved' | 'failed'>;
		onadd: () => void;
		/** Hides the region without touching tabs (AC08). */
		ontoggle: () => void;
	} = $props();

	/** Tab whose close request is waiting on a decision; drives the confirm popover. */
	let pendingCloseId = $state<string | null>(null);
	/** Tab whose save attempt is running, and the tab whose save failed (AC09). */
	let savingId = $state<string | null>(null);
	let saveFailedId = $state<string | null>(null);

	function decide(id: string, decision: CloseDecision): void {
		onclose(id, decision);
		pendingCloseId = null;
		saveFailedId = null;
	}

	async function save(id: string): Promise<void> {
		savingId = id;
		saveFailedId = null;
		const outcome = await onsave(id);
		savingId = null;
		if (outcome === 'failed') {
			// Failure keeps the tab dirty and the surface open so the error stays visible.
			saveFailedId = id;
			return;
		}
		pendingCloseId = null;
	}

	/**
	 * The close button is the popover trigger: opening it attempts the close. A clean tab
	 * closes and never opens the surface; a dirty tab keeps it open for the decision (T10).
	 */
	function onOpenChange(id: string, next: boolean): void {
		if (!next) {
			pendingCloseId = null;
			saveFailedId = null;
			return;
		}
		if (!onclose(id)) pendingCloseId = id;
	}
</script>

<div
	role="tablist"
	class="flex items-center gap-1 overflow-x-auto border-b border-[var(--shell-border)] px-2"
>
	{#each tabs as tab (tab.id)}
		<!-- ponytail: tabindex -1 keeps one tab stop per tab (the inner button). -->
		<div
			role="tab"
			aria-selected={tab.id === activeTabId}
			tabindex="-1"
			data-dirty={tab.dirty ? 'true' : 'false'}
			data-tab-status={tab.status}
			class="flex min-w-0 items-center gap-0.5 rounded-md bg-[var(--shell-surface-raised)] pr-1"
		>
			<Button
				variant="ghost"
				class="h-11 min-w-0 flex-1 justify-start sm:h-8"
				onclick={() => onactivate(tab.id)}
			>
				<span class="truncate">{t(tab.titleKey)}</span>
			</Button>
			<Popover open={pendingCloseId === tab.id} onOpenChange={(next) => onOpenChange(tab.id, next)}>
				<PopoverTrigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="icon-xs"
							class="size-11 sm:size-6"
							aria-label={GENERIC_LABELS[0]}
							{...props}
						>
							<X />
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent align="end" class="w-56">
					<p class="text-sm">{t('tab_close_dirty_prompt')}</p>
					<Button
						variant="ghost"
						class="justify-start"
						disabled={savingId === tab.id}
						onclick={() => save(tab.id)}
					>
						{savingId === tab.id ? t('settings_saving') : t('settings_saved')}
					</Button>
					{#if saveFailedId === tab.id}
						<p role="status" class="text-xs text-destructive">{t('settings_save_error')}</p>
					{/if}
					<Button variant="ghost" class="justify-start" onclick={() => decide(tab.id, 'keep')}>
						{t('tab_close_dirty_keep')}
					</Button>
					<Button variant="ghost" class="justify-start" onclick={() => decide(tab.id, 'discard')}>
						{t('tab_close_dirty_discard')}
					</Button>
					<Button variant="ghost" class="justify-start" onclick={() => decide(tab.id, 'cancel')}>
						{t('tab_close_dirty_cancel')}
					</Button>
				</PopoverContent>
			</Popover>
		</div>
	{/each}
	<Button
		variant="ghost"
		size="icon"
		class="size-11 shrink-0 sm:size-8"
		aria-label={GENERIC_LABELS[2]}
		onclick={onadd}
	>
		<Plus />
	</Button>
	<Button
		variant="ghost"
		size="icon"
		class="size-11 shrink-0 sm:size-8"
		aria-label={t('resource_hide')}
		aria-expanded={!hidden}
		aria-controls="workbench-region"
		onclick={ontoggle}
	>
		<PanelRightClose />
	</Button>
</div>
