export type UINode = {
	id: number;
	type: string;
	props: Record<string, unknown>;
	children: number[];
	namedChildren?: { [key: string]: number };
};
