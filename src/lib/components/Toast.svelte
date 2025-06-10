<script lang="ts">
  import { Separator } from "./ui/separator";
  import { getToast } from "../results.svelte";
  import { Toast } from "$lib/api/toast";
  import { Button } from "./ui/button";
  import type * as api from "@raycast/api";
  import { Kbd } from "./ui/kbd";
  import { shortcutToText } from "$lib/renderKey";

  const toast = getToast();

  const styles = $derived.by(() => {
    switch (toast?.style) {
      case Toast.Style.Success:
        return "bg-green-500/20";
      case Toast.Style.Failure:
        return "bg-red-500/20";
      default:
        return "bg-gray-500/20";
    }
  });
</script>

<Separator />

{#if toast}
  {@const actualToast = toast as Toast}

  <div class="py-2 px-4 flex items-center gap-4 {styles}">
    {#if actualToast.style === "SUCCESS"}
      <div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
    {:else if actualToast.style === "FAILURE"}
      <div class="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
    {:else if actualToast.style === "ANIMATED"}
      <div class="w-2.5 h-2.5 bg-gray-500 rounded-full"></div>
    {/if}

    {actualToast.title}

    <div class="grow"></div>

    {#if actualToast.primaryAction}
      <Button
        variant="ghost"
        onclick={() =>
          actualToast.primaryAction!.onAction(actualToast as api.Toast)}
      >
        {actualToast.primaryAction.title}

        {#if actualToast.primaryAction.shortcut}
          <Kbd>
            {shortcutToText(actualToast.primaryAction.shortcut)}
          </Kbd>
        {/if}
      </Button>
    {/if}
  </div>
{/if}
