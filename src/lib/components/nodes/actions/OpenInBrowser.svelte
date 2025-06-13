<script lang="ts">
	import { openUrl } from '@tauri-apps/plugin-opener';
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
		useTypedNode(() => ({ nodeId, uiTree, type: 'Action.OpenInBrowser' }))
	);
</script>

{#if node && componentProps}
	<DropdownMenuItem
		class="rounded-md p-2 text-left hover:bg-blue-100"
		onclick={() => {
			openUrl(componentProps.url);
			onDispatch(nodeId, 'onOpenInBrowser', []);
		}}
	>
		{componentProps.title ?? 'Open in Browser'}
	</DropdownMenuItem>
{/if}
