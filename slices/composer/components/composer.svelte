<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Plus from '@lucide/svelte/icons/plus';
	import Square from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import AccessControl from './access-control.svelte';
	import AttachmentStrip from './attachment-strip.svelte';
	import ExecutionControl from './execution-control.svelte';
	import { createDraftStore, draftStore } from '../draft.svelte';
	import { createSubmitGuard, deriveSubmit, validateFile } from '../submit';
	import type { Attachment, ComposerProps, ExecutionOption } from '../types';

	let { draftKey, authority = 'unknown', onsubmit }: ComposerProps = $props();

	let process = $state<'idle' | 'running' | 'cancelled'>('idle');
	let attachments = $state<Attachment[]>([]);
	let execution = $state<ExecutionOption>('standard');
	let accessScope = $state('access_scope_field_01');
	/** Writable view of the store; the store is the SSOT per key (AC07). */
	let text = $state('');
	let store = draftStore;

	let textarea = $state<HTMLTextAreaElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);
	const guard = createSubmitGuard();
	/** Every object URL this component created: revoked on remove and on unmount (T7). */
	const objectUrls = new SvelteSet<string>();

	const submit = $derived(deriveSubmit({ draftText: text, attachments, authority, process }));

	// Storage is a browser side effect: sessionStorage only after mount, never at module scope.
	// The store is built once so its memory survives a draftKey switch; restoring per key
	// keeps A's text out of B (AC07). Untracked so typing does not re-read over the caret.
	$effect(() => {
		const key = draftKey;
		if (store === draftStore) {
			try {
				store = createDraftStore(sessionStorage);
			} catch {
				store = createDraftStore(null);
			}
		}
		text = untrack(() => store.get(key));
	});

	// Auto-grow up to 240px, then scroll.
	$effect(() => {
		void text;
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 240)}px`;
	});

	// Unmount cleanup for URLs that removal did not already revoke.
	$effect(() => {
		return () => {
			for (const url of objectUrls) URL.revokeObjectURL(url);
			objectUrls.clear();
		};
	});

	function onInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
		const value = event.currentTarget.value;
		store.setValue(draftKey, value);
		text = value;
	}

	function addFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		for (const file of Array.from(input.files ?? [])) {
			// ponytail: validation is synchronous, so attachments land as ready/failed with no
			// 'validating' phase; add that phase when real upload lands (T6).
			const result = validateFile({ type: file.type, size: file.size });
			const previewUrl = result.ok ? URL.createObjectURL(file) : null;
			if (previewUrl) objectUrls.add(previewUrl);
			attachments.push({
				id: crypto.randomUUID(),
				name: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
				status: result.ok ? 'ready' : 'failed',
				previewUrl,
				reasonKey: result.ok ? null : result.reasonKey
			});
		}
		input.value = '';
	}

	function revoke(previewUrl: string | null) {
		if (!previewUrl) return;
		URL.revokeObjectURL(previewUrl);
		objectUrls.delete(previewUrl);
	}

	function removeAttachment(id: string) {
		revoke(attachments.find((a) => a.id === id)?.previewUrl ?? null);
		attachments = attachments.filter((a) => a.id !== id);
	}

	function clearAttachments() {
		for (const attachment of attachments) revoke(attachment.previewUrl);
		attachments = [];
	}

	function submitDraft() {
		if (!submit.enabled) return;
		// AC04: the guard turns a double click into exactly one request id.
		const id = guard.begin();
		if (!id) return;
		try {
			onsubmit?.({ draftKey, text, attachments: [...attachments], execution });
			store.setValue(draftKey, '');
			text = '';
			clearAttachments();
			process = 'running';
		} finally {
			guard.end();
		}
	}

	function cancelRun() {
		// T5/AC06: stop the run, keep partial text — never clear the draft here.
		process = 'cancelled';
	}
</script>

<div class="flex w-full flex-col gap-2 rounded-xl border bg-background p-2">
	{#if attachments.length > 0}
		<AttachmentStrip {attachments} onremove={removeAttachment} />
	{/if}

	<Textarea
		bind:ref={textarea}
		value={text}
		oninput={onInput}
		aria-label={t('entry_heading')}
		placeholder={t('draft_input_placeholder')}
		class="min-h-20 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
	/>

	<div class="flex flex-wrap items-center gap-1">
		<AccessControl value={accessScope} onchange={(next) => (accessScope = next)} />
		<ExecutionControl value={execution} onchange={(next) => (execution = next)} />

		<input
			bind:this={fileInput}
			type="file"
			accept="image/*"
			multiple
			class="hidden"
			onchange={addFiles}
		/>
		<Button variant="ghost" size="sm" onclick={() => fileInput?.click()}>
			<Plus class="size-4" />
			{GENERIC_LABELS[2]}
		</Button>

		<div class="ms-auto">
			{#if process === 'running'}
				<Button
					variant="secondary"
					size="icon"
					aria-label={t('cancel_running')}
					onclick={cancelRun}
				>
					<Square class="size-4" />
				</Button>
			{:else}
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									size="icon"
									aria-label={t('entry_heading')}
									aria-disabled={!submit.enabled}
									disabled={!submit.enabled}
									onclick={submitDraft}
								>
									<ArrowUp class="size-4" />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						{#if !submit.enabled && submit.reasonKey}
							<Tooltip.Content>{t(submit.reasonKey)}</Tooltip.Content>
						{/if}
					</Tooltip.Root>
				</Tooltip.Provider>
			{/if}
		</div>
	</div>
</div>
