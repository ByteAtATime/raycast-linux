import { z } from 'zod/v4';
import type { UINode } from './types';

export const RaycastIconSchema = z.templateLiteral([z.string(), '-16']);
export const ImageLikeSchema = z.union([
	RaycastIconSchema,
	z.string(),
	z.object({
		source: z.string(),
		mask: z.string().optional()
	})
]);
export type ImageLike = z.infer<typeof ImageLikeSchema>;

export const ActionPropsSchema = z.object({
	title: z.string()
});
export type ActionProps = z.infer<typeof ActionPropsSchema>;

export const ActionPushPropsSchema = z.object({
	title: z.string()
});

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

export const DetailMetadataPropsSchema = z.object({});
export type DetailMetadataProps = z.infer<typeof DetailMetadataPropsSchema>;

const TextWithColorSchema = z.object({
	value: z.string(),
	color: z.string().optional()
});

export const DetailMetadataLabelPropsSchema = z.object({
	title: z.string(),
	text: z.union([z.string(), TextWithColorSchema]).optional(),
	icon: ImageLikeSchema.optional()
});
export type DetailMetadataLabelProps = z.infer<typeof DetailMetadataLabelPropsSchema>;

export const DetailMetadataLinkPropsSchema = z.object({
	title: z.string(),
	text: z.string(),
	target: z.string()
});
export type DetailMetadataLinkProps = z.infer<typeof DetailMetadataLinkPropsSchema>;

export const DetailMetadataTagListItemPropsSchema = z.object({
	text: z.string().optional(),
	color: z.string().optional(),
	icon: ImageLikeSchema.optional()
});
export type DetailMetadataTagListItemProps = z.infer<typeof DetailMetadataTagListItemPropsSchema>;

export const DetailMetadataTagListPropsSchema = z.object({
	title: z.string()
});
export type DetailMetadataTagListProps = z.infer<typeof DetailMetadataTagListPropsSchema>;

export const DetailMetadataSeparatorPropsSchema = z.object({});
export type DetailMetadataSeparatorProps = z.infer<typeof DetailMetadataSeparatorPropsSchema>;

export const DetailPropsSchema = z.object({
	isLoading: z.boolean().default(false),
	markdown: z.string().optional(),
	navigationTitle: z.string().optional()
});
export type DetailProps = z.infer<typeof DetailPropsSchema>;

export const componentSchemas = {
	Action: ActionPropsSchema,
	'Action.Push': ActionPushPropsSchema,
	'Action.Panel': ActionPanelPropsSchema,
	'Action.Panel.Section': ActionPanelSectionPropsSchema,
	'Action.CopyToClipboard': ActionCopyToClipboardPropsSchema,
	'Action.OpenInBrowser': ActionOpenInBrowserPropsSchema,

	List: ListPropsSchema,
	'List.Section': ListSectionPropsSchema,
	'List.Item': ListItemPropsSchema,

	Grid: GridPropsSchema,
	'Grid.Section': GridSectionPropsSchema,
	'Grid.Item': GridItemPropsSchema,

	Detail: DetailPropsSchema,
	'Detail.Metadata': DetailMetadataPropsSchema,
	'Detail.Metadata.Label': DetailMetadataLabelPropsSchema,
	'Detail.Metadata.Link': DetailMetadataLinkPropsSchema,
	'Detail.Metadata.TagList': DetailMetadataTagListPropsSchema,
	'Detail.Metadata.TagList.Item': DetailMetadataTagListItemPropsSchema,
	'Detail.Metadata.Separator': DetailMetadataSeparatorPropsSchema
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
