<script lang="ts">
  import { Command, type Child } from "@tauri-apps/plugin-shell";
  import { SvelteMap } from "svelte/reactivity";
  import { Unpackr } from "msgpackr";

  const activeTimers = new Map<string, number>();
  const logTimer = {
    start: (name: string) => {
      if (activeTimers.has(name)) {
        console.warn(
          `[PERF] Timer '${name}' started again without being ended.`
        );
      }
      activeTimers.set(name, Date.now());
    },
    end: (name: string, context: string = "") => {
      const startTime = activeTimers.get(name);
      if (startTime) {
        const duration = Date.now() - startTime;
        const contextString = context ? ` (${context})` : "";
        console.log(
          `%c[PERF]%c ${name}${contextString} took %c${duration}ms`,
          "color: #9575CD; font-weight: bold;",
          "color: inherit;",
          "color: #4FC3F7; font-weight: bold;"
        );
        activeTimers.delete(name);
      } else {
        console.warn(`[PERF] Timer '${name}' was ended but never started.`);
      }
    },
  };

  interface UINode {
    id: number;
    type: string;
    props: Record<string, any>;
    children: number[];
  }

  let uiTree: SvelteMap<number, UINode> = $state(new SvelteMap());
  let rootNodeId: number | null = $state(null);
  let sidecarLogs: string[] = $state([]);
  let sidecarChild: Child | null = null;
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
            logTimer.start(`handleMessage:${updateCounter}`);
            const message = unpackr.unpack(messagePayload);
            handleSidecarMessage(message);
          } catch (e) {
            console.error("Failed to unpack sidecar message:", e);
          }
        } else {
          break;
        }
      }
    }

    async function connectAndRun() {
      logTimer.start("connectAndRun");
      const command = Command.sidecar("binaries/app", undefined, {
        encoding: "raw",
      });
      command.stdout.on("data", (chunk) => {
        try {
          receiveBuffer = Buffer.concat([receiveBuffer, Buffer.from(chunk)]);
          processReceiveBuffer();
        } catch (e) {
          console.error("Failed to parse sidecar message:", chunk, e);
        }
      });
      command.stderr.on("data", (line) => {
        sidecarLogs = [...sidecarLogs, `STDERR: ${line}`];
      });
      sidecarChild = await command.spawn();
      sidecarLogs = [
        ...sidecarLogs,
        `Sidecar spawned with PID: ${sidecarChild.pid}`,
      ];
      if (sidecarChild) {
        sidecarChild.write(JSON.stringify({ action: "run-plugin" }) + "\n");
      }
      logTimer.end("connectAndRun");
    }
    connectAndRun();
    return () => {
      console.log("Component unmounting, killing sidecar...");
      sidecarChild?.kill();
    };
  });

  function sendToSidecar(message: object) {
    if (sidecarChild) {
      sidecarChild.write(JSON.stringify(message) + "\n");
    }
  }

  function processSingleCommand(
    command: any,
    tempTree: Map<number, UINode>,
    tempState: { rootNodeId: number | null },
    getMutableNode: (id: number) => UINode | undefined
  ) {
    switch (command.type) {
      case "REPLACE_CHILDREN": {
        const { parentId, childrenIds } = command.payload;
        const parentNode = getMutableNode(parentId);
        if (parentNode) {
          parentNode.children = childrenIds;
        }
        break;
      }
      case "log":
        console.log("SIDECAR:", command.payload);
        sidecarLogs = [...sidecarLogs, command.payload];
        break;
      case "CREATE_TEXT_INSTANCE":
      case "CREATE_INSTANCE": {
        const { id, type, props } = command.payload;
        tempTree.set(id, { id, type, props, children: [] });
        break;
      }
      case "UPDATE_PROPS": {
        const { id, props } = command.payload;
        const node = getMutableNode(id);
        if (node) {
          Object.assign(node.props, props);
        }
        break;
      }
      case "APPEND_CHILD": {
        const { parentId, childId } = command.payload;
        if (parentId === "root") {
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
      case "REMOVE_CHILD": {
        const { parentId, childId } = command.payload;
        const parentNode = getMutableNode(parentId);
        if (parentNode) {
          const index = parentNode.children.indexOf(childId);
          if (index > -1) parentNode.children.splice(index, 1);
        }
        break;
      }
      case "INSERT_BEFORE": {
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
    const commands =
      message.type === "BATCH_UPDATE" ? message.payload : [message];
    if (commands.length === 0) {
      logTimer.end(`handleMessage:${updateCounter}`, `Processed 0 commands`);
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
          children: [...originalNode.children],
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

    logTimer.end(
      `handleMessage:${updateCounter}`,
      `Processed ${commands.length} commands`
    );
    updateCounter++;
  }

  function dispatchEvent(instanceId: number, handlerName: string, args: any[]) {
    console.log(
      `[EVENT] Dispatching '${handlerName}' to instance ${instanceId}`
    );
    sendToSidecar({
      action: "dispatch-event",
      payload: { instanceId, handlerName, args },
    });
  }
</script>

<main class="flex flex-grow flex-col">
  {#if rootNodeId}
    {@const rootNode = uiTree.get(rootNodeId)}
    {#if rootNode?.type === "List"}
      <div class="flex h-full flex-col">
        <input
          type="text"
          class="w-full border-b border-gray-300 px-4 py-3 text-lg focus:border-blue-500 focus:outline-none"
          placeholder="Search Emojis..."
          oninput={(e) =>
            dispatchEvent(rootNode.id, "onSearchTextChange", [
              e.currentTarget.value,
            ])}
        />
        <div class="flex-grow overflow-y-auto">
          {#each rootNode.children as childId (childId)}
            {@const childNode = uiTree.get(childId)}
            {#if childNode?.type === "ListSection"}
              <div>
                <h3
                  class="px-4 pb-1 pt-2.5 text-xs font-semibold uppercase text-gray-500"
                >
                  {childNode.props.title}
                </h3>
                {#each childNode.children as itemId (itemId)}
                  {@const itemNode = uiTree.get(itemId)}
                  {#if itemNode?.type === "ListItem"}
                    <div class="flex items-center gap-3 px-4 py-2">
                      <span class="text-lg">{itemNode.props.icon}</span>
                      <span>{itemNode.props.title}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</main>
