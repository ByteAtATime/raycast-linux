<script lang="ts">
	import type { ListItemProps } from '$lib/props';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		props: ListItemProps;
		selected: boolean;
	} & HTMLButtonAttributes;

	let { props, selected, ...restProps }: Props = $props();
</script>

<button
	type="button"
	class="hover:bg-accent/50 flex w-full items-center gap-3 px-4 py-2 text-left"
	class:bg-accent={selected}
	{...restProps}
>
	<span class="text-lg">{props.icon}</span>
	<span>{props.title}</span>
	{#if props.accessories}
		<div class="ml-auto">
			{#each props.accessories as accessory}
				<span class="text-muted-foreground text-sm">{accessory.text}</span>
			{/each}
		</div>
	{/if}
</button>
