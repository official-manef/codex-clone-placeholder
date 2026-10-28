<script lang="ts">
	import { untrack } from 'svelte';
	import type { WorkspaceChatProps } from '$features/workspace-shell';
	import {
		ChatComposer,
		ChatSurface,
		MessageFrame,
		ChatModeSwitch
	} from '$features/workspace-shell';
	import { newMessage, stubReply, submitDecision, type ChatMessage } from '../local';

	// These bindables are owned by the shell, which writes them; this stub only reads
	// them, so the local assignment never happens and the linter flags it as useless.
	// Keeping the declaration is what makes `bind:` in the shell legal.
	/* eslint-disable no-useless-assignment */
	let {
		presentation,
		panelContent = $bindable(),
		navigationOpen = $bindable(false),
		sidebarWidth = $bindable(230),
		inspectorWidth = $bindable(350),
		onToggleOutput,
		outputOpen,
		navigation
	}: WorkspaceChatProps = $props();
	/* eslint-enable no-useless-assignment */

	type Session = { id: string; title: string; messages: ChatMessage[]; draft: string };
	type Mode = 'chat' | 'work' | 'compare';
	const modeIds: readonly Mode[] = untrack(() => presentation?.modes ?? ['chat']);

	let sessions = $state<Session[]>([
		{ id: 'session-1', title: 'New chat', messages: [], draft: '' }
	]);
	let activeId = $state('session-1');
	let mode = $state<Mode>(modeIds[0] ?? 'chat');
	let busy = $state(false);
	let search = $state<HTMLInputElement>();
	let composerEl = $state<HTMLTextAreaElement>();
	let transcript = $state<HTMLElement>();
	let attachments = $state<{ id: string; name: string; url: string }[]>([]);
	let timer: ReturnType<typeof setTimeout> | undefined;

	const active = $derived(sessions.find((item) => item.id === activeId) ?? sessions[0]);
	let query = $state('');
	const filtered = $derived(
		query.trim()
			? sessions.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()))
			: sessions
	);
	const decision = $derived(
		submitDecision({ draft: active.draft, attachments: attachments.length, busy })
	);

	export function focusComposer() {
		composerEl?.focus();
	}
	export function focusSessionSearch() {
		search?.focus();
	}
	export function openPanel(_panel: string, _notify?: boolean) {}
	export async function newConversation() {
		const next: Session = {
			id: `session-${sessions.length + 1}`,
			title: 'New chat',
			messages: [],
			draft: ''
		};
		sessions = [next, ...sessions];
		activeId = next.id;
		attachments = [];
	}

	function scrollToEnd() {
		if (transcript) transcript.scrollTop = transcript.scrollHeight;
	}

	function send() {
		if (!decision.enabled) return;
		const text = active.draft.trim();
		active.messages = [...active.messages, newMessage('user', text || attachments[0]?.name || '')];
		active.draft = '';
		if (active.title === 'New chat') active.title = text.slice(0, 40) || 'New chat';
		attachments = [];
		busy = true;
		scrollToEnd();
		// ponytail: fixed delay, no stream. A real backend replaces this block.
		timer = setTimeout(() => {
			active.messages = [
				...active.messages,
				newMessage('assistant', stubReply(active.messages.length))
			];
			busy = false;
			scrollToEnd();
		}, 450);
	}

	function stop() {
		clearTimeout(timer);
		busy = false;
		const last = active.messages.at(-1);
		if (last?.role === 'assistant') last.cancelled = true;
	}

	function onFiles(files: FileList) {
		for (const file of Array.from(files)) {
			attachments = [
				...attachments,
				{
					id: `${file.name}-${file.size}`,
					name: file.name,
					url: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
				}
			];
		}
	}

	function removeAttachment(id: string) {
		const target = attachments.find((item) => item.id === id);
		if (target?.url) URL.revokeObjectURL(target.url);
		attachments = attachments.filter((item) => item.id !== id);
	}
</script>

<ChatSurface
	empty={active.messages.length === 0}
	bind:transcript
	ariaLabel="Conversation"
	ariaLogLabel="Messages"
	ariaLive={busy ? 'polite' : 'off'}
