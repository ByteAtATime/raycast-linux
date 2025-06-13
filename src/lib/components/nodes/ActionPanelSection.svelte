<script lang="ts">
	import type { UINode } from '$lib/types';
	import NodeRenderer from '../NodeRenderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Action.Panel.Section' }))
	);
</script>

{#if node && componentProps}
	<DropdownMenu.Group class="flex flex-col">
		{#if componentProps.title}
			<DropdownMenu.Label class="px-2 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase">
				{componentProps.title}
			</DropdownMenu.Label>
			<DropdownMenu.Separator />
		{/if}
		{#each node.children as childId}
			<!-- TOOD: is this cyclic dependency idiomatic? -->
			<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
		{/each}
	</DropdownMenu.Group>
{/if}
