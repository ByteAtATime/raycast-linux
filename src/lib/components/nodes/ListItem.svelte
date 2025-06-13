<script lang="ts">
	import type { ListItemProps } from '$lib/props';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { RaycastIconSchema } from '$lib/props';
	import Icon from '$lib/components/Icon.svelte';
	import { convertFileSrc } from '@tauri-apps/api/core';

	type Props = {
		props: ListItemProps;
		selected: boolean;
	} & HTMLButtonAttributes;

	let { props, selected, ...restProps }: Props = $props();

	const iconInfo = $derived.by(() => {
		if (!props.icon) return null;

		const absolutePath = '/home/byte/code/raycast-linux/sidecar/dist/plugin/assets/';

		if (typeof props.icon === 'string') {
			if (RaycastIconSchema.safeParse(props.icon).success) {
				return { type: 'raycast' as const, name: props.icon };
			}
			return { type: 'image' as const, src: convertFileSrc(absolutePath + props.icon) };
		}

		if (typeof props.icon === 'object' && 'source' in props.icon) {
			return {
				type: 'image' as const,
				src: convertFileSrc(absolutePath + props.icon.source),
				mask: props.icon.mask
			};
		}

		return null;
	});

	const maskStyles = $derived(
		iconInfo?.type === 'image' && iconInfo.mask === 'Circle' ? 'border-radius: 50%;' : ''
	);
</script>

<button
	type="button"
	class="hover:bg-accent/50 flex w-full items-center gap-3 px-4 py-2 text-left"
	class:bg-accent={selected}
	{...restProps}
>
	<div class="flex size-5 shrink-0 items-center justify-center">
		{#if iconInfo}
			{#if iconInfo.type === 'raycast'}
				<Icon iconName={iconInfo.name} class="size-4" />
			{:else if iconInfo.type === 'image'}
				<img src={iconInfo.src} alt="" class="size-full object-cover" style={maskStyles} />
			{/if}
		{/if}
	</div>
	<span>{props.title}</span>
	{#if props.accessories}
		<div class="ml-auto">
			{#each props.accessories as accessory}
				<span class="text-muted-foreground text-sm">{accessory.text}</span>
			{/each}
		</div>
	{/if}
</button>
