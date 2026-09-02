<script lang="ts">
	import { AppShell, type AppSlug } from '$features/app-shell';
	let { data }: { data: { slug: AppSlug } } = $props();
</script>

<AppShell activeSlug={data.slug} />
