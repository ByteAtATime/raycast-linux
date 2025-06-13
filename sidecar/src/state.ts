import type { AnyInstance, Container } from './types';
import type { Command } from '@raycast-linux/protocol';

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
