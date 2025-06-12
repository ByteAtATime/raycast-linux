<script lang="ts">
	import type { GridItemProps } from '$lib/props';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		props: GridItemProps;
		selected: boolean;
	} & HTMLButtonAttributes;

	let { props, selected, ...restProps }: Props = $props();
</script>

<button
	type="button"
	class="hover:bg-accent/50 flex flex-col items-center gap-3 px-4 py-2 text-left"
	class:bg-accent={selected}
	{...restProps}
>
	<img src={props.content} alt={props.title} />

	{#if props.title}
		<span class="text-sm font-medium">{props.title}</span>
	{/if}
	{#if props.subtitle}
		<span class="text-muted-foreground text-xs">{props.subtitle}</span>
	{/if}
</button>
