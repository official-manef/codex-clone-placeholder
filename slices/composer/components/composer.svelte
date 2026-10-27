<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import Plus from '@lucide/svelte/icons/plus';
	import Square from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { SignalBanner } from '$lib/components/app-ui';
	import { GENERIC_LABELS, t } from '$features/placeholders';
	import AccessControl from './access-control.svelte';
	import AttachmentStrip from './attachment-strip.svelte';
	import ExecutionControl from './execution-control.svelte';
	import { hasAttachment, reduceAttachments } from '../attachment';
	import { createDraftStore, draftStore } from '../draft.svelte';
	import { canCancel, initialRunState, reduceRun } from '../run';
	import { createSubmitGuard, deriveSubmit, validateFile } from '../submit';
	import type { Attachment, ComposerProcess, ComposerProps, ExecutionOption } from '../types';

	let { draftKey, authority = 'unknown', onsubmit, oncancel }: ComposerProps = $props();

	let run = $state(initialRunState);
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
	/** Live validation tokens; removal deletes the id so a late resolve bails (race 5). */
	const validating = new SvelteSet<string>();

	const process = $derived<ComposerProcess>(run.process);
	const partialText = $derived(run.partialText);
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

	// AC05: a real connectivity side effect. Only an unfinished run is affected; the guard
	// keeps the request id for the retry (race 4) and the draft text goes back into the box.
	$effect(() => {
		if (typeof window === 'undefined') return;
		const goOffline = () => {
			if (untrack(() => run.process) !== 'running') return;
			guard.abandon();
			const kept = untrack(() => run.draftText);
			run = reduceRun(
				untrack(() => run),
				{ type: 'offline' }
			);
			// Put the unaccepted body back only into an empty box, so text typed since the
			// send is never overwritten.
			if (untrack(() => text) === '') {
				store.setValue(draftKey, kept);
				text = kept;
			}
		};
		window.addEventListener('offline', goOffline);
		return () => window.removeEventListener('offline', goOffline);
	});

	// Unmount cleanup for URLs that removal did not already revoke.
	$effect(() => {
		return () => {
			validating.clear();
			for (const url of objectUrls) URL.revokeObjectURL(url);
			objectUrls.clear();
		};
	});

	function onInput(event: Event & { currentTarget: HTMLTextAreaElement }) {
		const value = event.currentTarget.value;
		store.setValue(draftKey, value);
		text = value;
	}

	// ponytail: a 120ms timer stands in for real decoding + upload. Ceiling: no image decode,
	// no upload, no progress. Upgrade: swap for `Image` decode plus an upload adapter that
	// reports progress and resolves through the same `reduceAttachments` 'resolve' action.
	const VALIDATION_DELAY_MS = 120;

	async function validateAttachment(id: string, file: File) {
		await new Promise((resolve) => setTimeout(resolve, VALIDATION_DELAY_MS));
		if (!validating.has(id)) return; // race 5: removed while validating, do not resurrect.
		validating.delete(id);
		const result = validateFile({ type: file.type, size: file.size });
		if (!result.ok) {
			attachments = reduceAttachments(attachments, {
				type: 'resolve',
				id,
				result: { ok: false, reasonKey: result.reasonKey }
			});
			return;
		}
		// The object URL is created only once the attachment is really ready (T6).
		if (!hasAttachment(attachments, id)) return;
		const previewUrl = URL.createObjectURL(file);
		objectUrls.add(previewUrl);
		attachments = reduceAttachments(attachments, {
			type: 'resolve',
			id,
			result: { ok: true, previewUrl }
		});
	}

	function addFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		for (const file of Array.from(input.files ?? [])) {
			const id = crypto.randomUUID();
			validating.add(id);
			attachments = reduceAttachments(attachments, {
				type: 'add',
				attachment: { id, name: file.name, mimeType: file.type, sizeBytes: file.size }
			});
			void validateAttachment(id, file).catch(() => {
				// Validation stub cannot reject; a real decoder failure maps to `failed` instead.
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
		validating.delete(id);
		revoke(attachments.find((a) => a.id === id)?.previewUrl ?? null);
		attachments = reduceAttachments(attachments, { type: 'remove', id });
	}

	function clearAttachments() {
		validating.clear();
		for (const attachment of attachments) revoke(attachment.previewUrl);
		attachments = reduceAttachments(attachments, { type: 'clear' });
	}

	function send(id: string, body: string, files: Attachment[]) {
		onsubmit?.({ draftKey, requestId: id, text: body, attachments: files, execution });
		store.setValue(draftKey, '');
		text = '';
		clearAttachments();
	}

	function submitDraft() {
		if (!submit.enabled) return;
		// AC04: the guard turns a double click into exactly one request id.
		const id = guard.begin();
		if (!id) return;
		const body = text;
		send(id, body, [...attachments]);
		run = reduceRun(run, { type: 'submit', text: body });
		// No `end()`: the request is still unresolved. Cancel/offline `abandon()` it, which
		// keeps the id so a retry resends the same identity instead of duplicating (AC05).
	}

	/**
	 * AC05 recovery. Same request id and same body as the interrupted attempt, so the host
	 * dedupes it and appends one timeline entry. The draft box is left alone: the send was
	 * already snapshotted, and anything typed since the drop is still unsent.
	 */
	function retrySubmit() {
		const id = guard.retry();
		if (!id) return;
		onsubmit?.({ draftKey, requestId: id, text: run.draftText, attachments: [], execution });
		// The replayed body is now accepted, so clear it — but never wipe text typed after
		// the connection dropped.
		if (text === run.draftText) {
			store.setValue(draftKey, '');
			text = '';
		}
		run = reduceRun(run, { type: 'retry' });
	}

	function cancelRun() {
		if (!canCancel(run)) return;
		// T5/AC06: stop the run, keep partial text. Cancel never touches the draft store or
		// the textarea — only an accepted submit clears a draft. `end()` closes the request
		// for good, so the next message gets its own identity instead of the aborted one.
		run = reduceRun(run, { type: 'cancel' });
		guard.end();
		oncancel?.({ draftKey, partialText: run.partialText });
	}
</script>

<div class="flex w-full flex-col gap-2 rounded-xl border bg-background p-2">
	{#if process === 'offline'}
		<SignalBanner title={t('error_state')}>
			{t('submit_disabled_reason_running')}
			<Button variant="ghost" size="sm" onclick={retrySubmit}>
				{t('constraint_notice.recovery')}
			</Button>
		</SignalBanner>
	{/if}

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

	{#if process === 'cancelled' && partialText}
		<div class="flex flex-col gap-1 rounded-lg border bg-muted/40 px-2 py-1.5" data-partial-output>
			<p class="text-sm whitespace-pre-wrap">{partialText}</p>
			<p class="shell-fg-muted text-xs" role="status">{t('cancel_running')}</p>
		</div>
	{/if}

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
									aria-describedby={submit.enabled ? undefined : 'composer-submit-reason'}
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

	{#if !submit.enabled && submit.reasonKey}
		<p id="composer-submit-reason" class="shell-fg-muted text-xs" role="status">
			{t(submit.reasonKey)}
		</p>
	{/if}
</div>
