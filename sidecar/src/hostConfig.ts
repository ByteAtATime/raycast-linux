import type { Fiber, HostConfig } from 'react-reconciler';
import type {
	ComponentType,
	ComponentProps,
	Container,
	RaycastInstance,
	TextInstance,
	UpdatePayload,
	ParentInstance,
	AnyInstance
} from './types';
import {
	instances,
	getNextInstanceId,
	commitBuffer,
	addToCommitBuffer,
	clearCommitBuffer
} from './state';
import { writeOutput } from './io';
import { serializeProps, optimizeCommitBuffer, getComponentDisplayName } from './utils';
import React from 'react';

const appendChildToParent = (parent: ParentInstance, child: AnyInstance) => {
	const existingIndex = parent.children.findIndex(({ id }) => id === child.id);
	if (existingIndex > -1) {
		parent.children.splice(existingIndex, 1);
	}
	parent.children.push(child);
	addToCommitBuffer({
		type: 'APPEND_CHILD',
		payload: { parentId: parent.id, childId: child.id }
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

	const beforeIndex = parent.children.findIndex(({ id }) => id === beforeChild.id);
	if (beforeIndex !== -1) {
		parent.children.splice(beforeIndex, 0, child);
		addToCommitBuffer({
			type: 'INSERT_BEFORE',
			payload: {
				parentId: parent.id,
				childId: child.id,
				beforeId: beforeChild.id
			}
		});
	} else {
		appendChildToParent(parent, child);
	}
};

const removeChildFromParent = (parent: ParentInstance, child: AnyInstance) => {
	parent.children = parent.children.filter(({ id }) => id !== child.id);
	addToCommitBuffer({
		type: 'REMOVE_CHILD',
		payload: { parentId: parent.id, childId: child.id }
	});
};

function createInstanceFromElement(
	element: React.ReactElement
): RaycastInstance | RaycastInstance[] {
	if (element.type === React.Fragment) {
		const childElements = React.Children.toArray(element.props.children);
		return childElements
			.filter(React.isValidElement)
			.flatMap((child) => createInstanceFromElement(child as React.ReactElement));
	}

	const componentType = getComponentDisplayName(element.type as ComponentType);
	const id = getNextInstanceId();

	const childElements = React.Children.toArray(
		'children' in element.props ? element.props.children : []
	);
	const childInstances = childElements
		.filter(React.isValidElement)
		.flatMap((child) => createInstanceFromElement(child as React.ReactElement));

	const { propsToSerialize, namedChildren } = processProps(
		element.props as Record<string, unknown>
	);

	const instance: RaycastInstance = {
		id,
		type: componentType,
		children: childInstances,
		props: serializeProps(propsToSerialize),
		_internalFiber: (element as unknown as { _owner?: Fiber })._owner,
		namedChildren
	};

	instances.set(id, instance);

	addToCommitBuffer({
		type: 'CREATE_INSTANCE',
		payload: {
			id,
			type: componentType,
			props: instance.props,
			children: childInstances.map((c) => c.id),
			namedChildren: instance.namedChildren
		}
	});

	return instance;
}

function processProps(props: Record<string, any>) {
	const propsToSerialize: Record<string, unknown> = {};
	const namedChildren: { [key: string]: number } = {};

	for (const [key, value] of Object.entries(props)) {
		if (key === 'children') continue;

		if (React.isValidElement(value)) {
			const result = createInstanceFromElement(value);

			if (Array.isArray(result)) {
				if (result.length > 0) {
					throw new Error(`The prop '${key}' cannot be a React.Fragment.`);
				}
			} else {
				namedChildren[key] = result.id;
			}
		} else {
			propsToSerialize[key] = value;
		}
	}
	return { propsToSerialize, namedChildren };
}

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
				type: 'BATCH_UPDATE',
				payload: optimizedPayload
			});
			clearCommitBuffer();
		}
	},

	createInstance(type, props, root, hostContext, internalInstanceHandle) {
		const componentType =
			typeof type === 'string' ? type : type.displayName || type.name || 'Anonymous';
		const id = getNextInstanceId();

		const { propsToSerialize, namedChildren } = processProps(props);

		const instance: RaycastInstance = {
			id,
			type: componentType,
			children: [],
			props: serializeProps(propsToSerialize),
			_internalFiber: internalInstanceHandle,
			namedChildren
		};

		internalInstanceHandle.stateNode = instance;
		instances.set(id, instance);

		addToCommitBuffer({
			type: 'CREATE_INSTANCE',
			payload: {
				id,
				type: componentType,
				props: instance.props,
				namedChildren: instance.namedChildren
			}
		});
		return instance;
	},

	createTextInstance(text) {
		const id = getNextInstanceId();
		const instance: TextInstance = { id, type: 'TEXT', text };
		instances.set(id, instance);
		addToCommitBuffer({ type: 'CREATE_TEXT_INSTANCE', payload: instance });
		return instance;
	},

	appendInitialChild: appendChildToParent,
	appendChild: appendChildToParent,
	appendChildToContainer: appendChildToParent,
	insertBefore: insertChildBefore,
	insertInContainerBefore: insertChildBefore,
	removeChild: removeChildFromParent,
	removeChildFromContainer: removeChildFromParent,

	commitUpdate(instance, type, oldProps, newProps) {
		const { propsToSerialize, namedChildren } = processProps(newProps);

		instance.props = serializeProps(propsToSerialize);
		instance.namedChildren = namedChildren;

		addToCommitBuffer({
			type: 'UPDATE_PROPS',
			payload: { id: instance.id, props: instance.props, namedChildren: instance.namedChildren }
		});
	},

	commitTextUpdate(textInstance, oldText, newText) {
		textInstance.text = newText;
		addToCommitBuffer({
			type: 'UPDATE_TEXT',
			payload: { id: textInstance.id, text: newText }
		});
	},

	finalizeInitialChildren: () => false,
	shouldSetTextContent: () => false,

	clearContainer: (container) => {
		container.children = [];
		addToCommitBuffer({
			type: 'CLEAR_CONTAINER',
			payload: { containerId: container.id }
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
		throw new Error('Function not implemented.');
	},
	requestPostPaintCallback: function (): void {
		throw new Error('Function not implemented.');
	},
	shouldAttemptEagerTransition: function (): boolean {
		throw new Error('Function not implemented.');
	},
	trackSchedulerEvent: function (): void {
		throw new Error('Function not implemented.');
	},
	resolveEventType: function (): null | string {
		throw new Error('Function not implemented.');
	},
	resolveEventTimeStamp: function (): number {
		throw new Error('Function not implemented.');
	},
	preloadInstance: function (): boolean {
		throw new Error('Function not implemented.');
	},
	startSuspendingCommit: function (): void {
		throw new Error('Function not implemented.');
	},
	suspendInstance: function (): void {
		throw new Error('Function not implemented.');
	},
	waitForCommitToBeReady: function () {
		throw new Error('Function not implemented.');
	}
};
