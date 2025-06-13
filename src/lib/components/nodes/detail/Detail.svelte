<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import NodeRenderer from '$lib/components/NodeRenderer.svelte';
	import SvelteMarked from 'svelte-marked';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();

	const { node, props: detailProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail' }))
	);

	const metadataNodeId = $derived(node?.namedChildren?.['metadata']);
</script>

{#if node && detailProps}
	<div class="flex h-full flex-row">
		<main class="h-full flex-grow overflow-y-auto p-6">
			{#if detailProps.isLoading}
				<div class="h-2 w-full animate-pulse rounded bg-gray-200" />
			{/if}

			{#if detailProps.markdown}
				<article class="prose dark:prose-invert">
					<SvelteMarked source={detailProps.markdown} />
				</article>
			{/if}
		</main>

		{#if metadataNodeId}
			<aside
				class="w-72 shrink-0 overflow-y-auto border-l bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
			>
				<NodeRenderer nodeId={metadataNodeId} {uiTree} {onDispatch} />
			</aside>
		{/if}
	</div>
{/if}
