<script lang="ts">
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';
	import { DropdownMenuItem } from '$lib/components/ui/dropdown-menu';
	import { getTypedProps } from '$lib/props';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const node = $derived(uiTree.get(nodeId));

	if (!node) {
		throw new Error('Node not found'); // ideally, this shouldn't happen
	}

	const componentProps = $derived(
		node ? getTypedProps(node as UINode & { type: 'Action.CopyToClipboard' }) : null
	);
</script>

{#if componentProps}
	<DropdownMenuItem
		onclick={() => {
			writeText(componentProps.content);
			onDispatch(nodeId, 'onCopy', []);
		}}
	>
		{componentProps.title ?? 'Copy to Clipboard'}
	</DropdownMenuItem>
{/if}
