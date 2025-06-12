<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import NodeRenderer from '../NodeRenderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));

	if (!node) {
		throw new Error('Node not found'); // ideally, this shouldn't happen
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		{#each node.children as childId}
			<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
