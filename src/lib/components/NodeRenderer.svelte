<script lang="ts">
	import type { UINode } from '$lib/types';
	import ActionPanelSection from './nodes/ActionPanelSection.svelte';
	import ActionCopyToClipboard from './nodes/actions/CopyToClipboard.svelte';
	import ActionOpenInBrowser from './nodes/actions/OpenInBrowser.svelte';
	import ActionPanel from './nodes/ActionPanel.svelte';
	import Action from './nodes/actions/Action.svelte';
	import ActionPush from './nodes/actions/ActionPush.svelte';

	// TODO: maybe make uiTree global
	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));
</script>

{#if node}
	{#if node.type === 'Action'}
		<Action {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.Panel'}
		<ActionPanel {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.Panel.Section'}
		<ActionPanelSection {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.CopyToClipboard'}
		<ActionCopyToClipboard {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.OpenInBrowser'}
		<ActionOpenInBrowser {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.Push'}
		<ActionPush {nodeId} {uiTree} {onDispatch} />
	{/if}
{/if}
