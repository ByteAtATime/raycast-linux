<script lang="ts">
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import type { UINode } from '$lib/types';
	import { DropdownMenuItem } from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';
	import { getContext } from 'svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		displayAs?: 'item' | 'button';
	};

	let { nodeId, uiTree, onDispatch, displayAs = 'item' }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Action.CopyToClipboard' }))
	);

	const context: { primaryActionNodeId?: number } | undefined = getContext('ActionPanelContext');
	const shouldHideInDropdown = $derived(
		context?.primaryActionNodeId === nodeId && displayAs === 'item'
	);

	function handleClick() {
		if (componentProps) {
			writeText(componentProps.content);
			onDispatch(nodeId, 'onCopy', []);
		}
	}
</script>

{#if node && componentProps && !shouldHideInDropdown}
	{#if displayAs === 'button'}
		<Button onclick={handleClick}>{componentProps.title ?? 'Copy to Clipboard'}</Button>
	{:else}
		<DropdownMenuItem onclick={handleClick}>
			{componentProps.title ?? 'Copy to Clipboard'}
		</DropdownMenuItem>
	{/if}
{/if}
