import { Command, type Child } from '@tauri-apps/plugin-shell';
import { Unpackr } from 'msgpackr';
import { uiStore } from '$lib/ui.svelte';

class SidecarService {
	#sidecarChild: Child | null = $state(null);
	#receiveBuffer = Buffer.alloc(0);
	#unpackr = new Unpackr();

	logs: string[] = $state([]);

	constructor() {}

	get isRunning() {
		return this.#sidecarChild !== null;
	}

	start = async () => {
		if (this.#sidecarChild) {
			this.#log('Sidecar service is already running.');
			return;
		}

		this.#log('Starting sidecar service...');
		try {
			const command = Command.sidecar('binaries/app', undefined, {
				encoding: 'raw'
			});

			command.stdout.on('data', this.#handleStdout);
			command.stderr.on('data', (line) => this.#log(`STDERR: ${line}`));

			this.#sidecarChild = await command.spawn();
			this.#log(`Sidecar spawned with PID: ${this.#sidecarChild.pid}`);

			this.dispatchEvent('run-plugin');
		} catch (e) {
			this.#log(`ERROR starting sidecar: ${e}`);
			console.error('Failed to start sidecar:', e);
		}
	};

	stop = () => {
		if (this.#sidecarChild) {
			this.#log('Stopping sidecar service...');
			this.#sidecarChild.kill();
			this.#sidecarChild = null;
		}
	};

	dispatchEvent = (action: string, payload?: object) => {
		if (!this.#sidecarChild) {
			this.#log('Cannot dispatch event, sidecar is not running.');
			return;
		}
		const message = JSON.stringify({ action, payload });
		this.#sidecarChild.write(message + '\n');
	};

	#handleStdout = (chunk: Uint8Array) => {
		try {
			this.#receiveBuffer = Buffer.concat([this.#receiveBuffer, Buffer.from(chunk)]);
			this.#processReceiveBuffer();
		} catch (e) {
			this.#log(`ERROR processing stdout: ${e}`);
			console.error('Failed to parse sidecar message:', chunk, e);
		}
	};

	#processReceiveBuffer = () => {
		while (this.#receiveBuffer.length >= 4) {
			const messageLength = this.#receiveBuffer.readUInt32BE(0);
			const totalLength = 4 + messageLength;

			if (this.#receiveBuffer.length >= totalLength) {
				const messagePayload = this.#receiveBuffer.subarray(4, totalLength);
				this.#receiveBuffer = this.#receiveBuffer.subarray(totalLength);

				try {
					const message = this.#unpackr.unpack(messagePayload);
					this.#routeMessage(message);
				} catch (e) {
					console.error('Failed to unpack sidecar message:', e);
					this.#log(`ERROR unpacking message: ${e}`);
				}
			} else {
				break;
			}
		}
	};

	#routeMessage = (message: any) => {
		if (message.type === 'log') {
			this.#log(`SIDECAR: ${message.payload}`);
			return;
		}

		const commands = message.type === 'BATCH_UPDATE' ? message.payload : [message];
		if (commands.length > 0) {
			uiStore.applyCommands(commands);
		}
	};

	#log = (message: string) => {
		console.log(`[SidecarService] ${message}`);
		this.logs.push(message);
	};
}

export const sidecarService = new SidecarService();
