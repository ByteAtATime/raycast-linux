import type React from 'react';
import type Reconciler from 'react-reconciler';

export type ComponentType = string | React.ComponentType<any>;
export type ComponentProps = Record<string, unknown>;

export interface BaseInstance {
	id: number;
	_internalFiber?: Reconciler.Fiber;
}

export interface RaycastInstance extends BaseInstance {
	type: ComponentType;
	props: ComponentProps;
	children: (RaycastInstance | TextInstance)[];
}

export interface TextInstance extends BaseInstance {
	type: 'TEXT';
	text: string;
}

export interface Container {
	id: 'root';
	children: (RaycastInstance | TextInstance)[];
}

export type AnyInstance = RaycastInstance | TextInstance;
export type ParentInstance = RaycastInstance | Container;
export type UpdatePayload = Record<string, unknown>;

export interface Commit {
	type: string;
	payload: unknown;
}

export interface SerializedReactElement {
	$$typeof: 'react.element.serialized';
	type: string;
	props: Record<string, unknown>;
}
