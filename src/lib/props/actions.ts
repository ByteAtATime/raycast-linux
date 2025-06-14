import { z } from 'zod/v4';

export const ActionPropsSchema = z.object({
	title: z.string()
});
export type ActionProps = z.infer<typeof ActionPropsSchema>;

export const ActionPushPropsSchema = z.object({
	title: z.string()
});

export const ActionCopyToClipboardPropsSchema = z.object({
	content: z.string(),
	title: z.string().default('Copy to Clipboard')
});
export type ActionCopyToClipboardProps = z.infer<typeof ActionCopyToClipboardPropsSchema>;

export const ActionOpenInBrowserPropsSchema = z.object({
	url: z.url(),
	title: z.string().default('Open in Browser')
});
export type ActionOpenInBrowserProps = z.infer<typeof ActionOpenInBrowserPropsSchema>;

export const ActionPanelSectionPropsSchema = z.object({
	title: z.string().optional()
});
export type ActionPanelSectionProps = z.infer<typeof ActionPanelSectionPropsSchema>;

export const ActionPanelPropsSchema = z.object({});
export type ActionPanelProps = z.infer<typeof ActionPanelPropsSchema>;
