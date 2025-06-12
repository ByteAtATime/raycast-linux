export type UINode = {
	id: number;
	type: string;
	props: Record<string, any>;
	children: number[];
	namedChildren?: { [key: string]: number };
};
