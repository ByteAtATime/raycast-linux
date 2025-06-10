import { setResults } from "../results.svelte";
import type * as api from "@raycast/api";
import { Toast } from "./toast";

export const mockRaycastApi = {
  updateCommandMetadata: async (metadata: { subtitle?: string | null }) => {
    setResults([{ subtitle: metadata.subtitle }]);
  },
  environment: {
    launchType: "userInitiated",
  },
  LaunchType: {
    UserInitiated: "userInitiated",
    Background: "background",
  },
  Toast: Toast as typeof api.Toast,
  Clipboard: {
    copy: async (
      content: string | number | api.Clipboard.Content,
      options?: api.Clipboard.CopyOptions
    ) => {
      console.log("Copied to clipboard:", content);
    },
  },
} satisfies typeof api;
