<script lang="ts">
	import { type Extension, ExtensionSchema } from '$lib/store';
	import { invoke } from '@tauri-apps/api/core';
	import ExtensionListView from './extensions/ExtensionListView.svelte';
	import ExtensionDetailView from './extensions/ExtensionDetailView.svelte';
	import ImageLightbox from './extensions/ImageLightbox.svelte';
	import CategoryFilter from './extensions/CategoryFilter.svelte';
	import { extensionsStore } from './extensions/store.svelte';
	import type { VListHandle } from 'virtua/svelte';
	import HeaderInput from './HeaderInput.svelte';
	import { viewManager } from '$lib/viewManager.svelte';
	import ExtensionInstallConfirm from './extensions/ExtensionInstallConfirm.svelte';
	import { fetch } from '@tauri-apps/plugin-http';
	import ActionBar from '$lib/components/nodes/shared/ActionBar.svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';
	import { writeText } from '@tauri-apps/plugin-clipboard-manager';
	import MainLayout from './layout/MainLayout.svelte';
	import Header from './layout/Header.svelte';
	import type { ActionDefinition } from './nodes/shared/actions';
	import storeCommandIcon from '$lib/assets/command-store-1616x16@2x.png?inline';

	type Props = {
		onBack: () => void;
		onInstall: () => void;
	};

	type Violation = {
		commandName: string;
		reason: string;
	};

	type DisplayItem = {
		id: string | number;
		itemType: 'header' | 'item';
		data: Extension | string;
	};

	let { onBack, onInstall }: Props = $props();

	let selectedExtension = $state<Extension | null>(null);
	let detailedExtension = $state<Extension | null>(null);
	let isDetailLoading = $state(false);
	let expandedImageUrl = $state<string | null>(null);
	let isInstalling = $state(false);
	let vlistInstance = $state<VListHandle | null>(null);
	let showConfirmationDialog = $state(false);
	let confirmationViolations = $state<Violation[]>([]);
	let extensionForConfirmation = $state<Extension | null>(null);

	let displayedItems = $state<DisplayItem[]>([]);

	$effect(() => {
		const newItems: DisplayItem[] = [];
		const addedIds = new Set<string>();

		const addItems = (exts: Extension[]) => {
			for (const ext of exts) {
				if (!addedIds.has(ext.id)) {
					newItems.push({ id: ext.id, itemType: 'item', data: ext });
					addedIds.add(ext.id);
				}
			}
		};

		if (extensionsStore.searchText) {
			if (extensionsStore.searchResults.length > 0) {
				newItems.push({ id: 'header-search', itemType: 'header', data: 'Search Results' });
				addItems(extensionsStore.searchResults);
			}
		} else if (extensionsStore.selectedCategory !== 'All Categories') {
			const filtered =
				extensionsStore.extensions.filter(
					(ext) => ext.categories?.includes(extensionsStore.selectedCategory) ?? false
				) ?? [];
			if (filtered.length > 0) {
				newItems.push({
					id: `header-${extensionsStore.selectedCategory}`,
					itemType: 'header',
					data: extensionsStore.selectedCategory
				});
				addItems(filtered);
			}
		} else {
			if (extensionsStore.featuredExtensions.length > 0) {
				newItems.push({ id: 'header-featured', itemType: 'header', data: 'Featured' });
				addItems(extensionsStore.featuredExtensions);
			}
			if (extensionsStore.trendingExtensions.length > 0) {
				newItems.push({ id: 'header-trending', itemType: 'header', data: 'Trending' });
				addItems(extensionsStore.trendingExtensions);
			}
			if (extensionsStore.extensions.length > 0) {
				newItems.push({ id: 'header-all', itemType: 'header', data: 'All Extensions' });
				addItems(extensionsStore.extensions);
			}
		}

		if (!extensionsStore.isSearching) {
			displayedItems = newItems;
		}
	});

	const selectedListItem = $derived(displayedItems[extensionsStore.selectedIndex]);
	const selectedListExtension = $derived(
		selectedListItem?.itemType === 'item' ? (selectedListItem.data as Extension) : null
	);

	$effect(() => {
		const ext = viewManager.extensionToSelect;
		if (ext) {
			selectedExtension = ext;
			viewManager.extensionToSelect = null;
		}
	});

	$effect(() => {
		if (selectedExtension && selectedExtension.id !== detailedExtension?.id) {
			detailedExtension = null;
			isDetailLoading = true;
			const fetchDetails = async () => {
				try {
					const res = await fetch(
						`https://backend.raycast.com/api/v1/extensions/${selectedExtension!.author.handle}/${selectedExtension!.name}`
					);
					if (!res.ok) throw new Error(`Failed to fetch extension details: ${res.status}`);
					const json = await res.json();
					const parsed = ExtensionSchema.parse(json);
					detailedExtension = parsed;
				} catch (e) {
					console.error('Failed to fetch or parse extension details, using list data.', e);
					detailedExtension = selectedExtension;
				} finally {
					isDetailLoading = false;
				}
			};
			fetchDetails();
		} else if (!selectedExtension) {
			detailedExtension = null;
		}
	});

	const handleScroll = () => {
		if (!vlistInstance) return;
		if (
			vlistInstance.getScrollSize() -
				vlistInstance.getScrollOffset() -
				vlistInstance.getViewportSize() <
			500
		) {
			extensionsStore.loadMore();
		}
	};

	function handleOpenInBrowser() {
		if (!selectedListExtension) return;
		const { author, name: slug } = selectedListExtension;
		openUrl(`https://raycast.com/${author.handle}/${slug}`);
	}

	function handleCopyExtensionUrl() {
		if (!selectedListExtension) return;
		const { author, name: slug } = selectedListExtension;
		writeText(`https://raycast.com/${author.handle}/${slug}`);
	}

	function handleViewReadme() {
		if (!selectedListExtension || !selectedListExtension.readme_url) return;
		openUrl(selectedListExtension.readme_url);
	}

	function handleViewSourceCode() {
		if (!selectedListExtension || !selectedListExtension.source_url) return;
		openUrl(selectedListExtension.source_url);
	}

	async function installExtension(extensionToInstall: Extension) {
		if (isInstalling) return;
		isInstalling = true;
		try {
			const result = await invoke<{
				status: 'success' | 'requiresConfirmation';
				violations?: Violation[];
			}>('install_extension', {
				downloadUrl: extensionToInstall.download_url,
				slug: extensionToInstall.name,
				force: false
			});

			if (result.status === 'success') {
				onInstall();
			} else if (result.status === 'requiresConfirmation' && result.violations) {
				extensionForConfirmation = extensionToInstall;
				confirmationViolations = result.violations;
				showConfirmationDialog = true;
			}
		} catch (e) {
			console.error('Installation failed', e);
		} finally {
			isInstalling = false;
		}
	}

	async function handleInstall() {
		const extensionToInstall = detailedExtension || selectedExtension;
		if (extensionToInstall) {
			await installExtension(extensionToInstall);
		}
	}

	async function handleForceInstall() {
		showConfirmationDialog = false;
		const extensionToInstall = extensionForConfirmation;
		if (!extensionToInstall) return;
		isInstalling = true;
		try {
			await invoke('install_extension', {
				downloadUrl: extensionToInstall.download_url,
				slug: extensionToInstall.name,
				force: true
			});
			onInstall();
		} catch (e) {
			console.error('Forced installation failed', e);
		} finally {
			isInstalling = false;
		}
	}

	const actions: ActionDefinition[] = $derived(
		selectedListExtension
			? [
					{
						title: 'Show Details',
						handler: () => (selectedExtension = selectedListExtension)
					},
					{
						title: isInstalling ? 'Installing...' : 'Install Extension',
						handler: () => installExtension(selectedListExtension),
						disabled: isInstalling
					},
					{
						title: 'Open in Browser',
						shortcut: { key: 'o', modifiers: ['opt', 'ctrl'] },
						handler: handleOpenInBrowser
					},
					{
						title: 'Copy Extension URL',
						shortcut: { key: '.', modifiers: ['ctrl'] },
						handler: handleCopyExtensionUrl
					},
					{
						title: 'View README',
						shortcut: { key: 'r', modifiers: ['opt', 'shift', 'ctrl'] },
						handler: handleViewReadme,
						disabled: !selectedListExtension.readme_url
					},
					{
						title: 'View Source Code',
						shortcut: { key: 'o', modifiers: ['shift', 'ctrl'] },
						handler: handleViewSourceCode,
						disabled: !selectedListExtension.source_url
					}
				]
			: []
	);
