<script lang="ts">
	import { useAction, useMutation, useQuery } from 'convex-svelte';
	import { api } from '../../../src/convex/_generated/api';

	/**
	 * Provider connection manager.
	 *
	 * BYOK contract (docs/byok.md):
	 *  - the key is entered here and posted once to the `credentials.connect` action;
	 *  - the action encrypts it server-side; the browser never sees it again;
	 *  - a custom endpoint requires HTTPS and is the only way to point a key at a non-registry host;
	 *  - every provider row shows where to get its key, because a bare secret field is not a flow.
	 */
	type CatalogEntry = { slug: string; protocol: string; docsUrl: string };
	type Connected = {
		provider: string;
		kind: string;
		label?: string;
		endpoint?: string;
		protocol?: string;
		models?: string[];
		updatedAt: number;
	};

	let { signedIn = false }: { signedIn?: boolean } = $props();

	const catalog = useAction(api.chat.providers);
	const connected = useQuery(api.credentials.listProviders, () => (signedIn ? {} : 'skip'));
	const connect = useAction(api.credentials.connect);
	const disconnect = useMutation(api.credentials.disconnect);

	let providers = $state<CatalogEntry[]>([]);
	let busy = $state<string | null>(null);
	let message = $state('');
	let error = $state('');

	let selected = $state('openrouter');
	let apiKey = $state('');
	let customName = $state('');
	let customEndpoint = $state('');
	let customModels = $state('');
	let customProtocol = $state<'openai' | 'anthropic'>('openai');

	const connectedMap = $derived(
		new Map((connected.data ?? []).map((row: Connected) => [row.provider, row]))
	);
	const current = $derived(providers.find((entry) => entry.slug === selected));

	$effect(() => {
		if (!signedIn) return;
		catalog({}).then(
			(rows) => (providers = rows as CatalogEntry[]),
			() => (error = 'Could not load the provider list.')
		);
	});

	function reset() {
		apiKey = '';
		customName = '';
		customEndpoint = '';
		customModels = '';
		error = '';
	}

	async function submitKey() {
		if (!signedIn || busy) return;
		const provider = selected.trim();
		if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(provider)) {
			error = 'Provider slugs are lowercase letters, digits and dashes.';
			return;
		}
		if (!apiKey.trim()) {
			error = 'Paste the key you created in the provider dashboard.';
			return;
		}
		busy = provider;
		error = '';
		message = '';
		try {
			const custom = customEndpoint.trim();
			await connect({
				provider,
				apiKey,
				label: customName.trim() || undefined,
				endpoint: custom || undefined,
				protocol: custom ? customProtocol : undefined,
				models: custom
					? customModels
							.split(',')
							.map((item) => item.trim())
							.filter(Boolean)
							.slice(0, 100)
					: undefined
			});
			message = `${provider} connected. The key is encrypted and was never stored in this browser.`;
			reset();
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not save the key.';
		} finally {
			busy = null;
		}
	}

	async function remove(provider: string) {
		if (busy) return;
		busy = provider;
		error = '';
		try {
			await disconnect({ provider });
			message = `${provider} disconnected.`;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not disconnect.';
		} finally {
			busy = null;
		}
	}
</script>

