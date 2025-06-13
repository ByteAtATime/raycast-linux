import React from 'react';
import { jsx } from 'react/jsx-runtime';
import { Color } from './colors';
import { Cache } from './cache';
import { Icon } from './icon';
import { currentRootElement, navigationStack } from '../state';
import { updateContainer } from '../reconciler';

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
			jsx(name as any, { ...rest, children });
		Component.displayName = name;
		return Component;
	};

	const useNavigation = () => {
		const push = React.useCallback((element: React.ReactElement) => {
			if (currentRootElement) {
				navigationStack.push(currentRootElement);
				updateContainer(element);
			}
		}, []);

		const pop = React.useCallback(() => {
			const previous = navigationStack.pop();
			if (previous) {
				updateContainer(previous);
			}
		}, []);

		return { push, pop };
	};

	const List = createWrapperComponent('List');
	const ListSection = createWrapperComponent('List.Section');
	const ListItem = createWrapperComponent('List.Item');
	Object.assign(List, {
		Item: ListItem,
		Section: ListSection
	});

	const Grid = createWrapperComponent('Grid');
	const GridSection = createWrapperComponent('Grid.Section');
	const GridItem = createWrapperComponent('Grid.Item');
	const GridDropdown = createWrapperComponent('Grid.Dropdown');
	const GridDropdownItem = createWrapperComponent('Grid.Dropdown.Item');
	Object.assign(Grid, {
		Section: GridSection,
		Item: GridItem,
		Dropdown: GridDropdown
	});
	Object.assign(GridDropdown, {
		Item: GridDropdownItem
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

	const Detail = createWrapperComponent('Detail');
	const DetailMetadata = createWrapperComponent('Detail.Metadata');
	const DetailMetadataLabel = createWrapperComponent('Detail.Metadata.Label');
	const DetailMetadataLink = createWrapperComponent('Detail.Metadata.Link');
	const DetailMetadataTagList = createWrapperComponent('Detail.Metadata.TagList');
	const DetailMetadataTagListItem = createWrapperComponent('Detail.Metadata.TagList.Item');
	const DetailMetadataSeparator = createWrapperComponent('Detail.Metadata.Separator');
	Object.assign(Detail, {
		Metadata: DetailMetadata
	});
	Object.assign(DetailMetadata, {
		Label: DetailMetadataLabel,
		Link: DetailMetadataLink,
		TagList: DetailMetadataTagList,
		Separator: DetailMetadataSeparator
	});
	Object.assign(DetailMetadataTagList, {
		Item: DetailMetadataTagListItem
	});

	const LaunchType = {
		UserInitiated: 'userInitiated',
		Background: 'background'
	};

	return {
		LocalStorage,
		Color,
		Cache,
		LaunchType,
		showToast: () => {},
		Toast: {
			Style: {
				Success: 'SUCCESS',
				Failure: 'FAILURE',
				Animated: 'ANIMATED'
			}
		},
		environment: {
			assetsPath: '/home/byte/code/raycast-linux/sidecar/dist/plugin/assets/',
			launchType: LaunchType.UserInitiated
		},
		getPreferenceValues: () => ({
			language: 9
		}),
		usePersistentState: <T>(
			key: string,
			initialValue: T
		): [T, React.Dispatch<React.SetStateAction<T>>, boolean] => {
			const [state, setState] = React.useState(initialValue);
			return [state, setState, false];
		},
		useNavigation,
		List,
		Grid,
		Action,
		ActionPanel,
		Detail,
		Icon
	};
};
