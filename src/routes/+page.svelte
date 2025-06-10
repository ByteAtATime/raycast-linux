<script lang="ts">
  import { Input } from "$lib/components/ui/input";

  async function run() {
    const { runPlugin } = await import("$lib");

    await runPlugin();
  }
</script>

<div class="flex flex-col items-center h-screen">
  <Input
    class="rounded-none border-0 border-b focus-visible:border-b-foreground transition-colors duration-75"
  />
  <button onclick={run}>Run Plugin</button>
</div>
