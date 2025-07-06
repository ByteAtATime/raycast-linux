<script lang="ts">
	import { setContext, tick } from 'svelte';
	import MainLayout from '$lib/components/layout/MainLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Content from '$lib/components/layout/Content.svelte';
	import { uiStore } from '$lib/ui.svelte';
	import path from 'path';
	import ActionBar from './nodes/shared/ActionBar.svelte';
	import NodeRenderer from './NodeRenderer.svelte';
	import { focusManager } from '$lib/focus.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { sidecarService } from '$lib/sidecar.svelte';
	import {
		keyEventMatches,
		type KeyboardShortcut,
		getTypedProps,
		type ComponentType,
		type ActionCopyToClipboardProps,
		type ActionOpenInBrowserProps
	} from '$lib/props';
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import { openUrl } from '@tauri-apps/plugin-opener';

	const {
		uiTree,
		rootNodeId,
		selectedNodeId,
		toasts,
		currentRunningPlugin,
		primaryAction: primaryActionObject,
		secondaryAction,
		actionPanel,
		allActions
	} = $derived(uiStore);

	type Props = {
		onPopView: () => void;
		onToastAction: (toastId: number, actionType: 'primary' | 'secondary') => void;
	};

	let { onPopView, onToastAction }: Props = $props();

	const rootNode = $derived(uiTree.get(rootNodeId!));
	const selectedItemNode = $derived(uiTree.get(selectedNodeId!));
	let searchText = $state('');
	let searchInputEl: HTMLInputElement | null = $state(null);
	const navigationTitle = $derived(rootNode?.props.navigationTitle as string | undefined);
	const toastToShow = $derived(Array.from(toasts.entries()).sort((a, b) => b[0] - a[0])[0]?.[1]);
	const showActionPanelDropdown = $derived((allActions?.length ?? 0) > 1);
	const formValues = new SvelteMap<string, unknown>();

	const assetsPath = $derived(
		currentRunningPlugin ? path.dirname(currentRunningPlugin.pluginPath) + '/assets' : ''
	);
	setContext('assetsPath', assetsPath);
	setContext('form-context', {
		register: (fieldId: string, value: unknown) => {
			formValues.set(fieldId, value);
		}
	});

	function handleSelect(nodeId: number | undefined) {
		uiStore.selectedNodeId = nodeId;
	}

	function handleDispatch(instanceId: number, handlerName: string, args: unknown[]) {
		const instance = uiTree.get(instanceId);
		if (instance?.type === 'Action.SubmitForm' && handlerName === 'onSubmit') {
			const valuesObject = Object.fromEntries(formValues.entries());
			sidecarService.dispatchEvent('dispatch-event', {
				instanceId,
				handlerName,
				args: [valuesObject]
			});
			formValues.clear();
		} else {
			sidecarService.dispatchEvent('dispatch-event', { instanceId, handlerName, args });
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && !event.defaultPrevented) {
			if (event.defaultPrevented) {
				return;
			}
			onPopView();
			return;
		}

		for (const actionNode of allActions) {
			const props = getTypedProps({ ...actionNode, type: actionNode.type as ComponentType });
			if (props && 'shortcut' in props && props.shortcut) {
				if (keyEventMatches(event, props.shortcut as KeyboardShortcut)) {
					event.preventDefault();

					switch (actionNode.type) {
						case 'Action.CopyToClipboard': {
							const copyProps = props as ActionCopyToClipboardProps;
							writeText(copyProps.content);
							handleDispatch(actionNode.id, 'onCopy', []);
							break;
						}
						case 'Action.OpenInBrowser': {
							const openProps = props as ActionOpenInBrowserProps;
							openUrl(openProps.url);
							handleDispatch(actionNode.id, 'onOpenInBrowser', []);
							break;
						}
						case 'Action.SubmitForm': {
							handleDispatch(actionNode.id, 'onSubmit', []);
							break;
						}
						case 'Action.Push':
						case 'Action':
						default: {
							handleDispatch(actionNode.id, 'onAction', []);
							break;
						}
					}
					return;
				}
			}
		}
	}

	$effect(() => {
		if (focusManager.activeScope === 'main-input') {
			tick().then(() => {
				searchInputEl?.focus();
			});
		}
	});

	$effect(() => {
		if (rootNode) {
			handleDispatch(rootNode.id, 'onSearchTextChange', [searchText]);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if rootNode}
	<MainLayout>
		{#snippet header()}
			<Header
				{rootNode}
				bind:searchText
				bind:inputRef={searchInputEl}
				{onPopView}
				onDispatch={handleDispatch}
				{uiTree}
				showBackButton={true}
			/>
		{/snippet}

		{#snippet content()}
			<Content
				{rootNode}
				{selectedItemNode}
				{uiTree}
				onDispatch={handleDispatch}
				onSelect={handleSelect}
				{searchText}
			/>
		{/snippet}

		{#snippet footer()}
			<ActionBar title={navigationTitle} toast={toastToShow} {onToastAction}>
				{#snippet primaryAction({ props })}
					{#if primaryActionObject}
						<NodeRenderer
							{...props}
							nodeId={primaryActionObject.id}
							{uiTree}
							onDispatch={handleDispatch}
							displayAs="button"
						/>
					{/if}
				{/snippet}
				{#snippet actions()}
					{#if showActionPanelDropdown && actionPanel}
						<NodeRenderer nodeId={actionPanel.id} {uiTree} onDispatch={handleDispatch} />
					{/if}
				{/snippet}
			</ActionBar>
		{/snippet}
	</MainLayout>
{/if}
