<script lang="ts">
	import type { GridSectionProps } from '$lib/props';

	type Props = {
		props: GridSectionProps;
	};

	let { props }: Props = $props();
</script>

<h3 class="col-start-1 -col-end-1 px-4 pt-2.5 pb-1 text-xs font-semibold text-gray-500 uppercase">
	{props.title}
</h3>
