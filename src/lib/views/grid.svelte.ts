import { _useBaseView, type BaseViewArgs } from './base.svelte';

export function useGridView(args: () => BaseViewArgs & { columns: number }) {
	const base = _useBaseView(args, 'Grid.Item');
	const { columns } = $derived.by(args);

	type GridMapItem = {
		flatListIndex: number;
		sectionIndex: number;
		rowIndex: number;
		colIndex: number;
	};
	const gridMap: GridMapItem[] = $derived.by(() => {
		const newGridMap: GridMapItem[] = [];
		let sectionIndex = -1,
			rowIndex = 0,
			colIndex = 0;
		base.flatList.forEach((item, index) => {
			if (item.type === 'header') {
				sectionIndex++;
				rowIndex = 0;
				colIndex = 0;
			} else if (item.type === 'item') {
				if (colIndex === 0 && newGridMap.length > 0) rowIndex++;
				newGridMap.push({ flatListIndex: index, sectionIndex, rowIndex, colIndex });
				colIndex = (colIndex + 1) % columns;
			}
		});
		return newGridMap;
	});

	$effect(() => {
		if (base.selectedItemIndex < 0) return;
		const elementId = `item-${base.flatList[base.selectedItemIndex]?.id}`;
		document.getElementById(elementId)?.scrollIntoView({ block: 'nearest' });
	});

	const handleKeydown = (event: KeyboardEvent) => {
		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
		event.preventDefault();

		const currentGridIndex = gridMap.findIndex(
			(item) => item.flatListIndex === base.selectedItemIndex
		);
		if (currentGridIndex === -1) {
			if (gridMap.length > 0) base.setSelectedItemIndex(gridMap[0].flatListIndex);
			return;
		}

		let newGridIndex = -1;
		const currentPos = gridMap[currentGridIndex];

		if (event.key === 'ArrowLeft') {
			newGridIndex = Math.max(0, currentGridIndex - 1);
		} else if (event.key === 'ArrowRight') {
			newGridIndex = Math.min(gridMap.length - 1, currentGridIndex + 1);
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			const direction = event.key === 'ArrowDown' ? 1 : -1;
			const targetRowIndex = currentPos.rowIndex + direction;
			const itemsInSameSection = gridMap.filter(
				(item) => item.sectionIndex === currentPos.sectionIndex
			);
			let itemsInTargetRow = itemsInSameSection.filter((item) => item.rowIndex === targetRowIndex);

			if (itemsInTargetRow.length === 0) {
				const targetSectionIndex = currentPos.sectionIndex + direction;
				const itemsInTargetSection = gridMap.filter(
					(item) => item.sectionIndex === targetSectionIndex
				);
				if (itemsInTargetSection.length > 0) {
					const rows = [...new Set(itemsInTargetSection.map((i) => i.rowIndex))].sort(
						(a, b) => a - b
					);
					itemsInTargetRow = itemsInTargetSection.filter(
						(i) => i.rowIndex === (direction === 1 ? rows[0] : rows.at(-1))
					);
				}
			}

			if (itemsInTargetRow.length > 0) {
				const targetItem =
					itemsInTargetRow.find((item) => item.colIndex === currentPos.colIndex) ??
					itemsInTargetRow.at(-1)!;
				newGridIndex = gridMap.indexOf(targetItem);
			}
		}

		if (newGridIndex !== -1) {
			base.setSelectedItemIndex(gridMap[newGridIndex].flatListIndex);
		}
	};

	return {
		get flatList() {
			return base.flatList;
		},
		get selectedItemIndex() {
			return base.selectedItemIndex;
		},
		setSelectedItemIndex: base.setSelectedItemIndex,
		handleKeydown
	};
}
