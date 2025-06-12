import React from 'react';
import { jsx } from 'react/jsx-runtime';
import { Color } from './colors';
import { Cache } from './cache';
import { Icon } from './icon';

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

	const List = createWrapperComponent('List');
	const ListSection = createWrapperComponent('List.Section');
	const ListItem = createWrapperComponent('List.Item');
	const ListItemDetail = createWrapperComponent('List.Item.Detail');
	const ListItemDetailMetadata = createWrapperComponent('List.Item.Detail.Metadata');
	const ListItemDetailMetadataTag = createWrapperComponent('List.Item.Detail.Metadata.Tag');
	const ListItemDetailMetadataTagList = createWrapperComponent('List.Item.Detail.Metadata.TagList');
	const ListItemDetailMetadataTagListItem = createWrapperComponent(
		'List.Item.Detail.Metadata.TagList.Item'
	);
	const ListDropdown = createWrapperComponent('List.Dropdown');
	const ListDropdownItem = createWrapperComponent('List.Dropdown.Item');

	Object.assign(List, {
		Item: ListItem,
		Section: ListSection,
		Dropdown: ListDropdown
	});
	Object.assign(ListItem, {
		Detail: ListItemDetail
	});
	Object.assign(ListItemDetail, {
		Metadata: ListItemDetailMetadata
	});
	Object.assign(ListItemDetailMetadata, {
		Tag: ListItemDetailMetadataTag,
		List: ListItemDetailMetadataTagList
	});
	Object.assign(ListItemDetailMetadataTagList, { Item: ListItemDetailMetadataTagListItem });

	Object.assign(ListDropdown, { Item: ListDropdownItem });

	const Grid = createWrapperComponent('Grid');
	const GridSection = createWrapperComponent('Grid.Section');
	const GridItem = createWrapperComponent('Grid.Item');

	Object.assign(Grid, {
		Section: GridSection,
		Item: GridItem
	});

	const Action = createWrapperComponent('Action');
	const ActionPanel = createWrapperComponent('Action.Panel');
	const ActionPanelSection = createWrapperComponent('Action.Panel.Section');
	const ActionPaste = createWrapperComponent('Action.Paste');
	const ActionCopy = createWrapperComponent('Action.CopyToClipboard');
	const ActionOpenInBrowser = createWrapperComponent('Action.OpenInBrowser');
	const ActionPush = createWrapperComponent('Action.Push');

	Object.assign(Action, {
		Paste: ActionPaste,
		CopyToClipboard: ActionCopy,
		OpenInBrowser: ActionOpenInBrowser,
		Push: ActionPush
	});

	Object.assign(ActionPanel, {
		Section: ActionPanelSection
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
		List,
		ActionPanel,
		Action,
		Grid,
		Icon
	};
};
