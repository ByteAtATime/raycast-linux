<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import { RaycastIconSchema } from '$lib/props';
	import Icon from '$lib/components/Icon.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';
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

	const iconInfo = $derived.by(() => {
		const icon = componentProps?.icon;
		if (!icon) return null;

		const absolutePath = '/home/byte/code/raycast-linux/sidecar/dist/plugin/assets/';

		if (typeof icon === 'string') {
			if (RaycastIconSchema.safeParse(icon).success) {
				return { type: 'raycast' as const, name: icon };
			}
			return { type: 'image' as const, src: convertFileSrc(absolutePath + icon) };
		}

		if (typeof icon === 'object' && 'source' in icon) {
			return {
				type: 'image' as const,
				src: convertFileSrc(absolutePath + icon.source),
				mask: icon.mask
			};
		}
		return null;
	});
	const maskStyles = $derived(
		iconInfo?.type === 'image' && iconInfo.mask === 'Circle' ? 'border-radius: 50%;' : ''
	);
</script>

{#if componentProps}
	<button
		type="button"
		class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold"
		style:color={componentProps.color}
		style:background-color={componentProps.color ? `${componentProps.color}20` : 'rgb(229 231 235)'}
		onclick={handleClick}
	>
		{#if iconInfo}
			{#if iconInfo.type === 'raycast'}
				<Icon iconName={iconInfo.name} class="size-3" />
			{:else if iconInfo.type === 'image'}
				<img src={iconInfo.src} alt="" class="size-3 object-cover" style={maskStyles} />
			{/if}
		{/if}
		{#if componentProps.text}
			<span>{componentProps.text}</span>
		{/if}
	</button>
{/if}
