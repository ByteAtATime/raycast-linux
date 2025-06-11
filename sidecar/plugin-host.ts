import { createInterface } from "readline";
import React from "react";
import Reconciler from "react-reconciler";
import { jsx } from "react/jsx-runtime";
import plugin from "./dist/emoji.txt";
import { pack, PackrStream } from "msgpackr";

let commitBuffer: { type: string; payload: any }[] = [];

const sendingStream = new PackrStream();
sendingStream.pipe(process.stdout);

function writeOutput(data: object) {
  function removeSymbols(obj: object) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(removeSymbols);
    }

    const newObj = {};
    for (const key in obj) {
      newObj[key] = removeSymbols(obj[key]);
    }

    for (const symKey of Object.getOwnPropertySymbols(obj)) {
      // do nothing if the key is a symbol
    }

    for (const key in newObj) {
      if (typeof newObj[key] === "symbol") {
        newObj[key] = undefined;
      }
    }

    return newObj;
  }

  try {
    const payload = pack(removeSymbols(data));
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length);

    process.stdout.write(header);
    process.stdout.write(payload);
  } catch (e) {
    writeOutput({ type: "log", payload: e.toString() });
  }
}

function writeLog(message) {
  writeOutput({ type: "log", payload: message });
}

process.on("unhandledRejection", (reason, promise) => {
  writeLog(`--- UNHANDLED PROMISE REJECTION ---`);
  writeLog(reason.stack || reason);
});

let instanceCounter = 0;
const instances: Map<number, any> = new Map();

function serializeProps(props) {
  const serializable = {};
  for (const key in props) {
    if (key === "children" || typeof props[key] === "function") {
      continue;
    }
    try {
      JSON.stringify(props[key]);
      serializable[key] = props[key];
    } catch (error) {
      serializable[key] = `[Circular Reference in prop '${key}']`;
    }
  }
  return serializable;
}

const hostConfig = {
  getPublicInstance(instance) {
    return instance;
  },
  getRootHostContext(rootContainerInstance) {
    return {};
  },
  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    return {};
  },

  createInstance(
    type,
    props,
    rootContainer,
    hostContext,
    internalInstanceHandle
  ) {
    const componentType =
      typeof type === "string" ? type : type.name || "Anonymous";
    const id = ++instanceCounter;
    const stateNode = {
      id,
      type: componentType,
      children: [],
      props: serializeProps(props),
      _internalFiber: internalInstanceHandle,
    };
    internalInstanceHandle.stateNode = stateNode;
    instances.set(id, stateNode);

    commitBuffer.push({
      type: "CREATE_INSTANCE",
      payload: { id, type: componentType, props: stateNode.props },
    });
    return stateNode;
  },

  createTextInstance(text) {
    const id = ++instanceCounter;
    const instance = { id, type: "TEXT", text };
    instances.set(id, instance);

    commitBuffer.push({ type: "CREATE_TEXT_INSTANCE", payload: instance });
    return instance;
  },

  appendInitialChild(parentInstance, child) {
    parentInstance.children.push(child);
    commitBuffer.push({
      type: "APPEND_CHILD",
      payload: { parentId: parentInstance.id, childId: child.id },
    });
  },

  appendChild(parentInstance, child) {
    parentInstance.children.push(child);
    commitBuffer.push({
      type: "APPEND_CHILD",
      payload: { parentId: parentInstance.id, childId: child.id },
    });
  },

  appendChildToContainer(container, child) {
    container.children.push(child);
    commitBuffer.push({
      type: "APPEND_CHILD",
      payload: { parentId: container.id, childId: child.id },
    });
  },

  insertBefore(parentInstance, child, beforeChild) {
    const index = parentInstance.children.findIndex(
      (c) => c.id === beforeChild.id
    );
    if (index !== -1) {
      parentInstance.children.splice(index, 0, child);
      commitBuffer.push({
        type: "INSERT_BEFORE",
        payload: {
          parentId: parentInstance.id,
          childId: child.id,
          beforeId: beforeChild.id,
        },
      });
    } else {
      this.appendChild(parentInstance, child);
    }
  },

  insertInContainerBefore(container, child, beforeChild) {
    this.insertBefore(container, child, beforeChild);
  },

  removeChild(parentInstance, child) {
    parentInstance.children = parentInstance.children.filter(
      (c) => c.id !== child.id
    );
    commitBuffer.push({
      type: "REMOVE_CHILD",
      payload: { parentId: parentInstance.id, childId: child.id },
    });
  },

  removeChildFromContainer(container, child) {
    container.children = container.children.filter((c) => c.id !== child.id);
    commitBuffer.push({
      type: "REMOVE_CHILD",
      payload: { parentId: container.id, childId: child.id },
    });
  },

  commitUpdate(stateNode, updatePayload, type, oldProps, newProps) {
    stateNode.props = serializeProps(newProps);
    commitBuffer.push({
      type: "UPDATE_PROPS",
      payload: { id: stateNode.id, props: serializeProps(stateNode.props) },
    });
  },

  prepareForCommit: () => null,
  resetAfterCommit: (container) => {
    if (commitBuffer.length > 0) {
      writeOutput({
        type: "BATCH_UPDATE",
        payload: commitBuffer,
      });
      commitBuffer = [];
    }
  },

  finalizeInitialChildren: () => false,
  prepareUpdate: () => true,
  shouldSetTextContent: () => false,
  clearContainer: (container) => {
    container.children = [];
    commitBuffer.push({
      type: "CLEAR_CONTAINER",
      payload: { containerId: container.id },
    });
  },
  detachDeletedInstance: () => {},

  now: Date.now,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  getCurrentUpdatePriority: () => 1,
  setCurrentUpdatePriority: () => {},
  resolveUpdatePriority: () => 1,
  maySuspendCommit: () => false,

  supportsMutation: true,
  isPrimaryRenderer: true,
  supportsPersistence: false,
  supportsHydration: false,
};

