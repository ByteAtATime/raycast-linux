import { setResults } from "./results.svelte";

export const mockRaycastApi = {
  updateCommandMetadata: (metadata: { subtitle?: string | null }) => {
    setResults([{ subtitle: metadata.subtitle }]);
  },
  environment: {
    launchType: "userInitiated",
  },
  LaunchType: {
    UserInitiated: "userInitiated",
  },
  Toast: class {
    private options: unknown;
    constructor(options: unknown) {
      this.options = options;
      console.log("Toast created with title:", options);
    }
    show() {
      console.log("Toast shown with message:", this.options);
    }
    static Style = {
      Success: "success",
    };
  },
  Clipboard: {
    copy: (text: unknown) => {
      console.log("Copied to clipboard:", text);
    },
  },
};
