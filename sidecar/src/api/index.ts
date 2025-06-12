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
	const ListSection = createWrapperComponent('ListSection');
	const ListItem = createWrapperComponent('ListItem');
	const ListItemDetail = createWrapperComponent('ListItemDetail');
	const ListItemDetailMetadata = createWrapperComponent('ListItemDetail.Metadata');
	const ListItemDetailMetadataTag = createWrapperComponent('ListItemDetail.Metadata.Tag');
	const ListItemDetailMetadataTagList = createWrapperComponent('ListItemDetail.Metadata.TagList');
	const ListItemDetailMetadataTagListItem = createWrapperComponent(
		'ListItemDetail.Metadata.TagList.Item'
	);
	const ListDropdown = createWrapperComponent('ListDropdown');
	const ListDropdownItem = createWrapperComponent('ListDropdownItem');

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
	const GridSection = createWrapperComponent('GridSection');
	const GridItem = createWrapperComponent('GridItem');

	Object.assign(Grid, {
		Section: GridSection,
		Item: GridItem
	});

	const ActionPanel = createWrapperComponent('ActionPanel');
	const ActionPanelSection = createWrapperComponent('ActionPanelSection');
	const ActionPaste = createWrapperComponent('Action.Paste');
	const ActionCopy = createWrapperComponent('Action.CopyToClipboard');
	const ActionOpenBrowser = createWrapperComponent('Action.OpenInBrowser');

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
		Action: {
			Paste: ActionPaste,
			CopyToClipboard: ActionCopy,
			OpenInBrowser: ActionOpenBrowser
		},
		Grid,
		Icon
	};
};
