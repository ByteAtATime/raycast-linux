import React from 'react';
import { jsx } from 'react/jsx-runtime';
import plugin from '../dist/plugin/emoji.txt';
import { updateContainer } from './reconciler';
import { writeLog } from './io';

const createPluginRequire =
	() =>
	(moduleName: string): unknown => {
		if (moduleName === 'react') {
			return React;
		}

		if (moduleName.startsWith('@raycast/api')) {
			const storage = new Map<string, string>();
			const LocalStorage = {
				getItem: async (key: string) => storage.get(key),
				setItem: async (key: string, value: string) => storage.set(key, value),
				removeItem: async (key: string) => storage.delete(key),
				clear: async () => storage.clear()
			};

			const createWrapperComponent =
				(name: string) =>
				({ children, ...rest }: { children?: React.ReactNode }) =>
					jsx(name, { ...rest, children });

			const ListComponent = createWrapperComponent('List');
			const ListSectionComponent = createWrapperComponent('ListSection');
			const ListDropdownComponent = createWrapperComponent('ListDropdown');
			const ActionPanelComponent = createWrapperComponent('ActionPanel');
			const ActionPanelSectionComponent = createWrapperComponent('ActionPanelSection');

			Object.assign(ListComponent, {
				Item: 'ListItem',
				Section: ListSectionComponent,
				Dropdown: ListDropdownComponent
			});
			Object.assign(ListDropdownComponent, { Item: 'ListDropdownItem' });
			Object.assign(ActionPanelComponent, {
				Section: ActionPanelSectionComponent
			});

			return {
				LocalStorage,
				environment: {
					assetsPath: '/home/byte/code/raycast-linux/sidecar/dist/plugin/assets/'
				},
				getPreferenceValues: () => ({
					primaryAction: 'paste',
					unicodeVersion: '14.0',
					shortCodes: true
				}),
				usePersistentState: <T>(
					key: string,
					initialValue: T
				): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
					const [state, setState] = React.useState(initialValue);
					return [state, setState, false];
				},
				List: ListComponent,
				ActionPanel: ActionPanelComponent,
				Action: {
					Paste: 'Action.Paste',
					CopyToClipboard: 'Action.CopyToClipboard',
					OpenInBrowser: 'Action.OpenInBrowser'
				}
			};
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
