<script lang="ts">
	import type { UINode } from '$lib/types';
	import NodeRenderer from '../../NodeRenderer.svelte';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node } = $derived.by(useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata' })));
</script>

{#if node}
	<div class="flex flex-col gap-4">
		{#each node.children as childId}
			<NodeRenderer {nodeId} {uiTree} {onDispatch} />
		{/each}
	</div>
{/if}
