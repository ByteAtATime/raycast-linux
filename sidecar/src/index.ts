import { createInterface } from 'readline';
import { writeLog, writeOutput } from './io';
import { runPlugin } from './plugin';
import { currentRootElement, instances, navigationStack } from './state';
import { batchedUpdates, updateContainer } from './reconciler';
import type { RaycastInstance } from './types';
import React from 'react';

process.on('unhandledRejection', (reason: unknown) => {
	writeLog(`--- UNHANDLED PROMISE REJECTION ---`);
	const stack = reason && typeof reason === 'object' && 'stack' in reason ? reason.stack : reason;
	writeLog(stack);
});

const rl = createInterface({ input: process.stdin });

rl.on('line', (line) => {
	batchedUpdates(() => {
		try {
			const command: { action: string; payload: unknown } = JSON.parse(line);

			switch (command.action) {
				case 'run-plugin':
					runPlugin();
					break;
				case 'pop-view': {
					const previousElement = navigationStack.pop();
					if (previousElement) {
						updateContainer(previousElement);
					}
					break;
				}
				case 'dispatch-event': {
					const { instanceId, handlerName, args } = command.payload as {
						instanceId: number;
						handlerName: string;
						args: unknown[];
					};

					const instance = instances.get(instanceId);
					if (!instance) {
						writeLog(`Instance ${instanceId} not found.`);
						return;
					}

					if (!('props' in instance)) {
						return;
					}

					const raycastInstance = instance as RaycastInstance;

					// TODO: is there any way we can move this logic into the component itself?
					if (raycastInstance.type === 'Action.Push' && handlerName === 'onAction') {
						const props = raycastInstance._unserializedProps;
						const target = props?.target;
						const onPush = props?.onPush;

						if (React.isValidElement(target)) {
							if (currentRootElement) {
								navigationStack.push(currentRootElement);
							}
							updateContainer(target);
							if (onPush && typeof onPush === 'function') {
								onPush();
							}
						} else {
							writeLog(`Action.Push (id: ${instanceId}) was triggered without a valid target.`);
						}
						return;
					}

					const props = raycastInstance._unserializedProps;
					const handler = props?.[handlerName];

					if (typeof handler === 'function') {
						handler(...args);
					} else {
						writeLog(
							`Handler ${handlerName} not found or not a function on instance ${instanceId}`
						);
					}
					break;
				}
				default:
					writeLog(`Unknown command action: ${command.action}`);
			}
		} catch (err: unknown) {
			const error =
				err instanceof Error
					? { message: err.message, stack: err.stack }
					: { message: String(err) };
			writeLog(`ERROR: ${error.message} \n ${error.stack ?? ''}`);
			writeOutput({ type: 'error', payload: error.message });
		}
	});
});

writeLog('Node.js Sidecar started successfully with React Reconciler.');
