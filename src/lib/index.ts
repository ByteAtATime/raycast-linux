import { mockRaycastApi } from "./api";
import plugin from "./plugin.js?raw";

declare global {
  interface Window {
    require: (moduleName: string) => unknown;
    module: { exports: { default?: () => unknown } };
  }
}

window.require = function (moduleName) {
  console.log(`Plugin is requesting module: ${moduleName}`);
  if (moduleName === "@raycast/api") {
    return mockRaycastApi;
  }
  throw new Error(
    `Module not found: ${moduleName}. Our fake 'require' is very limited!`
  );
};

window.module = {
  exports: {},
};

export async function runPlugin() {
  console.log("Requesting plugin script from Rust backend...");
  const scriptText = plugin;

  console.log("Executing plugin script in a try/catch block...");
  try {
    // TOOD: don't use eval
    eval(scriptText);
  } catch (e) {
    console.error("Error evaluating plugin script:", e);
    return;
  }

  const pluginMainFunction = window.module.exports.default;

  if (pluginMainFunction && typeof pluginMainFunction === "function") {
    console.log(
      "Plugin script loaded successfully. Running its main command..."
    );
    await pluginMainFunction();
    console.log("Plugin main command finished.");
  } else {
    console.error(
      "Could not find a default export function in the plugin script."
    );
  }
}
