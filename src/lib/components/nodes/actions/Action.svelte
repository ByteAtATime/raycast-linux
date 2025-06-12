<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import { DropdownMenuItem } from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Action' }))
	);
</script>

{#if node && componentProps}
	<DropdownMenuItem
		class="rounded-md p-2 text-left hover:bg-blue-100"
		onclick={() => {
			onDispatch(nodeId, 'onAction', []);
		}}
	>
		{componentProps.title}
	</DropdownMenuItem>
{/if}
