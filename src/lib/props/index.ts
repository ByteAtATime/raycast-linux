import { z } from 'zod/v4';
import type { UINode } from '../types';
import {
	ActionPropsSchema,
	ActionPushPropsSchema,
	ActionPanelPropsSchema,
	ActionPanelSectionPropsSchema,
	ActionCopyToClipboardPropsSchema,
	ActionOpenInBrowserPropsSchema
} from './actions';
import {
	DetailPropsSchema,
	DetailMetadataLabelPropsSchema,
	DetailMetadataLinkPropsSchema,
	DetailMetadataTagListPropsSchema,
	DetailMetadataTagListItemPropsSchema,
	DetailMetadataSeparatorPropsSchema
} from './detail';
import {
	GridPropsSchema,
	GridSectionPropsSchema,
	GridItemPropsSchema,
	GridDropdownPropsSchema,
	GridDropdownSectionPropsSchema,
	GridDropdownItemPropsSchema,
	DetailMetadataPropsSchema
} from './grid';
import { ListPropsSchema, ListSectionPropsSchema, ListItemPropsSchema } from './list';

export * from './actions';
export * from './detail';
export * from './grid';
export * from './list';
export * from './image';
export * from './color';

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
	'Grid.Dropdown': GridDropdownPropsSchema,
	'Grid.Dropdown.Section': GridDropdownSectionPropsSchema,
	'Grid.Dropdown.Item': GridDropdownItemPropsSchema,

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
