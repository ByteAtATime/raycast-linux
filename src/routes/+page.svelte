<script lang="ts">
	import { sidecarService } from '$lib/sidecar.svelte';
	import { uiStore } from '$lib/ui.svelte';
	import NodeRenderer from '$lib/components/NodeRenderer.svelte';
	import List from '$lib/components/nodes/List.svelte';
	import Grid from '$lib/components/nodes/Grid.svelte';
	import Detail from '$lib/components/nodes/detail/Detail.svelte';
	import { untrack } from 'svelte';

	const { uiTree, rootNodeId, selectedNodeId } = $derived(uiStore);

	$effect(() => {
		return untrack(() => {
			sidecarService.start();
			return () => {
				sidecarService.stop();
			};
		});
	});

	const rootNode = $derived(uiTree.get(rootNodeId!));
	const selectedItemNode = $derived(uiTree.get(selectedNodeId!));
	const actionsNodeId = $derived(
		rootNode?.type === 'Detail'
			? rootNode.namedChildren?.['actions']
			: selectedItemNode?.namedChildren?.['actions']
	);

	function handleDispatch(instanceId: number, handlerName: string, args: any[]) {
		sidecarService.dispatchEvent('dispatch-event', { instanceId, handlerName, args });
	}

	function handleSelect(nodeId: number | undefined) {
		uiStore.selectedNodeId = nodeId;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			sidecarService.dispatchEvent('pop-view');
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<main class="flex h-screen flex-col">
	<div class="grow overflow-y-auto">
		{#if rootNode}
			{#if rootNode.type === 'List'}
				<List nodeId={rootNode.id} {uiTree} onDispatch={handleDispatch} onSelect={handleSelect} />
			{:else if rootNode.type === 'Grid'}
				<Grid nodeId={rootNode.id} {uiTree} onDispatch={handleDispatch} onSelect={handleSelect} />
			{:else if rootNode.type === 'Detail'}
				<Detail nodeId={rootNode.id} {uiTree} onDispatch={handleDispatch} />
			{:else}
				<NodeRenderer nodeId={rootNode.id} {uiTree} onDispatch={handleDispatch} />
			{/if}
		{/if}
	</div>

	<aside class="bg-muted flex h-12 shrink-0 items-center justify-between border-t px-4">
		<span>{rootNode?.props.navigationTitle ?? 'Raycast Linux'}</span>

		{#if actionsNodeId}
			<NodeRenderer nodeId={actionsNodeId} {uiTree} onDispatch={handleDispatch} />
		{/if}
	</aside>
</main>
