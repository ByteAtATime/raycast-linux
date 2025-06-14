import { z } from 'zod/v4';

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
