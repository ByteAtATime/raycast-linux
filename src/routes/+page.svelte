<script lang="ts">
  async function run() {
    const { runPlugin } = await import("$lib");

    await runPlugin();
  }
</script>

<button onclick={run}>Run Plugin</button>