const reconciler = Reconciler(hostConfig);

const createPluginRequire = () => (moduleName) => {
  if (moduleName === "react") {
    return React;
  }

  if (moduleName.startsWith("@raycast/api")) {
    writeLog(`Plugin requested @raycast/api`);

    const storage = new Map();
    const LocalStorage = {
      getItem: async (key) => storage.get(key),
      setItem: async (key, value) => storage.set(key, value),
      removeItem: async (key) => storage.delete(key),
      clear: async () => storage.clear(),
    };

    const ListComponent = ({ children, ...rest }) =>
      jsx("List", { ...rest, children });
    const ListSectionComponent = ({ children, ...rest }) =>
      jsx("ListSection", { ...rest, children });
    const ListDropdownComponent = ({ children, ...rest }) =>
      jsx("ListDropdown", { ...rest, children });
    const ActionPanelComponent = ({ children, ...rest }) =>
      jsx("ActionPanel", { ...rest, children });
    const ActionPanelSectionComponent = ({ children, ...rest }) =>
      jsx("ActionPanelSection", { ...rest, children });

    ListComponent.Item = "ListItem";
    ListComponent.Section = ListSectionComponent;
    ListComponent.Dropdown = ListDropdownComponent;
    ListDropdownComponent.Item = "ListDropdownItem";
    ActionPanelComponent.Section = ActionPanelSectionComponent;

    return {
      LocalStorage,
      environment: {
        assetsPath: "/home/byte/code/raycast-linux/sidecar/dist/assets/",
      },
      getPreferenceValues: () => ({
        primaryAction: "paste",
        unicodeVersion: "14.0",
        shortCodes: true,
      }),
      usePersistentState: (key, initialValue) => {
        const [state, setState] = React.useState(initialValue);
        const isLoading = false;
        return [state, setState, isLoading];
      },
      List: ListComponent,
      ActionPanel: ActionPanelComponent,
      Action: {
        Paste: "Action.Paste",
        CopyToClipboard: "Action.CopyToClipboard",
        OpenInBrowser: "Action.OpenInBrowser",
      },
    };
  }

  return require(moduleName);
};

const root = { id: "root", children: [] };

const onUncaughtError = (error, errorInfo) => {
  writeLog(`--- REACT UNCAUGHT ERROR ---`);
  writeLog(`Error: ${error.message}`);
  if (errorInfo && errorInfo.componentStack) {
    writeLog(
      `Stack: ${errorInfo.componentStack.trim().replace(/\n/g, "\n  ")}`
    );
  }
};

const onCaughtError = (error, errorInfo) => {
  writeLog(`--- REACT CAUGHT ERROR ---`);
  writeLog(`Error: ${error.message}`);
  if (errorInfo && errorInfo.componentStack) {
    writeLog(
      `Stack: ${errorInfo.componentStack.trim().replace(/\n/g, "\n  ")}`
    );
  }
};

const onRecoverableError = (error, errorInfo) => {
  writeLog(`--- REACT RECOVERABLE ERROR ---`);
  writeLog(`Error: ${error.message}`);
  if (errorInfo && errorInfo.componentStack) {
    writeLog(
      `Stack: ${errorInfo.componentStack.trim().replace(/\n/g, "\n  ")}`
    );
  }
};

const container = reconciler.createContainer(
  root,
  0,
  null,
  false,
  null,
  "",
  onUncaughtError,
  onCaughtError,
  onRecoverableError
);

function runPlugin() {
  const scriptText = plugin;
  const pluginModule = { exports: {} } as {
    exports: {
      default: null;
    };
  };
  const scriptFunction = new Function(
    "require",
    "module",
    "exports",
    "React",
    scriptText
  );

  scriptFunction(
    createPluginRequire(),
    pluginModule,
    pluginModule.exports,
    React
  );

  const PluginRootComponent = pluginModule.exports.default;

  if (PluginRootComponent) {
    writeLog("Plugin loaded. Initializing React render...");
    const AppElement = React.createElement(PluginRootComponent);
    reconciler.updateContainer(AppElement, container, null, () => {
      writeLog("Initial render complete.");
    });
  } else {
    throw new Error("Plugin did not export a default component.");
  }
}

const rl = createInterface({ input: process.stdin });
writeLog("Node.js Sidecar started successfully with React Reconciler.");

rl.on("line", (line) => {
  try {
    const command = JSON.parse(line);
    if (command.action === "run-plugin") {
      runPlugin();
    } else if (command.action === "dispatch-event") {
      const { instanceId, handlerName, args } = command.payload;
      writeLog(
        `Event received: instance ${instanceId}, handler ${handlerName}`
      );

      const stateNode = instances.get(instanceId);
      if (!stateNode) {
        writeLog(`Instance ${instanceId} not found.`);
        return;
      }

      const props = stateNode._internalFiber.memoizedProps;

      if (props && typeof props[handlerName] === "function") {
        props[handlerName](...args);
      } else {
        writeLog(`Handler ${handlerName} not found on instance ${instanceId}`);
      }
    }
  } catch (err) {
    writeLog(`ERROR: ${err.message} \n ${err.stack}`);
    writeOutput({ type: "error", payload: err.message });
  }
});
