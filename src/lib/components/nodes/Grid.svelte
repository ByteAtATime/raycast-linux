<script lang="ts">
	import type { UINode } from '$lib/types';
	import { getTypedProps } from '$lib/props';
	import type { GridItemProps, GridSectionProps } from '$lib/props';
	import { SvelteMap } from 'svelte/reactivity';
	import GridSection from './GridSection.svelte';
	import GridItem from './GridItem.svelte';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		onSelect: (nodeId: number | undefined) => void;
	};
	let { nodeId, uiTree, onDispatch, onSelect }: Props = $props();

	type FlatListItem = { id: number; height: number } & (
		| { type: 'header'; props: GridSectionProps }
		| { type: 'item'; props: GridItemProps }
	);
	let flatList: FlatListItem[] = $state([]);
	let selectedItemIndex = $state(-1);

	type GridMapItem = {
		flatListIndex: number;
		sectionIndex: number;
		rowIndex: number;
		colIndex: number;
	};
	let gridMap: GridMapItem[] = $state([]);

	let scrollContainer: HTMLDivElement;
	let gridContainer: HTMLDivElement;

	$effect(() => {
		const root = uiTree.get(nodeId);
		if (!root) {
			flatList = [];
			return;
		}
		const newFlatList: FlatListItem[] = [];
		const HEADER_HEIGHT = 34;
		const ITEM_HEIGHT = 40;
		for (const childId of root.children) {
			const sectionNode = uiTree.get(childId);
			if (sectionNode && sectionNode.type === 'GridSection') {
				const sectionProps = getTypedProps(sectionNode as UINode & { type: 'GridSection' });
				if (!sectionProps) continue;
				newFlatList.push({
					id: sectionNode.id,
					type: 'header',
					props: sectionProps,
					height: HEADER_HEIGHT
				});
				for (const itemId of sectionNode.children) {
					const itemNode = uiTree.get(itemId);
					if (itemNode) {
						const itemProps = getTypedProps(itemNode as UINode & { type: 'GridItem' });
						if (!itemProps) continue;
						newFlatList.push({
							id: itemNode.id,
							type: 'item',
							props: itemProps,
							height: ITEM_HEIGHT
						});
					}
				}
			}
		}
		flatList = newFlatList;
	});

	$effect(() => {
		const newGridMap: GridMapItem[] = [];
		let sectionIndex = -1;
		let rowIndex = 0;
		let colIndex = 0;
		const GRID_COLS = 6;

		flatList.forEach((item, index) => {
			if (item.type === 'header') {
				sectionIndex++;
				rowIndex = 0;
				colIndex = 0;
			} else if (item.type === 'item') {
				if (colIndex === 0 && newGridMap.length > 0) {
					rowIndex++;
				}
				newGridMap.push({
					flatListIndex: index,
					sectionIndex,
					rowIndex,
					colIndex
				});
				colIndex = (colIndex + 1) % GRID_COLS;
			}
		});
		gridMap = newGridMap;
	});

	$effect(() => {
		const currentItem = flatList[selectedItemIndex];
		if (currentItem && currentItem.type === 'item') return;
		selectedItemIndex = gridMap[0]?.flatListIndex ?? -1;
	});

	$effect(() => {
		const selectedItem = flatList[selectedItemIndex];
		onSelect(selectedItem?.type === 'item' ? selectedItem.id : undefined);
	});

	$effect(() => {
		if (!gridContainer || selectedItemIndex < 0) return;
		const itemElement = gridContainer.children[selectedItemIndex] as HTMLElement | undefined;
		itemElement?.scrollIntoView({ block: 'nearest' });
	});

	function handleKeydown(event: KeyboardEvent) {
		const { key } = event;

		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
			return;
		}
		event.preventDefault();
		if (gridMap.length === 0) return;

		const currentGridIndex = gridMap.findIndex((item) => item.flatListIndex === selectedItemIndex);
		if (currentGridIndex === -1 && selectedItemIndex !== -1) return;

		let newGridIndex = -1;

		if (key === 'ArrowLeft') {
			newGridIndex = Math.max(0, currentGridIndex - 1);
		} else if (key === 'ArrowRight') {
			newGridIndex = Math.min(gridMap.length - 1, currentGridIndex + 1);
		} else if (key === 'ArrowUp' || key === 'ArrowDown') {
			if (currentGridIndex === -1) {
				newGridIndex = 0;
			} else {
				const currentPos = gridMap[currentGridIndex];
				const direction = key === 'ArrowDown' ? 1 : -1;

				let targetRowIndex = -1;
				let targetSectionIndex = -1;
				let nextRowItems: GridMapItem[] = [];

				// find first element in next row or next section, whichever comes first
				for (let i = currentGridIndex + direction; i >= 0 && i < gridMap.length; i += direction) {
					const item = gridMap[i];
					if (
						item.rowIndex !== currentPos.rowIndex ||
						item.sectionIndex !== currentPos.sectionIndex
					) {
						targetRowIndex = item.rowIndex;
						targetSectionIndex = item.sectionIndex;
						break;
					}
				}

				if (targetRowIndex !== -1) {
					nextRowItems = gridMap.filter(
						(item) => item.rowIndex === targetRowIndex && item.sectionIndex === targetSectionIndex
					);
				}

				if (nextRowItems.length > 0) {
					// try to find item in the same column
					let targetItem = nextRowItems.find((item) => item.colIndex === currentPos.colIndex);

					// if not found, select last item in the next row ("ragged" edge)
					// i spent way too much time on this my head hurts pls send help
					if (!targetItem) {
						targetItem = nextRowItems[nextRowItems.length - 1];
					}
					newGridIndex = gridMap.indexOf(targetItem);
				}
			}
		}

		if (newGridIndex !== -1) {
			selectedItemIndex = gridMap[newGridIndex].flatListIndex;
		} else if (scrollContainer) {
			if (key === 'ArrowUp') scrollContainer.scrollTop = 0;
			if (key === 'ArrowDown') scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col">
	<input
		type="text"
		class="w-full border-b border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
		placeholder="Search..."
		oninput={(e) => onDispatch(nodeId, 'onSearchTextChange', [e.currentTarget.value])}
	/>

	<div class="flex-grow overflow-y-auto" bind:this={scrollContainer}>
		<div class="grid h-full grid-cols-6" bind:this={gridContainer}>
			{#each flatList as item, index (item.id)}
				{#if item.type === 'header'}
					<GridSection props={item.props} />
				{:else if item.type === 'item'}
					<GridItem
						props={item.props}
						selected={selectedItemIndex === index}
						onclick={() => (selectedItemIndex = index)}
					/>
				{/if}
			{/each}
		</div>
	</div>
</div>
