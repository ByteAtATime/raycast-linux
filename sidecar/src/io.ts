import { Packr } from "msgpackr";

const packr = new Packr();

export const writeOutput = (data: object): void => {
  try {
    const payload = packr.pack(data);
    const header = Buffer.alloc(4);
    header.writeUInt32BE(payload.length);

    process.stdout.write(header);
    process.stdout.write(payload);
  } catch (e: unknown) {
    const errorString = e instanceof Error ? e.toString() : String(e);
    const errorPayload = packr.pack({ type: "log", payload: errorString });
    const errorHeader = Buffer.alloc(4);
    errorHeader.writeUInt32BE(errorPayload.length);
    process.stdout.write(errorHeader);
    process.stdout.write(errorPayload);
  }
};

export const writeLog = (message: unknown): void => {
  writeOutput({ type: "log", payload: message });
};
