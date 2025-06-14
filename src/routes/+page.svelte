<script lang="ts">
	import { sidecarService } from '$lib/sidecar.svelte';
	import { uiStore } from '$lib/ui.svelte';
	import NodeRenderer from '$lib/components/NodeRenderer.svelte';
	import List from '$lib/components/nodes/List.svelte';
	import Grid from '$lib/components/nodes/Grid.svelte';
	import Detail from '$lib/components/nodes/detail/Detail.svelte';
	import { untrack } from 'svelte';
	import type { UINode } from '$lib/types';

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

	const actionInfo = $derived.by(() => {
		const actionsNodeId =
			rootNode?.type === 'Detail'
				? rootNode.namedChildren?.['actions']
				: selectedItemNode?.namedChildren?.['actions'];

		if (!actionsNodeId) {
			return { primary: undefined, secondary: undefined, panel: undefined };
		}

		const panelNode = uiTree.get(actionsNodeId);
		if (!panelNode || panelNode.type !== 'Action.Panel') {
			return { primary: undefined, secondary: undefined, panel: undefined };
		}

		const foundActions: UINode[] = [];
		function findActionsRecursive(nodeId: number) {
			const node = uiTree.get(nodeId);
			if (!node) return;

			const isAction = (n: UINode) =>
				n.type.startsWith('Action.') &&
				n.type !== 'Action.Panel' &&
				n.type !== 'Action.Panel.Section';

			if (isAction(node)) {
				foundActions.push(node);
			} else if (node.type === 'Action.Panel' || node.type === 'Action.Panel.Section') {
				for (const childId of node.children) {
					findActionsRecursive(childId);
				}
			}
		}

		findActionsRecursive(actionsNodeId);

		return {
			primary: foundActions[0],
			secondary: foundActions[1],
			panel: panelNode
		};
	});

	function handleDispatch(instanceId: number, handlerName: string, args: any[]) {
		sidecarService.dispatchEvent('dispatch-event', { instanceId, handlerName, args });
	}

	function handleSelect(nodeId: number | undefined) {
		uiStore.selectedNodeId = nodeId;
	}

	function getActionHandlerName(type: string): string {
		switch (type) {
			case 'Action.CopyToClipboard':
				return 'onCopy';
			case 'Action.OpenInBrowser':
				return 'onOpenInBrowser';
			default:
				return 'onAction';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			sidecarService.dispatchEvent('pop-view');
			return;
		}

		// In List/Grid/Detail, Enter is primary, Ctrl+Enter is secondary
		const isStandardView =
			rootNode?.type === 'List' || rootNode?.type === 'Grid' || rootNode?.type === 'Detail';

		if (event.key === 'Enter' && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
			if (isStandardView && actionInfo.primary) {
				event.preventDefault();
				const handlerName = getActionHandlerName(actionInfo.primary.type);
				handleDispatch(actionInfo.primary.id, handlerName, []);
			}
		}

		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
			if (isStandardView && actionInfo.secondary) {
				event.preventDefault();
				const handlerName = getActionHandlerName(actionInfo.secondary.type);
				handleDispatch(actionInfo.secondary.id, handlerName, []);
			}
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

		{#if actionInfo.panel}
			<div class="flex items-center gap-2">
				{#if actionInfo.primary}
					<NodeRenderer
						nodeId={actionInfo.primary.id}
						{uiTree}
						onDispatch={handleDispatch}
						displayAs="button"
					/>
				{/if}
				<NodeRenderer
					nodeId={actionInfo.panel.id}
					{uiTree}
					onDispatch={handleDispatch}
					primaryActionNodeId={actionInfo.primary?.id}
				/>
			</div>
		{/if}
	</aside>
</main>
