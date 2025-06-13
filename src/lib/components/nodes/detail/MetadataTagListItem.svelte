<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import { RaycastIconSchema } from '$lib/props';
	import Icon from '$lib/components/Icon.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();
	const { props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata.TagList.Item' }))
	);

	function handleClick() {
		onDispatch(nodeId, 'onAction', []);
	}
</script>

{#if componentProps}
	<button
		type="button"
		class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
		style:color={componentProps.color}
		style:background-color={componentProps.color ? `${componentProps.color}20` : 'rgb(229 231 235)'}
		onclick={handleClick}
	>
		{#if componentProps.icon}
			{#if RaycastIconSchema.safeParse(componentProps.icon).success}
				<Icon iconName={componentProps.icon as string} class="size-3" />
			{:else}
				<img src={componentProps.icon.source} alt={componentProps.text} class="size-3" />
			{/if}
		{/if}
		{#if componentProps.text}
			<span>{componentProps.text}</span>
		{/if}
	</button>
{/if}
