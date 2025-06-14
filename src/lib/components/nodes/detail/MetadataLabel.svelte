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
		useTypedNode(() => ({ nodeId, uiTree, type: 'Detail.Metadata.Label' }))
	);

	const textValue = $derived(
		typeof componentProps?.text === 'object' ? componentProps.text.value : componentProps?.text
	);
	const textColor = $derived(
		typeof componentProps?.text === 'object' ? componentProps.text.color : undefined
	);

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
	<div>
		<h3 class="mb-1 text-xs font-medium text-gray-500 uppercase">{componentProps.title}</h3>
		<div class="flex items-center gap-2">
			{#if iconInfo}
				{#if iconInfo.type === 'raycast'}
					<Icon iconName={iconInfo.name} class="size-4" />
				{:else if iconInfo.type === 'image'}
					<img src={iconInfo.src} alt="" class="size-4 object-cover" style={maskStyles} />
				{/if}
			{/if}
			{#if textValue}
				<span class="text-sm" style:color={textColor}>{textValue}</span>
			{/if}
		</div>
	</div>
{/if}
