<!-- src/ResultsList.svelte -->
<script lang="ts">
  import { getResults } from "$lib/results.svelte";

  const pluginResults = $derived(getResults());
</script>

<div class="flex-grow overflow-y-auto">
  <ul>
    {#each pluginResults as result}
      <li
        class="flex items-center p-2 rounded-lg hover:bg-blue-500/20 cursor-pointer"
      >
        <div class="flex flex-col ml-2">
          <span class="text-xs text-gray-400">{result.subtitle}</span>
        </div>
      </li>
    {/each}
  </ul>
</div>
