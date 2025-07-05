import { render, screen, within } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommandPalette from './CommandPalette.svelte';
import type { PluginInfo } from '@raycast-linux/protocol';
import type { App } from '$lib/apps.svelte';
import type { Quicklink } from '$lib/quicklinks.svelte';
import { tick } from 'svelte';

const mockAppsStore = vi.hoisted(() => ({ apps: [], isLoading: false }));
const mockQuicklinksStore = vi.hoisted(() => ({ quicklinks: [], isLoading: false }));
const mockFrecencyStore = vi.hoisted(() => ({ data: [], hiddenItemIds: [], isLoading: false }));
vi.mock('@tauri-apps/plugin-os', async () => ({ platform: vi.fn().mockReturnValue('linux') }));
vi.mock('@tauri-apps/api/core', async () => ({
	invoke: vi.fn(),
	convertFileSrc: vi.fn((path) => `mock-file-src://${path}`)
}));
vi.mock('$lib/apps.svelte', () => ({ appsStore: mockAppsStore }));
vi.mock('$lib/quicklinks.svelte', () => ({ quicklinksStore: mockQuicklinksStore }));
vi.mock('$lib/frecency.svelte', () => ({ frecencyStore: mockFrecencyStore }));
vi.mock('$lib/focus.svelte', () => ({
	focusManager: { activeScope: 'main-input', requestFocus: vi.fn(), releaseFocus: vi.fn() }
}));

describe('CommandPalette.svelte', () => {
	const onRunPlugin = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockAppsStore.apps = [];
		mockQuicklinksStore.quicklinks = [];
		mockFrecencyStore.data = [];
		mockFrecencyStore.hiddenItemIds = [];
	});

	describe('1. Initial Rendering and Display', () => {
		it('1.1: should render the search input with default placeholder and autofocus', async () => {
			render(CommandPalette, { plugins: [], onRunPlugin });
			const input = screen.getByPlaceholderText('Search for apps and commands...');
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute('autofocus');
		});

		it('1.2: should display a list of plugins', async () => {
			const mockPlugins: PluginInfo[] = [
				{
					pluginPath: '/path/to/plugin1',
					title: 'Mock Plugin 1',
					pluginTitle: 'Mock Extension',
					commandName: 'mock-command-1',
					icon: 'mock-icon-16',
					mode: 'view',
					owner: 'test',
					preferences: [],
					description: 'A mock plugin'
				}
			];
			render(CommandPalette, { plugins: mockPlugins, onRunPlugin });
			await tick();
			const pluginItem = await screen.findByText('Mock Plugin 1');
			expect(pluginItem).toBeInTheDocument();
			const subtitle = await screen.findByText('Mock Extension');
			expect(subtitle).toBeInTheDocument();
			const listItem = pluginItem.closest('button');
			expect(listItem).not.toBeNull();
			const accessory = within(listItem!).getByText('Command');
			expect(accessory).toBeInTheDocument();
		});

		it('1.3: should display a list of installed applications', async () => {
			const mockApps: App[] = [
				{
					name: 'Mock App 1',
					comment: 'A mock application',
					exec: '/usr/bin/mock-app-1',
					icon_path: '/path/to/icon.png'
				}
			];
			mockAppsStore.apps = mockApps;
			render(CommandPalette, { plugins: [], onRunPlugin });
			await tick();
			const appItem = await screen.findByText('Mock App 1');
			expect(appItem).toBeInTheDocument();
			const subtitle = await screen.findByText('A mock application');
			expect(subtitle).toBeInTheDocument();
			const listItem = appItem.closest('button');
			expect(listItem).not.toBeNull();
			const icon = within(listItem!).getByRole('img');
			expect(icon).toHaveAttribute('src', 'mock-file-src:///path/to/icon.png');
			const accessory = within(listItem!).getByText('Application');
			expect(accessory).toBeInTheDocument();
		});

		it('1.4: should display a list of quicklinks', async () => {
			const mockQuicklinks: Quicklink[] = [
				{
					id: 1,
					name: 'Search Google',
					link: 'https://google.com/search?q={argument}',
					application: null,
					icon: null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString()
				}
			];
			mockQuicklinksStore.quicklinks = mockQuicklinks;

			render(CommandPalette, {
				plugins: [],
				onRunPlugin
			});

			await tick();

			const listItem = await screen.findByRole('button', { name: /Search Google/i });
			expect(listItem).toBeInTheDocument();

			const quicklinkItem = within(listItem).getByText('Search Google');
			expect(quicklinkItem).toBeInTheDocument();

			const subtitle = within(listItem).getByText('https://google.com/search?q=...');
			expect(subtitle).toBeInTheDocument();

			const accessory = within(listItem).getByText('Quicklink');
			expect(accessory).toBeInTheDocument();
		});
	});
});
