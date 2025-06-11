import { createInterface } from "readline";
import React from "react";
import Reconciler, { type HostConfig } from "react-reconciler";
import { jsx } from "react/jsx-runtime";
import plugin from "../dist/plugin/emoji.txt";
import { Packr } from "msgpackr";

type ComponentType = string | React.ComponentType<any>;
type ComponentProps = Record<string, unknown>;

interface BaseInstance {
  id: number;
  _internalFiber?: Reconciler.Fiber;
}

interface RaycastInstance extends BaseInstance {
  type: ComponentType;
  props: ComponentProps;
  children: (RaycastInstance | TextInstance)[];
}

interface TextInstance extends BaseInstance {
  type: "TEXT";
  text: string;
}

interface Container {
  id: "root";
  children: (RaycastInstance | TextInstance)[];
}

type UpdatePayload = Record<string, unknown>;

let commitBuffer: { type: string; payload: any }[] = [];

const packr = new Packr();

function writeOutput(data: object) {
  try {
    const payload = packr.pack(data);
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length);

    process.stdout.write(header);
    process.stdout.write(payload);
  } catch (e) {
    writeOutput({ type: "log", payload: (e as Error).toString() });
  }
}

function writeLog(message: unknown) {
  writeOutput({ type: "log", payload: message });
}

process.on("unhandledRejection", (reason) => {
  writeLog(`--- UNHANDLED PROMISE REJECTION ---`);
  writeLog(
    reason && typeof reason === "object" && "stack" in reason
      ? reason.stack
      : reason
  );
});

let instanceCounter = 0;
const instances: Map<number, RaycastInstance | TextInstance> = new Map();

function getComponentDisplayName(type: ComponentType): string {
  if (typeof type === "string") {
    return type;
  }
  return type.displayName || type.name || "Anonymous";
}

function serializeProps(props: Record<string, unknown>) {
  const serializable: Record<string, unknown> = {};
  for (const key in props) {
    if (key === "children" || typeof props[key] === "function") continue;

    const propValue = props[key];

    if (React.isValidElement(propValue)) {
      serializable[key] = {
        $$typeof: "react.element.serialized",
        type: getComponentDisplayName(propValue.type as ComponentType),
        props: serializeProps(propValue.props as Record<string, unknown>),
      };
      continue;
    }

    if (Array.isArray(propValue)) {
      serializable[key] = propValue.map((item) =>
        React.isValidElement(item)
          ? {
              $$typeof: "react.element.serialized",
              type: getComponentDisplayName(item.type as ComponentType),
              props: serializeProps(item.props as Record<string, unknown>),
            }
          : item
      );
      continue;
    }

    serializable[key] = propValue;
  }
  return serializable;
}

function optimizeCommitBuffer(
  buffer: { type: string; payload: any }[]
): { type: string; payload: any }[] {
  writeLog(
    `[Optimizer] Starting optimization for a buffer of ${buffer.length} commands.`
  );

  const OPTIMIZATION_THRESHOLD = 10;
  const childOpsByParent = new Map<number | "root", any[]>();
  const otherOps: any[] = [];

  for (const op of buffer) {
    const { type, payload } = op;
    if (
      (type === "APPEND_CHILD" ||
        type === "REMOVE_CHILD" ||
        type === "INSERT_BEFORE") &&
      payload.parentId
    ) {
      if (!childOpsByParent.has(payload.parentId)) {
        childOpsByParent.set(payload.parentId, []);
      }
      childOpsByParent.get(payload.parentId)!.push(op);
    } else {
      otherOps.push(op);
    }
  }

  if (childOpsByParent.size === 0) {
    writeLog(`[Optimizer] No child operations found to optimize.`);
    return buffer;
  }

  writeLog(
    `[Optimizer] Found child ops for ${childOpsByParent.size} parent(s).`
  );
  const finalOps = [...otherOps];

  for (const [parentId, ops] of childOpsByParent.entries()) {
    let wasOptimized = false;
    writeLog(
      `[Optimizer] Parent ${parentId} has ${ops.length} child operations.`
    );

    if (ops.length > OPTIMIZATION_THRESHOLD) {
      const parentInstance =
        parentId === "root" ? root : instances.get(parentId as number);

      if (parentInstance && "children" in parentInstance) {
        const childrenIds = parentInstance.children.map((child) => child.id);
        finalOps.push({
          type: "REPLACE_CHILDREN",
          payload: { parentId, childrenIds },
        });
        wasOptimized = true;
        writeLog(
          `[Optimizer] SUCCESS: Optimized ${ops.length} ops for parent ${parentId} into a single REPLACE_CHILDREN command.`
        );
      } else {
        writeLog(
          `[Optimizer] FAILED: Could not find a valid container instance for parent ${parentId}.`
        );
      }
    }

    if (!wasOptimized) {
      finalOps.push(...ops);
    }
  }

  writeLog(`[Optimizer] Finished. Final buffer size: ${finalOps.length}.`);
  return finalOps;
}

