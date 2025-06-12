<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import NodeRenderer from '../NodeRenderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { getTypedProps } from '$lib/props';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));
	const componentProps = $derived(
		node ? getTypedProps(node as UINode & { type: 'ActionPanelSection' }) : null
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
