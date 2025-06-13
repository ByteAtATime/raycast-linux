<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import { RaycastIconSchema } from '$lib/props';
	import Icon from '$lib/components/Icon.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
	};

	let { nodeId, uiTree }: Props = $props();
	const { props: componentProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata.Label' }))
	);

	const textValue = $derived(
		typeof componentProps?.text === 'object' ? componentProps.text.value : componentProps?.text
	);
	const textColor = $derived(
		typeof componentProps?.text === 'object' ? componentProps.text.color : undefined
	);
</script>

{#if componentProps}
	<div>
		<h3 class="mb-1 text-xs font-medium text-gray-500 uppercase">{componentProps.title}</h3>
		<div class="flex items-center gap-2">
			{#if componentProps.icon}
				{#if RaycastIconSchema.safeParse(componentProps.icon).success}
					<Icon iconName={componentProps.icon as string} class="size-4" />
				{:else}
					<img src={componentProps.icon.source} alt={componentProps.title} class="size-4" />
				{/if}
			{/if}
			{#if textValue}
				<span class="text-sm" style:color={textColor}>{textValue}</span>
			{/if}
		</div>
	</div>
{/if}