const hostConfig: HostConfig<
  ComponentType,
  ComponentProps,
  Container,
  RaycastInstance,
  TextInstance,
  never,
  never,
  RaycastInstance,
  object,
  UpdatePayload,
  never,
  Record<string, any>,
  NodeJS.Timeout,
  number
> = {
  getPublicInstance(instance) {
    return instance;
  },
  getRootHostContext(rootContainerInstance) {
    return {};
  },
  getChildHostContext(parentHostContext, type, rootContainerInstance) {
    return {};
  },

  prepareForCommit: () => null,
  resetAfterCommit: (container) => {
    if (commitBuffer.length > 0) {
      const optimizedPayload = optimizeCommitBuffer(commitBuffer);

      writeOutput({
        type: "BATCH_UPDATE",
        payload: optimizedPayload,
      });
      commitBuffer = [];
    }
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
    const stateNode: RaycastInstance = {
      id,
      type: componentType,
      children: [],
      props: serializeProps(props),
      _internalFiber: internalInstanceHandle,
    };
    (internalInstanceHandle as any).stateNode = stateNode;
    instances.set(id, stateNode);

    commitBuffer.push({
      type: "CREATE_INSTANCE",
      payload: { id, type: componentType, props: stateNode.props },
    });
    return stateNode;
  },

  createTextInstance(text, rootContainer, hostContext, internalInstanceHandle) {
    const id = ++instanceCounter;
    const instance: TextInstance = { id, type: "TEXT", text };
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
    const existingIndex = parentInstance.children.findIndex(
      (c) => c.id === child.id
    );
    if (existingIndex > -1) {
      parentInstance.children.splice(existingIndex, 1);
    }

    parentInstance.children.push(child);

    commitBuffer.push({
      type: "APPEND_CHILD",
      payload: { parentId: parentInstance.id, childId: child.id },
    });
  },

  appendChildToContainer(container, child) {
    const existingIndex = container.children.findIndex(
      (c) => c.id === child.id
    );
    if (existingIndex > -1) {
      container.children.splice(existingIndex, 1);
    }
    container.children.push(child);

    commitBuffer.push({
      type: "APPEND_CHILD",
      payload: { parentId: container.id, childId: child.id },
    });
  },

  insertBefore(parentInstance, child, beforeChild) {
    const existingIndex = parentInstance.children.findIndex(
      (c) => c.id === child.id
    );
    if (existingIndex > -1) {
      parentInstance.children.splice(existingIndex, 1);
    }

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
      this.appendChild!(parentInstance, child);
    }
  },

  insertInContainerBefore(container, child, beforeChild) {
    const existingIndex = container.children.findIndex(
      (c) => c.id === child.id
    );
    if (existingIndex > -1) {
      container.children.splice(existingIndex, 1);
    }

    const index = container.children.findIndex((c) => c.id === beforeChild.id);
    if (index !== -1) {
      container.children.splice(index, 0, child);
      commitBuffer.push({
        type: "INSERT_BEFORE",
        payload: {
          parentId: container.id,
          childId: child.id,
          beforeId: beforeChild.id,
        },
      });
    } else {
      this.appendChildToContainer!(container, child);
    }
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

  commitUpdate(instance, type, oldProps, newProps, internalHandle) {
    instance.props = serializeProps(newProps);

    commitBuffer.push({
      type: "UPDATE_PROPS",
      payload: { id: instance.id, props: instance.props },
    });
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.text = newText;
    commitBuffer.push({
      type: "UPDATE_TEXT",
      payload: { id: textInstance.id, text: newText },
    });
  },

  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,

  clearContainer: (container) => {
    container.children = [];
    commitBuffer.push({
      type: "CLEAR_CONTAINER",
      payload: { containerId: container.id },
    });
  },

  scheduleTimeout: setTimeout,
  cancelTimeout: (id) => clearTimeout(id as NodeJS.Timeout),
  noTimeout: -1 as unknown as NodeJS.Timeout,

  isPrimaryRenderer: true,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,

  detachDeletedInstance() {},
  commitMount() {},
  hideInstance(instance) {},
  hideTextInstance(textInstance) {},
  unhideInstance(instance, props) {},
  unhideTextInstance(textInstance, text) {},
  resetTextContent(instance) {},
  preparePortalMount(container) {},
  getCurrentUpdatePriority: () => 1,
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur: () => {},
  afterActiveInstanceBlur: () => {},
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,
  setCurrentUpdatePriority() {},
  resolveUpdatePriority: () => 1,
  maySuspendCommit: () => false,
  NotPendingTransition: null,
  HostTransitionContext: React.createContext(0),
  resetFormInstance: function (form: RaycastInstance): void {
    throw new Error("Function not implemented.");
  },
  requestPostPaintCallback: function (callback: (time: number) => void): void {
    throw new Error("Function not implemented.");
  },
  shouldAttemptEagerTransition: function (): boolean {
    throw new Error("Function not implemented.");
  },
  trackSchedulerEvent: function (): void {
    throw new Error("Function not implemented.");
  },
  resolveEventType: function (): null | string {
    throw new Error("Function not implemented.");
  },
  resolveEventTimeStamp: function (): number {
    throw new Error("Function not implemented.");
  },
  preloadInstance: function (
    type: ComponentType,
    props: ComponentProps
  ): boolean {
    throw new Error("Function not implemented.");
  },
  startSuspendingCommit: function (): void {
    throw new Error("Function not implemented.");
  },
  suspendInstance: function (type: ComponentType, props: ComponentProps): void {
    throw new Error("Function not implemented.");
  },
  waitForCommitToBeReady: function ():
    | ((
        initiateCommit: (...args: unknown[]) => unknown
      ) => (...args: unknown[]) => unknown)
    | null {
    throw new Error("Function not implemented.");
  },
};

