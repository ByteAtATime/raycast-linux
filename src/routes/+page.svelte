<script lang="ts">
  import { Command, type Child } from "@tauri-apps/plugin-shell";
  import { SvelteMap } from "svelte/reactivity";
  import { Unpackr } from "msgpackr";

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

  function processSingleCommand(command: any) {
    switch (command.type) {
      case "log":
        console.log("SIDECAR:", command.payload);
        sidecarLogs = [...sidecarLogs, command.payload];
        break;

      case "CREATE_TEXT_INSTANCE":
      case "CREATE_INSTANCE": {
        const { id, type, props } = command.payload;
        uiTree.set(id, { id, type, props, children: [] });
        break;
      }

      case "UPDATE_PROPS": {
        const { id, props } = command.payload;
        const node = uiTree.get(id);
        if (node) {
          const updatedNode = { ...node, props: { ...node.props, ...props } };
          uiTree.set(id, updatedNode);
        }
        break;
      }

      case "APPEND_CHILD": {
        const { parentId, childId } = command.payload;
        if (parentId === "root") {
          rootNodeId = childId;
        } else {
          const parentNode = uiTree.get(parentId);
          if (parentNode) {
            const newChildren = parentNode.children.filter(
              (id) => id !== childId
            );
            newChildren.push(childId);
            uiTree.set(parentId, { ...parentNode, children: newChildren });
          }
        }
        break;
      }

      case "REMOVE_CHILD": {
        const { parentId, childId } = command.payload;
        const parentNode = uiTree.get(parentId);
        if (parentNode) {
          const newChildren = parentNode.children.filter(
            (id) => id !== childId
          );
          uiTree.set(parentId, { ...parentNode, children: newChildren });
        }
        break;
      }
      case "INSERT_BEFORE": {
        const { parentId, childId, beforeId } = command.payload;
        const parentNode = uiTree.get(parentId);
        if (parentNode) {
          const cleanChildren = parentNode.children.filter(
            (id) => id !== childId
          );

          const index = cleanChildren.indexOf(beforeId);

          if (index !== -1) {
            cleanChildren.splice(index, 0, childId);
            uiTree.set(parentId, { ...parentNode, children: cleanChildren });
          } else {
            cleanChildren.push(childId);
            uiTree.set(parentId, { ...parentNode, children: cleanChildren });
          }
        }
        break;
      }
    }
  }

  function handleSidecarMessage(message: any) {
    updateCounter++;

    if (message.type === "BATCH_UPDATE") {
      for (const command of message.payload) {
        processSingleCommand(command);
      }
    } else {
      processSingleCommand(message);
    }
  }

  function dispatchEvent(instanceId: number, handlerName: string, args: any[]) {
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
