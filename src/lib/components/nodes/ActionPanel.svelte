<script lang="ts">
	import type { UINode } from '$lib/types';
	import NodeRenderer from '../NodeRenderer.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';
	import { setContext } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { MoreHorizontal } from '@lucide/svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		primaryActionNodeId?: number;
	};

	let { nodeId, uiTree, onDispatch, primaryActionNodeId }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({
			nodeId,
			uiTree,
			type: 'Action.Panel'
		}))
	);

	setContext('ActionPanelContext', { primaryActionNodeId });
</script>

{#if node && componentProps}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" size="icon">
					<MoreHorizontal class="h-4 w-4" />
					<span class="sr-only">Actions</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			{#each node.children as childId}
				<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
