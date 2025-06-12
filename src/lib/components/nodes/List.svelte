<script lang="ts">
	import { VList, type VListHandle } from 'virtua/svelte';
	import type { UINode } from '$lib/types';
	import { getTypedProps } from '$lib/props';
	import type { ListItemProps, ListSectionProps } from '$lib/props';
	import { SvelteMap } from 'svelte/reactivity';
	import ListItem from './ListItem.svelte';
	import ListSection from './ListSection.svelte';

	type Props = {
		nodeId: number;
		uiTree: SvelteMap<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		onSelect: (nodeId: number | undefined) => void;
	};
	let { nodeId, uiTree, onDispatch, onSelect }: Props = $props();

	let vlistInstance: VListHandle | undefined = $state();

	type FlatListItem = { id: number; height: number } & (
		| { type: 'header'; props: ListSectionProps }
		| { type: 'item'; props: ListItemProps }
	);
	let flatList: FlatListItem[] = $state([]);
	let selectedItemIndex = $state(-1);

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
			if (sectionNode && sectionNode.type === 'List.Section') {
				const sectionProps = getTypedProps(sectionNode as UINode & { type: 'List.Section' });
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
						const itemProps = getTypedProps(itemNode as UINode & { type: 'List.Item' });
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
		const currentItem = flatList[selectedItemIndex];
		if (currentItem && currentItem.type === 'item') {
			return;
		}
		selectedItemIndex = flatList.findIndex((item) => item.type === 'item');
	});

	$effect(() => {
		const selectedItem = flatList[selectedItemIndex];
		onSelect(selectedItem?.type === 'item' ? selectedItem.id : undefined);
	});

	$effect(() => {
		if (selectedItemIndex !== -1 && vlistInstance) {
			vlistInstance.scrollToIndex(selectedItemIndex, { align: 'nearest' });
		}
	});

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			if (flatList.length === 0) return;

			let newIndex = selectedItemIndex;
			const direction = event.key === 'ArrowDown' ? 1 : -1;

			if (newIndex === -1) {
				newIndex = direction === 1 ? -1 : flatList.length;
			}

			do {
				newIndex += direction;
			} while (newIndex >= 0 && newIndex < flatList.length && flatList[newIndex].type !== 'item');

			if (newIndex >= 0 && newIndex < flatList.length) {
				selectedItemIndex = newIndex;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex h-full flex-col">
	<input
		type="text"
		class="w-full border-b border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
		placeholder="Search Emojis..."
		oninput={(e) => onDispatch(nodeId, 'onSearchTextChange', [e.currentTarget.value])}
	/>

	<div class="flex-grow">
		<VList bind:this={vlistInstance} data={flatList} getKey={(item) => item.id} class="h-full">
			{#snippet children(item, index)}
				{#if item.type === 'header'}
					<ListSection props={item.props} />
				{:else if item.type === 'item'}
					<ListItem
						props={item.props}
						selected={selectedItemIndex === index}
						onclick={() => (selectedItemIndex = index)}
					/>
				{/if}
			{/snippet}
		</VList>
	</div>
</div>
