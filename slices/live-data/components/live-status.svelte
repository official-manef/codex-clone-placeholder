<script lang="ts">
	import { useQuery } from 'convex-svelte';
	import { makeFunctionReference } from 'convex/server';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';

	type StarterStatus = { ok: true; stack: string; generatedAt: number };
	const statusRef = makeFunctionReference<'query', Record<string, never>, StarterStatus>(
		'starter:status'
	);
	const status = useQuery(statusRef, {});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title class="flex items-center gap-2"
			>Convex connection <Badge variant="secondary">Reactive</Badge></Card.Title
		>
		<Card.Description
			><code>useQuery()</code> is already reactive; there is no duplicate <code>$derived</code> wrapper.</Card.Description
		>
	</Card.Header>
	<Card.Content>
		{#if status.isLoading}
			<div class="space-y-2" aria-label="Loading Convex status">
				<Skeleton class="h-5 w-52" /><Skeleton class="h-4 w-72 max-w-full" />
			</div>
		{:else if status.error}
			<p class="text-sm text-destructive">{status.error.message}</p>
		{:else}
			<p class="text-sm font-medium">{status.data.stack}</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Backend timestamp: {new Date(status.data.generatedAt).toLocaleString()}
			</p>
		{/if}
	</Card.Content>
</Card.Root>
