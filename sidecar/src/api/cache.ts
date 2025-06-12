import type * as api from '@raycast/api';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

type IndexEntry = {
	filePath: string;
	size: number;
	lastAccessed: number;
};

type PersistedIndex = [string, IndexEntry][];

export class Cache {
	private readonly options: Required<api.Cache.Options>;
	private readonly cachePath: string;
	private readonly indexPath: string;

	private index: Map<string, IndexEntry> = new Map();
	private subscribers: Set<api.Cache.Subscriber> = new Set();
	private totalSize: number = 0;

	constructor(options: api.Cache.Options = {}) {
		const cacheRoot = '/home/byte/code/raycast-linux/sidecar/dist/plugin/cache/'; // TODO: replace
		fs.mkdirSync(cacheRoot, { recursive: true });
		this.options = {
			capacity: 10 * 1024 * 1024,
			namespace: 'default',
			directory: cacheRoot,
			...options
		};

		this.cachePath = path.join(cacheRoot, this.options.namespace);
		this.indexPath = path.join(this.cachePath, 'index.json');

		this._initialize();
	}

	public get isEmpty(): boolean {
		return this.index.size === 0;
	}

	public get(key: string): string | undefined {
		const entry = this.index.get(key);
		if (!entry) {
			return undefined;
		}

		try {
			const data = fs.readFileSync(entry.filePath, 'utf-8');

			entry.lastAccessed = Date.now();
			this.index.set(key, entry);
			this._saveIndex();

			return data;
		} catch (error) {
			console.error(`Failed to read cache file for key "${key}", removing from index:`, error);
			this.remove(key);
			return undefined;
		}
	}

	public has(key: string): boolean {
		return this.index.has(key);
	}

	public set(key: string, data: string): void {
		const filename = this._keyToFilename(key);
		const filePath = path.join(this.cachePath, filename);

		try {
			fs.writeFileSync(filePath, data, 'utf-8');
		} catch (error) {
			console.error(`Failed to write cache file for key "${key}":`, error);
			throw new Error(`Cache#set failed to write to disk for key "${key}"`);
		}

		const previousEntry = this.index.get(key);
		const previousSize = previousEntry ? previousEntry.size : 0;

		const newSize = Buffer.byteLength(data, 'utf8');

		const newEntry: IndexEntry = {
			filePath: filePath,
			size: newSize,
			lastAccessed: Date.now()
		};

		this.index.set(key, newEntry);
		this.totalSize = this.totalSize - previousSize + newSize;

		this._enforceCapacity();
		this._saveIndex();
		this._notifySubscribers(key, data);
	}

	public remove(key: string): boolean {
		const entry = this.index.get(key);
		if (!entry) {
			return false;
		}

		try {
			if (fs.existsSync(entry.filePath)) {
				fs.unlinkSync(entry.filePath);
			}
		} catch (error) {
			console.error(`Failed to delete cache file for key "${key}":`, error);
		}

		this.index.delete(key);
		this.totalSize -= entry.size;

		this._saveIndex();
		this._notifySubscribers(key, undefined);

		return true;
	}

	public clear(options: { notifySubscribers?: boolean } = { notifySubscribers: true }): void {
		const filePaths = Array.from(this.index.values()).map((entry) => entry.filePath);

		for (const filePath of filePaths) {
			try {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			} catch (error) {
				console.error(`Failed to delete cache file during clear: ${filePath}`, error);
			}
		}

		this.index.clear();
		this.totalSize = 0;

		this._saveIndex();

		if (options.notifySubscribers) {
			this._notifySubscribers(undefined, undefined);
		}
	}

	public subscribe(subscriber: api.Cache.Subscriber): api.Cache.Subscription {
		this.subscribers.add(subscriber);

		return () => {
			this.subscribers.delete(subscriber);
		};
	}

	private _initialize(): void {
		try {
			fs.mkdirSync(this.cachePath, { recursive: true });
			this._loadIndex();
		} catch (error) {
			console.error('Failed to initialize cache directory. Cache will be non-operational.', error);
		}
	}

	private _loadIndex(): void {
		try {
			if (fs.existsSync(this.indexPath)) {
				const rawData = fs.readFileSync(this.indexPath, 'utf-8');
				const persistedIndex: PersistedIndex = JSON.parse(rawData);
				this.index = new Map(persistedIndex);
				this.totalSize = 0;
				for (const entry of this.index.values()) {
					this.totalSize += entry.size;
				}
			}
		} catch (error) {
			console.error('Failed to load or parse cache index. Starting with a fresh cache.', error);
			this.index.clear();
			this.totalSize = 0;
		}
	}

	private _saveIndex(): void {
		try {
			const persistedIndex: PersistedIndex = Array.from(this.index.entries());
			const data = JSON.stringify(persistedIndex);
			const tempIndexPath = this.indexPath + '.tmp';
			fs.writeFileSync(tempIndexPath, data, 'utf-8');
			fs.renameSync(tempIndexPath, this.indexPath);
		} catch (error) {
			console.error('Failed to save cache index:', error);
		}
	}

	private _keyToFilename(key: string): string {
		return crypto.createHash('sha256').update(key).digest('hex');
	}

	private _enforceCapacity(): void {
		if (this.totalSize <= this.options.capacity) {
			return;
		}

		const sortedEntries = Array.from(this.index.entries()).sort(
			(a, b) => a[1].lastAccessed - b[1].lastAccessed
		);

		for (const [key, entry] of sortedEntries) {
			if (this.totalSize <= this.options.capacity) {
				break;
			}

			try {
				if (fs.existsSync(entry.filePath)) {
					fs.unlinkSync(entry.filePath);
				}
			} catch (error) {
				console.error(`Failed to delete cache file on eviction for key "${key}":`, error);
			}

			this.index.delete(key);
			this.totalSize -= entry.size;
		}
	}

	private _notifySubscribers(key: string | undefined, data: string | undefined): void {
		for (const subscriber of this.subscribers) {
			try {
				subscriber(key, data);
			} catch (error) {
				console.error('Cache subscriber threw an error:', error);
			}
		}
	}
}
