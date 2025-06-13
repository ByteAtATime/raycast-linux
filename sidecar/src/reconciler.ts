import Reconciler from 'react-reconciler';
import type React from 'react';
import { root } from './state';
import { hostConfig } from './hostConfig';
import { writeLog } from './io';

const reconciler = Reconciler(hostConfig);

const onRecoverableError = (error: Error) => {
	writeLog(`--- REACT RECOVERABLE ERROR ---`);
	writeLog(`Error: ${error.message}`);
	writeLog(`Stack: ${error.stack}`);
};

export const container = reconciler.createContainer(
	root,
	0, // LegacyRoot
	null,
	false,
	null,

	'',
	onRecoverableError,
	null
);

export const updateContainer = (element: React.ReactElement, callback?: () => void) => {
	reconciler.updateContainer(element, container, null, callback);
};

export const batchedUpdates = (callback: () => void) => {
	reconciler.batchedUpdates(callback, null);
};
