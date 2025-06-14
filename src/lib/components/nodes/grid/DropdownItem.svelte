<script lang="ts">
	import type { UINode } from '$lib/types';
	import { useTypedNode } from '$lib/node.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import Icon from '$lib/components/Icon.svelte';
	import { RaycastIconSchema } from '$lib/props';
	import { convertFileSrc } from '@tauri-apps/api/core';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
	};

	let { nodeId, uiTree, onDispatch }: Props = $props();

	const { props: itemProps } = $derived.by(
		useTypedNode(() => ({ nodeId, uiTree, type: 'Grid.Dropdown.Item' }))
	);

	const iconInfo = $derived.by(() => {
		const icon = itemProps?.icon;
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

{#if itemProps}
	<DropdownMenu.RadioItem value={itemProps.value}>
		{#if iconInfo}
			<div class="mr-2 flex size-4 shrink-0 items-center justify-center">
				{#if iconInfo.type === 'raycast'}
					<Icon iconName={iconInfo.name} class="size-4" />
				{:else if iconInfo.type === 'image'}
					<img src={iconInfo.src} alt="" class="size-full object-cover" style={maskStyles} />
				{/if}
			</div>
		{/if}
		{itemProps.title}
	</DropdownMenu.RadioItem>
{/if}