>
	{#snippet header()}
		<aside class="chat-sessions" style:width={`${sidebarWidth}px`} aria-label="Chat sessions">
			{#if navigation}{@render navigation()}{/if}
			<label class="chat-search-label" for="chat-search">Search chats</label>
			<input
				id="chat-search"
				bind:this={search}
				class="chat-search"
				type="search"
				placeholder="Search chats"
				bind:value={query}
			/>
			<button type="button" class="chat-new" onclick={newConversation}>New chat</button>
			<div class="chat-session-list">
				{#each filtered as item (item.id)}
					<button
						type="button"
						class="chat-session"
						aria-current={item.id === activeId ? 'true' : undefined}
						onclick={() => (activeId = item.id)}
					>
						{item.title}
					</button>
				{/each}
				{#if filtered.length === 0}<p class="chat-empty">No chats match “{query}”.</p>{/if}
			</div>
		</aside>
	{/snippet}

	{#snippet modes()}
		<ChatModeSwitch
			modes={modeIds}
			value={mode}
			labels={presentation?.modeLabels}
			onchange={(id) => (mode = id as Mode)}
		/>
	{/snippet}

	{#if active.messages.length === 0}
		<div class="chat-empty-state">
			<h1>What do you want to work on?</h1>
			<p>This workspace runs locally. Nothing is sent anywhere.</p>
		</div>
	{:else}
		{#each active.messages as message (message.id)}
			<MessageFrame tone={message.role}>
				{message.text}
				{#if message.cancelled}<span class="chat-cancelled">Stopped</span>{/if}
			</MessageFrame>
		{/each}
	{/if}

	{#snippet composer()}
		<ChatComposer onsubmit={send} ariaLabel="Message composer">
			{#if attachments.length > 0}
				<ul class="chat-attachments">
					{#each attachments as item (item.id)}
						<li>
							{#if item.url}<img src={item.url} alt={item.name} />{/if}
							<span>{item.name}</span>
							<button
								type="button"
								aria-label={`Remove ${item.name}`}
								onclick={() => removeAttachment(item.id)}>×</button
							>
						</li>
					{/each}
				</ul>
			{/if}
			<textarea
				bind:this={composerEl}
				bind:value={active.draft}
				placeholder="Type a message"
				rows="2"
				aria-label="Message"></textarea>
			{#snippet controls()}
				<label class="chat-attach">
					<span aria-hidden="true">+</span>
					<span class="sr-only">Attach files</span>
					<input
						type="file"
						multiple
						onchange={(event) => {
							if (event.currentTarget.files) onFiles(event.currentTarget.files);
							event.currentTarget.value = '';
						}}
					/>
				</label>
				{#if onToggleOutput}
					<button type="button" aria-pressed={outputOpen} onclick={onToggleOutput}> Panel </button>
				{/if}
				{#if busy}
					<button type="button" onclick={stop}>Stop</button>
				{:else}
					<button
						type="submit"
						disabled={!decision.enabled}
						title={decision.enabled ? 'Send' : decision.reason}
					>
						Send
					</button>
				{/if}
			{/snippet}
		</ChatComposer>
		{#if !decision.enabled}
			<p class="chat-reason" role="status">{decision.reason}</p>
		{/if}
	{/snippet}
</ChatSurface>

<style>
	.chat-sessions {
		display: flex;
		min-height: 100%;
		flex-direction: column;
		gap: 6px;
		border-right: 1px solid var(--color-line);
		padding: 10px 8px;
	}

	.chat-search-label {
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.chat-search {
		width: 100%;
		border: 1px solid var(--color-line);
		border-radius: 6px;
		background: var(--color-panel-2);
		padding: 4px 8px;
		font-size: 12px;
		color: var(--color-ink);
	}

	.chat-new {
		border-radius: 6px;
		padding: 6px 8px;
		text-align: left;
		font-size: 12px;
		color: var(--color-ink);
	}

	.chat-new:hover {
		background: var(--color-hover);
	}

	.chat-session-list {
		display: flex;
		min-height: 0;
		flex: 1;
		flex-direction: column;
		gap: 2px;
		overflow: auto;
	}

	.chat-session {
		border-radius: 6px;
		padding: 5px 8px;
		overflow: hidden;
		font-size: 12px;
		color: var(--color-ink-2);
		text-align: left;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.chat-session:hover {
		background: var(--color-hover);
	}

	.chat-session[aria-current='true'] {
		background: var(--color-nav-active);
		color: var(--color-ink);
	}

	.chat-empty {
		padding: 8px;
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.chat-empty-state {
		display: flex;
		min-height: 100%;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-align: center;
	}

	.chat-empty-state h1 {
		margin: 0;
		font-size: 22px;
		font-weight: 400;
	}

	.chat-empty-state p {
		margin: 0;
		font-size: 12px;
		color: var(--color-ink-3);
	}

	.chat-cancelled {
		display: block;
		margin-top: 6px;
		font-size: 11px;
		color: var(--color-ink-3);
	}

	.chat-attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin: 0 0 6px;
		padding: 0;
		list-style: none;
	}

	.chat-attachments li {
		display: flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--color-line);
		border-radius: 6px;
		padding: 3px 6px;
		font-size: 11px;
	}

	.chat-attachments img {
		width: 22px;
		height: 22px;
		border-radius: 3px;
		object-fit: cover;
	}

	.chat-attach {
		position: relative;
		cursor: pointer;
	}

	.chat-attach input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.chat-reason {
		margin: 4px 0 0;
		font-size: 11px;
		color: var(--color-ink-3);
	}
</style>
