<script lang="ts">
	import './layout.css';
	import { appConfig } from '$lib/config/app';
	import { assets, assetMimeType } from '../../assets.config';
	import { pageMetadata, siteOrigin } from '$lib/config/metadata';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { setupConvex } from 'convex-svelte';

	let { children } = $props();
	const convexUrl = env.PUBLIC_CONVEX_URL;
	if (convexUrl) setupConvex(convexUrl);
	const origin = siteOrigin(env.PUBLIC_SITE_URL);
	const metadata = $derived(
		pageMetadata(
			page.error ? { title: `${page.status}` } : page.data.meta,
			page.url.pathname,
			origin
		)
	);
</script>

<svelte:head>
	<title>{metadata.title}</title>
	<meta name="description" content={metadata.description} />
	<link rel="icon" type={assetMimeType(assets.favicon.path)} href={assets.favicon.path} />
	<link rel="apple-touch-icon" href={assets.appleIcon.path} />
	<link rel="manifest" href="/site.webmanifest" />
	<meta name="theme-color" content={appConfig.themeColor} />
	<meta
		name="robots"
		content={page.error || !origin || page.data.meta?.indexable === false
			? 'noindex,nofollow'
			: 'index,follow'}
	/>
	{#if metadata.canonical}<link rel="canonical" href={metadata.canonical} /><meta
			property="og:url"
			content={metadata.canonical}
		/>{/if}
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={appConfig.name} />
	<meta property="og:title" content={metadata.title} />
	<meta property="og:description" content={metadata.description} />
	<meta property="og:image" content={metadata.image} />
	<meta property="og:image:width" content={String(assets.socialImage.width)} />
	<meta property="og:image:height" content={String(assets.socialImage.height)} />
	<meta property="og:image:alt" content={`${appConfig.name} preview`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={metadata.title} />
	<meta name="twitter:description" content={metadata.description} />
	<meta name="twitter:image" content={metadata.image} />
</svelte:head>
{@render children()}
