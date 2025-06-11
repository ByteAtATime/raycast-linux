import { setResults } from '../results.svelte';
import type * as api from '@raycast/api';
import { Toast } from './toast';
import { writeText, writeHtml, writeImage } from '@tauri-apps/plugin-clipboard-manager';

export const mockRaycastApi = {
	updateCommandMetadata: async (metadata: { subtitle?: string | null }) => {
		setResults([{ subtitle: metadata.subtitle }]);
	},
	environment: {
		launchType: 'userInitiated'
	},
	LaunchType: {
		UserInitiated: 'userInitiated',
		Background: 'background'
	},
	Toast: Toast as typeof api.Toast,
	Clipboard: {
		copy: async (
			content: string | number | api.Clipboard.Content,
			options?: api.Clipboard.CopyOptions
		) => {
			if (typeof content === 'string' || typeof content === 'number') {
				await writeText(content.toString());
			} else {
				if ('html' in content) {
					await writeHtml(content.html);
				} else if ('file' in content) {
					await writeImage(content.file);
				} else {
					await writeText(content.text);
				}
			}
		}
	}
} satisfies typeof api;
