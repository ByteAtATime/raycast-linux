import React from 'react';
import { jsx } from 'react/jsx-runtime';
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
	const scriptFunction = new Function('require', 'module', 'exports', 'React', scriptText);

	scriptFunction(createPluginRequire(), pluginModule, pluginModule.exports, React);

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
