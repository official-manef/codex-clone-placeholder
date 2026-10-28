<script lang="ts">
	import { getContext, setContext, type Component } from 'svelte';
	import {
		WORKSPACE_RESOURCE_CONTEXT,
		type WorkspaceResourceContext,
		type WorkspaceOutputOrigin
	} from './shared/runtime/index.js';
	let {
		screen: Screen,
		viewId,
		origin,
		screenProps
	}: {
		screen: Component<any>;
		viewId: string;
		origin?: WorkspaceOutputOrigin;
		screenProps: Record<string, any>;
	} = $props();
	const parent = getContext<WorkspaceResourceContext | undefined>(WORKSPACE_RESOURCE_CONTEXT);
	if (parent)
		setContext<WorkspaceResourceContext>(WORKSPACE_RESOURCE_CONTEXT, {
			register: (_id, header) => parent.register(viewId, header)
		});
	let resultText = $derived.by(() => {
		try {
			const value =
				typeof origin?.result === 'string'
					? origin.result
					: JSON.stringify(origin?.result, null, 2);
			return value && value.length > 262144
				? value.slice(0, 262144) + '\n[Display truncated]'
				: value;
		} catch {
			return 'This result cannot be displayed as text.';
		}
	});
</script>

{#if origin}<div class="output-origin" style:--origin-color={origin.color}>
		<span aria-hidden="true"></span>{origin.label}
	</div>{/if}
{#if origin?.resultOnly && origin.result === undefined}<div class="comparison-result" role="status">
		<h2>Output</h2>
		<p>No result is available yet.</p>
	</div>
{:else if origin?.result !== undefined}<div
		class="comparison-result"
		role="region"
		aria-label="Output result"
	>
		<pre>{resultText}</pre>
	</div>
{:else}<Screen {...screenProps} outputOrigin={origin} />{/if}

<style>
	.output-origin {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 7px 14px;
		font-size: 12px;
		border-bottom: 1px solid var(--color-line);
	}
	span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--origin-color);
	}
	.comparison-result {
		overflow: auto;
		flex: 1;
		min-height: 0;
		padding: 16px;
	}
	pre {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-size: 12px;
	}
</style>
