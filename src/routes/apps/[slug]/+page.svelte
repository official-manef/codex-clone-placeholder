<script lang="ts">
	import { AppShell, getApp, type AppSlug } from '$features/app-shell';
	let { data }: { data: { slug: AppSlug } } = $props();
	const app = $derived(getApp(data.slug));
</script>

<svelte:head>
	<title>{app?.label} · Svelte Convex Starter</title>
	<meta name="description" content={app?.description} />
</svelte:head>

<AppShell activeSlug={data.slug} />