<section class="providers" aria-labelledby="providers-heading">
	<h2 id="providers-heading">Providers</h2>

	{#if !signedIn}
		<p class="providers-note" role="status">
			Sign in to connect a provider key. Local mode keeps working without an account.
		</p>
	{:else}
		<div class="providers-grid">
			<form
				class="providers-form"
				onsubmit={(event) => {
					event.preventDefault();
					submitKey().catch(() => (error = 'Could not save the key.'));
				}}
			>
				<label class="providers-field">
					<span>Provider</span>
					<select bind:value={selected}>
						{#each providers as entry (entry.slug)}
							<option value={entry.slug}>{entry.slug}</option>
						{/each}
						<option value="custom">Custom endpoint…</option>
					</select>
				</label>

				{#if current?.docsUrl}
					<p class="providers-help">
						Create a key at
						<!-- An external provider page, not an app route: resolve() does not apply. -->
						<span class="providers-docs">{current.docsUrl}</span>
						>. The provider shows it once — paste it here; it is encrypted and cannot be read back.
					</p>
				{/if}

				<label class="providers-field">
					<span>API key</span>
					<input
						type="password"
						bind:value={apiKey}
						autocomplete="off"
						spellcheck="false"
						placeholder="sk-…"
					/>
				</label>

				{#if customEndpoint !== undefined && selected === 'custom'}
					<label class="providers-field">
						<span>Slug</span>
						<input bind:value={selected} placeholder="my-endpoint" pattern="[a-z0-9-]+" />
					</label>
					<label class="providers-field">
						<span>Base URL</span>
						<input bind:value={customEndpoint} placeholder="https://…/v1" />
					</label>
					<label class="providers-field">
						<span>Protocol</span>
						<select bind:value={customProtocol}>
							<option value="openai">OpenAI chat/completions</option>
							<option value="anthropic">Anthropic messages</option>
						</select>
					</label>
					<label class="providers-field">
						<span>Model ids</span>
						<input bind:value={customModels} placeholder="model-a, model-b" />
					</label>
				{/if}

				<div class="providers-actions">
					<button type="submit" disabled={busy !== null}>
						{busy === selected ? 'Saving…' : 'Connect provider'}
					</button>
					<button
						type="button"
						disabled={busy !== null}
						onclick={() => submitKey().catch(() => (error = 'Could not save the key.'))}
					>
						Test connection
					</button>
				</div>

				{#if error}<p class="providers-error" role="alert">{error}</p>{/if}
				{#if message}<p class="providers-ok" role="status">{message}</p>{/if}
			</form>

			<div class="providers-list">
				<h3>Connected</h3>
				{#if connected.isLoading}
					<p class="providers-note" role="status">Checking your connections…</p>
				{:else if (connected.data ?? []).length === 0}
					<p class="providers-note">No provider connected yet.</p>
				{:else}
					<ul>
						{#each connected.data ?? [] as row (row.provider)}
							{@const entry = connectedMap.get(row.provider)}
							<li>
								<span class="providers-row">
									<strong>{row.provider}</strong>
									<small>{entry?.endpoint ?? 'built-in endpoint'}</small>
								</span>
								<button
									type="button"
									disabled={busy !== null}
									aria-label={`Disconnect ${row.provider}`}
									onclick={() =>
										remove(row.provider).catch(() => (error = 'Could not disconnect.'))}
									>Disconnect</button
								>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	.providers {
		padding: 24px;
	}
	.providers h2 {
		margin: 0 0 16px;
		font-size: 18px;
		font-weight: 600;
	}
	.providers-grid {
		display: grid;
		gap: 24px;
		grid-template-columns: minmax(0, 1fr);
	}
	@media (min-width: 60rem) {
		.providers-grid {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
	.providers-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.providers-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 12px;
	}
	.providers-field span {
		color: var(--color-ink-2);
	}
	.providers-field input,
	.providers-field select {
		border: 1px solid var(--color-line);
		border-radius: 6px;
		background: var(--color-panel-2);
		padding: 7px 10px;
		font: inherit;
		font-size: 13px;
		color: var(--color-ink);
	}
	.providers-help,
	.providers-note {
		margin: 0;
		font-size: 12px;
		line-height: 1.6;
		color: var(--color-ink-2);
	}
	.providers-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.providers-actions button,
	.providers-list button {
		border: 1px solid var(--color-line);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 12px;
		color: var(--color-ink);
	}
	.providers-actions button:hover:not(:disabled),
	.providers-list button:hover:not(:disabled) {
		background: var(--color-hover);
	}
	.providers-actions button:disabled,
	.providers-list button:disabled {
		opacity: 0.4;
	}
	.providers-error {
		margin: 0;
		font-size: 12px;
		color: var(--color-approval);
	}
	.providers-ok {
		margin: 0;
		font-size: 12px;
		color: var(--color-ink-2);
	}
	.providers-list h3 {
		margin: 0 0 10px;
		font-size: 13px;
		font-weight: 600;
	}
	.providers-list ul {
		margin: 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.providers-list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border: 1px solid var(--color-line);
		border-radius: 8px;
		padding: 8px 12px;
	}
	.providers-row {
		display: flex;
		min-width: 0;
		flex-direction: column;
	}
	.providers-row strong {
		font-size: 13px;
	}
	.providers-row small {
		font-size: 11px;
		color: var(--color-ink-3);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
