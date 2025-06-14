import { z } from 'zod/v4';

export const RaycastColorSchema = z.enum([
	'raycast-blue',
	'raycast-green',
	'raycast-magenta',
	'raycast-orange',
	'raycast-purple',
	'raycast-red',
	'raycast-yellow',
	'raycast-primary-text',
	'raycast-secondary-text'
]);

export const DynamicColorSchema = z.object({
	dark: z.string(),
	light: z.string(),
	adjustContrast: z.boolean().default(false)
});

export const ColorLikeSchema = z.union([DynamicColorSchema, RaycastColorSchema, z.string()]);
export type ColorLike = z.infer<typeof ColorLikeSchema>;

export const colorLikeToColor = (color: ColorLike, isDarkMode: boolean) => {
	const isRaycastColor = (colorLike: ColorLike): colorLike is z.infer<typeof RaycastColorSchema> =>
		RaycastColorSchema.safeParse(colorLike).success;
	const isDynamicColor = (colorLike: ColorLike): colorLike is z.infer<typeof DynamicColorSchema> =>
		DynamicColorSchema.safeParse(colorLike).success;

	if (isRaycastColor(color)) {
		const dynamicColor = raycastToDynamicColor(color);
		return isDarkMode ? dynamicColor.dark : dynamicColor.light;
	}
	if (isDynamicColor(color)) {
		return isDarkMode ? color.dark : color.light;
	}

	return color;
};

export const raycastToDynamicColor = (
	color: z.infer<typeof RaycastColorSchema>
): z.infer<typeof DynamicColorSchema> => {
	const colorMap = {
		'raycast-blue': {
			light: '#0A7FF5',
			dark: '#228CF6'
		},
		'raycast-green': {
			light: '#07BA65',
			dark: '#4EF8A7'
		},
		'raycast-magenta': {
			light: '#F50AA3',
			dark: '#F84EBD'
		},
		'raycast-orange': {
			light: '#F5600A',
			dark: '#F88D4E'
		},
		'raycast-purple': {
			light: '#470AF5',
			dark: '#7B4EF8'
		},
		'raycast-red': {
			light: '#F50A0A',
			dark: '#F84E4E'
		},
		'raycast-yellow': {
			light: '#AD7D00',
			dark: '#FFCC47'
		},
		'raycast-primary-text': {
			light: '#0D0D0D',
			dark: '#F2F2F2'
		},
		'raycast-secondary-text': {
			light: '#646464',
			dark: '#A0A0A0'
		}
	};
	return {
		dark: colorMap[color].dark,
		light: colorMap[color].light,
		adjustContrast: false
	};
};
