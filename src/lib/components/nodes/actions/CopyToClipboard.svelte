<script lang="ts">
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
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
		writeText(node.props.content);
		onDispatch(nodeId, 'onCopy', []);
	}}
>
	{node.props.title ?? 'Copy to Clipboard'}
</button>
