import type { VListHandle } from 'virtua/svelte';
import { _useBaseView, type BaseViewArgs } from './base.svelte';

export function useListView(args: () => BaseViewArgs) {
	const base = _useBaseView(args, 'List.Item');
	let vlistInstance = $state<VListHandle | undefined>();

	$effect(() => {
		if (base.selectedItemIndex !== -1 && vlistInstance) {
			vlistInstance.scrollToIndex(base.selectedItemIndex, { align: 'nearest' });
		}
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
		event.preventDefault();

		const itemIndexes = base.flatList
			.map((item, i) => (item.type === 'item' ? i : -1))
			.filter((i) => i !== -1);
		if (itemIndexes.length === 0) return;

		const currentItemIndexInSelection = itemIndexes.indexOf(base.selectedItemIndex);
		const direction = event.key === 'ArrowDown' ? 1 : -1;
		let nextItemIndexInSelection = currentItemIndexInSelection + direction;

		nextItemIndexInSelection = Math.max(
			0,
			Math.min(nextItemIndexInSelection, itemIndexes.length - 1)
		);

		base.setSelectedItemIndex(itemIndexes[nextItemIndexInSelection]);
	};

	return {
		get flatList() {
			return base.flatList;
		},
		get selectedItemIndex() {
			return base.selectedItemIndex;
		},
		setSelectedItemIndex: base.setSelectedItemIndex,
		set vlistInstance(instance: VListHandle | undefined) {
			vlistInstance = instance;
		},
		handleKeydown
	};
}
