<script lang="ts">
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import type { UINode } from '$lib/types';
	import { DropdownMenuItem } from '$lib/components/ui/dropdown-menu';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { node, props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Action.CopyToClipboard' }))
	);
</script>

{#if node && componentProps}
	<DropdownMenuItem
		onclick={() => {
			writeText(componentProps.content);
			onDispatch(nodeId, 'onCopy', []);
		}}
	>
		{componentProps.title ?? 'Copy to Clipboard'}
	</DropdownMenuItem>
{/if}
