<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import NodeRenderer from './NodeRenderer.svelte';
	import ActionPanelSection from './nodes/ActionPanelSection.svelte';
	import ActionCopyToClipboard from './nodes/actions/CopyToClipboard.svelte';
	import ActionOpenInBrowser from './nodes/actions/OpenInBrowser.svelte';
	import ActionPanel from './nodes/ActionPanel.svelte';

	// TODO: maybe make uiTree global
	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));
</script>

{#if node}
	{#if node.type === 'ActionPanel'}
		<ActionPanel {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'ActionPanelSection'}
		<ActionPanelSection {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.CopyToClipboard'}
		<ActionCopyToClipboard {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.OpenInBrowser'}
		<ActionOpenInBrowser {nodeId} {uiTree} {onDispatch} />
	{/if}
{/if}
