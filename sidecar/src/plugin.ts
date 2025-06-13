import React from 'react';
import plugin from '../dist/plugin/pokemon.txt';
import { updateContainer } from './reconciler';
import { writeLog } from './io';
import { getRaycastApi } from './api';

const createPluginRequire =
	() =>
	(moduleName: string): unknown => {
		if (moduleName === 'react') {
			return React;
		}

		if (moduleName.startsWith('@raycast/api')) {
			return getRaycastApi();
		}

		return require(moduleName);
	};

export const runPlugin = (): void => {
	const scriptText = plugin;
	const pluginModule = {
		exports: {} as { default: React.ComponentType | null }
	};
	const scriptFunction = new Function(
		'require',
		'module',
		'exports',
		'React',
		'console',
		scriptText
	);

	const mockConsole = {
		log: (...args: unknown[]) => {
			writeLog('[plugin] log: ' + args.map((arg) => JSON.stringify(arg)).join(' '));
		},
		warn: (...args: unknown[]) => {
			writeLog('[plugin] warn: ' + args.map((arg) => JSON.stringify(arg)).join(' '));
		},
		error: (...args: unknown[]) => {
			writeLog('[plugin] error: ' + args.map((arg) => JSON.stringify(arg)).join(' '));
		}
	};

	scriptFunction(createPluginRequire(), pluginModule, pluginModule.exports, React, mockConsole);

	const PluginRootComponent = pluginModule.exports.default;

	if (!PluginRootComponent) {
		throw new Error('Plugin did not export a default component.');
	}

	writeLog('Plugin loaded. Initializing React render...');
	const AppElement = React.createElement(PluginRootComponent);
	updateContainer(AppElement, () => {
		writeLog('Initial render complete');
	});
};
