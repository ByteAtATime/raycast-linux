import type { AnyInstance, Container } from './types';
import type { Command } from '@raycast-linux/protocol';
import type React from 'react';

export const instances = new Map<number, AnyInstance>();
export const root: Container = { id: 'root', children: [] };

let instanceCounter = 0;
export const getNextInstanceId = (): number => ++instanceCounter;

export let commitBuffer: Command[] = [];

export const clearCommitBuffer = (): void => {
	commitBuffer = [];
};

export const addToCommitBuffer = (commit: Command): void => {
	commitBuffer.push(commit);
};

export const navigationStack: React.ReactElement[] = [];
export let currentRootElement: React.ReactElement | null = null;

export const setCurrentRootElement = (element: React.ReactElement) => {
	currentRootElement = element;
};
