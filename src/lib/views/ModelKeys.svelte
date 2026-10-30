<script lang="ts">
	import { useAuth } from 'convex-svelte';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';
	import { authCopy } from '$lib/auth_state';
	import View from '#lib/View.svelte';
	import { ProviderManager } from '$features/cloud';

	/**
	 * Model keys screen.
	 *
	 * The shell passes a fixed `screenProps` object that carries no session, so this view reads
	 * the server's auth facts from `page.data.auth` and the Convex auth state itself (the same
	 * pattern as `src/lib/cloud/components/mcp-manager.svelte`). `useAuth()` throws without
	 * `setupAuth()`, which only runs when a deployment URL exists.
	 */
	const cloudUrl = env.PUBLIC_CONVEX_URL;
	const auth = cloudUrl ? useAuth() : null;
	const copy = $derived(
		authCopy({
			configured: page.data.auth?.enabled === true,
			signedIn: auth?.isAuthenticated === true,
			isLoading: auth?.isLoading === true
		})
	);
</script>

<View
	title="Model keys"
	icon="shield"
	subtitle="Bring your own provider key. It is posted once and encrypted on your Convex deployment."
>
	{#if !cloudUrl}
		<p class="text-[12.5px] leading-relaxed text-ink-2" role="status">
			Cloud mode is not configured. Set <code>PUBLIC_CONVEX_URL</code> to your own Convex
			deployment to connect a provider key; this build keeps every turn local or on a paired device.
		</p>
	{:else if copy.tone === 'unavailable'}
		<p class="text-[12.5px] leading-relaxed text-ink-2" role="status">
			<span class="font-medium">{copy.title}.</span>
			{copy.detail}
		</p>
	{:else if copy.tone === 'signin'}
		<p class="text-[12.5px] leading-relaxed text-ink-2" role="status">
			{copy.title}.
			{#if copy.action}
				<a class="underline" href={copy.action}>Sign in</a>
			{/if}
			The key is encrypted server-side under your Convex identity; local and device engines keep
			working without an account.
		</p>
	{:else if copy.title}
		<p class="text-[12.5px] text-ink-3" role="status">{copy.title}</p>
	{:else}
		<ProviderManager signedIn={auth?.isAuthenticated === true} />
	{/if}
</View>
