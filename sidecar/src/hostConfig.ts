import type { HostConfig } from "react-reconciler";
import type {
  ComponentType,
  ComponentProps,
  Container,
  RaycastInstance,
  TextInstance,
  UpdatePayload,
  ParentInstance,
  AnyInstance,
} from "./types";
import {
  instances,
  getNextInstanceId,
  commitBuffer,
  addToCommitBuffer,
  clearCommitBuffer,
} from "./state";
import { writeOutput } from "./io";
import { serializeProps, optimizeCommitBuffer } from "./utils";
import React from "react";

const appendChildToParent = (parent: ParentInstance, child: AnyInstance) => {
  const existingIndex = parent.children.findIndex(({ id }) => id === child.id);
  if (existingIndex > -1) {
    parent.children.splice(existingIndex, 1);
  }
  parent.children.push(child);
  addToCommitBuffer({
    type: "APPEND_CHILD",
    payload: { parentId: parent.id, childId: child.id },
  });
};

const insertChildBefore = (
  parent: ParentInstance,
  child: AnyInstance,
  beforeChild: AnyInstance
) => {
  const existingIndex = parent.children.findIndex(({ id }) => id === child.id);
  if (existingIndex > -1) {
    parent.children.splice(existingIndex, 1);
  }

  const beforeIndex = parent.children.findIndex(
    ({ id }) => id === beforeChild.id
  );
  if (beforeIndex !== -1) {
    parent.children.splice(beforeIndex, 0, child);
    addToCommitBuffer({
      type: "INSERT_BEFORE",
      payload: {
        parentId: parent.id,
        childId: child.id,
        beforeId: beforeChild.id,
      },
    });
  } else {
    appendChildToParent(parent, child);
  }
};

const removeChildFromParent = (parent: ParentInstance, child: AnyInstance) => {
  parent.children = parent.children.filter(({ id }) => id !== child.id);
  addToCommitBuffer({
    type: "REMOVE_CHILD",
    payload: { parentId: parent.id, childId: child.id },
  });
};

export const hostConfig: HostConfig<
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
  unknown,
  Record<string, unknown>,
  NodeJS.Timeout,
  number
> = {
  getPublicInstance(instance) {
    return instance;
  },
  getRootHostContext() {
    return {};
  },
  getChildHostContext() {
    return {};
  },

  prepareForCommit: () => null,
  resetAfterCommit: () => {
    if (commitBuffer.length > 0) {
      const optimizedPayload = optimizeCommitBuffer(commitBuffer);
      writeOutput({
        type: "BATCH_UPDATE",
        payload: optimizedPayload,
      });
      clearCommitBuffer();
    }
  },

  createInstance(type, props, root, hostContext, internalInstanceHandle) {
    const componentType =
      typeof type === "string"
        ? type
        : type.displayName || type.name || "Anonymous";
    const id = getNextInstanceId();
    const instance: RaycastInstance = {
      id,
      type: componentType,
      children: [],
      props: serializeProps(props),
      _internalFiber: internalInstanceHandle,
    };
    (internalInstanceHandle as any).stateNode = instance;
    instances.set(id, instance);

    addToCommitBuffer({
      type: "CREATE_INSTANCE",
      payload: { id, type: componentType, props: instance.props },
    });
    return instance;
  },

  createTextInstance(text) {
    const id = getNextInstanceId();
    const instance: TextInstance = { id, type: "TEXT", text };
    instances.set(id, instance);
    addToCommitBuffer({ type: "CREATE_TEXT_INSTANCE", payload: instance });
    return instance;
  },

  appendInitialChild: appendChildToParent,
  appendChild: appendChildToParent,
  appendChildToContainer: appendChildToParent,
  insertBefore: insertChildBefore,
  insertInContainerBefore: insertChildBefore,
  removeChild: removeChildFromParent,
  removeChildFromContainer: removeChildFromParent,

  commitUpdate(instance, type, oldProps, newProps, internalHandle) {
    instance.props = serializeProps(newProps);
    addToCommitBuffer({
      type: "UPDATE_PROPS",
      payload: { id: instance.id, props: instance.props },
    });
  },

  commitTextUpdate(textInstance, oldText, newText) {
    textInstance.text = newText;
    addToCommitBuffer({
      type: "UPDATE_TEXT",
      payload: { id: textInstance.id, text: newText },
    });
  },

  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,

  clearContainer: (container) => {
    container.children = [];
    addToCommitBuffer({
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
  hideInstance() {},
  hideTextInstance() {},
  unhideInstance() {},
  unhideTextInstance() {},
  resetTextContent() {},
  preparePortalMount() {},
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

  resetFormInstance: function (): void {
    throw new Error("Function not implemented.");
  },
  requestPostPaintCallback: function (): void {
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
  preloadInstance: function (): boolean {
    throw new Error("Function not implemented.");
  },
  startSuspendingCommit: function (): void {
    throw new Error("Function not implemented.");
  },
  suspendInstance: function (): void {
    throw new Error("Function not implemented.");
  },
  waitForCommitToBeReady: function () {
    throw new Error("Function not implemented.");
  },
};