const reconciler = Reconciler(hostConfig);

const createPluginRequire = () => (moduleName: string) => {
  if (moduleName === "react") {
    return React;
  }

  if (moduleName.startsWith("@raycast/api")) {
    const storage = new Map();
    const LocalStorage = {
      getItem: async (key: string) => storage.get(key),
      setItem: async (key: string, value: string) => storage.set(key, value),
      removeItem: async (key: string) => storage.delete(key),
      clear: async () => storage.clear(),
    };

    const ListComponent = ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
    }) => jsx("List", { ...rest, children });
    const ListSectionComponent = ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
    }) => jsx("ListSection", { ...rest, children });
    const ListDropdownComponent = ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
    }) => jsx("ListDropdown", { ...rest, children });
    const ActionPanelComponent = ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
    }) => jsx("ActionPanel", { ...rest, children });
    const ActionPanelSectionComponent = ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
    }) => jsx("ActionPanelSection", { ...rest, children });

    ListComponent.Item = "ListItem";
    ListComponent.Section = ListSectionComponent;
    ListComponent.Dropdown = ListDropdownComponent;
    ListDropdownComponent.Item = "ListDropdownItem";
    ActionPanelComponent.Section = ActionPanelSectionComponent;

    return {
      LocalStorage,
      environment: {
        assetsPath: "/home/byte/code/raycast-linux/sidecar/dist/plugin/assets/",
      },
      getPreferenceValues: () => ({
        primaryAction: "paste",
        unicodeVersion: "14.0",
        shortCodes: true,
      }),
      usePersistentState: (key: string, initialValue: unknown) => {
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

const root = { id: "root", children: [] } satisfies Container;

const onRecoverableError = (error: Error) => {
  writeLog(`--- REACT RECOVERABLE ERROR ---`);
  writeLog(`Error: ${error.message}`);
};

const container = reconciler.createContainer(
  root,
  0,
  null,
  false,
  null,
  "",
  onRecoverableError,
  null
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
  reconciler.batchedUpdates(() => {
    try {
      const command = JSON.parse(line);
      if (command.action === "run-plugin") {
        runPlugin();
      } else if (command.action === "dispatch-event") {
        const { instanceId, handlerName, args } = command.payload;

        const stateNode = instances.get(instanceId);
        if (!stateNode) {
          writeLog(`Instance ${instanceId} not found.`);
          return;
        }

        const props = stateNode._internalFiber?.memoizedProps;

        if (props && typeof props[handlerName] === "function") {
          props[handlerName](...args);
        } else {
          writeLog(
            `Handler ${handlerName} not found on instance ${instanceId}`
          );
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        writeLog(`ERROR: ${err.message} \n ${err.stack}`);
        writeOutput({ type: "error", payload: err.message });
      } else {
        writeLog(`ERROR: ${err}`);
        writeOutput({ type: "error", payload: err });
      }
    }
  }, null);
});
