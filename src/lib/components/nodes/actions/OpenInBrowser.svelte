<script lang="ts">
	import { openUrl } from '@tauri-apps/plugin-opener';
	import type { UINode } from '$lib/types';
	import type { SvelteMap } from 'svelte/reactivity';

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
</script>

<button
	class="rounded-md p-2 text-left hover:bg-blue-100"
	onclick={() => {
		openUrl(node.props.url);
		onDispatch(nodeId, 'onOpenInBrowser', []);
	}}
>
	{node.props.title ?? 'Open in Browser'}
</button>
