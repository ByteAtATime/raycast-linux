import { z } from 'zod/v4';
import { ImageLikeSchema } from './image';

export const GridPropsSchema = z.object({
	filtering: z.boolean().default(true),
	throttle: z.boolean().default(false),
	columns: z.number().default(6), // TODO: is this the default?
	searchBarPlaceholder: z.string().optional()
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

export const GridDropdownItemPropsSchema = z.object({
	title: z.string(),
	value: z.string(),
	icon: ImageLikeSchema.optional(),
	keywords: z.array(z.string()).optional()
});
export type GridDropdownItemProps = z.infer<typeof GridDropdownItemPropsSchema>;

export const GridDropdownSectionPropsSchema = z.object({
	title: z.string().optional()
});
export type GridDropdownSectionProps = z.infer<typeof GridDropdownSectionPropsSchema>;

export const GridDropdownPropsSchema = z.object({
	tooltip: z.string(),
	defaultValue: z.string().optional(),
	filtering: z.union([z.boolean(), z.object({ keepSectionOrder: z.boolean() })]).optional(),
	id: z.string().optional(),
	isLoading: z.boolean().optional(),
	placeholder: z.string().optional(),
	storeValue: z.boolean().optional(),
	throttle: z.boolean().optional(),
	value: z.string().optional()
});
export type GridDropdownProps = z.infer<typeof GridDropdownPropsSchema>;

export const DetailMetadataPropsSchema = z.object({});
export type DetailMetadataProps = z.infer<typeof DetailMetadataPropsSchema>;