</script>

<MainLayout>
	{#snippet header()}
		<Header
			showBackButton={true}
			onPopView={() => (selectedExtension ? (selectedExtension = null) : onBack())}
			isLoading={(extensionsStore.isLoading && !selectedExtension) || isDetailLoading}
		>
			{#if !selectedExtension}
				<HeaderInput
					placeholder="Search Store for extensions..."
					bind:value={extensionsStore.searchText}
					autofocus
					class="!pl-2.5"
				/>
			{/if}
			{#snippet actions()}
				{#if !selectedExtension}
					<CategoryFilter />
				{/if}
			{/snippet}
		</Header>
	{/snippet}

	{#snippet content()}
		{#if selectedExtension}
			{@const extensionToShow = detailedExtension || selectedExtension}
			<ExtensionDetailView
				extension={extensionToShow}
				{isInstalling}
				onInstall={handleInstall}
				onOpenLightbox={(imageUrl) => (expandedImageUrl = imageUrl)}
			/>
		{:else}
			<div class="grow overflow-y-auto" role="listbox" tabindex={-1}>
				<ExtensionListView
					items={displayedItems}
					onSelect={(ext) => (selectedExtension = ext)}
					onScroll={handleScroll}
					bind:vlistInstance
				/>
			</div>
		{/if}
	{/snippet}

	{#snippet footer()}
		{#if !selectedExtension && selectedListExtension}
			<ActionBar title="Store" icon={storeCommandIcon} {actions} />
		{/if}
	{/snippet}
</MainLayout>

{#if expandedImageUrl}
	<ImageLightbox imageUrl={expandedImageUrl} onClose={() => (expandedImageUrl = null)} />
{/if}

<ExtensionInstallConfirm
	bind:open={showConfirmationDialog}
	violations={confirmationViolations}
	onconfirm={handleForceInstall}
	oncancel={() => (showConfirmationDialog = false)}
/>
