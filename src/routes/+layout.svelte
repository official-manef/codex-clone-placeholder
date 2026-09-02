<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { env } from '$env/dynamic/public';
	import { setupConvex } from 'convex-svelte';

	let { children } = $props();
	const convexUrl = env.PUBLIC_CONVEX_URL;
	if (convexUrl) setupConvex(convexUrl);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#171717" />
</svelte:head>
{@render children()}
