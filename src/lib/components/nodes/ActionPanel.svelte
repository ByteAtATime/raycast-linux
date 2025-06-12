<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import NodeRenderer from '../NodeRenderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({
			nodeId,
			uiTree,
			type: 'ActionPanel'
		}))
	);
</script>

{#if node && componentProps}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>Open</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			{#each node.children as childId}
				<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
