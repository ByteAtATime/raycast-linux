<!-- src/ResultsList.svelte -->
<script lang="ts">
	import { getResults } from '$lib/results.svelte';

	const pluginResults = $derived(getResults());
</script>

<div class="flex-grow overflow-y-auto">
	<ul>
		{#each pluginResults as result}
			<li class="flex cursor-pointer items-center rounded-lg p-2 hover:bg-blue-500/20">
				<div class="ml-2 flex flex-col">
					<span class="text-xs text-gray-400">{result.subtitle}</span>
				</div>
			</li>
		{/each}
	</ul>
</div>
