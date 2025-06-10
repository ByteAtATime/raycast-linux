<script lang="ts">
  import ResultsList from "$lib/components/ResultsList.svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { Input } from "$lib/components/ui/input";

  async function run() {
    const { runPlugin } = await import("$lib");

    await runPlugin();
  }
</script>

<div class="flex flex-col items-stretch h-screen">
  <Input
    class="rounded-none border-0 border-b focus-visible:border-b-foreground transition-colors duration-75"
    oninput={run}
  />
  <div class="grow">
    <ResultsList />
  </div>

  <Toast />
</div>
