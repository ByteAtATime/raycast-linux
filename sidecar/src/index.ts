import { createInterface } from "readline";
import { writeLog, writeOutput } from "./io";
import { runPlugin } from "./plugin";
import { instances } from "./state";
import { batchedUpdates } from "./reconciler";

process.on("unhandledRejection", (reason: unknown) => {
  writeLog(`--- UNHANDLED PROMISE REJECTION ---`);
  const stack =
    reason && typeof reason === "object" && "stack" in reason
      ? reason.stack
      : reason;
  writeLog(stack);
});

const rl = createInterface({ input: process.stdin });

rl.on("line", (line) => {
  batchedUpdates(() => {
    try {
      const command: { action: string; payload: unknown } = JSON.parse(line);

      switch (command.action) {
        case "run-plugin":
          runPlugin();
          break;
        case "dispatch-event": {
          const { instanceId, handlerName, args } = command.payload as {
            instanceId: number;
            handlerName: string;
            args: unknown[];
          };

          const instance = instances.get(instanceId);
          if (!instance) {
            writeLog(`Instance ${instanceId} not found.`);
            return;
          }

          const handler = instance._internalFiber?.memoizedProps?.[handlerName];

          if (typeof handler === "function") {
            handler(...args);
          } else {
            writeLog(
              `Handler ${handlerName} not found on instance ${instanceId}`
            );
          }
          break;
        }
        default:
          writeLog(`Unknown command action: ${command.action}`);
      }
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? { message: err.message, stack: err.stack }
          : { message: String(err) };
      writeLog(`ERROR: ${error.message} \n ${error.stack ?? ""}`);
      writeOutput({ type: "error", payload: error.message });
    }
  });
});

writeLog("Node.js Sidecar started successfully with React Reconciler.");
