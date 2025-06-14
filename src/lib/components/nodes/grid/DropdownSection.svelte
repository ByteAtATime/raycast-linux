<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import NodeRenderer from '$lib/components/NodeRenderer.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();

	const { node, props: sectionProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Grid.Dropdown.Section' }))
	);
</script>

{#if node && sectionProps}
	<DropdownMenu.Separator />
	<DropdownMenu.Group>
		{#if sectionProps.title}
			<DropdownMenu.GroupHeading>{sectionProps.title}</DropdownMenu.GroupHeading>
		{/if}
		{#each node.children as childId (childId)}
			<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
		{/each}
	</DropdownMenu.Group>
{/if}
