<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { SignalBanner } from '$lib/components/app-ui';
	import { t, tp } from '$features/placeholders';
	import type { CapabilitiesState } from '../state.svelte';
	import type { Capability } from '../types';

	let {
		capability,
		state,
		relatedEmpty = true,
		onback
	}: {
		capability: Capability;
		state: CapabilitiesState;
		relatedEmpty?: boolean;
		onback?: () => void;
	} = $props();

	const connection = $derived(state.getConnection(capability.id));
	const pending = $derived(connection === 'pending');
	const failed = $derived(state.getError(capability.id));
	const related = [1, 2, 3];
</script>

<article
	class="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4"
	data-connection={connection}
	data-error={failed ? 'true' : undefined}
>
	{#if onback}
		<Button
			variant="ghost"
			size="icon-sm"
			class="min-[850px]:hidden"
			aria-label={t('resource_history')}
			onclick={onback}
		>
			<ArrowLeft />
		</Button>
	{/if}

	<header class="flex flex-col gap-2">
		<h2 class="text-lg font-semibold">{t(capability.nameKey)}</h2>
		<Badge variant="outline">
			{t(capability.type === 'a' ? 'capability_type_a' : 'capability_type_b')}
		</Badge>
		<p class="text-sm leading-6 text-muted-foreground">{t(capability.descriptionKey)}</p>
	</header>

	{#if pending}
		<SignalBanner title={t('partial_state')}>
			{t('capability_connection_pending')}
		</SignalBanner>
	{:else if failed}
		<SignalBanner title={t('error_state')}>
			{t('capability_connection_failed')}
		</SignalBanner>
	{/if}

	<div class="flex items-center justify-between border-y border-border py-3">
		<span class="text-sm">
			{t(
				connection === 'connected'
					? 'capability_connection_ready'
					: connection === 'pending'
						? 'capability_connection_pending'
						: failed
							? 'capability_connection_failed'
							: 'capability_connection_none'
			)}
		</span>
		<Button
			variant={connection === 'connected' ? 'outline' : 'default'}
			disabled={pending}
			aria-disabled={pending}
			onclick={() => state.connect(capability.id, 'success')}
		>
			{t(connection === 'connected' ? 'capability_connection_ready' : 'capability_connection_none')}
		</Button>
	</div>

	<section class="flex flex-col gap-2">
		<h3 class="text-sm font-semibold">{t('related_records')}</h3>
		{#if relatedEmpty}
			<p class="text-sm text-muted-foreground">{t('no_match_state')}</p>
		{:else}
			<ul class="flex flex-col gap-1">
				{#each related as n (n)}
					<li class="text-sm">{tp('recent_resource', n)}</li>
				{/each}
			</ul>
		{/if}
	</section>
</article>
