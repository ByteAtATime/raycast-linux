<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata.Link' }))
	);
</script>

{#if componentProps}
	<div>
		<h3 class="mb-1 text-xs font-medium text-gray-500 uppercase">{componentProps.title}</h3>
		<a
			href={componentProps.target}
			onclick={(e) => {
				e.preventDefault();
				openUrl(componentProps.target);
			}}
			class="text-sm text-blue-600 hover:underline"
		>
			{componentProps.text}
		</a>
	</div>
{/if}
