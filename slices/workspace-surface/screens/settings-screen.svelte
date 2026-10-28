<script lang="ts">
	// Placeholder output screen. It proves the shell can lazily host a consumer view;
	// a real product replaces this file, not the shell.
	let items = $state<string[]>([]);
	let draft = $state('');

	function add() {
		const text = draft.trim();
		if (!text) return;
		items = [text, ...items];
		draft = '';
	}
</script>

<section class="screen" aria-labelledby="notes-heading">
	<h1 id="settings-heading">Settings</h1>
	<p class="lede">Local only. Nothing is stored after a reload.</p>

	<form
		class="composer"
		onsubmit={(event) => {
			event.preventDefault();
			add();
		}}
	>
		<label class="sr-only" for="note-draft">New setting</label>
		<textarea id="note-draft" bind:value={draft} rows="3" placeholder="Describe a setting"
		></textarea>
		<button type="submit" disabled={!draft.trim()}>Add setting</button>
	</form>

	{#if items.length === 0}
		<p class="empty">No settings yet.</p>
	{:else}
		<ul>
			{#each items as item, index (index)}
				<li>{item}</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.screen {
		max-width: 46rem;
		margin: 0 auto;
		padding: 32px 24px;
	}
	h1 {
		margin: 0 0 4px;
		font-size: 22px;
		font-weight: 500;
	}
	.lede {
		margin: 0 0 20px;
		font-size: 12px;
		color: var(--color-ink-3);
	}
	.composer {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 20px;
	}
	textarea {
		border: 1px solid var(--color-line);
		border-radius: 6px;
		background: var(--color-panel-2);
		padding: 8px 10px;
		font: inherit;
		font-size: 13px;
		color: var(--color-ink);
		resize: vertical;
	}
	button {
		align-self: flex-start;
		border: 1px solid var(--color-line);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		color: var(--color-ink);
	}
	button:hover:not(:disabled) {
		background: var(--color-hover);
	}
	button:disabled {
		opacity: 0.4;
	}
	.empty {
		font-size: 12px;
		color: var(--color-ink-3);
	}
	ul {
		margin: 0;
		padding-left: 18px;
		font-size: 13px;
		line-height: 1.7;
	}
</style>
