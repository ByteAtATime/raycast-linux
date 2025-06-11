import type { AnyInstance, Commit, Container } from './types';

export const instances = new Map<number, AnyInstance>();
export const root: Container = { id: 'root', children: [] };

let instanceCounter = 0;
export const getNextInstanceId = (): number => ++instanceCounter;

export let commitBuffer: Commit[] = [];

export const clearCommitBuffer = (): void => {
	commitBuffer = [];
};

export const addToCommitBuffer = (commit: Commit): void => {
	commitBuffer.push(commit);
};
