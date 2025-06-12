import { z } from 'zod/v4';
import type { UINode } from './types';

export const ActionCopyToClipboardPropsSchema = z.object({
	content: z.string(),
	title: z.string().optional()
});
export type ActionCopyToClipboardProps = z.infer<typeof ActionCopyToClipboardPropsSchema>;

export const ActionOpenInBrowserPropsSchema = z.object({
	url: z.url(),
	title: z.string().optional()
});
export type ActionOpenInBrowserProps = z.infer<typeof ActionOpenInBrowserPropsSchema>;

export const ActionPanelSectionPropsSchema = z.object({
	title: z.string().optional()
});
export type ActionPanelSectionProps = z.infer<typeof ActionPanelSectionPropsSchema>;

export const ActionPanelPropsSchema = z.object({});
export type ActionPanelProps = z.infer<typeof ActionPanelPropsSchema>;

export const ListPropsSchema = z.object({});
export type ListProps = z.infer<typeof ListPropsSchema>;

export const ListSectionPropsSchema = z.object({
	title: z.string().optional()
});
export type ListSectionProps = z.infer<typeof ListSectionPropsSchema>;

const ListItemAccessorySchema = z.object({
	text: z.string()
});

export const ListItemPropsSchema = z.object({
	icon: z.string().optional(),
	title: z.string(),
	accessories: z.array(ListItemAccessorySchema).optional()
});
export type ListItemProps = z.infer<typeof ListItemPropsSchema>;

export const GridPropsSchema = z.object({
	throttle: z.boolean().default(false),
	columns: z.number().default(6), // TODO: is this the default?
	searchBarPlaceholder: z.string().optional(),
	searchBarAccessory: z.any().optional()
});
export type GridProps = z.infer<typeof GridPropsSchema>;

export const GridSectionPropsSchema = z.object({
	title: z.string().optional()
});
export type GridSectionProps = z.infer<typeof GridSectionPropsSchema>;

export const GridItemPropsSchema = z.object({
	content: z.string(),
	title: z.string().optional(),
	subtitle: z.string().optional(),
	keywords: z.array(z.string())
});
export type GridItemProps = z.infer<typeof GridItemPropsSchema>;

export const componentSchemas = {
	ActionPanel: ActionPanelPropsSchema,
	ActionPanelSection: ActionPanelSectionPropsSchema,
	'Action.CopyToClipboard': ActionCopyToClipboardPropsSchema,
	'Action.OpenInBrowser': ActionOpenInBrowserPropsSchema,
	List: ListPropsSchema,
	ListSection: ListSectionPropsSchema,
	ListItem: ListItemPropsSchema,
	Grid: GridPropsSchema,
	GridSection: GridSectionPropsSchema,
	GridItem: GridItemPropsSchema
};

export type Schemas = typeof componentSchemas;
export type ComponentType = keyof Schemas;

export function getTypedProps<T extends ComponentType>(
	node: UINode & { type: T }
): z.infer<Schemas[T]> | null {
	const schema = componentSchemas[node.type];
	const result = schema.safeParse(node.props);
	if (!result.success) {
		console.error(
			`[Props Validation Error] For node ${node.id} (type: ${node.type}):`,
			z.prettifyError(result.error)
		);
		return null;
	}
	return result.data as z.infer<Schemas[T]>;
}
