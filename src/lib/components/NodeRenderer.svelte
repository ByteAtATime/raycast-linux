<script lang="ts">
	import type { UINode } from '$lib/types';
	import ActionPanelSection from './nodes/ActionPanelSection.svelte';
	import ActionCopyToClipboard from './nodes/actions/CopyToClipboard.svelte';
	import ActionOpenInBrowser from './nodes/actions/OpenInBrowser.svelte';
	import ActionPanel from './nodes/ActionPanel.svelte';
	import Action from './nodes/actions/Action.svelte';
	import ActionPush from './nodes/actions/ActionPush.svelte';
	import Detail from './nodes/detail/Detail.svelte';
	import Metadata from './nodes/detail/Metadata.svelte';
	import MetadataLabel from './nodes/detail/MetadataLabel.svelte';
	import MetadataLink from './nodes/detail/MetadataLink.svelte';
	import MetadataSeparator from './nodes/detail/MetadataSeparator.svelte';
	import MetadataTagList from './nodes/detail/MetadataTagList.svelte';
	import MetadataTagListItem from './nodes/detail/MetadataTagListItem.svelte';
	import GridDropdown from './nodes/grid/Dropdown.svelte';
	import GridDropdownItem from './nodes/grid/DropdownItem.svelte';
	import GridDropdownSection from './nodes/grid/DropdownSection.svelte';

	// TODO: maybe make uiTree global
	type Props = {
		nodeId: number;
		uiTree: Map<number, UINode>;
		onDispatch: (instanceId: number, handlerName: string, args: any[]) => void;
		displayAs?: 'item' | 'button';
		primaryActionNodeId?: number;
	};

	let { nodeId, uiTree, onDispatch, displayAs = 'item', primaryActionNodeId }: Props = $props();
	const node = $derived(uiTree.get(nodeId));
</script>

{#if node}
	{#if node.type === 'Action'}
		<Action {nodeId} {uiTree} {onDispatch} {displayAs} />
	{:else if node.type === 'Action.Panel'}
		<ActionPanel {nodeId} {uiTree} {onDispatch} {primaryActionNodeId} />
	{:else if node.type === 'Action.Panel.Section'}
		<ActionPanelSection {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Action.CopyToClipboard'}
		<ActionCopyToClipboard {nodeId} {uiTree} {onDispatch} {displayAs} />
	{:else if node.type === 'Action.OpenInBrowser'}
		<ActionOpenInBrowser {nodeId} {uiTree} {onDispatch} {displayAs} />
	{:else if node.type === 'Action.Push'}
		<ActionPush {nodeId} {uiTree} {onDispatch} {displayAs} />
	{:else if node.type === 'Detail'}
		<Detail {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata'}
		<Metadata {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata.Label'}
		<MetadataLabel {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata.Link'}
		<MetadataLink {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata.TagList'}
		<MetadataTagList {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata.TagList.Item'}
		<MetadataTagListItem {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Detail.Metadata.Separator'}
		<MetadataSeparator {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Grid.Dropdown'}
		<GridDropdown {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Grid.Dropdown.Section'}
		<GridDropdownSection {nodeId} {uiTree} {onDispatch} />
	{:else if node.type === 'Grid.Dropdown.Item'}
		<GridDropdownItem {nodeId} {uiTree} {onDispatch} />
	{/if}
{/if}
