<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import NodeRenderer from '../../NodeRenderer.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata.TagList' }))
	);
</script>

{#if node && componentProps}
	<div>
		<h3 class="mb-1 text-xs font-medium text-gray-500 uppercase">{componentProps.title}</h3>
		<div class="flex flex-wrap items-center gap-1.5">
			{#each node.children as childId}
				<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
			{/each}
		</div>
	</div>
{/if}
