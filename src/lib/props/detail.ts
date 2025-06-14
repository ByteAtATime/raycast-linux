import { z } from 'zod/v4';
import { ImageLikeSchema } from './image';

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
