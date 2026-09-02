<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
</script>

<main class="grid min-h-dvh w-full place-items-center p-6 text-center">
	<div class="space-y-4">
		<p class="text-sm font-medium text-muted-foreground">{page.status}</p>
		<h1 class="text-2xl font-semibold">{page.error?.message ?? 'Something went wrong'}</h1>
		<Button href="/apps/dashboard">Back to dashboard</Button>
	</div>
</main>
