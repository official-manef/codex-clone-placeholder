<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
</script>

<main class="grid min-h-dvh w-full place-items-center px-4 py-10 sm:px-6">
	<Card.Root class="w-full max-w-4xl overflow-hidden">
		<Card.Header class="space-y-5 p-6 sm:p-10">
			<Badge variant="secondary" class="w-fit"
				><Sparkles class="size-3.5" /> Svelte 5 Runes starter</Badge
			>
			<div class="space-y-3">
				<Card.Title class="max-w-3xl text-3xl tracking-tight sm:text-5xl"
					><h1>Full-stack Svelte, already structured for AI-assisted work.</h1></Card.Title
				>
				<Card.Description class="max-w-2xl text-base"
					>Bun + SvelteKit + shadcn-svelte + optional Convex, with root vertical slices and one
					dynamic page registry.</Card.Description
				>
			</div>
			<div class="flex flex-wrap gap-3">
				<Button href="/apps/dashboard" size="lg" class="h-11"
					>Open starter <ArrowRight class="size-4" /></Button
				>
				<Button href="https://svelte.dev/docs/ai/overview" variant="outline" size="lg" class="h-11"
					>Svelte AI docs</Button
				>
			</div>
		</Card.Header>
	</Card.Root>
</main>
