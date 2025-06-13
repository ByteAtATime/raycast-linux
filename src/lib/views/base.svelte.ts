import type { UINode } from '$lib/types';
import {
	GridItemPropsSchema,
	GridSectionPropsSchema,
	ListItemPropsSchema,
	ListSectionPropsSchema,
	type GridItemProps,
	type ListSectionProps,
	type ListItemProps
} from '$lib/props';

export type FlatViewItem = { id: number } & (
	| { type: 'header'; props: ListSectionProps }
	| { type: 'item'; props: ListItemProps | GridItemProps }
);

export type BaseViewArgs = {
	nodeId: number;
	uiTree: Map<number, UINode>;
	onSelect: (nodeId: number | undefined) => void;
};

export function _useBaseView(args: () => BaseViewArgs, itemType: 'List.Item' | 'Grid.Item') {
	const { nodeId, uiTree, onSelect } = $derived.by(args);

	let flatList = $state<FlatViewItem[]>([]);
	let selectedItemIndex = $state(-1);

	$effect(() => {
		const root = uiTree.get(nodeId);
		if (!root) {
			flatList = [];
			return;
		}

		const newFlatList: FlatViewItem[] = [];

		const sectionSchema =
			itemType === 'List.Item' ? ListSectionPropsSchema : GridSectionPropsSchema;
		const itemSchema = itemType === 'List.Item' ? ListItemPropsSchema : GridItemPropsSchema;
		const sectionType = itemType === 'List.Item' ? 'List.Section' : 'Grid.Section';

		for (const childId of root.children) {
			const sectionNode = uiTree.get(childId);
			if (sectionNode && sectionNode.type === sectionType) {
				const sectionResult = sectionSchema.safeParse(sectionNode.props);
				if (!sectionResult.success) continue;

				newFlatList.push({ id: sectionNode.id, type: 'header', props: sectionResult.data });

				for (const itemId of sectionNode.children) {
					const itemNode = uiTree.get(itemId);
					if (itemNode && itemNode.type === itemType) {
						const itemResult = itemSchema.safeParse(itemNode.props);
						if (!itemResult.success) continue;

						newFlatList.push({ id: itemNode.id, type: 'item', props: itemResult.data });
					}
				}
			}
		}
		flatList = newFlatList;
	});

	$effect(() => {
		const currentItem = flatList[selectedItemIndex];
		if (currentItem?.type === 'item') return;
		selectedItemIndex = flatList.findIndex((item) => item.type === 'item');
	});

	$effect(() => {
		const selectedItem = flatList[selectedItemIndex];
		onSelect(selectedItem?.type === 'item' ? selectedItem.id : undefined);
	});

	const setSelectedItemIndex = (index: number) => {
		if (flatList[index]?.type === 'item') {
			selectedItemIndex = index;
		}
	};

	return {
		get flatList() {
			return flatList;
		},
		get selectedItemIndex() {
			return selectedItemIndex;
		},
		setSelectedItemIndex
	};
}
