<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import NodeRenderer from './NodeRenderer.svelte';
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));
</script>

{#if node}
	{JSON.stringify(node)}
	{@const props = node.props}
	{#if node.type === 'ActionPanel'}
		<div class="flex flex-col gap-2">
			{#each node.children as childId}
				<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
			{/each}
		</div>
	{:else if node.type === 'ActionPanelSection'}
		<section class="flex flex-col">
			{#if props.title}
				<h3 class="px-2 pt-2 pb-1 text-xs font-bold text-gray-500 uppercase">{props.title}</h3>
			{/if}
			{#each node.children as childId}
				<NodeRenderer nodeId={childId} {uiTree} {onDispatch} />
			{/each}
		</section>
	{:else if node.type === 'Action.CopyToClipboard'}
		<button
			class="rounded-md p-2 text-left hover:bg-blue-100"
			onclick={() => {
				writeText(node.props.content);
				onDispatch(node.id, 'onCopy', []);
			}}
		>
			{props.title}
		</button>
	{:else if node.type === 'Action.OpenInBrowser'}
		<button
			class="rounded-md p-2 text-left hover:bg-blue-100"
			onclick={() => onDispatch(node.id, 'onOpenInBrowser', [])}
		>
			{props.title}
		</button>
	{/if}
{/if}
