import { jsx } from 'react/jsx-runtime';
import { Color } from './colors';
import { Cache } from './cache';
import React from 'react';

export const getRaycastApi = () => {
	const storage = new Map<string, string>();
	const LocalStorage = {
		getItem: async (key: string) => storage.get(key),
		setItem: async (key: string, value: string) => storage.set(key, value),
		removeItem: async (key: string) => storage.delete(key),
		clear: async () => storage.clear()
	};

	const createWrapperComponent = (name: string) => {
		const Component = ({ children, ...rest }: { children?: React.ReactNode }) =>
			jsx(name, { ...rest, children });
		Component.displayName = name;
		return Component;
	};

	const ListComponent = createWrapperComponent('List');
	const ListSectionComponent = createWrapperComponent('ListSection');
	const ListDropdownComponent = createWrapperComponent('ListDropdown');

	const ActionPanelComponent = createWrapperComponent('ActionPanel');
	const ActionPanelSectionComponent = createWrapperComponent('ActionPanelSection');
	const ActionPasteComponent = createWrapperComponent('Action.Paste');
	const ActionCopyComponent = createWrapperComponent('Action.CopyToClipboard');
	const ActionOpenBrowserComponent = createWrapperComponent('Action.OpenInBrowser');

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
		Color,
		Cache,
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
			Paste: ActionPasteComponent,
			CopyToClipboard: ActionCopyComponent,
			OpenInBrowser: ActionOpenBrowserComponent
		}
	};
};
