<script lang="ts">
	import icons from '$lib/icons.svg';

	type Props = {
		iconName: string;
		class?: string;
	};

	let { iconName, class: className }: Props = $props();
</script>

<svg class="size-4 shrink-0 fill-none {className}">
	<use href="{icons}#{iconName}"></use>
</svg>
