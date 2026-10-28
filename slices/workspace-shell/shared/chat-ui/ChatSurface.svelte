<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		header,
		modes,
		children,
		composer,
		empty = false,
		transcript = $bindable<HTMLElement>(),
		onscroll,
		ariaLabel = 'Conversation',
		ariaLogLabel = 'Messages',
		ariaLive = 'off',
		class: className = '',
		scrollClass = '',
		style
	}: {
		header?: Snippet;
		modes?: Snippet;
		children: Snippet;
		composer?: Snippet;
		empty?: boolean;
		transcript?: HTMLElement;
		onscroll?: (event: Event) => void;
		ariaLabel?: string;
		ariaLogLabel?: string;
		ariaLive?: 'off' | 'polite' | 'assertive';
		class?: string;
		scrollClass?: string;
		style?: string;
	} = $props();
</script>

<section
	class={`conversation-main chat-surface ${className}`}
	class:entry-chat={empty}
	aria-label={ariaLabel}
	{style}
>
	{#if header}{@render header()}{/if}
	{#if modes}{@render modes()}{/if}
	<div
		bind:this={transcript}
		class={`conversation-scroll ${scrollClass}`}
		role="log"
		aria-label={ariaLogLabel}
		aria-live={ariaLive}
		{onscroll}
	>
		{@render children()}
	</div>
	{#if composer}<div class="conversation-composer-wrap">{@render composer()}</div>{/if}
</section>

<style>
	.chat-surface {
		position: relative;
		container-type: inline-size;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
		min-height: 0;
		height: 100%;
		color: var(--color-ink);
		background: var(--color-page);
	}
	.conversation-scroll {
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		overscroll-behavior: contain;
		scrollbar-gutter: stable;
		padding: var(
			--chat-transcript-padding,
			24px max(24px, calc((100% - var(--chat-reading-width, 738px)) / 2))
		);
	}
	.conversation-composer-wrap {
		width: 100%;
		min-width: 0;
		max-width: var(--chat-composer-max, calc(var(--chat-reading-width, 738px) + 48px));
		flex: none;
		margin: 0 auto;
		padding: 0 var(--chat-composer-inset, 24px) var(--chat-composer-bottom, 13px);
	}
	.entry-chat .conversation-scroll {
		flex: none;
		width: 100%;
		max-width: var(--chat-composer-max, calc(var(--chat-entry-width, 640px) + 48px));
		align-self: center;
		padding: 0 var(--chat-composer-inset, 24px);
		margin: auto auto var(--chat-empty-spacing, 20px);
		overflow: visible;
		scrollbar-gutter: auto;
		text-align: center;
	}
	.entry-chat .conversation-composer-wrap {
		max-width: var(--chat-composer-max, calc(var(--chat-entry-width, 640px) + 48px));
		margin-bottom: auto;
	}
	@media (max-width: 480px) {
		.conversation-composer-wrap,
		.entry-chat .conversation-scroll {
			padding-inline: var(--chat-composer-narrow-inset, 12px);
		}
	}
</style>
