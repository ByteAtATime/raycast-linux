<script lang="ts">
	import { Command, type Child } from '@tauri-apps/plugin-shell';
	import { SvelteMap } from 'svelte/reactivity';
	import { Unpackr } from 'msgpackr';
	import NodeRenderer from '$lib/components/NodeRenderer.svelte';
	import type { UINode } from '$lib/types';
	import List from '$lib/components/nodes/List.svelte';
	import Grid from '$lib/components/nodes/Grid.svelte';

	let uiTree: SvelteMap<number, UINode> = $state(new SvelteMap());
	let rootNodeId: number | null = $state(null);
	let sidecarLogs: string[] = $state([]);
	let sidecarChild: Child | null = $state(null);
	let updateCounter = $state(0);
	const unpackr = new Unpackr();

	$effect(() => {
		let receiveBuffer = Buffer.alloc(0);

		function processReceiveBuffer() {
			while (receiveBuffer.length >= 4) {
				const messageLength = receiveBuffer.readUInt32BE(0);
				const totalLength = 4 + messageLength;

				if (receiveBuffer.length >= totalLength) {
					const messagePayload = receiveBuffer.subarray(4, totalLength);
					receiveBuffer = receiveBuffer.subarray(totalLength);

					try {
						const message = unpackr.unpack(messagePayload);
						handleSidecarMessage(message);
					} catch (e) {
						console.error('Failed to unpack sidecar message:', e);
					}
				} else {
					break;
				}
			}
		}

		async function connectAndRun() {
			const command = Command.sidecar('binaries/app', undefined, {
				encoding: 'raw'
			});
			command.stdout.on('data', (chunk) => {
				try {
					receiveBuffer = Buffer.concat([receiveBuffer, Buffer.from(chunk)]);
					processReceiveBuffer();
				} catch (e) {
					console.error('Failed to parse sidecar message:', chunk, e);
				}
			});
			command.stderr.on('data', (line) => {
				sidecarLogs = [...sidecarLogs, `STDERR: ${line}`];
			});
			sidecarChild = await command.spawn();
			sidecarLogs = [...sidecarLogs, `Sidecar spawned with PID: ${sidecarChild.pid}`];
			if (sidecarChild) {
				sidecarChild.write(JSON.stringify({ action: 'run-plugin' }) + '\n');
			}
		}
		connectAndRun();
		return () => {
			console.log('Component unmounting, killing sidecar...');
			sidecarChild?.kill();
		};
	});

	function sendToSidecar(message: object) {
		if (sidecarChild) {
			sidecarChild.write(JSON.stringify(message) + '\n');
		}
	}

	function processSingleCommand(
		command: any,
		tempTree: Map<number, UINode>,
		tempState: { rootNodeId: number | null },
		getMutableNode: (id: number) => UINode | undefined
	) {
		switch (command.type) {
			case 'REPLACE_CHILDREN': {
				const { parentId, childrenIds } = command.payload;
				const parentNode = getMutableNode(parentId);
				if (parentNode) {
					parentNode.children = childrenIds;
				}
				break;
			}
			case 'log':
				console.log('SIDECAR:', command.payload);
				sidecarLogs = [...sidecarLogs, command.payload];
				break;
			case 'CREATE_TEXT_INSTANCE': {
				const { id, type, props } = command.payload;
				tempTree.set(id, { id, type, props, children: [] });
				break;
			}
			case 'CREATE_INSTANCE': {
				const { id, type, props, children, namedChildren } = command.payload;
				// Use the new properties from the payload
				tempTree.set(id, {
					id,
					type,
					props,
					children: children ?? [],
					namedChildren: namedChildren ?? {}
				});
				break;
			}
			case 'UPDATE_PROPS': {
				const { id, props, namedChildren } = command.payload;
				const node = getMutableNode(id);
				if (node) {
					Object.assign(node.props, props);
					// Update namedChildren if it was sent
					if (namedChildren) {
						node.namedChildren = namedChildren;
					}
				}
				break;
			}
			case 'APPEND_CHILD': {
				const { parentId, childId } = command.payload;
				if (parentId === 'root') {
					tempState.rootNodeId = childId;
				} else {
					const parentNode = getMutableNode(parentId);
					if (parentNode) {
						const existingIdx = parentNode.children.indexOf(childId);
						if (existingIdx > -1) parentNode.children.splice(existingIdx, 1);
						parentNode.children.push(childId);
					}
				}
				break;
			}
			case 'REMOVE_CHILD': {
				const { parentId, childId } = command.payload;
				const parentNode = getMutableNode(parentId);
				if (parentNode) {
					const index = parentNode.children.indexOf(childId);
					if (index > -1) parentNode.children.splice(index, 1);
				}
				break;
			}
			case 'INSERT_BEFORE': {
				const { parentId, childId, beforeId } = command.payload;
				const parentNode = getMutableNode(parentId);
				if (parentNode) {
					const oldIndex = parentNode.children.indexOf(childId);
					if (oldIndex > -1) parentNode.children.splice(oldIndex, 1);
					const insertIndex = parentNode.children.indexOf(beforeId);
					if (insertIndex > -1) {
						parentNode.children.splice(insertIndex, 0, childId);
					} else {
						parentNode.children.push(childId);
					}
				}
				break;
			}
		}
	}

	function handleSidecarMessage(message: any) {
		const commands = message.type === 'BATCH_UPDATE' ? message.payload : [message];
		if (commands.length === 0) {
			updateCounter++;
			return;
		}
		const tempTree = new Map(uiTree);
		const tempState = { rootNodeId: rootNodeId };
		const mutatedIds = new Set<number>();
		const getMutableNode = (id: number): UINode | undefined => {
			if (!mutatedIds.has(id)) {
				const originalNode = tempTree.get(id);
				if (!originalNode) return undefined;
				const clonedNode = {
					...originalNode,
					props: { ...originalNode.props },
					children: [...originalNode.children]
				};
				tempTree.set(id, clonedNode);
				mutatedIds.add(id);
				return clonedNode;
			}
			return tempTree.get(id);
		};

		for (const command of commands) {
			processSingleCommand(command, tempTree, tempState, getMutableNode);
		}

		uiTree = new SvelteMap(tempTree);
		rootNodeId = tempState.rootNodeId;

		updateCounter++;
	}

	function dispatchEvent(instanceId: number, handlerName: string, args: any[]) {
		console.log(`[EVENT] Dispatching '${handlerName}' to instance ${instanceId}`);
		sendToSidecar({
			action: 'dispatch-event',
			payload: { instanceId, handlerName, args }
		});
	}

	let selectedNodeId = $state<number | undefined>(undefined);
	const selectedItemNode = $derived(uiTree.get(selectedNodeId!));
	const actionsNodeId = $derived(selectedItemNode?.namedChildren?.['actions']);

	const rootNode = $derived(uiTree.get(rootNodeId!));
</script>

<main class="flex h-screen flex-col">
	<div class="grow overflow-y-auto">
		{#if rootNode?.type === 'List'}
			<List
				nodeId={rootNodeId!}
				{uiTree}
				onDispatch={dispatchEvent}
				onSelect={(nodeId) => (selectedNodeId = nodeId)}
			/>
		{:else if rootNode?.type === 'Grid'}
			<Grid
				nodeId={rootNodeId!}
				{uiTree}
				onDispatch={dispatchEvent}
				onSelect={(nodeId) => (selectedNodeId = nodeId)}
			/>
		{:else if rootNode}
			<NodeRenderer nodeId={rootNodeId!} {uiTree} onDispatch={dispatchEvent} />
		{/if}
	</div>

	<aside class="bg-muted flex h-12 items-center justify-between border-l px-4">
		<span>Search Emoji</span>

		{#if actionsNodeId}
			<NodeRenderer nodeId={actionsNodeId} {uiTree} onDispatch={dispatchEvent} />
		{/if}
	</aside>
</main>
