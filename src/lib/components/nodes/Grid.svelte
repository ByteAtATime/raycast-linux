<script lang="ts">
	import type { UINode } from '$lib/types';
	import type { GridItemProps } from '$lib/props';
	import GridSection from './GridSection.svelte';
	import GridItem from './GridItem.svelte';
	import { useGridView } from '$lib/views';
	import { useTypedNode } from '$lib/node.svelte';

	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		onSelect: (nodeId: number | undefined) => void;
	};
	let { nodeId, uiTree, onDispatch, onSelect }: Props = $props();

	const { props: gridProps } = $derived.by(useTypedNode(() => ({ nodeId, uiTree, type: 'Grid' })));
	let searchText = $state('');

	const view = useGridView(() => ({
		nodeId,
		uiTree,
		onSelect,
		columns: gridProps?.columns ?? 6,
		searchText,
		filtering: gridProps?.filtering ?? true
	}));
</script>

<svelte:window onkeydown={view.handleKeydown} />

<div class="flex h-full flex-col">
	<!-- svelte-ignore a11y_autofocus -->
	<input
		type="text"
		class="w-full border-b border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
		placeholder={gridProps?.searchBarPlaceholder ?? 'Search...'}
		bind:value={searchText}
		oninput={() => onDispatch(nodeId, 'onSearchTextChange', [searchText])}
		autofocus
	/>

	<div class="flex-grow overflow-y-auto">
		<div class="grid h-full grid-cols-6 content-start">
			{#each view.flatList as item, index (item.id)}
				{#if item.type === 'header'}
					<GridSection props={item.props} />
				{:else if item.type === 'item'}
					<div id="item-{item.id}">
						<GridItem
							props={item.props as GridItemProps}
							selected={view.selectedItemIndex === index}
							onclick={() => view.setSelectedItemIndex(index)}
						/>
					</div>
				{/if}
			{/each}
		</div>
	</div>
</div>
