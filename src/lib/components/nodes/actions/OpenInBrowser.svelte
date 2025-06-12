<script lang="ts">
	import { openUrl } from '@tauri-apps/plugin-opener';
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
		node ? getTypedProps(node as UINode & { type: 'Action.OpenInBrowser' }) : null
	);
</script>

{#if componentProps}
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
