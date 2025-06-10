<script lang="ts">
  import { Separator } from "./ui/separator";
  import { getToast } from "../results.svelte";
  import { Toast } from "$lib/api/toast";

  const toast = getToast();
</script>

<Separator />

{#if toast}
  {@const actualToast = toast as Toast}

  <div class="py-2 px-4">
    {actualToast.title}
  </div>
{/if}
